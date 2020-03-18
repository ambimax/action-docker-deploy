import * as crypto from "crypto";
import * as fs from "fs";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function run(): Promise<void> {
    const initial = await checksum(`${__dirname}/../dist/index.js`);

    core.startGroup("Build");
    await exec.exec("yarn", ["build"]);
    core.endGroup();

    const actual = await checksum(`${__dirname}/../dist/index.js`);

    core.startGroup("Hashes");
    console.log("BEFORE", initial);
    console.log("AFTER", actual);
    core.endGroup();

    if (initial !== actual) {
        core.setFailed(
            "Build artifacts are not up to date. Please build the project and commit them.",
        );
        return;
    }

    console.log("CHECK SUCCESSFULL");
}

function checksum(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(path);
        stream.on("error", err => reject(err));
        stream.on("data", chunk => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
