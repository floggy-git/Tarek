const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('google-apps-script/ControlCenter.html','utf8');
const code=fs.readFileSync('google-apps-script/SheetFormButtons.gs','utf8');
new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);
let dialogs=[],images=[],failAt=-1,attempt=0;
const img=()=>({title:'',removed:false,setWidth(){return this},setHeight(){return this},setAltTextTitle(x){this.title=x;return this},getAltTextTitle(){return this.title},setAltTextDescription(){return this},assignScript(x){assert.equal(typeof ctx[x],'function');this.handler=x;return this},remove(){this.removed=true}});
const sheet={getColumnWidth:()=>80,getRowHeight:()=>28,getImages:()=>images.filter(x=>!x.removed),insertImage:()=>{if(attempt++===failAt)throw Error('insert failed');const x=img();images.push(x);return x}};
const output=content=>({content,getContent(){return content},setWidth(){return this},setHeight(){return this}});
const ctx={HtmlService:{createHtmlOutputFromFile:()=>output(html),createHtmlOutput:output},SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>sheet,toast(){}}),getUi:()=>({showModalDialog(o,title){dialogs.push({content:o.content,title})}})},Utilities:{base64Decode:x=>Buffer.from(x,'base64'),newBlob:x=>x}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('google-apps-script/ControlCenter.gs','utf8'),ctx);vm.runInContext(code,ctx);
for(const b of ctx.SHEET_FORM_BUTTONS){ctx[b.handler]();assert.ok(dialogs.at(-1).content.includes(JSON.stringify({section:b.section,mode:b.mode})));new vm.Script(dialogs.at(-1).content.match(/<script>([\s\S]*)<\/script>/)[1]);}
ctx.installSheetFormButtons();assert.equal(sheet.getImages().length,16);
ctx.installSheetFormButtons();assert.equal(sheet.getImages().length,16);
const before=sheet.getImages();attempt=0;failAt=3;assert.throws(()=>ctx.installSheetFormButtons(),/insert failed/);assert.deepEqual(sheet.getImages(),before);
ctx.removeSheetFormButtons();assert.equal(sheet.getImages().length,0);
// Verify initial data load opens the requested form once, and later refreshes don't reopen it.
const script=html.match(/<script>([\s\S]*)<\/script>/)[1].replace('loadData();','');
let calls=[];const ui={document:{body:{classList:{add(){}}}},loading:{style:{}},sync:{},google:{script:{run:{withSuccessHandler(f){this.success=f;return this},withFailureHandler(){return this},controlCenterGetData(){this.success({generatedAt:new Date().toISOString()})}}}}};
vm.createContext(ui);vm.runInContext(script,ui);vm.runInContext("render=()=>{};newRecord=s=>globalThis.opened=s; formEntry={section:'students',mode:'new'};loadData();",ui);assert.equal(ui.opened,'students');ui.opened=null;vm.runInContext('loadData()',ui);assert.equal(ui.opened,null);
console.log('Passed: 16 button routes, dialog syntax, install/reinstall/rollback, removal, one-time form launch.');
