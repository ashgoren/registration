#!/usr/bin/env node

// set payment frontend & backend secrets for a given environment
// Note: frontend Doppler project name is <projectId>, backend Doppler project name is <projectId>-backend
// All environments are stored within the same Doppler projects

import { log, runCommand, promptInput } from './utils.js';

const main = async () => {
  const [projectId, provider, environment] = process.argv.slice(2);

  if (!projectId || !provider || !environment) {
    log.error('Usage: npm run set-payment-secrets <projectId> <stripe|paypal> <dev|stg|prd>\n');
    process.exit(1);
  }

  if (!['stripe', 'paypal'].includes(provider)) {
    log.error('Provider must be either "stripe" or "paypal"\n');
    process.exit(1);
  }

  if (!['dev', 'stg', 'prd'].includes(environment)) {
    log.error('Environment must be either "dev", "stg" or "prd"\n');
    process.exit(1);
  }

  try {
    const publishableLabel = provider === 'stripe' ? 'publishable key' : 'client ID';
    const secretLabel = provider === 'stripe' ? 'secret key' : 'client secret';
    const webhookLabel = provider === 'stripe' ? 'webhook secret' : 'webhook ID';

    const publishableKey = await promptInput(`Enter ${provider} ${environment} ${publishableLabel}: `);
    const secretKey = await promptInput(`Enter ${provider} ${environment} ${secretLabel}: `);
    const webhookKey = await promptInput(`Enter ${provider} ${environment} ${webhookLabel} (leave blank to skip): `);

    // Set frontend publishable key
    const frontendKeyName = provider === 'stripe' ? 'VITE_STRIPE_PUBLISHABLE_KEY' : 'VITE_PAYPAL_CLIENT_ID';
    if (!runCommand(`doppler secrets set ${frontendKeyName}="${publishableKey}" -p "${projectId}" -c "${environment}" --silent`)) {
      throw new Error(`Failed to set ${frontendKeyName}`);
    }
    log.success(`✅ Set ${frontendKeyName} in doppler project ${projectId} config ${environment}`);

    // If PayPal, also set client ID in backend
    if (provider === 'paypal') {
      if (!runCommand(`doppler secrets set PAYPAL_CLIENT_ID="${publishableKey}" -p "${projectId}-backend" -c "${environment}" --silent`)) {
        throw new Error(`Failed to set PAYPAL_CLIENT_ID`);
      }
      log.success(`✅ Set PAYPAL_CLIENT_ID in doppler project ${projectId}-backend config ${environment}`);
    }

    // Set backend secret key
    const backendSecretName = provider === 'stripe' ? 'STRIPE_SECRET_KEY' : 'PAYPAL_CLIENT_SECRET';
    if (!runCommand(`doppler secrets set ${backendSecretName}="${secretKey}" -p "${projectId}-backend" -c "${environment}" --silent`)) {
      throw new Error(`Failed to set ${backendSecretName}`);
    }
    log.success(`✅ Set ${backendSecretName} in doppler project ${projectId}-backend config ${environment}`);

    // Set backend webhook key
    const webhookSecretName = provider === 'stripe' ? 'STRIPE_WEBHOOK_SECRET' : 'PAYPAL_WEBHOOK_ID';
    if (webhookKey) {
      if (!runCommand(`doppler secrets set ${webhookSecretName}="${webhookKey}" -p "${projectId}-backend" -c "${environment}" --silent`)) {
        throw new Error(`Failed to set ${webhookSecretName}`);
      }
      log.success(`✅ Set ${webhookSecretName} in doppler project ${projectId}-backend config ${environment}`);
    } else {
      log.info(`Skipped setting ${webhookSecretName} in doppler project ${projectId}-backend config ${environment}`);
    }

  } catch (error) {
    log.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();