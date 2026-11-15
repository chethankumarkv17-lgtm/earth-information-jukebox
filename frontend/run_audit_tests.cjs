const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const testFiles = fs.readdirSync(__dirname)
  .filter(f => f.startsWith('test_') && f.endsWith('.js'));

console.log(`Discovered ${testFiles.length} frontend test suites:`);
let suitesPassed = 0;
let suitesFailed = 0;
const failureDetails = [];

for (const file of testFiles) {
  process.stdout.write(`\n------------------------------------------------------------\nRunning ${file} ...\n`);
  try {
    const output = execSync(`node "${path.join(__dirname, file)}"`, {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const lines = output.trim().split('\n');
    console.log(lines.slice(-4).join('\n'));
    suitesPassed++;
  } catch (err) {
    suitesFailed++;
    const errMsg = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
    console.error(`❌ Suite Failed: ${file}`);
    console.error(errMsg.split('\n').slice(-10).join('\n'));
    failureDetails.push({ file, err: errMsg });
  }
}

console.log(`\n============================================================`);
console.log(`FRONTEND TEST AUDIT SUMMARY:`);
console.log(`Suites Passed: ${suitesPassed} / ${testFiles.length}`);
console.log(`Suites Failed: ${suitesFailed}`);
console.log(`============================================================\n`);

if (suitesFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
