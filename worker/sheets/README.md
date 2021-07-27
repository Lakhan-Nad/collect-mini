## Script to add data to spreadsheet from Google Sheets API:

### Requirements

- SpreadSheet Id
- A service account key (in form of json) with access to Google Sheets API (google only provides 2 flows for accessing sheet programatically one is Oauth2 and other is service accounts. We went with later)

  The above two can be passed as Job params while creating the form with `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY` keys respectively.

### How this script works

- First it tries to create a google auth client (specifically a jwtClient) with help of service key provided.
- Then it calls sheets API with the auth client created and passes the responses as form values.

### Regarding the Google Sheet API limits

The quota for Google Sheets API is 100 requests per 100 seconds. If we reach this quota our job will fail. We can configure the Google Sheet Job to have `backoffStrategy` of 'fixed' with `backoffDelay` of 100 seconds so it will only try after 100 seconds when we know our quota will be renewed.

There is another limitation of maximum 5 million cells in a sheet. We won't be crossing this limit assuming that response for a new form goes into a new sheet. If that is not the case, then we will have to create a new sheet to overcome this issue. The creation of new sheet is outside the scope of this particular job configuration. ALthough if we assume broader permissions in terms of Google Drive, then we can actually store responses inside a particular drive folder. We will create new sheets in that folder as per requirement for the new responses.
