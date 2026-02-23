import { execSync } from "node:child_process";

try {
  const output = execSync("npm run build", { encoding: "utf8", stdio: "pipe" });
  console.log("BUILD SUCCESS:\n", output);
} catch (error) {
  const typedError = /** @type {{status?: number, stdout?: string, stderr?: string}} */ (error);
  console.log("BUILD FAILED with error code:", typedError.status);
  console.log("--- STDOUT ---\n", typedError.stdout);
  console.log("--- STDERR ---\n", typedError.stderr);
}
