{{! <!-- ----------------------------------------------------------- --> }}
{{! <!-- RECEIPT TEMPLATE FOR ADDITIONAL REGISTRANTS (NOT PURCHASER) --> }}
{{! <!-- New to Markdown? See reference: https://commonmark.org/help --> }}
{{! <!-- ----------------------------------------------------------- --> }}

Someone has signed you up for the {{EVENT_TITLE}}!

{{! <!---- BEGIN ELECTRONIC PAYMENT SECTION ----> }}
{{#if IS_ELECTRONIC_PAYMENT}}

{{#if IS_DEPOSIT}}
We are holding your spot in camp. The balance of your registration fee is due by {{PAYMENT_DUE_DATE}}.
{{else}}
We've received payment for your registration.
{{/if}}

{{/if}}
{{! <!---- END ELECTRONIC PAYMENT SECTION ----> }}


{{! <!----  BEGIN CHECK PAYMENT SECTION -----> }}
{{#if IS_CHECK_PAYMENT}}

**Your spot in camp will be confirmed once we receive payment for your registration.**

{{/if}}
{{! <!---- END CHECK PAYMENT SECTION ----> }}


{{! <!---- BEGIN WAIVER SECTION ----> }}
{{#if SHOW_WAIVER_NOTE}}

**Please sign your waiver.** You should receive a separate email from DocuSeal with a link to sign your waiver. Each attendee must sign their own waiver, even if you've attended previously.

{{/if}}
{{! <!---- END WAIVER SECTION ----> }}

We look forward to dancing with you at {{EVENT_TITLE}}!

{{! <!---- REGISTRANT INFO SUMMARY GETS INSERTED HERE  ----> }}
