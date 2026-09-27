const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const source = fs.readFileSync(require('node:path').join(__dirname, '../deliverables/StudentGateway.gs'), 'utf8');

function makeGateway() {
  const rows = {
    Students: [['Student ID','Name','Email','Phone','Date of Birth','City','Current Package','Balance (€)','Exam Readiness (%)','Status','Theory Exam Status','Drive Folder ID'],
      ['ST-000001','A','a@example.com','','','','',0,0,'active','',''],
      ['ST-000002','B','b@example.com','','','','',0,0,'active','','']],
    Lessons: [['Lesson ID','Student ID','Student Name'],['L1','ST-000001','A'],['L2','ST-000002','B']],
    Wallet: [['Transaction ID','Student ID','Student Name'],['T1','ST-000001','A'],['T2','ST-000002','B']],
    Trainers: [['Trainer ID','Name','Email','Status','Password'],['TR-01','Trainer A','coach@example.com','active','private'],['TR-02','Trainer B','other@example.com','inactive','private']]
  };
  const sheets = {getSheetByName(name) { const values=rows[name];return values && {
    getLastRow:()=>values.length,getDataRange:()=>({getDisplayValues:()=>values}),
    appendRow:r=>values.push(r),getRange:(row,col)=>({setValue:value=>{values[row-1][col-1]=value;},getDisplayValue:()=>values[row-1][col-1]})
  };},insertSheet(name){ rows[name]=[];return{appendRow:r=>rows[name].push(r),hideSheet(){}};}};
  const context={Date,JSON,String,Number,Math,RegExp,Error,SpreadsheetApp:{openById:()=>sheets},
    PropertiesService:{getScriptProperties:()=>({getProperty:name=>({SHEET_ID:'sheet',FIREBASE_API_KEY:'key',FIREBASE_PROJECT_ID:'project',FIREBASE_SERVICE_ACCOUNT_JSON:'{}',APP_ORIGIN:'https://example.com',ADMIN_SECRET:'secret'})[name]})},
    UrlFetchApp:{fetch:(url)=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({users:[{email:url.includes('lookup')?'a@example.com':'',localId:'uid'}]})})},
    Utilities:{computeHmacSha256Signature:(data,key)=>[...crypto.createHmac('sha256',key).update(data).digest()].map(v=>v>127?v-256:v)}
  };
  vm.createContext(context);new vm.Script(source).runInContext(context);
  return {context,rows};
}

test('student dossier cannot contain another student’s lesson or payment',()=>{
  const {context}=makeGateway();
  context.gatewayEmail_=()=> 'a@example.com';
  const result=context.gatewayStudentMe('verified-token');
  assert.equal(result.student['Student ID'],'ST-000001');
  assert.equal(result.lessons.length,2);
  assert.equal(result.wallet.length,2);
  assert.equal(result.lessons[1][0],'L1');
  assert.equal(result.wallet[1][0],'T1');
});

test('inactive and missing student profiles cannot be read',()=>{
  const {context,rows}=makeGateway();context.gatewayEmail_=()=> 'a@example.com';
  rows.Students[1][9]='inactive';
  assert.throws(()=>context.gatewayStudentMe('verified-token'),/not active/);
  context.gatewayEmail_=()=> 'unknown@example.com';
  assert.throws(()=>context.gatewayStudentMe('verified-token'),/not active/);
});

test('trainer access requires an active matching email and never exposes password',()=>{
  const {context}=makeGateway();context.gatewayEmail_=()=> 'coach@example.com';
  const result=context.gatewayTrainerMe('verified-token');
  assert.equal(result.trainer['Trainer ID'],'TR-01');
  assert.equal(result.trainer.Password,undefined);
  context.gatewayEmail_=()=> 'other@example.com';
  assert.throws(()=>context.gatewayTrainerMe('verified-token'),/not active/);
  context.gatewayEmail_=()=> 'outsider@example.com';
  assert.throws(()=>context.gatewayTrainerMe('verified-token'),/not active/);
});

test('student registration is idempotent and never writes a password to the sheet',()=>{
  const {context,rows}=makeGateway();context.gatewayEmail_=()=> 'new@example.com';
  context.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};
  const profile={name:'New Student',password:'should-never-save',phone:'123'};
  const first=context.gatewayStudentRegister('verified-token',profile);
  const second=context.gatewayStudentRegister('verified-token',profile);
  assert.equal(first.studentId,second.studentId);
  assert.equal(rows.Students.length,4);
  assert.equal(JSON.stringify(rows.Students).includes(profile.password),false);
});

test('gateway rejects forged administrative requests before any account operation',()=>{
  const {context,rows}=makeGateway();
  context.ContentService={MimeType:{JSON:'JSON'},createTextOutput:text=>({setMimeType(){return{text};}})};
  const response=context.doPost({postData:{contents:JSON.stringify({
    timestamp:String(Date.now()),route:'/api/admin/delete-student-auth',
    body:{studentId:'ST-000001',email:'a@example.com'},signature:'forged'
  })}});
  assert.equal(JSON.parse(response.text).success,false);
  assert.equal(rows.Students[1][9],'active');
});

test('browser bridge binds responses to the configured origin and request nonce',()=>{
  const {context}=makeGateway();
  context.HtmlService={XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},createHtmlOutput:html=>({setXFrameOptionsMode(){return {html};}})};
  const html=context.doGet({parameter:{bridge:'3aa80bba-2ce7-4daa-b401-39c112609e10'}}).html;
  assert.match(html,/https:\/\/example\.com/);
  assert.match(html,/3aa80bba-2ce7-4daa-b401-39c112609e10/);
  assert.match(html,/e\.origin!==ORIGIN/);
  assert.throws(()=>context.doGet({parameter:{bridge:'invalid'}}),/Invalid bridge/);
});
