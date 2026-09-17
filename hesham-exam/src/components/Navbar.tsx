import React from "react";
import { Sparkles, History, HelpCircle, RefreshCw, Cpu, Award } from "lucide-react";

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenHelp: () => void;
  onReset: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenHelp,
  onReset,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xs transition-colors w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4 w-full">
        
        {/* Brand: Official Teacher Logo & Title from Records Repository */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl p-0.5 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-md shadow-amber-500/20 shrink-0 overflow-hidden">
            <img
              src="/teacher-logo.jpg"
              alt="Mr Mohamed Hesham"
              className="w-full h-full object-cover rounded-[10px]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[8px] font-bold shadow">
              <Sparkles className="w-2 h-2 fill-current" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-amber-500 font-extrabold text-sm sm:text-base leading-tight font-sans tracking-wide truncate">
                Mr. Mohamed{" "}
                <span className="text-white font-black">Hesham</span>
              </div>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Official Platform
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate font-sans">
              منصة السجلات الأكاديمية ونظام توليد الامتحانات الذكية
            </p>
          </div>
        </div>

        {/* Header Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Platform Refresh Button (تحديث المنصة) */}
          <button
            id="btn-refresh-platform"
            onClick={onReset}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-amber-500/30 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            title="تحديث المنصة ومسح الحقول لبدء امتحان جديد"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">تحديث المنصة</span>
            <span className="sm:hidden text-[11px] font-bold">تحديث</span>
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            id="nav-history-btn"
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-xs font-semibold cursor-pointer active:scale-95"
            title="سجل الأكواد والامتحانات السابقة"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">السجل السابق</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-950 bg-amber-400 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* How It Works Guide */}
          <button
            onClick={onOpenHelp}
            id="nav-help-btn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-xs font-semibold cursor-pointer active:scale-95"
            title="دليل الاستخدام السريع"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">طريقة العمل</span>
          </button>
        </div>
      </div>
    </header>
  );
};
