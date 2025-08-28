#!/usr/bin/env node

import { program } from 'commander';
import { spawn } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (question) => new Promise(resolve => rl.question(question, resolve));

function execDoppler(project, config, secretName, secretValue) {
  return new Promise((resolve, reject) => {
    const proc = spawn('doppler', [
      'secrets', 'set',
      '--project', project,
      '--config', config,
      secretName, secretValue
    ], { stdio: 'inherit' });

    proc.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error(`Failed for ${config}`));
    });
  });
}

program
  .name('doppler-set')
  .description('Set Doppler secrets across environments')
  .requiredOption('-p, --project <project>', 'Project ID (e.g., myproject)', (value) => {
    console.log(value);
    return value;
  })
  .requiredOption('-t, --target <target>', 'Target service', (value) => {
    if (!['frontend', 'backend'].includes(value)) {
      throw new Error('Target must be frontend or backend');
    }
    return value;
  })
  .option('--dev', 'Set on dev environment')
  .option('--stg', 'Set on staging environment') 
  .option('--prd', 'Set on production environment')
  .argument('<name>', 'Secret name')
  .argument('[value]', 'Secret value')
  .action(async (secretName, secretValue, options) => {
    const environments = [];
    
    if (options.dev) environments.push('dev');
    if (options.stg) environments.push('stg');
    if (options.prd) environments.push('prd');
    
    // Default to all if none specified
    if (environments.length === 0) {
      environments.push('dev', 'stg', 'prd');
    }

    const projectName = `${options.project}-${options.target}`;

    if (!secretValue) {
      secretValue = await prompt(`Enter value for ${secretName}: `);
      rl.close();
      if (!secretValue) {
        console.error('❌ Secret value is required');
        process.exit(1);
      }
    } else {
      rl.close();
    }

    console.log(`Setting ${secretName} on ${projectName} for: ${environments.join(', ')}`);

    try {
      for (const env of environments) {
        console.log(`  → ${env}`);
        await execDoppler(projectName, env, secretName, secretValue);
      }
      console.log('✅ Done!');
    } catch (error) {
      console.error('❌', error.message);
      process.exit(1);
    }
  });

program.parse();
