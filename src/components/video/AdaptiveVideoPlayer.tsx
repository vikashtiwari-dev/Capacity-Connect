import React, { useState, useRef, useEffect } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Settings,
  RotateCcw, Sparkles, MessageSquare, FileText, CheckCircle2, Bookmark
} from "lucide-react";
import { parsePlayableVideoUrl, getVideoBlobUrl } from "../../utils/videoStorage";
import { useAppStore } from "../../store/appStore";
import { TranscriptItem } from "../../types";

interface AdaptiveVideoPlayerProps {
  videoUrl?: string;
  thumbnail?: string;
  transcripts?: TranscriptItem[];
  title: string;
  onProgress?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
}

export const AdaptiveVideoPlayer: React.FC<AdaptiveVideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  transcripts = [],
  title,
  onProgress,
  onEnded
}) => {
  const { activeVideoQuality, setVideoQuality, dataSaverMode, addToast } = useAppStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(900); // 15 mins default
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscripts, setShowTranscripts] = useState(true);
  const [savedNotes, setSavedNotes] = useState<{ time: string; note: string }[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState(false);

  // Parse playable URL format (YouTube, Google Drive, Direct CDN, or IndexedDB)
  const parsedMedia = parsePlayableVideoUrl(videoUrl);

  // Resolve IndexedDB or direct stream URL
  useEffect(() => {
    let active = true;
    setMediaError(false);

    if (parsedMedia.type === "indexeddb" && parsedMedia.streamUrl) {
      getVideoBlobUrl(parsedMedia.streamUrl).then((url) => {
        if (active) {
          if (url) {
            setResolvedStreamUrl(url);
          } else {
            // Graceful cross-device fallback: stream the hosted video file on mobile devices
            setResolvedStreamUrl("/videos/Video1.mp4");
          }
        }
      });
    } else if (parsedMedia.type === "direct") {
      setResolvedStreamUrl(parsedMedia.streamUrl || null);
    } else {
      setResolvedStreamUrl(null);
    }

    return () => {
      active = false;
    };
  }, [videoUrl, parsedMedia.type, parsedMedia.streamUrl]);

  const isIframe = parsedMedia.type === "youtube" || parsedMedia.type === "drive";
  const iframeSrc = parsedMedia.embedUrl;

  // Synchronize playback state with DOM element
  useEffect(() => {
    if (isIframe || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, isIframe]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeJump = (sec: number) => {
    setCurrentTime(sec);
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
    }
    addToast({
      title: "Jumped to Timestamp",
      message: "Synchronized lecture playback to " + formatTime(sec),
      type: "info"
    });
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, clickPos * duration));
    handleTimeJump(newTime);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setSavedNotes([
      ...savedNotes,
      { time: formatTime(currentTime), note: noteInput.trim() }
    ]);
    setNoteInput("");
    addToast({
      title: "Timestamped Note Saved",
      message: "Bookmark created at " + formatTime(currentTime),
      type: "success"
    });
  };

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-white/15 bg-black shadow-2xl group">
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {isIframe && iframeSrc ? (
            <iframe
              src={iframeSrc}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : resolvedStreamUrl ? (
            <video
              ref={videoRef}
              src={resolvedStreamUrl}
              poster={thumbnail}
              className="w-full h-full object-cover"
              onTimeUpdate={(e) => {
                const cur = e.currentTarget.currentTime;
                const dur = e.currentTarget.duration || duration || 1;
                setCurrentTime(cur);
                if (onProgress && dur > 0) {
                  onProgress(Math.round((cur / dur) * 100), Math.round(cur));
                }
              }}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 900)}
              onEnded={() => {
                setIsPlaying(false);
                if (onEnded) onEnded();
              }}
              onError={() => setMediaError(true)}
            />
          ) : mediaError ? (
            <div className="p-6 text-center space-y-3 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Video Source Stream Unavailable</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The local session URL for this lecture is unavailable on this device. Mentors can re-upload or provide a cloud link (YouTube or Google Drive) for cross-device access.
              </p>
              <button
                onClick={() => {
                  setMediaError(false);
                  setResolvedStreamUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
                }}
                className="apple-btn-primary text-xs px-4 py-2 font-semibold mx-auto flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Stream Sample Video
              </button>
            </div>
          ) : (
            <img
              src={thumbnail || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80"}
              alt={title}
              className="w-full h-full object-cover opacity-80"
            />
          )}

          {/* Central Play Overlay if paused (for native videos) */}
          {!isPlaying && !isIframe && resolvedStreamUrl && !mediaError && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute w-16 h-16 rounded-full bg-[#0071e3]/80 hover:bg-[#0071e3] text-white flex items-center justify-center backdrop-blur-md shadow-2xl shadow-blue-500/40 border border-white/20 transition-transform hover:scale-110 cursor-pointer"
            >
              <Play className="w-7 h-7 fill-white ml-1" />
            </button>
          )}

          {/* Quality badge overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="badge-blue text-[10px] backdrop-blur-md bg-black/60 border border-white/20">
              {activeVideoQuality}
            </span>
            {dataSaverMode && (
              <span className="badge-green text-[10px] backdrop-blur-md bg-black/60">
                Data-Saver Active
              </span>
            )}
          </div>
        </div>

        {/* Video Control Bar (Apple Glass Aesthetic) */}
        {!isIframe && resolvedStreamUrl && (
          <div className="p-3 bg-[#0d0e14]/90 border-t border-white/10 backdrop-blur-2xl flex flex-col gap-2">
            {/* Progress Bar with seeking */}
            <div
              onClick={handleScrubberClick}
              className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:h-2.5 transition-all"
            >
              <div
                className="h-full bg-gradient-to-r from-[#0071e3] to-[#2997ff]"
                style={{ width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%` }}
              />
            </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 text-white hover:text-[#2997ff] transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={() => handleTimeJump(Math.max(0, currentTime - 10))}
                className="text-slate-400 hover:text-white p-1"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white p-1"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-mono text-[11px] text-slate-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Playback speed selector */}
              <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
                {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={"px-1.5 py-0.5 rounded " + (playbackSpeed === s ? "bg-[#0071e3] text-white font-bold" : "text-slate-400 hover:text-white")}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Resolution settings menu */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="absolute bottom-10 right-0 w-44 p-2 rounded-xl glass-panel border border-white/15 shadow-2xl z-20 space-y-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Stream Quality</p>
                  {(["4K", "1080p", "720p", "Data-Saver (480p)"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setVideoQuality(q as any);
                        setShowSettings(false);
                      }}
                      className={"w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between " + (activeVideoQuality === q ? "bg-[#0071e3]/30 text-[#2997ff] font-bold" : "text-slate-300 hover:bg-white/10")}
                    >
                      <span>{q}</span>
                      {activeVideoQuality === q && <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Synchronized Transcript and Interactive Notes Tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transcript Panel */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2997ff]" /> Synchronized Interactive Transcript
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Live Timecoded</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {transcripts.length > 0 ? (
              transcripts.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTimeJump(t.seconds)}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-[#0071e3]/20 border border-white/5 hover:border-[#2997ff]/40 transition cursor-pointer text-xs group"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#2997ff] font-mono mb-0.5">
                    <span className="font-semibold">{t.speaker}</span>
                    <span className="group-hover:underline">[{t.timestamp}]</span>
                  </div>
                  <p className="text-slate-300 group-hover:text-white leading-relaxed">{t.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No automated transcripts available for this lesson.</p>
            )}
          </div>
        </div>

        {/* Video Bookmarks & Notes */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-400" /> Timestamped Study Notes ({savedNotes.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Current: {formatTime(currentTime)}</span>
          </div>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              placeholder={"Add note at " + formatTime(currentTime) + "..."}
              className="apple-input text-xs py-1.5"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <button type="submit" className="apple-btn-primary text-xs px-3 py-1.5">
              Pin
            </button>
          </form>

          <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
            {savedNotes.length > 0 ? (
              savedNotes.map((n, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded-xl bg-white/[0.04] border border-white/5 text-xs">
                  <span className="text-slate-200">{n.note}</span>
                  <span className="text-[10px] font-mono text-[#2997ff] ml-2 shrink-0">{n.time}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Type a quick note above to pin it to this lecture timestamp.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
