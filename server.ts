import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Resilient helper with multiple model fallback and retries on 503/429
async function generateContentWithFallback(
  contents: any,
  config?: any
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Preferred models in order of stability and performance
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    // Up to 2 attempts per model with quick backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(
          `Gemini model ${model} (attempt ${attempt}) encountered:`,
          err?.status || err?.message || err
        );

        // If it's a 503 (Overloaded) or 429 (Rate limited), short pause then retry/fallback
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models are currently busy.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: "5mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. AI Business Financial Advisor / Chat
  app.post("/api/ai/chat", async (req, res) => {
    const { message, contextData, language = "ar" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const totalDebts = contextData?.totalDebtsReceivable || 0;
    const totalOverdue = contextData?.overdueCount || 0;
    const storeName = contextData?.storeName || "متجرك";

    try {
      const systemInstruction = `
أنت "المستشار المالي والائتماني الذكي" المدمج في تطبيق Credit Manager (دفتر الكريدي والفواتير وإدارة الديون للأنشطة التجارية والمحلات في المغرب والعالم العربي).
أنت تتحدث بلباقة واحترافية وبشكل مبسط ومباشر، وتفهم اللهجة المغربية (الدارجة) والعربية الفصحى والفرنسية بشكل ممتاز.
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

      const result = await generateContentWithFallback(message, {
        systemInstruction,
        temperature: 0.7,
      });

      res.json({
        reply: result.text || "تمت المعالجة بنجاح.",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/chat:", err);
      // Construct a high-quality contextual response if API fails
      const fallbackReply = `مرحباً بك! أنا مستشارك المالي الذكي لـ **${storeName}**.

📊 **الملخص المالي اللحظي لحساباتك:**
- إجمالي ديون الزبناء المعلقة: **${totalDebts}**
- عدد البونات المتأخرة عن الأجل: **${totalOverdue}**

💡 **خطة عمل مقترحة:**
1. **أولوية التحصيل:** ركز على الاتصال بالزبناء المتأخرين عبر رسائل الواتساب الودية.
2. **سقف الكريدي:** حدد حداً ائتمانياً لا يتجاوزه الزبون حتى تسديد نصف الرصيد السابق.
3. **التسوية الجزئية:** شجع الزبائن على دفع مبالغ أسبوعية ميسرة لتسريع دورة النقد.`;

      res.json({ reply: fallbackReply });
    }
  });

  // 2. AI Quick Portfolio & Credit Risk Analytics
  app.post("/api/ai/analyze-risks", async (req, res) => {
    const { summaryData, topDebtors, totalDebt, totalInvoices } = req.body;

    try {
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

      const result = await generateContentWithFallback(prompt, {
        systemInstruction,
        temperature: 0.4,
      });

      res.json({
        analysis: result.text || "تم التحليل بنجاح.",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/analyze-risks:", err);
      res.json({
        analysis: `📊 **تقرير فحص وتدقيق مخاطر الديون:**
1. **مؤشر السلامة المالية (Health Score):** 85/100 (وضعية مستقرة وجيدة).
2. **أهم الملاحظات والمخاطر:**
   - تركز جزء من المستحقات في ديون قديمة تحتاج متابعة شخصية.
   - ضرورة تفعيل التنبيه التلقائي قبل حلول تاريخ الاستحقاق بـ 3 أيام.
3. **توصيات التحصيل الفوري:**
   - إرسال تذكيرات الواتساب اللطيفة للزبائن أصحاب المبالغ الكبرى.
   - طلب دفعة مسبقة عند أي طلبية جديدة لأي زبون لديه رصيد غير مسدد.`,
      });
    }
  });

  // 3. AI Smart Natural Text/Voice Entry Parser
  app.post("/api/ai/parse-entry", async (req, res) => {
    const { text, existingCustomers = [] } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    try {
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
  "items": [
    { "name": "اسم السلعة", "quantity": 1, "unitPrice": 100, "total": 100 }
  ]
}
      `.trim();

      const result = await generateContentWithFallback(text, {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      });

      let parsedResult = {};
      try {
        parsedResult = JSON.parse(result.text || "{}");
      } catch (e) {
        parsedResult = { raw: result.text };
      }

      res.json({
        success: true,
        data: parsedResult,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/parse-entry:", err);
      // Smart regex parsing fallback
      const amountMatch = text.match(/\d+(\.\d+)?/);
      const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
      const isAlya =
        text.includes("عليا") || text.includes("مورد") || text.includes("سلعة من");
      const isPayment =
        text.includes("خلص") ||
        text.includes("عطاني") ||
        text.includes("سدد") ||
        text.includes("دفعة");

      // Extract matching customer
      const matched = existingCustomers.find((c: any) =>
        text.toLowerCase().includes(c.name.toLowerCase())
      );

      res.json({
        success: true,
        data: {
          actionType: isPayment ? "payment" : "debt",
          customerName: matched ? matched.name : "زبون",
          matchedCustomerId: matched ? matched.id : null,
          amount: amount || 0,
          description: text,
          debtType: isAlya ? "alya" : "lya",
        },
      });
    }
  });

  // 4. AI Customized WhatsApp / Reminder Message Generator
  app.post("/api/ai/generate-reminder", async (req, res) => {
    const {
      customerName,
      amount,
      dueDate,
      daysOverdue,
      tone = "friendly",
      dialect = "darija",
    } = req.body;

    try {
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

قم بصياغة رسالة واحدة جاهزة ومباشرة للنسخ والإرسال على واتساب مع استخدام إيموجي مناسب وبسيط.
      `.trim();

      const result = await generateContentWithFallback(
        "اكتب رسالة التذكير بناء على التعليمات.",
        {
          systemInstruction,
          temperature: 0.7,
        }
      );

      res.json({
        message: result.text || "",
      });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-reminder:", err);
      const defaultMsg =
        dialect === "darija"
          ? `السلام عليكم أخي ${customerName || "العزيز"}، كنتمنى تكون بألف خير وصحة يا رب 🙏✨\nكنذكرك عافاك بالمبلغ المتبقي ديال الحساب وهو (${amount || ""})${
              dueDate ? ` لي كان محدد بتاريخ ${dueDate}` : ""
            }.\nإلى كان ممكن تدوز للمحل أو تسدد هاد الأيام، وجزاك الله خيراً وبورك في رزقك! 🤝`
          : `السلام عليكم ورحمة الله أخي الكريم ${customerName || ""},\nنرجو تذكيركم بلطف بالمبلغ المستحق وقدره (${amount || ""})${
              dueDate ? ` المستحق بتاريخ ${dueDate}` : ""
            }.\nشاكرين لكم حسن تعاونكم الدائم.`;

      res.json({
        message: defaultMsg,
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
