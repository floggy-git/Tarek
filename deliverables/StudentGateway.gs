/**
 * TAREK RIJSCHOOL student gateway. Deploy as a SEPARATE standalone Apps Script
 * project, never in the spreadsheet's bound administration project.
 * Script Properties: SHEET_ID, FIREBASE_API_KEY, FIREBASE_PROJECT_ID,
 * FIREBASE_SERVICE_ACCOUNT_JSON, APP_ORIGIN, ADMIN_SECRET, GEMINI_API_KEY.
 * Web app: execute as owner, access anyone. Every callable operation authenticates.
 */

function gatewaySettings_() {
  var p = PropertiesService.getScriptProperties();
  var keys = ['SHEET_ID','FIREBASE_API_KEY','FIREBASE_PROJECT_ID','FIREBASE_SERVICE_ACCOUNT_JSON','APP_ORIGIN','ADMIN_SECRET'];
  var out = {};
  keys.forEach(function(k){out[k]=p.getProperty(k);if(!out[k])throw new Error('Gateway setting is missing: '+k);});
  return out;
}

function doGet(e) {
  var origin = gatewaySettings_().APP_ORIGIN;
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) throw new Error('Invalid app origin.');
  var bridge=String(e&&e.parameter&&e.parameter.bridge||'');
  if(!/^[0-9a-f-]{36}$/i.test(bridge))throw new Error('Invalid bridge request.');
  var html = '<!doctype html><meta charset="utf-8"><script>var ORIGIN='+JSON.stringify(origin)+';'+
    'var BRIDGE='+JSON.stringify(bridge)+';top.postMessage({tarekGateway:"ready",bridge:BRIDGE},ORIGIN);'+
    'window.addEventListener("message",function(e){if(e.origin!==ORIGIN||!e.data||e.data.tarekGateway!=="request")return;'+
    'var d=e.data;if(d.bridge!==BRIDGE)return;var run=google.script.run.withSuccessHandler(function(v){top.postMessage({tarekGateway:"reply",bridge:BRIDGE,id:d.id,ok:true,value:v},ORIGIN)}).withFailureHandler(function(err){top.postMessage({tarekGateway:"reply",bridge:BRIDGE,id:d.id,ok:false,error:String(err.message||err)},ORIGIN)});'+
    'if(d.action==="me")run.gatewayStudentMe(d.token);else if(d.action==="register")run.gatewayStudentRegister(d.token,d.profile);'+
    'else if(d.action==="chat")run.gatewayStudentChat(d.token,d.profile);'+
    'else if(d.action==="trainerMe")run.gatewayTrainerMe(d.token);'+
    'else top.postMessage({tarekGateway:"reply",bridge:BRIDGE,id:d.id,ok:false,error:"Unknown operation"},ORIGIN);'+
    '});</script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function gatewayUrlFetch_(url, method, data, bearer) {
  var res = UrlFetchApp.fetch(url, {method:method||'get',contentType:'application/json',
    payload:data===undefined?undefined:JSON.stringify(data),
    headers:bearer?{Authorization:'Bearer '+bearer}:{},muteHttpExceptions:true});
  if(res.getResponseCode()<200||res.getResponseCode()>299)throw new Error('Identity or spreadsheet operation failed ('+res.getResponseCode()+').');
  return JSON.parse(res.getContentText());
}

function gatewayEmail_(token) {
  if(typeof token!=='string'||token.length<100||token.length>5000)throw new Error('Invalid session.');
  var s=gatewaySettings_();
  var account=gatewayUrlFetch_('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(s.FIREBASE_API_KEY),'post',{idToken:token});
  var user=(account.users||[])[0];
  if(!user||!user.email||user.disabled)throw new Error('Inactive Firebase session.');
  return String(user.email).trim().toLowerCase();
}

function gatewayRows_(ss,name) {
  var sheet=ss.getSheetByName(name);
  if(!sheet||sheet.getLastRow()<1)throw new Error('Missing sheet: '+name);
  return sheet.getDataRange().getDisplayValues();
}

function gatewayDeletedHash_(email) {
  var bytes=Utilities.computeHmacSha256Signature(email.toLowerCase(),gatewaySettings_().ADMIN_SECRET);
  return bytes.map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');
}
function gatewayDeletedSheet_(ss) {
  var sh=ss.getSheetByName('DeletedStudents');
  if(!sh){sh=ss.insertSheet('DeletedStudents');sh.hideSheet();}
  return sh;
}
function gatewayWasDeleted_(ss,email) {
  var sh=ss.getSheetByName('DeletedStudents');
  if(!sh||sh.getLastRow()<1)return false;
  var hash=gatewayDeletedHash_(email);
  return sh.getRange(1,1,sh.getLastRow(),1).getDisplayValues().some(function(row){return row[0]===hash;});
}

function gatewayStudentMe(token) {
  var email=gatewayEmail_(token),ss=SpreadsheetApp.openById(gatewaySettings_().SHEET_ID);
  if(gatewayWasDeleted_(ss,email))throw new Error('Student was permanently deleted.');
  var students=gatewayRows_(ss,'Students'),h=students[0],emailCol=h.indexOf('Email'),idCol=h.indexOf('Student ID'),statusCol=h.indexOf('Status');
  if(emailCol<0||idCol<0||statusCol<0)throw new Error('Students headers are missing.');
  var matches=students.slice(1).filter(function(r){return String(r[emailCol]).toLowerCase()===email;});
  if(matches.length!==1||String(matches[0][statusCol]).toLowerCase()!=='active')throw new Error('Student is not active in the school register.');
  var row=matches[0],id=row[idCol],linked=['Lessons','Wallet'].map(function(name){
    var values=gatewayRows_(ss,name),sid=values[0].indexOf('Student ID');
    if(sid<0)throw new Error(name+' headers are missing.');
    return [values[0]].concat(values.slice(1).filter(function(r){return r[sid]===id;}));
  });
  var student={};h.forEach(function(key,index){if(key&&!/password|secret|token|hash/i.test(key))student[key]=row[index]||'';});
  return {success:true,student:student,lessons:linked[0],wallet:linked[1]};
}

function gatewayTrainerMe(token) {
  var email=gatewayEmail_(token),ss=SpreadsheetApp.openById(gatewaySettings_().SHEET_ID);
  var rows=gatewayRows_(ss,'Trainers'),h=rows[0];
  var emailCol=h.indexOf('Email'),statusCol=h.indexOf('Status'),idCol=h.indexOf('Trainer ID');
  if(emailCol<0||statusCol<0||idCol<0)throw new Error('Trainers headers are missing.');
  var matches=rows.slice(1).filter(function(row){return String(row[emailCol]).trim().toLowerCase()===email;});
  if(matches.length!==1||String(matches[0][statusCol]).trim().toLowerCase()!=='active')
    throw new Error('Trainer is not active in the school register.');
  var trainer={};
  h.forEach(function(key,index){if(key&&!/password|secret|token|hash/i.test(key))trainer[key]=matches[0][index]||'';});
  return {success:true,trainer:trainer};
}

function gatewayStudentChat(token,input) {
  var profile=gatewayStudentMe(token).student;
  var key=PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if(!key)throw new Error('Gemini API key is not configured in the student gateway.');
  var message=String(input&&input.message||'').trim();
  if(!message||message.length>1800)throw new Error('Message must be between 1 and 1800 characters.');
  var cache=CacheService.getScriptCache(),bucket='chat-'+gatewayDeletedHash_(String(profile.Email||''));
  if(cache.get(bucket))throw new Error('Wait a few seconds before sending another message.');
  cache.put(bucket,'1',8);
  var language=['ar','nl','en'].indexOf(input.lang)>=0?input.lang:'nl';
  var history=Array.isArray(input.history)?input.history.slice(-6).map(function(item){return {role:item.sender==='assistant'?'model':'user',parts:[{text:String(item.text||'').slice(0,800)}]};}):[];
  var parts=[{text:message}],image=String(input.image||'');
  var match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if(image&&!match)throw new Error('Unsupported image format.');
  if(match){if(match[2].length>1400000)throw new Error('Image is too large.');parts.push({inlineData:{mimeType:match[1],data:match[2]}});}
  var request={systemInstruction:{parts:[{text:'You are TAREK RIJSCHOOL driving coach. Answer only questions about Dutch driving lessons and traffic rules. Reply in '+language+'. Never invent legal requirements; advise checking CBR or official rules when uncertain. Student: '+String(profile.Name||'').slice(0,100)+'.'}]},contents:history.concat([{role:'user',parts:parts}]),generationConfig:{maxOutputTokens:700,temperature:0.25}};
  var response=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',{method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},payload:JSON.stringify(request),muteHttpExceptions:true});
  if(response.getResponseCode()!==200)throw new Error('AI service unavailable ('+response.getResponseCode()+').');
  var json=JSON.parse(response.getContentText());
  var reply=((json.candidates||[])[0]||{}).content;
  var result=reply&&reply.parts?reply.parts.map(function(p){return p.text||'';}).join('').trim():'';
  if(!result)throw new Error('AI service returned an empty reply.');
  return {reply:result};
}

function gatewayStudentRegister(token,profile) {
  var email=gatewayEmail_(token),name=String(profile&&profile.name||'').trim().slice(0,100);
  if(!name)throw new Error('Student name is required.');
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    var ss=SpreadsheetApp.openById(gatewaySettings_().SHEET_ID),sh=ss.getSheetByName('Students'),values=gatewayRows_(ss,'Students');
    if(gatewayWasDeleted_(ss,email))throw new Error('This student cannot register again.');
    if(values[0][0]!=='Student ID'||values[0][2]!=='Email')throw new Error('Students headers are missing.');
    var existing=values.slice(1).filter(function(r){return String(r[2]).toLowerCase()===email;});
    if(existing.length)return {success:true,studentId:existing[0][0]};
    var next=values.slice(1).reduce(function(n,r){var m=/^ST-(\d{6})$/.exec(String(r[0]));return Math.max(n,m?Number(m[1]):0);},0)+1;
    var id='ST-'+String(next).padStart(6,'0');
    var clean=function(x){var v=String(x||'').trim().slice(0,200);return /^[=+@-]/.test(v)?"'"+v:v;};
    sh.appendRow([id,clean(name),email,clean(profile.phone),clean(profile.dob),clean(profile.city),clean(profile.currentPackage),0,0,'active',clean(profile.theoryExamStatus),'']);
    return {success:true,studentId:id};
  } finally {lock.releaseLock();}
}

function gatewayServiceToken_() {
  var s=gatewaySettings_(),account=JSON.parse(s.FIREBASE_SERVICE_ACCOUNT_JSON);
  if(account.project_id!==s.FIREBASE_PROJECT_ID)throw new Error('Firebase project mismatch.');
  var cache=CacheService.getScriptCache(),cached=cache.get('gateway-firebase-admin-token');
  if(cached)return cached;
  var now=Math.floor(Date.now()/1000),b64=function(value){return Utilities.base64EncodeWebSafe(JSON.stringify(value)).replace(/=+$/,'');};
  var unsigned=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iss:account.client_email,scope:'https://www.googleapis.com/auth/identitytoolkit',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
  var signature=Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(unsigned,account.private_key)).replace(/=+$/,'');
  var response=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{method:'post',payload:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+signature},muteHttpExceptions:true});
  if(response.getResponseCode()!==200)throw new Error('Firebase administrative authorization failed.');
  var token=JSON.parse(response.getContentText()).access_token;cache.put('gateway-firebase-admin-token',token,2700);return token;
}

function gatewayAdmin_(route,body) {
  var s=gatewaySettings_(),email=String(body.email||'').trim().toLowerCase(),name=String(body.name||'').trim(),project=encodeURIComponent(s.FIREBASE_PROJECT_ID);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Invalid email.');
  var token=gatewayServiceToken_(),base='https://identitytoolkit.googleapis.com/v1/';
  var lookup=function(which){var result=gatewayUrlFetch_(base+'accounts:lookup','post',{email:[which],targetProjectId:s.FIREBASE_PROJECT_ID},token);return (result.users||[]).filter(function(u){return String(u.email||'').toLowerCase()===which;});};
  if(route==='/api/admin/create-student-auth'){
    if(!name||String(body.password||'').length<6)throw new Error('Student name or password is invalid.');
    if(gatewayWasDeleted_(SpreadsheetApp.openById(s.SHEET_ID),email))throw new Error('Deleted students cannot register again.');
    gatewayUrlFetch_(base+'projects/'+project+'/accounts','post',{email:email,displayName:name,password:body.password,disabled:false},token);
    return {success:true};
  }
  if(route==='/api/admin/sync-student-auth'){
    var old=String(body.oldEmail||'').trim().toLowerCase(),users=lookup(old);
    if(users.length!==1||!name)throw new Error('Student account not found uniquely.');
    if(email!==old&&gatewayWasDeleted_(SpreadsheetApp.openById(s.SHEET_ID),email))throw new Error('This email belongs to a deleted student.');
    var changes={localId:users[0].localId,email:email,displayName:name};
    if(body.password){if(String(body.password).length<6)throw new Error('Password too short.');changes.password=body.password;}
    gatewayUrlFetch_(base+'projects/'+project+'/accounts:update','post',changes,token);return {success:true};
  }
  if(route==='/api/admin/delete-student-auth'){
    var ss=SpreadsheetApp.openById(s.SHEET_ID),rows=gatewayRows_(ss,'Students'),h=rows[0],idCol=h.indexOf('Student ID'),emailCol=h.indexOf('Email');
    if(!/^ST-\d{6}$/.test(String(body.studentId||''))||rows.slice(1).filter(function(r){return r[idCol]===body.studentId&&String(r[emailCol]).toLowerCase()===email;}).length!==1)throw new Error('Student identity mismatch.');
    var users=lookup(email);
    if(users.length>1)throw new Error('Ambiguous Firebase account.');
    // The spreadsheet administrator removes linked rows only after this succeeds.
    // Login remains blocked immediately by marking the student inactive first.
    var studentRow=rows.findIndex(function(r,i){return i>0&&r[idCol]===body.studentId;})+1;
    var statusCol=h.indexOf('Status');if(statusCol<0)throw new Error('Status column is missing.');
    var deletedSheet=gatewayDeletedSheet_(ss),hash=gatewayDeletedHash_(email),newHash=!gatewayWasDeleted_(ss,email);
    if(newHash)deletedSheet.appendRow([hash]);
    ss.getSheetByName('Students').getRange(studentRow,statusCol+1).setValue('inactive');
    try {if(users.length)gatewayUrlFetch_(base+'projects/'+project+'/accounts:delete','post',{localId:users[0].localId},token);}
    catch(err){ss.getSheetByName('Students').getRange(studentRow,statusCol+1).setValue('active');if(newHash){var last=deletedSheet.getLastRow();if(last&&deletedSheet.getRange(last,1).getDisplayValue()===hash)deletedSheet.deleteRow(last);}throw err;}
    return {success:true,state:users.length?'deleted':'missing',studentId:body.studentId};
  }
  if(route==='/api/webhooks/sheets-change')return {success:true};
  throw new Error('Unsupported administration operation.');
}

function doPost(e) {
  var s=gatewaySettings_(),response;
  try {
    var request=JSON.parse(String(e&&e.postData&&e.postData.contents||'{}'));
    var ts=String(request.timestamp||''),route=String(request.route||''),body=request.body;
    if(!/^\d{13}$/.test(ts)||Math.abs(Date.now()-Number(ts))>300000||!body||typeof body!=='object')throw new Error('Invalid administrator request.');
    var text=ts+'.'+route+'.'+JSON.stringify(body),bytes=Utilities.computeHmacSha256Signature(text,s.ADMIN_SECRET);
    var expected=bytes.map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');
    if(expected!==String(request.signature||''))throw new Error('Invalid administrator signature.');
    response=gatewayAdmin_(route,body);
  } catch(err) {response={success:false,error:String(err.message||err)};}
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}
