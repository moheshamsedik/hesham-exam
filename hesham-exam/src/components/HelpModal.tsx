import React from "react";
import { HelpCircle, X, Camera, Code2, Play, CheckCircle2, Sparkles } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <span>كيف تعمل منصة Hesham Exam؟</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-xs leading-relaxed text-amber-200">
            <strong className="text-white block mb-1 text-sm">القاعدة الأساسية لمنظومة مستر محمد هشام:</strong>
            <span className="font-semibold text-amber-300">"المرجع هو الصورة لتوليد أسئلة مثل الموجودة في الصورة لتكوين امتحان جديد، والهيكلة من التمبلت القديم"</span> — أي أن الذكاء الاصطناعي يدرس موضوع ورقة الصورة وقوانينها ونوعية مسائلها، ويبتكر أسئلة ومسائل جديدة بنفس الفكرة ومستوى الصعوبة لتكوين امتحان جديد، مع الحفاظ الكامل على هيكل وشكل وبرمجة ومؤقت كود التمبلت القديم.
          </div>

          <div className="space-y-4">
            
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span>التقاط أو رفع صورة الامتحان</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ارفع صورة ورقة الامتحان الورقي، أو التقط صورة مباشرة بالكاميرا، أو اضغط <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">Ctrl+V</kbd> للصق سكرين شوت. يدعم متعدد الصور والأسئلة المعقدة والمعادلات.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-400 font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>تحديد تمبلت كود الامتحان القديم</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اختر من التمبلتات الجاهزة (تطبيق ويب تفاعلي، سكربت بايثون، مكون ريأكت، بنك أسئلة JSON)، أو الصق ملف كود امتحان قديم خاص بك ترغب في استنساخ تصميمه وهيكله.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>استلام الكود وتجريبه في الساندبوكس التفاعلي</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اضغط "توليد كود الامتحان". سيقوم محرك Gemini 3.8 Flash بتحليل النص واستخراج الخيارات والحل النموذجي، وتوليد الكود المتطابق جاهزاً للتشغيل والتحميل بضغطة زر.
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              فهمت، ابدأ الآن!
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
