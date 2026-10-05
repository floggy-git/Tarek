/** Company-wide add-ons. This module never changes subscriptions from app requests. */
function companyCategoryRows_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CompanyCategories');
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getDisplayValues(), headers = rows.shift();
  return rows.map(function(row) {
    function value(key) { var i = headers.indexOf(key); return i < 0 ? '' : String(row[i] || '').trim(); }
    return { category: value('Category').toUpperCase(), status: value('Status').toLowerCase(), startsAt: value('Starts At'), endsAt: value('Ends At'), lessonPricePerHour: Number(value('Hourly Rate').replace(',', '.')) || 0 };
  }).filter(function(row) { return ['B','A','AM','C','D','T'].indexOf(row.category) >= 0; });
}
function companyCategoryActive_(row) {
  var today = Utilities.formatDate(new Date(), 'Europe/Amsterdam', 'yyyy-MM-dd');
  function valid(value) { return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value); }
  return row.status === 'active' && valid(row.startsAt) && valid(row.endsAt) && (!row.startsAt || row.startsAt <= today) && (!row.endsAt || row.endsAt >= today) && (!row.startsAt || !row.endsAt || row.startsAt <= row.endsAt);
}
function companyRequireCategory_(category) {
  var code = String(category || 'B').trim().toUpperCase();
  if (code === 'B') return { category: 'B', status: 'active' };
  var rows = companyCategoryRows_().filter(function(row) { return row.category === code; });
  if (rows.length !== 1 || !companyCategoryActive_(rows[0])) throw new Error('This driving category is not active for this school.');
  return rows[0];
}
function apiGetCompanyCategories() {
  // No customer names, pricing plans, notes, payment references or student data leave the server.
  return { categorySubscriptions: [{ category: 'B', status: 'active' }].concat(companyCategoryRows_().filter(function(row) { return row.category !== 'B'; })) };
}
