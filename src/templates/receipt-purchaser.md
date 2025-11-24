{{! <!-- ------------------------------ --> }}
{{! <!-- RECEIPT TEMPLATE FOR PURCHASER --> }}
{{! <!-- Reference: commonmark.org/help --> }}
{{! <!-- ------------------------------ --> }}

## Thanks {{FIRST_NAME}}!

{{! <!---- BEGIN ELECTRONIC PAYMENT SECTION ----> }}
{{#if IS_ELECTRONIC_PAYMENT}}

**Your payment has been processed.**

- Amount paid: ${{AMOUNT_PAID}}

{{#if IS_DEPOSIT}}
- Balance due by {{PAYMENT_DUE_DATE}}.
  Pay your balance here: https://{{DIRECT_PAYMENT_URL}}
{{/if}}

{{/if}}
{{! <!---- END ELECTRONIC PAYMENT SECTION ----> }}


{{! <!---- BEGIN CHECK PAYMENT SECTION ----> }}
{{#if IS_CHECK_PAYMENT}}

**You are not yet registered.**

- We must receive a check in the next two weeks for
{{#if IS_DEPOSIT}} at least ${{DEPOSIT_TOTAL}} to hold your spot.
{{else}} ${{ORDER_TOTAL}} to secure your spot.
{{/if}}

{{#if SHOW_CHECK_ADDRESS}}
- Make your check payable to **{{CHECK_TO}}** and mail it to:
  {{CHECK_ADDRESS}}
{{else}}
- Email us to get the mailing address for your check.
{{/if}}

- If you'd prefer, you may still opt to pay electronically at: https://{{DIRECT_PAYMENT_URL}}

{{/if}}
{{! <!---- END CHECK PAYMENT SECTION ----> }}

We look forward to dancing with you at {{EVENT_TITLE}}!

{{! <!---- ORDER SUMMARY GETS INSERTED HERE  ----> }}
