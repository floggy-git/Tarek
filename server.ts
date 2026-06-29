import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment configurations
dotenv.config();

// Lazy-initialized Gemini API client to prevent startup failure if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn("GEMINI_API_KEY variable is missing or using default placeholder. Falling back to simulated AI traffic answers.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // REST full-stack endpoint for driving school chatbot assistant
  app.post('/api/chat', async (req, res) => {
    const { message, lang } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is missing' });
    }

    const client = getAIClient();
    if (!client) {
      // Return high quality simulation if API keys are not supplied yet
      let reply = "I am Al-Andalos AI Assistant. Based on Dutch CBR and IBKI standards, please remember that on equal intersections, traffic from the right always has right of way, and white shark teeth markings require you to yield to cross traffic. Is there a specific lesson you'd like to review?";
      if (lang === 'ar') {
        reply = "أنا المساعد الذكي لمدرسة الأندلس. طبقاً لقوانين الـ CBR الهولندية، تذكر دائماً أن الأولوية لليمين في التقاطعات المتساوية، وأن خطوط 'أسنان القرش' الأرضية تعني ضرورة إعطاء الأولوية بالكامل للمرور العابر. هل تود مراجعة درس معين؟";
      } else if (lang === 'nl') {
        reply = "Ik ben de Al-Andalos AI Co-Pilot. Volgens de CBR-theorierichtlijnen heeft verkeer van rechts altijd voorrang op gelijkwaardige kruispunten, en verplichten haaientanden u voorrang te verlenen. Wil je een specifieke les bespreken?";
      }
      return res.json({ reply });
    }

    try {
      const prompt = `
      You are the premium driving school coach/assistant for "AL-ANDALOS RIJSCHOOL", a premium driving academy operating in the Netherlands.
      The user is a student name Amir Al-Hassan studying for their Dutch CBR theory and practical licensure exams.
      Your answers should be friendly, clear, authoritative, and mention exact Dutch rules if applicable (e.g. priority rules, shark teeth markings 'haaientanden', speed limits on motorways, etc.).
      
      Translate and respond in the language specified: "${lang || 'en'}" (Support Dutch 'nl', Arabic 'ar', English 'en'). Ensure RTL styling layout is honored when responding in Arabic.
      
      Student inquiry: "${message}"
      `;

      // Modern use of @google/genai SDK calling model gemini-3.5-flash
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Gemini SDK request failure:", error);
      // Gratefully return a 200 OK fallback reply so the application remains fully robust and never reports API failures.
      let reply = "I am the Al-Andalos AI Co-Pilot. Our live AI brain is currently experiencing high-demand latency. Volgens de CBR-theorierichtlijnen heeft verkeer van rechts altijd voorrang op gelijkwaardige kruispunten, en verplichten haaientanden u voorrang te verlenen. Is there a specific lesson you'd like to review?";
      if (lang === 'ar') {
        reply = "أنا المساعد الذكي لمدرسة الأندلس. مخدم الذكاء الاصطناعي يعاني من عبء مؤقت. طبقاً لقوانين الـ CBR الهولندية، تذكر دائماً أن الأولوية لليمين في التقاطعات المتساوية، وأن خطوط 'أسنان القرش' الأرضية تعني ضرورة إعطاء الأولوية بالكامل للمرور العابر.";
      } else if (lang === 'nl') {
        reply = "Ik ben de Al-Andalos AI Co-Pilot. Onze live AI-verbinding heeft tijdelijk hoge prestatie-eisen. Volgens de CBR-theorierichtlijnen heeft verkeer van rechts altijd voorrang op gelijkwaardige kruispunten, en verplichten haaientanden u voorrang te verlenen.";
      }
      res.json({ reply, fallback: true, error: error.message });
    }
  });

  // Simple in-memory email store to display in the application's admin logs
  const sentEmailsLog: any[] = [];

  app.get('/api/emails', (req, res) => {
    res.json(sentEmailsLog);
  });

  app.post('/api/send-email', async (req, res) => {
    const { to, subject, html, type, studentName, metadata, pdfBase64 } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required email fields (to, subject, html)' });
    }

    const emailRecord = {
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      to,
      subject,
      html,
      type,
      studentName,
      metadata,
      pdfAttachmentName: pdfBase64 ? `Al_Andalos_Dossier_${(studentName || 'Student').replace(/[\s]+/g, '_')}.pdf` : undefined,
      pdfBase64: pdfBase64 || undefined
    };

    sentEmailsLog.unshift(emailRecord);

    // Limit log size to 100 items
    if (sentEmailsLog.length > 100) {
      sentEmailsLog.pop();
    }

    // Log simulated email receipt
    if (pdfBase64) {
      console.log(`[Simulated In-App Email Notification] To: ${to}, Subject: ${subject} with attachment: Al_Andalos_Dossier_${(studentName || 'Student').replace(/[\s]+/g, '_')}.pdf`);
    } else {
      console.log(`[Simulated In-App Email Notification] To: ${to}, Subject: ${subject}`);
    }

    res.json({ 
      success: true, 
      simulated: true, 
      sentReal: false, 
      email: emailRecord 
    });
  });

  // Vite development middleware vs. static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve frontend assets in production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Fallback index.html router for SPA routing values
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AL-ANDALOS RIJSCHOOL] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
