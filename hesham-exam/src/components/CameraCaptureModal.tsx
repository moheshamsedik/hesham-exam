import React, { useRef, useState, useEffect } from "react";
import { Camera, X, Check, RefreshCw, AlertCircle } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedPreview(null);
      setErrorMsg(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setErrorMsg(null);
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMsg("تعذر الوصول إلى الكاميرا. يرجى التأكد من منح الإذن للمتصفح.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedPreview(dataUrl);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Camera className="w-5 h-5 text-indigo-400" />
            <span>تصوير ورقة الامتحان أو السؤال مباشرة</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] overflow-hidden">
          {errorMsg ? (
            <div className="text-center p-6 text-slate-300 max-w-md">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <p className="text-sm">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured exam"
              className="max-h-[60vh] w-auto object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Exam alignment guide box */}
              <div className="pointer-events-none absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-xl flex items-center justify-center">
                <span className="text-xs bg-slate-950/80 px-3 py-1 rounded-md text-indigo-200 backdrop-blur-sm">
                  وجّه الكاميرا نحو ورقة الامتحان بوضوح
                </span>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleFacingMode}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5"
            title="تبديل الكاميرا الخلفية / الأمامية"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تبديل الكاميرا</span>
          </button>

          <div className="flex items-center gap-3">
            {capturedPreview ? (
              <>
                <button
                  onClick={handleRetake}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  إعادة التقاط الصورة
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد هذه الصورة</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSnap}
                disabled={!stream}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>التقاط الصورة الآن</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
