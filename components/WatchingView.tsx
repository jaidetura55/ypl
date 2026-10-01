
import React, { useState, useEffect, useRef } from 'react';
import { Stream, User, ChatMessage, Gift, HighValueGiftAlert } from '../types';
import EmojiPicker from './EmojiPicker';
import PublicProfileModal from './PublicProfileModal';
import RemoteStreamPlayer from './RemoteStreamPlayer';
import WalletTopupModal from './WalletTopupModal';
import HighValueGiftAlertOverlay from './HighValueGiftAlertOverlay';
import { useData } from '../contexts/DataContext';
import { mediasoupService } from '../services/streamService';
import LiveRoomViolationSentinel from './LiveRoomViolationSentinel';
import violationSentinel from '../services/violationSentinelService';

interface WatchingViewProps {
  stream: Stream;
  currentUser: User;
  onClose: () => void;
  onFollow: (id: string) => void;
}

const GIFT_CATEGORIES = ['All', 'Static', 'Animated', 'VIP'];
const MULTIPLIERS = [1, 5, 10, 20, 50, 66, 99, 100, 520, 1314];

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

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

const playLuckySound = (type: 'win' | 'lose' | 'spin') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    if (type === 'spin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {}
};

export default function WatchingView({ stream, currentUser, onClose, onFollow }: WatchingViewProps) {
  const { streams, followedUserIds, toggleFollow, sendGift, gifts, addToHistory, users, topUpDiamonds, sendLuckyBet, economySettings } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [activeGiftTab, setActiveGiftTab] = useState('All');
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const [multiplier, setMultiplier] = useState(1);
  const [showMultiplierSelect, setShowMultiplierSelect] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{gift: Gift, count: number, sender: string} | null>(null);

  // Real-Time High-Value Diamond Gift Overlay Alert System
  const [highValueAlert, setHighValueAlert] = useState<HighValueGiftAlert | null>(null);
  const [highValueQueue, setHighValueQueue] = useState<HighValueGiftAlert[]>([]);
  const processedGiftAlertIdsRef = useRef<Set<string>>(new Set());

  // Global Whale Ticker State (for major diamond drops across the platform)
  const [globalWhaleTicker, setGlobalWhaleTicker] = useState<{
    id: string;
    senderName: string;
    receiverName: string;
    giftName: string;
    giftIcon: string;
    totalCost: number;
  } | null>(null);

  const triggerHighValueAlert = (alertData: HighValueGiftAlert) => {
    if (processedGiftAlertIdsRef.current.has(alertData.id)) return;
    processedGiftAlertIdsRef.current.add(alertData.id);
    if (processedGiftAlertIdsRef.current.size > 200) {
      const first = processedGiftAlertIdsRef.current.values().next().value;
      if (first) processedGiftAlertIdsRef.current.delete(first);
    }

    setHighValueAlert(current => {
      if (!current) {
        return alertData;
      } else {
        setHighValueQueue(prev => [...prev, alertData]);
        return current;
      }
    });
  };

  const handleDismissHighValueAlert = () => {
    setHighValueAlert(null);
    setHighValueQueue(prev => {
      if (prev.length > 0) {
        const [nextAlert, ...rest] = prev;
        setTimeout(() => setHighValueAlert(nextAlert), 150);
        return rest;
      }
      return [];
    });
  };

  const handleCheerFromAlert = (cheerText: string) => {
    const msg: ChatMessage = {
      id: `cheer_${Date.now()}_${Math.random()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: cheerText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev.slice(-15), msg]);
  };

  // Lucky Bet System State
  const [showLuckyModal, setShowLuckyModal] = useState(false);
  const [luckyBetAmount, setLuckyBetAmount] = useState<number>(100);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const [isSpinningLucky, setIsSpinningLucky] = useState(false);
  const [lastLuckyResult, setLastLuckyResult] = useState<any>(null);
  const [luckyWinBanner, setLuckyWinBanner] = useState<string | null>(null);

  // Lucky session elapsed ticker (over 3min or 5min)
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionElapsedSeconds(prev => {
        const totalSec = (economySettings?.luckySessionMinutes || 3) * 60;
        return (prev + 1) % (totalSec + 1);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [economySettings?.luckySessionMinutes]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [duration, setDuration] = useState(Math.floor(Math.random() * 3600) + 300); 

  // Follow Toast Notification State
  const [followToast, setFollowToast] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const toastTimerRef = useRef<any>(null);

  const triggerFollowToast = (name: string, avatar?: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setFollowToast({
      id: Date.now().toString(),
      name,
      avatar
    });
    toastTimerRef.current = setTimeout(() => {
      setFollowToast(null);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const liveStreamData = streams.find(s => s.id === stream.id) || stream;
  const isMuted = liveStreamData.mutedUserIds?.includes(currentUser.id);
  const isKicked = liveStreamData.kickedUserIds?.includes(currentUser.id);
  const isFollowing = followedUserIds.includes(liveStreamData.broadcaster.id);

  useEffect(() => {
      if (gifts.length > 0 && !selectedGiftId) {
          setSelectedGiftId(gifts[0].id);
      }
  }, [gifts, selectedGiftId]);

  // Initialize WebRTC via Mediasoup
  useEffect(() => {
      // Add to viewing history
      addToHistory(stream);

      // Stream.id should now be a numeric string
      mediasoupService.joinStream(stream.id, (track) => {
          if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = track;
          }
      });

      return () => {
          mediasoupService.leaveStream();
      };
  }, [stream.id]);

  useEffect(() => {
      if (isKicked) {
          alert("You have been kicked from this stream.");
          onClose();
      }
  }, [isKicked, onClose]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
      if (Math.random() > 0.6) {
        const randomMsgs = ["Wow!", "Awesome content", "❤️❤️", "Nice vibe"];
        const randomNames = ["Viewer1", "Fan23", "Guest_99", "Traveler"];
        const msg: ChatMessage = { id: Date.now().toString() + Math.random(), userId: 'random', userName: randomNames[Math.floor(Math.random() * randomNames.length)], text: randomMsgs[Math.floor(Math.random() * randomMsgs.length)], timestamp: Date.now() };
        setMessages(prev => [...prev.slice(-10), msg]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (giftAnimation) {
      const isAnimated = giftAnimation.gift.type === 'animated' || giftAnimation.gift.category === 'Animated' || Boolean(giftAnimation.gift.animationType);
      playGiftSound(isAnimated ? 'luxury' : 'static');
    }
  }, [giftAnimation]);

  // Real-time live room gift events
  useEffect(() => {
    const handleLiveGiftEvent = (e: any) => {
      const payload = e.detail;
      if (!payload) return;
      const isTargetRoom = payload.receiverId === liveStreamData.broadcaster.id || payload.streamId === stream.id;

      const giftObj = gifts.find(g => g.id === payload.giftId) || payload.gift || {
        id: payload.giftId,
        name: 'Special Gift',
        icon: '🎁',
        price: (payload.totalCost || 100) / (payload.quantity || 1),
        beans: (payload.beansEarned || payload.totalCost || 100) / (payload.quantity || 1)
      };

      const quantity = Number(payload.quantity) || 1;
      const totalDiamondCost = Number(payload.totalCost) || (giftObj.price * quantity);
      const hostBeansSalary = Number(payload.beansEarned) || (giftObj.beans ? giftObj.beans * quantity : Math.round(totalDiamondCost * 0.7));

      if (isTargetRoom) {
        const isAnim = giftObj.type === 'animated' || giftObj.category === 'Animated' || Boolean(giftObj.animationType);
        playGiftSound(isAnim ? 'luxury' : 'static');

        setGiftAnimation({
          gift: giftObj,
          count: quantity,
          sender: payload.senderName || 'A Supporter'
        });

        const giftMsg: ChatMessage = {
          id: `gift_${Date.now()}_${Math.random()}`,
          userId: payload.senderId,
          userName: payload.senderName || 'Supporter',
          text: `Showered ${quantity}x ${giftObj.name} ${giftObj.icon}! (+${hostBeansSalary.toLocaleString()} 🫘 Beans Salary to Host)`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev.slice(-15), giftMsg]);

        setTimeout(() => {
          setGiftAnimation(null);
        }, isAnim ? 4800 : 3200);

        // Check for High-Value Diamond Gift (totalCost >= 1000 💎)
        if (totalDiamondCost >= 1000) {
          const senderUser = users.find(u => u.id === payload.senderId);
          const tier: 'elite' | 'luxury' | 'cosmic' =
            totalDiamondCost >= 50000 ? 'cosmic' : totalDiamondCost >= 10000 ? 'luxury' : 'elite';

          const alertItem: HighValueGiftAlert = {
            id: payload.id || `hv_gift_${Date.now()}_${Math.random()}`,
            senderId: payload.senderId,
            senderName: payload.senderName || senderUser?.name || 'VIP Patron',
            senderAvatar: payload.senderAvatar || senderUser?.avatar,
            senderLevel: payload.senderLevel || senderUser?.level || 15,
            receiverId: payload.receiverId || liveStreamData.broadcaster.id,
            receiverName: payload.receiverName || liveStreamData.broadcaster.name,
            streamId: stream.id,
            gift: giftObj,
            quantity,
            totalCost: totalDiamondCost,
            beansEarned: hostBeansSalary,
            tier,
            timestamp: payload.timestamp || Date.now(),
            isCurrentRoom: true
          };

          triggerHighValueAlert(alertItem);
        }
      } else if (totalDiamondCost >= 5000) {
        // Platform-wide whale alert ticker for major gifts in other rooms
        setGlobalWhaleTicker({
          id: Date.now().toString(),
          senderName: payload.senderName || 'A Supporter',
          receiverName: payload.receiverName || 'Broadcaster',
          giftName: giftObj.name,
          giftIcon: giftObj.icon,
          totalCost: totalDiamondCost
        });
        setTimeout(() => setGlobalWhaleTicker(null), 5200);
      }
    };

    const handleLiveLuckyBetEvent = (e: any) => {
      const payload = e.detail;
      if (payload && (payload.streamId === stream.id || payload.hostId === liveStreamData.broadcaster.id)) {
        if (payload.userId !== currentUser.id) {
          const chatMsg: ChatMessage = {
            id: `lucky_${Date.now()}_${Math.random()}`,
            userId: payload.userId,
            userName: payload.userName || 'Player',
            text: payload.win 
              ? `🎰 Won ${payload.multiplier}x (+${payload.payoutDiamonds} 💎) on Lucky Bet! (+${payload.hostBeansAwarded} 🫘 Beans to Host)`
              : `🎲 Bet ${payload.betAmount} 💎 on Lucky Bet (+${payload.hostBeansAwarded} 🫘 Beans to Host)`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev.slice(-15), chatMsg]);
        }
      }
    };

    window.addEventListener('live_room_gift_event', handleLiveGiftEvent);
    window.addEventListener('live_room_lucky_bet_event', handleLiveLuckyBetEvent);
    return () => {
      window.removeEventListener('live_room_gift_event', handleLiveGiftEvent);
      window.removeEventListener('live_room_lucky_bet_event', handleLiveLuckyBetEvent);
    };
  }, [liveStreamData.broadcaster.id, stream.id, gifts]);

  const handleSend = () => {
      if (!inputText.trim() || isMuted) return;
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

  const handleSendGift = async () => {
    const gift = gifts.find(g => g.id === selectedGiftId);
    if (!gift) return;
    const totalCost = gift.price * multiplier;
    const hostBeansSalary = (gift.beans !== undefined ? gift.beans : gift.price) * multiplier;

    if (currentUser.diamonds < totalCost) { 
      const proceed = confirm(`⚠️ Insufficient Diamonds!\nYou need ${totalCost.toLocaleString()} 💎 to send this gift, but currently have ${currentUser.diamonds.toLocaleString()} 💎.\n\nWould you like to Top Up your wallet now?`);
      if (proceed) {
        setShowGiftMenu(false);
        setShowTopupModal(true);
      }
      return; 
    }

    const success = await sendGift(
      liveStreamData.broadcaster.id, 
      gift.id, 
      gift.name, 
      multiplier, 
      totalCost, 
      stream.id, 
      liveStreamData.broadcaster.name
    );
    if (success) {
        const isAnimated = gift.type === 'animated' || gift.category === 'Animated' || Boolean(gift.animationType);
        playGiftSound(isAnimated ? 'luxury' : 'static');

        const msg: ChatMessage = { 
          id: Date.now().toString(), 
          userId: currentUser.id, 
          userName: currentUser.name, 
          text: `Sent ${multiplier}x ${gift.name} ${gift.icon} (+${hostBeansSalary.toLocaleString()} 🫘 Beans Salary to Host)`, 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, msg]);
        setGiftAnimation({ gift, count: multiplier, sender: currentUser.name });

        // Trigger real-time High-Value Diamond Gift Alert
        if (totalCost >= 1000) {
          const tier: 'elite' | 'luxury' | 'cosmic' =
            totalCost >= 50000 ? 'cosmic' : totalCost >= 10000 ? 'luxury' : 'elite';

          const alertItem: HighValueGiftAlert = {
            id: `local_hv_${Date.now()}_${Math.random()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            senderLevel: currentUser.level,
            receiverId: liveStreamData.broadcaster.id,
            receiverName: liveStreamData.broadcaster.name,
            streamId: stream.id,
            gift,
            quantity: multiplier,
            totalCost,
            beansEarned: hostBeansSalary,
            tier,
            timestamp: Date.now(),
            isCurrentRoom: true
          };
          triggerHighValueAlert(alertItem);
        }
        
        const timeout = isAnimated ? 4800 : 3200;
        setTimeout(() => setGiftAnimation(null), timeout);
        setShowGiftMenu(false);
    } else { 
      alert("Transaction Failed. Please verify your diamond balance."); 
    }
  };

  const handleSendLuckyBet = async () => {
    if (isSpinningLucky) return;
    const betCost = Math.max(1, Number(luckyBetAmount) || 100);

    if (currentUser.diamonds < betCost) {
      const proceed = confirm(`⚠️ Insufficient Diamonds!\nYou need ${betCost.toLocaleString()} 💎 to play Lucky Bet, but currently have ${currentUser.diamonds.toLocaleString()} 💎.\n\nWould you like to Top Up your wallet now?`);
      if (proceed) {
        setShowLuckyModal(false);
        setShowTopupModal(true);
      }
      return;
    }

    setIsSpinningLucky(true);
    playLuckySound('spin');

    try {
      const res = await sendLuckyBet(liveStreamData.broadcaster.id, stream.id, betCost, sessionElapsedSeconds);
      if (res && res.success) {
        setLastLuckyResult(res);
        if (res.win) {
          playLuckySound('win');
          setLuckyWinBanner(`🎉 WINNER! ${res.multiplier}x Multiplier! Won +${res.payoutDiamonds} 💎!`);
          setTimeout(() => setLuckyWinBanner(null), 4200);

          const chatMsg: ChatMessage = {
            id: `lucky_${Date.now()}_${Math.random()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            text: `🎰 Hit Lucky Bet! Won ${res.multiplier}x (+${res.payoutDiamonds} 💎) • Host earned +${res.hostBeansAwarded} 🫘 Beans Salary!`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev.slice(-15), chatMsg]);
        } else {
          playLuckySound('lose');
          const chatMsg: ChatMessage = {
            id: `lucky_${Date.now()}_${Math.random()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            text: `🎲 Bet ${betCost} 💎 on Lucky Bet • Host earned +${res.hostBeansAwarded} 🫘 Beans Salary!`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev.slice(-15), chatMsg]);
        }
      } else {
        alert(res?.message || 'Failed to process lucky bet.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSpinningLucky(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleFollow = () => { 
    const willFollow = !isFollowing;
    toggleFollow(liveStreamData.broadcaster.id); 
    onFollow(liveStreamData.broadcaster.id); 
    if (willFollow) {
      triggerFollowToast(liveStreamData.broadcaster.name, liveStreamData.broadcaster.avatar);
    }
  };

  const filteredGifts = gifts.filter(g => {
    if (activeGiftTab === 'All') return true;
    if (activeGiftTab === 'Static') return g.type === 'static' || g.category === 'Static' || g.category === 'Standard' || g.category === 'Beautiful';
    if (activeGiftTab === 'Animated') return g.type === 'animated' || g.category === 'Animated' || Boolean(g.animationType);
    if (activeGiftTab === 'VIP') return g.category === 'VIP' || g.category === 'SVIP' || g.price >= 1000;
    return g.category === activeGiftTab;
  });

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setSelectedUserForProfile(user);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => { setShowEmojiPicker(false); }}>
       <div className="absolute inset-0 z-0 bg-slate-900">
          <div className={`w-full h-full flex ${liveStreamData.pkStatus && liveStreamData.pkStatus !== 'none' ? 'flex-row' : 'flex-col'}`}>
              <div className={`relative flex-1 h-full overflow-hidden ${liveStreamData.pkStatus && liveStreamData.pkStatus !== 'none' ? 'border-r border-white/10' : ''}`}>
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover [image-rendering:high-quality]" 
                  />
                  {/* FORCED HIGH RESOLUTION VIDEO HUD BADGE */}
                  <div className="absolute top-14 right-4 z-30 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>1080p FHD 60FPS FORCED</span>
                  </div>

                  {/* Live Room Violation Sentinel */}
                  <LiveRoomViolationSentinel 
                    streamId={stream.id}
                    hostName={stream.broadcaster?.name || 'Live Host'}
                    isHost={false}
                    videoRef={remoteVideoRef}
                    onForceTerminate={onClose}
                  />
                  {liveStreamData.pkStatus && liveStreamData.pkStatus !== 'none' && (
                      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                          <span className="text-white font-black text-[10px] uppercase tracking-wider">HOST</span>
                      </div>
                  )}
              </div>

              {liveStreamData.pkStatus && liveStreamData.pkStatus !== 'none' && (
                  <div className="relative flex-1 h-full overflow-hidden bg-slate-800">
                      {liveStreamData.pkOpponent ? (
                          <RemoteStreamPlayer 
                            streamId={streams.find(s => s.broadcaster.id === liveStreamData.pkOpponent?.id)?.id || `mock-${liveStreamData.pkOpponent.id}`}
                            className="w-full h-full"
                            placeholder={
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                    <img src={liveStreamData.pkOpponent.avatar} className="w-full h-full object-cover opacity-50 blur-sm" alt="" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <img src={liveStreamData.pkOpponent.avatar} className="w-20 h-20 rounded-full border-4 border-indigo-500 shadow-xl mb-3 object-cover" alt="" />
                                        <p className="text-white font-black text-xs uppercase tracking-widest">{liveStreamData.pkOpponent.name}</p>
                                    </div>
                                </div>
                            }
                          />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                              <p className="text-white/50 font-bold text-[10px] uppercase tracking-widest">Connecting...</p>
                          </div>
                      )}
                      {liveStreamData.pkOpponent && (
                          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 z-10">
                              <span className="text-white font-black text-[10px] uppercase tracking-wider">OPPONENT</span>
                          </div>
                      )}
                  </div>
              )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
       </div>

       {/* PK Score Bar for Viewer */}
       {liveStreamData.pkStatus && liveStreamData.pkStatus !== 'none' && liveStreamData.pkScores && (
          <div className="absolute top-24 left-4 right-4 z-30 animate-fade-in-down">
              <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-end px-2">
                      <div className="flex flex-col">
                          <span className="text-white font-black text-lg drop-shadow-md">{liveStreamData.pkScores.host.toLocaleString()}</span>
                      </div>
                      <div className="bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                          <i className="fa-solid fa-stopwatch text-rose-500 text-[10px]"></i>
                          <span className="text-white font-black text-[10px] font-mono">
                              {Math.floor((liveStreamData.pkTimeLeft || 0) / 60)}:{( (liveStreamData.pkTimeLeft || 0) % 60).toString().padStart(2, '0')}
                          </span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className="text-white font-black text-lg drop-shadow-md">{liveStreamData.pkScores.opponent.toLocaleString()}</span>
                      </div>
                  </div>
                  <div className="h-2 w-full bg-black/40 backdrop-blur-md rounded-full overflow-hidden border border-white/10 flex">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500" 
                        style={{ width: `${(liveStreamData.pkScores.host / (liveStreamData.pkScores.host + liveStreamData.pkScores.opponent + 1)) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-500" 
                        style={{ width: `${(liveStreamData.pkScores.opponent / (liveStreamData.pkScores.host + liveStreamData.pkScores.opponent + 1)) * 100}%` }}
                      />
                  </div>
              </div>
          </div>
       )}

       {/* FULL-SCREEN INTERACTIVE ANIMATED & STATIC GIFTS OVERLAY */}
       {giftAnimation && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* 1. Ferrari Supercar Animation */}
            {giftAnimation.gift.animationType === 'ferrari' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in slide-in-from-left duration-700">
                <div className="text-9xl animate-bounce filter drop-shadow-2xl">🏎️💨</div>
                <div className="bg-black/70 backdrop-blur-md p-5 rounded-3xl border border-red-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-amber-300 drop-shadow-lg">
                    {giftAnimation.gift.name.toUpperCase()}!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-red-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 2. Ocean Superyacht Animation */}
            {giftAnimation.gift.animationType === 'yacht' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in slide-in-from-bottom duration-700">
                <div className="text-9xl filter drop-shadow-2xl animate-pulse">🛥️🌊</div>
                <div className="bg-black/70 backdrop-blur-md p-5 rounded-3xl border border-cyan-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 drop-shadow-lg">
                    {giftAnimation.gift.name.toUpperCase()}!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-cyan-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 3. Space Rocket Animation */}
            {giftAnimation.gift.animationType === 'rocket' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in slide-in-from-bottom duration-500">
                <div className="text-9xl filter drop-shadow-2xl animate-bounce">🚀🔥</div>
                <div className="bg-black/70 backdrop-blur-md p-5 rounded-3xl border border-orange-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-300 drop-shadow-lg">
                    {giftAnimation.gift.name.toUpperCase()} BLAST OFF!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-orange-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 4. Golden Dragon Animation */}
            {giftAnimation.gift.animationType === 'dragon' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in zoom-in-50 duration-700">
                <div className="text-9xl filter drop-shadow-2xl animate-spin">🐉✨</div>
                <div className="bg-black/70 backdrop-blur-md p-5 rounded-3xl border border-amber-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 drop-shadow-lg">
                    IMPERIAL {giftAnimation.gift.name.toUpperCase()}!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-amber-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 5. Galaxy Nova Animation */}
            {giftAnimation.gift.animationType === 'galaxy' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in zoom-in-75 duration-700">
                <div className="text-9xl filter drop-shadow-2xl animate-pulse">🌌💫</div>
                <div className="bg-black/70 backdrop-blur-md p-5 rounded-3xl border border-purple-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 drop-shadow-lg">
                    COSMIC {giftAnimation.gift.name.toUpperCase()}!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-purple-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 6. Fireworks Animation */}
            {giftAnimation.gift.animationType === 'fireworks' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in zoom-in duration-500">
                <div className="text-9xl filter drop-shadow-2xl animate-ping">🎆🎇</div>
                <div className="bg-black/70 backdrop-blur-md p-5 rounded-3xl border border-pink-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400 drop-shadow-lg">
                    {giftAnimation.gift.name.toUpperCase()}!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-pink-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 7. Celestial Pegasus Animation */}
            {giftAnimation.gift.animationType === 'pegasus' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in zoom-in-75 duration-700">
                <div className="text-9xl filter drop-shadow-2xl animate-bounce">🦄✨</div>
                <div className="bg-black/75 backdrop-blur-md p-5 rounded-3xl border border-pink-400/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 drop-shadow-lg">
                    CELESTIAL {giftAnimation.gift.name.toUpperCase()}!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-pink-300">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 8. Cosmic Meteor Animation */}
            {giftAnimation.gift.animationType === 'meteor' && (
              <div className="w-full max-w-xl text-center space-y-3 animate-in slide-in-from-top-48 duration-500">
                <div className="text-9xl filter drop-shadow-2xl animate-spin">☄️💥</div>
                <div className="bg-black/75 backdrop-blur-md p-5 rounded-3xl border border-red-500/40 shadow-2xl mx-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 drop-shadow-lg">
                    COSMIC {giftAnimation.gift.name.toUpperCase()} STRIKE!
                  </div>
                  <div className="text-white font-bold text-sm mt-1">
                    <span className="text-amber-400">{giftAnimation.sender}</span> sent x{giftAnimation.count}
                  </div>
                  <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/60 py-1 px-3 rounded-full inline-block border border-amber-500/30">
                    Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                  </div>
                </div>
              </div>
            )}

            {/* 9. Standard Static Gift with particle aura */}
            {!giftAnimation.gift.animationType && (
              <div className="bg-black/80 backdrop-blur-xl p-6 rounded-3xl flex flex-col items-center border border-indigo-500/50 shadow-2xl transform scale-110 animate-fade-in-up mx-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 blur-2xl animate-pulse"></div>
                </div>
                <div className="text-white font-bold text-sm mb-1 z-10">
                  <span className="text-indigo-400">{giftAnimation.sender}</span> sent
                </div>
                <div className="text-8xl animate-bounce filter drop-shadow-2xl my-2 z-10">
                  {giftAnimation.gift.icon}
                </div>
                <div className="flex items-baseline gap-2 mt-1 z-10">
                  <span className="text-yellow-400 font-black text-5xl italic drop-shadow-lg">
                    x{giftAnimation.count}
                  </span>
                </div>
                <div className="text-white font-black text-base uppercase tracking-widest mt-1 z-10">
                  {giftAnimation.gift.name}
                </div>
                <div className="text-amber-300 text-xs font-mono font-bold mt-2 bg-amber-950/70 py-1 px-3 rounded-full border border-amber-500/30 z-10">
                  Host Salary: +{((giftAnimation.gift.beans || giftAnimation.gift.price) * giftAnimation.count).toLocaleString()} 🫘 Beans
                </div>
              </div>
            )}
          </div>
       )}

       <div className="relative z-30 p-4 safe-top flex justify-between items-start pointer-events-none">
           <div className="bg-black/30 backdrop-blur-md rounded-full p-1 pr-4 flex items-center gap-2 border border-white/10 pointer-events-auto cursor-pointer" onClick={() => setSelectedUserForProfile(liveStreamData.broadcaster)}>
               <img src={liveStreamData.broadcaster.avatar} className="w-9 h-9 rounded-full border border-white" alt="avatar" />
               <div><h3 className="text-white text-xs font-bold max-w-[80px] truncate">{liveStreamData.broadcaster.name}</h3><div className="flex items-center gap-1.5 text-[10px] text-white/80"><span>{liveStreamData.viewerCount} <i className="fa-solid fa-eye text-[8px]"></i></span><span className="opacity-50">|</span><span>{formatNumber(liveStreamData.broadcaster.followers)} Fans</span></div></div>
               <button onClick={(e) => { e.stopPropagation(); handleToggleFollow(); }} className={`${isFollowing ? 'bg-white/20 text-white' : 'bg-indigo-500 text-white'} text-[10px] font-bold px-3 py-1 rounded-full hover:bg-opacity-80 transition-colors ml-1`}>{isFollowing ? 'Following' : 'Follow'}</button>
           </div>
           <div className="flex gap-2 pointer-events-auto">
               <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-white text-xs font-bold border border-white/10 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>{formatDuration(duration)}</div>
               <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20"><i className="fa-solid fa-xmark"></i></button>
           </div>
       </div>

       <div className="relative z-30 mt-auto p-4 safe-bottom pointer-events-none">
           <div className="h-60 overflow-y-auto mb-4 space-y-2 flex flex-col justify-end no-scrollbar pointer-events-auto" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}>
               {messages.map(msg => (<div key={msg.id} className={`self-start px-3 py-1.5 rounded-2xl text-white text-sm max-w-[85%] break-words bg-black/30 backdrop-blur-sm`}><span onClick={() => handleUserClick(msg.userId)} className="font-bold text-white/70 mr-2 text-xs opacity-75 cursor-pointer hover:text-white transition-colors">{msg.userName}:</span>{msg.text}</div>))}
               <div ref={messagesEndRef} />
           </div>
           <div className="flex items-center gap-3 pointer-events-auto">
               <div className={`flex-1 backdrop-blur-md rounded-full px-1 py-1 flex items-center border ${isMuted ? 'bg-slate-800/80 border-red-500/30' : 'bg-black/40 border-white/10'}`}>
                   <input type="text" value={inputText} disabled={isMuted} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={isMuted ? "Muted by host" : "Say something..."} className="bg-transparent border-none focus:outline-none text-white text-sm px-3 w-full placeholder:text-white/50" />
                   {!isMuted && (<button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white"><i className="fa-solid fa-face-smile"></i></button>)}
                   <button onClick={handleSend} disabled={isMuted} className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20"><i className="fa-solid fa-paper-plane text-xs"></i></button>
               </div>
               {!isMuted && (
                 <button
                   onClick={() => setShowLuckyModal(true)}
                   className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/40 active:scale-95 transition-transform border-2 border-white/40 cursor-pointer"
                   title="🎰 Lucky Gift Bet (1💎 / 100💎 Feeling Win Mode)"
                 >
                   <span className="text-xl">🎰</span>
                 </button>
               )}
               {!isMuted && (<button onClick={() => setShowGiftMenu(true)} className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 active:scale-95 transition-transform border-2 border-white/20"><i className="fa-solid fa-gift text-lg"></i></button>)}
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

        {/* GIFT SELECTION MENU */}
        {showGiftMenu && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowGiftMenu(false)}>
              <div className="bg-black/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/15 p-4 animate-fade-in-up safe-bottom shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-gift text-pink-400"></i>
                      <span>Send Gift to Host</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const demoGifts = gifts.filter(g => g.price >= 1000);
                          const sampleGift = demoGifts.length > 0 ? demoGifts[Math.floor(Math.random() * demoGifts.length)] : { id: 'rocket', name: 'Apollo Rocket', price: 10000, beans: 10000, icon: '🚀' };
                          const tier = sampleGift.price >= 50000 ? 'cosmic' : sampleGift.price >= 10000 ? 'luxury' : 'elite';
                          triggerHighValueAlert({
                            id: `demo_${Date.now()}`,
                            senderId: 'demo_whale_99',
                            senderName: 'Lord Whale 👑',
                            senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                            senderLevel: 45,
                            receiverId: liveStreamData.broadcaster.id,
                            receiverName: liveStreamData.broadcaster.name,
                            streamId: stream.id,
                            gift: sampleGift,
                            quantity: 1,
                            totalCost: sampleGift.price,
                            beansEarned: sampleGift.beans || Math.round(sampleGift.price * 0.7),
                            tier,
                            timestamp: Date.now(),
                            isCurrentRoom: true
                          });
                          setShowGiftMenu(false);
                        }}
                        className="text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 hover:text-white border border-amber-500/40 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Simulate High-Value Diamond Alert"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles text-[9px] text-amber-400"></i>
                        <span>Demo Alert</span>
                      </button>
                      <div className="bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-2">
                        <i className="fa-solid fa-gem text-indigo-400 text-xs"></i>
                        <span className="text-white font-bold text-xs">{currentUser.diamonds.toLocaleString()} 💎</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 border-b border-white/10 pb-2">
                    {GIFT_CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveGiftTab(cat)} 
                        className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          activeGiftTab === cat 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat === 'All' ? '🎁 All' : cat === 'Static' ? '🌸 Static' : cat === 'Animated' ? '✨ Animated 3D' : '👑 VIP'}
                      </button>
                    ))}
                  </div>

                  {/* Gifts Cards Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-3 max-h-56 overflow-y-auto custom-scrollbar">
                    {filteredGifts.length > 0 ? (
                      filteredGifts.map(gift => {
                        const isAnim = gift.type === 'animated' || gift.category === 'Animated' || Boolean(gift.animationType);
                        const isSelected = selectedGiftId === gift.id;

                        return (
                          <button 
                            key={gift.id} 
                            onClick={() => setSelectedGiftId(gift.id)} 
                            className={`flex flex-col items-center p-2 rounded-xl transition-all relative cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-600/30 border-2 border-indigo-400 shadow-lg shadow-indigo-600/30 scale-105' 
                                : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                            }`}
                          >
                            {isAnim && (
                              <span className="absolute top-1 right-1 text-[8px] bg-pink-600/90 text-white font-black px-1 rounded-full">
                                3D
                              </span>
                            )}
                            <div className="text-3xl mb-1">{gift.icon}</div>
                            <div className="text-white text-[11px] font-black truncate w-full text-center">{gift.name}</div>
                            <div className="text-cyan-300 text-[10px] font-bold flex items-center gap-1 font-mono">
                              <i className="fa-solid fa-gem text-[8px]"></i> {gift.price.toLocaleString()}
                            </div>
                            <div className="text-amber-300 text-[9px] font-medium font-mono">
                              +{((gift.beans || gift.price)).toLocaleString()} 🫘
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-4 text-center py-8 text-slate-500 text-xs font-bold uppercase">No gifts in this category</div>
                    )}
                  </div>

                  {/* Multiplier & Send Action */}
                  <div className="flex gap-2.5">
                    <div className="relative">
                      <button 
                        onClick={() => setShowMultiplierSelect(!showMultiplierSelect)} 
                        className="h-12 px-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm flex items-center gap-2 min-w-[85px] justify-between cursor-pointer"
                      >
                        <span>x{multiplier}</span>
                        <i className={`fa-solid fa-chevron-up text-xs transition-transform ${showMultiplierSelect ? 'rotate-180' : ''}`}></i>
                      </button>

                      {showMultiplierSelect && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-900 border border-white/15 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto custom-scrollbar z-50">
                          {MULTIPLIERS.map(m => (
                            <button 
                              key={m} 
                              onClick={() => { setMultiplier(m); setShowMultiplierSelect(false); }} 
                              className="w-full py-2 text-white text-xs font-bold hover:bg-indigo-600 transition-colors text-center cursor-pointer"
                            >
                              x{m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleSendGift} 
                      className="flex-1 h-12 bg-gradient-to-r from-pink-600 via-indigo-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl text-white font-black text-sm uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-paper-plane text-xs"></i>
                      <span>Send {(gifts.find(g => g.id === selectedGiftId)?.price || 0) * multiplier} 💎 (Host Gets +{((gifts.find(g => g.id === selectedGiftId)?.beans || gifts.find(g => g.id === selectedGiftId)?.price || 0) * multiplier).toLocaleString()} 🫘)</span>
                    </button>
                  </div>
              </div>
          </div>
        )}

        {selectedUserForProfile && (
            <PublicProfileModal 
              user={selectedUserForProfile} 
              onClose={() => setSelectedUserForProfile(null)}
              onFollow={(user) => {
                triggerFollowToast(user.name, user.avatar);
              }}
            />
        )}

        {/* Follow Toast Notification Popup */}
        {followToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] max-w-sm w-[92%] sm:w-auto animate-fade-in-down pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3.5">
              {followToast.avatar ? (
                <div className="relative flex-shrink-0">
                  <img 
                    src={followToast.avatar} 
                    alt={followToast.name} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-sm" 
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[9px] text-white">
                    <i className="fa-solid fa-check"></i>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg flex-shrink-0">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
              )}

              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate max-w-[160px] sm:max-w-[200px]">
                    {followToast.name}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    Following
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  You are now following this broadcaster!
                </p>
              </div>

              <button 
                onClick={() => setFollowToast(null)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-auto flex-shrink-0"
                title="Dismiss"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          </div>
        )}

        {/* Top Up Wallet Modal */}
        {showTopupModal && (
          <WalletTopupModal
            isOpen={showTopupModal}
            onClose={() => setShowTopupModal(false)}
          />
        )}

        {/* LUCKY GIFT BET MODAL (3MIN / 5MIN FEELING WIN ENGAGEMENT SYSTEM) */}
        {showLuckyModal && (
          <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowLuckyModal(false)}>
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95 pointer-events-auto space-y-4" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                    🎰
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <span>Lucky Gift Bet</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                        {economySettings?.luckySessionMinutes || 3} MIN MODE
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Bet diamonds to send gifts & feel the winning thrill</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowLuckyModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Balances Bar */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Your Diamond Balance</span>
                  <span className="text-cyan-400 font-black font-mono flex items-center gap-1">
                    <i className="fa-solid fa-gem text-xs"></i>
                    <span>{currentUser.diamonds.toLocaleString()} 💎</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">Host Beans Reward</span>
                  <span className="text-amber-400 font-black font-mono">
                    +{Math.round(luckyBetAmount * ((100 - (economySettings?.companyCutPercentage || 30)) / 100)).toLocaleString()} 🫘 Beans
                  </span>
                </div>
              </div>

              {/* Dynamic 3-Min / 5-Min Session Timer Card */}
              {(() => {
                const totalSec = (economySettings?.luckySessionMinutes || 3) * 60;
                const remainingSec = Math.max(0, totalSec - sessionElapsedSeconds);
                const mins = Math.floor(remainingSec / 60);
                const secs = remainingSec % 60;
                const progressPct = Math.min(100, Math.round((sessionElapsedSeconds / totalSec) * 100));
                const isEarly = progressPct < 40;
                const isMid = progressPct >= 40 && progressPct < 70;

                return (
                  <div className="bg-gradient-to-r from-slate-950 to-amber-950/20 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <i className="fa-solid fa-stopwatch text-amber-400 animate-pulse"></i>
                        <span>Feeling Win Streak:</span>
                      </span>
                      <span className="font-mono font-black text-amber-400">
                        {mins}:{secs.toString().padStart(2, '0')} / {economySettings?.luckySessionMinutes || 3}:00
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isEarly ? 'bg-gradient-to-r from-emerald-500 to-amber-400' : isMid ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-orange-500 to-pink-500'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className={isEarly ? 'text-emerald-400' : 'text-slate-500'}>
                        {isEarly ? '🔥 High Win Rush (Feeling Win!)' : isMid ? '⚡ Thrill & Multipliers' : '🎯 Final Bet Settlement'}
                      </span>
                      <span className="text-slate-500 font-mono">{progressPct}% elapsed</span>
                    </div>
                  </div>
                );
              })()}

              {/* Bet Amount Quick Selectors */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Select Bet Amount (Diamonds 💎)
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 10, 50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLuckyBetAmount(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        luckyBetAmount === amt
                          ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                          : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {amt} 💎
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Animation & Result Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center min-h-[90px] flex flex-col items-center justify-center relative overflow-hidden">
                {isSpinningLucky ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="text-4xl animate-spin inline-block">🎰</div>
                    <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                      Spinning Reels & Showering Host...
                    </div>
                  </div>
                ) : lastLuckyResult ? (
                  <div className="space-y-1 animate-in zoom-in-95">
                    {lastLuckyResult.win ? (
                      <>
                        <div className="text-2xl animate-bounce">🎉 💎 🏆</div>
                        <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-emerald-400 uppercase tracking-wider">
                          BIG WIN! Hit {lastLuckyResult.multiplier}x Multiplier!
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          +{lastLuckyResult.payoutDiamonds} 💎 Added to Your Wallet!
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono">
                          Host salary credited: +{lastLuckyResult.hostBeansAwarded} 🫘 Beans
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl">💥 🎲</div>
                        <div className="text-xs font-bold text-slate-300">
                          Near miss! Sent {lastLuckyResult.betAmount} 💎
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          Host still earned +{lastLuckyResult.hostBeansAwarded} 🫘 Beans Salary!
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Keep playing your {economySettings?.luckySessionMinutes || 3}-min lucky streak!
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                    <span className="text-2xl">🎲</span>
                    <span>Place 1 💎 or 100 💎 bet to trigger instant win multipliers!</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {currentUser.diamonds < luckyBetAmount ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowLuckyModal(false);
                    setShowTopupModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-gem"></i>
                  <span>Top Up Wallet (Need {luckyBetAmount} 💎)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSpinningLucky}
                  onClick={handleSendLuckyBet}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="text-base">🎰</span>
                  <span>
                    {isSpinningLucky ? 'Rolling Bet...' : `BET ${luckyBetAmount} 💎 & SEND TO HOST (+${Math.round(luckyBetAmount * ((100 - (economySettings?.companyCutPercentage || 30)) / 100))} 🫘)`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* LUCKY WIN FULL-SCREEN JACKPOT BANNER */}
        {luckyWinBanner && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] max-w-md w-[92%] animate-in slide-in-from-top-10 duration-300 pointer-events-none">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-white/50 text-center font-black">
              <div className="text-xl animate-bounce">🏆 💎 🎰</div>
              <div className="text-base tracking-tight">{luckyWinBanner}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-900/80 mt-1 font-mono">
                Real-Time Diamond Multiplier Awarded!
              </div>
            </div>
          </div>
        )}

        {/* REAL-TIME HIGH-VALUE DIAMOND GIFT OVERLAY ALERT */}
        <HighValueGiftAlertOverlay
          alert={highValueAlert}
          queueCount={highValueQueue.length}
          onDismiss={handleDismissHighValueAlert}
          onCheer={handleCheerFromAlert}
          onInspectUser={handleUserClick}
        />

        {/* GLOBAL PLATFORM WHALE TICKER NOTIFICATION */}
        {globalWhaleTicker && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[85] max-w-lg w-[92%] animate-in slide-in-from-top-6 duration-300 pointer-events-auto">
            <div className="bg-slate-950/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg filter drop-shadow animate-pulse">{globalWhaleTicker.giftIcon}</span>
                <div className="truncate text-white">
                  <span className="font-black text-amber-300 mr-1.5 uppercase tracking-wider text-[9px] bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                    🌍 Global Whale
                  </span>
                  <span className="font-bold text-cyan-300">{globalWhaleTicker.senderName}</span>
                  <span className="text-slate-300"> sent </span>
                  <span className="font-bold text-white">{globalWhaleTicker.giftName}</span>
                  <span className="text-slate-300"> to </span>
                  <span className="font-bold text-pink-300">{globalWhaleTicker.receiverName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono font-black text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/40 text-[11px]">
                  💎 {globalWhaleTicker.totalCost.toLocaleString()}
                </span>
                <button
                  onClick={() => setGlobalWhaleTicker(null)}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Dismiss ticker"
                >
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

