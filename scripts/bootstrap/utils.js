// ****************************************
// used by project bootstrapping scripts
// ****************************************

import { execSync } from 'child_process';
import readline from 'readline';

function parseArgs() {
  const [projectId, secondArg] = process.argv.slice(2);
  if (!projectId) {
    log.error('\n❌ Error: projectId is required\n');
    process.exit(1);
  }
  return { projectId, secondArg };
}

const promptInput = async (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question(question, (response) => {
      resolve(response.trim());
    });
  });
  rl.close();
  return answer;
};

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  plain: (msg) => console.log(msg)
};

function runCommand(command, description, options = { stdio: 'inherit' }) {
  if (description) log.info(description);
  try {
    execSync(command, { ...options });
    return true;
  } catch (error) {
    log.error(`❌ Failed to execute: ${command}`);
    log.error(`${error.message}\n`);
    return false;
  }
}

const runCommandWithResult = (command) => {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    if (process.env.DEBUG) {
      console.error(`\nError running command: ${command}\n`);
    }
    return null;
  }
};

export { log, runCommand, runCommandWithResult, parseArgs, promptInput };