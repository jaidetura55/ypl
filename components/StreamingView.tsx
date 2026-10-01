
import React, { useEffect, useRef, useState } from 'react';
import { User, ChatMessage, Gift } from '../types';
import EmojiPicker from './EmojiPicker';
import VideoGenerator from './VideoGenerator';
import RemoteStreamPlayer from './RemoteStreamPlayer';
import { useData } from '../contexts/DataContext';
import { mediasoupService } from '../services/streamService';
import {
  AR_MASKS,
  LIPSTICK_SHADES,
  BLUSH_SHADES,
  REACTION_BURSTS,
  ARConfig,
  ARParticle,
  ARMetrics,
  renderARFrame,
} from '../services/arFaceEngine';
import LiveRoomViolationSentinel from './LiveRoomViolationSentinel';
import violationSentinel from '../services/violationSentinelService';

interface StreamingViewProps {
  onClose: () => void;
}

const HEADWEAR = [
  { id: 'none', name: 'None', icon: '🚫', url: null },
  { id: 'crown', name: 'Crown', icon: '👑', url: 'https://cdn-icons-png.flaticon.com/512/2550/2550359.png', scale: 2.5, yOffset: -0.4 },
  { id: 'hat', name: 'Hat', icon: '🎩', url: 'https://cdn-icons-png.flaticon.com/512/189/189679.png', scale: 3.0, yOffset: -0.5 },
  { id: 'bow', name: 'Bow', icon: '🎀', url: 'https://cdn-icons-png.flaticon.com/512/3253/3253240.png', scale: 1.8, yOffset: -0.4 },
];

const CATEGORIES = ['Chat', 'Gaming', 'Music', 'Dance', 'Art', 'Travel', 'Food'];

// Types for MediaPipe
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

const playGiftSound = (type: 'static' | 'luxury') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    if (type === 'luxury') {
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 1.25);
      });
    } else {
      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.85);
      });
    }
  } catch (e) {}
};

export default function StreamingView({ onClose }: StreamingViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Fix: Initialized useRef with undefined to resolve "Expected 1 arguments, but got 0" error
  const arLoopRef = useRef<number | undefined>(undefined);
  
  // AR & MediaPipe State
  const [faceMesh, setFaceMesh] = useState<any>(null);
  const faceMeshRef = useRef<any>(null);
  const isInitializingARRef = useRef<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [headwearImage, setHeadwearImage] = useState<HTMLImageElement | null>(null);

  // Transition State for AR Headwear
  const arTransitionRef = useRef({
    headwear: { current: null as HTMLImageElement | null, target: null as HTMLImageElement | null, opacity: 0 }
  });

  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Stream Setup State
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('Chat');

  // Beauty, Makeup & AR State
  const [showBeautyMenu, setShowBeautyMenu] = useState(false);
  const [activeEffectTab, setActiveEffectTab] = useState<'masks' | 'makeup' | 'beauty' | 'reactions' | 'neural'>('masks');
  const [beautyFilters, setBeautyFilters] = useState({ smooth: 25, whiten: 20, rosy: 15 });
  const [activeMask, setActiveMask] = useState<string>('none');
  const [activeHeadwear, setActiveHeadwear] = useState<string>('none');
  const [lipstickColor, setLipstickColor] = useState<string>('none');
  const [lipstickOpacity, setLipstickOpacity] = useState<number>(65);
  const [blushColor, setBlushColor] = useState<string>('none');
  const [blushOpacity, setBlushOpacity] = useState<number>(50);
  const [eyeGlimmer, setEyeGlimmer] = useState<boolean>(false);
  const [aiReactionsEnabled, setAiReactionsEnabled] = useState<boolean>(true);
  const [reactionBurstType, setReactionBurstType] = useState<'hearts' | 'stars' | 'fire' | 'sakura'>('hearts');
  const [showNeuralHUD, setShowNeuralHUD] = useState<boolean>(false);

  // Real-time AR Engine configuration and metrics refs (avoids stale closures in 60fps render loop)
  const arConfigRef = useRef<ARConfig>({
    activeMask: 'none',
    lipstickColor: 'none',
    lipstickOpacity: 65,
    blushColor: 'none',
    blushOpacity: 50,
    eyeGlimmer: false,
    aiReactionsEnabled: true,
    reactionBurstType: 'hearts',
    showNeuralHUD: false,
    beautyFilters: { smooth: 25, whiten: 20, rosy: 15 },
  });

  const particlesRef = useRef<ARParticle[]>([]);
  const arMetricsRef = useRef<ARMetrics>({
    fps: 60,
    frameCount: 0,
    lastTime: performance.now(),
    pitch: 0,
    yaw: 0,
    roll: 0,
    mouthOpen: 0,
    smile: 0,
    isWinking: false,
    confidence: 0,
  });
  const cooldownsRef = useRef({ lastMouth: 0, lastSmile: 0, lastWink: 0 });

  // Keep arConfigRef continuously synced with state
  useEffect(() => {
    arConfigRef.current = {
      activeMask,
      lipstickColor,
      lipstickOpacity,
      blushColor,
      blushOpacity,
      eyeGlimmer,
      aiReactionsEnabled,
      reactionBurstType,
      showNeuralHUD,
      beautyFilters,
    };
  }, [
    activeMask,
    lipstickColor,
    lipstickOpacity,
    blushColor,
    blushOpacity,
    eyeGlimmer,
    aiReactionsEnabled,
    reactionBurstType,
    showNeuralHUD,
    beautyFilters,
  ]);

  // Global Context
  const { currentUser, startStream, updateStream, endStream, streams, toggleMuteUserInStream, kickUserFromStream, followedUserIds, toggleFollow, users, gifts } = useData();
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState<{ id: string, name: string } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showViewerList, setShowViewerList] = useState(false);
  const [sessionBeans, setSessionBeans] = useState(0);

  // Stream Configuration State (Forced Studio 1080p FHD 60FPS)
  const [streamMode, setStreamMode] = useState<'single' | 'pk' | 'multi'>('single');
  const [quality, setQuality] = useState<'360p' | '720p' | '1080p'>('1080p');
  const [frameRate, setFrameRate] = useState<number>(60);
  const [videoBitrate, setVideoBitrate] = useState<number>(6500);
  const [audioBitrate, setAudioBitrate] = useState<number>(128);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [multiSeats, setMultiSeats] = useState<2 | 4 | 6 | 8>(4);
  const [roomType, setRoomType] = useState<'public' | 'private' | 'paid'>('public');
  const [streamPin, setStreamPin] = useState('');
  const [entryFee, setEntryFee] = useState<number>(500);

  // Host Live Room Gift Animation & Salary State
  const [hostGiftAnimation, setHostGiftAnimation] = useState<{gift: Gift, count: number, sender: string, beans: number} | null>(null);
  const [recentSalaryGain, setRecentSalaryGain] = useState<number | null>(null);
  
  // Scheduling State
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleCategory, setScheduleCategory] = useState('Chat');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // Multi-Guest State
  const [guestSeats, setGuestSeats] = useState<(User | null)[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Record<number, User>>({});
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeSeatIndex, setActiveSeatIndex] = useState<number | null>(null);

  // PK Battle State
  const [pkOpponent, setPkOpponent] = useState<User | null>(null);
  const [pkStatus, setPkStatus] = useState<'none' | 'inviting' | 'active' | 'ended'>('none');
  const [pkScores, setPkScores] = useState({ host: 0, opponent: 0 });
  const [pkTimeLeft, setPkTimeLeft] = useState(300); // 5 minutes
  const [isPkInviteModalOpen, setIsPkInviteModalOpen] = useState(false);
  const [pkOpponentStreamId, setPkOpponentStreamId] = useState<string | null>(null);
  const opponentVideoRef = useRef<HTMLVideoElement>(null);

  // Video Generation State
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [generatedIntroUrl, setGeneratedIntroUrl] = useState<string | null>(null);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [isVirtualCamera, setIsVirtualCamera] = useState(false);

  const activeStreamData = streams.find(s => s.id === currentStreamId);

  // Dynamic Virtual Studio Camera Stream generator for devices without physical webcam (High-Res 1080p FHD 60FPS)
  const createVirtualStudioStream = (user: User, width = 1920, height = 1080): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let frame = 0;
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&h=250';

    const renderVirtualFeed = () => {
      if (!ctx) return;
      frame++;

      // Ambient studio backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient dynamic glowing aura
      const orbs = [
        { x: width * 0.25 + Math.sin(frame * 0.015) * 80, y: height * 0.35 + Math.cos(frame * 0.02) * 50, r: 180, color: 'rgba(99, 102, 241, 0.22)' },
        { x: width * 0.75 + Math.cos(frame * 0.018) * 90, y: height * 0.65 + Math.sin(frame * 0.015) * 60, r: 220, color: 'rgba(236, 72, 153, 0.18)' },
        { x: width * 0.5 + Math.sin(frame * 0.022) * 60, y: height * 0.8 + Math.cos(frame * 0.01) * 40, r: 160, color: 'rgba(6, 182, 212, 0.2)' },
      ];
      orbs.forEach(orb => {
        const g = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.r);
        g.addColorStop(0, orb.color);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const cx = width / 2;
      const cy = height / 2 - 30;
      const pulse = Math.sin(frame * 0.05) * 6;
      const radius = 95 + pulse;

      // Outer glowing neon rings
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.75)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw avatar image or fallback
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (avatarImg.complete && avatarImg.naturalWidth > 0) {
        ctx.drawImage(avatarImg, cx - radius, cy - radius, radius * 2, radius * 2);
      } else {
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(user?.name ? user.name.slice(0, 2).toUpperCase() : 'YP', cx, cy);
      }
      ctx.restore();

      // Broadcaster Name & Studio Tag
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(user?.name || 'Broadcaster', cx, cy + radius + 55);

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`VIRTUAL STUDIO FEED • ID: ${user?.id ? user.id.slice(-8) : '88001001'}`, cx, cy + radius + 85);

      // Live animated audio equalizer wave
      const barCount = 22;
      const barW = 6;
      const barGap = 6;
      const totalW = barCount * (barW + barGap);
      const startX = cx - totalW / 2;
      for (let i = 0; i < barCount; i++) {
        const bh = 8 + Math.abs(Math.sin(frame * 0.12 + i * 0.35)) * 34;
        ctx.fillStyle = i % 2 === 0 ? '#6366f1' : '#ec4899';
        ctx.fillRect(startX + i * (barW + barGap), cy + radius + 115 - bh / 2, barW, bh);
      }
    };

    const timer = setInterval(renderVirtualFeed, 1000 / 60);
    renderVirtualFeed();

    let mediaStream: MediaStream;
    if ((canvas as any).captureStream) {
      mediaStream = (canvas as any).captureStream(60);
    } else if ((canvas as any).mozCaptureStream) {
      mediaStream = (canvas as any).mozCaptureStream(60);
    } else {
      mediaStream = new MediaStream();
    }

    // Add silent audio track for full stream compliance
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const dest = audioCtx.createMediaStreamDestination();
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        const track = dest.stream.getAudioTracks()[0];
        if (track) mediaStream.addTrack(track);
      }
    } catch (e) {}

    const vTrack = mediaStream.getVideoTracks()[0];
    if (vTrack) {
      const origStop = vTrack.stop.bind(vTrack);
      vTrack.stop = () => {
        clearInterval(timer);
        origStop();
      };
    }

    return mediaStream;
  };

  const activateVirtualCamera = () => {
    setIsVirtualCamera(true);
    setIsCameraOn(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const virtualStream = createVirtualStudioStream(currentUser);
      streamRef.current = virtualStream;
      if (videoRef.current) {
        videoRef.current.srcObject = virtualStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      initAR();
    } catch (err) {
      console.warn("Virtual camera fallback notice:", err);
    }
  };

  // Initialize Camera with automatic fallback to Virtual Studio Camera if hardware is absent
  const startCamera = async (forceVirtual = false) => {
    if (forceVirtual) {
      activateVirtualCamera();
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Camera API not available in this context, activating Virtual Studio Camera.");
        activateVirtualCamera();
        return;
      }

      let width, height;
      if (quality === '1080p') { width = 1920; height = 1080; }
      else if (quality === '720p') { width = 1280; height = 720; }
      else { width = 640; height = 360; }

      let stream: MediaStream;
      try {
        // Try ideal video + audio
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: width, min: 1280 }, height: { ideal: height, min: 720 }, frameRate: { ideal: frameRate, min: 30 } }, 
          audio: true 
        });
      } catch (e) {
        try {
          // Fallback 1: Basic video and audio
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e2) {
          try {
            // Fallback 2: Video only (no microphone)
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (e3: any) {
            // Fallback 3: No physical camera on this device or permission restricted -> Graceful Virtual Camera
            console.warn("No physical camera detected, activating Virtual Studio Camera feed:", e3?.message || e3);
            activateVirtualCamera();
            return;
          }
        }
      }

      setIsVirtualCamera(false);
      setIsCameraOn(true);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play().catch(e => console.warn("Play notice:", e));
        };
      }
      initAR();
    } catch (err: any) {
      console.warn("Camera access resolved to Virtual Studio Camera:", err?.message || err);
      activateVirtualCamera();
    }
  };

  // Initialize AR (MediaPipe Face Mesh)
  const initAR = async () => {
    if (faceMeshRef.current || isInitializingARRef.current) return;
    if (!window.FaceMesh) {
      setTimeout(initAR, 400);
      return;
    }

    isInitializingARRef.current = true;

    try {
      const mesh = new window.FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`
      });

      if (typeof mesh.initialize === 'function') {
        mesh.initialize().catch((e: any) => console.warn("FaceMesh init notice:", e));
      }

      mesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      mesh.onResults((results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const hasFace = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
        setFaceDetected(prev => (prev !== hasFace ? hasFace : prev));

        // 1. Render all real-time procedural AR masks, makeup, glimmers, and particles
        renderARFrame(
          ctx,
          results,
          canvas,
          video,
          arConfigRef.current,
          particlesRef.current,
          arMetricsRef.current,
          cooldownsRef.current
        );

        // 2. Render optional 2D headwear accessories with smooth crossfades
        const transition = arTransitionRef.current;
        const step = 0.1;
        if (transition.headwear.target !== transition.headwear.current) {
          transition.headwear.opacity -= step;
          if (transition.headwear.opacity <= 0) {
            transition.headwear.current = transition.headwear.target;
            transition.headwear.opacity = 0;
          }
        } else if (transition.headwear.current && transition.headwear.opacity < 1) {
          transition.headwear.opacity = Math.min(1, transition.headwear.opacity + step);
        }

        if (hasFace && transition.headwear.current && transition.headwear.opacity > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          const forehead = landmarks[10];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const hwConfig = HEADWEAR.find(h => h.id === activeHeadwear);
          const img = transition.headwear.current;

          const eyeDist = Math.hypot((rightEye.x - leftEye.x) * canvas.width, (rightEye.y - leftEye.y) * canvas.height);
          const angle = Math.atan2((rightEye.y - leftEye.y) * canvas.height, (rightEye.x - leftEye.x) * canvas.width);

          ctx.save();
          ctx.globalAlpha = transition.headwear.opacity;
          ctx.translate(forehead.x * canvas.width, forehead.y * canvas.height);
          ctx.rotate(angle);

          const scale = hwConfig?.scale || 2.2;
          const hwW = eyeDist * scale * 2.0;
          const hwH = hwW * (img.height / img.width);
          const yOffset = (hwConfig?.yOffset || -0.5) * hwH;

          ctx.drawImage(img, -hwW / 2, -hwH / 2 + yOffset, hwW, hwH);
          ctx.restore();
        }
      });

      faceMeshRef.current = mesh;
      setFaceMesh(mesh);

      // Safe Animation Loop ensuring no concurrent send calls
      let isFrameProcessing = false;
      const loop = async () => {
        if (
          videoRef.current && 
          videoRef.current.readyState >= 2 && 
          !videoRef.current.paused && 
          !isFrameProcessing && 
          faceMeshRef.current
        ) {
          isFrameProcessing = true;
          try {
            await mesh.send({ image: videoRef.current });
          } catch {
            // Silently ignore frame processing interruptions
          } finally {
            isFrameProcessing = false;
          }
        }
        arLoopRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.warn("MediaPipe FaceMesh notice:", err);
    } finally {
      isInitializingARRef.current = false;
    }
  };

  // Load Headwear Accessory Image
  useEffect(() => {
    const selected = HEADWEAR.find(h => h.id === activeHeadwear);
    if (selected && selected.url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selected.url;
      img.onload = () => {
        setHeadwearImage(img);
        arTransitionRef.current.headwear.target = img;
      };
    } else {
      setHeadwearImage(null);
      arTransitionRef.current.headwear.target = null;
    }
  }, [activeHeadwear]);

  const applyCameraConstraints = async () => {
      if (!streamRef.current || isVirtualCamera) return;
      
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
          let width, height;
          if (quality === '1080p') { width = 1920; height = 1080; }
          else if (quality === '720p') { width = 1280; height = 720; }
          else { width = 640; height = 360; }
          
          try {
              await videoTrack.applyConstraints({
                  width: { ideal: width },
                  height: { ideal: height },
                  frameRate: { ideal: frameRate }
              });
          } catch (e) {
              console.warn("Failed to apply video constraints", e);
          }
      }
  };

  useEffect(() => {
      applyCameraConstraints();
  }, [quality, frameRate]);

  useEffect(() => {
    startCamera();

    return () => {
      if (arLoopRef.current) cancelAnimationFrame(arLoopRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch {}
        faceMeshRef.current = null;
      }
      isInitializingARRef.current = false;
      if (currentStreamId) {
          endStream(currentStreamId);
          mediasoupService.stopBroadcasting();
      }
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
        setViewerCount(prev => Math.max(0, prev + (Math.random() > 0.5 ? 1 : -1)));
        
        // PK Battle Logic
        if (pkStatus === 'active') {
            setPkTimeLeft(prev => {
                const next = prev <= 1 ? 0 : prev - 1;
                if (prev <= 1) {
                    setPkStatus('ended');
                    if (currentStreamId) updateStream(currentStreamId, { pkStatus: 'ended', pkTimeLeft: 0 });
                } else if (currentStreamId && next % 5 === 0) {
                    // Sync every 5 seconds to reduce state updates
                    updateStream(currentStreamId, { pkTimeLeft: next });
                }
                return next;
            });
            // Simulate score updates
            if (Math.random() > 0.8) {
                setPkScores(prev => {
                    const next = {
                        host: prev.host + Math.floor(Math.random() * 100),
                        opponent: prev.opponent + Math.floor(Math.random() * 80)
                    };
                    if (currentStreamId) updateStream(currentStreamId, { pkScores: next });
                    return next;
                });
            }
        }

        if (Math.random() > 0.7) {
            const randomMsgs = ["Hi!", "Cool AR mask!", "Hello from Brazil!", "Amazing!", "😍😍", "Follow back?"];
            const randomNames = ["User123", "Fan_007", "CoolCat", "StreamerX"];
            // Use unique IDs for moderation
            const randomId = 'u-' + Math.floor(Math.random() * 1000000);
            const msg: ChatMessage = {
                id: Date.now().toString(), userId: randomId, userName: randomNames[Math.floor(Math.random() * randomNames.length)],
                text: randomMsgs[Math.floor(Math.random() * randomNames.length)], timestamp: Date.now()
            };
            setMessages(prev => [...prev.slice(-15), msg]);
        }
        if (Math.random() > 0.8) setSessionBeans(prev => prev + Math.floor(Math.random() * 50));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const toggleMute = () => {
      if (streamRef.current) {
          const audioTrack = streamRef.current.getAudioTracks()[0];
          if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!audioTrack.enabled); }
      }
  };

  const toggleCamera = () => {
      if (streamRef.current) {
          const videoTrack = streamRef.current.getVideoTracks()[0];
          if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsCameraOn(videoTrack.enabled); }
      }
  };

  const toggleRoomType = () => {
    if (roomType === 'public') setRoomType('private');
    else if (roomType === 'private') setRoomType('paid');
    else setRoomType('public');
  };

  const getRoomTypeIcon = () => {
      switch(roomType) { case 'private': return 'fa-lock'; case 'paid': return 'fa-gem'; default: return 'fa-lock-open'; }
  };
  
  const getRoomTypeColor = () => {
      switch(roomType) { case 'private': return 'bg-yellow-500'; case 'paid': return 'bg-orange-500'; default: return 'bg-black/20 hover:bg-white/20'; }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartStream = async () => {
      if (roomType === 'private' && (!streamPin || streamPin.length !== 8)) { alert("Please enter a valid 8-digit PIN for private stream."); return; }
      if (!streamTitle.trim()) { alert("Please enter a stream title."); return; }

      if (generatedIntroUrl) {
          setIsPlayingIntro(true);
          // actuallyStartStream will be called by onEnded of the intro video
      } else {
          actuallyStartStream();
      }
  };

  const actuallyStartStream = async () => {
      setIsLive(true);
      setViewerCount(1);
      setSessionBeans(0);
      
      const newStreamId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      setCurrentStreamId(newStreamId);

      await startStream({
          id: newStreamId,
          title: streamTitle,
          broadcaster: currentUser,
          viewerCount: 1,
          thumbnail: currentUser.avatar,
          category: streamCategory,
          country: currentUser.country || 'ID',
          quality: quality,
          startTime: Date.now(),
          mutedUserIds: [],
          kickedUserIds: [],
          isPrivate: roomType === 'private',
          pin: roomType === 'private' ? streamPin : undefined,
          entryFee: roomType === 'paid' ? entryFee : undefined
      });

      if (streamRef.current) {
          mediasoupService.startBroadcasting(newStreamId, streamRef.current);
      }

      if (streamMode === 'multi') {
          setGuestSeats(new Array(multiSeats).fill(null));
      }

      const modeText = streamMode === 'single' ? '' : streamMode === 'pk' ? 'PK Battle' : `Multi-Guest (${multiSeats})`;
      const roomTypeText = roomType === 'private' ? 'PRIVATE' : roomType === 'paid' ? `PAID (${entryFee}💎)` : '';
      const sysText = `You are now LIVE in ${quality} ${modeText ? `[${modeText}]` : ''}! ${roomTypeText ? `[${roomTypeText}]` : ''}`;
      
      setMessages([{ id: 'sys', userId: 'sys', userName: 'System', text: sysText, timestamp: Date.now(), isSystem: true }]);
  };

  const handleStopStream = async () => {
      setIsLive(false);
      setPkStatus('none');
      setPkOpponent(null);
      mediasoupService.stopBroadcasting();
      if(currentStreamId) { await endStream(currentStreamId); setCurrentStreamId(null); }
      onClose();
  };

  // Real-time Live Room Gift Reception & Host Salary Listener
  useEffect(() => {
    const handleHostGiftEvent = (e: any) => {
      const payload = e.detail;
      if (!payload) return;
      if (payload.receiverId === currentUser.id || payload.streamId === currentStreamId) {
        const giftObj = gifts.find(g => g.id === payload.giftId) || payload.gift || {
          id: payload.giftId,
          name: 'Special Gift',
          icon: '🎁',
          price: payload.totalCost / (payload.quantity || 1),
          beans: payload.beansEarned / (payload.quantity || 1)
        };

        const beansEarned = Number(payload.beansEarned || payload.totalCost || 0);
        setSessionBeans(prev => prev + beansEarned);
        setRecentSalaryGain(beansEarned);
        setTimeout(() => setRecentSalaryGain(null), 3000);

        const isAnim = giftObj.type === 'animated' || giftObj.category === 'Animated' || Boolean(giftObj.animationType);
        playGiftSound(isAnim ? 'luxury' : 'static');

        setHostGiftAnimation({
          gift: giftObj,
          count: payload.quantity || 1,
          sender: payload.senderName || 'A Supporter',
          beans: beansEarned
        });

        const giftMsg: ChatMessage = {
          id: `host_gift_${Date.now()}_${Math.random()}`,
          userId: payload.senderId,
          userName: payload.senderName,
          text: `🎉 Showered you with ${payload.quantity}x ${giftObj.name} ${giftObj.icon}! (+${beansEarned.toLocaleString()} 🫘 Beans added to your salary)`,
          timestamp: Date.now(),
          isSystem: true
        };
        setMessages(prev => [...prev.slice(-20), giftMsg]);

        setTimeout(() => {
          setHostGiftAnimation(null);
        }, isAnim ? 4800 : 3200);
      }
    };

    const handleHostLuckyBetEvent = (e: any) => {
      const payload = e.detail;
      if (payload && (payload.hostId === currentUser.id || payload.streamId === currentStreamId)) {
        playGiftSound('static');
        const betMsg: ChatMessage = {
          id: `lucky_${Date.now()}_${Math.random()}`,
          userId: payload.userId,
          userName: payload.userName || 'Supporter',
          text: `🎰 Played ${payload.betAmount} 💎 Lucky Bet! Host Salary Earned: +${(payload.hostBeansAwarded || 70).toLocaleString()} 🫘 Beans`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev.slice(-20), betMsg]);
      }
    };

    window.addEventListener('live_room_gift_event', handleHostGiftEvent);
    window.addEventListener('live_room_lucky_bet_event', handleHostLuckyBetEvent);
    return () => {
      window.removeEventListener('live_room_gift_event', handleHostGiftEvent);
      window.removeEventListener('live_room_lucky_bet_event', handleHostLuckyBetEvent);
    };
  }, [currentUser.id, currentStreamId, gifts]);

  const handleInvitePK = (user: User) => {
      setIsPkInviteModalOpen(false);
      setPkStatus('inviting');
      if (currentStreamId) updateStream(currentStreamId, { pkStatus: 'inviting' });
      setMessages(prev => [...prev, { id: Date.now().toString(), userId: 'sys', userName: 'System', text: `Inviting ${user.name} to PK Battle...`, timestamp: Date.now(), isSystem: true }]);
      
      // Simulate acceptance
      setTimeout(() => {
          const opponentStream = streams.find(s => s.broadcaster.id === user.id);
          const oppStreamId = opponentStream?.id || `mock-${user.id}`;
          
          setPkOpponent(user);
          setPkOpponentStreamId(oppStreamId);
          setPkStatus('active');
          setPkTimeLeft(300);
          setPkScores({ host: 0, opponent: 0 });
          if (currentStreamId) {
              updateStream(currentStreamId, { 
                  pkStatus: 'active', 
                  pkOpponent: user, 
                  pkTimeLeft: 300, 
                  pkScores: { host: 0, opponent: 0 } 
              });
          }
          setMessages(prev => [...prev, { id: Date.now().toString(), userId: 'sys', userName: 'System', text: `PK Battle Started with ${user.name}!`, timestamp: Date.now(), isSystem: true }]);
      }, 2000);
  };

  const handleEndPK = () => {
      setPkStatus('ended');
      if (currentStreamId) updateStream(currentStreamId, { pkStatus: 'ended' });
      setTimeout(() => {
          setPkStatus('none');
          setPkOpponent(null);
          if (currentStreamId) updateStream(currentStreamId, { pkStatus: 'none', pkOpponent: undefined });
      }, 5000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const { censoredText, isBlocked, detected } = violationSentinel.filterChatMessage(inputText);
    if (isBlocked) {
      alert(`⚠️ Message blocked: Contains prohibited language (${detected.join(', ')})`);
      return;
    }
    const msg: ChatMessage = { id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name, text: censoredText, timestamp: Date.now() };
    setMessages(prev => [...prev, msg]);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleScheduleSubmit = () => {
      if (!scheduleTitle || !scheduleTime) return;
      alert(`Stream scheduled: ${scheduleTitle} at ${new Date(scheduleTime).toLocaleString()}`);
      setIsScheduling(false);
      onClose();
  };

  const handleSeatClick = (index: number) => {
      if (pendingInvites[index]) return;
      setActiveSeatIndex(index);
      setIsInviteModalOpen(true);
  };

  const handleInviteGuest = (user: User) => {
      if (activeSeatIndex !== null) {
          setIsInviteModalOpen(false);
          setPendingInvites(prev => ({ ...prev, [activeSeatIndex]: user }));
          setMessages(prev => [...prev, { id: Date.now().toString(), userId: 'sys', userName: 'System', text: `Inviting ${user.name} to join...`, timestamp: Date.now(), isSystem: true }]);
          setTimeout(() => {
              const accepted = Math.random() > 0.1;
              if (accepted) {
                  setGuestSeats(prev => { const newSeats = [...prev]; newSeats[activeSeatIndex] = user; return newSeats; });
                  setMessages(prev => [...prev, { id: Date.now().toString(), userId: 'sys', userName: 'System', text: `${user.name} accepted!`, timestamp: Date.now(), isSystem: true }]);
              } else {
                  setMessages(prev => [...prev, { id: Date.now().toString(), userId: 'sys', userName: 'System', text: `${user.name} declined.`, timestamp: Date.now(), isSystem: true }]);
              }
              setPendingInvites(prev => { const newState = { ...prev }; delete newState[activeSeatIndex]; return newState; });
              setActiveSeatIndex(null);
          }, 2000);
      }
  };

  const handleKickGuest = () => {
      if (activeSeatIndex !== null) {
          const newSeats = [...guestSeats];
          const removedUser = newSeats[activeSeatIndex];
          newSeats[activeSeatIndex] = null;
          setGuestSeats(newSeats);
          setIsInviteModalOpen(false);
          setActiveSeatIndex(null);
          if (removedUser) setMessages(prev => [...prev, { id: Date.now().toString(), userId: 'sys', userName: 'System', text: `${removedUser.name} removed.`, timestamp: Date.now(), isSystem: true }]);
      }
  };

  const handleMessageClick = (msg: ChatMessage) => {
      if (msg.isSystem || msg.userId === currentUser.id) return;
      setSelectedUserForAction({ id: msg.userId, name: msg.userName });
  };

  const handleModerationAction = (action: 'mute' | 'kick' | 'pin' | 'follow') => {
      if (!currentStreamId || !selectedUserForAction) return;
      
      const targetUser = users.find(u => u.id === selectedUserForAction.id);
      
      switch(action) {
          case 'mute':
              if (targetUser?.vvipStatus === 'vip' || targetUser?.vvipStatus === 'svip') { 
                  alert(`Cannot mute ${selectedUserForAction.name} (VIP/SVIP)`); 
                  return; 
              }
              toggleMuteUserInStream(currentStreamId, selectedUserForAction.id);
              
              // We check the *previous* state to determine the message (sync happens next render)
              const wasMuted = activeStreamData?.mutedUserIds?.includes(selectedUserForAction.id);
              const muteStatusMsg = wasMuted ? 'unmuted' : 'muted';
              
              setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  userId: 'sys', 
                  userName: 'System', 
                  text: `${selectedUserForAction.name} has been ${muteStatusMsg}.`, 
                  timestamp: Date.now(), 
                  isSystem: true 
              }]);
              break;
              
          case 'kick':
              if (targetUser?.vvipStatus === 'svip') { 
                  alert(`Cannot kick ${selectedUserForAction.name} (SVIP)`); 
                  return; 
              }
              if (confirm(`Are you sure you want to kick ${selectedUserForAction.name} from the stream?`)) { 
                  kickUserFromStream(currentStreamId, selectedUserForAction.id); 
                  setMessages(prev => [...prev, { 
                      id: Date.now().toString(), 
                      userId: 'sys', 
                      userName: 'System', 
                      text: `${selectedUserForAction.name} has been kicked from the room.`, 
                      timestamp: Date.now(), 
                      isSystem: true 
                  }]); 
              }
              break;
              
          case 'pin':
              const lastMsg = [...messages].reverse().find(m => m.userId === selectedUserForAction.id);
              if (lastMsg) setPinnedMessage(lastMsg);
              break;
              
          case 'follow':
              toggleFollow(selectedUserForAction.id);
              break;
      }
      setSelectedUserForAction(null);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => { setShowEmojiPicker(false); }}>
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900">
          {/* Video Layer */}
          <div className={`w-full h-full flex ${pkStatus !== 'none' ? 'flex-row' : 'flex-col'}`}>
              <div className={`relative flex-1 h-full overflow-hidden ${pkStatus !== 'none' ? 'border-r border-white/10' : ''}`}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover transform scale-x-[-1] ${!isCameraOn ? 'hidden' : ''}`}
                    style={{ filter: `brightness(${1 + beautyFilters.whiten / 120}) contrast(${1 + (beautyFilters.smooth || 0) / 350}) saturate(${1 + (beautyFilters.rosy || 0) / 100 + (beautyFilters.smooth || 0) / 250})` }}
                  />
                  {/* AR Canvas Layer - Must exactly overlay video and be mirrored too */}
                  <canvas 
                    ref={canvasRef}
                    className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none ${!isCameraOn ? 'hidden' : ''}`}
                  />
                  {/* Live Room AI Sentinel: Auto-detects smoking, vaping, knife, drugs, fuck gesture */}
                  <LiveRoomViolationSentinel
                    streamId={currentStreamId || 'live_host_room'}
                    hostName={currentUser.name}
                    isHost={true}
                    videoRef={videoRef}
                    onForceTerminate={() => {
                      endStream();
                      onClose();
                    }}
                  />
                  {/* Real-time AI Face Tracking & AR Indicator */}
                  {isCameraOn && (activeMask !== 'none' || activeHeadwear !== 'none' || showNeuralHUD || lipstickColor !== 'none' || blushColor !== 'none' || eyeGlimmer) && (
                    <div className="absolute top-20 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-xl text-[10px] font-bold text-white pointer-events-none animate-fade-in">
                      <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                      <span>{activeMask !== 'none' ? (AR_MASKS.find(m => m.id === activeMask)?.name || activeMask) : 'AI AR Active'}</span>
                      {showNeuralHUD && <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-500/30">HUD</span>}
                      {eyeGlimmer && <span className="text-pink-300">✨</span>}
                    </div>
                  )}

                  {/* Virtual Studio Feed Indicator */}
                  {isCameraOn && isVirtualCamera && (
                    <div className="absolute top-20 right-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/40 shadow-xl text-[10px] font-bold text-white animate-fade-in">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-indigo-200 uppercase tracking-wider text-[9px]">Virtual Feed</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startCamera(false);
                        }}
                        className="px-2 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-[9px] font-bold text-white transition-colors"
                        title="Retry detecting physical webcam"
                      >
                        Webcam
                      </button>
                    </div>
                  )}
                  {!isCameraOn && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                          <div className="flex flex-col items-center animate-pulse">
                              <img src={currentUser.avatar} alt="avatar" className="w-24 h-24 rounded-full border-4 border-white/20 mb-4 object-cover" />
                              <p className="text-white/50 font-bold text-[10px] uppercase tracking-widest">Camera Off</p>
                          </div>
                      </div>
                  )}
                  {pkStatus !== 'none' && (
                      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-white font-black text-[10px] uppercase tracking-wider">YOU</span>
                      </div>
                  )}
              </div>

              {pkStatus !== 'none' && (
                  <div className="relative flex-1 h-full overflow-hidden bg-slate-800">
                      {pkOpponent && pkOpponentStreamId ? (
                          <RemoteStreamPlayer 
                            streamId={pkOpponentStreamId} 
                            className="w-full h-full"
                            placeholder={
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                    <img src={pkOpponent.avatar} className="w-full h-full object-cover opacity-50 blur-sm" alt="" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <img src={pkOpponent.avatar} className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-xl mb-4 object-cover" alt="" />
                                        <p className="text-white font-black text-sm uppercase tracking-widest">{pkOpponent.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                            <span className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">Connecting Stream...</span>
                                        </div>
                                    </div>
                                </div>
                            }
                          />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                              <p className="text-white/50 font-bold text-xs uppercase tracking-widest">Waiting for Opponent...</p>
                          </div>
                      )}
                      {pkOpponent && (
                          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 z-10">
                              <span className="text-white font-black text-[10px] uppercase tracking-wider">OPPONENT</span>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      {/* PK Score Bar */}
      {pkStatus !== 'none' && (
          <div className="absolute top-24 left-4 right-4 z-30 animate-fade-in-down">
              <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end px-2">
                      <div className="flex flex-col">
                          <span className="text-white font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{pkScores.host.toLocaleString()}</span>
                          <span className="text-white/60 text-[8px] font-bold uppercase tracking-tighter drop-shadow-md">My Score</span>
                      </div>
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 shadow-lg">
                          <i className="fa-solid fa-stopwatch text-rose-500 text-xs animate-pulse"></i>
                          <span className="text-white font-black text-xs font-mono">{Math.floor(pkTimeLeft / 60)}:{(pkTimeLeft % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className="text-white font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{pkScores.opponent.toLocaleString()}</span>
                          <span className="text-white/60 text-[8px] font-bold uppercase tracking-tighter drop-shadow-md">Opponent</span>
                      </div>
                  </div>
                  <div className="h-3 w-full bg-black/40 backdrop-blur-md rounded-full overflow-hidden border border-white/10 flex shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500" 
                        style={{ width: `${(pkScores.host / (pkScores.host + pkScores.opponent + 1)) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-500" 
                        style={{ width: `${(pkScores.opponent / (pkScores.host + pkScores.opponent + 1)) * 100}%` }}
                      />
                  </div>
              </div>
          </div>
      )}

      {!isLive && (
          <div className="absolute inset-0 z-40 flex flex-col bg-black/40 backdrop-blur-sm">
               <div className="flex justify-between items-start p-4 safe-top">
                   <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
                   <div className="flex gap-4">
                       <button onClick={() => setShowSettingsModal(true)} className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"><i className="fa-solid fa-gear"></i></div><span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Settings</span></button>
                       <button onClick={() => setShowBeautyMenu(true)} className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"><i className="fa-solid fa-wand-magic-sparkles"></i></div><span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Beauty</span></button>
                       <button onClick={toggleCamera} className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"><i className={`fa-solid ${isCameraOn ? 'fa-video' : 'fa-video-slash'}`}></i></div><span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Cam</span></button>
                       <button onClick={toggleRoomType} className="flex flex-col items-center gap-1"><div className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-colors ${getRoomTypeColor()}`}><i className={`fa-solid ${getRoomTypeIcon()}`}></i></div><span className="text-[10px] font-bold text-white shadow-black drop-shadow-md capitalize">{roomType}</span></button>
                   </div>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-6">
                   <div className="w-full max-w-sm bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                       <div className="flex items-center gap-4 mb-4">
                           <div className="relative"><img src={currentUser.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-white" alt="" /><div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white">HOST</div></div>
                           <div className="flex-1"><input type="text" value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} placeholder="Add a title to chat..." className="w-full bg-transparent text-white font-black text-xl placeholder:text-white/40 focus:outline-none" maxLength={50} /><div className="h-0.5 w-full bg-white/20 mt-2"></div></div>
                       </div>
                       <div className="flex items-center justify-between mb-4">
                           <button onClick={() => setShowVideoGenerator(true)} className={`px-4 py-2 rounded-xl border font-bold text-[10px] transition-all flex items-center gap-2 ${generatedIntroUrl ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}>
                               <i className="fa-solid fa-clapperboard"></i>
                               {generatedIntroUrl ? 'Intro Ready' : 'AI Intro'}
                           </button>
                           <div className="flex gap-2">
                               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tag:</span>
                               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{streamCategory}</span>
                           </div>
                       </div>
                       <div className="space-y-2"><span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Select Tag</span><div className="flex flex-wrap gap-2">{CATEGORIES.map(cat => (<button key={cat} onClick={() => setStreamCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${streamCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{cat}</button>))}</div></div>
                       {roomType === 'private' && (<div className="mt-4 pt-4 border-t border-white/10 animate-fade-in-up"><label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Set Room PIN (8 Digits)</label><div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 border border-white/10 focus-within:border-indigo-500 transition-colors"><i className="fa-solid fa-key text-white/50"></i><input type="text" maxLength={8} value={streamPin} onChange={(e) => setStreamPin(e.target.value.replace(/\D/g, ''))} placeholder="12345678" className="bg-transparent border-none text-white font-mono font-bold w-full focus:outline-none placeholder:text-white/20 tracking-widest" /></div></div>)}
                       {roomType === 'paid' && (<div className="mt-4 pt-4 border-t border-white/10 animate-fade-in-up"><label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Entry Fee (Diamonds)</label><div className="grid grid-cols-2 gap-3">{[500, 1000].map(fee => (<button key={fee} onClick={() => setEntryFee(fee)} className={`py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all border ${entryFee === fee ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}><i className="fa-solid fa-gem text-xs"></i>{fee}</button>))}</div></div>)}
                   </div>
               </div>

               <div className="p-8 safe-bottom flex flex-col items-center gap-6">
                   <div className="flex gap-6">
                       <button onClick={() => setStreamMode('single')} className={`flex flex-col items-center gap-1 transition-opacity ${streamMode === 'single' ? 'opacity-100' : 'opacity-50'}`}><div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${streamMode === 'single' ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/30'}`}><i className="fa-solid fa-user text-white text-lg"></i></div><span className="text-[10px] font-bold text-white uppercase tracking-widest">Video</span></button>
                       <button onClick={() => setStreamMode('multi')} className={`flex flex-col items-center gap-1 transition-opacity ${streamMode === 'multi' ? 'opacity-100' : 'opacity-50'}`}><div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${streamMode === 'multi' ? 'border-purple-500 bg-purple-500/20' : 'border-white/30'}`}><i className="fa-solid fa-users text-white text-lg"></i></div><span className="text-[10px] font-bold text-white uppercase tracking-widest">Multi-Guest</span></button>
                       <button onClick={() => setStreamMode('pk')} className={`flex flex-col items-center gap-1 transition-opacity ${streamMode === 'pk' ? 'opacity-100' : 'opacity-50'}`}><div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${streamMode === 'pk' ? 'border-rose-500 bg-rose-500/20' : 'border-white/30'}`}><i className="fa-solid fa-khanda text-white text-lg"></i></div><span className="text-[10px] font-bold text-white uppercase tracking-widest">PK Battle</span></button>
                   </div>
                   <button onClick={handleStartStream} className="w-full max-w-xs bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-transform">Go Live</button>
               </div>
          </div>
      )}

      {isLive && streamMode === 'multi' && (
          <div className="absolute top-20 right-4 w-20 flex flex-col gap-2 z-20">
              {guestSeats.map((guest, index) => {
                  const isPending = pendingInvites[index];
                  return (<button key={index} onClick={() => handleSeatClick(index)} className="w-20 h-20 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 overflow-hidden relative flex items-center justify-center hover:bg-black/60 transition-colors shadow-lg">
                        {guest ? (<><img src={guest.avatar} className="w-full h-full object-cover" alt={guest.name} /><div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white font-bold text-center py-0.5 truncate px-1">{guest.name}</div><div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div></>) : isPending ? (<div className="flex flex-col items-center justify-center h-full w-full bg-black/60 animate-pulse"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-1"></div><span className="text-[8px] font-bold text-white/80">Inviting...</span></div>) : (<div className="flex flex-col items-center gap-1 text-white/50"><i className="fa-solid fa-plus text-xl"></i><span className="text-[8px] font-bold uppercase">Seat {index + 1}</span></div>)}</button>);
              })}
          </div>
      )}
      
      {isLive && (
        <>
        {/* Full-Screen Host Live Room Gift Celebration Overlay */}
        {hostGiftAnimation && (
           <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden animate-in fade-in zoom-in duration-500">
             <div className="bg-black/85 backdrop-blur-2xl p-7 rounded-3xl flex flex-col items-center border border-amber-500/50 shadow-2xl max-w-md mx-4 text-center transform scale-110">
                <div className="text-amber-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-gift text-pink-400"></i>
                  <span>GIFT RECEIVED FROM SUPPORTER</span>
                </div>
                <div className="text-white font-bold text-sm">
                  <span className="text-pink-400 font-black">{hostGiftAnimation.sender}</span> showered you!
                </div>
                <div className="text-8xl my-3 filter drop-shadow-2xl animate-bounce">
                  {hostGiftAnimation.gift.icon}
                </div>
                <div className="text-yellow-400 font-black text-4xl italic drop-shadow-lg">
                  x{hostGiftAnimation.count}
                </div>
                <div className="text-white font-black text-xl uppercase tracking-wider mt-1">
                  {hostGiftAnimation.gift.name}
                </div>
                <div className="mt-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-2">
                  <span>🫘</span>
                  <span>+{hostGiftAnimation.beans.toLocaleString()} Beans Salary Earned!</span>
                </div>
             </div>
           </div>
        )}

        <div className="relative z-10 flex flex-col h-full safe-top safe-bottom p-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-black/30 backdrop-blur-md rounded-full p-1 pr-4 flex items-center gap-2 border border-white/10 shadow-sm pointer-events-auto mr-1">
                     <img src={currentUser.avatar} className="w-9 h-9 rounded-full border border-white" alt="avatar" />
                     <div className="flex flex-col justify-center"><h3 className="text-white text-xs font-bold max-w-[80px] truncate leading-none mb-0.5">{currentUser.name}</h3><span className="text-[9px] text-white/60 font-mono leading-none">ID: {currentUser.id}</span></div>
                     <div className="bg-indigo-500 rounded-full w-5 h-5 flex items-center justify-center ml-1"><i className="fa-solid fa-plus text-white text-[10px]"></i></div>
                  </div>

                  {/* FORCED HIGH RESOLUTION VIDEO HUD BADGE */}
                  <div className="hidden sm:flex bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full items-center gap-2 border border-emerald-500/40 text-[10px] font-mono font-black text-emerald-300 shadow-lg">
                     <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                     <span>1080p FHD 60FPS FORCED</span>
                  </div>

                  {/* HOST REAL-TIME BEANS SALARY EARNINGS METER */}
                  <div className="bg-gradient-to-r from-amber-950/80 to-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-amber-500/40 text-xs font-bold text-amber-300 shadow-lg">
                     <span className="text-sm">🫘</span>
                     <span>{((currentUser.beans || 0) + sessionBeans).toLocaleString()} Salary</span>
                     {recentSalaryGain && (
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                          +{recentSalaryGain}
                        </span>
                     )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setShowViewerList(true)} className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white border border-white/10 mr-2 hover:bg-black/40 transition-colors">
                         <i className="fa-solid fa-users text-[10px]"></i>
                         <span className="text-xs font-bold">{viewerCount}</span>
                    </button>
                    <div className="hidden sm:flex bg-red-500/80 backdrop-blur-md px-3 py-1 rounded-full items-center gap-2 shadow-lg shadow-red-500/20"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div><span className="text-white font-bold text-xs uppercase tabular-nums">{formatDuration(duration)}</span></div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors cursor-pointer" title="Minimize Live Room to Home"><i className="fa-solid fa-chevron-down text-lg"></i></button>
                    <button onClick={handleStopStream} className="w-10 h-10 rounded-full bg-rose-600/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-700 transition-colors cursor-pointer" title="End Broadcast"><i className="fa-solid fa-power-off text-base"></i></button>
                </div>
            </div>
            
            {showDashboard && (
                <div className="absolute top-20 left-4 right-4 bg-black/70 backdrop-blur-xl rounded-3xl p-5 text-white border border-white/10 animate-fade-in-up z-30 shadow-2xl">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-black text-lg flex items-center gap-2"><i className="fa-solid fa-chart-pie text-indigo-500"></i> Stream Dashboard</h3><div className="bg-green-500/20 px-2 py-1 rounded-lg border border-green-500/50 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-green-400 text-[10px] font-bold uppercase">Excellent</span></div></div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><i className="fa-regular fa-clock text-4xl"></i></div><span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Duration</span><span className="text-2xl font-black font-mono tracking-widest">{formatDuration(duration)}</span></div>
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><i className="fa-solid fa-users text-4xl"></i></div><span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Viewers</span><span className="text-2xl font-black">{viewerCount}</span></div>
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 col-span-2 relative overflow-hidden bg-gradient-to-r from-orange-900/40 to-red-900/40"><div className="absolute top-0 right-0 p-2 opacity-10"><i className="fa-solid fa-sack-dollar text-4xl"></i></div><span className="text-orange-200 text-[10px] font-bold uppercase tracking-wider mb-1">Session Earnings (Beans)</span><div className="flex items-center gap-2"><i className="fa-solid fa-sack-dollar text-orange-400"></i><span className="text-2xl font-black">{sessionBeans}</span></div></div>
                    </div>
                    <div className="text-center"><button onClick={() => setShowDashboard(false)} className="text-xs font-bold text-slate-400 hover:text-white">Close Dashboard</button></div>
                </div>
            )}

            <div className="mt-auto pt-4 space-y-2">
                 <div className="h-40 overflow-y-auto mask-image-linear-gradient space-y-2 flex flex-col justify-end no-scrollbar" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}>{messages.map(msg => (<div key={msg.id} onClick={() => handleMessageClick(msg)} className={`self-start px-3 py-1.5 rounded-2xl text-white text-sm max-w-[85%] break-words bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 ${msg.isSystem ? 'border border-indigo-500/30 bg-indigo-900/30' : ''}`}><span className={`font-bold mr-2 text-xs opacity-75 ${msg.isSystem ? 'text-indigo-400' : 'text-white/70'}`}>{msg.userName}:</span>{msg.text}</div>))}</div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => {
                        if (streamMode === 'pk' && pkStatus === 'none') {
                            setIsPkInviteModalOpen(true);
                        } else {
                            setShowDashboard(!showDashboard);
                        }
                    }} className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center text-white border border-white/10 shrink-0 ${streamMode === 'pk' && pkStatus === 'none' ? 'bg-rose-600 animate-pulse' : 'bg-black/40'}`}>
                        <i className={`fa-solid ${streamMode === 'pk' && pkStatus === 'none' ? 'fa-khanda' : 'fa-chart-line'}`}></i>
                    </button>
                    <div className="flex-1 backdrop-blur-md rounded-full px-1 py-1 flex items-center bg-black/40 border border-white/10">
                        <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} onFocus={() => setShowEmojiPicker(false)} placeholder="Say something..." className="bg-transparent border-none focus:outline-none text-white text-sm px-3 w-full placeholder:text-white/50" />
                        <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showEmojiPicker ? 'text-indigo-400' : 'text-white/70 hover:text-white'}`}><i className="fa-solid fa-face-smile"></i></button>
                        <button onClick={handleSendMessage} className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20"><i className="fa-solid fa-paper-plane text-xs"></i></button>
                    </div>
                    <button onClick={toggleMute} className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0 ${isMuted ? 'bg-red-500 text-white' : 'bg-black/40 text-white'}`}><i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i></button>
                    <button onClick={toggleCamera} className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0 ${!isCameraOn ? 'bg-red-500 text-white' : 'bg-black/40 text-white'}`}><i className={`fa-solid ${!isCameraOn ? 'fa-video-slash' : 'fa-video'}`}></i></button>
                    <button onClick={() => setShowBeautyMenu(true)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shrink-0"><i className="fa-solid fa-wand-magic-sparkles"></i></button>
                 </div>
                 {showEmojiPicker && (
                    <div className="absolute bottom-16 left-4 right-4 z-50 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-3 shadow-2xl">
                            <div className="flex justify-between items-center mb-2 px-1 border-b border-white/5 pb-2">
                                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Emoticons</span>
                                <button onClick={() => setShowEmojiPicker(false)} className="text-white/50 hover:text-white"><i className="fa-solid fa-chevron-down"></i></button>
                            </div>
                            <EmojiPicker onSelect={(emoji) => setInputText(prev => prev + emoji)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
      )}

      {selectedUserForAction && (
             <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
                 <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6">
                     <div className="flex justify-between items-center mb-6"><div><h3 className="font-black text-slate-900 text-lg">{selectedUserForAction.name}</h3><p className="text-xs text-slate-500 font-bold uppercase">Select Action</p></div><button onClick={() => setSelectedUserForAction(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button></div>
                     <div className="grid grid-cols-4 gap-2">
                         <button onClick={() => handleModerationAction('pin')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all"><div className="w-9 h-9 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><i className="fa-solid fa-thumbtack text-sm"></i></div><span className="text-[10px] font-bold text-slate-700">Pin</span></button>
                         <button onClick={() => handleModerationAction('follow')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all"><div className={`w-9 h-9 rounded-full flex items-center justify-center ${followedUserIds.includes(selectedUserForAction.id) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}><i className={`fa-solid ${followedUserIds.includes(selectedUserForAction.id) ? 'fa-user-check' : 'fa-user-plus'} text-sm`}></i></div><span className="text-[10px] font-bold text-slate-700">{followedUserIds.includes(selectedUserForAction.id) ? 'Unfollow' : 'Follow'}</span></button>
                         <button onClick={() => handleModerationAction('mute')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all"><div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeStreamData?.mutedUserIds?.includes(selectedUserForAction.id) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}><i className={`fa-solid ${activeStreamData?.mutedUserIds?.includes(selectedUserForAction.id) ? 'fa-microphone' : 'fa-microphone-slash'} text-sm`}></i></div><span className="text-[10px] font-bold text-slate-700">{activeStreamData?.mutedUserIds?.includes(selectedUserForAction.id) ? 'Unmute' : 'Mute'}</span></button>
                         <button onClick={() => handleModerationAction('kick')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-red-50 active:scale-95 transition-all"><div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><i className="fa-solid fa-user-xmark text-sm"></i></div><span className="text-[10px] font-bold text-slate-700">Kick</span></button>
                     </div>
                 </div>
             </div>
        )}

        {showViewerList && (
            <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
                <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 max-h-[70%] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-900 text-lg">Viewers ({viewerCount})</h3>
                        <button onClick={() => setShowViewerList(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        {users.filter(u => u.id !== currentUser.id).map(user => (
                        <div key={user.id} onClick={() => { setShowViewerList(false); setSelectedUserForAction({id: user.id, name: user.name}); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                                <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                                <div className="text-[10px] text-slate-500">Level {user.level}</div>
                            </div>
                            {/* Status indicators */}
                            {activeStreamData?.mutedUserIds?.includes(user.id) && <i className="fa-solid fa-microphone-slash text-red-500 text-xs"></i>}
                            {activeStreamData?.kickedUserIds?.includes(user.id) && <span className="text-[10px] font-bold text-red-500 uppercase">Kicked</span>}
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {isScheduling && (
             <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center px-4 animate-fade-in-up">
                 <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative">
                     <button onClick={() => setIsScheduling(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button>
                     <h2 className="text-xl font-black text-slate-900 mb-6 text-center">Schedule Stream</h2>
                     <div className="space-y-4 mb-6">
                         <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Title</label><input type="text" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} placeholder="What are you streaming?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500" /></div>
                         <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label><select value={scheduleCategory} onChange={(e) => setScheduleCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"><option>Chat</option><option>Gaming</option><option>Music</option><option>Dance</option><option>Art</option></select></div>
                         <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Start Time</label><input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500" /></div>
                     </div>
                     <button onClick={handleScheduleSubmit} disabled={!scheduleTitle || !scheduleTime} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">Schedule Stream</button>
                 </div>
             </div>
        )}
        
        {isInviteModalOpen && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
                <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 max-h-[80%] flex flex-col">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-black text-slate-900 text-lg">{activeSeatIndex !== null && guestSeats[activeSeatIndex] ? 'Manage Guest' : 'Invite Guest'}</h3><button onClick={() => setIsInviteModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><i className="fa-solid fa-xmark"></i></button></div>
                    {activeSeatIndex !== null && guestSeats[activeSeatIndex] ? (
                        <div className="space-y-4"><div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl"><img src={guestSeats[activeSeatIndex]!.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mb-2" alt="guest" /><h4 className="font-bold text-lg text-slate-900">{guestSeats[activeSeatIndex]!.name}</h4><div className="text-xs text-slate-500 font-bold uppercase">Guest Seat {activeSeatIndex + 1}</div></div><div className="grid grid-cols-2 gap-3"><button className="py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center gap-2"><i className="fa-solid fa-microphone-slash"></i> Mute</button><button onClick={handleKickGuest} className="py-3 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center gap-2"><i className="fa-solid fa-user-xmark"></i> Kick</button></div></div>
                    ) : (<div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Online Users</div>{users.filter(u => u.id !== currentUser.id).map(user => (<button key={user.id} onClick={() => handleInviteGuest(user)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-indigo-100"><div className="relative"><img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt="avatar" /><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div></div><div className="flex-1 text-left"><h4 className="font-bold text-sm text-slate-900">{user.name}</h4><div className="flex items-center gap-2 text-[10px]"><span className="text-slate-500">Lv.{user.level}</span><span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">Online</span></div></div><div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-plus"></i></div></button>))}</div>)}
                </div>
            </div>
        )}

        {showBeautyMenu && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center animate-fade-in-up">
                <div className="bg-slate-900/95 w-full max-w-md rounded-t-3xl p-5 border-t border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
                    {/* Header & Tabs */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white flex items-center gap-1.5">
                                <i className="fa-solid fa-wand-magic-sparkles text-pink-400"></i>
                                AR & Beauty Studio
                            </span>
                            {faceDetected && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    Tracking
                                </span>
                            )}
                        </div>
                        <button onClick={() => setShowBeautyMenu(false)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                            <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 border-b border-white/10 pb-2 mb-4 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveEffectTab('masks')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeEffectTab === 'masks' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <span>🎭</span> AR Masks
                        </button>
                        <button
                            onClick={() => setActiveEffectTab('makeup')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeEffectTab === 'makeup' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <span>💄</span> Makeup
                        </button>
                        <button
                            onClick={() => setActiveEffectTab('beauty')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeEffectTab === 'beauty' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <span>✨</span> Beauty
                        </button>
                        <button
                            onClick={() => setActiveEffectTab('reactions')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeEffectTab === 'reactions' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <span>💥</span> AI Reactions
                        </button>
                        <button
                            onClick={() => setActiveEffectTab('neural')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeEffectTab === 'neural' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <span>⚡</span> Neural HUD
                        </button>
                    </div>

                    {/* Tab Contents */}
                    <div className="overflow-y-auto max-h-[46vh] pr-1 space-y-4 custom-scrollbar">
                        {/* 1. AR Masks Tab */}
                        {activeEffectTab === 'masks' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2.5">
                                    {AR_MASKS.map(mask => {
                                        const isSelected = activeMask === mask.id;
                                        return (
                                            <button
                                                key={mask.id}
                                                onClick={() => setActiveMask(mask.id)}
                                                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${
                                                    isSelected
                                                        ? 'bg-gradient-to-b from-pink-500/20 to-purple-500/20 border-pink-500 shadow-lg shadow-pink-500/20 scale-105'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                                                }`}
                                            >
                                                {mask.badge && (
                                                    <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-pink-500/80 text-white">
                                                        {mask.badge}
                                                    </span>
                                                )}
                                                <span className="text-3xl mb-1 filter drop-shadow-md">{mask.icon}</span>
                                                <span className="text-[11px] font-bold text-white text-center">{mask.name}</span>
                                                <span className="text-[9px] text-white/50 text-center line-clamp-1">{mask.description}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Optional Headwear Accessories */}
                                <div className="pt-2 border-t border-white/10">
                                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-2">2D Headwear Accessories</span>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {HEADWEAR.map(hw => (
                                            <button
                                                key={hw.id}
                                                onClick={() => setActiveHeadwear(hw.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                                                    activeHeadwear === hw.id
                                                        ? 'bg-pink-500/20 border-pink-500 text-white'
                                                        : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="text-lg">{hw.icon}</span>
                                                <span>{hw.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Makeup Tab */}
                        {activeEffectTab === 'makeup' && (
                            <div className="space-y-4">
                                {/* Lipstick Section */}
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                            <span>💄</span> Virtual Lip Color
                                        </div>
                                        {lipstickColor !== 'none' && (
                                            <span className="text-[10px] font-bold text-pink-400">{lipstickOpacity}% Opacity</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
                                        {LIPSTICK_SHADES.map(shade => (
                                            <button
                                                key={shade.id}
                                                onClick={() => setLipstickColor(shade.id)}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border shrink-0 transition-all ${
                                                    lipstickColor === shade.id
                                                        ? 'bg-pink-500/20 border-pink-500 shadow-md'
                                                        : 'bg-black/30 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <span
                                                    className="w-7 h-7 rounded-full border border-white/20 shadow-inner flex items-center justify-center text-xs"
                                                    style={{ backgroundColor: shade.color === 'transparent' ? '#334155' : shade.color }}
                                                >
                                                    {shade.preview}
                                                </span>
                                                <span className="text-[10px] text-white/80 font-bold">{shade.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {lipstickColor !== 'none' && (
                                        <input
                                            type="range"
                                            min="20"
                                            max="100"
                                            value={lipstickOpacity}
                                            onChange={(e) => setLipstickOpacity(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                    )}
                                </div>

                                {/* Cheek Blush Section */}
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                            <span>🌸</span> Soft Cheek Blush
                                        </div>
                                        {blushColor !== 'none' && (
                                            <span className="text-[10px] font-bold text-pink-400">{blushOpacity}% Opacity</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
                                        {BLUSH_SHADES.map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => setBlushColor(b.id)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 transition-all ${
                                                    blushColor === b.id
                                                        ? 'bg-pink-500/20 border-pink-500 text-white'
                                                        : 'bg-black/30 border-white/10 text-white/70 hover:border-white/20'
                                                }`}
                                            >
                                                <span
                                                    className="w-4 h-4 rounded-full border border-white/20"
                                                    style={{ backgroundColor: b.color === 'transparent' ? '#334155' : b.color }}
                                                ></span>
                                                <span className="text-[11px] font-bold">{b.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {blushColor !== 'none' && (
                                        <input
                                            type="range"
                                            min="15"
                                            max="90"
                                            value={blushOpacity}
                                            onChange={(e) => setBlushOpacity(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                    )}
                                </div>

                                {/* Anime Iris Sparkles Toggle */}
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <span>✨</span> Anime Iris Sparkles
                                        </div>
                                        <div className="text-[10px] text-white/50">Adds animated starry glimmer to eye pupils</div>
                                    </div>
                                    <button
                                        onClick={() => setEyeGlimmer(!eyeGlimmer)}
                                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${eyeGlimmer ? 'bg-pink-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${eyeGlimmer ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. Beauty Sliders Tab */}
                        {activeEffectTab === 'beauty' && (
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
                                <div>
                                    <div className="flex justify-between text-white text-xs font-bold mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <i className="fa-solid fa-sparkles text-pink-400"></i> Skin Smoothness
                                        </span>
                                        <span className="text-pink-400">{beautyFilters.smooth}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={beautyFilters.smooth}
                                        onChange={(e) => setBeautyFilters({ ...beautyFilters, smooth: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-white text-xs font-bold mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <i className="fa-solid fa-sun text-yellow-400"></i> Whiten & Radiance
                                        </span>
                                        <span className="text-pink-400">{beautyFilters.whiten}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={beautyFilters.whiten}
                                        onChange={(e) => setBeautyFilters({ ...beautyFilters, whiten: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-white text-xs font-bold mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <i className="fa-solid fa-heart text-rose-400"></i> Rosy Glow
                                        </span>
                                        <span className="text-pink-400">{beautyFilters.rosy || 0}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={beautyFilters.rosy || 0}
                                        onChange={(e) => setBeautyFilters({ ...beautyFilters, rosy: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={() => setBeautyFilters({ smooth: 0, whiten: 0, rosy: 0 })}
                                        className="text-[10px] font-bold text-white/50 hover:text-white transition-colors"
                                    >
                                        Reset to Natural
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 4. AI Reactions Tab */}
                        {activeEffectTab === 'reactions' && (
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <span>💥</span> Real-time AI Expression Bursts
                                        </div>
                                        <div className="text-[10px] text-white/50">Triggers dynamic particle physics on facial gestures</div>
                                    </div>
                                    <button
                                        onClick={() => setAiReactionsEnabled(!aiReactionsEnabled)}
                                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${aiReactionsEnabled ? 'bg-pink-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${aiReactionsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>

                                {aiReactionsEnabled && (
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-3">
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">Select Burst Style</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {REACTION_BURSTS.map(burst => (
                                                <button
                                                    key={burst.id}
                                                    onClick={() => setReactionBurstType(burst.id as any)}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                                        reactionBurstType === burst.id
                                                            ? 'bg-pink-500/20 border-pink-500 text-white'
                                                            : 'bg-black/30 border-white/10 text-white/70 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="text-xl">{burst.icon}</span>
                                                    <span>{burst.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5 text-[10px] text-white/70">
                                            <div className="font-bold text-pink-400">✨ How to trigger AI reactions:</div>
                                            <div>😮 <b>Open mouth wide</b>: Launches a fountain of burst particles!</div>
                                            <div>😄 <b>Big smile</b>: Emits celebratory golden star sparkles!</div>
                                            <div>😉 <b>Wink eye</b>: Shoots a starburst from your winking eye!</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Neural HUD Tab */}
                        {activeEffectTab === 'neural' && (
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <i className="fa-solid fa-microchip text-emerald-400"></i> AI Neural Mesh HUD
                                        </div>
                                        <div className="text-[10px] text-white/50">Overlay 478-point live wireframe & face telemetry</div>
                                    </div>
                                    <button
                                        onClick={() => setShowNeuralHUD(!showNeuralHUD)}
                                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${showNeuralHUD ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showNeuralHUD ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>

                                <div className="bg-black/40 rounded-2xl p-3.5 border border-emerald-500/20 space-y-2 font-mono text-[10px]">
                                    <div className="flex justify-between items-center text-emerald-400 font-bold border-b border-white/5 pb-1.5">
                                        <span>⚡ REAL-TIME BIOMETRICS</span>
                                        <span className="animate-pulse">● LIVE 60 FPS</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-white/80 pt-1">
                                        <div>Model: <span className="text-emerald-300 font-bold">MediaPipe 3D</span></div>
                                        <div>Confidence: <span className="text-emerald-300 font-bold">99.8%</span></div>
                                        <div>Landmarks: <span className="text-emerald-300 font-bold">478 Points</span></div>
                                        <div>Status: <span className={faceDetected ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>{faceDetected ? 'Locked' : 'Searching'}</span></div>
                                    </div>
                                    <div className="text-white/50 text-[9px] pt-1">
                                        Renders live facial geometry, rotation pitch/yaw/roll telemetry, and expression gauges directly onto stream canvas.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        {isPkInviteModalOpen && (
            <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
                <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 max-h-[80%] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-900 text-lg">Invite PK Opponent</h3>
                        <button onClick={() => setIsPkInviteModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Online Streamers</div>
                        {users.filter(u => u.id !== currentUser.id).map(user => (
                            <button key={user.id} onClick={() => handleInvitePK(user)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-rose-100">
                                <div className="relative">
                                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt="avatar" />
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-sm text-slate-900">{user.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-slate-500">Lv.{user.level}</span>
                                        <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">Streaming</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="fa-solid fa-khanda"></i>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {showSettingsModal && (
            <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
                <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 max-h-[80%] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-slate-900 text-lg">Stream Settings</h3>
                        <button onClick={() => setShowSettingsModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Resolution</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['360p', '720p', '1080p'].map(res => (
                                    <button key={res} onClick={() => setQuality(res as any)} className={`py-2 rounded-xl font-bold text-sm transition-all border ${quality === res ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                        {res}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Frame Rate</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[15, 30, 60].map(fps => (
                                    <button key={fps} onClick={() => setFrameRate(fps)} className={`py-2 rounded-xl font-bold text-sm transition-all border ${frameRate === fps ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                        {fps} FPS
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Video Bitrate (kbps)</label>
                            <input type="range" min="500" max="6000" step="500" value={videoBitrate} onChange={(e) => setVideoBitrate(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                                <span>500</span>
                                <span>{videoBitrate} kbps</span>
                                <span>6000</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Audio Bitrate (kbps)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[64, 128, 256].map(br => (
                                    <button key={br} onClick={() => setAudioBitrate(br)} className={`py-2 rounded-xl font-bold text-sm transition-all border ${audioBitrate === br ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                        {br}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isPlayingIntro && generatedIntroUrl && (
            <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center">
                <video 
                    src={generatedIntroUrl} 
                    autoPlay 
                    className="w-full h-full object-cover"
                    onEnded={() => {
                        setIsPlayingIntro(false);
                        actuallyStartStream();
                    }}
                />
                <div className="absolute bottom-10 left-0 right-0 text-center">
                    <p className="text-white/50 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">Starting Stream...</p>
                </div>
            </div>
        )}

        {showVideoGenerator && (
            <VideoGenerator 
                onVideoGenerated={(url) => {
                    setGeneratedIntroUrl(url);
                    setShowVideoGenerator(false);
                }}
                onClose={() => setShowVideoGenerator(false)}
            />
        )}
    </div>
  );
}
