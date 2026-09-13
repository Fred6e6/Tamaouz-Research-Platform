const CONFIG = {
  SPREADSHEET_ID: '1EbUimq4QLy5S7MPe9JxPeBx7uYIOA_orX775sWOR9iA',
  SHEET_NAME: 'Complaints'
};

const COMPLAINT_STATUSES = ['New','Under Review','In Progress','Resolved','Closed'];

function setupComplaints() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  const headers = ['Complaint ID','Created At','Type','Full Name','Email','Mobile','Request ID','Subject','Message','Language','Status','Admin Notes'];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  if (!PropertiesService.getScriptProperties().getProperty('COMPLAINT_COUNTER')) {
    PropertiesService.getScriptProperties().setProperty('COMPLAINT_COUNTER', String(Math.max(0, sheet.getLastRow() - 1)));
  }
  SpreadsheetApp.flush();
  return 'Tamaouz complaints API is ready';
}

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = String(p.action || '');
    const callback = String(p.callback || '');
    let result;
    if (action === 'getComplaints') {
      result = getComplaints_(p.adminPassword);
    } else if (action === 'getComplaint') {
      result = getComplaint_(p.complaintId, p.email);
    } else if (action === 'updateComplaintStatus') {
      result = updateComplaintStatus_(p.complaintId, p.status, p.adminNotes, p.adminPassword);
    } else {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
      result = {ok:true, service:'Tamaouz Complaints API', sheet:sheet ? sheet.getName() : null, rows:sheet ? sheet.getLastRow() : 0};
    }
    return callback ? jsonp_(result, callback) : json_(result);
  } catch (err) {
    const result = {ok:false, error:String(err.message || err)};
    const callback = e && e.parameter ? String(e.parameter.callback || '') : '';
    return callback ? jsonp_(result, callback) : json_(result);
  }
}

function doPost(e) {
  try {
    const raw = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);
    if (data.action !== 'submitComplaint') throw new Error('Unsupported action');
    return json_(submitComplaint_(data));
  } catch (err) {
    return json_({ok:false, error:String(err.message || err)});
  }
}

function submitComplaint_(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    setupComplaints();
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  }
  const id = createComplaintId_();
  sheet.appendRow([id,new Date(),data.type || '',data.fullName || '',data.email || '',data.mobile || '',data.requestId || '',data.subject || '',data.message || '',data.language || 'ar','New','']);
  SpreadsheetApp.flush();
  return {ok:true, complaintId:id, status:'New'};
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

function getComplaint_(complaintId, email) {
  const id = String(complaintId || '').trim().toUpperCase();
  const userEmail = String(email || '').trim().toLowerCase();
  if (!id || !userEmail) return {ok:false,error:'Complaint ID and email are required.'};
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return {ok:false,error:'Complaint not found.'};
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = {};
  headers.forEach((h,i) => idx[String(h)] = i);
  for (let i=1;i<values.length;i++) {
    const rowId = String(values[i][idx['Complaint ID']] || '').trim().toUpperCase();
    const rowEmail = String(values[i][idx['Email']] || '').trim().toLowerCase();
    if (rowId === id && rowEmail === userEmail) {
      const created = values[i][idx['Created At']];
      return {ok:true, complaint:{
        complaintId:rowId,
        createdAt:created instanceof Date ? created.toISOString() : String(created || ''),
        type:String(values[i][idx['Type']] || ''),
        subject:String(values[i][idx['Subject']] || ''),
        status:String(values[i][idx['Status']] || 'New'),
        adminNotes:String(values[i][idx['Admin Notes']] || '')
      }};
    }
  }
  return {ok:false,error:'Complaint not found.'};
}

function getComplaints_(adminPassword) {
  if (!isAdmin_(adminPassword)) return {ok:false, error:'Unauthorized.'};
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return {ok:true, count:0, complaints:[]};
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idx = {};
  headers.forEach((h,i) => idx[String(h)] = i);
  const complaints = values.slice(1).map(row => ({
    complaintId:String(row[idx['Complaint ID']] || ''),
    createdAt:row[idx['Created At']] instanceof Date ? row[idx['Created At']].toISOString() : String(row[idx['Created At']] || ''),
    type:String(row[idx['Type']] || ''),
    fullName:String(row[idx['Full Name']] || ''),
    email:String(row[idx['Email']] || ''),
    mobile:String(row[idx['Mobile']] || ''),
    requestId:String(row[idx['Request ID']] || ''),
    subject:String(row[idx['Subject']] || ''),
    message:String(row[idx['Message']] || ''),
    language:String(row[idx['Language']] || ''),
    status:String(row[idx['Status']] || 'New'),
    adminNotes:String(row[idx['Admin Notes']] || '')
  }));
  complaints.sort((a,b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
  return {ok:true, count:complaints.length, complaints:complaints};
}

function updateComplaintStatus_(complaintId,status,adminNotes,adminPassword) {
  if (!isAdmin_(adminPassword)) return {ok:false,error:'Unauthorized.'};
  const id = String(complaintId || '').trim().toUpperCase();
  const cleanStatus = String(status || '').trim();
  if (!id || COMPLAINT_STATUSES.indexOf(cleanStatus) === -1) return {ok:false,error:'Invalid complaint ID or status.'};
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return {ok:false,error:'Complaint not found.'};
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('Complaint ID');
  const statusIndex = headers.indexOf('Status');
  const notesIndex = headers.indexOf('Admin Notes');
  for (let i=1;i<values.length;i++) {
    const rowId = String(values[i][idIndex] || '').trim().toUpperCase();
    if (rowId === id) {
      sheet.getRange(i+1,statusIndex+1).setValue(cleanStatus);
      if (notesIndex !== -1) sheet.getRange(i+1,notesIndex+1).setValue(String(adminNotes || ''));
      SpreadsheetApp.flush();
      return {ok:true,complaintId:id,status:cleanStatus,adminNotes:String(adminNotes || '')};
    }
  }
  return {ok:false,error:'Complaint not found.'};
}

function isAdmin_(password) {
  const stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return !!stored && String(password || '') === stored;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(obj,callback) {
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(?:\.[0-9A-Za-z_$]*)*$/.test(callback)) return json_({ok:false,error:'Invalid callback.'});
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function setAdminPassword() {
  throw new Error('Use Script Properties to set ADMIN_PASSWORD.');
}
