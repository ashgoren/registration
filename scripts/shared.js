import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { ArtifactRegistryClient } from '@google-cloud/artifact-registry';
// import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const scriptName = process.argv[1].split('/').pop();
const argv = yargs(hideBin(process.argv))
  .usage(`\nUsage: node ${scriptName} [--pending] [--include-test-emails]`)
  .option('pending', {
    alias: 'p',
    type: 'boolean',
    description: 'Include pending orders',
    default: false,
  })
  .option('include-test-emails', {
    alias: 'all',
    type: 'boolean',
    description: 'Include test emails',
    default: false,
  })
  .help()
  .parse();

const pending = argv.pending;
const includeTestEmails = argv['include-test-emails'];
const testDomains = includeTestEmails ? [] : process.env.SCRIPTS_TEST_DOMAINS?.split(',')?.map((domain) => domain.trim());

if (scriptName !== 'cleanupArtifacts.js') {
  console.log(includeTestEmails ? '' : 'Excluding test emails!\n');
}

// setup firebase
const firebaseServiceKeyPath = `keys/firebase-service-key.json`;
const firebaseServiceAccount = JSON.parse(await fs.readFile(new URL(firebaseServiceKeyPath, import.meta.url), 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(firebaseServiceAccount) });

const projectId = firebaseServiceAccount.project_id;
console.log(`\nPROJECT: ${projectId}`);

// setup artifact registry
const artifactRegistryClient = new ArtifactRegistryClient({
  credentials: {
    client_email: firebaseServiceAccount.client_email,
    private_key: firebaseServiceAccount.private_key
  },
  projectId
});

// get data from firestore
const db = getFirestore();
const allOrders = await getOrders('orders');
const finalOrders = allOrders.filter((order) => order.status === 'final');
const pendingOrders = allOrders.filter((order) => order.status === 'pending');

async function getOrders(collection) {
  const snapshot = await db.collection(collection).orderBy('createdAt', 'asc').get();
  return snapshot.docs.map((doc) => ({ key: doc.id, ...doc.data() }));
}

// // setup google sheets
// const spreadsheetId = process.env['SCRIPTS_SHEET_ID'];
// const sheetsServiceKeyPath = `keys/sheets-service-key.json`;
// const sheetsServiceAccount = JSON.parse(await fs.readFile(new URL(sheetsServiceKeyPath, import.meta.url), 'utf-8'));
// const sheetsClient = new google.auth.JWT({ email: sheetsServiceAccount.client_email, key: sheetsServiceAccount.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
// const sheets = google.sheets({ version: 'v4', auth: sheetsClient });
// const readSheet = async () => sheets.spreadsheets.values.get({ spreadsheetId, range: 'Orders' });

function log({ email, message }) {
  const isTestEmail = testDomains.some((domain) => email.includes(domain));
  if (!isTestEmail) {
    console.log(message);
  }
}

export { pending, finalOrders, pendingOrders, projectId, artifactRegistryClient, log };
