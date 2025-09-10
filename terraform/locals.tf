locals {
  spreadsheet_id            = regex("/spreadsheets/d/([a-zA-Z0-9-_]+)", var.spreadsheet_url)[0]
  email_from                = "${var.email_from_name} <${var.email_from_email}>"
}
