import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategorySelect } from '../src/categories/CategorySelect';
import { getEnabledDrivingCategories, isSubscriptionActive, categoryHourlyRate } from '../src/utils/companyCategoryAccess';
import { parseCompanyCategoryRows } from '../src/categories/companyCategorySheets';
import { convertPackagesToSheetRows, parseSheetRowsToPackages, convertLessonsToSheetRows, parseSheetRowsToLessons } from '../src/utils/googleSheets';
import { writeLessonsToSheet, syncLessonsFromSheet, writePackagesToSheet, syncPackagesFromSheet } from '../src/services/googleSheetsService';
import type { Lesson, DrivePackage } from '../src/types';

const now = new Date('2026-10-04T12:00:00Z');
const activeC = { category: 'C', status: 'active', startsAt: '2026-10-01', endsAt: '2026-10-31' } as const;
const lesson: Lesson = { id: 'LES-812340', studentId: 'ST-812340', studentName: 'Test Student', trainerName: 'Test Trainer', category: 'C', date: '2026-10-10', time: '12:00', duration: 2, price: 180, pickupLocation: 'School', status: 'upcoming' };
const pkg: DrivePackage = { id: 'PKG-812340', category: 'C', name: 'Truck lessons', description: 'Test', hours: 10, price: 900, displayOrder: 1, isActive: true, colorTheme: 'blue' };

test('B is the default even with no register, malformed rows or expired add-ons', () => {
  assert.deepEqual(getEnabledDrivingCategories(), ['B']);
  assert.deepEqual(getEnabledDrivingCategories({categorySubscriptions:'broken', enabledCategories:['B','C']}), ['B']);
  assert.deepEqual(getEnabledDrivingCategories({categorySubscriptions:[{...activeC,endsAt:'2026-09-01'}]},now), ['B']);
});
test('company subscription activates C, never an unrelated category', () => {
  assert.deepEqual(getEnabledDrivingCategories({categorySubscriptions:[activeC]},now), ['B','C']);
  for (const status of ['inactive','pending','expired'] as const) assert.deepEqual(getEnabledDrivingCategories({categorySubscriptions:[{...activeC,status}]},now), ['B']);
});
test('date boundaries are inclusive and use Amsterdam, invalid and duplicate rows fail closed', () => {
  assert.equal(isSubscriptionActive({...activeC,endsAt:'2026-10-04'},now),true);
  assert.equal(isSubscriptionActive({...activeC,endsAt:'2026-10-04'},new Date('2026-10-04T22:01:00Z')),false);
  assert.equal(isSubscriptionActive({...activeC,startsAt:'2026-10-05'},now),false);
  assert.equal(isSubscriptionActive({...activeC,endsAt:'2026-02-31'},now),false);
  assert.deepEqual(getEnabledDrivingCategories({categorySubscriptions:[activeC,activeC]},now),['B']);
});
test('category register handles reordered headers; unknown categories are ignored', () => {
  const rows = parseCompanyCategoryRows([['Status','Hourly Rate','Category'],['active',95,'C'],['active',1,'UNKNOWN']]);
  assert.equal(rows.length,1); assert.equal(rows[0].category,'C'); assert.equal(rows[0].lessonPricePerHour,95);
  assert.equal(categoryHourlyRate({lessonPricePerHour:65,categorySubscriptions:[{category:'C',status:'active',lessonPricePerHour:95}]},'C'),95);
  assert.equal(categoryHourlyRate({},'C'),0);
});
test('base-only UI is unchanged; multilingual selector lists enabled company categories', () => {
  assert.equal(renderToStaticMarkup(<CategorySelect value="B" categories={['B']} onChange={()=>{}} lang="nl"/>),'');
  for (const lang of ['en','nl','ar'] as const) {
    const html=renderToStaticMarkup(<CategorySelect value="C" categories={['B','C']} onChange={()=>{}} lang={lang}/>);
    assert.match(html,/value="C"/); assert.doesNotMatch(html,/value="D"/);
  }
});
test('lessons and packages preserve categories on Sheets round trip; old rows remain B', () => {
  assert.equal(parseSheetRowsToPackages(convertPackagesToSheetRows([pkg]))[0].category,'C');
  assert.equal(parseSheetRowsToLessons(convertLessonsToSheetRows([lesson]))[0].category,'C');
  assert.equal(parseSheetRowsToLessons(convertLessonsToSheetRows([lesson]).map(row => row.slice(0,13)))[0].category,'B');
});
test('operational service also preserves categories and never changes subscription cells', async () => {
  const original=globalThis.fetch;
  let rows: any[][]=[];
  globalThis.fetch=(async (url:any, options:any={})=>{
    assert.doesNotMatch(String(url),/CompanyCategories/);
    if(options.method==='PUT') rows=JSON.parse(options.body).values;
    return new Response(JSON.stringify({values:rows}),{status:200,headers:{'Content-Type':'application/json'}});
  }) as typeof fetch;
  try {
    assert.equal((await writeLessonsToSheet('test-sheet',[lesson],'test-token')).success,true);
    assert.equal((await syncLessonsFromSheet('test-sheet','test-token')).data?.[0].category,'C');
    assert.equal((await writePackagesToSheet('test-sheet',[pkg],'test-token')).success,true);
    assert.equal((await syncPackagesFromSheet('test-sheet','test-token')).data?.[0].category,'C');
  } finally { globalThis.fetch=original; }
});
test('Apps Script rejects inactive categories before any booking side effects', () => {
  let register:any[][]=[['Category','Status','Hourly Rate'],['B','active',''],['C','inactive','95']];
  const context=vm.createContext({Utilities:{formatDate:()=> '2026-10-04'},SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>({getLastRow:()=>register.length,getDataRange:()=>({getDisplayValues:()=>register.map(row => [...row])})})})}});
  vm.runInContext(fs.readFileSync('google-apps-script/CompanyCategories.gs','utf8'),context);
  assert.throws(()=>vm.runInContext("companyRequireCategory_('C')",context),/not active/);
  register[2][1]='active';
  assert.equal(vm.runInContext("companyRequireCategory_('C').lessonPricePerHour",context),95);
  assert.throws(()=>vm.runInContext("companyRequireCategory_('UNKNOWN')",context),/not active/);
});


test('localized header display does not change the API schema or date strings', async () => {
  const { sheetReadUrl } = await import('../src/utils/sheetReadUrl');
  const url = new URL(sheetReadUrl('https://sheets.googleapis.com/v4/spreadsheets/example/values/Students!A1:L100?key=public-key'));
  assert.equal(url.searchParams.get('valueRenderOption'),'UNFORMATTED_VALUE');
  assert.equal(url.searchParams.get('dateTimeRenderOption'),'FORMATTED_STRING');
  assert.equal(url.searchParams.get('key'),'public-key');
  assert.match(sheetReadUrl('https://sheets.googleapis.com/v4/spreadsheets/id/values:batchGet?ranges=Students!A1:L'), /UNFORMATTED_VALUE/);
  assert.equal(sheetReadUrl('https://www.googleapis.com/drive/v3/files/id'), 'https://www.googleapis.com/drive/v3/files/id');
  const html=renderToStaticMarkup(<CategorySelect value="C" categories={['B','C']} onChange={()=>{}} lang="nl"/>);
  assert.match(html, /<svg/); assert.match(html, /Vrachtauto/); assert.doesNotMatch(html, /🚗|🚚|Car \/ Auto/);
});
