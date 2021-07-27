const { inspect } = require("util");

const { google } = require("googleapis");

async function main(obj) {
  const sheets = google.sheets({
    version: "v4",
  });

  let google_sheet_id = obj?.job?.params?.GOOGLE_SHEET_ID;
  let google_service_account_key = obj?.job?.params?.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!google_sheet_id || !google_service_account_key) {
    throw new Error(
      "Google Sheet ID and Google Service Account Key is required."
    );
  }

  let values = obj?.response?.answers;

  let authenticatedClient = await authorize(google_service_account_key);

  if (!Array.isArray(values)) {
    throw new Error("values must be a array");
  }

  values = values.map((val) => inspect(val));

  if (authenticatedClient === null) {
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: google_sheet_id,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    range: "Sheet1!A1:A1",
    auth: authenticatedClient,
    requestBody: {
      majorDimension: "ROWS",
      values: [values],
    },
  });

  return true;
}

async function authorize(secretKey) {
  try {
    let jwtClient = new google.auth.JWT({
      email: secretKey.client_email,
      keyId: secretKey.private_key_id,
      key: secretKey.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    await jwtClient.authorize();
    return jwtClient;
  } catch (err) {
    const error = new Error("Error in Google Authorization: ");
    Error.captureStackTrace(error);
    throw err;
  }
}

module.exports.main = main;
