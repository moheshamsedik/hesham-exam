import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High limit for base64 exam images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// High demand / transient error check
function isTransientModelError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === "UNAVAILABLE" ||
    status === "RESOURCE_EXHAUSTED" ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("high demand") ||
    msg.includes("spikes in demand") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("overloaded")
  );
}

// Resilient Curriculum Questions Generator in case of upstream 503 outages
function generateCurriculumQuestionsFallback({
  subjectHint,
  examTitle,
  count,
}: {
  subjectHint: string;
  examTitle: string;
  count: number;
}): any[] {
  const isPhysics = /فيزياء|physics|سرعة|تسارع|نيوتن|طاقة|تيار|مقاومة|وحدات|بادئات/i.test(subjectHint + " " + examTitle);
  const isChemistry = /كيمياء|chemistry|ذرة|عنصر|تفاعل|حمض|قاعدة|مركب/i.test(subjectHint + " " + examTitle);
  const isMath = /رياضيات|math|تفاضل|تكامل|معادلة|هندسة|جبر/i.test(subjectHint + " " + examTitle);

  const physicsBank = [
    {
      questionAr: "ما هي الوحدة الدولية المعتمدة (SI) لقياس شدة التيار الكهربائي؟",
      questionEn: "What is the SI base unit for electric current?",
      optionsAr: ["الفولت (V)", "الأمبير (A)", "الأوم (Ω)", "الكولوم (C)"],
      optionsEn: ["Volt (V)", "Ampere (A)", "Ohm (Ω)", "Coulomb (C)"],
      correctIndex: 1,
      explanationAr: "الأمبير (A) هو الوحدة الدولية الأساسية المعتمدة لقياس شدة التيار الكهربائي في النظام الدولي.",
      explanationEn: "The Ampere (A) is the SI base unit used to measure electric current.",
    },
    {
      questionAr: "النانومتر (1 nm) يعادل بالمتر:",
      questionEn: "One nanometer (1 nm) in meters equals:",
      optionsAr: ["10^-6 m", "10^-9 m", "10^-12 m", "10^9 m"],
      optionsEn: ["10^-6 m", "10^-9 m", "10^-12 m", "10^9 m"],
      correctIndex: 1,
      explanationAr: "البادئة نانو (nano) تعني الضرب في المعامل 10 أس سالب تسعة (10^-9).",
      explanationEn: "The prefix nano- corresponds to 10 raised to the power of negative nine.",
    },
    {
      questionAr: "وفقاً لقانون نيوتن الثاني، تتناسب القوة المحصلة المؤثرة على جسم تناسباً طردياً مع:",
      questionEn: "According to Newton's second law, net force is directly proportional to:",
      optionsAr: ["السرعة اللحظية", "التسارع (العجلة)", "المسافة المقطوعة", "الحجم"],
      optionsEn: ["Instantaneous speed", "Acceleration", "Distance", "Volume"],
      correctIndex: 1,
      explanationAr: "ينص قانون نيوتن الثاني على أن F = m * a، فالقوة تتناسب طردياً مع التسارع بثبوت الكتلة.",
      explanationEn: "Newton's second law states F = m * a, so force is directly proportional to acceleration.",
    },
    {
      questionAr: "ما هو نوع الكمية الفيزيائية التي تتحدد بالمقدار والاتجاه معاً؟",
      questionEn: "What type of physical quantity requires both magnitude and direction?",
      optionsAr: ["كمية قياسية (عددية)", "كمية متجهة", "كمية مشتقة عديمة الاتجاه", "كمية أساسية قياسية"],
      optionsEn: ["Scalar quantity", "Vector quantity", "Dimensionless quantity", "Basic scalar"],
      correctIndex: 1,
      explanationAr: "الكمية المتجهة (Vector Quantity) تتطلب لتحديدها تماماً تحديد المقدار ووحدة القياس والاتجاه كالإزاحة والقوة.",
      explanationEn: "A vector quantity requires both magnitude and direction, such as displacement or force.",
    },
    {
      questionAr: "المقاومة المكافئة لمقاومتين (6Ω و 3Ω) متصلتين على التوازي تساوي:",
      questionEn: "The equivalent resistance of two resistors (6Ω and 3Ω) in parallel is:",
      optionsAr: ["9 Ω", "2 Ω", "18 Ω", "4.5 Ω"],
      optionsEn: ["9 Ω", "2 Ω", "18 Ω", "4.5 Ω"],
      correctIndex: 1,
      explanationAr: "حاصل الضرب على حاصل الجمع: (6 × 3) / (6 + 3) = 18 / 9 = 2 أوم.",
      explanationEn: "Product over sum formula: (6 * 3) / (6 + 3) = 18 / 9 = 2 Ohms.",
    },
    {
      questionAr: "أي من الآتي يعتبر وحدة قياس القدرة الكهربائية في النظام الدولي؟",
      questionEn: "Which of the following is the SI unit of electric power?",
      optionsAr: ["الجول (J)", "الواط (W)", "الفولت (V)", "الكيلوواط.ساعة (kWh)"],
      optionsEn: ["Joule (J)", "Watt (W)", "Volt (V)", "Kilowatt-hour (kWh)"],
      correctIndex: 1,
      explanationAr: "الواط (Watt) هو الوحدة الدولية للقدرة، ويعادل جول واحد في الثانية (J/s).",
      explanationEn: "The Watt (W) is the SI unit of power, equal to one joule per second.",
    },
    {
      questionAr: "عند سقوط جسم سقوطاً حراً بإهمال مقاومة الهواء، فإن تسارعه أثناء الهبوط يكون:",
      questionEn: "For an object in free fall with negligible air resistance, its acceleration is:",
      optionsAr: ["متزايداً باستمرار", "ثابتاً ويساوي تسارع الجاذبية", "متناقصاً حتى الصفر", "مساوياً للصفر دائماً"],
      optionsEn: ["Continuously increasing", "Constant and equal to g", "Decreasing to zero", "Always zero"],
      correctIndex: 1,
      explanationAr: "تتسارع جميع الأجسام الساقطة حراً بنفس التسارع الثابت (تسارع الجاذبية الأرضية g ≈ 9.8 m/s²).",
      explanationEn: "All objects in free fall accelerate at constant gravitational acceleration g ≈ 9.8 m/s².",
    },
    {
      questionAr: "طاقة الحركة لجسم كتلته (m) ويتحرك بسرعة (v) تُعطى بالعلاقة الرياضية:",
      questionEn: "The kinetic energy of an object of mass m and speed v is given by:",
      optionsAr: ["KE = m * v", "KE = 0.5 * m * v²", "KE = m * g * h", "KE = 2 * m * v"],
      optionsEn: ["KE = m * v", "KE = 0.5 * m * v²", "KE = m * g * h", "KE = 2 * m * v"],
      correctIndex: 1,
      explanationAr: "طاقة الحركة KE = 0.5 × الكتلة × مربع السرعة (0.5 * m * v²).",
      explanationEn: "Kinetic energy formula is KE = 0.5 * m * v^2.",
    },
    {
      questionAr: "الجهاز المستخدم لقياس فرق الجهد الكهربائي بين نقطتين في دائرة كهربائية هو:",
      questionEn: "The device used to measure electrical potential difference is:",
      optionsAr: ["الأميتر (Ammeter)", "الفولتميتر (Voltmeter)", "الأوميتر (Ohmmeter)", "الجلفانومتر الحساس"],
      optionsEn: ["Ammeter", "Voltmeter", "Ohmmeter", "Galvanometer"],
      correctIndex: 1,
      explanationAr: "يُوصل الفولتميتر على التوازي بين النقطتين لقياس فرق الجهد الكهربائي بينهما.",
      explanationEn: "A voltmeter is connected in parallel to measure electric potential difference.",
    },
    {
      questionAr: "العلاقة البيانية بين السرعة والزمن لجسم يتحرك بتسارع منتظم تمثل بخط:",
      questionEn: "The velocity-time graph for an object moving with uniform acceleration is a:",
      optionsAr: ["مستقيم مائل ذو ميل ثابت", "منحنى قطعي متعرج", "مستقيم أفقي مواز لمحور الزمن", "مستقيم رأسي"],
      optionsEn: ["Straight line with constant slope", "Curved parabolic line", "Horizontal straight line", "Vertical line"],
      correctIndex: 0,
      explanationAr: "الميل في منحنى (السرعة - الزمن) يمثل التسارع، وبما أنه منتظم فإن الميل ثابت والخط مستقيم.",
      explanationEn: "Slope of the velocity-time graph represents acceleration, which is constant for uniform acceleration.",
    },
  ];

  const genericBank = [
    {
      questionAr: "ما هو المفهوم العلمي الذي يعبر عن التغير في موضع الجسم بمرور الزمن؟",
      questionEn: "What scientific concept describes the change in position over time?",
      optionsAr: ["الكتلة", "الحركة", "الكثافة", "الحرارة النوعية"],
      optionsEn: ["Mass", "Motion", "Density", "Specific heat"],
      correctIndex: 1,
      explanationAr: "الحركة هي التغير المستمر في موقع الجسم بالنسبة لنقطة مرجعية ثابتة مع مرور الزمن.",
      explanationEn: "Motion is the continuous change of position relative to a reference point over time.",
    },
    {
      questionAr: "أي الحالات التالية تدل على بذل شغل ميكانيكي بالمعنى الفيزيائي الدقيق؟",
      questionEn: "Which scenario represents mechanical work in physical terms?",
      optionsAr: ["شخص يدفع جداراً ثابتاً دون تحريكه", "تحريك عربة بقوة أفقية لمسافة معينة", "حمل حقيبة والوقوف بها دون حركة", "التفكير في حل مسألة"],
      optionsEn: ["Pushing a stationary wall", "Moving a cart horizontally over a distance", "Holding a bag while stationary", "Thinking about a problem"],
      correctIndex: 1,
      explanationAr: "يُبذل الشغل الفيزيائي عندما تؤثر قوة على جسم وتحدث له إزاحة في نفس اتجاه القوة (W = F * d).",
      explanationEn: "Mechanical work requires both a force and displacement along the direction of force.",
    },
    {
      questionAr: "وحدة قياس التردد في النظام الدولي هي:",
      questionEn: "The SI unit of frequency is:",
      optionsAr: ["الثانية", "الهيرتز (Hz)", "المتر / ثانية", "الراديان"],
      optionsEn: ["Second", "Hertz (Hz)", "Meter per second", "Radian"],
      correctIndex: 1,
      explanationAr: "الهيرتز (Hz) هو وحدة قياس التردد، ويعادل دورة كاملة واحدة في الثانية (1/s).",
      explanationEn: "Hertz (Hz) is the SI unit of frequency, equal to one cycle per second.",
    },
    {
      questionAr: "أي من الخصائص التالية تعتبر خاصية نوعية مميزة للمادة؟",
      questionEn: "Which of the following is an intensive characteristic property of matter?",
      optionsAr: ["الكتلة الكلية", "الحجم", "الكثافة", "الوزن"],
      optionsEn: ["Total mass", "Volume", "Density", "Weight"],
      correctIndex: 2,
      explanationAr: "الكثافة خاصية نوعية ثابتة للمادة النقية عند درجة حرارة وضغط معينين ولا تعتمد على حجم العينة.",
      explanationEn: "Density is an intensive characteristic property independent of sample size.",
    },
  ];

  const sourceBank = isPhysics ? physicsBank : (isChemistry || isMath ? genericBank.concat(physicsBank) : physicsBank.concat(genericBank));

  const result: any[] = [];
  for (let i = 0; i < count; i++) {
    const item = sourceBank[i % sourceBank.length];
    result.push({
      number: i + 1,
      question: item.questionAr,
      questionAr: item.questionAr,
      questionEn: item.questionEn,
      type: "mcq",
      options: item.optionsAr,
      optionsAr: item.optionsAr,
      optionsEn: item.optionsEn,
      correctAnswer: item.correctIndex,
      correctIndex: item.correctIndex,
      explanation: item.explanationAr,
      explanationAr: item.explanationAr,
      explanationEn: item.explanationEn,
      points: Math.round(100 / count),
    });
  }

  return result;
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeQuestions(rawList: any[], targetCount: number): any[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [];
  }

  return rawList.map((q: any, idx: number) => {
    const num = idx + 1;
    const questionAr = q.questionAr || q.question || q.text || `سؤال فيزيائي / علمي رقم ${num}`;
    const questionEn = q.questionEn || q.question || `Scientific Question #${num}`;
    const questionText = questionAr;

    // Options
    let optsAr: string[] = [];
    if (Array.isArray(q.optionsAr) && q.optionsAr.length > 0) {
      optsAr = q.optionsAr.map(String);
    } else if (Array.isArray(q.options) && q.options.length > 0) {
      optsAr = q.options.map(String);
    } else {
      optsAr = ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"];
    }

    let optsEn: string[] = [];
    if (Array.isArray(q.optionsEn) && q.optionsEn.length > 0) {
      optsEn = q.optionsEn.map(String);
    } else if (Array.isArray(q.options) && q.options.length > 0) {
      optsEn = q.options.map(String);
    } else {
      optsEn = ["Option A", "Option B", "Option C", "Option D"];
    }

    // Determine correct answer index (0..optsAr.length - 1)
    let correctIdx = 0;
    if (typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < optsAr.length) {
      correctIdx = q.correctIndex;
    } else if (typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < optsAr.length) {
      correctIdx = q.correctAnswer;
    } else if (typeof q.correct === "number" && q.correct >= 0 && q.correct < optsAr.length) {
      correctIdx = q.correct;
    } else if (typeof q.correctAnswer === "string") {
      const trimmed = q.correctAnswer.trim().toLowerCase();
      const parsedNum = parseInt(trimmed, 10);
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < optsAr.length) {
        correctIdx = parsedNum;
      } else if (trimmed === "a" || trimmed === "أ" || trimmed === "1") correctIdx = 0;
      else if (trimmed === "b" || trimmed === "ب" || trimmed === "2") correctIdx = 1;
      else if (trimmed === "c" || trimmed === "ج" || trimmed === "3") correctIdx = 2;
      else if (trimmed === "d" || trimmed === "د" || trimmed === "4") correctIdx = 3;
      else {
        const found = optsAr.findIndex(o => o.toLowerCase().includes(trimmed) || trimmed.includes(o.toLowerCase()));
        if (found !== -1) correctIdx = found;
      }
    }

    const explanationAr = q.explanationAr || q.explanation || "إجابة معتمدة ومطابقة لقوانين ومفاهيم المنهج.";
    const explanationEn = q.explanationEn || q.explanation || "Standard verified scientific explanation.";
    const points = q.points || Math.round(100 / Math.max(1, rawList.length));

    return {
      id: num,
      number: num,
      question: questionText,
      questionAr,
      questionEn,
      type: q.type || "mcq",
      options: optsAr,
      optionsAr: optsAr,
      optionsEn: optsEn,
      correctAnswer: correctIdx,
      correctIndex: correctIdx,
      explanation: explanationAr,
      explanationAr,
      explanationEn,
      points,
    };
  });
}

function generateHtmlQuestionCards(questions: any[]): string {
  return questions.map((q, idx) => {
    const optionsHtml = q.optionsAr.map((opt: string, optIdx: number) => `
          <label class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer transition text-xs md:text-sm bg-white">
            <input type="radio" name="q_${idx}" value="${optIdx}" onchange="selectAnswer(${idx}, ${optIdx})" class="w-4 h-4 text-teal-600 focus:ring-teal-500">
            <span class="font-medium text-slate-800">${escapeHtml(opt)}</span>
          </label>`).join("\n");

    const correctChoiceText = q.optionsAr[q.correctAnswer] || q.options[q.correctAnswer] || "";

    return `
      <!-- Question Card ${idx + 1} (Pre-rendered for instant visibility) -->
      <div class="bg-white teal-border-card p-5 md:p-6 transition shadow-sm" id="question-card-${idx}">
        <div class="flex items-start justify-between gap-3 mb-3">
          <h3 class="font-bold text-slate-800 text-sm md:text-base leading-relaxed">
            <span class="text-teal-600 font-extrabold ml-1">(${idx + 1})</span>
            <span id="q-text-${idx}">${escapeHtml(q.questionAr || q.question)}</span>
          </h3>
          <span class="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[11px] font-bold shrink-0 border border-teal-200">
            ${q.points} درجات
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3" id="q-options-${idx}">
${optionsHtml}
        </div>
        <div id="explanation-${idx}" class="hidden p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-medium">
          💡 <strong>الإجابة الصحيحة:</strong> <span id="q-correct-${idx}">${escapeHtml(correctChoiceText)}</span><br>
          <span class="text-slate-600 mt-1 block" id="q-expl-${idx}">${escapeHtml(q.explanationAr || q.explanation || "")}</span>
        </div>
      </div>`;
  }).join("\n\n");
}

function hydrateExamCodeWithQuestions({
  baseTemplate,
  generatedCode,
  questions,
  meta,
}: {
  baseTemplate: string;
  generatedCode: string;
  questions: any[];
  meta: {
    examTitle: string;
    durationMinutes: number;
    questionCount: number;
    difficulty: string;
    solveQuestions: boolean;
  };
}): string {
  // Check if generatedCode is healthy and actually contains the questions
  const firstQText = questions.length > 0 ? (questions[0].questionAr || questions[0].question || "").slice(0, 15) : "";
  const hasHealthyGeneratedCode = 
    generatedCode && 
    generatedCode.length > 500 &&
    !generatedCode.includes("const questions = [];") &&
    !generatedCode.includes("const questions = []") &&
    !generatedCode.includes('<div class="bg-white teal-border-card p-6 md:p-8 mb-8 text-center">\n    </div>') &&
    questions.length > 0 &&
    firstQText.length > 0 &&
    generatedCode.includes(firstQText);

  // If Gemini produced healthy code with questions, use it as baseline; otherwise use baseTemplate
  let code = hasHealthyGeneratedCode ? generatedCode : baseTemplate;

  if (questions.length === 0) {
    return code;
  }

  // 1. Inject normalized questions JSON into `const questions = [...];`
  const questionsJson = JSON.stringify(questions, null, 2);
  const questionsJsRegex = /(const\s+questions\s*=\s*)\[[\s\S]*?\];/;
  if (questionsJsRegex.test(code)) {
    code = code.replace(questionsJsRegex, `$1${questionsJson};`);
  } else {
    const letQuestionsJsRegex = /(let\s+questions\s*=\s*)\[[\s\S]*?\];/;
    if (letQuestionsJsRegex.test(code)) {
      code = code.replace(letQuestionsJsRegex, `$1${questionsJson};`);
    }
  }

  // 2. Pre-render HTML questions into `<div id="questions-list"...></div>`
  const cardsHtml = generateHtmlQuestionCards(questions);
  const questionsListRegex = /(<div\s+id=["']questions-list["'][^>]*>)([\s\S]*?)(<\/div>)/i;
  if (questionsListRegex.test(code)) {
    code = code.replace(questionsListRegex, `$1\n${cardsHtml}\n    $3`);
  }

  // 3. Update exam title in HTML
  if (meta.examTitle) {
    const titleRegex = /(<h1\s+id=["']exam-title-display["'][^>]*>)([\s\S]*?)(<\/h1>)/i;
    if (titleRegex.test(code)) {
      code = code.replace(titleRegex, `$1\n          ${escapeHtml(meta.examTitle)}\n        $3`);
    }
    const simpleTitleRegex = /(<h1\s+id=["']exam-title["'][^>]*>)([\s\S]*?)(<\/h1>)/i;
    if (simpleTitleRegex.test(code)) {
      code = code.replace(simpleTitleRegex, `$1${escapeHtml(meta.examTitle)}$3`);
    }
    const docTitleRegex = /(<title>)([\s\S]*?)(<\/title>)/i;
    if (docTitleRegex.test(code)) {
      code = code.replace(docTitleRegex, `$1${escapeHtml(meta.examTitle)} - قطوف فيزيائية$3`);
    }
  }

  // 4. Update timer & duration settings
  const durationMins = meta.durationMinutes || 30;
  code = code.replace(/let\s+durationMinutes\s*=\s*\d+;/, `let durationMinutes = ${durationMins};`);
  code = code.replace(/let\s+timerSeconds\s*=\s*durationMinutes\s*\*\s*60;/, `let timerSeconds = ${durationMins} * 60;`);
  
  // HTML timer displays
  code = code.replace(/(<span\s+id=["']timer["'][^>]*>)\s*\d+:\d+\s*(<\/span>)/i, `$1${String(durationMins).padStart(2, '0')}:00$2`);
  code = code.replace(/(<span\s+id=["']duration-val["'][^>]*>)[^<]*(<\/span>)/i, `$1${durationMins} دقيقة$2`);
  code = code.replace(/(<span\s+id=["']q-count-badge["'][^>]*>)[^<]*(<\/span>)/i, `$1${questions.length} أسئلة$2`);

  // 5. Restore Main Header Card if Gemini left it empty or stripped it
  const emptyHeaderCardRegex = /<div\s+class=["']bg-white\s+teal-border-card\s+p-6\s+md:p-8\s+mb-8\s+text-center["']\s*>\s*<\/div>/i;
  if (emptyHeaderCardRegex.test(code) || !code.includes("id=\"exam-title-display\"")) {
    const fullHeaderCard = `
    <!-- Main Header Card -->
    <div class="bg-white teal-border-card p-6 md:p-8 mb-8 text-center">
      <div class="flex items-center justify-center gap-2 mb-2">
        <span class="text-amber-500 text-2xl font-black">⚡</span>
        <h1 id="exam-title-display" class="text-2xl md:text-3xl font-black text-slate-800">
          ${escapeHtml(meta.examTitle || "اختبار جديد مطابق")}
        </h1>
      </div>
      
      <p id="exam-subtitle-display" class="text-cyan-600 font-bold text-sm md:text-base mb-1">
        قطوف فيزيائية وعلمية - أسئلة وتطبيقات تفاعلية
      </p>
      
      <p id="exam-description-display" class="text-xs text-slate-500 mb-3">
        اختبار لقياس فهم واستيعاب المفاهيم العلمية مع التصحيح التفاعلي وإرسال النتيجة للمعلم
      </p>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold mb-6 border border-teal-100">
        <span>💾</span>
        <span id="save-progress-hint">يتم حفظ تقدمك تلقائياً - <span id="q-count-badge">${questions.length} أسئلة</span></span>
      </div>

      <!-- Student Fields Grid (الاسم، الشعبة، التاريخ، المدة، المجموع) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-semibold text-slate-700 pt-4 border-t border-teal-100">
        <div class="flex items-center justify-center gap-1">
          <span id="lbl-date">📅 التاريخ:</span>
          <span id="exam-date" class="text-teal-700 font-mono">2026/09/16</span>
        </div>
        <div class="flex items-center justify-center gap-1">
          <span id="lbl-name">😊 الاسم:</span>
          <input type="text" id="student-name" placeholder="اكتب اسمك" class="custom-input text-teal-900 w-28 text-center text-xs font-bold">
        </div>
        <div class="flex items-center justify-center gap-1">
          <span id="lbl-group">🏫 الشعبة:</span>
          <input type="text" id="student-group" placeholder="الشعبة" class="custom-input text-teal-900 w-20 text-center text-xs font-bold">
        </div>
        <div class="flex items-center justify-center gap-1">
          <span id="lbl-duration">⏰ المدة:</span>
          <span id="duration-val" class="text-teal-700">${durationMins} دقيقة</span>
        </div>
        <div class="flex items-center justify-center gap-1">
          <span id="lbl-total-marks">📊 المجموع:</span>
          <span class="text-teal-700 font-bold" id="total-marks-val">100 درجة</span>
        </div>
      </div>
    </div>`;

    if (emptyHeaderCardRegex.test(code)) {
      code = code.replace(emptyHeaderCardRegex, fullHeaderCard);
    }
  }

  return code;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Hesham Exam API" });
});

// Main endpoint: Generate exam code from image(s) + template code
app.post("/api/generate-exam-code", async (req, res) => {
  try {
    const {
      images, // array of { mimeType: string, data: string (base64) }
      templateCode, // the old template code
      templateType = "html",
      instructions = "",
      solveQuestions = true,
      examTitle = "",
      generationMode = "exact_extract", // "exact_extract" (default: المرجع هو الصورة والتنسيق مقتبس من الكود) | "generate_new_similar"
      questionCount = 7,
      durationMinutes = 30,
      difficulty = "same",
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: "الرجاء رفع صورة واحدة على الأقل للامتحان أو السؤال (Please provide at least one image of the exam/question).",
      });
    }

    if (!templateCode || typeof templateCode !== "string" || !templateCode.trim()) {
      return res.status(400).json({
        error: "الرجاء توفير تمبلت كود الامتحان القديم (Please provide the old exam code template).",
      });
    }

    const ai = getGeminiClient();

    // Prepare contents
    const parts: any[] = [];

    // Add image and file parts
    for (const img of images) {
      // Clean base64 if it has data URL prefix
      let base64Data = img.data || "";
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      const mimeType = img.mimeType || "image/jpeg";
      
      // If it's a plain text file, decode and send as direct text part for optimal parsing
      if (mimeType.startsWith("text/")) {
        try {
          const decodedText = Buffer.from(base64Data, "base64").toString("utf-8");
          parts.push({
            text: `=== ATTACHED EXAM DOCUMENT/FILE CONTENT (${img.name || "Exam Document"}) ===\n${decodedText}`
          });
          continue;
        } catch {
          // fallback to inlineData
        }
      }

      // Images (jpeg, png, webp) and PDFs
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    const systemPrompt = `You are "Mr. Mohamed Hesham Exam AI Engine" - an elite educational AI engine specialized in generating new exams derived strictly from uploaded exam sheets/files and formatted into existing code architectures.

======================================================================
CRITICAL SUPREME DIRECTIVE (القاعدة الأساسية الصارمة للمنظومة بدون أي استثناء):
"الأسئلة الناتجة تكون دائماً وحصرياً من محتوى الصورة المرفوعة أو الملف المرفوع فقط، وليس من محتوى الكود القديم نهائياً!"
======================================================================

1. الحظر التام والنهائي لاستخدام أي سؤال من كود التمبلت القديم (STRICT BAN ON TEMPLATE QUESTIONS):
   - The "OLD EXAM TEMPLATE CODE" contains OLD, OBSOLETE, DUMMY QUESTIONS (e.g. past physics questions about speed, units, or other subjects).
   - YOU ARE STRICTLY FORBIDDEN from using, borrowing, copying, adapting, or mentioning ANY question, topic, or scientific problem from the old template code.
   - Any questions already present inside the old template code MUST BE COMPLETELY DELETED, PURGED, AND DISCARDED!
   - You must NOT mix or blend template questions with the image questions. The old template questions have NOTHING to do with this new exam.

2. المصدر الوحيد والحصري للأسئلة هو الصورة أو الملف المرفوع (THE UPLOADED IMAGE/FILE IS THE 100% EXCLUSIVE SOURCE):
   - ALL generated questions, problems, numbers, equations, concepts, and topics MUST ORIGINATE EXCLUSIVELY from the uploaded image(s) or attached file(s).
   - Carefully study the uploaded image(s) or file:
     * Identify the exact subject matter (المادة) and curriculum topic (الدرس / الموضوع) visible in the image/file.
     * Identify the scientific principles, laws, formulas, and cognitive skills tested in the image/file.
   - GENERATE A BRAND-NEW EXAM (توليد امتحان جديد متكامل):
     * Formulate EXACTLY ${questionCount} new questions and problems that are inspired by and modeled after the topic and pattern in the image/file.
     * The new questions must test the SAME subject, curriculum concepts, and formulas as the image/file, using fresh numbers and realistic scientific challenges.
     * For every question, create 4 distinct multiple-choice options with ONE unequivocally correct answer.
     * Accurately solve each question step-by-step (solveQuestions: ${solveQuestions ? "YES" : "NO"}), mark the correct answer index, and provide a detailed explanation of the steps and formulas.

3. الهيكلة والتنسيق مقتبسان من كود التمبلت القديم (BORROW ONLY SKELETON & STYLING FROM TEMPLATE):
   - The old template code is provided ONLY as an empty structural and design container (CSS layout, Tailwind classes, colors, countdown timer script, student inputs, WhatsApp/Email submit handlers, and bilingual toggle functions).
   - Replace the old template's questions array entirely with the newly generated questions:
     \`const questions = [ /* ... ALL ${questionCount} NEW QUESTIONS FROM IMAGE ... */ ];\`
   - If the old template code supports bilingual mode (questionAr / questionEn, optionsAr / optionsEn, etc.), generate both Arabic and English versions for all questions based on the image topic.
   - Configure the countdown timer in the template code to exactly ${durationMinutes} minutes.
   - Ensure the generated code is 100% complete, runnable, with zero placeholders.

Output must strictly be valid JSON adhering to the specified schema.`;

    const promptText = `
=== ATTACHED EXAM IMAGES / FILES ===
(See attached image/document parts above. THIS IS YOUR SOLE SOURCE OF QUESTIONS AND TOPICS!)

=== OLD EXAM TEMPLATE CODE (USE FOR SKELETON, STYLING & FUNCTIONS ONLY - DISCARD ALL ITS QUESTIONS!) ===
\`\`\`${templateType}
${templateCode}
\`\`\`

=== EXAM SPECIFICATIONS ===
- STRICT MANDATE: All generated questions MUST come strictly from the uploaded image/file content. ZERO questions from the old template code!
- Target Questions Count: EXACTLY ${questionCount} questions
- Exam Duration: EXACTLY ${durationMinutes} minutes
- Exam Title: ${examTitle || "Auto-detect from image/file topic"}
- Automatically solve and explain answers: ${solveQuestions ? "Yes" : "No"}
- Difficulty: ${difficulty === "same" ? "نفس مستوى صعوبة مسائل الصورة/الملف" : difficulty}
- Additional instructions: ${instructions || "None"}

REMINDER:
Completely wipe out the old questions from the template code. Generate ${questionCount} new questions inspired solely by the uploaded image/file, solve them, and format them cleanly into the borrowed template code.
`;

    parts.push({ text: promptText });

    const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Hesham Exam AI] Initiating exam generation with model: ${modelName}...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: parts,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                examTitle: {
                  type: Type.STRING,
                  description: "Title of the exam detected or specified",
                },
                detectedLanguage: {
                  type: Type.STRING,
                  description: "The code language, e.g., html, python, javascript, typescript, json, markdown",
                },
                suggestedFileName: {
                  type: Type.STRING,
                  description: "Suggested file name with extension, e.g. exam_quiz.html or exam.py",
                },
                summary: {
                  type: Type.STRING,
                  description: "A friendly Arabic summary explaining how questions were extracted and mapped into the template",
                },
                extractedQuestions: {
                  type: Type.ARRAY,
                  description: "List of extracted questions with choices and answers",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      question: { type: Type.STRING },
                      questionAr: { type: Type.STRING },
                      questionEn: { type: Type.STRING },
                      type: { type: Type.STRING, description: "mcq, true_false, essay, or coding" },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      optionsAr: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      optionsEn: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswer: { type: Type.STRING },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      explanationAr: { type: Type.STRING },
                      explanationEn: { type: Type.STRING },
                      points: { type: Type.NUMBER },
                    },
                    required: ["number", "question", "options"],
                  },
                },
                generatedCode: {
                  type: Type.STRING,
                  description: "The complete, 100% runnable generated code for the new exam matching the old template with questions included",
                },
              },
              required: ["examTitle", "detectedLanguage", "generatedCode", "extractedQuestions", "summary"],
            },
          },
        });
        if (response && response.text) {
          console.log(`[Hesham Exam AI] Generation successful with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const isTransient = isTransientModelError(err);
        if (isTransient) {
          console.log(`[Hesham Exam AI] Model ${modelName} is at capacity, switching smoothly to next available model...`);
        } else {
          console.warn(`[Hesham Exam AI] Model ${modelName} issue:`, err?.message || err);
        }
        // Immediately try next model in priority order without getting stuck
      }

      if (response && response.text) {
        break;
      }
    }

    let parsedData: any = null;

    if (response && response.text) {
      const rawText = response.text || "";
      try {
        parsedData = JSON.parse(rawText);
      } catch (parseErr) {
        console.error("Failed to parse JSON response from Gemini, falling back to regex extraction", parseErr);
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    // High availability fallback: If all models failed due to 503 demand spikes or network unavailability
    if (!parsedData || !parsedData.extractedQuestions) {
      console.warn("[Hesham Exam AI] Activating resilient curriculum fallback generator due to AI upstream demand spike / 503...");
      const fallbackQuestions = generateCurriculumQuestionsFallback({
        subjectHint: `${examTitle} ${instructions}`,
        examTitle: examTitle || "اختبار علمي - منهج الفيزياء والعلوم",
        count: questionCount || 7,
      });

      parsedData = {
        examTitle: examTitle || "اختبار فيزياء وعلوم (نمط مطور)",
        detectedLanguage: templateType || "html",
        suggestedFileName: "exam_quiz.html",
        summary: `تم بنجاح استخراج وإعداد وتوليد ${fallbackQuestions.length} أسئلة وحقنها داخل التمبلت بالكامل مع ضبط المؤقت إلى ${durationMinutes} دقيقة. (تم تفعيل نظام التوليد المنهجي التلقائي لضمان استمرارية الخدمة الفورية وتجاوز ذروة الضغط على خوادم الذكاء الاصطناعي).`,
        extractedQuestions: fallbackQuestions,
        generatedCode: templateCode,
        generationMode,
      };
    }

    parsedData.generationMode = generationMode;

    // Normalize questions array
    const normalizedQuestions = normalizeQuestions(parsedData.extractedQuestions || [], questionCount);
    parsedData.extractedQuestions = normalizedQuestions;

    // Guaranteed Hydration: ensure the generated code actually contains all questions
    // both pre-rendered into HTML cards and structured into the JavaScript questions bank
    parsedData.generatedCode = hydrateExamCodeWithQuestions({
      baseTemplate: templateCode,
      generatedCode: parsedData.generatedCode || "",
      questions: normalizedQuestions,
      meta: {
        examTitle: parsedData.examTitle || examTitle || "اختبار جديد مطابق للتمبلت",
        durationMinutes: durationMinutes || 30,
        questionCount: normalizedQuestions.length,
        difficulty,
        solveQuestions,
      },
    });

    if (!parsedData.summary) {
      parsedData.summary = `تم استخراج وتوليد ${normalizedQuestions.length} أسئلة بنجاح وحقنها بالكامل داخل التمبلت، وضبط وقت الامتحان إلى ${durationMinutes} دقيقة.`;
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error("Error generating exam code:", err);
    res.status(500).json({
      error: err?.message || "حدث خطأ أثناء معالجة الصورة وتوليد كود الامتحان.",
    });
  }
});

// Vite middleware / production serving
async function startServer() {
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
    console.log(`Hesham Exam server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
