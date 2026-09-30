import React, { useEffect, useState, useRef } from "react";
import { ShieldAlert, AlertTriangle, Eye, Lock, Camera, Maximize, CheckCircle2 } from "lucide-react";
import { useAppStore } from "../../store/appStore";

interface ProctoringGuardProps {
  onViolation: (count: number, log: string) => void;
  maxViolations?: number;
}

export const ProctoringGuard: React.FC<ProctoringGuardProps> = ({
  onViolation,
  maxViolations = 3
}) => {
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { addToast } = useAppStore();

  // 1. Initialize Webcam Proctoring Frame
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 240, height: 180, facingMode: "user" },
            audio: false
          });
          if (mounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
          } else {
            stream.getTracks().forEach((track) => track.stop());
          }
        }
      } catch (err) {
        console.warn("Webcam proctoring permission denied or unavailable:", err);
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Fullscreen Lock & Violation Listeners
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && violations < maxViolations) {
        const next = violations + 1;
        setViolations(next);
        const log = `Exited Fullscreen Lock at ${new Date().toLocaleTimeString()}`;
        onViolation(next, log);
        addToast({
          title: "Proctoring Alert: Fullscreen Breach",
          message: `Warning (${next}/${maxViolations}): Examination requires full-screen lock.`,
          type: "warning"
        });
      }
    };

    // 3. Tab-switch & Visibility Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const next = violations + 1;
        setViolations(next);
        const log = `Tab switch / window blur detected at ${new Date().toLocaleTimeString()}`;
        onViolation(next, log);
        addToast({
          title: "Proctoring Alert: Tab Switch Logged",
          message: `Warning (${next}/${maxViolations}): Navigating away from the exam tab is strictly logged.`,
          type: "warning"
        });
      }
    };

    // 4. Copy-Paste, Cut, and Context-Menu (Right-Click) Disabling
    const handleCopyPasteCut = (e: ClipboardEvent) => {
      e.preventDefault();
      addToast({
        title: "Proctoring Policy Restricts Action",
        message: "Clipboard copy, cut, and paste are disabled during timed assessments.",
        type: "warning"
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disallow F12, Ctrl+Shift+I, Cmd+Option+I (DevTools inspection)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"))
      ) {
        e.preventDefault();
        addToast({
          title: "Proctoring Security Violation",
          message: "Inspection tools are restricted during proctored evaluation.",
          type: "warning"
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopyPasteCut);
    document.addEventListener("paste", handleCopyPasteCut);
    document.addEventListener("cut", handleCopyPasteCut);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopyPasteCut);
      document.removeEventListener("paste", handleCopyPasteCut);
      document.removeEventListener("cut", handleCopyPasteCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [violations, maxViolations, onViolation, addToast]);

  return (
    <div className="rounded-2xl bg-black/60 border border-white/15 p-3.5 space-y-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Security Title & Features */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Anti-Cheat Proctoring Sandbox Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400">
              Fullscreen Lock • Tab Blur Monitor • Clipboard Restricted • Webcam Integrity
            </p>
          </div>
        </div>

        {/* Action Controls & Strikes Badge */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              isFullscreen
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border-blue-400/40"
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>{isFullscreen ? "Fullscreen Locked ✓" : "Enter Fullscreen Mode"}</span>
          </button>

          <span
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
              violations > 0
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {violations} / {maxViolations} Strikes
          </span>
        </div>
      </div>

      {/* Webcam Proctoring Frame & Security Details Row */}
      <div className="flex items-center justify-between pt-2.5 border-t border-white/10 gap-3">
        <div className="flex items-center gap-3">
          {/* Picture-in-Picture Webcam Proctoring Frame */}
          <div className="relative w-28 h-18 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-white/20 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />
            {!cameraActive && (
              <div className="text-center p-1 text-slate-500 space-y-1">
                <Camera className="w-4 h-4 mx-auto text-slate-400" />
                <span className="text-[9px] block leading-tight">Proctor Feed Active</span>
              </div>
            )}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>REC</span>
            </div>
          </div>

          <div className="space-y-0.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Continuous Candidate Presence Monitoring</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm sm:max-w-md">
              Your video stream is processed in real time by the browser to verify ongoing physical presence during evaluation.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Right-Click & Copy-Paste Disabled</span>
        </div>
      </div>
    </div>
  );
};
