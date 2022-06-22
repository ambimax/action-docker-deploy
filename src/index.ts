import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as fs from "fs";
import * as autogen from "./autogen";
import fetch from "node-fetch";

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
    if (response.id === "Unauthorized") {
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
    const namespace = inputs.namespace || "default";
    const host = resolveHost(inputs.host, app, release);
    const env = (inputs.env || "")
        .split(",")
        .filter(key => !!key.trim() && process.env[key] !== undefined)
        .map(key => ["--set", `env.${key}=${process.env[key]}`])
        .flat();
    const dockerPullSecret = inputs.docker_secret ?? "regcred";

    const data = {
        app,
        release,
        namespace,
        host,
        image,
        port,
        dockerPullSecret,
    };
    for (const key in data) {
        console.log(key.padEnd(20), (data as any)[key]);
    }

    core.endGroup();

    if (parseBoolean(inputs.enable_commit_comment)) {
        // Code is a modified version from
        // https://github.com/nwtgck/actions-netlify/blob/83e878e5d3f6b6ea0b5883f0acac082f1739b866/src/main.ts#L79

        if (inputs.github_token) {
            const githubClient = new github.GitHub(inputs.github_token);

            const commitCommentParams = {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                // eslint-disable-next-line @typescript-eslint/camelcase
                commit_sha: github.context.sha,
                body: `🚀 Beep Boop. Deployed to [https://${host}](https://${host})`,
            };

            // TODO: Remove try
            // NOTE: try-catch is experimentally used because commit message may not be done in some conditions.
            try {
                // Comment to the commit
                await githubClient.repos.createCommitComment(
                    commitCommentParams,
                );
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(
                    err,
                    JSON.stringify(commitCommentParams, null, 2),
                );
            }
        } else {
            core.warning("github_token not provided for commit_comment.");
        }
    }

    if (!parseBoolean(inputs.undeploy)) {
        core.startGroup("Deploy");

        const args: string[] = [];
        if (inputs.values_file) {
            if (!fs.existsSync(inputs.values_file)) {
                core.warning(
                    `input: values_file does not exist: ${inputs.values_file}`,
                );
                process.exit(1);
            }

            args.push("-f", inputs.values_file);
        }

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
                "--set",
                `dockerPullSecret=${dockerPullSecret}`,
                "--set",
                `release=${release}`,
                `--namespace=${namespace}`,
                ...env,
                ...args,
                app + "-" + release,
                `${__dirname}/../k8s/helm`,
            ],
            {
                env: {
                    KUBECONFIG: `${tmpDir}/kubeconfig`,
                },
            },
        );
        core.endGroup();
    } else {
        core.startGroup("Undeploy");
        await exec.exec(
            "helm",
            ["delete", `--namespace=${namespace}`, app + "-" + release],
            {
                env: {
                    KUBECONFIG: `${tmpDir}/kubeconfig`,
                },
            },
        );
        core.endGroup();
    }
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

function parseBoolean(value: any): boolean {
    value = String(value);
    return value === "true" || value === "yes" || value === "1";
}

run().catch(e => core.setFailed(e.message));
