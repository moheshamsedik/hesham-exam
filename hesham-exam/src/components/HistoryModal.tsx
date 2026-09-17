import React from "react";
import { History, X, Trash2, Calendar, FileCode, ArrowRight, Sparkles } from "lucide-react";
import { GenerationHistoryItem } from "../types";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GenerationHistoryItem[];
  onSelect: (item: GenerationHistoryItem) => void;
  onClear: () => void;
  onDeleteOne: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onDeleteOne,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <History className="w-5 h-5 text-indigo-400" />
            <span>سجل الامتحانات والأكواد المولدة سابقاً ({history.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-semibold text-sm text-slate-300">لا يوجد سجل سابق حتى الآن</p>
              <p className="text-xs text-slate-500 mt-1">
                عند توليد أي كود امتحان جديد سيتم حفظه هنا تلقائياً لسرعة الرجوع إليه.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              });
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase">
                        {item.language}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        {item.questionsCount} أسئلة
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 truncate">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOne(item.id);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-[-2px] transition flex items-center gap-1">
                      <span>عرض</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500">يتم حفظ السجل محلياً في متصفحك.</span>
            <button
              onClick={onClear}
              className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح كل السجل</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
