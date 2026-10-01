import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { getUsername, get8DigitId } from './InboxView';

export type CallType = 'audio' | 'video';

interface ChatCallModalProps {
  isOpen: boolean;
  callType: CallType | null;
  currentUser: User;
  chatUser: Partial<User>;
  onEndCall: (type: CallType, durationSec: number) => void;
}

export default function ChatCallModal({
  isOpen,
  callType,
  currentUser,
  chatUser,
  onEndCall
}: ChatCallModalProps) {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVirtualCam, setIsVirtualCam] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const virtualCanvasTimerRef = useRef<any>(null);
  const ringtoneTimerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Generate virtual stream for video calls when physical webcam is absent or requested
  const createVirtualCameraStream = (user: User, width = 640, height = 480): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200';

    const render = () => {
      if (!ctx) return;
      frame++;
      // Deep gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Neon pulse ring
      const cx = width / 2;
      const cy = height / 2;
      const r = 70 + Math.sin(frame * 0.08) * 4;

      ctx.beginPath();
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.restore();
    };

    virtualCanvasTimerRef.current = setInterval(render, 1000 / 30);
    render();

    let stream: MediaStream;
    if ((canvas as any).captureStream) {
      stream = (canvas as any).captureStream(30);
    } else {
      stream = new MediaStream();
    }
    return stream;
  };

  // Play soft subtle ringtone beep
  const startRingingBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playBeep = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      };

      playBeep();
      ringtoneTimerRef.current = setInterval(playBeep, 2400);
    } catch (e) {}
  };

  const stopRingingBeep = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  // Setup media streams
  useEffect(() => {
    if (!isOpen || !callType) return;

    setCallStatus('calling');
    setDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    startRingingBeep();

    // Auto connect simulation after 2.8 seconds
    const connectTimer = setTimeout(() => {
      stopRingingBeep();
      setCallStatus('connected');
    }, 2800);

    // Initialize local camera if video call
    if (callType === 'video') {
      const initMedia = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            });
            streamRef.current = stream;
            setIsVirtualCam(false);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
          } else {
            throw new Error("No mediaDevices");
          }
        } catch (e) {
          // Fallback to virtual camera feed safely
          setIsVirtualCam(true);
          const vStream = createVirtualCameraStream(currentUser);
          streamRef.current = vStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = vStream;
            localVideoRef.current.play().catch(() => {});
          }
        }
      };
      initMedia();
    }

    return () => {
      clearTimeout(connectTimer);
      stopRingingBeep();
      if (virtualCanvasTimerRef.current) {
        clearInterval(virtualCanvasTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, callType]);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  if (!isOpen || !callType) return null;

  const handleEndCall = () => {
    setCallStatus('ended');
    stopRingingBeep();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    onEndCall(callType, duration);
  };

  const toggleMute = () => {
    setIsMuted(m => {
      const next = !m;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const toggleVideo = () => {
    setIsVideoOff(v => {
      const next = !v;
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in text-white select-none">
      {/* Top Bar: Caller Info & Status */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-lg">
            {callType === 'video' ? (
              <i className="fa-solid fa-video text-indigo-400"></i>
            ) : (
              <i className="fa-solid fa-phone text-emerald-400"></i>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-white">{chatUser.name || 'User'}</h4>
              <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                ID: {get8DigitId(chatUser)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
              <span className="text-xs font-bold text-slate-300">
                {callStatus === 'calling' ? 'Calling...' : formatCallTime(duration)}
              </span>
              <span className="text-slate-500 text-[10px]">•</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {callType === 'video' ? 'HD Video Call' : 'Encrypted Voice'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini status pill */}
        <div className="flex items-center gap-2">
          {callType === 'video' && isVirtualCam && (
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Virtual Cam
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <i className="fa-solid fa-shield-halved text-emerald-400 text-[10px]"></i>
            Encrypted
          </span>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl">
        {/* Video Call View */}
        {callType === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Remote Participant Fullscreen Simulation */}
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-slate-950">
              <img
                src={chatUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                alt={chatUser.name}
                className="w-full h-full object-cover opacity-85 filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>

              {/* Remote Broadcaster Status badge */}
              <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-white">{chatUser.name}</span>
                <span className="text-[10px] text-slate-400">@{getUsername(chatUser)}</span>
              </div>
            </div>

            {/* Local User PiP (Picture in Picture) Camera View */}
            <div className="absolute top-4 right-4 w-32 sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl bg-slate-900 z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 text-center">
                  <i className="fa-solid fa-video-slash text-xl mb-1 text-slate-500"></i>
                  <span className="text-[9px] font-bold uppercase">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                You
              </div>
            </div>
          </div>
        ) : (
          /* Audio Call View */
          <div className="flex flex-col items-center justify-center p-6 text-center z-10 max-w-sm">
            {/* Pulsing Avatar */}
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/80 shadow-2xl shadow-emerald-500/30">
                <img
                  src={chatUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300'}
                  alt={chatUser.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Pulsing sound waves */}
              {callStatus === 'connected' && (
                <>
                  <div className="absolute -inset-3 rounded-full border border-emerald-400/30 animate-ping pointer-events-none"></div>
                  <div className="absolute -inset-6 rounded-full border border-emerald-400/15 animate-pulse pointer-events-none"></div>
                </>
              )}
            </div>

            <h3 className="text-2xl font-black text-white mb-1">{chatUser.name}</h3>
            <p className="text-sm font-mono text-emerald-400 font-bold mb-4">@{getUsername(chatUser)}</p>

            {/* Audio Equalizer Visualizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-10 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 w-full max-w-xs mb-3">
              {[18, 30, 14, 38, 22, 12, 34, 28, 16, 32, 24, 15].map((h, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full transition-all duration-200 ${
                    callStatus === 'connected'
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                      : 'bg-slate-600'
                  }`}
                  style={{
                    height: callStatus === 'connected'
                      ? `${Math.max(6, (h + Math.sin(duration * 2 + idx) * 12))}px`
                      : '6px'
                  }}
                />
              ))}
            </div>

            <span className="text-xs font-bold text-slate-400">
              {callStatus === 'calling' ? 'Ringing...' : 'Voice connected'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 z-20 py-2">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i>
          <span className="text-[9px] font-bold mt-0.5">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Video Toggle (If VC) */}
        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'} text-lg`}></i>
            <span className="text-[9px] font-bold mt-0.5">{isVideoOff ? 'Camera Off' : 'Camera'}</span>
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center shadow-xl shadow-rose-600/40 active:scale-95 transition-all"
          title="End Call"
        >
          <i className="fa-solid fa-phone-slash text-xl"></i>
          <span className="text-[9px] font-black uppercase mt-0.5">End</span>
        </button>

        {/* Speaker / Audio Toggle */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all ${
            isSpeakerOn
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              : 'bg-slate-800 text-slate-400 border border-white/10'
          }`}
          title={isSpeakerOn ? 'Speaker On' : 'Earpiece'}
        >
          <i className={`fa-solid ${isSpeakerOn ? 'fa-volume-high' : 'fa-volume-low'} text-lg`}></i>
          <span className="text-[9px] font-bold mt-0.5">{isSpeakerOn ? 'Speaker' : 'Ear'}</span>
        </button>
      </div>
    </div>
  );
}
