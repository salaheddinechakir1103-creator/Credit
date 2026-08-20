import React, { useState, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Send,
  Copy,
  Check,
  Sparkles,
  HeartHandshake,
  Receipt,
  Clock,
  Gift,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Store,
  Phone,
  FileText,
  Edit3,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { Customer, Debt, Transaction } from '../types/creditManager';

export type WhatsAppTemplateType =
  | 'detailed_statement'
  | 'gentle_reminder'
  | 'payment_receipt'
  | 'new_bill'
  | 'due_soon'
  | 'appreciation';

interface WhatsAppMessageModalProps {
  customer: Customer;
  defaultDebtId?: string;
  defaultTransaction?: Transaction;
  initialTemplate?: WhatsAppTemplateType;
  onClose: () => void;
}

export const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  customer,
  defaultDebtId,
  defaultTransaction,
  initialTemplate = 'detailed_statement',
  onClose,
}) => {
  const { debts, transactions, config, userProfile } = useCreditManager();

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateType>(initialTemplate);
  const [includeItemizedDebts, setIncludeItemizedDebts] = useState<boolean>(true);
  const [includeContactInfo, setIncludeContactInfo] = useState<boolean>(true);
  const [customText, setCustomText] = useState<string>('');
  const [isEditingManually, setIsEditingManually] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Customer data
  const customerDebts = debts.filter((d) => d.customerId === customer.id);
  const unpaidDebts = customerDebts.filter((d) => d.remainingAmount > 0);
  const customerTransactions = transactions.filter((t) => t.customerId === customer.id);

  const totalLya = customerDebts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalPaid = customerTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const totalOriginal = customerDebts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.amount, 0);

  // Selected specific debt or transaction if provided
  const specificDebt = defaultDebtId ? debts.find((d) => d.id === defaultDebtId) : unpaidDebts[0];
  const lastPayment = defaultTransaction || customerTransactions[0];

  const todayStr = new Date().toLocaleDateString(config.language === 'ar' ? 'ar-MA' : 'fr-FR');
  const businessTitle = userProfile.businessName || 'متجر الأمانة للتجارة';
  const ownerPhone = userProfile.phone || '';

  // Generate template text
  const generatedMessage = useMemo(() => {
    switch (selectedTemplate) {
      case 'detailed_statement': {
        const itemizedList =
          includeItemizedDebts && unpaidDebts.length > 0
            ? `\n📋 *تفاصيل البونات والسلع المتبقية:*\n` +
              unpaidDebts
                .map(
                  (d, i) =>
                    `▫️ ${i + 1}. *${d.category || 'بضاعة'}* (${formatDate(
                      d.date,
                      config.language
                    )}):\n   المتبقي: *${formatCurrency(
                      d.remainingAmount,
                      config.currency,
                      config.language
                    )}* _(من أصل ${formatCurrency(d.amount, config.currency, config.language)})_`
                )
                .join('\n')
            : '';

        const contactFooter = includeContactInfo
          ? `\n\n🏪 *${businessTitle}*\n📞 للتواصل: ${ownerPhone}`
          : '';

        return `السلام عليكم ورحمة الله وبركاته 🌹
أخي/أختي الفاضل/ة: *${customer.name}* المحترم/ة
تحية طيبة مباركة ملؤها التقدير والامتنان لتعاملكم الراقي معنا ✨

يسعدنا دائماً خدمتكم، ونضع بين أيديكم الكريمة ملخص كشف الحساب المالي حتى تاريخ ${todayStr}:

💰 *الملخص المالي العام:*
• إجمالي المشتريات: *${formatCurrency(totalOriginal, config.currency, config.language)}*
• إجمالي المسدد: *${formatCurrency(totalPaid, config.currency, config.language)}*
• ⚖️ *الرصيد الصافي المتبقي بذمتكم: ${formatCurrency(
          totalLya,
          config.currency,
          config.language
        )}*${itemizedList}

نسأل الله تعالى أن يبارك لكم في أرزاقكم وأهلكم ويجعل تجارتنا وإياكم تجارة خير وبركة 🤲
شاكرين لكم عظيم ثقتكم وحسن وفائكم الدائم 🌟${contactFooter}`;
      }

      case 'gentle_reminder': {
        const contactFooter = includeContactInfo
          ? `\n\n🏪 إدارة *${businessTitle}*\n📞 ${ownerPhone}`
          : '';

        return `أهلاً وسهلاً بك أخي العزيز *${customer.name}* 🌺
أتمنى أن تكون وجميع أفراد الأسرة الكريمة في تمام الصحة والعافية والخير 🌿

نحيطكم علماً بلطف وبكل مودة بأن الرصيد المتبقي المسجل بذمتكم الكريمة لدى *${businessTitle}* هو:
💎 *${formatCurrency(totalLya, config.currency, config.language)}* 💎

نحن دائماً في خدمتكم ويسرنا تواصلكم في أي وقت يناسبكم لتسوية الحساب بكل راحة وسلاسة.
دمتم برعاية الله وحفظه، وجزاكم الله عنا كل خير وبارك فيكم 🌸${contactFooter}`;
      }

      case 'payment_receipt': {
        const paidAmt = lastPayment
          ? formatCurrency(lastPayment.amount, config.currency, config.language)
          : formatCurrency(0, config.currency, config.language);
        const receiptNo = lastPayment?.receiptNumber || 'REC-' + Date.now().toString().slice(-4);
        const payDate = lastPayment
          ? formatDate(lastPayment.paymentDate, config.language)
          : todayStr;
        const payMethod = lastPayment?.paymentMethod === 'cash' ? 'نقداً (كاش)' : 'تحويل بنكي';

        const contactFooter = includeContactInfo ? `\n\n🏪 *${businessTitle}*` : '';

        return `السلام عليكم ورحمة الله وبركاته أخي الفاضل *${customer.name}* 🤝✨

نشكركم جزيل الشكر على طيب وفائكم وحسن تعاملكم، ونؤكد لكم استلام دفعتكم المالية بكل نجاح:
💵 *المبلغ المسدد:* *${paidAmt}*
🧾 *رقم الإيصال:* #${receiptNo}
📅 *تاريخ الأداء:* ${payDate} (${payMethod})

📊 *الرصيد المتبقي بذمتكم بعد هذا الأداء:*
✨ *${formatCurrency(totalLya, config.currency, config.language)}* ✨

جعلها الله دفعة بركة وخير، وبارك الله لكم في رزقكم وأخلف عليكم بالخير الوفير 🤲🌹
دامت ثقتكم بنا ودام فضلكم.${contactFooter}`;
      }

      case 'new_bill': {
        const debtName = specificDebt?.category || 'مشتريات جديدة';
        const debtAmt = specificDebt
          ? formatCurrency(specificDebt.amount, config.currency, config.language)
          : formatCurrency(totalLya, config.currency, config.language);
        const debtDate = specificDebt
          ? formatDate(specificDebt.date, config.language)
          : todayStr;
        const dueDate = specificDebt?.dueDate
          ? formatDate(specificDebt.dueDate, config.language)
          : 'حسب الاتفاق';

        const contactFooter = includeContactInfo
          ? `\n\n🏪 *${businessTitle}*\n📞 ${ownerPhone}`
          : '';

        return `مرحباً بك أستاذنا العزيز *${customer.name}* 🛒✨
سعدنا بزيارتكم الكريمة وتسوقكم من *${businessTitle}*.

تم توثيق معاملتكم وبون المشتريات الجديد بكل عناية وشفافية:
📦 *البيان:* ${debtName}
📅 *التاريخ:* ${debtDate}
💰 *المبلغ:* *${debtAmt}*
⏳ *موعد الاستحقاق المتفق عليه:* ${dueDate}

📊 *إجمالي رصيدكم المتبقي:* *${formatCurrency(
          totalLya,
          config.currency,
          config.language
        )}*

بالصحة والسلامة وهنيئاً لكم مشترياتكم، وفي انتظار تشريفكم دائماً 🌟${contactFooter}`;
      }

      case 'due_soon': {
        const dueDebt = unpaidDebts.find((d) => d.dueDate) || specificDebt;
        const dueAmt = dueDebt
          ? formatCurrency(dueDebt.remainingAmount, config.currency, config.language)
          : formatCurrency(totalLya, config.currency, config.language);
        const dueDate = dueDebt?.dueDate
          ? formatDate(dueDebt.dueDate, config.language)
          : 'خلال الأيام القادمة';

        const contactFooter = includeContactInfo
          ? `\n\n🏪 *${businessTitle}*\n📞 ${ownerPhone}`
          : '';

        return `السلام عليكم ورحمة الله أخي الكريم *${customer.name}* 🕊️

نود تذكيركم بلطف وبكل مودة باقتراب موعد استحقاق البون المالي المسجل بمبلغ *${dueAmt}*، والمقرر أداؤه بتاريخ *${dueDate}*.

نحن دائماً رهن إشارتكم لتسهيل الأمور بما يريحكم، وشاكرين لكم دوام التنسيق والتعاون المثمر 🌿
تقبلوا منا أسمى عبارات التقدير والاحترام والمودة 💐${contactFooter}`;
      }

      case 'appreciation': {
        const contactFooter = includeContactInfo
          ? `\n\n🏪 إدارة *${businessTitle}*`
          : '';

        return `أخي وصديقنا العزيز *${customer.name}* 🌟
يسر إدارة *${businessTitle}* أن تبعث إليكم بأطيب التحيات وأصدق الأمنيات بدوام التوفيق والبركة في صحتكم وأهلكم ومالكم 🌺

أنتم من خيرة زبنائنا الكرام الذين نعتز ونفخر بالتعامل معهم ونقدر حسن وفائهم الدائم.
محلكم ومكانكم دائماً في القلب، ونسعد بخدمتكم في كل ما تحتاجونه دائماً 💫${contactFooter}`;
      }

      default:
        return '';
    }
  }, [
    selectedTemplate,
    customer,
    unpaidDebts,
    totalOriginal,
    totalPaid,
    totalLya,
    todayStr,
    businessTitle,
    ownerPhone,
    includeItemizedDebts,
    includeContactInfo,
    config,
    specificDebt,
    lastPayment,
  ]);

  // Use either the manually edited text or the freshly generated template text
  const currentMessageText = isEditingManually ? customText : generatedMessage;

  const handleTemplateSelect = (tmpl: WhatsAppTemplateType) => {
    setSelectedTemplate(tmpl);
    setIsEditingManually(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const url = getWhatsAppUrl(customer.phone, currentMessageText);
    window.open(url, '_blank');
  };

  const templatesList: {
    id: WhatsAppTemplateType;
    label: string;
    description: string;
    icon: React.ElementType;
    badgeColor: string;
  }[] = [
    {
      id: 'detailed_statement',
      label: 'كشف حساب مفصل وشامل',
      description: 'تقرير كامل بالمشتريات والمدفوعات والمتبقي مع الدعاء بالبركة',
      icon: Receipt,
      badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200',
    },
    {
      id: 'gentle_reminder',
      label: 'تذكير ودّي ولطيف جداً',
      description: 'رسالة رقيقة ومهذبة للغاية بدون أي إحراج لتذكير الزبون بالرصيد',
      icon: HeartHandshake,
      badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/80 border-amber-200',
    },
    {
      id: 'payment_receipt',
      label: 'إشعار استلام دفعة وشكر',
      description: 'توثيق الدفعة المستلمة برقم الإيصال وتحديث الرصيد المتبقي',
      icon: CheckCircle2,
      badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200',
    },
    {
      id: 'new_bill',
      label: 'توثيق بون ومشتريات جديدة',
      description: 'إشعار بالبون الجديد والصنف وتاريخ الاستحقاق',
      icon: Sparkles,
      badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/80 border-blue-200',
    },
    {
      id: 'due_soon',
      label: 'تذكير قرب موعد الاستحقاق',
      description: 'إشعار لطيف باقتراب أجل السداد لتنظيم الأمور المالية',
      icon: Clock,
      badgeColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/80 border-rose-200',
    },
    {
      id: 'appreciation',
      label: 'رسالة تقدير وود ومحبة',
      description: 'رسالة شكر ووفاء لتعزيز الثقة التجارية والعلاقة الطيبة',
      icon: Gift,
      badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/80 border-purple-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-600 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>إرسال رسالة واتساب مخصصة وراقية</span>
                <span className="px-2 py-0.5 text-[10px] bg-white/20 rounded-full font-normal">
                  WhatsApp Pro
                </span>
              </h2>
              <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                <span>المستلم:</span>
                <strong className="font-bold text-white">{customer.name}</strong>
                <span className="font-mono opacity-80">({customer.phone})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container (Two columns on Desktop) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200 dark:divide-slate-800">
          {/* Left Column (5 cols): Template selection & options */}
          <div className="lg:col-span-5 p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/40">
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">
                اختر القالب وأسلوب الرسالة (دلال وعبارات راقية):
              </label>
              <div className="space-y-2">
                {templatesList.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleTemplateSelect(tmpl.id)}
                      className={`w-full text-start p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl border shrink-0 mt-0.5 ${tmpl.badgeColor}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {tmpl.label}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Customization Switches */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                خيارات التقرير والتفاصيل:
              </span>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>تضمين قائمة تفاصيل البونات الفردية</span>
                <input
                  type="checkbox"
                  checked={includeItemizedDebts}
                  onChange={(e) => {
                    setIncludeItemizedDebts(e.target.checked);
                    setIsEditingManually(false);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>تضمين اسم المتجر ورقم الهاتف في التذييل</span>
                <input
                  type="checkbox"
                  checked={includeContactInfo}
                  onChange={(e) => {
                    setIncludeContactInfo(e.target.checked);
                    setIsEditingManually(false);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>
            </div>

            {/* Customer Snapshot */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                  الرصيد المتبقي حالياً:
                </span>
                <span className="text-sm font-black text-emerald-950 dark:text-emerald-200 font-mono">
                  {formatCurrency(totalLya, config.currency, config.language)}
                </span>
              </div>
              <div className="text-end">
                <span className="text-[10px] text-slate-500 block">عدد البونات:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {unpaidDebts.length} بون
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Live WhatsApp Chat Bubble Preview & Editor */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-100 dark:bg-slate-900/90">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>معاينة حية كما ستصل في تطبيق WhatsApp:</span>
                </span>

                <div className="flex items-center gap-1">
                  {isEditingManually ? (
                    <button
                      onClick={() => {
                        setIsEditingManually(false);
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                      title="إعادة ضبط النص من القالب الأصلي"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>استعادة القالب</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCustomText(generatedMessage);
                        setIsEditingManually(true);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل يدوي</span>
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Chat Container */}
              <div className="relative rounded-2xl p-3 sm:p-4 bg-[#efeae2] dark:bg-[#0b141a] border border-slate-300 dark:border-slate-800 shadow-inner overflow-hidden min-h-[300px] flex flex-col justify-start">
                {/* Background WhatsApp Doodle pattern subtle overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Chat Bubble */}
                <div className="relative z-10 self-end max-w-[95%] sm:max-w-[90%] bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-xs p-3.5 shadow-md border border-[#c3eab9] dark:border-[#026b57]">
                  {isEditingManually ? (
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={12}
                      className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none resize-none font-sans leading-relaxed text-slate-900 dark:text-slate-100"
                      placeholder="اكتب رسالتك هنا..."
                    />
                  ) : (
                    <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans select-text">
                      {generatedMessage}
                    </div>
                  )}

                  {/* WhatsApp status info footer inside bubble */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-emerald-200/70 mt-2 font-mono">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#53bdeb] font-black">✓✓</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                <span>
                  عدد الأحرف: {currentMessageText.length} | الكلمات:{' '}
                  {currentMessageText.trim().split(/\s+/).filter(Boolean).length}
                </span>
                <span>النص منسق وجاهز مع الخط العريض والمائل لواتساب</span>
              </div>
            </div>

            {/* Bottom Actions Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>نسخ النص فقط</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  إغلاق
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4 fill-current" />
                  <span>فتح وإرسال عبر WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
