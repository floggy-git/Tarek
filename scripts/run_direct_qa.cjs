const http = require('http');
const fs = require('fs');

const logFile = './qa_results.log';
fs.writeFileSync(logFile, 'QA RUN STARTED at ' + new Date().toISOString() + '\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ask(msg, history = []) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message: msg, history, studentData: {} });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          resolve({ reply: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    log('=== TEST 1 ===');
    let h1 = [];
    const t1 = [
      'أنا داخل تقاطع بدون شاخطات، والسيارة جاية من اليمين، مين بيمر؟',
      'طيب لو الشارع 30؟',
      'ولو السيارة الثانية دراجة؟',
      'طيب إذا أنا بدي ألف يسار؟',
      'ليش؟',
      'اشرحلي أكتر'
    ];
    for (let i = 0; i < t1.length; i++) {
      const q = t1[i];
      log(`\n[T1-${i+1}] Student: ${q}`);
      const res = await ask(q, h1);
      log(`AI: ${res.reply}`);
      h1.push({ sender: 'user', text: q });
      h1.push({ sender: 'ai', text: res.reply });
      await wait(300);
    }

    log('\n=== TEST 2 ===');
    let h2 = [
      { sender: 'user', text: 'أنا عند تقاطع متساوي وفي سيارة على يميني' },
      { sender: 'ai', text: 'السيارة القادمة من اليمين تمر أولاً وفق قاعدة (Voorrang van rechts).' }
    ];
    const t2 = [
      'شو يعني؟',
      'ليش؟',
      'مين إلو الأولوية؟',
      'ولو الثانية دراجة؟',
      'طيب وإذا في شاخطة؟',
      'ما فهمت',
      'اشرحلي أكتر'
    ];
    for (let i = 0; i < t2.length; i++) {
      const q = t2[i];
      log(`\n[T2-${i+1}] Student: ${q}`);
      const res = await ask(q, h2);
      log(`AI: ${res.reply}`);
      h2.push({ sender: 'user', text: q });
      h2.push({ sender: 'ai', text: res.reply });
      await wait(300);
    }

    log('\n=== TEST 3 ===');
    let h3 = [];
    const t3 = [
      'شو الفرق بين B1 و B6؟',
      'و B7؟',
      'يعني مين لازم يعطي أولوية؟'
    ];
    for (let i = 0; i < t3.length; i++) {
      const q = t3[i];
      log(`\n[T3-${i+1}] Student: ${q}`);
      const res = await ask(q, h3);
      log(`AI: ${res.reply}`);
      h3.push({ sender: 'user', text: q });
      h3.push({ sender: 'ai', text: res.reply });
      await wait(300);
    }

    log('\n=== COMPLETE ===');
  } catch(e) {
    log('ERROR: ' + e.message);
  }
}

run();
