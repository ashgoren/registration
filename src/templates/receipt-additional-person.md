{{! <!-- ----------------------------------------------------------- --> }}
{{! <!-- RECEIPT TEMPLATE FOR ADDITIONAL REGISTRANTS (NOT PURCHASER) --> }}
{{! <!-- New to Markdown? See reference: https://commonmark.org/help --> }}
{{! <!-- ----------------------------------------------------------- --> }}

Someone has signed you up for the {{EVENT_TITLE}}!

{{! <!---- THIS SECTION IF ELECTRONIC PAYMENT ----> }}
{{#if IS_ELECTRONIC_PAYMENT}}

{{#if IS_DEPOSIT}}
We are holding your spot in camp. The balance of your registration fee is due by {{PAYMENT_DUE_DATE}}.
{{else}}
We've received payment for your registration.
{{/if}}

{{/if}}
{{! <!---- END ELECTRONIC PAYMENT SECTION ----> }}


{{! <!---- THIS SECTION IF CHECK PAYMENT ----> }}
{{#if IS_CHECK_PAYMENT}}

**Your spot in camp will be confirmed once we receive payment for your registration.**

{{/if}}
{{! <!---- END CHECK PAYMENT SECTION ----> }}

We look forward to dancing with you at {{EVENT_TITLE}}!

{{! <!---- REGISTRANT INFO SUMMARY GETS INSERTED HERE  ----> }}
