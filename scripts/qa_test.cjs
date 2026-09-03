const http = require('http');

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

async function runTestSuite() {
  console.log('==============================================');
  console.log('STARTING TEST 1: ARABIC DIALECT + CONTEXT');
  console.log('==============================================');
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
    console.log('\n--- [TEST 1 - Step ' + (i+1) + '] Student: ' + q);
    const res = await ask(q, h1);
    console.log('AI Coach Reply:\n' + res.reply);
    h1.push({ sender: 'user', text: q });
    h1.push({ sender: 'ai', text: res.reply });
    await wait(400);
  }

  console.log('\n==============================================');
  console.log('STARTING TEST 2: INFORMAL ARABIC');
  console.log('==============================================');
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
    console.log('\n--- [TEST 2 - Step ' + (i+1) + '] Student: ' + q);
    const res = await ask(q, h2);
    console.log('AI Coach Reply:\n' + res.reply);
    h2.push({ sender: 'user', text: q });
    h2.push({ sender: 'ai', text: res.reply });
    await wait(400);
  }

  console.log('\n==============================================');
  console.log('STARTING TEST 3: B1 / B6 / B7 SIGNS');
  console.log('==============================================');
  let h3 = [];
  const t3 = [
    'شو الفرق بين B1 و B6؟',
    'و B7؟',
    'يعني مين لازم يعطي أولوية؟'
  ];

  for (let i = 0; i < t3.length; i++) {
    const q = t3[i];
    console.log('\n--- [TEST 3 - Step ' + (i+1) + '] Student: ' + q);
    const res = await ask(q, h3);
    console.log('AI Coach Reply:\n' + res.reply);
    h3.push({ sender: 'user', text: q });
    h3.push({ sender: 'ai', text: res.reply });
    await wait(400);
  }

  console.log('\n==============================================');
  console.log('ALL TESTS COMPLETED');
  console.log('==============================================');
}

runTestSuite();
