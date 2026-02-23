const { execSync } = require('child_process');
try {
  // We bypass the npm wrapper and invoke next lint directly
  console.log("Running ESLint...");
  const out = execSync('npx eslint .', { encoding: 'utf8', stdio: 'pipe' });
  console.log('LINT SUCCESS:\n', out);
} catch (e) {
  console.log('LINT FAILED:\n', e.stdout);
}

try {
  console.log("\nRunning TSC...");
  const out2 = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  console.log('TSC SUCCESS:\n', out2);
} catch (e) {
  console.log('TSC FAILED:\n', e.stdout);
}
