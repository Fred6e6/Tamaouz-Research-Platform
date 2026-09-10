const CONFIG = {
  SHEET_NAME: 'Requests',
  DRIVE_FOLDER_NAME: 'Tamaouz Requests',
  STATUS: 'Submitted'
};

function setupTamaouz() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No active spreadsheet found. Open Apps Script from the target Google Sheet and run setupTamaouz.');
  }

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const headers = [
    'Request ID', 'Created At', 'Request Type', 'Full Name',
    'Academic / Job Title', 'University / Workplace', 'College / Department',
    'Academic Level', 'City', 'Country', 'Email', 'Mobile', 'Project Title',
    'Pages', 'References', 'Citation Style', 'Deadline', 'Topic', 'Instructions',
    'Dynamic Requirements', 'Files', 'Status'
  ];

  if (sheet.getLastRow() === 0) sheet.appendRow(headers);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('DRIVE_FOLDER_ID')) {
    const folder = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  }

  if (!props.getProperty('REQUEST_COUNTER')) {
    props.setProperty('REQUEST_COUNTER', String(Math.max(0, sheet.getLastRow() - 1)));
  }

  SpreadsheetApp.flush();
  return 'Tamaouz backend is ready';
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error('Spreadsheet is not configured. Run setupTamaouz once from the Google Sheet Apps Script editor.');
}

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || '');
    const callback = String(params.callback || '');
    let result;

    if (action === 'getRequest') {
      result = getRequestData_(params.requestId, params.email);
    } else if (action === 'getRequests') {
      result = getRequestsData_(params.email);
    } else {
      const ss = getSpreadsheet_();
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      result = {
        ok: true,
        service: 'Tamaouz API',
        spreadsheet: ss.getName(),
        sheet: sheet ? sheet.getName() : null,
        rows: sheet ? sheet.getLastRow() : 0
      };
    }

    if (callback) return jsonp_(result, callback);
    return json_(result);
  } catch (err) {
    const result = { ok: false, error: String(err.message || err) };
    const callback = e && e.parameter ? String(e.parameter.callback || '') : '';
    return callback ? jsonp_(result, callback) : json_(result);
  }
}

function getRequestData_(requestId, email) {
  const id = String(requestId || '').trim().toUpperCase();
  const mail = String(email || '').trim().toLowerCase();

  if (!id || !mail) {
    return { ok: false, error: 'Request ID and email are required.' };
  }

  const requests = getAllRequestsForEmail_(mail);
  const request = requests.find(r => String(r.requestId).trim().toUpperCase() === id);

  if (!request) {
    return { ok: false, error: 'Request not found or email does not match.' };
  }

  return { ok: true, request: request };
}

function getRequestsData_(email) {
  const mail = String(email || '').trim().toLowerCase();

  if (!mail) {
    return { ok: false, error: 'Email is required.' };
  }

  const requests = getAllRequestsForEmail_(mail);

  return {
    ok: true,
    email: mail,
    count: requests.length,
    requests: requests
  };
}

function getAllRequestsForEmail_(mail) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1);
  const idx = {};

  headers.forEach((h, i) => { idx[String(h)] = i; });

  return rows
    .filter(row => String(row[idx['Email']] || '').trim().toLowerCase() === mail)
    .map(rowToRequest_)
    .reverse();
}

function rowToRequest_(row) {
  const created = row[1];
  let dynamic = {};

  try {
    dynamic = JSON.parse(String(row[19] || '{}'));
  } catch (_) {
    dynamic = {};
  }

  return {
    requestId: String(row[0] || ''),
    createdAt: created instanceof Date ? created.toISOString() : String(created || ''),
    requestType: String(row[2] || ''),
    fullName: String(row[3] || ''),
    title: String(row[4] || ''),
    workplace: String(row[5] || ''),
    department: String(row[6] || ''),
    level: String(row[7] || ''),
    city: String(row[8] || ''),
    country: String(row[9] || ''),
    email: String(row[10] || ''),
    mobile: String(row[11] || ''),
    projectTitle: String(row[12] || ''),
    pages: String(row[13] || ''),
    references: String(row[14] || ''),
    citation: String(row[15] || ''),
    deadline: String(row[16] || ''),
    topic: String(row[17] || ''),
    instructions: String(row[18] || ''),
    dynamicRequirements: dynamic,
    files: String(row[20] || ''),
    status: String(row[21] || CONFIG.STATUS)
  };
}

function doPost(e) {
  try {
    const raw =
      (e && e.parameter && e.parameter.payload) ||
      (e && e.postData && e.postData.contents) || '{}';

    const data = JSON.parse(raw);
    if (data.action !== 'submitRequest') throw new Error('Unsupported action');

    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
    setupTamaouz();

    const id = data.requestId || createRequestId_();
    const folder = DriveApp.getFolderById(
      PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID')
    );

    const requestFolder = folder.createFolder(id + ' - ' + safe_(data.fullName || 'Student'));
    const fileLinks = [];

    (data.files || []).forEach(file => {
      if (!file.name || !file.base64) return;

      const bytes = Utilities.base64Decode(file.base64);
      const blob = Utilities.newBlob(
        bytes,
        file.mimeType || 'application/octet-stream',
        file.name
      );

      const created = requestFolder.createFile(blob);
      fileLinks.push(created.getUrl());
    });

    sheet.appendRow([
      id,
      new Date(),
      data.requestType || '',
      data.fullName || '',
      data.title || '',
      data.workplace || '',
      data.department || '',
      data.level || '',
      data.city || '',
      data.country || '',
      data.email || '',
      data.mobile || '',
      data.projectTitle || '',
      data.pages || '',
      data.references || '',
      data.citation || '',
      data.deadline || '',
      data.topic || '',
      data.instructions || '',
      JSON.stringify(data.dynamicRequirements || {}),
      fileLinks.join('\n'),
      CONFIG.STATUS
    ]);

    SpreadsheetApp.flush();

    return json_({
      ok: true,
      requestId: id,
      status: CONFIG.STATUS,
      folderUrl: requestFolder.getUrl()
    });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function createRequestId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    const year = new Date().getFullYear();
    const count = Number(props.getProperty('REQUEST_COUNTER') || 0) + 1;

    props.setProperty('REQUEST_COUNTER', String(count));
    return 'TM-' + year + '-' + String(count).padStart(5, '0');
  } finally {
    lock.releaseLock();
  }
}

function safe_(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(obj, callback) {
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[0-9A-Za-z_$]+)*$/.test(callback)) {
    return json_({ ok: false, error: 'Invalid callback.' });
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}