# Helper Scripts

## Bootstrap scripts
See [scripts/bootstrap/README.md](./bootstrap/README.md)

## Start Firebase emulators
Run local Firebase emulators for functions, firestore, auth, and hosting: `npm run emulators`

## Start Firebase functions shell
Execute emulated Firebase functions from local shell: `npm run functions-shell`

## Enable/Disable APIs
Enable or disable Google Cloud APIs for project: `npm run enable-apis <PROJECT_ID>` / `npm run disable-apis <PROJECT_ID>`

## Match Payments
Verify each Firestore order has a matching Stripe/PayPal transaction and vice versa:

```bash
npm run matchPayments-stg
npm run matchPayments-prd
```

## Query Firestore Orders
This script connects to the staging or production Firestore database and lists all completed orders. Use the `--pending` flag to instead list pending orders.

> [!NOTE]
> By default the orders script ignores emails listed in `SCRIPTS_TEST_DOMAINS`. To include them, use the `--all`/`--include-test-emails` flag.

```bash
npm run orders-stg -- [--pending] [--include-test-emails]
npm run orders-prd -- [--pending] [--include-test-emails]
```
