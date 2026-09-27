/**
 * TAREK RIJSCHOOL — One-file sheet sidebar buttons edition, 2026-09-25.
 * REPLACE the entire content of TarekControlCenter.gs with this file.
 * Keep only this one script file (do not also add SidebarForms.gs).
 * Save, select installSheetFormButtons in the editor, then Run once.
 * Reload the spreadsheet and click Students or New Student in the sheet.
 * Do NOT run controlCenterOpen or dashboard rebuild functions for installation.
 *
 * Installs 16 assigned-image buttons over A:C, rows 5–16 and 19–22.
 * Does not edit cell values, row heights, column widths, charts or A25 language.
 * Dashboard button stays on the sheet; other buttons open their own form/view.
 * removeSheetFormButtons removes only these overlays, revealing original cells.
 * Existing business operations and sync handlers are preserved in this file.
 * UI/button labels are English. Assigned-image actions target desktop Sheets.
 * Student balance is maintained via deposits; no password reset is implemented.
 * Existing lesson creation records the lesson without charging the wallet.
 * Existing invoice creation produces a Drive PDF; it does not send email.
 * Existing script-property webhook configuration is preserved; sync unverified.
 * Validated locally with mocks; live execution still requires verification.
 */

const TAREK_SINGLE_FILE_VERSION='2026-09-18';





/* ===== ControlCenter.gs ===== */

/* TAREK RIJSCHOOL — Google Sheets Master Control Center. */

var CONTROL_CENTER_SHEETS={students:'Students',lessons:'Lessons',trainers:'Trainers',trainerSchedule:'TrainerSchedule',packages:'Packages',invoices:'Invoices',payments:'Wallet',notifications:'Notifications',settings:'SchoolSettings',controlSettings:'ControlSettings',expenseCategories:'ExpenseCategories',expenses:'Expenses',availability:'Availability',documents:'Documents',audit:'AuditLogs',help:'Help & Support'};

var CONTROL_CENTER_IDS={students:{header:'Student ID',prefix:'ST-',width:6},lessons:{header:'Lesson ID',prefix:'LES-',width:6},trainers:{header:'Trainer ID',prefix:'TR-',width:6},packages:{header:'id',prefix:'PKG-',width:6},invoices:{header:'Invoice ID',prefix:'INV-'+new Date().getFullYear()+'-',width:3},payments:{header:'Transaction ID',prefix:'TX-',width:6},notifications:{header:'Notification ID',prefix:'NOT-',width:6},controlSettings:{header:'Key',prefix:'CFG-',width:6},expenseCategories:{header:'Category ID',prefix:'EXP-CAT-',width:4},expenses:{header:'Expense ID',prefix:'EXP-',width:6},availability:{header:'Availability ID',prefix:'AVL-',width:6},documents:{header:'Document ID',prefix:'DOC-',width:6},help:{header:'ID',prefix:'FAQ-',width:4}};

function controlCenterHtml(){return HtmlService.createHtmlOutput(TarekControlCenterUi_()).setTitle('TAREK RIJSCHOOL — Master Control Center').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)}

function controlCenterOpen(){var h=controlCenterHtml().setWidth(1280).setHeight(820);SpreadsheetApp.getUi().showModalDialog(h,'TAREK RIJSCHOOL — Master Control Center');}

function TarekControlCenterUi_(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css">

<style>

*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f4f7fb;color:#10243b}.app{display:grid;grid-template-columns:210px 1fr;min-height:760px}.side{background:#071d31;color:#fff;padding:18px 12px}.brand{font-weight:800;font-size:17px;line-height:1.05;padding:4px 8px 22px}.brand small{display:block;color:#8da4b9;font-size:9px;letter-spacing:1.6px;margin-top:6px}.nav{display:flex;flex-direction:column;gap:6px}.nav button{border:0;background:transparent;color:#c6d3df;text-align:left;padding:11px 12px;border-radius:8px;font-size:12px;cursor:pointer}.nav button i{width:22px}.nav button.active,.nav button:hover{background:#0d8cff;color:#fff}.student-filter{margin-top:20px;border-top:1px solid #173750;padding-top:16px}.student-filter label{display:block;font-size:10px;color:#8da4b9;margin:0 5px 7px}.student-filter select{width:100%;background:#0c2b45;color:#fff;border:1px solid #234963;border-radius:7px;padding:9px;font-size:11px}.main{padding:18px 20px;overflow:auto}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.top h1{font-size:20px;margin:0}.top p{font-size:10px;color:#75879a;margin:4px 0 0}.lang button{border:0;background:#e8eef5;padding:6px 9px;border-radius:6px;margin-left:3px;font-size:10px}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:11px;box-shadow:0 3px 12px #10243b0c}.kpi{padding:12px}.kpi .ico{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;margin-bottom:10px}.kpi label{display:block;color:#74879a;font-size:9px;font-weight:700}.kpi strong{display:block;font-size:20px;margin-top:5px}.c1 .ico{background:#e9f3ff;color:#1887f2}.c2 .ico{background:#e9fbf2;color:#18a56b}.c3 .ico{background:#fff2e5;color:#ef8b23}.c4 .ico{background:#f2eaff;color:#8b5cf6}.c5 .ico{background:#e9fbf2;color:#18a56b}.c6 .ico{background:#ffecef;color:#ef476f}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px}.panel{padding:13px;min-height:205px}.panel h3{font-size:11px;margin:0 0 12px}.wide{grid-column:span 1}.rows{font-size:10px}.row{display:grid;grid-template-columns:70px 1fr 1fr 80px;gap:8px;padding:8px 0;border-bottom:1px solid #edf1f5}.muted{color:#8192a3}.empty{color:#91a0ae;font-size:11px;padding:30px 0;text-align:center}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.actions button{border:1px solid #e1e8f0;background:#fff;border-radius:8px;padding:10px;text-align:left;font-size:10px;color:#18324b;cursor:pointer}.actions button i{margin-right:7px;color:#0d8cff}.statusline{height:8px;background:#edf1f5;border-radius:9px;overflow:hidden;margin:7px 0}.statusline span{display:block;height:100%;background:#0d8cff}.student{grid-column:1/-1;display:none}.student.show{display:block}.student-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.field{background:#f7f9fc;border-radius:8px;padding:9px}.field b{display:block;font-size:9px;color:#8192a3;margin-bottom:4px}.field span{font-size:11px}.loading{position:fixed;inset:0;background:#f4f7fb;display:grid;place-items:center;font-size:13px;z-index:5}

</style></head><body><div id="loading" class="loading"><i class="fa-solid fa-circle-notch fa-spin"></i>&nbsp; Loading live data…</div>

<div class="app"><aside class="side"><div class="brand"><i class="fa-solid fa-car-side"></i> TAREK RIJSCHOOL<small>DRIVE YOUR FUTURE</small></div>

<div class="nav">

<button class="active"><i class="fa-solid fa-house"></i>Dashboard</button><button onclick="action('student')"><i class="fa-solid fa-user"></i>Students</button><button onclick="action('lesson')"><i class="fa-solid fa-calendar-days"></i>Lessons</button><button onclick="action('trainer')"><i class="fa-solid fa-user-tie"></i>Trainers</button><button onclick="action('deposit')"><i class="fa-solid fa-wallet"></i>Finance</button><button><i class="fa-solid fa-file-invoice"></i>Invoices</button><button><i class="fa-solid fa-box"></i>Packages</button><button><i class="fa-solid fa-bell"></i>Notifications</button><button><i class="fa-solid fa-chart-column"></i>Reports</button><button><i class="fa-solid fa-gear"></i>Settings</button>

</div><div class="student-filter"><label><i class="fa-solid fa-magnifying-glass"></i> STUDENT FILTER</label><select id="studentSelect" onchange="showStudent(this.value)"><option value="">Select student</option></select></div></aside>

<main class="main"><div class="top"><div><h1>Master Control Center</h1><p>Students • Lessons • Trainers • Finance • Reports • Settings</p></div><div class="lang"><button>EN</button><button>NL</button><button>AR</button></div></div>

<div class="kpis" id="kpis"></div>

<div class="grid"><section class="card panel"><h3>LESSONS TODAY</h3><div id="today" class="rows"></div></section><section class="card panel"><h3>STUDENT GROWTH</h3><div id="growth"></div></section><section class="card panel"><h3>REVENUE OVERVIEW</h3><div id="revenue"></div></section>

<section class="card panel"><h3>RECENT ACTIVITY</h3><div id="activity" class="rows"></div></section><section class="card panel"><h3>QUICK ACTIONS</h3><div class="actions"><button onclick="action('student')"><i class="fa-solid fa-user-plus"></i>Add Student</button><button onclick="action('lesson')"><i class="fa-solid fa-calendar-plus"></i>Schedule Lesson</button><button onclick="action('trainer')"><i class="fa-solid fa-user-tie"></i>Add Trainer</button><button onclick="action('deposit')"><i class="fa-solid fa-money-bill-transfer"></i>Add Deposit</button></div></section><section class="card panel"><h3>STUDENTS BY STATUS</h3><div id="statuses"></div></section>

<section id="studentCard" class="card panel student"><h3>STUDENT DETAILS</h3><div id="studentDetails" class="student-grid"></div></section></div></main></div>

<script>

let DATA=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function money(v){return '€ '+(Number(v)||0).toFixed(2)}

function render(d){DATA=d;const k=d.dashboard||{};const items=[['fa-users','TOTAL STUDENTS',k.totalStudents,'c1'],['fa-user-check','ACTIVE STUDENTS',k.activeStudents,'c2'],['fa-calendar-day',"TODAY'S LESSONS",k.todayLessons,'c3'],['fa-calendar-check','UPCOMING',k.upcomingLessons,'c4'],['fa-euro-sign','MONTHLY REVENUE',money(k.monthlyRevenue),'c5'],['fa-triangle-exclamation','OUTSTANDING',money(k.outstandingBalance),'c6']];document.getElementById('kpis').innerHTML=items.map(x=>'<div class="card kpi '+x[3]+'"><div class="ico"><i class="fa-solid '+x[0]+'"></i></div><label>'+x[1]+'</label><strong>'+esc(x[2])+'</strong></div>').join('');

const today=new Date().toISOString().slice(0,10),less=(d.lessons||[]).filter(x=>String(x.date||'').slice(0,10)===today);document.getElementById('today').innerHTML=less.length?less.slice(0,6).map(x=>'<div class="row"><span>'+esc(x.time)+'</span><b>'+esc(x.name)+'</b><span>'+esc(x['Trainer Name']||'')+'</span><span>'+esc(x.status)+'</span></div>').join(''):'<div class="empty">No lessons today</div>';

document.getElementById('growth').innerHTML='<div class="empty"><i class="fa-solid fa-chart-line"></i><br><br>'+esc((d.students||[]).length)+' students in the current register</div>';document.getElementById('revenue').innerHTML='<div class="empty"><i class="fa-solid fa-chart-column"></i><br><br>'+money(k.monthlyRevenue)+' this month</div>';

document.getElementById('activity').innerHTML=(d.audit||[]).length?(d.audit||[]).slice(0,6).map(x=>'<div style="padding:7px 0;border-bottom:1px solid #edf1f5"><b>'+esc(x.Action||'Activity')+'</b><div class="muted">'+esc(x['Target Record']||x['Changed By']||'')+'</div></div>').join(''):'<div class="empty">No recent activity</div>';

const sts={};(d.students||[]).forEach(x=>{let s=String(x.Status||x.status||'Unknown');sts[s]=(sts[s]||0)+1});document.getElementById('statuses').innerHTML=Object.keys(sts).map(s=>'<div style="font-size:10px;margin:9px 0"><b>'+esc(s)+'</b> <span class="muted">'+sts[s]+'</span><div class="statusline"><span style="width:'+Math.min(100,sts[s]/Math.max(1,d.students.length)*100)+'%"></span></div></div>').join('')||'<div class="empty">No student data</div>';

const sel=document.getElementById('studentSelect');(d.students||[]).forEach(x=>{let o=document.createElement('option');o.value=x['Student ID']||x.id;o.textContent=x.Name||x.name||o.value;sel.appendChild(o)});document.getElementById('loading').style.display='none'}

function showStudent(id){const c=document.getElementById('studentCard');if(!id){c.classList.remove('show');return}google.script.run.withSuccessHandler(r=>{let s=r.student||{};document.getElementById('studentDetails').innerHTML=[['Student ID',s.id],['Name',s.name],['Email',s.email],['Phone',s.phone],['City',s.city],['Package',s.package],['Balance',money(s.balance)],['Exam Readiness',(Number(s.readiness)||0)+'%'],['Status',s.status],['Lessons',(r.bookings||[]).length],['Transactions',(r.transactions||[]).length]].map(x=>'<div class="field"><b>'+x[0]+'</b><span>'+esc(x[1])+'</span></div>').join('');c.classList.add('show');c.scrollIntoView({behavior:'smooth'})}).withFailureHandler(err=>alert(err.message||err)).apiGetStudentDashboard(id)}

function action(a){const fn={student:'TarekMasterAddStudent',lesson:'TarekMasterAddLesson',trainer:'TarekMasterAddTrainer',deposit:'TarekMasterAddDeposit'}[a];if(fn)google.script.run.withFailureHandler(err=>alert(err.message||err))[fn]()}

google.script.run.withSuccessHandler(render).withFailureHandler(err=>{document.getElementById('loading').textContent='Error: '+(err.message||err)}).controlCenterGetData();

</script></body></html>`}

function controlCenterGetData(){var ss=SpreadsheetApp.getActiveSpreadsheet();return{generatedAt:new Date().toISOString(),dashboard:controlCenterDashboard_(ss),students:controlCenterRows_(ss,'Students'),lessons:controlCenterRows_(ss,'Lessons'),trainers:controlCenterRows_(ss,'Trainers'),trainerSchedule:controlCenterRows_(ss,'TrainerSchedule'),packages:controlCenterRows_(ss,'Packages'),invoices:controlCenterRows_(ss,'Invoices'),payments:controlCenterRows_(ss,'Wallet'),notifications:controlCenterRows_(ss,'Notifications'),settings:controlCenterRows_(ss,'SchoolSettings'),controlSettings:controlCenterRows_(ss,'ControlSettings'),expenseCategories:controlCenterRows_(ss,'ExpenseCategories'),expenses:controlCenterRows_(ss,'Expenses'),availability:controlCenterRows_(ss,'Availability'),documents:controlCenterRows_(ss,'Documents'),audit:controlCenterRows_(ss,'AuditLogs').slice(-100).reverse(),schemas:controlCenterSchemas_(ss)}}

function controlCenterSchemas_(ss){var out={};Object.keys(CONTROL_CENTER_SHEETS).forEach(function(k){var sh=ss.getSheetByName(CONTROL_CENTER_SHEETS[k]);out[k]=sh&&sh.getLastColumn()?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[]});return out}

function controlCenterDashboard_(ss){var students=controlCenterRows_(ss,'Students'),lessons=controlCenterRows_(ss,'Lessons'),payments=controlCenterRows_(ss,'Wallet'),invoices=controlCenterRows_(ss,'Invoices'),today=controlCenterDateKey_(new Date()),month=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM');var active=students.filter(function(r){return String(r.status||'').toLowerCase()==='active'}).length;var td=lessons.filter(function(r){return controlCenterDateKey_(r.date)===today}).length;var upcoming=lessons.filter(function(r){var d=controlCenterDateKey_(r.date);return d&&d>=today&&String(r.status||'').toLowerCase()!=='cancelled'}).length;var revenue=payments.reduce(function(sum,r){var d=controlCenterDateKey_(r.date),a=Number(r.amount||0),t=String(r.type||'').toLowerCase();return d.indexOf(month)===0&&a>0&&t!=='payment'?sum+a:sum},0);var due=students.reduce(function(sum,r){var b=Number(r.balance||0);return b<0?sum+Math.abs(b):sum},0);return{totalStudents:students.length,activeStudents:active,todayLessons:td,upcomingLessons:upcoming,monthlyRevenue:revenue,outstandingBalance:due,totalInvoices:invoices.length,lastSync:new Date().toISOString()}}

function controlCenterRows_(ss,name){var sh=ss.getSheetByName(name);if(!sh||sh.getLastRow()<1||sh.getLastColumn()<1)return[];var values=sh.getDataRange().getValues(),headers=values[0].map(function(h){return String(h||'').trim()});return values.slice(1).filter(function(row){return row.some(function(v){return v!==''})}).map(function(row,i){var o={_row:i+2,_sheet:name};headers.forEach(function(h,j){if(h)o[h]=controlCenterSerializable_(row[j])});o.id=controlCenterFirst_(o,['ID','Id','id','Student ID','Trainer ID','Lesson ID','Invoice ID','Transaction ID','Notification ID']);o.studentId=controlCenterFirst_(o,['Student ID']);o.name=controlCenterFirst_(o,['Name','Student Name','Trainer Name']);o.email=controlCenterFirst_(o,['Email','Student Email']);o.phone=controlCenterFirst_(o,['Phone']);o.date=controlCenterFirst_(o,['Date']);o.time=controlCenterFirst_(o,['Time']);o.status=controlCenterFirst_(o,['Status','Read Status','isActive']);o.amount=controlCenterFirst_(o,['Amount (€)','Price (€)','price']);o.balance=controlCenterFirst_(o,['Balance (€)']);o.type=controlCenterFirst_(o,['Type']);o.desc=controlCenterFirst_(o,['Description','Message']);return o})}

function controlCenterSerializable_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'):v}function controlCenterFirst_(o,keys){for(var i=0;i<keys.length;i++)if(Object.prototype.hasOwnProperty.call(o,keys[i])&&o[keys[i]]!=='')return o[keys[i]];return''}function controlCenterDateKey_(v){if(!v)return'';var d=v instanceof Date?v:new Date(v);if(isNaN(d.getTime()))return String(v).slice(0,10);return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd')}

function controlCenterSaveRecord(section,data){if(section==='students')throw new Error('Use the student form to synchronize the Firebase account.');if(!data||typeof data!=='object')throw new Error('Record data is required.');if(section==='settings')return controlCenterSaveSettings_(data);if(section==='payments')return controlCenterSavePayment_(data);if(section==='students'&&!String(data['Student ID']||data.id||'').trim())return createStudent({name:data.Name,email:data.Email,phone:data.Phone,dob:data['Date of Birth'],city:data.City,package:data['Current Package'],status:data.Status,readiness:data['Exam Readiness (%)'],theoryStatus:data['Theory Exam Status'],driveFolderId:data['Drive Folder ID']});if(section==='trainers'&&!String(data['Trainer ID']||data.id||'').trim())return createTrainer({name:data.Name,email:data.Email,phone:data.Phone,license:data.License||data['License Class'],vehicle:data.Vehicle||data['Vehicle Details'],rate:data['Rate (€)']||data.Rate,status:data.Status});if(section==='lessons'&&!String(data['Lesson ID']||data.id||'').trim())return TarekCreateLesson_({studentId:data['Student ID'],trainerName:data['Trainer Name']||data['Trainer ID'],date:data.Date,time:data.Time,duration:data['Duration (h)'],price:data['Price (€)'],pickup:data['Pickup Location'],notes:data['Instructor Notes'],status:data.Status,rating:data.Rating});if(section==='invoices'&&!String(data['Invoice ID']||data.id||'').trim())return apiCreateInvoice({studentId:data['Student ID'],amount:data['Amount (€)'],description:data.Description});var cfg=controlCenterSectionConfig_(section),ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(cfg.sheet);if(!sh)throw new Error(cfg.sheet+' sheet is missing.');var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim()}),id=String(data[cfg.idHeader]||data.id||'').trim();if(!id)id=controlCenterNextId_(sh,cfg.idHeader,cfg.prefix,cfg.width);data[cfg.idHeader]=id;controlCenterValidateRecord_(section,data);var found=controlCenterFindRowById_(sh,headers,cfg.idHeader,id),previous=found.row>1?sh.getRange(found.row,1,1,headers.length).getDisplayValues()[0]:null,values=headers.map(function(h){return controlCenterSanitizeCell_(Object.prototype.hasOwnProperty.call(data,h)?data[h]:'')});if(found.row>1)sh.getRange(found.row,1,1,headers.length).setValues([values]);else sh.appendRow(values);controlCenterAudit_((found.row>1?'Update ':'Create ')+section,id,previous?JSON.stringify(previous):'',JSON.stringify(values));return{success:true,id:id,created:found.row<2}}

function controlCenterSavePayment_(data){var id=String(data['Transaction ID']||data.id||'').trim();if(id){return controlCenterSaveGenericPayment_(data)}var sid=String(data['Student ID']||'').trim(),amount=Number(data['Amount (€)']),type=String(data.Type||'deposit').toLowerCase(),desc=String(data.Description||'Balance Top-Up');if(!sid)throw new Error('Student ID is required.');if(!(amount>0))throw new Error('Amount must be greater than zero.');if(type!=='deposit')throw new Error('New manual wallet entries must be deposits. Lesson payments are created by lesson operations.');var ss=SpreadsheetApp.getActiveSpreadsheet(),student=controlCenterFindStudent_(ss,sid),sh=ss.getSheetByName('Wallet'),tx='TX-'+Date.now(),now=new Date();sh.appendRow([tx,sid,student.name,Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd'),'deposit',amount,desc,'','']);controlCenterRebuildBalance_(ss,sid);controlCenterAudit_('Add deposit',tx,'',JSON.stringify({studentId:sid,amount:amount,description:desc}));return{success:true,id:tx,created:true}}

function controlCenterSaveGenericPayment_(data){var cfg=controlCenterSectionConfig_('payments'),sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.sheet),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(String),id=String(data['Transaction ID']||data.id),found=controlCenterFindRowById_(sh,headers,cfg.idHeader,id);if(found.row<2)throw new Error('Wallet transaction not found.');var old=sh.getRange(found.row,1,1,headers.length).getDisplayValues()[0],sid=String(data['Student ID']||old[1]),values=headers.map(function(h,i){return controlCenterSanitizeCell_(Object.prototype.hasOwnProperty.call(data,h)?data[h]:old[i])});sh.getRange(found.row,1,1,headers.length).setValues([values]);controlCenterRebuildBalance_(SpreadsheetApp.getActiveSpreadsheet(),sid);controlCenterAudit_('Update payment',id,JSON.stringify(old),JSON.stringify(values));return{success:true,id:id,created:false}}

function controlCenterFindStudent_(ss,id){var rows=controlCenterRows_(ss,'Students');for(var i=0;i<rows.length;i++)if(String(rows[i]['Student ID'])===String(id))return{name:rows[i].Name||'',row:rows[i]._row};throw new Error('Student was not found.')}

function controlCenterRebuildBalance_(ss,id){var tx=controlCenterRows_(ss,'Wallet'),bal=0;tx.forEach(function(r){if(String(r['Student ID'])!==String(id))return;var a=Number(r['Amount (€)'])||0,t=String(r.Type||'').toLowerCase();if(t==='deposit')bal+=a;else if(t==='payment')bal-=a});var sh=ss.getSheetByName('Students'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],idCol=headers.indexOf('Student ID'),balCol=headers.indexOf('Balance (€)');if(idCol<0||balCol<0)throw new Error('Students wallet columns are missing.');var vals=sh.getRange(2,idCol+1,Math.max(sh.getLastRow()-1,1),1).getDisplayValues();for(var i=0;i<vals.length;i++)if(String(vals[i][0])===String(id)){sh.getRange(i+2,balCol+1).setValue(bal);return bal}throw new Error('Student was not found while rebuilding balance.')}

function controlCenterDeleteRecord(section,id){if(section==='students')throw new Error('Use the student dossier for permanent deletion.');if(['settings'].indexOf(section)!==-1)throw new Error('Settings cannot be deleted.');var cfg=controlCenterSectionConfig_(section),ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(cfg.sheet),headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim()}),found=controlCenterFindRowById_(sh,headers,cfg.idHeader,id);if(found.row<2)throw new Error('Record not found.');var old=sh.getRange(found.row,1,1,headers.length).getDisplayValues()[0],sid=section==='payments'?String(old[1]||''):'';sh.deleteRow(found.row);if(sid)controlCenterRebuildBalance_(ss,sid);controlCenterAudit_('Delete '+section,String(id),JSON.stringify(old),'DELETED');return{success:true,id:id}}

function controlCenterSaveSettings_(data){var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SchoolSettings');if(!sh)throw new Error('SchoolSettings sheet is missing.');var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(h){return String(h||'').trim()}),old=sh.getLastRow()>=2?sh.getRange(2,1,1,headers.length).getDisplayValues()[0]:headers.map(function(){return''}),next=headers.map(function(h,i){return Object.prototype.hasOwnProperty.call(data,h)?controlCenterSanitizeCell_(data[h]):old[i]});if(sh.getLastRow()>=2)sh.getRange(2,1,1,headers.length).setValues([next]);else sh.appendRow(next);controlCenterAudit_('Update settings','SchoolSettings',JSON.stringify(old),JSON.stringify(next));return{success:true,id:'SchoolSettings'}}

function controlCenterSectionConfig_(s){var x=CONTROL_CENTER_IDS[s],sheet=CONTROL_CENTER_SHEETS[s];if(!x||!sheet)throw new Error('Unsupported Control Center section: '+s);return{sheet:sheet,idHeader:x.header,prefix:x.prefix,width:x.width}}

function controlCenterFindRowById_(sh,headers,h,id){var idx=headers.indexOf(h);if(idx<0)throw new Error('Required ID column "'+h+'" is missing from '+sh.getName()+'.');if(sh.getLastRow()<2)return{row:-1,index:idx};var ids=sh.getRange(2,idx+1,sh.getLastRow()-1,1).getDisplayValues();for(var i=0;i<ids.length;i++)if(String(ids[i][0])===String(id))return{row:i+2,index:idx};return{row:-1,index:idx}}

function controlCenterNextId_(sh,h,prefix,width){var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],idx=headers.indexOf(h);if(idx<0)throw new Error('Required ID column "'+h+'" is missing.');var max=0;if(sh.getLastRow()>=2)sh.getRange(2,idx+1,sh.getLastRow()-1,1).getDisplayValues().forEach(function(r){var v=String(r[0]||'');if(v.indexOf(prefix)===0){var n=parseInt(v.slice(prefix.length),10);if(!isNaN(n)&&n>max)max=n}});return prefix+String(max+1).padStart(width,'0')}

function controlCenterValidateRecord_(s,d){function req(h,l){if(!String(d[h]||'').trim())throw new Error((l||h)+' is required.')}if(s==='students'){req('Name');req('Email')}if(s==='lessons'){req('Student ID');req('Date');req('Time')}if(s==='trainers'){req('Name');if(!(Number(d['Rate (€)'])>0))throw new Error('Trainer hourly rate must be greater than zero.')}if(s==='invoices'){req('Student ID');req('Student Name')}if(s==='packages')req('name','Package name');if(s==='notifications'){req('Title');req('Message')}if(s==='expenseCategories'){req('Name')}if(s==='expenses'){req('Date');req('Category Name');if(!(Number(d['Amount (€)'])>0))throw new Error('Expense amount must be greater than zero.')}if(s==='availability'){req('Trainer ID');req('Date');req('Start Time');req('End Time')}if(s==='documents'){req('Owner Type');req('Owner ID');req('Document Type');req('Drive URL')}}

function controlCenterSanitizeCell_(v){if(v===null||typeof v==='undefined')return'';if(typeof v==='number'||typeof v==='boolean')return v;var s=String(v);if(/^[=+@]/.test(s)||(/^-/.test(s)&&!/^-?\d+(\.\d+)?$/.test(s)))return"'"+s;return s}

function controlCenterAudit_(action,target,oldv,newv){var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AuditLogs');if(!sh)return;var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],now=new Date(),v={'Audit ID':'AUD-'+Date.now(),'User ID':'ADMIN-01','User Name':'System Administrator','User Role':'Admin','Action':action,'Changed By':'Master Control Center','Date':Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd'),'Time':Utilities.formatDate(now,Session.getScriptTimeZone(),'HH:mm:ss'),'Time Zone':Session.getScriptTimeZone(),'IP Address':'','Device / Browser':'','Target Record':target,'Previous Value':oldv,'New Value':newv,'Source':'Google Sheets Master Control Center'};sh.appendRow(headers.map(function(h){return Object.prototype.hasOwnProperty.call(v,h)?v[h]:''}))}

function controlCenterMenu_(){}function controlCenterRefresh_(){SpreadsheetApp.getActiveSpreadsheet().toast('Control Center data refreshed.','TAREK RIJSCHOOL',3)}



/* Dashboard interaction bridge: bound-sheet sidebar forms and language switcher. */

function archived_onSelectionChange(e){try{var r=e&&e.range;if(!r||r.getSheet().getName()!=='Dashboard')return;var row=r.getRow(),col=r.getColumn();if(row<=4&&col>=27&&col<=28){var lang=String(r.getDisplayValue()||'').trim().toUpperCase();if(['EN','NL','AR'].indexOf(lang)>=0)controlCenterSetDashboardLanguage(lang);return}if(col>4)return;var map=[[6,7,'dashboard'],[8,9,'students'],[10,11,'lessons'],[12,13,'trainers'],[14,15,'payments'],[16,17,'invoices'],[18,19,'packages'],[20,21,'notifications'],[22,23,'audit'],[24,25,'settings']];for(var i=0;i<map.length;i++)if(row>=map[i][0]&&row<=map[i][1]){controlCenterSidebarAction_(map[i][2]);return}}catch(err){}}

function controlCenterSidebarAction_(section){if(section==='dashboard'){SpreadsheetApp.getActive().setActiveSheet(SpreadsheetApp.getActive().getSheetByName('Dashboard'));return}if(section==='students'){menuAddStudent();return}if(section==='lessons'){menuAddLesson();return}if(section==='trainers'){menuAddTrainer();return}if(section==='payments'){menuAddDeposit();return}if(section==='packages'){controlCenterOpenSection_('packages');return}if(section==='invoices'){controlCenterOpenSection_('invoices');return}if(section==='notifications'){controlCenterOpenSection_('notifications');return}if(section==='audit'){controlCenterOpenSection_('audit');return}if(section==='settings'){controlCenterOpenSection_('settings');return}var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName(CONTROL_CENTER_SHEETS[section]);if(sh)ss.setActiveSheet(sh);else controlCenterOpen()}

function controlCenterSetDashboardLanguage(lang){var sh=SpreadsheetApp.getActive().getSheetByName('Dashboard');if(!sh)throw new Error('Dashboard sheet is missing.');var t={EN:['Dashboard','Students','Lessons','Trainers','Finance','Invoices','Packages','Notifications','Reports','Settings','MASTER CONTROL CENTER','Students  •  Lessons  •  Trainers  •  Finance  •  Reports  •  Settings'],NL:['Dashboard','Leerlingen','Lessen','Instructeurs','Financiën','Facturen','Pakketten','Meldingen','Rapporten','Instellingen','MASTER CONTROL CENTER','Leerlingen  •  Lessen  •  Instructeurs  •  Financiën  •  Rapporten  •  Instellingen'],AR:['لوحة التحكم','الطلاب','الدروس','المدربون','المالية','الفواتير','الباقات','الإشعارات','التقارير','الإعدادات','مركز التحكم الرئيسي','الطلاب  •  الدروس  •  المدربون  •  المالية  •  التقارير  •  الإعدادات']}[lang];if(!t)throw new Error('Unsupported language.');var rows=[6,8,10,12,14,16,18,20,22,24],icons=['⌂  ','👤  ','📅  ','👥  ','€  ','📄  ','▦  ','🔔  ','▥  ','⚙  '];for(var i=0;i<rows.length;i++)sh.getRange(rows[i],1).setValue(icons[i]+t[i]);sh.getRange(1,5).setValue(t[10]+'\n'+t[11]);sh.getRange(1,27).setValue(lang);SpreadsheetApp.getActive().toast(lang==='AR'?'تم تغيير لغة لوحة التحكم':lang==='NL'?'Taal van het dashboard gewijzigd':'Dashboard language changed','TAREK RIJSCHOOL',2);return{success:true,language:lang}}



function controlCenterOpenSection_(section){var sh=SpreadsheetApp.getActive().getSheetByName(CONTROL_CENTER_SHEETS[section]);if(sh)SpreadsheetApp.getActive().setActiveSheet(sh)}

function apiGetStudentsAndTrainers(){var ss=SpreadsheetApp.getActive(),s=controlCenterRows_(ss,'Students'),t=controlCenterRows_(ss,'Trainers');return{students:s.map(x=>({id:x['Student ID'],name:x.Name,balance:Number(x['Balance (€)'])||0,status:x.Status})),trainers:t.map(x=>({id:x['Trainer ID'],name:x.Name,rate:Number(x['Rate (€)'])||0,status:x.Status}))}}







/* ===== Students.gs ===== */

/** TAREK RIJSCHOOL — Student Operations. */

function studentHeaderMap_(sheet){if(!sheet||sheet.getLastRow()<1)throw new Error('Students sheet is missing or empty.');const h=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0],m={};h.forEach((x,i)=>{const k=String(x||'').trim().toLowerCase();if(k)m[k]=i});return m}

function studentCol_(m,n,r){for(const x of n){const i=m[String(x).toLowerCase()];if(i!==undefined)return i}if(r)throw new Error('Required Students column is missing: '+n[0]);return-1}

function apiGetStudentDashboard(identifier){if(!identifier)throw new Error('Student email or ID is required.');const ss=SpreadsheetApp.getActiveSpreadsheet(),s=ss.getSheetByName('Students'),l=ss.getSheetByName('Lessons'),w=ss.getSheetByName('Wallet');if(!s||!l||!w)throw new Error('Required student sheets are missing.');const m=studentHeaderMap_(s),cId=studentCol_(m,['student id'],true),cName=studentCol_(m,['name'],true),cEmail=studentCol_(m,['email'],true),cPhone=studentCol_(m,['phone'],false),cDob=studentCol_(m,['date of birth'],false),cCity=studentCol_(m,['city'],false),cPackage=studentCol_(m,['current package'],false),cBalance=studentCol_(m,['balance (€)'],false),cReady=studentCol_(m,['exam readiness (%)'],false),cStatus=studentCol_(m,['status'],false);const rows=s.getDataRange().getValues();let student=null;for(let i=1;i<rows.length;i++){if(String(rows[i][cId]||'')===String(identifier)||String(rows[i][cEmail]||'').toLowerCase()===String(identifier).toLowerCase()){student={id:rows[i][cId],name:rows[i][cName],email:rows[i][cEmail],phone:cPhone>=0?rows[i][cPhone]:'',dob:cDob>=0?rows[i][cDob]:'',city:cCity>=0?rows[i][cCity]:'',package:cPackage>=0?rows[i][cPackage]:'',balance:cBalance>=0?Number(rows[i][cBalance])||0:0,readiness:cReady>=0?Number(rows[i][cReady])||0:0,status:cStatus>=0?rows[i][cStatus]:''};break}}if(!student)throw new Error('Student was not found.');const lessons=l.getDataRange().getValues(),bookings=[];for(let i=1;i<lessons.length;i++)if(String(lessons[i][1]||'')===String(student.id))bookings.push({bookingId:lessons[i][0],studentId:lessons[i][1],studentName:lessons[i][2],trainerName:lessons[i][3],date:lessons[i][4],time:lessons[i][5],duration:Number(lessons[i][6]),price:Number(lessons[i][7]),pickup:lessons[i][8],status:lessons[i][9]});const tx=w.getDataRange().getValues(),transactions=[];for(let i=1;i<tx.length;i++)if(String(tx[i][1]||'')===String(student.id))transactions.push({txId:tx[i][0],date:tx[i][3],type:tx[i][4],amount:Number(tx[i][5])||0,desc:tx[i][6]});return{student,bookings,transactions}}

function createStudent(params){throw new Error('Use the New Student sheet form to create the Firebase account and student row together.');}

function menuAddStudent(){TarekMasterAddStudent()}





/* ===== Trainers.gs ===== */

/** TAREK RIJSCHOOL — Trainer Operations. */

function apiGetTrainerDashboard(identifier){if(!identifier)throw new Error('Trainer email or ID is required.');const ss=SpreadsheetApp.getActiveSpreadsheet(),t=ss.getSheetByName('Trainers'),l=ss.getSheetByName('Lessons');if(!t||!l)throw new Error('Required trainer sheets are missing.');const rows=t.getDataRange().getValues();let trainer=null;for(let i=1;i<rows.length;i++)if(String(rows[i][0]||'')===String(identifier)||String(rows[i][2]||'').toLowerCase()===String(identifier).toLowerCase()){trainer={id:rows[i][0],name:rows[i][1],email:rows[i][2],phone:rows[i][3],license:rows[i][4],vehicle:rows[i][5],rate:Number(rows[i][6])||0,status:rows[i][7]};break}if(!trainer)throw new Error('Trainer profile not found.');const lessons=l.getDataRange().getValues(),bookings=[];for(let i=1;i<lessons.length;i++)if(String(lessons[i][3]||'')===String(trainer.name))bookings.push({bookingId:lessons[i][0],studentId:lessons[i][1],studentName:lessons[i][2],date:lessons[i][4],time:lessons[i][5],duration:Number(lessons[i][6]),price:Number(lessons[i][7]),pickup:lessons[i][8],status:lessons[i][9]});return{trainer,bookings}}

function createTrainer(params){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Trainers');if(!sh)throw new Error('Trainers sheet is missing.');const name=String(params&&params.name||'').trim(),email=String(params&&params.email||'').trim(),phone=String(params&&params.phone||'').trim(),license=String(params&&params.license||'').trim(),vehicle=String(params&&params.vehicle||'').trim(),rate=Number(params&&params.rate);if(!name||!email)throw new Error('Trainer name and email are required.');if(!(rate>0))throw new Error('Trainer hourly rate must be greater than zero.');const rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][2]||'').toLowerCase()===email.toLowerCase())throw new Error('A trainer with this email already exists.');const id='TR-'+Date.now();sh.appendRow([id,name,email,phone,license,vehicle,rate,String(params.status||'active')]);if(typeof writeAdminLog==='function')writeAdminLog('Create Trainer','Master Control Center','Registered '+name+' ('+id+')');return{success:true,trainerId:id,name}}

function updateTrainerSchedule(params){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TrainerSchedule');if(!sh)throw new Error('TrainerSchedule sheet is missing.');const id=String(params&&params.trainerId||'').trim(),name=String(params&&params.trainerName||'').trim(),day=String(params&&params.dayOfWeek||'').trim(),start=String(params&&params.startTime||'').trim(),end=String(params&&params.endTime||'').trim(),available=params&&params.isAvailable!==undefined?String(params.isAvailable).toUpperCase():'TRUE';if(!id||!name||!day||!start||!end)throw new Error('Complete trainer schedule details are required.');const rows=sh.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][0])===id&&String(rows[i][2]).toLowerCase()===day.toLowerCase()){sh.getRange(i+1,2,1,5).setValues([[name,day,start,end,available]]);return{success:true}}sh.appendRow([id,name,day,start,end,available]);return{success:true}}

function menuAddTrainer(){TarekMasterAddTrainer()}





/* ===== Wallet.gs ===== */

/** TAREK RIJSCHOOL — Digital Wallet Operations. */

function apiAddDeposit(params){const sid=String(params&&params.studentId||'').trim(),amount=Number(params&&params.amount),desc=String(params&&params.description||'Balance Top-Up').trim();if(!sid)throw new Error('Student ID is required.');if(!(amount>0))throw new Error('Deposit amount must be greater than zero.');const student=apiGetStudentDashboard(sid).student;writeTransactionRecord(student.id,student.name,'deposit',amount,desc);rebuildStudentBalance(student.id);const updated=apiGetStudentDashboard(sid).student;if(updated.email&&typeof sendResponsiveEmail==='function')sendResponsiveEmail(updated.email,updated.name,'deposit',{amount,paymentMethod:desc,newBalance:updated.balance});if(typeof writeAdminLog==='function')writeAdminLog('Add Deposit API','Master Control Center','Credited '+student.name+' with €'+amount);return{txId:apiLastWalletTransactionId_(),newBalance:updated.balance}}

function apiAddWalletDeposit(params){return apiAddDeposit(params)}

function apiLastWalletTransactionId_(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Wallet');return sh&&sh.getLastRow()>1?String(sh.getRange(sh.getLastRow(),1).getValue()||''):''}

function writeTransactionRecord(studentId,studentName,type,amount,desc){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Wallet');if(!sh)throw new Error('Wallet sheet is missing.');const id='TX-'+Date.now(),now=new Date();sh.appendRow([id,studentId,studentName,Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd'),String(type||'').toLowerCase(),Number(amount)||0,String(desc||''),'','']);return id}

function rebuildStudentBalance(studentId){const ss=SpreadsheetApp.getActiveSpreadsheet(),w=ss.getSheetByName('Wallet'),s=ss.getSheetByName('Students');if(!w||!s)throw new Error('Required wallet sheets are missing.');const tx=w.getDataRange().getValues();let bal=0;for(let i=1;i<tx.length;i++){if(String(tx[i][1]||'')!==String(studentId))continue;const t=String(tx[i][4]||'').toLowerCase(),v=Number(tx[i][5])||0;if(t==='deposit')bal+=v;else if(t==='payment')bal-=v}const rows=s.getDataRange().getValues();for(let i=1;i<rows.length;i++)if(String(rows[i][0]||'')===String(studentId)){s.getRange(i+1,8).setValue(bal);return bal}throw new Error('Student was not found while rebuilding wallet balance.')}

function addDeposit(params){return apiAddDeposit(params)}

function menuAddDeposit(){TarekMasterAddDeposit()}





/* ===== Invoices.gs ===== */

/** TAREK RIJSCHOOL — Invoice Operations. */

function apiCreateInvoice(params){const ss=SpreadsheetApp.getActiveSpreadsheet(),inv=ss.getSheetByName('Invoices'),lessons=ss.getSheetByName('Lessons');if(!inv||!lessons)throw new Error('Required invoice sheets are missing.');const sid=String(params&&params.studentId||'').trim(),description=String(params&&params.description||'Driving lessons').trim(),list=String(params&&params.bookingsList||'').trim();if(!sid)throw new Error('Student ID is required.');const student=apiGetStudentDashboard(sid).student;let amount=Number(params&&params.amount)||0;if(!amount&&list){const rows=lessons.getDataRange().getValues();list.split(',').forEach(id=>{for(let i=1;i<rows.length;i++)if(String(rows[i][0]||'')===id.trim()){amount+=Number(rows[i][7])||0;break}})}if(!(amount>0))throw new Error('Invoice amount must be greater than zero.');const id='INV-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd')+'-'+Date.now(),date=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');const html=getInvoicePdfHtml_({invoiceId:id,invoiceDate:date,studentName:student.name,studentId:student.id,description,grandTotal:amount}),blob=HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF).setName(id+'.pdf'),file=DriveApp.createFile(blob);inv.appendRow([id,student.id,student.name,student.email,amount,date,description,'issued',file.getId(),file.getUrl()]);if(typeof writeAdminLog==='function')writeAdminLog('Create Invoice API','Master Control Center','Generated '+id+' for '+student.name);return{invoiceId:id,grandTotal:amount,pdfUrl:file.getUrl()}}

function apiSendInvoice(params){const id=String(params&&params.invoiceId||'').trim();if(!id)throw new Error('Invoice ID is required.');const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Invoices');if(!sh)throw new Error('Invoices sheet is missing.');const rows=sh.getDataRange().getValues();let x=null,rowNo=0;for(let i=1;i<rows.length;i++)if(String(rows[i][0]||'')===id){x={studentId:rows[i][1],name:rows[i][2],email:rows[i][3],amount:Number(rows[i][4])||0,date:rows[i][5],description:rows[i][6],status:rows[i][7],fileId:rows[i][8],url:rows[i][9]};rowNo=i+1;break}if(!x)throw new Error('Invoice '+id+' does not exist.');if(!x.email)throw new Error('Student email is missing.');if(!x.fileId)throw new Error('Invoice PDF file ID is missing.');const pdf=DriveApp.getFileById(String(x.fileId)).getBlob();if(typeof sendResponsiveEmail==='function')sendResponsiveEmail(x.email,x.name,'invoice',{invoiceId:id,description:x.description,grandTotal:x.amount,attachments:[pdf]});else MailApp.sendEmail({to:x.email,subject:'TAREK RIJSCHOOL — Invoice '+id,body:'Dear '+x.name+',\n\nPlease find invoice '+id+' attached.\n\nTAREK RIJSCHOOL',attachments:[pdf]});sh.getRange(rowNo,8).setValue('sent');if(typeof writeAdminLog==='function')writeAdminLog('Send Invoice API','Master Control Center','Sent '+id+' to '+x.email);return{success:true,pdfUrl:x.url}}

function getInvoicePdfHtml_(d){return'<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:36px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#f1f5f9}</style></head><body><h1>TAREK RIJSCHOOL</h1><div>Invoice: '+d.invoiceId+'</div><div>Date: '+d.invoiceDate+'</div><h2>'+d.studentName+' ('+d.studentId+')</h2><table><tr><th>Description</th><th>Total</th></tr><tr><td>'+d.description+'</td><td>€'+Number(d.grandTotal).toFixed(2)+'</td></tr></table></body></html>'}

function createInvoice(params){return apiCreateInvoice(params)}function sendInvoice(params){return apiSendInvoice(params)}





/* ===== Notifications.gs ===== */

/** TAREK RIJSCHOOL — Notifications. */

function menuSendReminder(){const ui=SpreadsheetApp.getUi(),lessonId=ui.prompt('Send Balance Reminder','Enter Lesson ID:',ui.ButtonSet.OK_CANCEL).getResponseText();if(!lessonId)return;const ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName('Lessons');if(!sh)throw new Error('Lessons sheet is missing.');const rows=sh.getDataRange().getValues();let sid='';for(let i=1;i<rows.length;i++)if(String(rows[i][0]||'')===lessonId.trim()){sid=String(rows[i][1]||'');break}if(!sid){ui.alert('Error','Lesson not found.',ui.ButtonSet.OK);return}const student=apiGetStudentDashboard(sid).student;if(!student.email)throw new Error('Student email is missing.');const subject='TAREK RIJSCHOOL — Balance reminder',body='Dear '+student.name+',\n\nYour scheduled driving lesson is upcoming. Please top up your wallet balance if needed to keep your lesson administration current.\n\nMet vriendelijke groet,\nTAREK RIJSCHOOL';MailApp.sendEmail(student.email,subject,body);controlCenterCreateNotification_({studentId:student.id,email:student.email,type:'balance_reminder',title:subject,message:body});if(typeof writeAdminLog==='function')writeAdminLog('Send Reminder','Master Control Center','Sent balance reminder to '+student.email);ui.alert('Reminder Dispatched','Notification sent to '+student.email,ui.ButtonSet.OK)}

function controlCenterCreateNotification_(p){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Notifications');if(!sh)throw new Error('Notifications sheet is missing.');const id='NOT-'+Date.now(),now=new Date();sh.appendRow([id,'Student',String(p.studentId||''),String(p.email||''),String(p.type||'general'),String(p.title||''),String(p.message||''),Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'),'Unread']);return{id:id}}



// Keep the spreadsheet header clean. Navigation is rendered as assigned
// image buttons inside Dashboard!A:C; no custom menu is created at the top.
function onOpen(){}

function TarekMasterRefresh(){SpreadsheetApp.getActive().toast('Live data refreshed.','TAREK RIJSCHOOL',2)}

function TarekMasterPrompt_(t,f){var u=SpreadsheetApp.getUi(),o={};for(var i=0;i<f.length;i++){var r=u.prompt(t,f[i][1],u.ButtonSet.OK_CANCEL);if(r.getSelectedButton()!=u.Button.OK)return null;o[f[i][0]]=r.getResponseText()}return o}

function TarekMasterAddStudent(){sheetOpenForm_('students','new')}

function TarekMasterAddTrainer(){sheetOpenForm_('trainers','new')}

function TarekMasterAddDeposit(){sheetOpenForm_('payments','new')}

function TarekMasterAddLesson(){sheetOpenForm_('lessons','new')}



function TarekCreateLesson_(p){var st=apiGetStudentDashboard(p.studentId).student,sh=SpreadsheetApp.getActive().getSheetByName('Lessons');if(!sh)throw new Error('Lessons sheet is missing.');var id='LES-'+Date.now();sh.appendRow([id,st.id,st.name,String(p.trainerName||''),String(p.date||''),String(p.time||''),Number(p.duration)||0,Number(p.price)||0,String(p.pickup||''),String(p.status||'upcoming'),'',String(p.notes||''),p.rating||'']);controlCenterAudit_('Create lesson',id,'',JSON.stringify(p));return{success:true,id:id}}

function TarekBuildDashboard(lang){lang=String(lang||'EN').toUpperCase();var ss=SpreadsheetApp.getActive(),sh=ss.getSheetByName('Dashboard');if(!sh)sh=ss.insertSheet('Dashboard',0);sh.setHiddenGridlines(true);sh.setFrozenRows(4);sh.setFrozenColumns(4);controlCenterSetDashboardLanguage(lang);SpreadsheetApp.flush();return{success:true,language:lang}}

function buildDashboardEn(){return TarekBuildDashboard('EN')}function buildDashboardNl(){return TarekBuildDashboard('NL')}function buildDashboardAr(){return TarekBuildDashboard('AR')}

function TarekWebhookConfig(){var p=PropertiesService.getScriptProperties();return{backendUrl:p.getProperty('BACKEND_URL')||'',webhookSecretConfigured:!!p.getProperty('WEBHOOK_SECRET')}}

function tarekSignedBackendPost_(route,body){
  var p=PropertiesService.getScriptProperties(),gateway=p.getProperty('GATEWAY_URL'),base=p.getProperty('BACKEND_URL'),secret=p.getProperty('WEBHOOK_SECRET');
  if(!secret||(!gateway&&!base))return{skipped:true,reason:'Configure GATEWAY_URL and WEBHOOK_SECRET in Script Properties'};
  var timestamp=String(Date.now()),payload=JSON.stringify(body);
  if(gateway){
    var signed=timestamp+'.'+route+'.'+payload;
    var signature=Utilities.computeHmacSha256Signature(signed,secret).map(function(b){return('0'+(b&255).toString(16)).slice(-2)}).join('');
    var answer=UrlFetchApp.fetch(gateway,{method:'post',contentType:'application/json',payload:JSON.stringify({route:route,body:body,timestamp:timestamp,signature:signature}),muteHttpExceptions:true});
    var content=answer.getContentText(),result;
    try{result=JSON.parse(content);}catch(ignore){result={success:false,error:'Gateway response is not JSON.'};}
    return{status:answer.getResponseCode()===200&&result.success===true?200:503,body:result.error||content.slice(0,300)};
  }
  var bytes=Utilities.computeHmacSha256Signature(timestamp+'.'+payload,secret);
  var signature=bytes.map(function(b){return ('0'+(b&255).toString(16)).slice(-2)}).join('');
  var res=UrlFetchApp.fetch(base.replace(/\/$/,'')+route,{method:'post',contentType:'application/json',payload:payload,headers:{'X-Sheets-Signature':signature,'X-Sheets-Timestamp':timestamp,'X-Sheets-Event-Id':body.syncId||''},muteHttpExceptions:true});
  return{status:res.getResponseCode(),body:res.getContentText().slice(0,300)};
}
function dispatchWebhookChangeEvent(sheetName,changeType,rowId,rowData,studentId){
  return tarekSignedBackendPost_('/api/webhooks/sheets-change',{sheetName:sheetName,changeType:changeType,entityId:String(rowId),rowData:rowData,studentId:studentId||'',syncId:'sheet-'+Date.now()+'-'+String(rowId)});
}

/* === Retained unique functions from the first file === */

function showNewStudentModal() {

  var template = HtmlService.createHtmlOutput(getStudentModalHtml('CREATE'))

    .setWidth(550).setHeight(620).setTitle('➕ New Student Registration');

  SpreadsheetApp.getUi().showModalDialog(template, 'New Student Registration');

}

function showEditStudentModal() {

  var template = HtmlService.createHtmlOutput(getStudentModalHtml('EDIT'))

    .setWidth(550).setHeight(620).setTitle('✏️ Edit Student Account');

  SpreadsheetApp.getUi().showModalDialog(template, 'Edit Student Account');

}

function showDeleteStudentModal() {

  var template = HtmlService.createHtmlOutput(getDeleteStudentModalHtml())

    .setWidth(450).setHeight(320).setTitle('❌ Delete Student');

  SpreadsheetApp.getUi().showModalDialog(template, 'Delete Student');

}

function showCreatePackageModal() {

  var template = HtmlService.createHtmlOutput(getPackageModalHtml())

    .setWidth(520).setHeight(560).setTitle('📦 New Driving Package');

  SpreadsheetApp.getUi().showModalDialog(template, 'Create Driving Package');

}

function showDeletePackageModal() {

  var template = HtmlService.createHtmlOutput(getDeletePackageModalHtml())

    .setWidth(450).setHeight(320).setTitle('❌ Delete Package');

  SpreadsheetApp.getUi().showModalDialog(template, 'Delete Package');

}

function showGenerateInvoiceModal() {

  var template = HtmlService.createHtmlOutput(getInvoiceModalHtml())

    .setWidth(550).setHeight(520).setTitle('🧾 Generate Invoice');

  SpreadsheetApp.getUi().showModalDialog(template, 'Generate Invoice');

}



/**

 * معالجات الـ RPC للتعامل مع البيانات والتطبيق الحي

 */

function apiSaveStudent(studentData) {throw new Error('Use the New Student or Edit Student sheet form to synchronize Firebase Authentication.');}

function apiDeleteStudent(studentId) {throw new Error('Use the student dossier and enter DELETE followed by the student ID.');}

function apiSavePackage(packageData) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheet = ss.getSheetByName("Packages");

  if (!sheet) throw new Error("Packages worksheet not found.");



  var isNew = !packageData.packageId;

  var packageId = packageData.packageId || ("PKG-" + String(Math.floor(1000 + Math.random() * 9000)));

  var rowData = [

    packageId,

    packageData.name || 'Driving Package',

    packageData.description || '',

    Number(packageData.hours || 10),

    Number(packageData.price || 500),

    Number(packageData.discountPrice || 0),

    packageData.badge || '',

    true,

    false,

    'blue',

    1,

    true

  ];



  if (isNew) {

    sheet.appendRow(rowData);

  } else {

    var rows = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();

    var targetRow = -1;

    for (var i = 0; i < rows.length; i++) {

      if (String(rows[i][0]).trim() === packageId) {

        targetRow = i + 2;

        break;

      }

    }

    if (targetRow !== -1) {

      sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);

    }

  }



  dispatchWebhookChangeEvent("Packages", isNew ? "INSERT_ROW" : "EDIT", packageId, rowData);

  return { success: true, packageId: packageId };

}

function apiDeletePackage(packageId) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheet = ss.getSheetByName("Packages");

  if (!sheet) throw new Error("Packages worksheet not found.");



  var rows = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();

  var targetRow = -1;

  for (var i = 0; i < rows.length; i++) {

    if (String(rows[i][0]).trim() === packageId) {

      targetRow = i + 2;

      break;

    }

  }

  if (targetRow === -1) throw new Error("Package " + packageId + " not found.");



  sheet.deleteRow(targetRow);

  dispatchWebhookChangeEvent("Packages", "DELETE_ROW", packageId, { packageId: packageId });

  return { success: true, packageId: packageId };

}

function apiSaveInvoice(invData) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheet = ss.getSheetByName("Invoices");

  if (!sheet) throw new Error("Invoices worksheet not found.");



  var invoiceId = invData.invoiceId || ("INV-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy") + "-" + String(Math.floor(100 + Math.random() * 900)));

  var dateStr = invData.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  var rowData = [

    invoiceId,

    invData.studentId || 'ST-000001',

    invData.studentName || 'Student',

    invData.studentEmail || '',

    Number(invData.amount || 150),

    dateStr,

    invData.description || 'Lesson invoice',

    invData.status || 'unpaid',

    '',

    '',

    ''

  ];



  sheet.appendRow(rowData);

  dispatchWebhookChangeEvent("Invoices", "INSERT_ROW", invoiceId, rowData, invData.studentId);

  return { success: true, invoiceId: invoiceId };

}



/**

 * إرسال إشعار التغيير الفوري عبر الويب هوك إلى التطبيق

 */

function installLiveSyncTrigger() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var triggers = ScriptApp.getUserTriggers(ss);

  for (var i = 0; i < triggers.length; i++) {

    if (triggers[i].getHandlerFunction() === "onSheetEditTrigger") {

      ScriptApp.deleteTrigger(triggers[i]);

    }

  }

  ScriptApp.newTrigger("onSheetEditTrigger").forSpreadsheet(ss).onEdit().create();

  SpreadsheetApp.getUi().alert("✅ Live sync trigger installed successfully!");

}

function onSheetEditTrigger(e) {

  if (!e || !e.range) return;

  var sheet = e.range.getSheet();

  var sheetName = sheet.getName();

  if (sheetName === "Dashboard") return;



  var row = e.range.getRow();

  if (row < 2) return;



  var rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  var recordId = String(rowValues[0]);

  dispatchWebhookChangeEvent(sheetName, "EDIT", recordId, rowValues);

}



// تصميم CSS المشترك للنوافذ

function getModalStyles() {

  return '<style>' +

    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 15px; margin: 0; background: #f8fafc; color: #1e293b; }' +

    '.card { background: #fff; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 12px; }' +

    '.form-group { margin-bottom: 12px; }' +

    'label { display: block; font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px; text-transform: uppercase; }' +

    'input, select { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 13px; }' +

    '.btn-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 15px; }' +

    'button { padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer; border: none; }' +

    '.btn-primary { background: #2563eb; color: #fff; }' +

    '.btn-secondary { background: #e2e8f0; color: #475569; }' +

    '.status-box { padding: 10px; border-radius: 6px; margin-bottom: 12px; display: none; font-size: 12px; font-weight: bold; }' +

    '.status-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }' +

    '.status-error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }' +

    '</style>';

}

function getStudentModalHtml(mode) {

  var isEdit = mode === 'EDIT';

  return '<!DOCTYPE html><html><head>' + getModalStyles() + '</head><body>' +

    '<div id="statusBox" class="status-box"></div>' +

    '<form id="studentForm">' +

      (isEdit ? '<div class="form-group"><label>Student ID *</label><input type="text" id="studentId" required placeholder="ST-000001"></div>' : '') +

      '<div class="form-group"><label>Full Name *</label><input type="text" id="name" required placeholder="Ahmed Hassan"></div>' +

      '<div class="form-group"><label>Email *</label><input type="email" id="email" required placeholder="student@example.com"></div>' +

      '<div class="form-group"><label>Phone</label><input type="tel" id="phone" placeholder="+31 6 12345678"></div>' +

      '<div class="form-group"><label>City</label><input type="text" id="city" placeholder="Rotterdam"></div>' +

      '<div class="form-group"><label>Package</label><select id="package">' +

        '<option value="20 Hours Package">20 Hours Package</option>' +

        '<option value="10 Hours Package">10 Hours Package</option>' +

        '<option value="30 Hours Package">30 Hours Package</option>' +

      '</select></div>' +

      '<div class="btn-row">' +

        '<button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>' +

        '<button type="submit" class="btn-primary">' + (isEdit ? 'Save Changes' : 'Register Student') + '</button>' +

      '</div>' +

    '</form>' +

    '<script>' +

      'document.getElementById("studentForm").onsubmit = function(e) {' +

        'e.preventDefault();' +

        'var data = {' +

          (isEdit ? 'studentId: document.getElementById("studentId").value,' : '') +

          'name: document.getElementById("name").value,' +

          'email: document.getElementById("email").value,' +

          'phone: document.getElementById("phone").value,' +

          'city: document.getElementById("city").value,' +

          'currentPackage: document.getElementById("package").value' +

        '};' +

        'google.script.run' +

          '.withSuccessHandler(function(res) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-success";' +

            'box.innerText = "✅ Student saved successfully (" + res.studentId + ")!";' +

            'box.style.display = "block";' +

            'setTimeout(function() { google.script.host.close(); }, 1200);' +

          '})' +

          '.withFailureHandler(function(err) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-error";' +

            'box.innerText = "❌ Error: " + err.message;' +

            'box.style.display = "block";' +

          '})' +

          '.apiSaveStudent(data);' +

      '};' +

    '</script>' +

  '</body></html>';

}

function getDeleteStudentModalHtml() {

  return '<!DOCTYPE html><html><head>' + getModalStyles() + '</head><body>' +

    '<div id="statusBox" class="status-box"></div>' +

    '<div class="card" style="border-color:#fca5a5;background:#fef2f2;">' +

      '<h3 style="margin-top:0;color:#991b1b;">⚠️ Delete Student Record</h3>' +

      '<p style="color:#7f1d1d;font-size:12px;margin:0;">Warning: Deleting a student removes their row permanently.</p>' +

    '</div>' +

    '<form id="delStudentForm">' +

      '<div class="form-group"><label>Student ID to Delete *</label><input type="text" id="delStudentId" required placeholder="ST-000001"></div>' +

      '<div class="btn-row">' +

        '<button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>' +

        '<button type="submit" class="btn-primary" style="background:#dc2626;">Confirm Delete</button>' +

      '</div>' +

    '</form>' +

    '<script>' +

      'document.getElementById("delStudentForm").onsubmit = function(e) {' +

        'e.preventDefault();' +

        'var sId = document.getElementById("delStudentId").value;' +

        'google.script.run' +

          '.withSuccessHandler(function() {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-success";' +

            'box.innerText = "✅ Student " + sId + " deleted!";' +

            'box.style.display = "block";' +

            'setTimeout(function() { google.script.host.close(); }, 1000);' +

          '})' +

          '.withFailureHandler(function(err) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-error";' +

            'box.innerText = "❌ Error: " + err.message;' +

            'box.style.display = "block";' +

          '})' +

          '.apiDeleteStudent(sId);' +

      '};' +

    '</script>' +

  '</body></html>';

}

function getPackageModalHtml() {

  return '<!DOCTYPE html><html><head>' + getModalStyles() + '</head><body>' +

    '<div id="statusBox" class="status-box"></div>' +

    '<form id="packForm">' +

      '<div class="form-group"><label>Package Name *</label><input type="text" id="name" required placeholder="e.g. 25 Hours Super Pack"></div>' +

      '<div class="form-group"><label>Hours</label><input type="number" id="hours" value="20"></div>' +

      '<div class="form-group"><label>Price (€)</label><input type="number" id="price" value="1200"></div>' +

      '<div class="btn-row">' +

        '<button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>' +

        '<button type="submit" class="btn-primary">Save Package</button>' +

      '</div>' +

    '</form>' +

    '<script>' +

      'document.getElementById("packForm").onsubmit = function(e) {' +

        'e.preventDefault();' +

        'var data = {' +

          'name: document.getElementById("name").value,' +

          'hours: Number(document.getElementById("hours").value),' +

          'price: Number(document.getElementById("price").value)' +

        '};' +

        'google.script.run' +

          '.withSuccessHandler(function(res) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-success";' +

            'box.innerText = "✅ Package saved (" + res.packageId + ")!";' +

            'box.style.display = "block";' +

            'setTimeout(function() { google.script.host.close(); }, 1200);' +

          '})' +

          '.withFailureHandler(function(err) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-error";' +

            'box.innerText = "❌ Error: " + err.message;' +

            'box.style.display = "block";' +

          '})' +

          '.apiSavePackage(data);' +

      '};' +

    '</script>' +

  '</body></html>';

}

function getDeletePackageModalHtml() {

  return '<!DOCTYPE html><html><head>' + getModalStyles() + '</head><body>' +

    '<div id="statusBox" class="status-box"></div>' +

    '<div class="card" style="border-color:#fca5a5;background:#fef2f2;">' +

      '<h3 style="margin-top:0;color:#991b1b;">⚠️ Delete Package</h3>' +

      '<p style="color:#7f1d1d;font-size:12px;margin:0;">Warning: Deleting a package removes its row permanently.</p>' +

    '</div>' +

    '<form id="delPackForm">' +

      '<div class="form-group"><label>Package ID to Delete *</label><input type="text" id="delPackageId" required placeholder="PKG-000001"></div>' +

      '<div class="btn-row">' +

        '<button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>' +

        '<button type="submit" class="btn-primary" style="background:#dc2626;">Confirm Delete</button>' +

      '</div>' +

    '</form>' +

    '<script>' +

      'document.getElementById("delPackForm").onsubmit = function(e) {' +

        'e.preventDefault();' +

        'var pId = document.getElementById("delPackageId").value;' +

        'google.script.run' +

          '.withSuccessHandler(function() {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-success";' +

            'box.innerText = "✅ Package " + pId + " deleted!";' +

            'box.style.display = "block";' +

            'setTimeout(function() { google.script.host.close(); }, 1000);' +

          '})' +

          '.withFailureHandler(function(err) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-error";' +

            'box.innerText = "❌ Error: " + err.message;' +

            'box.style.display = "block";' +

          '})' +

          '.apiDeletePackage(pId);' +

      '};' +

    '</script>' +

  '</body></html>';

}

function getInvoiceModalHtml() {

  return '<!DOCTYPE html><html><head>' + getModalStyles() + '</head><body>' +

    '<div id="statusBox" class="status-box"></div>' +

    '<div class="card">' +

      '<h3 style="margin-top:0;">🧾 Generate Invoice</h3>' +

      '<p style="color:#64748b;font-size:12px;">Generates an invoice and updates the system in real time.</p>' +

    '</div>' +

    '<form id="invForm">' +

      '<div class="form-group"><label>Student ID *</label><input type="text" id="studentId" required placeholder="ST-000001"></div>' +

      '<div class="form-group"><label>Amount (€) *</label><input type="number" id="amount" required value="150"></div>' +

      '<div class="btn-row">' +

        '<button type="button" class="btn-secondary" onclick="google.script.host.close()">Cancel</button>' +

        '<button type="submit" class="btn-primary">Create Invoice</button>' +

      '</div>' +

    '</form>' +

    '<script>' +

      'document.getElementById("invForm").onsubmit = function(e) {' +

        'e.preventDefault();' +

        'var data = {' +

          'studentId: document.getElementById("studentId").value,' +

          'amount: Number(document.getElementById("amount").value)' +

        '};' +

        'google.script.run' +

          '.withSuccessHandler(function(res) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-success";' +

            'box.innerText = "✅ Invoice " + res.invoiceId + " created!";' +

            'box.style.display = "block";' +

            'setTimeout(function() { google.script.host.close(); }, 1200);' +

          '})' +

          '.withFailureHandler(function(err) {' +

            'var box = document.getElementById("statusBox");' +

            'box.className = "status-box status-error";' +

            'box.innerText = "❌ Error: " + err.message;' +

            'box.style.display = "block";' +

          '})' +

          '.apiSaveInvoice(data);' +

      '};' +

    '</script>' +

  '</body></html>';

}

/* Native image buttons on Dashboard; install once from the custom menu. */
var SHEET_FORM_BUTTONS = [{"label": "Dashboard", "row": 5, "section": "dashboard", "mode": "view", "handler": "sheetButton0"}, {"label": "Students", "row": 6, "section": "students", "mode": "new", "handler": "sheetButton1"}, {"label": "Lessons", "row": 7, "section": "lessons", "mode": "new", "handler": "sheetButton2"}, {"label": "Trainers", "row": 8, "section": "trainers", "mode": "new", "handler": "sheetButton3"}, {"label": "Packages", "row": 9, "section": "packages", "mode": "new", "handler": "sheetButton4"}, {"label": "Wallet", "row": 10, "section": "payments", "mode": "new", "handler": "sheetButton5"}, {"label": "Invoices", "row": 11, "section": "invoices", "mode": "new", "handler": "sheetButton6"}, {"label": "Expenses", "row": 12, "section": "expenses", "mode": "new", "handler": "sheetButton7"}, {"label": "Notifications", "row": 13, "section": "notifications", "mode": "new", "handler": "sheetButton8"}, {"label": "School Settings", "row": 14, "section": "settings", "mode": "view", "handler": "sheetButton9"}, {"label": "Audit Logs", "row": 15, "section": "audit", "mode": "view", "handler": "sheetButton10"}, {"label": "Help & Support", "row": 16, "section": "help", "mode": "new", "handler": "sheetButton11"}, {"label": "New Student", "row": 19, "section": "students", "mode": "new", "handler": "sheetButton12"}, {"label": "New Lesson", "row": 20, "section": "lessons", "mode": "new", "handler": "sheetButton13"}, {"label": "New Trainer", "row": 21, "section": "trainers", "mode": "new", "handler": "sheetButton14"}, {"label": "Add Deposit", "row": 22, "section": "payments", "mode": "new", "handler": "sheetButton15"}];
var SHEET_FORM_BUTTON_PNG = {"Dashboard": "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", "Students": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAFgklEQVR42u2da1ATVxTH7y4mWd7KCCUogiJWJmppxVcpiqjUN4VaJZUqWi0qOiBSFaHQioBvpEoJtVioiEARAaGVBLVODIwtj4KKFJWHyBukCCQb8th+WCaikRodbZ3J+X3a5Ny9587d859z7u7mBiMsHRAAAE8yTP0rOydXmBdAq7gt5P+bMGhJNNfeg5kCtAo68gfLA1OVUnZOriAJQJthj7VRaQMHVQAATXPtPdU6AofpAAB1cEgXAKCeNCBjAMAQGQMAABAGALzZwogN23okyAeuAfAGMkzDdkYGejvWr1g0Z5qpiXF9U1t2QWHCzxcf9YoRQqcP76p90BJ6LOm/H/3/6BqAjIEQQsdDfT9wmLQhONpu4YYNe47iOL5qiTNMH6DVGYPJYLjMsg+IjK+oqkEI3a1vOpKQQZtiQjbPf/9dhNDGlYsQQk7cAF6437mLwriUXLoBb69fn4TcERWPEGIxGREB69zmz+oVk5cKS/X0CLJfRjfDMOwLz8XeHq4WZib1jW3xqXlnci7TpvRvQ+43tREsxuxpU3Rw/LxAFBbzk0KpVHc92tx0zybP8VYWLR1dZ3Iu81JyFUolXGPgdQlDJpeLJVLH9zhZApFMrhhs8tsXZzLcSMN6Jngz13Eqx33LN42tndvXeax2cki5cIU2bV/n4TZv1paw41U1DfZ2Nicj/PvEZFZBIW3lLp0bEMXbfeiUrfWotJjgW3fqz+Zeecq1vi4hSNwfHnvmbO5vI0cYebnNm2gz5tadOrjG2syK6XhlI1XZSL2WUoqiqKDDCctcZpZf4CUe+NLXa/m4MewX9USwmGvcF0TxUm9W13V19+w9ntzS/pA2sZgM39XLvzqWVFZ5V0JKi8oqT2Xkc5fNVZ2bLyxOy7vaK5aUVd4ViEpnvDNRvf+RI4wIFjNfWCIhpQ3N7VG8VFAF0ENSKVt1Zk/EXtfiO5MvunK9Yu6MKQ6T3/50mctun1Uh0YlJmQLNPVlZmLGYjPLbA4/Y5QrFjeqBwLW1HqWny0qJDkIIYQjDMIRhWH1Tm+rcmoZm1XF3Tx/bzES9//vN7ZeL/sw9GZ4tKBSV3hIW3ySl/RAZWk5+BYWQ4oS3TmS2MrVI+eqFgRDq6u7J5Isy+SIcx6L3bArb6pWcdem5RTyOPyFW6tltcISQy2c7q2sfPDtlaZbWvAIPzLS3mzNt8m4fz4O7DFf5RQzVIaBV2njLWBmxEhdVUw2dmtZUL/McQ6mkfq/4i2AxCRYTISSXy3HscfR3P+ozNjRQfRxnaU4f1De19ctk9nY2A4rU0Zk8wZo+vlPXSEr7XWbav+hInnJNUVRRWeX+79PmrdnZ2tHFXeoMYQF8OAULXIIHpys1V4WmwmAyGOe/C1vsPJ1tZkKwmFM5tj6eS4TFN/skJEKooaVj0gRrfV2Cbny9vMrD1XG8lYWRgZ7f2o84tgPRT0r7k84XBG3ynDTBeriRQeg2L3PTgYpIQkpjk3MC1n/svsDRUF93tPnItR4L/L09njuwwa6ncmwP7drIGW/FYjI4ttZsU5O6xlYIC1DFQa7OtiTFC9VRmpZS/TLZ/vi0zz9ZuM/fe4SxQWvn3/xrJUdPnaOtP6T/eiLU90ZevC7BcuIGxCbnjLEwzTsZLpZIf7n6B/9aiaqfyLizBnpEVtzXvWKyQFR6UVisMh1OyOjoeuTv7R4Tsrmlo0sgKo3+8dxzBzbYtfPqwPKqmpjQLTaW7PaH3cnZl05nFUBkaDmGBMY9oXiJu1IYYekAr50DgAr6d3zwEiEAvKLFNwCAMAAAhAEAgEoYt4V89lgbmAsAUO2gAxkDAIYupSBpAMDgDdewwZs6wxadgNZKAg21RedT8gAA7UF9U2cM/gYAANT5B0GlQoa1/SuwAAAAAElFTkSuQmCC", "Lessons": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAEJ0lEQVR42u3dbUxbVRgH8HMuFLoxmBBlKQiM0C2UZS/EzW3EDRgGFOvbpqV10+BGYJuavYhbmbh9UITh3ERHsk1xooMUwlTISORFsqUWYoQyFUpC6ejKSgdUG2STFkKvH27SIL1tJCgx6f/3qX2a89zm5P5z7k3bUyqM2kgA4O/83UuSbemYF/Apfepmb8HgImEZNGCmwKdwZ/7seFDXpZRkWzoiAb5MFBvnygaDVABwLIMG130Eg+kAcMdguQBwXzSwYgB4WDEAAMEAQDAA/tNglBUe+Lr8JOYLEAwA3+W/wPGU0lx5ZvbO9IjwsNvm0YuqxqqGNkJIyub1J/bLxTERd622qoa2C9XXZpxO3iIhRCDwL8iT78p4LDRkmc5geq+86oeuXkJI7ceFpuFRYaBg+6Z1fgzzTYvmVNmX3BBPrQD+FyvGkVd3viRNPXjqk/iMnOMfVBTslz/3eFLQEuHlkjdVjdfXZOZmHSoKWbY0Pi6at8g1UeZmPZu2da/yw7XSvFaNtuqsMjoinHtJIU1Vd/YkyQ7vyT8ty0yWZSYTQry0ApjthUeZhEi62MEIDBC8tvuZdz6q7NYNTNodHd26z+uaFE+nPhgaIgwMaFJ3TdodQ5ax4guqXr2Rt8g1yZE9UXxR1dWrH5+4f6aiTm8058ie5A7RpO6sabxx78/Jbt1Ai0a7eX08IcRTK4A5Juxs9et+2+PnnY0FXUqtWhm5dElg9bkCQggllFJCKb09PGqyjLV13Lz26bv1Le0aba+6s8fumOItEkJiIlcECARa3YCrbVePfvXKh7nHt4Ysrvr4xH1ReBghxFMrgDmafmEJmTmf7fd+vVPV4VykYDAMQwjZ8fKx/sE7c17ak396ywZJ8qa1yjx56fHgrENF/YN3eIuU776FEJZ7zPIdl2VZ3lY4D4A3GyuWO4tkjKafHfqNXYxLKb3RbHdM7diygffc7ejWlVyqSXvl2IjVppCmeCoazSNT09OJErFrbGKCuN9o9n5o3lYA7jLW0fynmLdrnf88FQtdMSbtjvIrDUf37hqx2lrbtcuDg9KSEkNDgtU//SqXpnxxtXnANCyOiRQ9FGY0jzyyZpV7kRDimJr+rPY7ZV7WrSGLwWTZ92LG6tjIfSfOejmup1YA7qkoVfi9UTlzo4+d18B5BGNrYoKlXeV6ev3HnxVHis9U1FltfxzOfr6s8MBdq61Foz13+apt/J5EHF128mBclGjs9/Er9d9/9W0rJdS9yLUquVTDMLSy9K0HgoN0BtPuoyWm4VEv7+Rmn8FTK4DZgoVUcX5GZ2bnO5AKozbia+cALtzv+PDJN8C/ffMNgGAAIBgACEafulkUG4e5AHDtoIMVA8DzpRQWDYDZG67R2Zs6Y4tO8NlIEE9bdM6JB4DvcN/UmeJvAADc/QUFUTD8xMhd8AAAAABJRU5ErkJggg==", "Trainers": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAEbklEQVR42u3de0xTVxwH8HPaQlsYGgmKpTxT2Oi6KYk6TRd5+ICF4aJgsHUwkTgUh5GNptXKJNHgoDqBzSVsPpDxGBKXAZElyCNuTeWPITVMyiZPeVhoK7Uia0Hauz+aNJ23dTZu7NHf56/b23vOSU7Pt+fc5PYUM4LWIgDAH9HIp7gb46FfgFvpk19/VjCskVAPD0JPAbdiHfn28cC2pRR3YzxEArgzVhjHlg0KpAIAK/XwoO0+ggLdAQAZBaYLAMiTBswYADiZMQAAEAwA/jXBqCgWncrLhO4G/xW0P73Cm8kYaL/s8K2qhjax7AJ0InDHYMwaTSy+wHqcuTOh4FBaSEy6q83slZyBvgb/q2A4U/9Z/pha681kbOZH9fwynJJzQibel759C0Lo4aPHt3r7j5dWDo1N2pZSas209NNL1oKj9zUMukf0ulVUCuW7VkVB2ddmiwUhhDHOEiRmJMcHrPC9N6H5sq65pqnDYVux61dLDwjCQwImdfqapo7y2mvWGgD45+8xhEmxiu7eqG3ZKTknEEJi2QUWX8DiC6J356k10xVFIhqV6qRgnLzrDj81N01UnJoYk5oYYz3/4d7k3UlxBws+j0zYJzl98egBwfYtfHJb3kxGRVFeXfMNXmLWrsOFS17yiuQEw2cJyHa+QXmVjRc7GD/+9HNVQ9us0fTUee204djZy5yQgJfD2A4Ltsi7rjT/8Pg3o1I10KroXr86EiFE9/T44N13Pi6tVKoGjKa5TqXq0tUW4bY4clt+y5Yw6J4t8ltG09yYWvtJeV1v/wgMAkA2YyJqc6jRkS5ng/Yirf46NG7/8pWwQGm2cM1rEb5LfTDGCCG2v59qYJRccGhMbTs2zMyyVvgihCJC2V5Mem3JUYQQRhhjhDG+d19DbmtUre3ovH3t/MnG1puK7l551x3T3DwMAuDgK7iHQMh8LoN6qtFS12lZpGDMLyzYjjHGNWePtN9UvpUpndLpzRbLyI1qqpOlFOFw8qJQEEKb0sV3h8ef3RZBEGmi4g1R3Jh1rx/ZL5BJfHYdLnRYCoCWHsJ/qaUwlaK4S4w9IBZjKWVv5fJlbH+/8m+axyd1TxbMvIhQDxrVpRr6RyZMc/ObNkQ9z8UEQXQqVUVfXdn8nnhKpxcmxcIIAA4lrMKitynH6i3Pn4q/Mhi6aYNhZlaQFOvFpHM5wSXS/a7WYDTNfVHd9FFmyo6tb/p4MwNX+u1J3pqbkUy+cg0v4rTkfV54CN3TgxcRylruOzIxBSMAOEyFTEg9VGl2aR31okspe08WzFn5pSdz92QLk6YePDxf/70kkOVqJWcuXtXpH+Vm7CjLz57U6VsV3SUV35Ivu903yA0PLjt+kBPE0k4bqhvbqxraYBAAMh8GFp4zqyYIVwtiRtBaeOwcABvr7/jgIUIA/s57DAAgGABAMABwz2D0ya+zwjjQFwDYdtCBGQMA50spmDQAsN9wDdtv6gxbdAK3jQRytkXnU/EAwH2QN3XG8DcAAJD9DsTrvRjWZU1yAAAAAElFTkSuQmCC", "Packages": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAGAklEQVR42u2dezCVaRzHf+95cc5RakUrlEvYpbMtpVYpJZUKtW6bQ4ltQ8hkY91TMSK1Sql0QTa3jGaWLtuNMSuX3SnUuDROCuV+S1hHnPPuH++Oldtkd5ia8/v8d573eb7vmd/z+87vec6873MI1oJlgCDI+4iNbtIyMMa4ICJFZd69iYxBW6LxZTVGChEp6Mwfbg9iaCmlZWCMlkBEGXlVtSFvMNAVCELT+LJ6aB/BwHAgyGgYWC4QZHTRwIqBIONUDARB0BgI8vEZI/10UKCbHcYd+cgR+8B+0UGu203WAsCgQNDQ3H4jp+jn+Ot9/H6MICLSxgCAwpIKS/cQcTFST1szLtyLzWIGRiVgBBFRNwbNwKDg4ePy9N9+37JmWWBUQqTPHnvzDQDw5m3P43Je8KnEF6+aAIAgCCebLQ4WxopyMpXVdYdOX/3zybMRUhtXLT13xMP/RHzGnbzxdACAzWKGe+02M9Lr7u3LLiiWkZ7d8abbK/wCQRDOXBNHS2OFz+fU1rdcSLuVnJVDDzHU0w7Yy1VXVmhq60zOyolNuSkQCnGykenbY/hEXpbX58rrc9fYeTW2dCREeIuRJAD4OH23f5dFaEzSYlNn/xPxVsarRgy03mxw7oiH26EzGXfyJtABgIPuO/R0NM1dDxvZ+/T08jcb/PMMy4/fW9qZrXM7dEZz0x7f43H+e7nmG/QBYAablRDhlXYrl2PibLM/bNZMSU01JZxp0cT6G8YiRWI6jCFGkiuXLNq+xeB+fvHw9taOrsCoK2rKCl+oKrJZzL22ZhEXr93Je9Td21daWe17PG54Zycbk7ADjvbekSNERujQ5WLnNqOj51PLqmo6u7pDzyY3NLcDAFNC3H3HtoOnEksqnvfx+wtLKuIz7tpuXQcAstKzWEyJu3mP+/j9rxpbw2PTynk1mCKiSTefStlHrtGctDcmsZRauWRRY0HaoEDQ2NKReiM38nI6AHypOj/A1Vb3K405s6UIggAARTlZkiRZTImi0soxdayMV8tIS5k6HSyr+jdfx9SpeF6nJD9XXFzs6bMXdDeBUFjGqwEADRVFSTYz5aQ/ABBAEAQQBFHb0AIAdY2tOYWlNy+FZt4vyC8uz3tUxu9/hykimtx9SgEIYhzJo5nCtELhlBiD3nwPbyEIIjnKL7ugZPPugOa2ToFQWJObRJIkndkURY2p8+RZ9VKOho2pYVnVlYl16EsAQL1/UwBgMBgAYGTvU/Xy9Qh9iqJ2eh9boaO1dvliPxdupK+Uzf6w0d0Q0fGG3Gxh2HZGfhX1qp2ajj3GvLnSinKysam3Xje1DQwKOBoq4mIkAPBq6vn971boaI056nldo7VH6LfrV4Z4OkysAwC1DS0DA4PamgvpjySDwVFXHrqF0QqdMW9BUVRhSUXExWvrd/k0t3Xamhlifogsm74mvE0ZgenCD3fF/zVGW0dXV3cv18xQks3UUlM6GeBCt/fx+y+k3fZzsTFerTtTkq2tufDYTz8MH8irqbfaF2K+QZ/2xng6tFRSVo6fC5ejofLZrJmBbnYKcjJ0+9mkrAO7rSw2rpKawZ4/T9bBcqOnoyUA6HI0jvs6cdSVmRLiHA0V+blzauqbMT9E1hWRtqRHomBS6yj4Dz/XDmdgUOAcdCrU08HV1qy5/c2l9Nu+8+XpS8cuXnvb0xvi6TBPVrqcV3skJmnEWF5NvbVH6PWYYKCo4OhfxtMBgNCzyTPYzMzYwz1/8R/kF+f+8eTdwAAAnIjLaOt86+loER3k2tTWeT+/+GTCdQAorazWUleKDnZTWyDf2tGVlJl99dcHmCKiiRSLsI0RVNRTkx1IsBYs+4QeOycI4mFqVFJW9vmUmzjryFRAv8cn9vF/0dW6HHVlxRs5RSTJcLPbqiAnk5VdhPOHTCmfgDEelfE2rVn+IDFCks0s59VauofUN7fhzCFTuzb5tJZSCDI9Syl8HwNBxoABAJV59+RV1TAWCDJ0gg5WDAQZp2Jg0UAQeP/ANWL4oc54RCcispaA8Y7oHGEPBBEdRh/qTODfACDIaP4Gmb+XcsZXSRcAAAAASUVORK5CYII=", "Wallet": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAEa0lEQVR42u3de0xTVxwH8HNue2mrQXGwFSiMIpRJL1vWR5btVswkoC46N9hiQLPJiJtzj4xNAhNdTJaNbOAz07hFmEM7JMwscYlDjZtT4DZx0C5gW15SUKCAXRkybEsf7I/rum6VxkpNWPr7/NWe254059dvzrnt7SnmJyoRAODfuP5N6ZmrYFxAWDE2nQ8UDDYSZtM1GCkQVth3vm88sHcplZ65CiIBwllccoo3GwSkAgCW2XTNex5BwHAA4I+A6QIA/0kDZgwAZpkxAAAQDADmUzCOfV5Ssb3I9wYA/+9gvJqb0/dzLUne+TaQJLmmi8cvqqu8D1iaGGtm6pcrqBC+shN7yj4u3gwVAvM3GM1tVwV8nkyayt6VS1Nv/Xk7JTEuOmoR2/KMjJp2On/t6IYBBWEUjL7r5hHLuEouZe+qFFRTa8dvnX30Py3S1o4ex7SzsnSLmak3M/XGs9XqvWVLE2MD94wx3lqwVvPdwYFLJy7X7d20PottP7hrWzYte33Dc2xvqUnxUCowH88xmDa96u+VkkpOMVqDRmdQye+00HKqRatHCJVWVsfR+XF0/oqN281j1mOflXA5nADdvv9a3sZ1K9/a/cWy1VvKqmp2vJn/YjaNEHrvkyMXGN3Rhka2t96BYSgVuA8vP0VIRfgBBqNFq1dmpEWQJC+CVGRIGK1BozOyUUlNihdGRzW36X0ff9M6sXPfNylJ8WnJotn65EWQb29a/9GBWp2h12Z3aHSGr0+dK3h+JZQThMqkfabuHc6KZUFng3uvwWjT8yJI5eMSjLD1j8n+odGb1glxgvCR6CiVgrLZHTp9D0LoseSE8m0FigzJQ4sjMcYIIZEwxtB7/a59SsSiBQJe3f4dCCGMMMYIYzwwPAblBKFyrn0GIfehQk7FaU+9xhP6YAwMjw2OWGiZFGPM6PQIoSmbvaPLRMuktEx6pb3L6XJjjL/d9+FPjG5NUfmoZdzt8fT/oubMvpQiCAIhlPVKabdpEEoIHlw2hIs9n24gWrpnbvw+E+KlFDtpqBSUSkExWgPbotEZlyspWk41t15FCMU+vEQkjPny5JnBEYvT5aYkYpIb6ASjp3/I7pjOevrJux51uVwExlBXMEern8Ala4mdDZ57T0WQwdDqFZRELk31CYbhhWw6ZsmiFq0BIWSxTkxMTuWve3aBgJee8uj+8q2BO7TZHYfVP3xQ9FJujipyoSAhNmZzXk5xYR579MaIJSNNvFDAh9KCuaSisoDzbq07qHVU0MEgSa5l/Fb/0CjbcqW9S8DnTU7Z2jv7EEJOl/uNXQfWZCo7z9YcryptaLx82+YI3OeemlMVR04WF+bqfzz6/eHdaeIE9ekL7KHqhkYC444zX8HHteC+RfJxwSH3JeNMsE/E/EQlXHYOgBf7Oz64iBCAuS2lAIBgAADBAAD4B8PYdD4uOQXGAgDvDjowYwAw+1IKJg0AfDdcw76bOsMWnSBsI4Fm26LzP/EAIHz4b+qM4W8AAPD3F6Izo1qZkiTRAAAAAElFTkSuQmCC", "Invoices": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAFMElEQVR42u3de0xTVxwH8N+5WNrycjqm8vDBqAREXhHUIaAo8pKpwFZgKqCTl5sBFXk4hnFOBcEpDhdlonGCASJsEtgElLmUClt4bZOyiB0FVlEeEkTWFmzv/mjS1HYscwka19/nr5uTc26ac8+359zc21PCmu8KCKFnzdAusvP0xX5BOqWTV/tPwVBGor9biD2FdIpy5KvHg6iWUnaevhgJpMvMrKxV2aAwFQgp9XcLVfcRFHYHQtoonC4Q0p40cMZAaIoZAyGEwUDoVQjGxezko/t24JVAr2Qw8jISKs5kYn8hHTHjpX+C7am5eBnQ/yEYZaczeu8PsJgMLzdHPYr6uo5/MO8ruUKxbbNPSgzXZWPCU7lcWfOLQ7sNWKzo1BwGY0Z6XHion8csEyOBsPfTM8UNLR2qpVT/wKMDJy4AACEkJiwgKtjXYu7rncLeg6cv//Tzb4SQ2PDA6BBf8zmze8QD50qqiyvrlW3XrHA6EB/OWWj+YGikuLL+7JUquUKBFxW9tHuMiCBvXvMdd27S1uRsbuBqbuBqAKi82TjTyMDTbamyjgGb6e/pWl7DA4C02LBN697akXbCISjuBr+1+LO0BeZztE+bEvNuYmTw4fwihw2x6bkXQn1XAcCe7SHvBXnvOvi5rd/O1JzC9PjwzT7uAGDIZl3M2ldSfcs+MDYs8YiJkYGt9QK8okjdO8upJRbkxQWjhtdcWv3Dkz8lbYJ7dfzWFU62ADA6Nn6zqT3Uz0NZJ8Br+VO5orahhanP2Mn1P3aupKWja3RsPLfwapdIvJMboHFONosZHxGUVVB6ndc8Ni5p7xSm5hQy9RkfbNn48alLbYJ7EqmssU1w4WpNxNveAGA6y4TF1K/htUiksr7+wWNnSzq6RDgUkLoxKX3lQz0v2+fOxn+8x/i9r191PDo2bjZntvK4/DrvVEYCm8WUSGWhfh5V3zfJJiZtrCz1GYxWwT1Vk5Y7XTaLLDXOyVlozmLqN7V3qhcuXmRhwGZeOZkOAAQIIUAI6bk/AAC9/YP1je1VXx6+Vneb39rBa74jlU3gUEDPfIP/QgPI86P1jl5TlDQqpj0Y9BTldfxWuVzh7+nKa/7V021peOJRANBOKyFE+xyEEACg6WfKKYoCgLXbUu52/6H5GWh6a3L2Sme71W4OaXHhx1ONwxKPaFdDmI25MxVHuBT/Lt03TE/vUmoqsonJ6ls/hvh5bPJxHxwebWwXAIBI/HBictLFjqOq5rKEc1ck1mjbJRJLZRMrne20C9eudP77fNJ0Y5sgq6B0XWTKw6GRiKA1OA6QBj9HkryB+qhM8e9TAdPxgK+ipmHNCsfIzT4VtQ0KBa1My/my62lxYS5LOCZGhnu2h9hYWZwv+06joUQqO1fybVpcmK/HMiMDtpPtm9n735dIZWeKKvfuCA1ev8rYkG05zzQqZH1SdAgALLNfnJMaY89ZyNRn2C9eZPbGbJH4IY4DpJGK4xF6uy/Jn2sdBdPxHON2m2BweNTGyjI+87SqMKuglKLIpeP7XzM2FAh7t+zN6r0/oN02u6D08ZPxT5Ki5pnO6ujqOZRfBAC5hVeHRh4nRQfnZSQ8GBqp47eevFgOAO2dQjvOgrzMXdbzzQYfjRZdu3n5mxs4FJA6YxaJyJcLxPTzNiSs+a742jlCKsrf8eFLhAi9kHsMhDAYCGEwENKpYHTyas2srLEvEFLtoIMzBkJTL6Vw0kBIfcM1or6pM27RiXQ2EjDVFp0a8UBId2hv6kzwbwAQ0vYXcCEBXW0fYP4AAAAASUVORK5CYII=", "Expenses": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAE90lEQVR42u3de0xTVxwH8HNvoS1PJ/KwMEQFFh6bQMQJGHk5MeOhk22FKptMJw9hghuDMXHgRh3ihoIgjA0Z8rASHcJgBtiKSwcNCVIwUqY8FbEIuI6XbU3o3R9Nbrq1ZbKIyejvE/4op+f+bnJ6vznnJOWA0a3dEQDg73RUmxy3BsC4AK3Sy2taKBiKSIiGBmCkgFZRPPnK8cDIpZTj1gCIBNBmjHW2ZDZwSAUACqKhAXIfgcNwAKAKh+kCANVJA2YMADTMGAAACAYAEAwA/hOdp+yXmxbLDPRRbrk9dN93bxKMINDqYCCE+AJhaNznMGQAgvHvVr1gzC3PLqtpzjl/BSHkZLfmWgk7LiO/vqW9Oi9tRDRhqE/fstGZguOVddwTRRflcgIhhGFYVHhgZGiApbnJ3dHxbzgNlXVcRcHqvLR7D8bpNF3vTRsoOF7T3Jqee2FeLkcI+W52+TQm3M7GcmxSXFnHLaqqn5fLNZVS2xk+b/Cc9hiP/pxOyCxMjAx1f/klOo1aePxwTVNbfUu74t09IX43bw95MY/sT81hBfsdDAtUtB95L3RPsN+h9LMOO95POVWSGhP+xmteZE1WsB+v45YXMzEi6SQz0EexhDPQo5dmfcRpuO4cGBWWwDY21HewXaOplKbOQNu89SruZIUtbTA83ZxEbRzy5+vUaEX79fbu739oKsiIz0o6QKXqHs0pJS/p6h0oqKibnp3jC4T5FbUx4UEIIRpVN27vzmNnygTCfolUxhcIz19uZIX4kVc18jouNfw6+1giEPY3t3ZudnFACJmuNKbTqI28GxKpbEQ08WURp6dvWFMptZ3hKdFCM1KiKp7i7bDobDybPUZmQZW/h8vbr3uHRB+bk0jJ9u7eQaWQDK42MzEy0LOxstDXo1WdTkUIYQjDMIRh2N0H42TPwRER+XpqZo5hboIQuiea4PK76r/9ora5rbWzh9dxSyp7Yr/WSm0ptZ3hKdFCjTcJhObzIyknauUcvnxJgrEAa4aZpfkqAhE2lhadPf1kO4EINZMUjiOE/N9JvjN0X201Qm0jQUQknfRwdfTZ9Mon0eHZKUZhCewFSql21nQ7sOyzYbFCzmbirXeIkUfEc9pjIIR0dSjnMuIbf7tx/GxF1scHrCxMybdcHW2VXq8fmxTPzEn6hkelsif+Hq6LvRFBEHyBMKv40rZ3kx9OilnBvguUUu0Mj4h22rEBSwrCj1bLnz4VzyYYyVFhpitXpGSXfFd9rbOnLz89DscxMhhxETuNDfU93ZziI3YVcxoQQhKprKCi7sP9b+7evsXIQO/F1ab7QrcnRoYufJeNzvanUg4629nQqLrO9msZZibDow81lVLbGR4R7UxFNovyQdn8otZRi1tKKTbf5K+PJTLbbfs83ZxiWEFhCezp2TmEUEJmIbc8Oz5iV96Fqwihi/UtLg7rY6vP6FAoVT+2FHN+Ulz7VcnlSfF0YuTu3LTYsUlxc2vn6dIrC9+9q3fA0W5N7meHbK0ZE39MVdT+Un71Z02lxFOzajsDbWNEx1j588JRYrEXYnRr9yX62nl1Xlr374Psc1Xw8YD/EcXf8cF3pQBYmj0GAMuPztKVZh7OhPEFMGMAsLyC0ctrYqyzhbEAgDxBB2YMADQvpWDSAED5wDVM+VBnOKITaG0kkKYjOv8RDwC0h+qhzhj8GwAAVP0FY+Jrg4KaDoUAAAAASUVORK5CYII=", "Notifications": "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", "School Settings": "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", "Audit Logs": "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", "Help & Support": "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", "New Student": "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", "New Lesson": "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", "New Trainer": "iVBORw0KGgoAAAANSUhEUgAAAQgAAAAgCAIAAABhHHFHAAAFfklEQVR42u2ce0xTdxTHzy0FSgrIK2J5rLzk1aE4oEQnjAkoMhkzgkzcjEYWdWw4ZEtm3GQzovM5yJ5OI3FTMIBCIo7S6aaRioIiOHlU5VGLQHm0YKHlUXr3x006LFBLlYjhfP6699z7e5zf/X1zzq/95UcwnAMBQZCnoY83+YQsx3FBZhX11/haFmJsxKAk0S5V40ghswqWDU1LHkb0OQ4aVbRL1f1KEocJmW30K8l+Jenq7dH9qJGy0MaqAgcImc20S9WadQQNhwNBxkPDcIEg44MGRgwEmSRiIAiCwkAQFAYAAFz59bP2kv1ZafH4vRE9oev5Xu7eTWEBngBw4Pe/MnP/BgBLJkNYkA4Au48VHy8SvPCeCQvSLZmMCR/tyy79Ie8Kfjzk5QtDQ3J86B9/3uzpG5junnnFfUtdpCdFb10TAgALE/d1yuQGVBW2NRO/NDK9wjA3M01NXPbVLxcmSMsIYnPskvVRQa4OtjK5svp+64FT/PqWjoTIgMwdcUPDqvlrvhlRjR7ftX7V0tdz+bd2fH/Oksmoz99NI4ikjDMXy+7pnxp5se155XV9/coQf4+hEdWSzYfz9ieF+LsDgJoke+WKilpRRjbvobhL837epartR/I1tyXXaztl8vAgbysLs8paUVrW+fbuPh1e6Ggap9FsX2M0t/XIFUMbooNdWLbjnx5MWb1nyyqJVP7Gh99tP5IfwfUqyUpeMN9RUNMIAKYm9AUejgAQ5MsGgGCOCwBwOS40giBJsvxu81S7HrXYt7JOtCTpMDU11+48wVq5k7Vyp0/8nrP821GLfU+lbzAxpusoXlbduCr1Z9kTxduBnukfRev2QkfTyIwlbtGA77yRaReGTK74Kf+qMd3oy43aO3BdHWwTVwQCwNGcyz19A1erHlQ1iE1N6B/HhbZ29oolMgDgctguLFt7Gwu5YsjN0c7OypzLYQNAg0gifTLl3OyOUHyGVzk0rNKyPxkYPF1SAQBujnYcN9ZkxW83iIvL7kmk8hv3mgHAz91Btxf6NI3MNOSDtJyNnaEeg9OeSv1WWLYpZvG7IX45vMqxdn9PJ4IgAKDo0JanBMOyBYDrd5sSIgO4HBdqcXLq4o1P4t/icthU3BDUNBngc3Nbz9jbCK53SkKYj+s8JsOE6gkAOM21uiMUT1j8UYeUuqDmNxVbdHsxWdPIjKW03gzA5sf47n1867O3mdMoDOXQyOHTlw6lrN61KWqsXTMXw7ZmCkUSrVKCmqaEyIAgX3ZP38DwiOpEkSA5LnTpQveF850o2Rjgs2r0/20sbo52J7/+wJhulHGSd6ywzNneWnAiDQCMaLRnFidJUk8vJmwamfnasLe0yoiRCppMxTJ9J7wh/2Pklt56KO7SSrur77dSF4E+r40vIrjbCAC2c5gxIX41Dx5LpHKhqHNtRICpCZ0kyfJ/m5/TeT93B2O6EQDkXaoaUY26O9kZVo9uL5BXkRU+ys+X9e66YKO/KgwUxqhanZHN0zI2Pe7O5d8CgNR1y/w8HMzNTBd5Oe/dFrPhnWAAaOvqE3VIAcCSyaioFQFARW0L08wEAOqaO3rliud0vkEkUZMkAEQGe8+1ttiRGG5YPbq9QF5FVRx8T/ppgd2U8ihDUikKXnldZZ2I+n1JwxdZhQ0tkveXBxQf3aYYHH4g7jr/T3XB5TuabIo9z4aSBADcrG2hZptheZQWQpEkLfNc6rrw/cmxSbFv5pRW+ns6GVaVbi+QVwsLhnpd9ty6DuOpFiQYzoG47RxBNLBsaPXX+LiJEEFe0BoDQVAYCILCQBBEI4z6a3zqXB0EwZU3dboU6gFBJk+lMGggiCZcAB7RiSAw0RGdxPjTzvFQZ2S28YxDnREEofgPE4Rw0eFDEqwAAAAASUVORK5CYII=", "Add Deposit": "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"};

function sheetOpenForm_(section, mode) {
  if (section !== 'dashboard' && !Object.prototype.hasOwnProperty.call(CONTROL_CENTER_SHEETS, section)) throw new Error('Unknown form.');
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var dashboard=ss.getSheetByName('Dashboard');
  var language=dashboard?String(dashboard.getRange('A25').getDisplayValue()||'EN').trim().toUpperCase():'EN';
  if(['EN','NL','AR'].indexOf(language)<0)language='EN';
  // Reading the small, scoped data set on the button invocation saves a
  // second Apps Script round trip after the modal opens.
  var initial=section==='students'&&mode==='browse'?
    {students:controlCenterRows_(ss,'Students').map(function(s){return {'Student ID':s['Student ID'],Name:s.Name,Email:s.Email,Phone:s.Phone,City:s.City};})}:
    tarekFormsGetDataFor(section,mode);
  var source = tarekFormsHtml_();
  var marker = '/* CONTROL_CENTER_FORM_ENTRY */';
  if (source.indexOf(marker) < 0) throw new Error('Update ControlCenter.html before installing the buttons.');
  source = source.replace(marker, 'formEntry=' + JSON.stringify({section:section,mode:mode,lang:language}) + ';');
  source = source.replace('/* CONTROL_CENTER_DATA_ENTRY */',
    'initialData='+JSON.stringify(initial).replace(/</g,'\\u003c')+';');
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(source).setWidth(940).setHeight(640), 'TAREK RIJSCHOOL — ' + section);
}
function tarekStudentDossier(studentId){
  var ss=SpreadsheetApp.getActiveSpreadsheet(),id=String(studentId||'').trim();
  if(!id)throw new Error('Select a student.');
  var student=controlCenterRows_(ss,'Students').filter(function(r){return String(r['Student ID'])===id;})[0];
  if(!student)throw new Error('Student no longer exists.');
  var sources={lessons:'Lessons',wallet:'Wallet',invoices:'Invoices',notifications:'Notifications',documents:'Documents',audit:'AuditLogs',routes:'RouteTracking'};
  var related={};
  Object.keys(sources).forEach(function(key){
    related[key]=controlCenterRows_(ss,sources[key]).filter(function(r){
      if(String(r['Student ID']||r['Target Student ID']||r['Owner ID']||'')===id)return true;
      if(key==='audit')return String(r['Target Record']||r['Student ID']||'').indexOf(id)!==-1;
      return false;
    });
  });
  return {student:student,related:related};
}
function tarekDeleteStudentPermanently(studentId,confirmation){
  var lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    var ss=SpreadsheetApp.getActiveSpreadsheet(),id=String(studentId||'').trim();
    if(String(confirmation||'').trim()!=='DELETE '+id)throw new Error('Type DELETE followed by the exact student ID.');
    var students=ss.getSheetByName('Students'),headers=controlCenterHeaders_(students);
    var found=controlCenterFindRowById_(students,headers,'Student ID',id);
    if(found.row<2)throw new Error('Student no longer exists.');
    var old=students.getRange(found.row,1,1,headers.length).getDisplayValues()[0];
    var email=String(old[headers.indexOf('Email')]||'').trim();
    if(!email)throw new Error('Cannot verify the Firebase account without student email.');
    var auth=tarekSignedBackendPost_('/api/admin/delete-student-auth',{studentId:id,email:email});
    if(auth.skipped||auth.status!==200)throw new Error('Firebase account deletion failed; no rows were deleted. '+(auth.body||auth.reason||''));
    var related={'Lessons':['Student ID'],'Wallet':['Student ID'],'Invoices':['Student ID'],'Notifications':['Student ID','Target Student ID'],'Documents':['Owner ID'],'RouteTracking':['Student ID'],'AuditLogs':['Student ID']};
    var counts={};
    Object.keys(related).forEach(function(name){
      var sheet=ss.getSheetByName(name);if(!sheet||sheet.getLastRow()<2){counts[name]=0;return;}
      var h=controlCenterHeaders_(sheet),indices=related[name].map(function(k){return h.indexOf(k)}).filter(function(i){return i>=0});
      if(!indices.length){counts[name]=0;return;}
      var values=sheet.getRange(2,1,sheet.getLastRow()-1,h.length).getDisplayValues(),removed=0;
      for(var i=values.length-1;i>=0;i--){if(indices.some(function(c){return String(values[i][c]||'')===id;})){sheet.deleteRow(i+2);removed++;}}
      counts[name]=removed;
    });
    students.deleteRow(found.row);
    controlCenterAudit_('Permanent student deletion',id,'Student and Firebase account deleted',JSON.stringify(counts));
    dispatchWebhookChangeEvent('Students','DELETE_ROW',id,{studentId:id},id);
    return{success:true,id:id,relatedDeleted:counts};
  }finally{lock.releaseLock();}
}
function installSheetFormButtons() {
  if(typeof controlCenterGetData !== 'function')throw new Error('Install TarekControlCenter.gs first.');
  var source = tarekFormsHtml_();
  if (source.indexOf('/* CONTROL_CENTER_FORM_ENTRY */') < 0) throw new Error('Update ControlCenter.html first.');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
  if (!sheet) throw new Error('Dashboard sheet is missing.');
  if(sheet.getMaxRows()<25||sheet.getMaxColumns()<3)throw new Error('Dashboard layout is incomplete.');
  var width = sheet.getColumnWidth(1) + sheet.getColumnWidth(2) + sheet.getColumnWidth(3) - 8;
  var old = sheet.getImages().filter(function(img){return img.getAltTextTitle().indexOf('TAREK_FORM_BUTTON:') === 0;});
  var created = [];
  var rowHeights = {};
  try {
    SHEET_FORM_BUTTONS.forEach(function(item) {
      var currentHeight = sheet.getRowHeight(item.row);
      rowHeights[item.row] = currentHeight;
      var targetHeight = Math.max(currentHeight, item.row >= 19 ? 32 : 30);
      var blob = Utilities.newBlob(Utilities.base64Decode(SHEET_FORM_BUTTON_PNG[item.label]), 'image/png', item.handler+'.png');
      var image = sheet.insertImage(blob, 1, item.row, 4, 1);
      created.push(image);
      image.setWidth(width).setHeight(targetHeight-3);
      image.setAltTextTitle('TAREK_FORM_BUTTON:'+item.handler).setAltTextDescription(item.label);
      image.assignScript(item.handler);
    });
    SHEET_FORM_BUTTONS.forEach(function(item) {
      var desired = Math.max(rowHeights[item.row], item.row >= 19 ? 32 : 30);
      if (rowHeights[item.row] < desired) sheet.setRowHeight(item.row, desired);
    });
  } catch (error) {
    created.forEach(function(image){image.remove();});
    Object.keys(rowHeights).forEach(function(row){try{sheet.setRowHeight(Number(row),rowHeights[row]);}catch(ignore){}});
    throw error;
  }
  old.forEach(function(image){image.remove();});
  SpreadsheetApp.getActiveSpreadsheet().toast('Sidebar form buttons installed.', 'TAREK RIJSCHOOL', 5);
}
function removeSheetFormButtons() {
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
  if (!sheet) return;
  sheet.getImages().filter(function(image){return image.getAltTextTitle().indexOf('TAREK_FORM_BUTTON:')===0;}).forEach(function(image){image.remove();});
}

function sheetButton0() { var ss=SpreadsheetApp.getActiveSpreadsheet();var sh=ss.getSheetByName('Dashboard');if(sh){ss.setActiveSheet(sh);sh.getRange('D4').activate();} }
function sheetButton1() { sheetOpenForm_('students', 'browse'); }
function sheetButton2() { sheetOpenForm_('lessons', 'new'); }
function sheetButton3() { sheetOpenForm_('trainers', 'new'); }
function sheetButton4() { sheetOpenForm_('packages', 'new'); }
function sheetButton5() { sheetOpenForm_('payments', 'new'); }
function sheetButton6() { sheetOpenForm_('invoices', 'new'); }
function sheetButton7() { sheetOpenForm_('expenses', 'new'); }
function sheetButton8() { sheetOpenForm_('notifications', 'new'); }
function sheetButton9() { sheetOpenForm_('settings', 'view'); }
function sheetButton10() { sheetOpenForm_('audit', 'view'); }
function sheetButton11() { sheetOpenForm_('help', 'view'); }
function sheetButton12() { sheetOpenForm_('students', 'new'); }
function sheetButton13() { sheetOpenForm_('lessons', 'new'); }
function sheetButton14() { sheetOpenForm_('trainers', 'new'); }
function sheetButton15() { sheetOpenForm_('payments', 'new'); }
function tarekFormsHtml_(){return "<!doctype html>\n<html><head><base target=\"_top\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<style>\n:root{--navy:#0d162d;--blue:#0d3b7d;--gold:#d3ae37;--ink:#0d162d;--muted:#65768d;--line:#e1e9f1;--bg:#f4f7fb;--tint:#e9f2ff}\n*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--bg);font:14px \"Segoe UI\",Arial,sans-serif}\nbutton,input,select,textarea{font:inherit}.shell{max-width:940px;min-height:100vh;margin:auto;background:#fff;box-shadow:0 12px 40px #10243b12}\n.hero{display:flex;align-items:center;gap:17px;padding:25px 30px;color:#fff;background:linear-gradient(110deg,#0d162d,#112d50 70%,#0d3b7d);border-bottom:4px solid var(--gold)}\n.mark{width:54px;height:54px;flex:none;display:grid;place-items:center;border:1px solid #ffffff55;border-radius:16px;background:#ffffff18}\n.mark svg{width:27px;height:27px}.hero h1{font-size:23px;margin:2px 0 4px;letter-spacing:-.4px}.hero p{margin:0;color:#d0e1f2;font-size:12px}\n.eyebrow{color:#f7d881;font-weight:800;font-size:10px;letter-spacing:1.8px}.body{padding:23px 30px 28px}.lead{display:flex;gap:12px;align-items:flex-start;padding:13px 16px;background:#eff6ff;border:1px solid #d3e5ff;border-radius:12px;color:#2b5a8f;margin:0 0 19px;font-size:12px;line-height:1.5}\n.lead svg{width:19px;height:19px;flex:none}.fieldset{border:1px solid var(--line);border-radius:17px;padding:20px;margin-bottom:16px;background:#fff;box-shadow:0 3px 16px #0b203608}\n.fieldset h2{display:flex;gap:10px;align-items:center;font-size:15px;margin:0 0 17px;color:#142c47}.fieldset h2 span{display:grid;place-items:center;background:#e8f2ff;color:#1769cf;border-radius:9px;width:28px;height:28px}\n.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.field{min-width:0}.field.wide{grid-column:1/-1}.field label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#4d6078;margin-bottom:7px}.field label svg{width:15px;height:15px;color:#2472ca}.field label em{font-style:normal;color:#df5964}\n.control{width:100%;border:1px solid #d9e4ee;border-radius:10px;background:#f8fafc;color:#1c3046;outline:none;padding:10px 12px;min-height:42px;transition:.15s}.control:focus{border-color:#2884e8;box-shadow:0 0 0 3px #2884e822;background:#fff}.control:disabled,.control[readonly]{color:#7a8aa0;background:#f1f5f9}.control.textarea{min-height:92px;resize:vertical;line-height:1.5}.control.range{padding:8px 0;accent-color:var(--blue);border:0;background:transparent}.meter{display:inline-flex;padding:3px 8px;border-radius:999px;background:#e8f2ff;color:#1769cf;font-size:11px;font-weight:800}\n.field.help-lang{grid-column:1/-1;padding:12px;border:1px solid #e2ebf5;border-radius:12px;background:#f9fbfe}\n.field.help-lang h3{margin:0 0 12px;font-size:12px;color:#1769cf}.field.help-lang.ar{direction:rtl}.field.help-lang.ar h3{color:#008f72}.field.help-lang.nl h3{color:#bd8424}\n.footer{position:sticky;bottom:0;background:#fff;border-top:1px solid var(--line);padding:15px 30px;display:flex;justify-content:space-between;gap:12px;align-items:center}\n.footer .hint{font-size:11px;color:#7d8da0}.buttons{display:flex;gap:9px}.button{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:10px;min-height:40px;padding:0 17px;font-size:12px;font-weight:800;cursor:pointer}.button svg{width:16px;height:16px}.button.primary{background:linear-gradient(110deg,#0d3b7d,#135098);color:#fff;box-shadow:0 5px 14px #156dd535}.button.secondary{background:#f1f5f9;color:#44556b}.button:disabled{opacity:.55;cursor:default}\n.busy{position:fixed;inset:0;display:grid;place-items:center;background:#f3f7fbea;z-index:10;color:#203a58}.busy[hidden]{display:none}.busy .message{padding:21px 30px;background:#fff;border:1px solid #d9e4ee;border-radius:14px;box-shadow:0 18px 50px #0b203625}.spin{width:22px;height:22px;border-radius:50%;border:3px solid #d5e5f8;border-top-color:#1769cf;display:inline-block;vertical-align:middle;margin-right:10px;animation:rotate .8s linear infinite}@keyframes rotate{to{transform:rotate(360deg)}}.error{margin:15px 30px 0;padding:12px 15px;background:#fff0f1;border:1px solid #ffd4d7;border-radius:10px;color:#a72e3f;font-size:12px}.error[hidden]{display:none}\n.list{overflow:auto;max-height:400px;border:1px solid var(--line);border-radius:12px}.list table{width:100%;border-collapse:collapse;font-size:12px}.list th,.list td{border-bottom:1px solid var(--line);padding:10px;text-align:left;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.list th{background:#f4f7fb;color:#49627d}.empty{text-align:center;color:#7d8da0;padding:28px}\n@media(max-width:620px){.hero,.body,.footer{padding-left:17px;padding-right:17px}.grid{grid-template-columns:1fr}.field.wide{grid-column:auto}.hero h1{font-size:19px}.footer .hint{display:none}}\n</style></head><body>\n<div class=\"shell\"><header class=\"hero\"><div class=\"mark\" id=\"heroIcon\"></div><div><div class=\"eyebrow\">TAREK RIJSCHOOL · CONTROL CENTER</div><h1 id=\"title\">Opening form</h1><p id=\"subtitle\">Loading the fields for this action…</p></div></header>\n<main class=\"body\"><div class=\"lead\"><span id=\"leadIcon\"></span><span id=\"leadText\"></span></div><div id=\"content\"></div></main>\n<footer class=\"footer\"><span class=\"hint\" id=\"footHint\">Google Sheets · Live data</span><div class=\"buttons\"><button class=\"button secondary\" type=\"button\" onclick=\"google.script.host.close()\">Cancel</button><button class=\"button primary\" id=\"submit\" type=\"submit\" form=\"recordForm\" hidden></button></div></footer></div>\n<div class=\"error\" id=\"error\" hidden></div><div class=\"busy\" id=\"busy\" hidden><div class=\"message\"><span class=\"spin\"></span><span id=\"busyText\">Loading…</span></div></div>\n<script>\nlet formEntry=null; /* CONTROL_CENTER_FORM_ENTRY */\nlet initialData=null; /* CONTROL_CENTER_DATA_ENTRY */\nconst cfg={\n students:{icon:'user',title:'Register a Student',subtitle:'Create the student profile used in your school app.',group:'Student details',hint:'The Student ID is generated automatically. Use Add Deposit to add wallet funds.',fields:['Student ID','Status','Name','Email','Phone','Date of Birth','City','Current Package','Balance (€)','Exam Readiness (%)','Theory Exam Status','New Password']},\n lessons:{icon:'calendar',title:'Schedule a Lesson',subtitle:'Add a lesson to the training calendar.',group:'Lesson details',hint:'Choose an existing student and trainer before scheduling.',fields:['Lesson ID','Student ID','Trainer Name','Date','Time','Duration (h)','Price (€)','Pickup Location','Status','Rating','Instructor Notes']},\n trainers:{icon:'trainer',title:'Register an Instructor',subtitle:'Create an instructor profile for lessons.',group:'Instructor details',hint:'Enter the name, email and hourly lesson rate.',fields:['Trainer ID','Status','Name','Email','Phone','License','Vehicle','Rate (€)']},\n packages:{icon:'box',title:'Create a Package',subtitle:'Configure the lessons and benefits shown in the app.',group:'Package details',hint:'Enter the included features one per line.',fields:['id','displayOrder','name','description','hours','price','discountPrice','badge','popular','recommended','colorTheme','isActive','features']},\n payments:{icon:'wallet',title:'Add a Deposit',subtitle:'Credit a student wallet using the existing payment workflow.',group:'Deposit details',hint:'The balance is updated when you save the deposit.',fields:['Student ID','Type','Amount (€)','Description']},\n invoices:{icon:'invoice',title:'Create an Invoice',subtitle:'Generate a PDF invoice for a student.',group:'Invoice details',hint:'Creating an invoice makes a PDF in Drive. It is not emailed automatically.',fields:['Student ID','Amount (€)','Description']},\n expenses:{icon:'wallet',title:'Record an Expense',subtitle:'Keep school costs organised by category.',group:'Expense details',hint:'Select a category and enter a positive amount.',fields:['Date','Category ID','Amount (€)','Description','Vendor','Payment Method','Receipt URL','Status']},\n notifications:{icon:'bell',title:'Create a Notification',subtitle:'Prepare an announcement for your app notification centre.',group:'Notification details',hint:'This records a notification in the sheet; review recipient choices before saving.',fields:['Recipient Role','Target Student ID','Type','Title','Message']},\n settings:{icon:'settings',title:'School Settings',subtitle:'Update the school profile used in the app.',group:'School profile',hint:'Only the fields displayed here are changed; all other school settings stay in place.',fields:['name','shortName','slogan','phone','email','website','address','city','postalCode','country','kvk','btw','iban','aiAssistantName','lessonPricePerHour','aiSystemInstructions']},\n audit:{icon:'shield',title:'Audit Logs',subtitle:'Review recent activity in the school.',group:'Recent activity',hint:'The audit log is read only.',fields:[]},\n help:{icon:'help',title:'Help & Support',subtitle:'Create an FAQ entry in the app’s languages.',group:'Frequently asked question',hint:'Write at least one question. Available columns are saved in Help & Support.',fields:['Category','Order','Active','Question_EN','Answer_EN','Question_NL','Answer_NL','Question_AR','Answer_AR']}\n};\nconst names={'Student ID':'Student ID (Immutable)','Trainer ID':'Instructor ID','Lesson ID':'Lesson ID','Name':'Full Name','Email':'Email','Phone':'Phone','Date of Birth':'Date of Birth','New Password':'Login password','City':'City','Current Package':'Current Package','Balance (€)':'Wallet Balance (€)','Exam Readiness (%)':'CBR Exam Readiness','Theory Exam Status':'Theory Exam Status','Rate (€)':'Hourly Lesson Rate (€)','Trainer Name':'Trainer','Duration (h)':'Duration','Price (€)':'Price (€)','Instructor Notes':'Instructor Notes & Feedback','Amount (€)':'Amount (€)','Description':'Reason / Description','Recipient Role':'Target Audience','Target Student ID':'Select Student','Type':'Notification Category','Message':'Message Content','id':'Package ID','name':'Official Name','shortName':'Short Name','slogan':'Slogan / Tagline','address':'Address','city':'City','postalCode':'Postal Code','country':'Country','phone':'Phone','email':'Email','website':'Website','kvk':'KVK','btw':'BTW / VAT ID','iban':'IBAN Bank Account','aiAssistantName':'Assistant Persona Name','lessonPricePerHour':'Base Lesson Rate (€/h)','aiSystemInstructions':'AI System Instructions','hours':'Hours','price':'Price (€)','discountPrice':'Discount Price (€)','badge':'Badge (Optional)','displayOrder':'Display Order','features':'Included Features (one per line)','isActive':'Active','popular':'Popular','recommended':'Recommended','Date':'Date','Time':'Time','Status':'Status','Category':'Category','Category ID':'Expense Category','Payment Method':'Payment Method','Vendor':'Vendor','Receipt URL':'Receipt URL'};\nconst locale={\nAR:{ui:['إلغاء','حفظ','جارٍ التحميل…','جارٍ الحفظ في الشيت…','تم الحفظ','اختر…','يُنشأ تلقائيًا','النشاط الأخير','لا توجد سجلات بعد'],sections:['تسجيل طالب جديد|بيانات الطالب','جدولة درس|بيانات الدرس','تسجيل مدرب|بيانات المدرب','إنشاء باقة|بيانات الباقة','إضافة رصيد|بيانات الإيداع','إنشاء فاتورة|بيانات الفاتورة','تسجيل مصروف|بيانات المصروف','إنشاء إشعار|بيانات الإشعار','إعدادات المدرسة|بيانات المدرسة','سجل العمليات|النشاط الأخير','المساعدة والدعم|الأسئلة الشائعة'],fields:'رقم الطالب|الحالة|الاسم الكامل|البريد الإلكتروني|الهاتف|المدينة|الباقة الحالية|رصيد المحفظة (€)|الاستعداد للامتحان|حالة الامتحان النظري|رقم الدرس|المدرب|التاريخ|الوقت|المدة (ساعة)|السعر (€)|مكان الانطلاق|التقييم|ملاحظات المدرب|رقم المدرب|الرخصة|السيارة|أجرة الساعة (€)|المبلغ (€)|الوصف|الفئة|طريقة الدفع|المستلمون|الطالب المستهدف|العنوان|نص الإشعار'},\nNL:{ui:['Annuleren','Opslaan','Gegevens laden…','Opslaan in spreadsheet…','Opgeslagen','Selecteer…','Automatisch aangemaakt','Recente activiteit','Nog geen logboekregels'],sections:['Leerling inschrijven|Leerlinggegevens','Les plannen|Lesgegevens','Instructeur registreren|Instructeurgegevens','Pakket maken|Pakketgegevens','Saldo toevoegen|Stortingsgegevens','Factuur maken|Factuurgegevens','Uitgave registreren|Uitgavegegevens','Melding maken|Meldingsgegevens','Schoolinstellingen|Schoolprofiel','Controlelogboek|Recente activiteit','Hulp en ondersteuning|Veelgestelde vragen'],fields:'Leerlingnummer|Status|Volledige naam|E-mailadres|Telefoon|Stad|Huidig pakket|Saldo (€)|CBR examenvoorbereiding|Status theorie-examen|Lesnummer|Instructeur|Datum|Tijd|Duur (uur)|Prijs (€)|Ophaallocatie|Beoordeling|Notities instructeur|Instructeurnummer|Rijbewijs|Voertuig|Uurtarief (€)|Bedrag (€)|Omschrijving|Categorie|Betaalmethode|Ontvangers|Geselecteerde leerling|Titel|Bericht'}};\nconst fieldKeys='Student ID|Status|Name|Email|Phone|City|Current Package|Balance (€)|Exam Readiness (%)|Theory Exam Status|Lesson ID|Trainer Name|Date|Time|Duration (h)|Price (€)|Pickup Location|Rating|Instructor Notes|Trainer ID|License|Vehicle|Rate (€)|Amount (€)|Description|Category|Payment Method|Recipient Role|Target Student ID|Title|Message'.split('|');\nconst sectionKeys='students|lessons|trainers|packages|payments|invoices|expenses|notifications|settings|audit|help'.split('|');\nfunction local(){return locale[formEntry&&formEntry.lang]||null}\nfunction phrase(i,fallback){return local()?.ui[i]||fallback}\nfunction heading(key,i){const k=sectionKeys.indexOf(key);return local()?.sections[k]?.split('|')[i]||[cfg[key].title,cfg[key].group][i]}\nfunction fieldName(h){const k=fieldKeys.indexOf(h);return (k>=0?local()?.fields.split('|')[k]:null)||names[h]||h}\nconst moreFields={AR:{'Date of Birth':'تاريخ الميلاد','New Password':'كلمة مرور الدخول','id':'رقم الباقة','displayOrder':'ترتيب العرض','name':'الاسم','description':'الوصف','hours':'الساعات','price':'السعر (€)','discountPrice':'سعر الخصم (€)','badge':'الشارة','popular':'شائعة','recommended':'موصى بها','colorTheme':'لون الباقة','isActive':'نشطة','features':'المزايا (كل ميزة في سطر)','Category ID':'فئة المصروف','Vendor':'الجهة','Receipt URL':'رابط الإيصال','shortName':'الاسم المختصر','slogan':'الشعار','website':'الموقع الإلكتروني','address':'العنوان','city':'المدينة','postalCode':'الرمز البريدي','country':'البلد','phone':'الهاتف','email':'البريد الإلكتروني','kvk':'رقم KVK','btw':'رقم الضريبة','iban':'رقم IBAN','aiAssistantName':'اسم المساعد','lessonPricePerHour':'سعر ساعة الدرس','aiSystemInstructions':'تعليمات المساعد','Order':'ترتيب العرض','Active':'فعال','Question_EN':'السؤال بالإنجليزية','Answer_EN':'الإجابة بالإنجليزية','Question_NL':'السؤال بالهولندية','Answer_NL':'الإجابة بالهولندية','Question_AR':'السؤال بالعربية','Answer_AR':'الإجابة بالعربية'},NL:{'Date of Birth':'Geboortedatum','New Password':'Inlogwachtwoord','id':'Pakketnummer','displayOrder':'Weergavevolgorde','name':'Naam','description':'Omschrijving','hours':'Uren','price':'Prijs (€)','discountPrice':'Kortingsprijs (€)','badge':'Label','popular':'Populair','recommended':'Aanbevolen','colorTheme':'Pakketkleur','isActive':'Actief','features':'Voordelen (één per regel)','Category ID':'Kostencategorie','Vendor':'Leverancier','Receipt URL':'Link naar bon','shortName':'Korte naam','slogan':'Slogan','website':'Website','address':'Adres','city':'Stad','postalCode':'Postcode','country':'Land','phone':'Telefoon','email':'E-mailadres','kvk':'KVK','btw':'Btw-nummer','iban':'IBAN','aiAssistantName':'Naam assistent','lessonPricePerHour':'Lesprijs per uur','aiSystemInstructions':'Instructies assistent','Order':'Weergavevolgorde','Active':'Actief','Question_EN':'Vraag in Engels','Answer_EN':'Antwoord in Engels','Question_NL':'Vraag in Nederlands','Answer_NL':'Antwoord in Nederlands','Question_AR':'Vraag in Arabisch','Answer_AR':'Antwoord in Arabisch'}};\nconst dossierFields={AR:{'Transaction ID':'رقم العملية','Student Name':'اسم الطالب','Invoice ID':'رقم الفاتورة','Notification ID':'رقم الإشعار','Read Status':'حالة القراءة','Created At':'تاريخ الإنشاء','Calendar Event ID':'حدث التقويم','Drive Folder ID':'مجلد Drive','Drive File ID':'ملف Drive','Invoice PDF URL':'رابط الفاتورة','Target Record':'السجل المستهدف','Changed By':'عدّله','Action':'الإجراء','Trainer Name':'المدرب','Instructor Notes':'ملاحظات المدرب','Owner Type':'نوع المالك','Owner ID':'رقم المالك','Drive URL':'رابط Drive','Receipt URL':'رابط الإيصال','Pickup Location':'مكان الانطلاق','Exam Readiness (%)':'الاستعداد للامتحان','Amount (€)':'المبلغ (€)','Balance (€)':'الرصيد (€)','Duration (h)':'المدة (ساعة)'},NL:{'Transaction ID':'Transactienummer','Student Name':'Leerlingnaam','Invoice ID':'Factuurnummer','Notification ID':'Meldingsnummer','Read Status':'Leesstatus','Created At':'Aanmaakdatum','Calendar Event ID':'Agenda-item','Drive Folder ID':'Drive-map','Drive File ID':'Drive-bestand','Invoice PDF URL':'Factuurlink','Target Record':'Doelrecord','Changed By':'Gewijzigd door','Action':'Actie','Trainer Name':'Instructeur','Instructor Notes':'Notities instructeur','Owner Type':'Type eigenaar','Owner ID':'Eigenaar ID','Drive URL':'Drive-link','Receipt URL':'Link naar bon','Pickup Location':'Ophaallocatie','Exam Readiness (%)':'Examenvoorbereiding','Amount (€)':'Bedrag (€)','Balance (€)':'Saldo (€)','Duration (h)':'Duur (uur)'}};\nfunction localizedField(h){if(h==='Type')return section==='payments'?({AR:'نوع العملية',NL:'Soort transactie',EN:'Adjustment Type'})[formEntry?.lang]||'Adjustment Type':({AR:'نوع الإشعار',NL:'Meldingscategorie',EN:'Notification Category'})[formEntry?.lang]||'Notification Category';return dossierFields[formEntry?.lang]?.[h]||moreFields[formEntry?.lang]?.[h]||fieldName(h)}\n\nconst sectionDetails={\n AR:{students:['أنشئ ملف الطالب المستخدم في المدرسة.','يُنشأ رقم الطالب تلقائيًا، ويُضاف الرصيد من زر الإيداع.'],lessons:['أضف درسًا إلى جدول التدريب.','اختر الطالب والمدرب قبل الجدولة.'],trainers:['أنشئ ملف المدرب للدروس.','أدخل الاسم والبريد وأجرة الساعة.'],packages:['حدّد ساعات ومزايا الباقة.','أدخل كل ميزة في سطر مستقل.'],payments:['أضف رصيدًا إلى محفظة الطالب.','يتحدّث الرصيد عند حفظ الإيداع.'],invoices:['أنشئ فاتورة PDF للطالب.','تُحفظ الفاتورة في Drive دون إرسال تلقائي بالبريد.'],expenses:['سجّل تكاليف المدرسة حسب الفئة.','اختر فئة وأدخل مبلغًا موجبًا.'],notifications:['جهّز إشعارًا في مركز إشعارات التطبيق.','راجع المستلمين قبل الحفظ.'],settings:['حدّث بيانات المدرسة المستخدمة في التطبيق.','تتغير الحقول المعروضة فقط.'],audit:['راجع النشاط الأخير في المدرسة.','هذا السجل للقراءة فقط.'],help:['أضف سؤالًا شائعًا بلغات التطبيق.','اكتب سؤالًا بلغة واحدة على الأقل.']},\n NL:{students:['Maak een leerlingprofiel voor de rijschool.','Het leerlingnummer wordt automatisch aangemaakt. Gebruik Saldo toevoegen.'],lessons:['Voeg een les toe aan de lesagenda.','Selecteer eerst een leerling en instructeur.'],trainers:['Maak een instructeurprofiel aan.','Vul naam, e-mail en uurtarief in.'],packages:['Stel de pakketuren en voordelen in.','Zet elk voordeel op een aparte regel.'],payments:['Voeg saldo toe aan een leerlingportemonnee.','Het saldo wordt bijgewerkt bij opslaan.'],invoices:['Maak een PDF-factuur voor een leerling.','De factuur wordt in Drive opgeslagen, zonder automatische e-mail.'],expenses:['Registreer schoolkosten per categorie.','Kies een categorie en voer een positief bedrag in.'],notifications:['Maak een bericht voor het meldingencentrum.','Controleer de ontvangers voordat je opslaat.'],settings:['Werk de schoolgegevens bij.','Alleen de getoonde velden worden aangepast.'],audit:['Bekijk recente schoolactiviteiten.','Dit logboek is alleen-lezen.'],help:['Voeg een veelgestelde vraag toe.','Schrijf een vraag in ten minste één taal.']}\n};\nconst optionWords={AR:{active:'نشط',inactive:'غير نشط',suspended:'معلق',on_leave:'في إجازة',upcoming:'قادم',completed:'مكتمل',cancelled:'ملغى',planned:'مخطط',paid:'مدفوع',Passed:'ناجح',Scheduled:'مجدول','Not Passed':'لم ينجح','Not Scheduled':'غير مجدول',Yes:'نعم',No:'لا','All Students':'كل الطلاب','Specific Student':'طالب محدد','Instructors Only':'المدربون فقط','Credit / Add (+)':'إضافة رصيد','Debit / Deduct (-)':'سحب / خصم (-)','General Announcement':'إعلان عام','Lesson Booking / Schedule':'حجز درس','Payment & Wallet Reminder':'تذكير بالدفع','CBR Exam Readiness Alert':'الاستعداد للامتحان','Custom Plan':'باقة مخصصة'},NL:{active:'Actief',inactive:'Inactief',suspended:'Geschorst',on_leave:'Met verlof',upcoming:'Gepland',completed:'Voltooid',cancelled:'Geannuleerd',planned:'Gepland',paid:'Betaald',Passed:'Geslaagd',Scheduled:'Ingepland','Not Passed':'Niet geslaagd','Not Scheduled':'Niet ingepland',Yes:'Ja',No:'Nee','All Students':'Alle leerlingen','Specific Student':'Specifieke leerling','Instructors Only':'Alleen instructeurs','Credit / Add (+)':'Saldo toevoegen','Debit / Deduct (-)':'Saldo aftrekken (-)','General Announcement':'Algemene aankondiging','Lesson Booking / Schedule':'Les boeken','Payment & Wallet Reminder':'Betalingsherinnering','CBR Exam Readiness Alert':'CBR examenvoorbereiding','Custom Plan':'Aangepast pakket'}};\nfunction detail(key,i){return sectionDetails[formEntry?.lang]?.[key]?.[i]||[cfg[key].subtitle,cfg[key].hint][i]}\nfunction optionText(value){return optionWords[formEntry?.lang]?.[String(value)]||value}\n\nconst icons={user:'<circle cx=\"12\" cy=\"8\" r=\"3\"/><path d=\"M5 21v-2a7 7 0 0 1 14 0v2\"/>',calendar:'<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 3v4M17 3v4M3 10h18\"/>',trainer:'<circle cx=\"12\" cy=\"7\" r=\"3\"/><path d=\"M4 21v-3a8 8 0 0 1 16 0v3M9 15l3 3 3-3\"/>',box:'<path d=\"M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 5 9-5M12 12v9\"/>',wallet:'<rect x=\"3\" y=\"6\" width=\"18\" height=\"15\" rx=\"2\"/><path d=\"M3 10h18M16 15h2\"/>',invoice:'<path d=\"M6 3h12v18l-3-2-3 2-3-2-3 2zM9 9h6M9 13h6\"/>',bell:'<path d=\"M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4\"/>',settings:'<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1z\"/>',shield:'<path d=\"M12 2l9 4v5c0 6-4 10-9 11-5-1-9-5-9-11V6zM8 12l3 3 5-6\"/>',help:'<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9 9a3 3 0 0 1 6 1c0 2-3 2-3 4M12 18h.01\"/>',save:'<path d=\"M4 3h14l3 3v15H3V3zM7 3v6h9V3M7 21v-8h10v8\"/>',info:'<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 7h.01\"/>'};\nfunction svg(n){return '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">'+(icons[n]||icons.info)+'</svg>'}\nfunction esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]))}\nlet data=null,section='',saving=false;const el=id=>document.getElementById(id);\nfunction message(e){\n const raw=e&&e.message?e.message:String(e),lang=formEntry?.lang;\n const patterns=[\n  [/Insufficient student wallet balance/i,'رصيد الطالب غير كافٍ.','Onvoldoende saldo van de leerling.'],\n  [/Firebase account creation failed/i,'فشل إنشاء حساب الدخول. لم يُحفظ الطالب.','Aanmaken van het inlogaccount mislukt; leerling niet opgeslagen.'],\n  [/Firebase account deletion failed/i,'فشل حذف حساب الدخول؛ لم تُحذف سجلات الطالب.','Verwijderen van het inlogaccount mislukt; leerlinggegevens zijn behouden.'],\n  [/Student.*not found|Student no longer exists/i,'لم يتم العثور على الطالب.','Leerling niet gevonden.'],\n  [/valid email/i,'أدخل بريدًا إلكترونيًا صحيحًا.','Vul een geldig e-mailadres in.'],\n  [/at least 6 characters/i,'كلمة المرور يجب أن تكون 6 أحرف على الأقل.','Het wachtwoord moet minstens 6 tekens bevatten.'],\n  [/already exists/i,'هذا البريد مسجل مسبقًا.','Dit e-mailadres bestaat al.'],\n  [/must be greater than zero/i,'أدخل مبلغًا أكبر من الصفر.','Vul een bedrag groter dan nul in.']\n ];\n const match=patterns.find(x=>x[0].test(raw));\n el('busy').hidden=true;el('error').hidden=false;el('error').textContent=match&&lang==='AR'?match[1]:match&&lang==='NL'?match[2]:raw;\n}\nfunction options(h){\n if(h==='Student ID'&&section==='students')return null;\n if(h==='Student ID'||h==='Target Student ID')return (data.students||[]).map(x=>[x['Student ID'],x.Name+' ('+x['Student ID']+')']);\n if(h==='Trainer Name')return (data.trainers||[]).map(x=>[x.Name,x.Name]);\n if(h==='Category ID')return (data.expenseCategories||[]).map(x=>[x['Category ID'],x.Name]);\n if(h==='Current Package')return (data.packages||[]).filter(x=>String(x.isActive||'TRUE').toLowerCase()!=='false').map(x=>[x.name,x.name]).concat([['Custom Plan','Custom Plan']]);\n if(h==='Status'&&section==='students')return['active','inactive','suspended'].map(x=>[x,x]);\n if(h==='Status'&&section==='trainers')return['active','inactive','on_leave'].map(x=>[x,x]);\n if(h==='Status'&&section==='lessons')return['upcoming','completed','cancelled'].map(x=>[x,x]);\n if(h==='Status'&&section==='expenses')return['planned','paid','cancelled'].map(x=>[x,x]);\n if(h==='Theory Exam Status')return['Passed','Scheduled','Not Passed','Not Scheduled'].map(x=>[x,x]);\n if(h==='Duration (h)')return[[1,'1.0 Hour'],[1.5,'1.5 Hours'],[2,'2.0 Hours']];\n if(h==='Type'&&section==='payments')return[['deposit','Credit / Add (+)'],['payment','Debit / Deduct (-)']];\n if(h==='Type'&&section==='notifications')return[['system','General Announcement'],['booking','Lesson Booking / Schedule'],['payment','Payment & Wallet Reminder'],['exam','CBR Exam Readiness Alert']];\n if(h==='Recipient Role')return[['all','All Students'],['student','Specific Student'],['trainer','Instructors Only']];\n if(h==='colorTheme')return['blue','emerald','gold','violet','rose'].map(x=>[x,x]);\n if(['popular','recommended','isActive','Active'].includes(h))return[['TRUE','Yes'],['FALSE','No']];\n return null;\n}\nfunction type(h){if(h==='New Password')return'password';if(h==='Date of Birth')return'date';if(h==='Date')return'date';if(h==='Time')return'time';if(/email/i.test(h))return'email';if(/price|amount|hours|rate|readiness|rating|displayOrder|^Order$/i.test(h))return'number';if(/description|notes|message|features|answer_|aiSystemInstructions/i.test(h))return'textarea';return'text'}\nfunction defaults(h){if(h==='Status')return section==='lessons'?'upcoming':'active';if(h==='Duration (h)'||h==='Order')return 1;if(h==='Exam Readiness (%)'||h==='Balance (€)')return 0;if(h==='Type'&&section==='payments')return'deposit';if(h==='Type'&&section==='notifications')return'system';if(h==='Recipient Role')return'all';if(['isActive','Active'].includes(h))return'TRUE';if(['popular','recommended'].includes(h))return'FALSE';if(h==='Date')return new Date().toLocaleDateString('en-CA');return''}\nfunction required(h){return['Name','Email'].includes(h)&&['students','trainers'].includes(section)||['Student ID','Date','Time','Trainer Name'].includes(h)&&section==='lessons'||h==='Amount (€)'&&['payments','invoices','expenses'].includes(section)||h==='name'&&section==='packages'||h==='Title'&&section==='notifications'||h==='Message'&&section==='notifications'||h==='Category'&&section==='help'||h==='New Password'&&section==='students'&&!data.student}\nfunction renderField(h){\n let value=section==='settings'?(data.settings||{})[h]:(section==='students'&&data.student?data.student[h]:defaults(h));\n const opts=options(h),t=type(h),id='f'+encodeURIComponent(h).replace(/%/g,'_'),disabled=['Student ID','Trainer ID','Lesson ID','id'].includes(h)&&!(section==='payments'&&h==='Student ID'),readOnly=h==='Balance (€)',wide=t==='textarea'||h==='features'||h==='Current Package';\n const caption=localizedField(h);let input='';\n if(h==='Exam Readiness (%)')input='<input class=\"control range\" id=\"'+id+'\" data-head=\"'+esc(h)+'\" type=\"range\" min=\"0\" max=\"100\" value=\"'+esc(value)+'\" oninput=\"el(\\'readiness\\').textContent=this.value+\\'%\\'\">';\n else if(opts)input='<select class=\"control\" id=\"'+id+'\" data-head=\"'+esc(h)+'\" '+(required(h)?'required':'')+'><option value=\"\">'+esc(phrase(5,'Select…'))+'</option>'+opts.map(x=>'<option value=\"'+esc(x[0])+'\" '+(String(x[0])===String(value)?'selected':'')+'>'+esc(optionText(x[1]))+'</option>').join('')+'</select>';\n else if(t==='textarea')input='<textarea class=\"control textarea\" id=\"'+id+'\" data-head=\"'+esc(h)+'\" '+(required(h)?'required':'')+'>'+esc(value)+'</textarea>';\n else input='<input class=\"control\" id=\"'+id+'\" data-head=\"'+esc(h)+'\" type=\"'+t+'\" value=\"'+esc(value)+'\" '+(required(h)?'required':'')+' '+(readOnly||disabled?'readonly':'')+' '+(t==='number'?'step=\"any\"':'')+' placeholder=\"'+(disabled?esc(phrase(6,'Generated automatically')):'')+'\">';\n return '<div class=\"field '+(wide?'wide':'')+'\"><label for=\"'+id+'\">'+svg(/email/i.test(h)?'invoice':/date|time/i.test(h)?'calendar':/price|balance|amount|rate/i.test(h)?'wallet':section==='help'?'help':section==='lessons'?'calendar':'user')+esc(caption)+(required(h)?'<em>*</em>':'')+(h==='Exam Readiness (%)'?'<span class=\"meter\" id=\"readiness\">0%</span>':'')+'</label>'+input+'</div>';\n}\nfunction renderForm(){\n const fields=cfg[section].fields.filter(h=>h==='New Password'||(data.schemas[section]||[]).includes(h));\n if(!fields.length){message(new Error('No matching columns found in '+section+'.'));return}\n el('content').innerHTML='<form id=\"recordForm\" onsubmit=\"submitForm(event)\"><section class=\"fieldset\"><h2><span>'+svg(cfg[section].icon)+'</span>'+esc(heading(section,1))+'</h2><div class=\"grid\">'+fields.map(renderField).join('')+'</div></section></form>';\n const button=el('submit');button.hidden=false;button.innerHTML=svg('save')+esc(phrase(1,'Save'));\n if(section==='notifications'){const role=document.querySelector('[data-head=\"Recipient Role\"]');if(role){role.addEventListener('change',()=>{const target=document.querySelector('[data-head=\"Target Student ID\"]').closest('.field');target.style.display=role.value==='student'?'':'none'});role.dispatchEvent(new Event('change'))}}\n}\nfunction renderAudit(){\n const rows=data.audit||[],columns=['Date','Time','Action','Target Record','Changed By'];\n el('content').innerHTML='<section class=\"fieldset\"><h2><span>'+svg('shield')+'</span>Recent activity</h2>'+(rows.length?'<div class=\"list\"><table><thead><tr>'+columns.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(-80).reverse().map(row=>'<tr>'+columns.map(c=>'<td title=\"'+esc(row[c])+'\">'+esc(row[c])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<div class=\"empty\">'+esc(phrase(8,'No audit entries yet.'))+'</div>')+'</section>';\n}\nfunction submitForm(event){\n event.preventDefault();if(saving)return;\n const form=el('recordForm');if(!form.reportValidity())return;\n const payload={};if(section==='students'&&data.student)payload['Student ID']=data.student['Student ID'];form.querySelectorAll('[data-head]').forEach(field=>{if(field.readOnly&&['Student ID','Trainer ID','Lesson ID','id','Balance (€)'].includes(field.dataset.head))return;payload[field.dataset.head]=field.type==='number'&&field.value!==''?Number(field.value):field.value});\n if(section==='help'&&!['Question_EN','Question_NL','Question_AR'].some(k=>String(payload[k]||'').trim())){message(new Error(({AR:'أدخل سؤالًا بلغة واحدة على الأقل.',NL:'Vul een vraag in ten minste één taal in.',EN:'Enter a question in at least one language.'})[formEntry?.lang]));return}\n if(section==='notifications'&&payload['Recipient Role']==='student'&&!payload['Target Student ID']){message(new Error(({AR:'اختر طالبًا.',NL:'Selecteer een leerling.',EN:'Select a student.'})[formEntry?.lang]));return}\n if(section==='packages'&&payload.features)payload.features=payload.features.split('\\n').map(x=>x.trim()).filter(Boolean).join(' | ');\n if(section==='notifications'&&payload['Recipient Role']==='student'){const person=(data.students||[]).find(x=>String(x['Student ID'])===String(payload['Target Student ID']));if(person)payload['Recipient Email']=person.Email||''}\n saving=true;el('error').hidden=true;el('busyText').textContent=phrase(3,'Saving to your sheet…');el('busy').hidden=false;el('submit').disabled=true;\n google.script.run.withSuccessHandler(()=>{el('busy').hidden=true;el('submit').disabled=false;saving=false;el('footHint').textContent=phrase(4,'Saved successfully');setTimeout(()=>google.script.host.close(),600)}).withFailureHandler(err=>{saving=false;el('submit').disabled=false;message(err)}).tarekFormsSave(section,payload);\n}\n\nfunction browseStudents(){\n const rows=initialData?.students||[];\n el('title').textContent=({AR:'ملف الطالب الكامل',NL:'Leerlingdossier',EN:'Student dossier'})[formEntry.lang]||'Student dossier';\n el('subtitle').textContent=({AR:'ابحث عن طالب لعرض بياناته المرتبطة بالشيت.',NL:'Zoek een leerling voor alle gekoppelde gegevens.',EN:'Search students and view all linked sheet records.'})[formEntry.lang]||'Search students';\n el('leadText').textContent=({AR:'البيانات تُقرأ مباشرة من جداول الشيت عند اختيار الطالب.',NL:'Gegevens worden rechtstreeks uit het spreadsheet geladen.',EN:'Data is read directly from the sheet when you select a student.'})[formEntry.lang]||'';\n el('submit').hidden=true;\n el('content').innerHTML='<section class=\"fieldset\"><h2><span>'+svg('user')+'</span>'+esc(el('title').textContent)+'</h2><input id=\"studentSearch\" class=\"control\" type=\"search\" placeholder=\"'+esc(({AR:'بحث بالاسم أو الرقم أو الهاتف أو البريد',NL:'Zoek op naam, nummer, telefoon of e-mail',EN:'Search name, ID, phone or email'})[formEntry.lang]||'Search')+'\"><select id=\"studentChoice\" class=\"control\" style=\"margin-top:12px\"><option value=\"\">'+esc(phrase(5,'Select…'))+'</option></select></section><div id=\"studentDossier\"></div>';\n const search=el('studentSearch'),choice=el('studentChoice');\n function refresh(){let q=search.value.trim().toLocaleLowerCase();choice.innerHTML='<option value=\"\">'+esc(phrase(5,'Select…'))+'</option>'+rows.filter(r=>[r.Name,r['Student ID'],r.Email,r.Phone,r.City].some(v=>String(v||'').toLocaleLowerCase().includes(q))).map(r=>'<option value=\"'+esc(r['Student ID'])+'\">'+esc(r.Name)+' · '+esc(r['Student ID'])+'</option>').join('')}\n search.addEventListener('input',refresh);refresh();choice.addEventListener('change',()=>{\n  if(!choice.value){el('studentDossier').innerHTML='';return}\n  el('studentDossier').innerHTML='<div class=\"empty\">'+esc(phrase(2,'Loading…'))+'</div>';\n  google.script.run.withSuccessHandler(renderDossier).withFailureHandler(message).tarekStudentDossier(choice.value);\n });\n}\nfunction renderDossier(result){\n const groups={student:{AR:'الملف والتقدم',NL:'Profiel en voortgang',EN:'Profile and progress'},lessons:{AR:'الدروس والملاحظات',NL:'Lessen en notities',EN:'Lessons and notes'},wallet:{AR:'الإيداع والسحب والدفع',NL:'Stortingen, opnames en betalingen',EN:'Deposits, withdrawals and payments'},invoices:{AR:'الفواتير',NL:'Facturen',EN:'Invoices'},notifications:{AR:'الإشعارات',NL:'Meldingen',EN:'Notifications'},documents:{AR:'المستندات',NL:'Documenten',EN:'Documents'},audit:{AR:'سجل التغييرات',NL:'Wijzigingslogboek',EN:'Change history'},routes:{AR:'مسارات التدريب',NL:'Lesroutes',EN:'Training routes'}};\n let html='';for(const [kind,records] of Object.entries({student:[result.student],...result.related})){\n  const heading=groups[kind]?.[formEntry.lang]||kind;\n  html+='<section class=\"fieldset\"><h2><span>'+svg(kind==='wallet'?'wallet':kind==='lessons'?'calendar':kind==='invoices'?'invoice':'user')+'</span>'+esc(heading)+' <small>('+records.length+')</small></h2>';\n  if(!records.length){html+='<div class=\"empty\">'+esc(phrase(8,'No records yet.'))+'</div></section>';continue}\n  html+='<div class=\"list\"><table><thead><tr>'+Object.keys(records[0]).filter(k=>!k.startsWith('_')&&!['id','studentId','name','email','phone','date','time','status','amount','balance','type','desc'].includes(k)).map(k=>'<th>'+esc(localizedField(k))+'</th>').join('')+'</tr></thead><tbody>';\n  const keys=Object.keys(records[0]).filter(k=>!k.startsWith('_')&&!['id','studentId','name','email','phone','date','time','status','amount','balance','type','desc'].includes(k));\n  html+=records.map(row=>'<tr>'+keys.map(k=>'<td title=\"'+esc(row[k])+'\">'+esc(row[k])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>';\n }\n html+='<div style=\"display:flex;justify-content:flex-end;margin:0 0 18px\"><button type=\"button\" class=\"button primary\" id=\"editStudent\">'+svg('user')+esc(({AR:'تعديل بيانات الطالب',NL:'Leerling bewerken',EN:'Edit student'})[formEntry.lang]||'Edit student')+'</button><button type=\"button\" class=\"button secondary\" style=\"color:#a72e3f\" id=\"deleteStudent\">'+esc(({AR:'حذف الطالب نهائيًا',NL:'Leerling definitief verwijderen',EN:'Delete student permanently'})[formEntry.lang]||'Delete student permanently')+'</button></div>';el('studentDossier').innerHTML=html;el('deleteStudent').addEventListener('click',()=>{const id=result.student['Student ID'];const answer=prompt((({AR:'سيُحذف حساب الطالب وسجلاته. اكتب للتأكيد: ',NL:'Account en dossiers worden verwijderd. Typ ter bevestiging: ',EN:'Account and records will be removed. Type to confirm: '})[formEntry.lang]||'Type to confirm: ')+'DELETE '+id);if(answer!=='DELETE '+id)return;el('busyText').textContent=phrase(3,'Deleting…');el('busy').hidden=false;google.script.run.withSuccessHandler(()=>{el('busy').hidden=true;data.students=data.students.filter(x=>x['Student ID']!==id);browseStudents();}).withFailureHandler(message).tarekDeleteStudentPermanently(id,answer)});el('editStudent').addEventListener('click',()=>{el('studentDossier').innerHTML='<div class=\"empty\">'+esc(phrase(2,'Loading…'))+'</div>';google.script.run.withSuccessHandler(d=>{data=d;data.student=result.student;el('content').innerHTML='';el('title').textContent=({AR:'تعديل بيانات الطالب',NL:'Leerling bewerken',EN:'Edit student'})[formEntry.lang]||'Edit student';renderForm()}).withFailureHandler(message).tarekFormsGetDataFor('students','edit')});\n}\n\nfunction start(){\n const entry=formEntry;if(!entry||!cfg[entry.section]){message(new Error(({AR:'إجراء غير معروف.',NL:'Onbekende actie.',EN:'Unknown action.'})[formEntry?.lang]||'Unknown action.'));return}\n section=entry.section;const m=cfg[section],lang=['EN','NL','AR'].includes(entry.lang)?entry.lang:'EN';\n document.documentElement.lang=lang.toLowerCase();document.documentElement.dir=lang==='AR'?'rtl':'ltr';\n el('title').textContent=heading(section,0);el('subtitle').textContent=detail(section,0);el('heroIcon').innerHTML=svg(m.icon);el('leadIcon').innerHTML=svg('info');el('leadText').textContent=detail(section,1);\n document.querySelector('.button.secondary').textContent=phrase(0,'Cancel');\n if(initialData){data=initialData;entry.mode==='browse'&&section==='students'?browseStudents():section==='audit'?renderAudit():renderForm();return}\n el('content').innerHTML='<div class=\"empty\"><span class=\"spin\"></span> '+esc(phrase(2,'Loading…'))+'</div>';\n google.script.run.withSuccessHandler(r=>{data=r;section==='audit'?renderAudit():renderForm()}).withFailureHandler(message).tarekFormsGetDataFor(entry.section,entry.mode);\n}\nstart();\n</script></body></html>\n";}

// Read data through the existing backend. No write or rebuild is performed here.
// Load only the target form's schema and its picker options.
// The previous entry point read every worksheet and calculated dashboard totals
// before showing any form, including sections that the user did not open.
function tarekFormsGetDataFor(section,mode){
  var allowed={students:1,lessons:1,trainers:1,packages:1,payments:1,invoices:1,expenses:1,notifications:1,settings:1,audit:1,help:1,dashboard:1};
  if(!allowed[section])throw new Error('Unsupported form section.');
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var data={generatedAt:new Date().toISOString(),schemas:{},students:[],trainers:[],packages:[],expenseCategories:[],settings:{},dashboard:{}};
  var sheetName=section==='help'?'Help & Support':CONTROL_CENTER_SHEETS[section];
  var sheet=sheetName&&ss.getSheetByName(sheetName);
  if(sheet&&sheet.getLastColumn())data.schemas[section]=sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  else data.schemas[section]=[];
  if(section==='lessons'||section==='payments'||section==='invoices'||section==='notifications'){
    data.students=controlCenterRows_(ss,'Students').map(function(x){return{'Student ID':x['Student ID'],Name:x.Name,Email:x.Email};});
  }
  if(section==='lessons'){
    data.trainers=controlCenterRows_(ss,'Trainers').map(function(x){return{'Trainer ID':x['Trainer ID'],Name:x.Name};});
  }
  if(section==='students'){
    data.packages=controlCenterRows_(ss,'Packages').map(function(x){return{name:x.name,isActive:x.isActive};});
  }
  if(section==='expenses'){
    data.expenseCategories=controlCenterRows_(ss,'ExpenseCategories').map(function(x){return{'Category ID':x['Category ID'],Name:x.Name,Active:x.Active};});
  }
  if(section==='settings'){
    var settings=controlCenterRows_(ss,'SchoolSettings');
    data.settings=settings[0]||{};
  }else if(mode==='view'&&section!=='dashboard'){
    data[section]=controlCenterRows_(ss,sheetName);
  }
  return data;
}

function tarekFormsGetData(){
  var d=controlCenterGetData(),ss=SpreadsheetApp.getActiveSpreadsheet();
  d.settings=Array.isArray(d.settings)?(d.settings[0]||{}):(d.settings||{});
  d.help=controlCenterRows_(ss,'Help & Support');
  var sh=ss.getSheetByName('Help & Support');
  d.schemas.help=sh&&sh.getLastColumn()?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
  return d;
}

// Serialize writes so two forms cannot allocate the same numeric record ID.
function tarekFormsSave(section,input){
  var allowed=['students','lessons','trainers','packages','payments','invoices','expenses','notifications','settings','help'];
  if(allowed.indexOf(section)<0)throw new Error('This section is read-only.');
  var lock=LockService.getDocumentLock();lock.waitLock(30000);
  try{
    var ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(CONTROL_CENTER_SHEETS[section]);
    if(!sh||!sh.getLastColumn())throw new Error('Required sheet or column headers are missing.');
    var headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],data={};
    headers.forEach(function(h){if(Object.prototype.hasOwnProperty.call(input,h))data[h]=input[h];});
    var cfg=CONTROL_CENTER_IDS[section],id=cfg?String(data[cfg.header]||input.id||'').trim():'';
    if(id){
      var found=controlCenterFindRowById_(sh,headers,cfg.header,id);
      if(found.row<2)throw new Error('Record no longer exists. Close and reopen this form.');
      var old=sh.getRange(found.row,1,1,headers.length).getValues()[0];
      headers.forEach(function(h,i){if(!Object.prototype.hasOwnProperty.call(data,h))data[h]=old[i];});
      data[cfg.header]=id;
    }
    function required(h){if(!String(data[h]||'').trim())throw new Error(h+' is required.');}
    function positive(h){if(!isFinite(Number(data[h]))||Number(data[h])<=0)throw new Error(h+' must be greater than zero.');data[h]=Number(data[h]);}
    if(section==='students'||section==='trainers'){
      required('Name');required('Email');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.Email)))throw new Error('Enter a valid email address.');
    }
    if(section==='students'){
      var ready=Number(data['Exam Readiness (%)']||0);
      if(!isFinite(ready)||ready<0||ready>100)throw new Error('Exam readiness must be between 0 and 100.');
      data['Exam Readiness (%)']=ready;
      if(!id)data['Balance (€)']=0;
      if(!id&&String(input['New Password']||'').length<6)throw new Error('Set a password of at least 6 characters for the new student.');
    }
    if(section==='trainers')positive('Rate (€)');
    if(section==='packages'){
      required('name');positive('hours');positive('price');
      if(data.discountPrice!==undefined&&data.discountPrice!==''){
        var discounted=Number(data.discountPrice);
        if(!isFinite(discounted)||discounted<0||discounted>Number(data.price))
          throw new Error('Discount price must be between zero and the regular price.');
        data.discountPrice=discounted;
      }
    }
    if(['lessons','invoices','payments'].indexOf(section)>=0){required('Student ID');controlCenterFindStudent_(ss,data['Student ID']);}
    if(section==='lessons'){
      required('Date');required('Time');required('Trainer Name');positive('Duration (h)');positive('Price (€)');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(String(data.Date))||isNaN(Date.parse(data.Date)))throw new Error('Enter a valid lesson date.');
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(data.Time)))throw new Error('Enter a valid lesson time.');
      var trainers=controlCenterRows_(ss,'Trainers');
      if(!trainers.some(function(t){return t.Name===data['Trainer Name'];}))throw new Error('Select an existing trainer.');
    }
    if(section==='invoices'||section==='payments'||section==='expenses')positive('Amount (€)');
    if(section==='expenses'){
      required('Category ID');var categories=controlCenterRows_(ss,'ExpenseCategories');
      var cat=categories.filter(function(c){return String(c['Category ID'])===String(data['Category ID']);})[0];
      if(!cat)throw new Error('Select an existing expense category.');data['Category Name']=cat.Name;
    }
    if(section==='help'){
      required('Category');
      if(!['Question_AR','Question_NL','Question_EN'].some(function(h){return String(data[h]||'').trim();}))
        throw new Error('Enter a question in at least one language.');
    }
    if(section==='notifications'&&!id){
      if(headers.indexOf('Read Status')>=0&&!data['Read Status'])data['Read Status']='Unread';
      ['Date','Created At','Timestamp'].forEach(function(h){if(headers.indexOf(h)>=0&&!data[h])data[h]=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss');});
    }
    // Existing create helpers append raw cells: sanitize strings before dispatch.
    Object.keys(data).forEach(function(h){data[h]=controlCenterSanitizeCell_(data[h]);});
    var saved;
    if(section==='students'&&!id){
      var emailValue=String(data.Email||'').trim().toLowerCase();
      if(controlCenterRows_(ss,'Students').some(function(r){return String(r.Email||'').trim().toLowerCase()===emailValue;}))throw new Error('A student with this email already exists.');
      var newStudentId=controlCenterNextId_(sh,'Student ID','ST-',6);
      data['Student ID']=newStudentId;
      sh.appendRow(headers.map(function(h){return controlCenterSanitizeCell_(data[h]===undefined?'':data[h]);}));
      controlCenterAudit_('Create student',newStudentId,'',String(data.Email));
      saved={success:true,id:newStudentId,created:true};
    }else if(section==='payments'&&String(data.Type).toLowerCase()==='payment'){
      var student=controlCenterFindStudent_(ss,data['Student ID']);
      var current=controlCenterRows_(ss,'Students').filter(function(r){return String(r['Student ID'])===String(data['Student ID']);})[0];
      if(Number(current['Balance (€)']||0)<Number(data['Amount (€)']))throw new Error('Insufficient student wallet balance.');
      var txId=controlCenterNextId_(sh,'Transaction ID','TX-',6);
      var now=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');
      var newRow={ 'Transaction ID':txId,'Student ID':data['Student ID'],'Student Name':student.name,Date:now,Type:'payment','Amount (€)':data['Amount (€)'],Description:data.Description||'Manual debit' };
      sh.appendRow(headers.map(function(h){return controlCenterSanitizeCell_(newRow[h]===undefined?'':newRow[h]);}));
      controlCenterRebuildBalance_(ss,data['Student ID']);
      saved={success:true,id:txId,created:true};
    }else if(section==='lessons'&&!id){
      var lessonStudent=controlCenterRows_(ss,'Students').filter(function(r){return String(r['Student ID'])===String(data['Student ID']);})[0];
      if(Number(lessonStudent['Balance (€)']||0)<Number(data['Price (€)']))throw new Error('Insufficient student wallet balance.');
      saved=controlCenterSaveRecord(section,data);
      var lessonId=saved.id||saved.lessonId;
      writeTransactionRecord(data['Student ID'],lessonStudent.Name,'payment',Number(data['Price (€)']),'Reserved driving lesson ('+lessonId+') on '+data.Date+' at '+data.Time);
      rebuildStudentBalance(data['Student ID']);
    }else saved=controlCenterSaveRecord(section,data);
    saved.id=saved.id||saved.studentId||saved.trainerId||saved.invoiceId||saved.lessonId||saved.txId||'';
    if(saved.created===undefined)saved.created=!id;
    if(section==='students')data['Student ID']=saved.id;
    if(section==='students'&&!id){
      var created=tarekSignedBackendPost_('/api/admin/create-student-auth',{email:String(data.Email),name:String(data.Name),password:String(input['New Password'])});
      if(created.skipped||created.status!==200){
        var rollback=controlCenterFindRowById_(sh,headers,'Student ID',saved.id);
        if(rollback.row>=2)sh.deleteRow(rollback.row);
        throw new Error('Firebase account creation failed. Student row was rolled back. '+(created.body||created.reason||''));
      }
    }
    if(section==='students'&&id&& (String(old[headers.indexOf('Email')])!==String(data.Email)||String(old[headers.indexOf('Name')])!==String(data.Name)||String(input['New Password']||''))){
      var synced=tarekSignedBackendPost_('/api/admin/sync-student-auth',{oldEmail:String(old[headers.indexOf('Email')]),email:String(data.Email),name:String(data.Name),password:String(input['New Password']||'')});
      if(synced.skipped||synced.status!==200){
        sh.getRange(found.row,1,1,headers.length).setValues([old]);
        throw new Error('Firebase identity was not updated; student row was restored. '+(synced.body||synced.reason||''));
      }
    }
    var sheetName=CONTROL_CENTER_SHEETS[section];
    if(['Students','Lessons','Wallet','Invoices','Packages','Notifications','Help & Support','SchoolSettings'].indexOf(sheetName)>=0){
      dispatchWebhookChangeEvent(sheetName,saved.created?'INSERT_ROW':'EDIT',saved.id,data,section==='students'?saved.id:String(data['Student ID']||''));
    }
    return saved;
  }finally{lock.releaseLock();}
}
