import { execSync } from "node:child_process";

try {
  console.log("Running ESLint...");
  const lintOutput = execSync("npx eslint .", { encoding: "utf8", stdio: "pipe" });
  console.log("LINT SUCCESS:\n", lintOutput);
} catch (error) {
  const typedError = /** @type {{stdout?: string}} */ (error);
  console.log("LINT FAILED:\n", typedError.stdout);
}

try {
  console.log("\nRunning TSC...");
  const tscOutput = execSync("npx tsc --noEmit", { encoding: "utf8", stdio: "pipe" });
  console.log("TSC SUCCESS:\n", tscOutput);
} catch (error) {
  const typedError = /** @type {{stdout?: string}} */ (error);
  console.log("TSC FAILED:\n", typedError.stdout);
}
