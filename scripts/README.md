# Helper Scripts

## Bootstrap scripts
See [scripts/bootstrap/README.md](./bootstrap/README.md)

## Start Firebase emulators
Run local Firebase emulators for functions, firestore, auth, and hosting: `npm run emulators`

## Start Firebase functions shell
Execute emulated Firebase functions from local shell: `npm run functions-shell`

## Pause/Resume Between Events
Delete deployed functions, disable the Places/Maps APIs, and disable the deploy workflow for a project between events: `npm run pause <PROJECT_ID>` / `npm run resume <PROJECT_ID>`. See [Between Events](../README.md#between-events) in the main README.

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
