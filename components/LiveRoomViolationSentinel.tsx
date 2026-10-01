import React, { useState, useEffect, useRef } from 'react';
import violationSentinel, { ViolationDetection } from '../services/violationSentinelService';

interface LiveRoomViolationSentinelProps {
  streamId?: string;
  hostName?: string;
  isHost?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | HTMLCanvasElement | null>;
  onForceTerminate?: () => void;
}

export default function LiveRoomViolationSentinel({
  streamId = 'live_active',
  hostName = 'Live Host',
  isHost = false,
  videoRef,
  onForceTerminate
}: LiveRoomViolationSentinelProps) {
  const [activeViolation, setActiveViolation] = useState<ViolationDetection | null>(null);
  const [modelAlert, setModelAlert] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<ViolationDetection[]>([]);
  const [modelsStatus, setModelsStatus] = useState<Record<string, { enabled: boolean; downloaded: boolean }>>({
    smoking_vaping: { enabled: true, downloaded: true },
    middle_finger: { enabled: true, downloaded: true }
  });
  const countdownTimerRef = useRef<any>(null);

  // Play warning chime via Web Audio API
  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  useEffect(() => {
    // Start continuous camera scanning if videoRef is provided
    if (videoRef) {
      violationSentinel.startLiveScanning(() => videoRef.current, { streamId, hostName });
    }

    // Subscribe to sentinel violations
    const unsubscribe = violationSentinel.onViolation((violation) => {
      handleViolationTriggered(violation);
    });

    const handleModelInactive = (e: any) => {
      setModelAlert(e.detail?.message || 'Model is turned OFF or uninstalled.');
      setTimeout(() => setModelAlert(null), 4500);
    };
    window.addEventListener('sentinel_model_inactive', handleModelInactive);

    const updateLocalModelStatus = () => {
      const all = violationSentinel.getModels();
      const sv = all.find(m => m.id === 'model-smoke-vape');
      const ff = all.find(m => m.id === 'model-fuck-finger');
      setModelsStatus({
        smoking_vaping: { enabled: sv ? sv.enabled : true, downloaded: sv ? sv.downloaded : true },
        middle_finger: { enabled: ff ? ff.enabled : true, downloaded: ff ? ff.downloaded : true }
      });
    };
    updateLocalModelStatus();

    return () => {
      unsubscribe();
      window.removeEventListener('sentinel_model_inactive', handleModelInactive);
      violationSentinel.stopLiveScanning();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [streamId, hostName]);

  const handleViolationTriggered = (violation: ViolationDetection) => {
    setActiveViolation(violation);
    setDetectionHistory(prev => [violation, ...prev.slice(0, 4)]);
    playAlertSound();

    if (violation.actionTaken === 'auto_blurred' || violation.severity === 'critical') {
      setIsBlurred(true);
    }

    // Start 10-second countdown for host to resolve
    if (violation.severity === 'critical' || violation.actionTaken === 'stream_terminated') {
      setCountdown(10);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownTimerRef.current);
            // Terminate stream if not cleared
            if (onForceTerminate) onForceTerminate();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Auto-clear warning banner after 8 seconds
      setTimeout(() => {
        setActiveViolation((current) => (current?.id === violation.id ? null : current));
        setIsBlurred(false);
      }, 8000);
    }
  };

  const handleManualTest = (type: 'smoking' | 'vaping' | 'knife' | 'drugs' | 'middle_finger') => {
    violationSentinel.triggerDetection(type, { streamId, hostName });
  };

  const handleDismissViolation = () => {
    setActiveViolation(null);
    setIsBlurred(false);
    setCountdown(null);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };

  return (
    <>
      {/* 1. TOP SENTINEL STATUS BADGE & MODEL ALERT */}
      <div className="absolute top-14 left-4 z-40 flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-medium shadow-lg hover:bg-black/80 transition-all cursor-pointer group"
            title="Click to view AI Vision Sentinel & Test Prohibited Detections"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping group-hover:scale-125" />
            <i className="fa-solid fa-shield-halved text-emerald-400"></i>
            <span>AI Sentinel: ACTIVE</span>
            <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 ml-1"></i>
          </button>

          {isBlurred && (
            <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[11px] font-bold animate-pulse flex items-center space-x-1">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>BLURRED</span>
            </span>
          )}
        </div>

        {modelAlert && (
          <div className="bg-amber-950/90 backdrop-blur-md border border-amber-500/60 rounded-xl px-3 py-1.5 text-amber-200 text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
            <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
            <span>{modelAlert}</span>
          </div>
        )}
      </div>

      {/* 2. AUTO-BLUR & CRITICAL VIOLATION OVERLAY ON LIVE VIDEO */}
      {isBlurred && (
        <div className="absolute inset-0 z-30 pointer-events-none backdrop-blur-2xl bg-black/60 flex flex-col items-center justify-center text-center p-6 border-4 border-red-500/80 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mb-3">
            <i className="fa-solid fa-ban text-3xl text-red-400"></i>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            LIVE STREAM SHIELDED BY SENTINEL
          </h2>
          <p className="text-sm text-red-200 mt-1 max-w-sm font-medium">
            {activeViolation?.label || 'Prohibited visual content detected in room'}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {activeViolation?.details} ({activeViolation?.confidence}% AI confidence)
          </p>

          {countdown !== null && (
            <div className="mt-4 px-4 py-2 rounded-xl bg-red-900/80 border border-red-400 text-white font-mono text-sm">
              Stream will be terminated in: <span className="font-bold text-lg text-yellow-300">{countdown}s</span>
            </div>
          )}

          {isHost && (
            <button
              onClick={handleDismissViolation}
              className="mt-4 pointer-events-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
            >
              <i className="fa-solid fa-check mr-1.5"></i>
              I Have Removed Violation (Clear Blur)
            </button>
          )}
        </div>
      )}

      {/* 3. PROMINENT TOP VIOLATION BANNER */}
      {activeViolation && !isBlurred && (
        <div className="absolute top-24 left-4 right-4 z-40 animate-bounce">
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-[1px] rounded-xl shadow-2xl">
            <div className="bg-gray-950/95 backdrop-blur-md rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
                  {activeViolation.type === 'smoking' && <span className="text-xl">🚬</span>}
                  {activeViolation.type === 'vaping' && <span className="text-xl">💨</span>}
                  {activeViolation.type === 'knife' && <span className="text-xl">🔪</span>}
                  {activeViolation.type === 'drugs' && <span className="text-xl">💊</span>}
                  {activeViolation.type === 'middle_finger' && <span className="text-xl">🖕</span>}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                      ⚠️ Prohibited Content Detected
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300">
                      {activeViolation.confidence}% Confidence
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {activeViolation.label}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {activeViolation.details}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismissViolation}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-gray-200 transition-colors ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPANDABLE SENTINEL CONTROL & TEST CONSOLE */}
      {showConsole && (
        <div className="absolute top-24 left-4 z-50 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-shield-halved text-emerald-400"></i>
              <h3 className="text-sm font-bold text-white">Live Room Sentinel AI</h3>
            </div>
            <button
              onClick={() => setShowConsole(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="py-2.5">
            <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
              <span>Detection Scope:</span>
              <span className="font-semibold text-emerald-400">Live Stream Room Only</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span>Auto-Scanning Status:</span>
              <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Continuously Active</span>
              </span>
            </div>
          </div>

          {/* Quick Model Status & In-Room Toggles */}
          <div className="mt-1 pt-2 border-t border-gray-800">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Online AI Models Status:
            </p>
            <div className="space-y-1.5 mb-2.5">
              <div className="flex items-center justify-between bg-gray-800/80 p-2 rounded-xl text-xs">
                <div className="flex items-center space-x-1.5">
                  <span>🚬/💨</span>
                  <span className="font-medium text-gray-200">Smoke & Vape Model</span>
                </div>
                <button
                  onClick={async () => {
                    const next = !modelsStatus.smoking_vaping.enabled;
                    await violationSentinel.toggleModel('model-smoke-vape', next);
                    setModelsStatus(prev => ({
                      ...prev,
                      smoking_vaping: { ...prev.smoking_vaping, enabled: next }
                    }));
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    modelsStatus.smoking_vaping.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {modelsStatus.smoking_vaping.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-800/80 p-2 rounded-xl text-xs">
                <div className="flex items-center space-x-1.5">
                  <span>🖕</span>
                  <span className="font-medium text-gray-200">Fuck Finger 3D Model</span>
                </div>
                <button
                  onClick={async () => {
                    const next = !modelsStatus.middle_finger.enabled;
                    await violationSentinel.toggleModel('model-fuck-finger', next);
                    setModelsStatus(prev => ({
                      ...prev,
                      middle_finger: { ...prev.middle_finger, enabled: next }
                    }));
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    modelsStatus.middle_finger.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {modelsStatus.middle_finger.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Test Trigger Buttons for all 5 requested violations */}
          <div className="mt-2 pt-2 border-t border-gray-800">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Test Detection on Camera:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleManualTest('smoking')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 border border-gray-700 hover:border-red-500/50 text-xs text-gray-200 transition-all text-left cursor-pointer"
              >
                <span>🚬</span>
                <span className="truncate">Smoking</span>
              </button>
              <button
                onClick={() => handleManualTest('vaping')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-amber-950/60 border border-gray-700 hover:border-amber-500/50 text-xs text-gray-200 transition-all text-left cursor-pointer"
              >
                <span>💨</span>
                <span className="truncate">Vaping</span>
              </button>
              <button
                onClick={() => handleManualTest('knife')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/60 border border-gray-700 hover:border-rose-500/50 text-xs text-gray-200 transition-all text-left cursor-pointer"
              >
                <span>🔪</span>
                <span className="truncate">Sharp Knife</span>
              </button>
              <button
                onClick={() => handleManualTest('drugs')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-purple-950/60 border border-gray-700 hover:border-purple-500/50 text-xs text-gray-200 transition-all text-left cursor-pointer"
              >
                <span>💊</span>
                <span className="truncate">Drugs</span>
              </button>
              <button
                onClick={() => handleManualTest('middle_finger')}
                className="col-span-2 flex items-center justify-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-900/40 to-amber-900/40 hover:from-red-900/60 hover:to-amber-900/60 border border-red-500/40 text-xs font-semibold text-red-200 transition-all cursor-pointer"
              >
                <span>🖕</span>
                <span>Middle Finger (Fuck Gesture)</span>
              </button>
            </div>
          </div>

          {/* Recent Detection History */}
          {detectionHistory.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-800">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Recent Room Detections:
              </p>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {detectionHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded bg-gray-800/60 text-gray-300"
                  >
                    <span className="truncate max-w-[150px]">{item.label}</span>
                    <span className="text-[10px] text-gray-500">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
