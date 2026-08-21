import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: "5mb" }));

  // Shared Gemini client instance
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // 1. AI Business Financial Advisor / Chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, contextData, language = "ar" } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemInstruction = `
أنت "المستشار المالي الذكي" المدمج في تطبيق Credit Manager (دفتر الكريدي والفواتير وإدارة الديون للأنشطة التجارية والمحلات في المغرب والعالم العربي).
أنت تتحدث بلباقة واحترافية وبشكل مبسط، وتفهم اللهجة المغربية (الدارجة) والعربية الفصحى والفرنسية بشكل ممتاز.
مهمتك:
1. الإجابة بدقة على أسئلة التاجر وصاحب المحل حول حساباته، ديون زبنائه، مبيعاته، والسيولة النقدية.
2. تقديم نصائح عملية وحلول ذكية لاسترداد الديون وتحسين دورة رأس المال وبناء علاقات طيبة ومحترمة مع الزبناء.
3. صياغة رسائل تذكير لطيفة ومقنعة تناسب مختلف أنواع الزبائن.
4. الإجابة بأسلوب منظم وواضح مع استخدام نقاط وأرقام واضحة.

بيانات المتجر الحالية (سياق حساباتي محدث):
${contextData ? JSON.stringify(contextData) : "لا توجد بيانات مرفقة حالياً"}

لغة المستخدم المفضلة: ${language}
أجب بلغة ودودة واحترافية بناءً على سؤال المستخدم والسياق المرفق.
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        reply: response.text || "عذراً، لم أتمكن من استخراج رد مناسب. يرجى المحاولة ثانية.",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/chat:", err);
      res.status(500).json({
        error: "فشل في معالجة طلب الذكاء الاصطناعي",
        details: err?.message || String(err),
      });
    }
  });

  // 2. AI Quick Portfolio & Credit Risk Analytics
  app.post("/api/ai/analyze-risks", async (req, res) => {
    try {
      const { summaryData, topDebtors, totalDebt, totalInvoices } = req.body;

      const systemInstruction = `
أنت خبير تدقيق وتحليل مخاطر الائتمان والديون للمحلات التجارية.
حلل وضعية ديون الزبائن وقدم تقريراً تحليلياً وتوصيات ذكية في 3 أقسام رئيسية:
1. تقييم مؤشر المخاطر العامة وصحة التدفق المالي (Health Score من 100).
2. أهم 3 مخاطر أو زبائن يحتاجون متابعة مستعجلة مع السبب.
3. 3 خطط وتوصيات عملية للتاجر لتقليص الكريدي ورفع نسبة التحصيل النقدي هذا الشهر.

يجب تقديم الإجابة بأسلوب منسق وجذاب مع استخدام رموز توضيحية.
      `.trim();

      const prompt = `
بيانات التاجر الحالية:
- إجمالي مبالغ الديون المعلقة: ${totalDebt}
- إجمالي عدد الفواتير: ${totalInvoices}
- تفاصيل ديون الزبائن:
${JSON.stringify(topDebtors || summaryData || {})}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      res.json({
        analysis: response.text || "تم التحليل بنجاح.",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/analyze-risks:", err);
      res.status(500).json({
        error: "فشل في إتمام التحليل الذكي",
        details: err?.message || String(err),
      });
    }
  });

  // 3. AI Smart Natural Text/Voice Entry Parser
  app.post("/api/ai/parse-entry", async (req, res) => {
    try {
      const { text, existingCustomers = [] } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text prompt is required" });
      }

      const systemInstruction = `
أنت أداة ذكية لتحويل النصوص والأوامر الصوتية بالدارجة المغربية أو العربية إلى بيانات دين أو دفعة أو فاتورة.
الزبائن المسجلون مسبقاً في الدفتر:
${JSON.stringify(existingCustomers.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })))}

عليك استخراج البيانات وإرجاع JSON نظيف ومباشر بالصيغة التالية تماماً:
{
  "actionType": "debt" | "payment" | "invoice",
  "customerName": "اسم الزبون المستخرج",
  "matchedCustomerId": "id الزبون إذا تطابق اسمه مع زبون مسجل مسبقاً وإلا null",
  "amount": 0, // المبلغ كرقم
  "description": "ملاحظة أو بيان الصنف/السبب",
  "debtType": "lya" | "alya", // lya = لي (دين له بذمة الزبون), alya = عليا (دين عليه لمورد)
  "items": [ // إذا كانت فاتورة بها سلع
    { "name": "اسم السلعة", "quantity": 1, "unitPrice": 100, "total": 100 }
  ]
}
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      let parsedResult = {};
      try {
        parsedResult = JSON.parse(response.text || "{}");
      } catch (e) {
        parsedResult = { raw: response.text };
      }

      res.json({
        success: true,
        data: parsedResult,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/parse-entry:", err);
      res.status(500).json({
        error: "فشل في قراءة وتفكيك النص الذكي",
        details: err?.message || String(err),
      });
    }
  });

  // 4. AI Customized WhatsApp / Reminder Message Generator
  app.post("/api/ai/generate-reminder", async (req, res) => {
    try {
      const { customerName, amount, dueDate, daysOverdue, tone = "friendly", dialect = "darija" } = req.body;

      const systemInstruction = `
أنت كاتب رسائل تذكير ديون احترافي بالواتساب للتجار وأصحاب المتاجر.
عليك صياغة رسالة واتساب أنيقة ومؤدبة وواضحة جداً لتذكير الزبون بمستحقاته دون إحراجه ودون خسارة احترامه وصداقته.
المعطيات:
- اسم الزبون: ${customerName}
- المبلغ المتبقي: ${amount}
- تاريخ الاستحقاق: ${dueDate || "غير محدد"}
- عدد أيام التأخير: ${daysOverdue || 0}
- النبرة المطلوبة: ${tone} (ودية، رسمية، أخوية، حازمة ومؤدبة)
- اللهجة/اللغة: ${dialect} (دارجة مغربية مغربية أنيقة، عربية فصحى، فرنسية)

قم بصياغة رسالتين مقترحتين (الخيار الأول والخيار الثاني) جاهزتين للنسخ والإرسال المباشر على واتساب مع استخدام إيموجي مناسب وبسيط.
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: "اكتب رسائل التذكير بناء على التعليمات.",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        message: response.text || "",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-reminder:", err);
      res.status(500).json({
        error: "فشل في صياغة رسالة التذكير",
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware for development or fallback static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
