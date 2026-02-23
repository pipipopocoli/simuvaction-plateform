const { execSync } = require('child_process');
try {
  const out = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  console.log('BUILD SUCCESS:\n', out);
} catch (e) {
  console.log('BUILD FAILED with error code:', e.status);
  console.log('--- STDOUT ---\n', e.stdout);
  console.log('--- STDERR ---\n', e.stderr);
}
