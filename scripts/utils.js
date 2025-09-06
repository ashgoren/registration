// ****************************************
// used by project setup scripts
// ****************************************

import { execSync } from 'child_process';

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

function runCommand(command, description, options = {}) {
  log.info(description);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log.error(`Failed to execute: ${command}`);
    log.error(`Error: ${error.message}\n`);
    return false;
  }
}

export { log, runCommand };
