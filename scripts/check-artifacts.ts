import * as crypto from "crypto";
import * as fs from "fs";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function run(): Promise<void> {
    const initial = await checksums();

    core.startGroup("Build");
    await exec.exec("yarn", ["build"]);
    core.endGroup();

    const actual = await checksums();

    core.startGroup("Hashes");
    console.log("BEFORE", initial);
    console.log("AFTER", actual);
    core.endGroup();

    if (!compareChecksums(initial, actual)) {
        core.setFailed(
            "Build artifacts are not up to date. Please build the project and commit them.",
        );
        return;
    }

    console.log("CHECK SUCCESSFULL");
}

async function checksums(): Promise<any> {
    return {
        "dist/index.js": await checksum(`${__dirname}/../dist/index.js`),
        "README.md": await checksum(`${__dirname}/../README.md`),
    };
}

async function checksum(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(path);
        stream.on("error", err => reject(err));
        stream.on("data", chunk => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}

function compareChecksums(a: any, b: any): boolean {
    for (const key in a) {
        if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
