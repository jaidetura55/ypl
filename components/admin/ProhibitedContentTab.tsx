import React, { useState, useEffect } from 'react';
import { Stream, User } from '../../types';
import violationSentinel, { AIModelRecord } from '../../services/violationSentinelService';

interface ProhibitedContentTabProps {
  streams: Stream[];
  users: User[];
  endStream: (streamId: string) => void;
  onShowToast: (msg: string) => void;
}

interface BannedHostRecord {
  id: string;
  hostId: string;
  hostName: string;
  streamTitle: string;
  roomId: string;
  offense: 'smoking' | 'vaping' | 'sharp_knife' | 'taking_drug' | 'middle_finger';
  evidenceSnapshot: string;
  detectedAt: string;
  autoEnforced: boolean;
  status: 'ACTIVE_BAN' | 'REVOKED';
}

interface AIPluginConfig {
  id: string;
  name: string;
  format: 'onnx' | 'tflite' | 'glb_3d' | 'tfjs' | 'yolo_pt';
  targetOffense: string;
  version: string;
  size: string;
  status: 'active' | 'standby';
  confidenceThreshold: number;
}

export default function ProhibitedContentTab({
  streams,
  users,
  endStream,
  onShowToast
}: ProhibitedContentTabProps) {
  // Master Auto-detection toggle
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('youngpapi_autodetect_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Global Sensitivity
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(78);

  // Prohibited Rule Toggles & Action
  const [rules, setRules] = useState({
    smoking: { enabled: true, action: 'blur_stream', name: 'Smoking & Tobacco' },
    vaping: { enabled: true, action: 'blur_stream', name: 'Vaping & E-Cigarettes' },
    sharp_knife: { enabled: true, action: 'end_stream_ban', name: 'Holding Sharp Knife & Weapons' },
    taking_drug: { enabled: true, action: 'end_stream_ban', name: 'Taking Drugs & Narcotics' },
    middle_finger: { enabled: true, action: 'warn_overlay', name: 'Showing Fuck with Finger (Middle Finger Gesture)' }
  });

  // Online Supported AI Neural Models Registry (Smoking, Vaping, Fuck Finger Gesture, etc.)
  const [models, setModels] = useState<AIModelRecord[]>(() => violationSentinel.getModels());
  const [modelFilter, setModelFilter] = useState<'all' | 'smoking_vaping' | 'middle_finger' | 'weapons_drugs'>('all');
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [editingUrlModel, setEditingUrlModel] = useState<AIModelRecord | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/models')
      .then(r => r.json())
      .then(data => {
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleModel = async (model: AIModelRecord) => {
    if (!model.downloaded && !model.enabled) {
      onShowToast(`⚠️ Cannot enable ${model.name}. Model weights are not installed. Click 'Download Model' first.`);
      return;
    }
    const nextState = !model.enabled;
    const updated = await violationSentinel.toggleModel(model.id, nextState);
    if (updated) {
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, enabled: updated.enabled } : m));
      onShowToast(`Model ${model.name} is now turned ${updated.enabled ? 'ON (Active Sentinel)' : 'OFF (Detection Disabled)'}.`);
    }
  };

  const handleRemoveModel = async (model: AIModelRecord) => {
    if (!window.confirm(`Are you sure you want to remove "${model.name}" from cache?\n\nDetection for this prohibited offense will be disabled in live stream rooms until downloaded again.`)) return;
    const updated = await violationSentinel.removeModel(model.id);
    if (updated) {
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, downloaded: false, enabled: false } : m));
      onShowToast(`🗑️ ${model.name} uninstalled and removed from cache. Detection is OFF.`);
    }
  };

  const handleDownloadModelBack = async (model: AIModelRecord, customUrl?: string) => {
    setDownloadingModelId(model.id);
    setDownloadProgress(15);

    const timer = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return 95;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(timer);
      setDownloadProgress(100);
      const updated = await violationSentinel.downloadModel(model.id, customUrl);
      setTimeout(() => {
        setDownloadingModelId(null);
        setDownloadProgress(0);
        if (updated) {
          setModels(prev => prev.map(m => m.id === model.id ? { ...m, downloaded: true, enabled: true, lastUpdated: new Date().toISOString() } : m));
          onShowToast(`✅ Successfully downloaded ${model.name} from online URL. Model is active & turned ON.`);
        }
      }, 400);
    }, 1100);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    onShowToast(`Copied online model URL to clipboard!`);
  };

  const handleOpenEditUrl = (model: AIModelRecord) => {
    setEditingUrlModel(model);
    setCustomUrlInput(model.onlineUrl);
  };

  const handleSaveCustomUrl = async () => {
    if (!editingUrlModel || !customUrlInput.trim()) return;
    await violationSentinel.updateModelUrl(editingUrlModel.id, customUrlInput.trim());
    setModels(prev => prev.map(m => m.id === editingUrlModel.id ? { ...m, onlineUrl: customUrlInput.trim() } : m));
    onShowToast(`Updated online model URL for ${editingUrlModel.name}`);
    setEditingUrlModel(null);
  };

  // Active Ban Records
  const [banList, setBanList] = useState<BannedHostRecord[]>([
    {
      id: 'BAN-001',
      hostId: '100000000004',
      hostName: 'ShadowRebel',
      streamTitle: 'Late Night Chill & Talks',
      roomId: 'room_live_4492',
      offense: 'middle_finger',
      evidenceSnapshot: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&h=250',
      detectedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      autoEnforced: true,
      status: 'ACTIVE_BAN'
    },
    {
      id: 'BAN-002',
      hostId: '100000000009',
      hostName: 'CyberNinja',
      streamTitle: 'Cooking and Kitchen Prep',
      roomId: 'room_live_8812',
      offense: 'sharp_knife',
      evidenceSnapshot: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=400&h=250',
      detectedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      autoEnforced: true,
      status: 'ACTIVE_BAN'
    }
  ]);

  // Upload model modal & simulation state
  const [isUploadingPlugin, setIsUploadingPlugin] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'onnx' | 'tflite' | 'glb_3d' | 'tfjs' | 'yolo_pt'>('glb_3d');
  const [selectedTarget, setSelectedTarget] = useState<string>('middle_finger');
  const [liveScannerActive, setLiveScannerActive] = useState<boolean>(true);
  const [simulatedViolation, setSimulatedViolation] = useState<{ streamId: string; offense: string; message: string } | null>(null);

  const toggleMasterAutoDetect = () => {
    const next = !autoDetectionEnabled;
    setAutoDetectionEnabled(next);
    localStorage.setItem('youngpapi_autodetect_enabled', String(next));
    onShowToast(`Auto-detection sentinel is now ${next ? 'ACTIVATED' : 'PAUSED'}.`);
  };

  const handleRuleToggle = (key: keyof typeof rules) => {
    setRules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled
      }
    }));
    onShowToast(`Updated detection rule for ${rules[key].name}`);
  };

  const handleActionChange = (key: keyof typeof rules, action: string) => {
    setRules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        action
      }
    }));
    onShowToast(`Enforcement action updated for ${rules[key].name}`);
  };

  const handleRevokeBan = (banId: string, hostName: string) => {
    setBanList(prev => prev.map(b => b.id === banId ? { ...b, status: 'REVOKED' } : b));
    onShowToast(`Ban revoked for ${hostName}. Host can now broadcast again.`);
  };

  // Simulate an auto-detection in a live room
  const runSimulatedDetection = (stream: Stream, offense: 'smoking' | 'vaping' | 'sharp_knife' | 'taking_drug' | 'middle_finger') => {
    const offenseLabel = {
      smoking: 'Smoking cigarette / tobacco detected',
      vaping: 'Vaping device & cloud plume detected',
      sharp_knife: 'Holding sharp tactical knife blade detected',
      taking_drug: 'Illegal substance / drug ingestion detected',
      middle_finger: 'Obscene middle finger gesture (fuck finger) detected'
    }[offense];

    setSimulatedViolation({
      streamId: stream.id,
      offense,
      message: `${offenseLabel} on live stream room "${stream.title}"`
    });

    const ruleAction = rules[offense]?.action;

    // Apply auto-action
    if (ruleAction === 'end_stream_ban') {
      endStream(stream.id);
      const newBan: BannedHostRecord = {
        id: `BAN-${Date.now()}`,
        hostId: stream.broadcaster.id,
        hostName: stream.broadcaster.name,
        streamTitle: stream.title,
        roomId: stream.id,
        offense,
        evidenceSnapshot: stream.thumbnail,
        detectedAt: new Date().toISOString(),
        autoEnforced: true,
        status: 'ACTIVE_BAN'
      };
      setBanList(prev => [newBan, ...prev]);
      onShowToast(`🚨 VIOLATION: ${offenseLabel}! Stream terminated and host banned automatically.`);
    } else if (ruleAction === 'blur_stream') {
      onShowToast(`⚠️ VIOLATION: ${offenseLabel}! Stream video automatically blurred with safety warning.`);
    } else {
      onShowToast(`⚠️ WARNING: ${offenseLabel}! Immediate strike issued to broadcaster.`);
    }

    setTimeout(() => {
      setSimulatedViolation(null);
    }, 4500);
  };

  const handleUploadPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFileName) return;

    const newModel: AIModelRecord = {
      id: `model-${Date.now()}`,
      name: uploadedFileName.replace(/\.[^/.]+$/, ""),
      format: selectedFormat === 'yolo_pt' ? 'onnx' : selectedFormat,
      targetOffense: selectedTarget,
      category: selectedTarget.replace(/_/g, ' ').toUpperCase(),
      version: 'v1.0.0',
      size: `${(Math.random() * 15 + 5).toFixed(1)} MB`,
      onlineUrl: `https://huggingface.co/custom-models/${uploadedFileName}`,
      downloaded: true,
      enabled: true, // Default is ON
      confidenceThreshold: 80,
      downloadProgress: 100,
      lastUpdated: new Date().toISOString(),
      checksum: `sha256:${Math.random().toString(16).substring(2)}`,
      description: `Custom neural weights model uploaded for ${selectedTarget}.`
    };

    setModels(prev => [newModel, ...prev]);
    setIsUploadingPlugin(false);
    setUploadedFileName('');
    onShowToast(`Model "${newModel.name}" successfully mounted and activated (ON)!`);
  };

  const handleDownloadModel = (plugin: AIPluginConfig) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      pluginName: plugin.name,
      format: plugin.format,
      target: plugin.targetOffense,
      confidenceThreshold: plugin.confidenceThreshold,
      architecture: 'CNN_3D_Tensor_Mesh',
      exportedAt: new Date().toISOString()
    }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${plugin.name}_weights.${plugin.format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast(`Exported ${plugin.name} configuration package.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Master Auto-Detection Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${
            autoDetectionEnabled ? 'bg-red-500/20 text-red-400 shadow-red-500/10' : 'bg-slate-800 text-slate-500'
          }`}>
            <i className="fa-solid fa-eye text-xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Live Stream Prohibited Content & Ban Sentinel</h2>
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Live Stream Rooms Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous computer vision scanning for smoking, vaping, sharp knives, drugs, and middle finger gestures.
            </p>
          </div>
        </div>

        {/* Master Control Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMasterAutoDetect}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              autoDetectionEnabled
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <i className={`fa-solid ${autoDetectionEnabled ? 'fa-shield-halved' : 'fa-power-off'}`}></i>
            <span>{autoDetectionEnabled ? 'Auto-Detection: ACTIVE' : 'Auto-Detection: PAUSED'}</span>
          </button>

          <button
            onClick={() => setIsUploadingPlugin(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            <span>Upload Model / Plugin</span>
          </button>
        </div>
      </div>

      {/* Real-time Simulated Alert Banner */}
      {simulatedViolation && (
        <div className="p-4 bg-red-950/90 border border-red-500/50 rounded-2xl flex items-center justify-between text-xs text-white animate-pulse shadow-xl">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <div>
              <span className="font-black text-red-200 uppercase tracking-wider block text-[10px]">REAL-TIME DETECTOR TRIGGERED</span>
              <span className="font-bold text-sm text-white">{simulatedViolation.message}</span>
            </div>
          </div>
          <span className="px-3 py-1 bg-red-600 text-white font-black text-[10px] rounded-lg uppercase">
            Enforced Automatically
          </span>
        </div>
      )}

      {/* Detection Rules Matrix (5 Prohibited Behaviors) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <i className="fa-solid fa-sliders text-indigo-400"></i>
              <span>Prohibited Behavior Detection Matrix (Applied on Live Rooms)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle specific detectors and set automated enforcement actions.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Sentinel Sensitivity:</span>
            <span className="font-mono font-bold text-indigo-400">{sensitivityThreshold}%</span>
            <input
              type="range"
              min="50"
              max="95"
              value={sensitivityThreshold}
              onChange={(e) => setSensitivityThreshold(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Smoking */}
          <div className={`p-4 rounded-2xl border transition-all ${
            rules.smoking.enabled ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-smoking"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Smoking & Tobacco</h4>
                  <span className="text-[10px] text-slate-400">Cigarettes, cigars, matches</span>
                </div>
              </div>
              <button
                onClick={() => handleRuleToggle('smoking')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  rules.smoking.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  rules.smoking.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action on Detection</label>
              <select
                value={rules.smoking.action}
                onChange={(e) => handleActionChange('smoking', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="blur_stream">Auto-Blur Video Stream</option>
                <option value="warn_overlay">Display Warning Notice</option>
                <option value="end_stream_ban">Terminate Stream & Ban Host</option>
              </select>
            </div>
          </div>

          {/* 2. Vaping */}
          <div className={`p-4 rounded-2xl border transition-all ${
            rules.vaping.enabled ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-cloud"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Vaping & E-Cigarettes</h4>
                  <span className="text-[10px] text-slate-400">Vape pens, pods, vapor plumes</span>
                </div>
              </div>
              <button
                onClick={() => handleRuleToggle('vaping')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  rules.vaping.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  rules.vaping.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action on Detection</label>
              <select
                value={rules.vaping.action}
                onChange={(e) => handleActionChange('vaping', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="blur_stream">Auto-Blur Video Stream</option>
                <option value="warn_overlay">Display Warning Notice</option>
                <option value="end_stream_ban">Terminate Stream & Ban Host</option>
              </select>
            </div>
          </div>

          {/* 3. Holding Sharp Knife */}
          <div className={`p-4 rounded-2xl border transition-all ${
            rules.sharp_knife.enabled ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-khanda"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Holding Sharp Knife</h4>
                  <span className="text-[10px] text-slate-400">Blades, daggers, cleavers, weapons</span>
                </div>
              </div>
              <button
                onClick={() => handleRuleToggle('sharp_knife')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  rules.sharp_knife.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  rules.sharp_knife.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action on Detection</label>
              <select
                value={rules.sharp_knife.action}
                onChange={(e) => handleActionChange('sharp_knife', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="end_stream_ban">Immediate Terminate & Ban</option>
                <option value="blur_stream">Auto-Blur Video Stream</option>
                <option value="warn_overlay">Display Warning Notice</option>
              </select>
            </div>
          </div>

          {/* 4. Taking Drugs */}
          <div className={`p-4 rounded-2xl border transition-all ${
            rules.taking_drug.enabled ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-capsules"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Taking Drugs & Narcotics</h4>
                  <span className="text-[10px] text-slate-400">Pills, syringes, powder, ingestion</span>
                </div>
              </div>
              <button
                onClick={() => handleRuleToggle('taking_drug')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  rules.taking_drug.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  rules.taking_drug.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action on Detection</label>
              <select
                value={rules.taking_drug.action}
                onChange={(e) => handleActionChange('taking_drug', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="end_stream_ban">Immediate Terminate & Ban</option>
                <option value="blur_stream">Auto-Blur Video Stream</option>
                <option value="warn_overlay">Display Warning Notice</option>
              </select>
            </div>
          </div>

          {/* 5. Showing Middle Finger */}
          <div className={`p-4 rounded-2xl border transition-all ${
            rules.middle_finger.enabled ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-hand-middle-finger"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Showing Fuck with Finger</h4>
                  <span className="text-[10px] text-slate-400">Middle finger 3D skeletal gesture</span>
                </div>
              </div>
              <button
                onClick={() => handleRuleToggle('middle_finger')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  rules.middle_finger.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  rules.middle_finger.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action on Detection</label>
              <select
                value={rules.middle_finger.action}
                onChange={(e) => handleActionChange('middle_finger', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                <option value="warn_overlay">Instant Warning Notice</option>
                <option value="blur_stream">Auto-Blur Hand / Stream</option>
                <option value="end_stream_ban">Immediate Terminate & Ban</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ONLINE SUPPORTED NEURAL NETWORK MODEL HUB */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <i className="fa-solid fa-cloud-arrow-down text-sm"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Online Supported AI Models (Anti-Smoking, Vaping & Fuck Finger Detection)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    DEFAULT: ON
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured online model repositories for automated visual sentinel enforcement. Download from online URLs, toggle ON/OFF, remove weights, or update custom repository links.
                </p>
              </div>
            </div>
          </div>

          {/* Model Category Tabs */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setModelFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modelFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Models ({models.length})
            </button>
            <button
              onClick={() => setModelFilter('smoking_vaping')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modelFilter === 'smoking_vaping' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚬 Smoking & Vaping
            </button>
            <button
              onClick={() => setModelFilter('middle_finger')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modelFilter === 'middle_finger' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🖕 Fuck Finger Gesture
            </button>
          </div>
        </div>

        {/* Models Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {models
            .filter(model => {
              if (modelFilter === 'smoking_vaping') return model.targetOffense === 'smoking_vaping';
              if (modelFilter === 'middle_finger') return model.targetOffense === 'middle_finger';
              if (modelFilter === 'weapons_drugs') return model.targetOffense === 'sharp_knife' || model.targetOffense === 'taking_drug';
              return true;
            })
            .map((model) => {
              const isDownloading = downloadingModelId === model.id;

              return (
                <div
                  key={model.id}
                  className={`bg-slate-950/70 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    model.enabled && model.downloaded
                      ? 'border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                      : !model.downloaded
                      ? 'border-dashed border-slate-800 opacity-90'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Top Row: Category, Format & Status Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                          {model.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          {model.format}
                        </span>
                      </div>

                      {/* Download Status & Master ON/OFF Badge */}
                      <div className="flex items-center space-x-1.5">
                        {model.downloaded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Installed</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Uninstalled
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                            model.enabled
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${model.enabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}></span>
                          <span>{model.enabled ? 'SENTINEL ON' : 'OFF'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Model Title & Description */}
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{model.name}</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">({model.version})</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {model.description}
                    </p>

                    {/* Online Supported URL Section */}
                    <div className="mt-3.5 bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1.5">
                        <span className="flex items-center space-x-1 text-cyan-300">
                          <i className="fa-solid fa-link text-[10px]"></i>
                          <span>Online Supported Model URL:</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleCopyUrl(model.onlineUrl)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                            title="Copy online URL"
                          >
                            <i className="fa-solid fa-copy mr-1"></i> Copy
                          </button>
                          <button
                            onClick={() => handleOpenEditUrl(model)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                            title="Edit URL or specify custom mirror"
                          >
                            <i className="fa-solid fa-pen-to-square mr-1"></i> Edit
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded-lg border border-slate-800/80 select-all">
                        {model.onlineUrl}
                      </div>
                    </div>

                    {/* Metadata Specs Bar */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-400">
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Size:</span>
                        <span className="font-mono text-white font-semibold">{model.size}</span>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Sensitivity:</span>
                        <span className="font-mono text-indigo-300 font-semibold">{model.confidenceThreshold}% Conf</span>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Default Mode:</span>
                        <span className="font-mono text-emerald-400 font-semibold">ON</span>
                      </div>
                    </div>

                    {/* Download Progress Bar if in progress */}
                    {isDownloading && (
                      <div className="mt-3.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 animate-pulse">
                        <div className="flex items-center justify-between text-xs text-indigo-200 font-semibold mb-1">
                          <span className="flex items-center space-x-1.5">
                            <i className="fa-solid fa-cloud-arrow-down animate-bounce"></i>
                            <span>Downloading model from online repository...</span>
                          </span>
                          <span className="font-mono">{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-200"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions & Lifecycle Controls */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    {/* Master ON/OFF Switch */}
                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => handleToggleModel(model)}
                        disabled={!model.downloaded || isDownloading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          model.enabled ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                        title={model.enabled ? 'Click to turn OFF model' : 'Click to turn ON model'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            model.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-slate-300">
                        {model.enabled ? 'Model Active (ON)' : 'Model Disabled (OFF)'}
                      </span>
                    </div>

                    {/* Download / Remove Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {model.downloaded ? (
                        <>
                          <button
                            onClick={() => handleDownloadModelBack(model)}
                            disabled={isDownloading}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            title="Re-download / verify weights from online URL"
                          >
                            <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
                            <span>Re-download</span>
                          </button>
                          <button
                            onClick={() => handleRemoveModel(model)}
                            disabled={isDownloading}
                            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
                            title="Remove model from cache and disable detection"
                          >
                            <i className="fa-solid fa-trash-can text-[11px]"></i>
                            <span>Remove</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownloadModelBack(model)}
                          disabled={isDownloading}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          <i className="fa-solid fa-cloud-arrow-down"></i>
                          <span>Download Model (Online)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* EDIT ONLINE URL MODAL */}
      {editingUrlModel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-link text-cyan-400"></i>
                <h4 className="text-sm font-bold text-white">Edit Online Model Repository URL</h4>
              </div>
              <button
                onClick={() => setEditingUrlModel(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Model: <span className="text-white">{editingUrlModel.name}</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Enter an online weights repository URL (Hugging Face, GitHub Releases, CDN, or S3 bucket) in <b className="text-cyan-300">.{editingUrlModel.format}</b> format:
                </p>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="https://huggingface.co/.../model.onnx"
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Official Default Mirrors:</div>
                <div className="text-[10px] text-indigo-300 font-mono truncate">
                  {editingUrlModel.mirrorUrl || 'https://storage.googleapis.com/...'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditingUrlModel(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomUrl}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Save Online URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Stream Room Scanner Grid with Test Violation Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <i className="fa-solid fa-video text-red-500"></i>
              <span>Live Stream Rooms Scanner (Sentinel Viewport)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing active video feeds and simulated automated enforcement.
            </p>
          </div>
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black px-3 py-1 rounded-full animate-pulse">
            {streams.length} BROADCASTS SCANNED
          </span>
        </div>

        {streams.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
            <i className="fa-solid fa-video-slash text-2xl text-slate-600 mb-2"></i>
            <p className="text-xs text-slate-400">No live stream rooms currently broadcasting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map((s) => (
              <div key={s.id} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative aspect-video bg-black">
                  <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                  
                  {/* AI Vision HUD Overlay */}
                  <div className="absolute inset-0 border-2 border-indigo-500/40 pointer-events-none flex flex-col justify-between p-2 font-mono text-[9px] text-cyan-300">
                    <div className="flex justify-between items-center bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      <span>ROOM: #{s.id.slice(-6)}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> AI SCANNING
                      </span>
                    </div>
                    <div className="flex justify-between items-end bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      <span>3D MESH: ACTIVE</span>
                      <span>FPS: 30.0</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{s.title}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Host: {s.broadcaster.name} ({s.broadcaster.id})</span>
                  </div>

                  {/* Simulator Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-700/60">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Trigger Test Violation:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => runSimulatedDetection(s, 'smoking')}
                        className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded text-[9px] font-bold"
                      >
                        🚬 Smoke
                      </button>
                      <button
                        onClick={() => runSimulatedDetection(s, 'vaping')}
                        className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded text-[9px] font-bold"
                      >
                        💨 Vape
                      </button>
                      <button
                        onClick={() => runSimulatedDetection(s, 'sharp_knife')}
                        className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/60 rounded text-[9px] font-bold"
                      >
                        🔪 Knife
                      </button>
                      <button
                        onClick={() => runSimulatedDetection(s, 'taking_drug')}
                        className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/60 rounded text-[9px] font-bold"
                      >
                        💊 Drug
                      </button>
                      <button
                        onClick={() => runSimulatedDetection(s, 'middle_finger')}
                        className="px-2 py-1 bg-pink-950 hover:bg-pink-900 text-pink-300 border border-pink-800/60 rounded text-[9px] font-bold"
                      >
                        🖕 Middle Finger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Ban List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <i className="fa-solid fa-gavel text-amber-400"></i>
              <span>Enforced Ban List & Prohibited Host Records</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">List of hosts penalized by manual action or automated AI sentinel detection.</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {banList.filter(b => b.status === 'ACTIVE_BAN').length} Active Bans
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Host / Room</th>
                <th className="py-3 px-4">Detected Offense</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">Enforcement Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {banList.map((ban) => (
                <tr key={ban.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{ban.hostName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {ban.hostId} • Room: {ban.roomId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-950 text-red-300 border border-red-800/60">
                      {ban.offense.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <img
                      src={ban.evidenceSnapshot}
                      alt="Evidence"
                      className="w-14 h-9 object-cover rounded-lg border border-slate-700"
                    />
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                    {new Date(ban.detectedAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      ban.status === 'ACTIVE_BAN'
                        ? 'bg-red-950 text-red-400 border border-red-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {ban.status === 'ACTIVE_BAN' ? 'ACTIVE BAN' : 'REVOKED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {ban.status === 'ACTIVE_BAN' ? (
                      <button
                        onClick={() => handleRevokeBan(ban.id, ban.hostName)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Revoke Ban
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Restored</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Plugin Modal */}
      {isUploadingPlugin && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-cube text-cyan-400"></i>
                <span>Upload AI Plugin / 3D Model</span>
              </h3>
              <button
                onClick={() => setIsUploadingPlugin(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleUploadPlugin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Plugin / Model File
                </label>
                <input
                  type="file"
                  accept=".onnx,.tflite,.glb,.gltf,.bin,.pt,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFileName(file.name);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Model Architecture / Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                >
                  <option value="glb_3d">3D Modeling Skeletal Mesh (.glb / .gltf)</option>
                  <option value="onnx">ONNX Runtime Neural Network (.onnx)</option>
                  <option value="tflite">TensorFlow Lite (.tflite)</option>
                  <option value="tfjs">TensorFlow.js Model (.json + .bin)</option>
                  <option value="yolo_pt">PyTorch YOLO Vision (.pt)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Target Prohibited Behavior
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                >
                  <option value="middle_finger">Showing Middle Finger (Fuck Finger)</option>
                  <option value="sharp_knife">Holding Sharp Knife / Blade</option>
                  <option value="smoking">Smoking & Tobacco</option>
                  <option value="vaping">Vaping & E-Cigarette Clouds</option>
                  <option value="taking_drug">Taking Drugs & Narcotics</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadingPlugin(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFileName}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
                >
                  Mount Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
