# Tamaouz Google Drive + Sheets backend

This folder contains the Google Apps Script API used by the website.

## Setup
1. Create a Google Sheet for Tamaouz.
2. Open **Extensions → Apps Script**.
3. Copy `Code.gs` into the Apps Script project.
4. Run `setupTamaouz()` once and authorize Google Sheets/Drive access.
5. Deploy as **Web app**: Execute as **Me**, and choose the access setting appropriate for your site.
6. Copy the deployed Web App URL.
7. Put that URL in `app.js` as `GOOGLE_API_URL`.

The script creates a `Requests` sheet and a `Tamaouz Requests` Drive folder. Each submitted request gets a unique ID and its uploaded files are stored in a folder named after the request ID.

## Security note
Do not put Google OAuth credentials, service-account keys, or other secrets in this repository. The Web App URL is an endpoint, not a secret. For a production deployment, add server-side authentication/rate limiting before accepting sensitive student data.