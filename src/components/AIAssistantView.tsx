import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Mic,
  MicOff,
  ShieldAlert,
  MessageSquare,
  Zap,
  TrendingUp,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  HelpCircle,
  PhoneCall,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface AIAssistantViewProps {
  onOpenAddDebt?: (prefill?: any) => void;
  onOpenCreateInvoice?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  onOpenAddDebt,
}) => {
  const { debts, customers, invoices, transactions, config, userProfile, addDebt, addCustomer } =
    useCreditManager();

  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'voice_parser' | 'risk_audit' | 'message_craft'>(
    'chat'
  );

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: `مرحباً بك أخي ${userProfile.name || 'التاجر العزيز'}! 🤖✨\nأنا **المستشار الذكي (AI Credit & Financial Advisor)** المدمج في متجرك.\nيمكنك سؤالي عن أي شيء يخص ديون الزبناء، وضعية الصندوق، اقتراح خطط لاسترداد المبالغ المتأخرة، أو صياغة رسائل تذكير لطيفة بالدارجة أو العربية. كيف يمكنني مساعدتك اليوم؟`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Smart Parser State
  const [parserInput, setParserInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Risk Audit State
  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Message Craft State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [messageTone, setMessageTone] = useState<'friendly' | 'formal' | 'brotherly' | 'firm'>('friendly');
  const [messageDialect, setMessageDialect] = useState<'darija' | 'arabic' | 'french'>('darija');
  const [generatedReminder, setGeneratedReminder] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Calculations for Context
  const totalLya = debts.filter((d) => d.type === 'lya').reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalAlya = debts.filter((d) => d.type === 'alya').reduce((sum, d) => sum + d.remainingAmount, 0);
  const overdueDebts = debts.filter((d) => d.status === 'overdue' || (d.dueDate && new Date(d.dueDate) < new Date() && d.remainingAmount > 0));

  // 1. Handle Chat Submit
  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg = {
      role: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setIsChatLoading(true);

    try {
      // Build context of business
      const contextData = {
        storeName: userProfile.businessName,
        totalCustomers: customers.length,
        totalDebtsReceivable: totalLya,
        totalDebtsPayable: totalAlya,
        totalInvoicesCount: invoices.length,
        overdueCount: overdueDebts.length,
        topCustomersWithDebt: customers
          .map((c) => {
            const cDebts = debts.filter((d) => d.customerId === c.id && d.type === 'lya');
            const rem = cDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
            return { name: c.name, phone: c.phone, remainingDebt: rem };
          })
          .filter((c) => c.remainingDebt > 0)
          .sort((a, b) => b.remainingDebt - a.remainingDebt)
          .slice(0, 10),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          contextData,
          language: config.language,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || 'عذراً، حدث خطأ أثناء معالجة الطلب.';

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'تعذر الاتصال بخادم الذكاء الاصطناعي، يرجى المحاولة مرة أخرى.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 2. Handle Smart Voice/Text Parser
  const handleParseEntry = async () => {
    if (!parserInput.trim() || isParsing) return;
    setIsParsing(true);
    setParsedResult(null);
    setAppliedSuccess(false);

    try {
      const res = await fetch('/api/ai/parse-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: parserInput,
          existingCustomers: customers,
        }),
      });

      const data = await res.json();
      if (data.data) {
        setParsedResult(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  // Web Speech API for Voice recognition if supported
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setParserInput('سجل 150 درهم كريدي على عثمان خنشة طحين');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-MA';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setParserInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  // Apply parsed entry directly to database
  const handleApplyParsedEntry = () => {
    if (!parsedResult) return;

    // Find or create customer
    let targetCustomerId = parsedResult.matchedCustomerId;
    if (!targetCustomerId && parsedResult.customerName) {
      const existing = customers.find(
        (c) => c.name.toLowerCase() === parsedResult.customerName.toLowerCase()
      );
      if (existing) {
        targetCustomerId = existing.id;
      } else {
        addCustomer({
          name: parsedResult.customerName,
          phone: '',
          notes: 'تمت إضافته عبر المساعد الذكي AI',
        });
        // Look up after adding
        const matched = customers.find(
          (c) => c.name.toLowerCase() === parsedResult.customerName.toLowerCase()
        );
        targetCustomerId = matched?.id || customers[0]?.id;
      }
    }

    if (!targetCustomerId) {
      targetCustomerId = customers[0]?.id;
    }

    // Add debt
    const amount = Number(parsedResult.amount) || 0;
    if (amount > 0 && targetCustomerId) {
      addDebt({
        customerId: targetCustomerId,
        type: parsedResult.debtType === 'alya' ? 'alya' : 'lya',
        amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        category:
          parsedResult.description ||
          (parsedResult.items ? parsedResult.items.map((i: any) => i.name).join(', ') : 'مشتريات عبر الذكاء الاصطناعي'),
        notes: `إضافة ذكية: "${parserInput}"`,
      });

      setAppliedSuccess(true);
    }
  };

  // 3. Handle Risk Audit
  const handleRunRiskAudit = async () => {
    setIsAuditing(true);
    try {
      const topDebtors = customers
        .map((c) => {
          const cDebts = debts.filter((d) => d.customerId === c.id && d.type === 'lya');
          const rem = cDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
          const overdue = cDebts.some((d) => d.status === 'overdue' || (d.dueDate && new Date(d.dueDate) < new Date() && d.remainingAmount > 0));
          return { name: c.name, remainingDebt: rem, isOverdue: overdue, debtCount: cDebts.length };
        })
        .filter((c) => c.remainingDebt > 0)
        .sort((a, b) => b.remainingDebt - a.remainingDebt)
        .slice(0, 15);

      const res = await fetch('/api/ai/analyze-risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalDebt: formatCurrency(totalLya, config.currency, config.language),
          totalInvoices: invoices.length,
          topDebtors,
        }),
      });

      const data = await res.json();
      setRiskAnalysis(data.analysis || 'تم إتمام التحليل بنجاح.');
    } catch (e) {
      console.error(e);
      setRiskAnalysis('حدث خطأ أثناء إجراء الفحص الذكي للديون.');
    } finally {
      setIsAuditing(false);
    }
  };

  // 4. Handle Message Generation
  const handleGenerateMessage = async () => {
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const custDebts = debts.filter((d) => d.customerId === cust.id && d.type === 'lya');
    const remaining = custDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const earliestDueDate = custDebts.find((d) => d.dueDate)?.dueDate;

    setIsGeneratingMessage(true);
    setCopiedMessage(false);

    try {
      const res = await fetch('/api/ai/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: cust.name,
          amount: formatCurrency(remaining, config.currency, config.language),
          dueDate: earliestDueDate ? formatDate(earliestDueDate, config.language) : '',
          tone: messageTone,
          dialect: messageDialect,
        }),
      });

      const data = await res.json();
      setGeneratedReminder(data.message || '');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top AI Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
        <div className="absolute -end-10 -top-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute end-1/3 -bottom-12 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-400 p-0.5 shadow-lg shadow-indigo-500/30 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900/60 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">المستشار الذكي (AI Business Assistant)</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Gemini Flash AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl leading-relaxed">
                مساعد متقدم مدعوم بالذكاء الاصطناعي لتحليل ديون متجرك، صياغة رسائل التذكير، الإدخال الصوتي السريع، والإجابة على كافة استفساراتك المالية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-950/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-600/40 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-emerald-300">جاهز ومتصل بالبيانات</span>
          </div>
        </div>

        {/* Sub Navigation Buttons */}
        <div className="mt-6 pt-5 border-t border-indigo-700/50 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'chat'
                ? 'bg-white text-indigo-900 shadow-lg shadow-black/20'
                : 'bg-indigo-950/50 text-indigo-200 hover:bg-indigo-900/80'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>المستشار المالي (Chat)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('voice_parser')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'voice_parser'
                ? 'bg-white text-indigo-900 shadow-lg shadow-black/20'
                : 'bg-indigo-950/50 text-indigo-200 hover:bg-indigo-900/80'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>الإضافة السريعة بالصوت والكتابة</span>
          </button>

          <button
            onClick={() => setActiveSubTab('risk_audit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'risk_audit'
                ? 'bg-white text-indigo-900 shadow-lg shadow-black/20'
                : 'bg-indigo-950/50 text-indigo-200 hover:bg-indigo-900/80'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>فحص مخاطر وصحة الديون</span>
          </button>

          <button
            onClick={() => setActiveSubTab('message_craft')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'message_craft'
                ? 'bg-white text-indigo-900 shadow-lg shadow-black/20'
                : 'bg-indigo-950/50 text-indigo-200 hover:bg-indigo-900/80'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>صانع رسائل تذكير الواتساب</span>
          </button>
        </div>
      </div>

      {/* Tab 1: AI Chat Assistant */}
      {activeSubTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[620px]">
          {/* Preset Suggested Questions */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <span className="text-slate-400 shrink-0 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> أسئلة سريعة:
            </span>
            <button
              onClick={() => handleSendChat('حلل لي وضعية الديون والمبالغ المتأخرة وما هي أهم الخطوات لاستردادها؟')}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-all"
            >
              📊 تحليل الديون المتأخرة
            </button>
            <button
              onClick={() => handleSendChat('شكون هما الزبناء لي عندهم أكبر مبلغ ديال الكريدي؟')}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-all"
            >
              👥 أكبر الزبائن ديوناً
            </button>
            <button
              onClick={() => handleSendChat('عطيني 3 نصائح ذهبية باش نضبط الكريدي فالمحل بلا ما نخسر الكليان')}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-all"
            >
              💡 نصائح تحصيل الكريدي
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md shadow-indigo-600/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs shadow-sm'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div
                    className={`text-[10px] mt-2 font-mono text-end ${
                      msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">جاري التفكير وتحليل البيانات المالية...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اسأل المستشار الذكي عن أي شيء حول المحل، الزبناء، أو الحسابات..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-xs sm:text-sm"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">إرسال</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Smart Voice/Text Parser */}
      {activeSubTab === 'voice_parser' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  التسجيل السريع بالأوامر الصوتية أو النصية
                </h3>
              </div>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
                title="تسجيل صوتي بالمايكروفون"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-600" />}
                <span>{isRecording ? 'جاري الاستماع...' : 'تحدث بالمايكروفون'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              اكتب أو قل جملتك بالدارجة المغربية أو العربية العادية، وسيقوم الذكاء الاصطناعي بفهمها فوراً واستخراج اسم الزبون، المبلغ، الصنف، والنوع وتجهيزها للحفظ بنقرة واحدة!
            </p>

            {/* Quick Examples */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">أمثلة يمكنك تجربتها بالضغط عليها:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setParserInput('سجل 250 درهم كريدي على عثمان خنشة ديال الطحين وقرعة زيت')}
                  className="px-2.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 text-slate-700 dark:text-slate-300"
                >
                  "سجل 250 درهم كريدي على عثمان..."
                </button>
                <button
                  onClick={() => setParserInput('حميد عطاني 100 درهم تسبيق من الكريدي القديم')}
                  className="px-2.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 text-slate-700 dark:text-slate-300"
                >
                  "حميد عطاني 100 درهم تسبيق..."
                </button>
                <button
                  onClick={() => setParserInput('عليا 800 درهم للمورد شركة الحليب ستسدد الأسبوع القادم')}
                  className="px-2.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 text-slate-700 dark:text-slate-300"
                >
                  "عليا 800 درهم للمورد..."
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={parserInput}
              onChange={(e) => setParserInput(e.target.value)}
              placeholder="مثال: عطي 350 درهم سلعة كريدي لمحمد النجار خشب ومسامير..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />

            <button
              onClick={handleParseEntry}
              disabled={!parserInput.trim() || isParsing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-xs sm:text-sm"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>{isParsing ? 'جاري تحليل النص واستخراج البيانات...' : 'تحليل وفكك بالذكاء الاصطناعي ✨'}</span>
            </button>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>البيانات المستخرجة تلقائياً:</span>
              </h3>

              {parsedResult ? (
                <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">نوع المعاملة:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {parsedResult.actionType === 'payment' ? 'سداد / دفعة تسبيق' : 'تسجيل دين / كريدي'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">المبلغ المستخرج:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                        {formatCurrency(parsedResult.amount || 0, config.currency, config.language)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">اسم الزبون:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {parsedResult.customerName || 'غير محدد'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">جهة الدين:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {parsedResult.debtType === 'alya' ? 'عليا (للمورد)' : 'لي (على الزبون)'}
                      </span>
                    </div>
                  </div>

                  {parsedResult.description && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs">
                      <span className="text-[10px] text-slate-400 block mb-1">البيان والسلع:</span>
                      <span className="text-slate-700 dark:text-slate-200">{parsedResult.description}</span>
                    </div>
                  )}

                  {appliedSuccess ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>تمت إضافة المعاملة بنجاح وتحديث الحساب المالي! 🎉</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleApplyParsedEntry}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-xs sm:text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد وحفظ في دفتر الديون مباشرة 💾</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 space-y-2">
                  <Bot className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">لم يتم إدخال أي نص بعد. اكتب أمراً في الصندوق واضغط تحليل.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Risk Audit & Health Scan */}
      {activeSubTab === 'risk_audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>فحص صحة دفتر الديون ومؤشر مخاطر الائتمان</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تدقيق آلي متقدم عبر Gemini 3.7 Flash لفحص توزيع ديون الزبناء، كشف التأخيرات، وتوليد توصيات استراتيجية.
              </p>
            </div>

            <button
              onClick={handleRunRiskAudit}
              disabled={isAuditing}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all text-xs sm:text-sm"
            >
              {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{isAuditing ? 'جاري فحص وتدقيق السجلات...' : 'بدء فحص المخاطر الآن'}</span>
            </button>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 block">إجمالي ديون الزبناء المعلقة:</span>
              <span className="text-lg font-black text-rose-600 font-mono mt-1 block">
                {formatCurrency(totalLya, config.currency, config.language)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 block">عدد الزبناء المسجلين:</span>
              <span className="text-lg font-black text-indigo-600 font-mono mt-1 block">
                {customers.length} زبون
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 block">بونات متأخرة عن الأجل:</span>
              <span className="text-lg font-black text-amber-600 font-mono mt-1 block">
                {overdueDebts.length} بون متأخر
              </span>
            </div>
          </div>

          {/* AI Analysis Result */}
          {riskAnalysis ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>تقرير الفحص والتدقيق المالي الذكي:</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {riskAnalysis}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-400/50" />
              <p className="text-xs">اضغط على زر "بدء فحص المخاطر الآن" لتوليد تقرير شامل لسلامة ديونك المالية.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Message Craft */}
      {activeSubTab === 'message_craft' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              <span>صانع رسائل الواتساب الذكية والمخصصة (AI WhatsApp Writer)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              صياغة رسائل تذكير لطيفة واحترافية تناسب كل زبون مع مراعاة اللهجة المغربية أو الفصحى والنبرة دون أي إحراج.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Customer Select */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                اختر الزبون:
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone Select */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                نبرة الرسالة:
              </label>
              <select
                value={messageTone}
                onChange={(e) => setMessageTone(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-white"
              >
                <option value="friendly">ودية ولطيفة جداً (بدون إحراج)</option>
                <option value="brotherly">أخوية وقريبة (للأصدقاء والمعارف)</option>
                <option value="formal">رسمية وتجارية أنيقة</option>
                <option value="firm">حازمة ومهذبة (للمتأخرين جداً)</option>
              </select>
            </div>

            {/* Dialect Select */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                اللهجة / اللغة:
              </label>
              <select
                value={messageDialect}
                onChange={(e) => setMessageDialect(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm dark:text-white"
              >
                <option value="darija">الدارجة المغربية الأنيقة (المحببة)</option>
                <option value="arabic">اللغة العربية الفصحى</option>
                <option value="french">الفرنسية (Français)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateMessage}
            disabled={isGeneratingMessage || !selectedCustomerId}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-xs sm:text-sm"
          >
            {isGeneratingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGeneratingMessage ? 'جاري الصياغة بالذكاء الاصطناعي...' : 'صياغة رسالة الواتساب بالذكاء الاصطناعي ✨'}</span>
          </button>

          {/* Generated Text */}
          {generatedReminder && (
            <div className="bg-[#efeae2] dark:bg-[#0b141a] p-5 rounded-2xl border border-slate-300 dark:border-slate-800 space-y-4">
              <div className="bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-4 rounded-2xl shadow text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {generatedReminder}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedReminder);
                    setCopiedMessage(true);
                    setTimeout(() => setCopiedMessage(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedMessage ? 'تم النسخ!' : 'نسخ النص'}</span>
                </button>

                <button
                  onClick={() => {
                    const cust = customers.find((c) => c.id === selectedCustomerId);
                    if (cust?.phone) {
                      const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedReminder)}`, '_blank');
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(generatedReminder)}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>فتح في WhatsApp فوراً</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
