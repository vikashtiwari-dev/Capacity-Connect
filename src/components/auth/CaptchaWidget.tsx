import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { RotateCw, Volume2, VolumeX, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

interface CaptchaWidgetProps {
  onVerify: (verified: boolean) => void;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({ onVerify }) => {
  
  const [captchaCode, setCaptchaCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateCode = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserInput("");
    setIsVerified(false);
    setHasError(false);
    onVerify(false);
  };

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, width, height);

    // Random security noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 200 + 55}, ${Math.random() * 200 + 55}, 255, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render characters
    const colors = ["#2997ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff453a"];
    const fonts = ["bold 17px monospace", "bold 16px sans-serif", "bold 18px Courier New"];

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.save();
      const x = 12 + i * 18;
      const y = height / 2 + 5;
      const angle = (Math.random() - 0.5) * 0.35;

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(char, -6, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCode();
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (captchaCode) {
      drawCaptcha(captchaCode);
    }
  }, [captchaCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);

    if (val.trim() === captchaCode) {
      setIsVerified(true);
      setHasError(false);
      onVerify(true);
    } else {
      setIsVerified(false);
      onVerify(false);
      if (val.length >= captchaCode.length) {
        setHasError(true);
      } else {
        setHasError(false);
      }
    }
  };

  const formatCaptchaForSpeech = (code: string): string => {
    return code
      .split("")
      .map((char) => {
        if (/[A-Z]/.test(char)) {
          return `Capital ${char}`;
        } else if (/[a-z]/.test(char)) {
          return `Small ${char.toUpperCase()}`;
        } else if (/[0-9]/.test(char)) {
          return `Number ${char}`;
        }
        return char;
      })
      .join(". ") + ".";
  };

  const speakCaptcha = () => {
    if (!("speechSynthesis" in window) || !captchaCode) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = formatCaptchaForSpeech(captchaCode);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-2.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2997ff]" /> CAPTCHA
        </span>
        {isSpeaking ? (
          <span className="text-[#2997ff] font-medium flex items-center gap-1 text-[10px] animate-pulse">
            Speaking case...
          </span>
        ) : isVerified ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">Case-sensitive</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Compact Canvas */}
        <div
          onClick={generateCode}
          className="rounded-lg overflow-hidden border border-white/15 bg-black/60 shrink-0 cursor-pointer shadow-inner"
          title="Click to reload"
        >
          <canvas ref={canvasRef} width={105} height={32} />
        </div>

        {/* Action icons */}
        <button
          type="button"
          onClick={generateCode}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition shrink-0"
          title="Reload CAPTCHA"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={speakCaptcha}
          className={`p-1.5 rounded-lg border transition shrink-0 ${
            isSpeaking
              ? "bg-[#2997ff]/20 border-[#2997ff]/50 text-[#2997ff] animate-pulse"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white"
          }`}
          title={isSpeaking ? "Stop audio" : "Play audio (speaks Capital, Small & Numbers)"}
          aria-label={isSpeaking ? "Stop audio" : "Play audio (speaks Capital, Small & Numbers)"}
        >
          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            required
            maxLength={5}
            placeholder="Enter code"
            value={userInput}
            onChange={handleInputChange}
            className={"apple-input !py-1.5 !px-2.5 text-xs font-mono tracking-widest " + (isVerified ? "!border-emerald-500/60 !bg-emerald-500/10" : hasError ? "!border-rose-500/60 !bg-rose-500/10" : "")}
          />
          {isVerified && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
          {hasError && !isVerified && (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
};
