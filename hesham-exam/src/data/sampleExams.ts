// Realistic sample exam images rendered into high-quality base64 for instant testing
export interface SampleExam {
  id: string;
  title: string;
  subject: string;
  description: string;
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}

// Function to generate an exam paper SVG and return base64
function createExamSvg(title: string, code: string, questions: string[]): string {
  const qListSvg = questions.map((q, idx) => `
    <g transform="translate(40, ${180 + idx * 110})">
      <rect x="0" y="0" width="720" height="95" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <circle cx="30" cy="30" r="14" fill="#4f46e5" />
      <text x="30" y="35" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${idx + 1}</text>
      <text x="55" y="35" fill="#1e293b" font-family="sans-serif" font-size="15" font-weight="600" direction="rtl">${q.split('||')[0]}</text>
      <text x="55" y="65" fill="#475569" font-family="sans-serif" font-size="13" direction="rtl">${q.split('||')[1] || ''}</text>
    </g>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="700" viewBox="0 0 800 700">
    <rect width="800" height="700" fill="#f8fafc"/>
    <rect x="20" y="20" width="760" height="660" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    
    <!-- Header banner -->
    <rect x="20" y="20" width="760" height="110" rx="12" fill="#1e1b4b"/>
    <text x="400" y="60" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">${title}</text>
    <text x="400" y="90" fill="#a5b4fc" font-family="sans-serif" font-size="14" text-anchor="middle">امتحان نهائي للفصل الدراسي الأول - المادة: ${code}</text>
    <line x1="40" y1="145" x2="760" y2="145" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4"/>

    <text x="760" y="165" fill="#64748b" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="end">تعليمات: اختر الإجابة الصحيحة من بين الخيارات المتاحة</text>

    ${qListSvg}

    <!-- Footer stamp -->
    <rect x="40" y="620" width="720" height="40" rx="6" fill="#f1f5f9"/>
    <text x="400" y="645" fill="#64748b" font-family="sans-serif" font-size="12" text-anchor="middle">Hesham Exam Smart OCR Evaluation Sheet - صفحة 1 من 1</text>
  </svg>`;

  // Convert to utf-8 base64
  return btoa(unescape(encodeURIComponent(svg)));
}

export const SAMPLE_EXAMS: SampleExam[] = [
  {
    id: "cs-exam-sample",
    title: "امتحان علوم الحاسب والذكاء الاصطناعي",
    subject: "Computer Science & AI (CS302)",
    description: "ورقة امتحان تحتوي على 4 أسئلة اختيار من متعدد في خوارزميات الذكاء الاصطناعي وبايثون.",
    mimeType: "image/svg+xml",
    data: createExamSvg(
      "امتحان علوم الحاسب والذكاء الاصطناعي (CS302)",
      "CS302 - Algorithms & AI",
      [
        "ما هو مفهوم التعلم الخاضع للإشراف (Supervised Learning)؟||أ) التدريب بدون بيانات مصنفة  ب) التدريب باستخدام بيانات مصنفة مسبقاً  ج) التفاعل مع البيئة للمكافأة  د) تجميع البيانات المتشابهة",
        "أي من المكتبات التالية تعتبر حجر الأساس للعمليات الحسابية المصفوفية في Python؟||أ) Django  ب) Beautiful Soup  ج) NumPy  د) Flask",
        "ما هي الخوارزمية المستخدمة للبحث عن أقصر مسار في الرسوم البيانية الموزونة؟||أ) Dijkstra Algorithm  ب) Linear Search  ج) Bubble Sort  د) Quick Sort",
        "ما هو الغرض الأساسي من استخدام دوال التنشيط (Activation Functions) في الشبكات العصبية؟||أ) تقليل سرعة الحساب  ب) إدخال اللاخطية (Non-linearity)  ج) حفظ الملفات  د) الاتصال بالإنترنت"
      ]
    ),
    previewUrl: "",
  },
  {
    id: "math-exam-sample",
    title: "امتحان الرياضيات والتفاضل والتكامل",
    subject: "Calculus & Linear Algebra (MATH101)",
    description: "أسئلة تفاضل وتكامل وجبر خطي مع خيارات متعددة ومعادلات رياضية.",
    mimeType: "image/svg+xml",
    data: createExamSvg(
      "امتحان الرياضيات والهندسة التحليلية (MATH101)",
      "MATH101 - Calculus & Algebra",
      [
        "ما هي مشتقة الدالة f(x) = x^3 + 5x بالنسبة لـ x؟||أ) 3x^2 + 5  ب) 3x + 5  ج) x^2 + 5  د) 3x^3",
        "ما هو ناتج التكامل المحدد للدالة ∫ 2x dx من 0 إلى 2؟||أ) 2  ب) 4  ج) 8  د) 16",
        "إذا كانت المصفوفة A من رتبة 2x3 والمصفوفة B من رتبة 3x2، فما رتبة حاصل الضرب A * B؟||أ) 3x3  ب) 2x2  ج) 2x3  د) غير ممكن الضرب",
        "ما هي قيمة النهاية lim (x -> 0) [sin(x) / x]؟||أ) 0  ب) 1  ج) غير معرفة  د) ∞"
      ]
    ),
    previewUrl: "",
  },
  {
    id: "medical-biology-sample",
    title: "امتحان الأحياء والعلوم الطبية",
    subject: "Biology & Human Anatomy (BIO201)",
    description: "ورقة أسئلة طبية وعلمية باللغة العربية حول وظائف الأعضاء وبيولوجيا الخلية.",
    mimeType: "image/svg+xml",
    data: createExamSvg(
      "امتحان علم الأحياء والفسيولوجيا (BIO201)",
      "BIO201 - Cell Biology",
      [
        "ما هو العُضَي المسؤول عن إنتاج جزيئات الطاقة ATP في الخلية الحيوانية؟||أ) الميتوكوندريا (Mitochondria)  ب) جهاز جولجي  ج) الريبوسومات  د) الليزوسومات",
        "أي من فصائل الدم التالية تعتبر معطي عام لجميع الفصائل الأخرى؟||أ) AB+  ب) A-  ج) O-  د) B+",
        "ما هو الهرمون المسؤول عن خفض مستوى السكر (الجلوكوز) في الدم؟||أ) الجلوكاجون  ب) الأدرينالين  ج) الإنسولين  د) الثيروكسين"
      ]
    ),
    previewUrl: "",
  }
];

// Set previewUrl for each
SAMPLE_EXAMS.forEach(exam => {
  exam.previewUrl = `data:${exam.mimeType};base64,${exam.data}`;
});
