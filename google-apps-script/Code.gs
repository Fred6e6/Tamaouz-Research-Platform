const CONFIG = {
  SHEET_NAME: 'Requests',
  DRIVE_FOLDER_NAME: 'Tamaouz Requests',
  STATUS: 'Submitted',
  COMPLAINTS_SHEET_NAME: 'Complaints'
};

function setupTamaouz() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No active spreadsheet found. Open Apps Script from the target Google Sheet and run setupTamaouz.');

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  const headers = [
    'Request ID','Created At','Request Type','Full Name',
    'Academic / Job Title','University / Workplace','College / Department',
    'Academic Level','City','Country','Email','Mobile','Project Title',
    'Pages','References','Citation Style','Deadline','Topic','Instructions',
    'Dynamic Requirements','Files','Status'
  ];

  if (sheet.getLastRow() === 0) sheet.appendRow(headers);

  let complaints = ss.getSheetByName(CONFIG.COMPLAINTS_SHEET_NAME);
  if (!complaints) complaints = ss.insertSheet(CONFIG.COMPLAINTS_SHEET_NAME);
  if (complaints.getLastRow() === 0) {
    complaints.appendRow([
      'Complaint ID','Created At','Type','Full Name','Email','Mobile',
      'Request ID','Subject','Message','Language','Status'
    ]);
  }

  const props = PropertiesService.getScriptProperties();

  if (!props.getProperty('DRIVE_FOLDER_ID')) {
    const folder = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  }

  if (!props.getProperty('REQUEST_COUNTER')) {
    props.setProperty('REQUEST_COUNTER', String(Math.max(0, sheet.getLastRow() - 1)));
  }

  if (!props.getProperty('COMPLAINT_COUNTER')) {
    props.setProperty('COMPLAINT_COUNTER', String(Math.max(0, complaints.getLastRow() - 1)));
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
    } else if (action === 'getAllRequests') {
      result = getAllRequestsData_(params.adminPassword);
    } else if (action === 'updateStatus') {
      result = updateRequestStatus_(params.requestId, params.status, params.adminPassword);
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

  if (!id || !mail) return { ok: false, error: 'Request ID and email are required.' };

  const requests = getAllRequestsForEmail_(mail);
  const request = requests.find(r => String(r.requestId || '').trim().toUpperCase() === id);

  if (!request) return { ok: false, error: 'Request not found or email does not match.' };
  return { ok: true, request: request };
}

function getRequestsData_(email) {
  const mail = String(email || '').trim().toLowerCase();
  if (!mail) return { ok: false, error: 'Email is required.' };
  const requests = getAllRequestsForEmail_(mail);
  return { ok: true, email: mail, count: requests.length, requests: requests };
}

function getAllRequestsForEmail_(mail) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1);
  const idx = {};
  headers.forEach((header, index) => { idx[String(header)] = index; });

  const requests = rows
    .filter(row => String(row[idx['Email']] || '').trim().toLowerCase() === mail)
    .map(row => rowToRequest_(row, idx));

  requests.sort((a, b) => {
    const da = new Date(a.createdAt).getTime() || 0;
    const db = new Date(b.createdAt).getTime() || 0;
    return db - da;
  });
  return requests;
}

function getAllRequestsData_(adminPassword) {
  if (!isAdmin_(adminPassword)) return { ok: false, error: 'Unauthorized.' };

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { ok: true, count: 0, requests: [] };

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = {};
  headers.forEach((header, index) => { idx[String(header)] = index; });

  const requests = values.slice(1).map(row => rowToRequest_(row, idx));
  requests.sort((a, b) => {
    const da = new Date(a.createdAt).getTime() || 0;
    const db = new Date(b.createdAt).getTime() || 0;
    return db - da;
  });

  return { ok: true, count: requests.length, requests: requests };
}

function updateRequestStatus_(requestId, status, adminPassword) {
  if (!isAdmin_(adminPassword)) return { ok: false, error: 'Unauthorized.' };

  const allowed = ['Submitted','Under Review','In Progress','Ready for Review','Completed'];
  const cleanStatus = String(status || '').trim();
  const id = String(requestId || '').trim().toUpperCase();

  if (!id || allowed.indexOf(cleanStatus) === -1) {
    return { ok: false, error: 'Invalid request ID or status.' };
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { ok: false, error: 'Request not found.' };

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('Request ID');
  const statusIndex = headers.indexOf('Status');
  if (idIndex === -1 || statusIndex === -1) return { ok: false, error: 'Required columns are missing.' };

  for (let i = 1; i < values.length; i++) {
    const rowId = String(values[i][idIndex] || '').trim().toUpperCase();
    if (rowId === id) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(cleanStatus);
      SpreadsheetApp.flush();
      return { ok: true, requestId: id, status: cleanStatus };
    }
  }

  return { ok: false, error: 'Request not found.' };
}

function isAdmin_(password) {
  const stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return !!stored && String(password || '') === stored;
}

function setAdminPassword() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Tamaouz Admin', 'Enter a strong admin password:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return 'Cancelled';
  const password = String(response.getResponseText() || '').trim();
  if (password.length < 8) throw new Error('Admin password must be at least 8 characters.');
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  return 'Admin password saved';
}

function rowToRequest_(row, idx) {
  const created = row[idx['Created At']];
  let dynamic = {};
  try { dynamic = JSON.parse(String(row[idx['Dynamic Requirements']] || '{}')); } catch (_) { dynamic = {}; }

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
    status: String(row[idx['Status']] || CONFIG.STATUS)
  };
}

function doPost(e) {
  try {
    const raw = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);

    if (data.action === 'submitComplaint') {
      return json_(submitComplaint_(data));
    }

    if (data.action !== 'submitRequest') throw new Error('Unsupported action');

    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
    setupTamaouz();

    const id = data.requestId || createRequestId_();
    const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'));
    const requestFolder = folder.createFolder(id + ' - ' + safe_(data.fullName || 'Student'));
    const fileLinks = [];

    (data.files || []).forEach(file => {
      if (!file.name || !file.base64) return;
      const bytes = Utilities.base64Decode(file.base64);
      const blob = Utilities.newBlob(bytes, file.mimeType || 'application/octet-stream', file.name);
      const created = requestFolder.createFile(blob);
      fileLinks.push(created.getUrl());
    });

    sheet.appendRow([
      id,new Date(),data.requestType || '',data.fullName || '',data.title || '',data.workplace || '',data.department || '',data.level || '',data.city || '',data.country || '',data.email || '',data.mobile || '',data.projectTitle || '',data.pages || '',data.references || '',data.citation || '',data.deadline || '',data.topic || '',data.instructions || '',JSON.stringify(data.dynamicRequirements || {}),fileLinks.join('\n'),CONFIG.STATUS
    ]);

    SpreadsheetApp.flush();
    return json_({ ok: true, requestId: id, status: CONFIG.STATUS, folderUrl: requestFolder.getUrl() });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function submitComplaint_(data) {
  const required = ['fullName','email','type','subject','message'];
  required.forEach(key => {
    if (!String(data[key] || '').trim()) throw new Error(key + ' is required.');
  });

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.COMPLAINTS_SHEET_NAME);
  if (!sheet) throw new Error('Complaints sheet is not configured. Run setupTamaouz once.');

  const id = createComplaintId_();
  const status = 'New';

  sheet.appendRow([
    id,
    new Date(),
    String(data.type || '').trim(),
    String(data.fullName || '').trim(),
    String(data.email || '').trim().toLowerCase(),
    String(data.mobile || '').trim(),
    String(data.requestId || '').trim().toUpperCase(),
    String(data.subject || '').trim(),
    String(data.message || '').trim(),
    String(data.language || 'ar').trim(),
    status
  ]);

  SpreadsheetApp.flush();
  return { ok: true, complaintId: id, status: status };
}

function createComplaintId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const year = new Date().getFullYear();
    const count = Number(props.getProperty('COMPLAINT_COUNTER') || 0) + 1;
    props.setProperty('COMPLAINT_COUNTER', String(count));
    return 'CM-' + year + '-' + String(count).padStart(5, '0');
  } finally { lock.releaseLock(); }
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
  } finally { lock.releaseLock(); }
}

function safe_(s) { return String(s).replace(/[\\/:*?"<>|]/g, '-').slice(0, 80); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(obj, callback) {
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) return json_({ ok: false, error: 'Invalid callback.' });
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
