import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as autogen from "./autogen";
import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YAML = require("yaml");

process.chdir(`${__dirname}/../test/01-kubernetes`);

const tmpDir = fs.mkdtempSync("docker-deploy-");

/**
 * Main entrypoint for the action.
 */
async function run(): Promise<void> {
    const inputs = autogen.getInputParameters();

    await deploy(inputs);
}

async function deploy(inputs: autogen.InputParameters): Promise<void> {
    if (inputs.digitalocean_token) {
        return deployToDigitalocean(inputs);
    } else {
        core.setFailed("Could not determine target for deployment.");
    }
}

const digitaloceanEndpoint = "https://api.digitalocean.com/v2";

async function deployToDigitalocean(
    inputs: autogen.InputParameters,
): Promise<void> {
    await validateDigitaloceanCredentials(inputs);

    if (inputs.digitalocean_cluster) {
        await validateDigitaloceanCluster(inputs);
        await createKubernetesDeployment(inputs);
    }
}

async function validateDigitaloceanCredentials(
    inputs: autogen.InputParameters,
): Promise<void> {
    core.startGroup("Login to digitalocean");

    const response = await digitalocean(inputs, "/account");
    if (response.id === "unauthorized") {
        core.setFailed("Invalid digitalocean_token.");
        process.exit();
    }

    console.log("USER", response.account.email);

    core.endGroup();
}

async function validateDigitaloceanCluster(
    inputs: autogen.InputParameters,
): Promise<void> {
    core.startGroup("Login to kubernetes cluster");

    const response = await digitalocean(inputs, "/kubernetes/clusters");

    const cluster = response.kubernetes_clusters.find(
        (cluster: any) => cluster.name === inputs.digitalocean_cluster,
    );

    if (!cluster) {
        core.setFailed(
            "Kubernetes cluster not found: " + inputs.digitalocean_cluster,
        );
    }

    const kubeconfig = await digitalocean(
        inputs,
        `/kubernetes/clusters/${cluster.id}/kubeconfig`,
        "text",
    );

    fs.writeFileSync(`${tmpDir}/kubeconfig`, kubeconfig);
    console.log("LOADED kubeconfig");

    core.endGroup();
}

async function createKubernetesDeployment(
    inputs: autogen.InputParameters,
): Promise<void> {
    core.startGroup("Deployment Information");

    const image = inputs.image;
    const port = inputs.port;
    const app = inputs.app || getAppFromImage(inputs.image);
    const release = inputs.release || getReleaseFromImage(inputs.image);
    const host = resolveHost(inputs.host, app, release);

    console.log(
        YAML.stringify({ app, release, host, image, port }).slice(0, -1),
    );
    core.endGroup();

    const env = Object.assign({}, process.env as any, {
        KUBECONFIG: `${tmpDir}/kubeconfig`,
    });

    core.startGroup("Deploy");
    await exec.exec(
        "helm",
        [
            "upgrade",
            "--atomic",
            "--cleanup-on-fail",
            "--timeout",
            "30s",
            "--install",
            "--set",
            `nameOverride=${app}`,
            "--set",
            `host=${host}`,
            "--set",
            `image=${image}`,
            "--set",
            `port=${port}`,
            "--set",
            `app=${app}`,
            app + "-" + release,
            `${__dirname}/../k8s/helm`,
        ],
        {
            env,
        },
    );
    core.endGroup();
}

async function digitalocean(
    inputs: autogen.InputParameters,
    query: string,
    format = "json",
): Promise<any> {
    const response = await fetch(digitaloceanEndpoint + query, {
        headers: {
            Authorization: `Bearer ${inputs.digitalocean_token}`,
        },
    });

    if (format === "json") {
        return response.json();
    } else {
        return response.text();
    }
}

function getAppFromImage(image: string): string {
    return image
        .split("/")
        .slice(-1)[0]
        .split(":")[0];
}

function getReleaseFromImage(image: string): string {
    return image.split(":")[1] ?? "latest";
}

function resolveHost(host: string, app: string, release: string): string {
    return host.replace(/\*/g, `${release}-${app}`);
}

process.on("exit", () => {
    fs.rmdirSync(tmpDir, { recursive: true });
});

run().catch(e => core.setFailed(e.message));
