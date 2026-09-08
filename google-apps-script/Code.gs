const CONFIG = {
  SHEET_NAME: 'Requests',
  DRIVE_FOLDER_NAME: 'Tamaouz Requests',
  STATUS: 'Submitted'
};

function setupTamaouz() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  const headers = ['Request ID','Created At','Request Type','Full Name','Academic / Job Title','University / Workplace','College / Department','Academic Level','City','Country','Email','Mobile','Project Title','Pages','References','Citation Style','Deadline','Topic','Instructions','Dynamic Requirements','Files','Status'];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('DRIVE_FOLDER_ID')) {
    const folder = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  }
  if (!props.getProperty('REQUEST_COUNTER')) {
    props.setProperty('REQUEST_COUNTER', String(Math.max(0, sheet.getLastRow() - 1)));
  }
  return 'Tamaouz backend is ready';
}

function doGet() {
  return json_({ok:true,service:'Tamaouz API'});
}

function doPost(e) {
  try {
    const raw = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(raw);
    if (data.action !== 'submitRequest') throw new Error('Unsupported action');
    setupTamaouz();
    const id = createRequestId_();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
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
    sheet.appendRow([id,new Date(),data.requestType||'',data.fullName||'',data.title||'',data.workplace||'',data.department||'',data.level||'',data.city||'',data.country||'',data.email||'',data.mobile||'',data.projectTitle||'',data.pages||'',data.references||'',data.citation||'',data.deadline||'',data.topic||'',data.instructions||'',JSON.stringify(data.dynamicRequirements||{}),fileLinks.join('\n'),CONFIG.STATUS]);
    return json_({ok:true,requestId:id,status:CONFIG.STATUS,folderUrl:requestFolder.getUrl()});
  } catch(err) {
    return json_({ok:false,error:String(err.message || err)});
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
    return 'TM-' + year + '-' + String(count).padStart(5,'0');
  } finally { lock.releaseLock(); }
}
function safe_(s){ return String(s).replace(/[\\/:*?"<>|]/g,'-').slice(0,80); }
function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }