const CONFIG = {
  SPREADSHEET_ID: '1NtyzFQ1m23aIuCNceYTS8JhNuEVUDGmPeSl024ngHiM',
  SHEET_NAME: 'Requests'
};

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = String(p.action || 'getRequests');
    const callback = String(p.callback || '');
    let result;

    if (action === 'getRequest') {
      result = getRequest_(p.requestId, p.email);
    } else if (action === 'getRequests') {
      result = getRequests_(p.email);
    } else {
      result = {
        ok: true,
        service: 'Tamaouz Tracking API',
        sheet: CONFIG.SHEET_NAME
      };
    }

    return callback ? jsonp_(result, callback) : json_(result);
  } catch (err) {
    const result = { ok: false, error: String(err.message || err) };
    const callback = e && e.parameter ? String(e.parameter.callback || '') : '';
    return callback ? jsonp_(result, callback) : json_(result);
  }
}

function getRequests_(email) {
  const mail = String(email || '').trim().toLowerCase();
  if (!mail) return { ok: false, error: 'Email is required.' };

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return { ok: true, email: mail, count: 0, requests: [] };
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = {};
  headers.forEach((h, i) => idx[String(h)] = i);

  const requests = values.slice(1)
    .filter(row => String(row[idx['Email']] || '').trim().toLowerCase() === mail)
    .map(rowToRequest_);

  requests.sort((a, b) =>
    (new Date(b.createdAt).getTime() || 0) -
    (new Date(a.createdAt).getTime() || 0)
  );

  return { ok: true, email: mail, count: requests.length, requests: requests };
}

function getRequest_(requestId, email) {
  const id = String(requestId || '').trim().toUpperCase();
  const mail = String(email || '').trim().toLowerCase();
  if (!id || !mail) return { ok: false, error: 'Request ID and email are required.' };

  const result = getRequests_(mail);
  const request = (result.requests || []).find(r =>
    String(r.requestId || '').trim().toUpperCase() === id
  );

  if (!request) return { ok: false, error: 'Request not found or email does not match.' };
  return { ok: true, request: request };
}

function rowToRequest_(row, idx) {
  let dynamic = {};
  try { dynamic = JSON.parse(String(row[idx['Dynamic Requirements']] || '{}')); } catch (_) {}

  const created = row[idx['Created At']];
  return {
    requestId: String(row[idx['Request ID']] || ''),
    createdAt: created instanceof Date ? created.toISOString() : String(created || ''),
    requestType: String(row[idx['Request Type']] || ''),
    fullName: String(row[idx['Full Name']] || ''),
    title: String(row[idx['Academic / Job Title']] || ''),
    workplace: String(row[idx['University / Workplace']] || ''),
    department: String(row[idx['College / Department']] || ''),
    level: String(row[idx['Academic Level']] || ''),
    city: String(row[idx['City']] || ''),
    country: String(row[idx['Country']] || ''),
    email: String(row[idx['Email']] || ''),
    mobile: String(row[idx['Mobile']] || ''),
    projectTitle: String(row[idx['Project Title']] || ''),
    pages: String(row[idx['Pages']] || ''),
    references: String(row[idx['References']] || ''),
    citation: String(row[idx['Citation Style']] || ''),
    deadline: String(row[idx['Deadline']] || ''),
    topic: String(row[idx['Topic']] || ''),
    instructions: String(row[idx['Instructions']] || ''),
    dynamicRequirements: dynamic,
    files: String(row[idx['Files']] || ''),
    status: String(row[idx['Status']] || 'Submitted')
  };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(obj, callback) {
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[0-9A-Za-z_$]*)*$/.test(callback)) {
    return json_({ ok: false, error: 'Invalid callback.' });
  }
  return ContentService.createTextOutput(
    callback + '(' + JSON.stringify(obj) + ');'
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
