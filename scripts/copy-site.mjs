import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const output = path.join(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const application = "Maritime-Security-Policy-Hub.html";
await cp(path.join(root, application), path.join(output, application));
await cp(path.join(root, application), path.join(output, "index.html"));
await cp(path.join(root, "CNAME"), path.join(output, "CNAME"));

for (const entry of ["admin", "assets", "content"]) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}

console.log("Copied the static site and generated content indexes to dist/.");
