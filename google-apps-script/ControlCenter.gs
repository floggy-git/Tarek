/* TAREK RIJSCHOOL — Google Sheets Master Control Center. */

var CONTROL_CENTER_SHEETS = {
  students: 'Students', lessons: 'Lessons', packages: 'Packages', invoices: 'Invoices',
  payments: 'Wallet', notifications: 'Notifications', settings: 'SchoolSettings', audit: 'AuditLogs'
};
var CONTROL_CENTER_IDS = {
  students:{header:'Student ID',prefix:'STD-',width:6}, lessons:{header:'Lesson ID',prefix:'LES-',width:6},
  packages:{header:'id',prefix:'PKG-',width:6}, invoices:{header:'Invoice ID',prefix:'INV-'+new Date().getFullYear()+'-',width:3},
  payments:{header:'Transaction ID',prefix:'TX-',width:6}, notifications:{header:'Notification ID',prefix:'NOT-',width:6}
};

function controlCenterHtml(){return HtmlService.createHtmlOutputFromFile('ControlCenter').setTitle('TAREK RIJSCHOOL — Master Control Center').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
function controlCenterOpen(){SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('ControlCenter').setTitle('TAREK RIJSCHOOL Control Center'));}

function controlCenterGetData(){
  var ss=SpreadsheetApp.getActiveSpreadsheet(), settingsRows=controlCenterRows_(ss,CONTROL_CENTER_SHEETS.settings);
  return {generatedAt:new Date().toISOString(),dashboard:controlCenterDashboard_(ss),students:controlCenterRows_(ss,'Students'),lessons:controlCenterRows_(ss,'Lessons'),trainers:controlCenterTrainerRows_(settingsRows),packages:controlCenterRows_(ss,'Packages'),invoices:controlCenterRows_(ss,'Invoices'),payments:controlCenterRows_(ss,'Wallet'),notifications:controlCenterRows_(ss,'Notifications'),settings:settingsRows,audit:controlCenterRows_(ss,'AuditLogs').slice(-100).reverse(),schemas:controlCenterSchemas_(ss)};
}
function controlCenterSchemas_(ss){var out={};Object.keys(CONTROL_CENTER_SHEETS).forEach(function(k){var sh=ss.getSheetByName(CONTROL_CENTER_SHEETS[k]);out[k]=sh&&sh.getLastColumn()?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];});out.trainers=['Instructor Name','Phone','Email','Primary Vehicle','Lesson Price Per Hour'];return out;}
function controlCenterDashboard_(ss){
  var students=controlCenterRows_(ss,'Students'),lessons=controlCenterRows_(ss,'Lessons'),payments=controlCenterRows_(ss,'Wallet'),invoices=controlCenterRows_(ss,'Invoices'),today=controlCenterDateKey_(new Date()),month=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM');
  var activeStudents=students.filter(function(r){return ['active','actief','true',''].indexOf(String(r.status||'').toLowerCase())!==-1;}).length;
  var todayLessons=lessons.filter(function(r){return controlCenterDateKey_(r.date)===today;}).length;
  var upcomingLessons=lessons.filter(function(r){var d=controlCenterDateKey_(r.date);return d&&d>=today&&String(r.status||'').toLowerCase()!=='cancelled';}).length;
  var monthlyRevenue=payments.reduce(function(sum,r){var d=controlCenterDateKey_(r.date||r.timestamp),amount=Number(r.amount||0),type=String(r.type||'').toLowerCase();return d.indexOf(month)===0&&amount>0&&type!=='payment'?sum+amount:sum;},0);
  var outstandingBalance=students.reduce(function(sum,r){var b=Number(r.balance||0);return b<0?sum+Math.abs(b):sum;},0);
  return {totalStudents:students.length,activeStudents:activeStudents,todayLessons:todayLessons,upcomingLessons:upcomingLessons,monthlyRevenue:monthlyRevenue,outstandingBalance:outstandingBalance,totalInvoices:invoices.length,lastSync:new Date().toISOString()};
}
function controlCenterRows_(ss,sheetName){
  var sh=ss.getSheetByName(sheetName);if(!sh||sh.getLastRow()<1||sh.getLastColumn()<1)return[];
  var values=sh.getDataRange().getValues(),headers=values[0].map(function(h){return String(h||'').trim();});
  return values.slice(1).filter(function(row){return row.some(function(v){return v!=='';});}).map(function(row,index){var o={_row:index+2,_sheet:sheetName};headers.forEach(function(h,i){if(h)o[h]=controlCenterSerializable_(row[i]);});o.id=controlCenterFirst_(o,['ID','Id','id','Student ID','Trainer ID','Lesson ID','Booking ID','Invoice ID','Transaction ID','Notification ID']);o.studentId=controlCenterFirst_(o,['Student ID','studentId','student_id']);o.name=controlCenterFirst_(o,['Name','Full Name','Student Name','studentName']);o.email=controlCenterFirst_(o,['Email','email','Student Email','Email Address']);o.phone=controlCenterFirst_(o,['Phone','phone','Telephone']);o.date=controlCenterFirst_(o,['Date','date','Lesson Date','Invoice Date','Transaction Date','Date Issued']);o.time=controlCenterFirst_(o,['Time','time','Lesson Time']);o.status=controlCenterFirst_(o,['Status','status','Read Status','isActive']);o.amount=controlCenterFirst_(o,['Amount (€)','Amount','amount','Price (€)','Price','price','Total','Grand Total']);o.balance=controlCenterFirst_(o,['Balance (€)','Balance','balance','Outstanding']);o.type=controlCenterFirst_(o,['Type','type']);o.desc=controlCenterFirst_(o,['Description','description','Message']);return o;});
}
function controlCenterTrainerRows_(rows){if(!rows||!rows.length)return[];var s=rows[0],name=s.instructorName||'';if(!name&&!s.email&&!s.phone)return[];return[{id:'PRIMARY-INSTRUCTOR',name:name,email:s.email||'',phone:s.phone||'',vehicle:s.primaryVehicle||'',hourlyRate:s.lessonPricePerHour||'',status:name?'active':'inactive'}];}
function controlCenterSerializable_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'):v;}
function controlCenterFirst_(o,keys){for(var i=0;i<keys.length;i++){var k=keys[i];if(Object.prototype.hasOwnProperty.call(o,k)&&o[k]!=='')return o[k];}return'';}
function controlCenterDateKey_(v){if(!v)return'';var d=v instanceof Date?v:new Date(v);if(isNaN(d.getTime()))return String(v).slice(0,10);return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd');}

function controlCenterSaveRecord(section,data){
  if(!data||typeof data!=='object')throw new Error('Record data is required.');
  if(section==='trainers')return controlCenterSaveTrainer_(data);if(section==='settings')return controlCenterSaveSettings_(data);
  var cfg=controlCenterSectionConfig_(section),ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(cfg.sheet);if(!sh)throw new Error(cfg.sheet+' sheet is missing.');
  var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim();}),id=String(data[cfg.idHeader]||data.id||'').trim();if(!id)id=controlCenterNextId_(sh,cfg.idHeader,cfg.prefix,cfg.width);data[cfg.idHeader]=id;controlCenterValidateRecord_(section,data);
  var found=controlCenterFindRowById_(sh,headers,cfg.idHeader,id),previous=found.row>1?sh.getRange(found.row,1,1,headers.length).getDisplayValues()[0]:null,values=headers.map(function(h){return controlCenterSanitizeCell_(Object.prototype.hasOwnProperty.call(data,h)?data[h]:'');});
  if(found.row>1)sh.getRange(found.row,1,1,headers.length).setValues([values]);else sh.appendRow(values);
  controlCenterAudit_((found.row>1?'Update ':'Create ')+section,id,previous?JSON.stringify(previous):'',JSON.stringify(values));return{success:true,id:id,created:found.row<2};
}
function controlCenterDeleteRecord(section,id){
  if(['settings','trainers'].indexOf(section)!==-1)throw new Error('This record cannot be deleted from the Control Center.');
  var cfg=controlCenterSectionConfig_(section),ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(cfg.sheet);if(!sh)throw new Error(cfg.sheet+' sheet is missing.');
  var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim();}),found=controlCenterFindRowById_(sh,headers,cfg.idHeader,id);if(found.row<2)throw new Error('Record not found.');var previous=sh.getRange(found.row,1,1,headers.length).getDisplayValues()[0];sh.deleteRow(found.row);controlCenterAudit_('Delete '+section,String(id),JSON.stringify(previous),'DELETED');return{success:true,id:id};
}
function controlCenterSaveTrainer_(data){var m={instructorName:data['Instructor Name']||data.name||'',phone:data.Phone||data.phone||'',email:data.Email||data.email||'',primaryVehicle:data['Primary Vehicle']||data.vehicle||'',lessonPricePerHour:data['Lesson Price Per Hour']||data.hourlyRate||''};if(!String(m.instructorName).trim())throw new Error('Instructor name is required.');return controlCenterSaveSettings_(m,'Update instructor');}
function controlCenterSaveSettings_(data,auditAction){var ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName('SchoolSettings');if(!sh)throw new Error('SchoolSettings sheet is missing.');var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim();}),old=sh.getLastRow()>=2?sh.getRange(2,1,1,headers.length).getDisplayValues()[0]:headers.map(function(){return'';}),next=headers.map(function(h,i){return Object.prototype.hasOwnProperty.call(data,h)?controlCenterSanitizeCell_(data[h]):old[i];});if(sh.getLastRow()>=2)sh.getRange(2,1,1,headers.length).setValues([next]);else sh.appendRow(next);controlCenterAudit_(auditAction||'Update settings','SchoolSettings',JSON.stringify(old),JSON.stringify(next));return{success:true,id:'SchoolSettings'};}
function controlCenterSectionConfig_(s){var ids=CONTROL_CENTER_IDS[s],sheet=CONTROL_CENTER_SHEETS[s];if(!ids||!sheet)throw new Error('Unsupported Control Center section: '+s);return{sheet:sheet,idHeader:ids.header,prefix:ids.prefix,width:ids.width};}
function controlCenterFindRowById_(sh,headers,idHeader,id){var idx=headers.indexOf(idHeader);if(idx<0)throw new Error('Required ID column "'+idHeader+'" is missing from '+sh.getName()+'.');if(sh.getLastRow()<2)return{row:-1,index:idx};var ids=sh.getRange(2,idx+1,sh.getLastRow()-1,1).getDisplayValues();for(var i=0;i<ids.length;i++)if(String(ids[i][0])===String(id))return{row:i+2,index:idx};return{row:-1,index:idx};}
function controlCenterNextId_(sh,idHeader,prefix,width){var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim();}),idx=headers.indexOf(idHeader);if(idx<0)throw new Error('Required ID column "'+idHeader+'" is missing.');var max=0;if(sh.getLastRow()>=2)sh.getRange(2,idx+1,sh.getLastRow()-1,1).getDisplayValues().forEach(function(r){var v=String(r[0]||'');if(v.indexOf(prefix)===0){var n=parseInt(v.slice(prefix.length),10);if(!isNaN(n)&&n>max)max=n;}});return prefix+String(max+1).padStart(width,'0');}
function controlCenterValidateRecord_(section,data){function req(h,l){if(!String(data[h]||'').trim())throw new Error((l||h)+' is required.');}if(section==='students'){req('Name');req('Email');}if(section==='lessons'){req('Student ID');req('Date');req('Time');}if(section==='payments'){req('Student ID');if(!(Number(data['Amount (€)'])>0))throw new Error('Amount must be greater than zero.');}if(section==='invoices'){req('Student ID');req('Student Name');}if(section==='packages')req('name','Package name');if(section==='notifications'){req('Title');req('Message');}}
function controlCenterSanitizeCell_(v){if(v===null||typeof v==='undefined')return'';if(typeof v==='number'||typeof v==='boolean')return v;var s=String(v);if(/^[=+@]/.test(s)||(/^-/.test(s)&&!/^-?\d+(\.\d+)?$/.test(s)))return"'"+s;return s;}
function controlCenterAudit_(action,target,previousValue,newValue){var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLogs');if(!sh)return;var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim();}),now=new Date(),v={'Audit ID':'AUD-'+Date.now(),'User ID':'ADMIN-01','User Name':'System Administrator','User Role':'Admin','Action':action,'Changed By':'Master Control Center','Date':Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd'),'Time':Utilities.formatDate(now,Session.getScriptTimeZone(),'HH:mm:ss'),'Time Zone':Session.getScriptTimeZone(),'IP Address':'','Device / Browser':'','Target Record':target,'Previous Value':previousValue,'New Value':newValue,'Source':'Google Sheets Master Control Center'};sh.appendRow(headers.map(function(h){return Object.prototype.hasOwnProperty.call(v,h)?v[h]:'';}));}
function controlCenterMenu_(){SpreadsheetApp.getUi().createMenu('🚗 TAREK RIJSCHOOL').addItem('Open Master Control Center','controlCenterOpen').addItem('Refresh Control Center Data','controlCenterRefresh_').addToUi();}
function controlCenterRefresh_(){SpreadsheetApp.getActiveSpreadsheet().toast('Control Center data refreshed.','TAREK RIJSCHOOL',3);}
function onOpen(){controlCenterMenu_();}
