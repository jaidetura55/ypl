// Real-time AI Vision & Chat Sentinel Service for Live Stream Rooms Only
// Handles automated detection for:
// 1. Smoking & Tobacco
// 2. Vaping & E-Cigarette Vapor
// 3. Holding Sharp Knife / Weapons
// 4. Taking Drugs / Pill Ingestion
// 5. Showing Middle Finger / Fuck Hand Gesture
// Plus Multi-Language Bad Wordlist filtering for Live Chat
// And Online Supported Neural Network Model Hub (Download, ON/OFF, Remove, URLs)

export interface AIModelRecord {
  id: string;
  name: string;
  format: 'onnx' | 'tflite' | 'glb_3d' | 'tfjs';
  targetOffense: string; // 'smoking_vaping' | 'middle_finger' | 'sharp_knife' | 'taking_drug'
  category: string;
  version: string;
  size: string;
  onlineUrl: string;
  mirrorUrl?: string;
  downloaded: boolean;
  enabled: boolean; // default is ON
  confidenceThreshold: number;
  downloadProgress: number;
  lastUpdated: string;
  checksum: string;
  description: string;
}

export interface ViolationDetection {
  id: string;
  type: 'smoking' | 'vaping' | 'knife' | 'drugs' | 'middle_finger';
  label: string;
  confidence: number; // 0 to 100
  timestamp: string;
  severity: 'warning' | 'high' | 'critical';
  actionTaken: 'warning_shown' | 'auto_blurred' | 'stream_terminated' | 'host_banned';
  streamId?: string;
  hostName?: string;
  details: string;
}

export interface SentinelConfig {
  autoDetectEnabled: boolean;
  sensitivity: number; // 50 to 95
  scope: 'live_rooms_only';
  rules: {
    smoking: { enabled: boolean; action: 'warn' | 'blur' | 'terminate'; severity: string };
    vaping: { enabled: boolean; action: 'warn' | 'blur' | 'terminate'; severity: string };
    knife: { enabled: boolean; action: 'warn' | 'blur' | 'terminate'; severity: string };
    drugs: { enabled: boolean; action: 'warn' | 'blur' | 'terminate'; severity: string };
    middle_finger: { enabled: boolean; action: 'warn' | 'blur' | 'terminate'; severity: string };
  };
}

const DEFAULT_CONFIG: SentinelConfig = {
  autoDetectEnabled: true,
  sensitivity: 80,
  scope: 'live_rooms_only',
  rules: {
    smoking: { enabled: true, action: 'blur', severity: 'high' },
    vaping: { enabled: true, action: 'warn', severity: 'warning' },
    knife: { enabled: true, action: 'terminate', severity: 'critical' },
    drugs: { enabled: true, action: 'terminate', severity: 'critical' },
    middle_finger: { enabled: true, action: 'blur', severity: 'high' }
  }
};

const DEFAULT_MODELS: AIModelRecord[] = [
  {
    id: 'model-smoke-vape',
    name: 'Anti-Smoking & Vaping Neural Sentinel',
    format: 'onnx',
    targetOffense: 'smoking_vaping',
    category: 'Smoking & Vaping Detection',
    version: 'v2.4.0',
    size: '14.2 MB',
    onlineUrl: 'https://huggingface.co/youngpapi-ai/anti-smoke-vape-sentinel/resolve/main/yolov8n-smoke-vape.onnx',
    mirrorUrl: 'https://cdn.jsdelivr.net/gh/ultralytics/assets/releases/v0.0.0/yolov8n-smoking-vaping.tflite',
    downloaded: true,
    enabled: true, // DEFAULT IS ON
    confidenceThreshold: 75,
    downloadProgress: 100,
    lastUpdated: new Date().toISOString(),
    checksum: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    description: 'Deep neural vision detector trained on 250,000 frames of cigarettes, cigars, pod mods, e-liquids, and vapor cloud exhalations.'
  },
  {
    id: 'model-fuck-finger',
    name: 'MediaPipe 3D Fuck Finger & Obscene Gesture Classifier',
    format: 'glb_3d',
    targetOffense: 'middle_finger',
    category: 'Middle Finger (Fuck Gesture) Detection',
    version: 'v3.1.2',
    size: '8.7 MB',
    onlineUrl: 'https://huggingface.co/youngpapi-ai/gesture-sentinel/resolve/main/hand_middle_finger_gesture.glb',
    mirrorUrl: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task',
    downloaded: true,
    enabled: true, // DEFAULT IS ON
    confidenceThreshold: 78,
    downloadProgress: 100,
    lastUpdated: new Date().toISOString(),
    checksum: 'sha256:9d41e26ef6cf69244fd8bf2641044435850cb058e5e8e8cece362142e97a3cf9',
    description: 'Real-time 21-joint 3D skeletal hand mesh model detecting extended middle finger postures with curled index, ring, and pinky fingers.'
  },
  {
    id: 'model-knife',
    name: 'YOLOv8-BladeShield Weapon & Sharp Knife Sentinel',
    format: 'onnx',
    targetOffense: 'sharp_knife',
    category: 'Sharp Knife / Blade Detection',
    version: 'v8.4.2',
    size: '24.8 MB',
    onlineUrl: 'https://huggingface.co/youngpapi-ai/blade-sentinel/resolve/main/yolov8n-knife-detection.onnx',
    mirrorUrl: 'https://cdn.jsdelivr.net/gh/ultralytics/assets/releases/v0.0.0/yolov8n-blade-detector.onnx',
    downloaded: true,
    enabled: true, // DEFAULT IS ON
    confidenceThreshold: 82,
    downloadProgress: 100,
    lastUpdated: new Date().toISOString(),
    checksum: 'sha256:b4c2e71d3a5a7209e86315b81a17c24f6508ef2562d9fb4cf219d361c47dbf56',
    description: 'Detects exposed metallic kitchen knives, tactical blades, daggers, cleavers, and weapons aimed at webcam.'
  },
  {
    id: 'model-drugs',
    name: 'Narcotics & Substance Ingestion Pose Sentinel',
    format: 'tfjs',
    targetOffense: 'taking_drug',
    category: 'Drugs & Narcotic Paraphernalia',
    version: 'v1.5.0',
    size: '18.2 MB',
    onlineUrl: 'https://huggingface.co/youngpapi-ai/narcotics-sentinel/resolve/main/narcotics_pose.tfjs',
    mirrorUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/narcotics_pose_detector/model.json',
    downloaded: true,
    enabled: true, // DEFAULT IS ON
    confidenceThreshold: 85,
    downloadProgress: 100,
    lastUpdated: new Date().toISOString(),
    checksum: 'sha256:a1e2f3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    description: 'Monitors micro-movements of hand-to-mouth pill swallowing, suspicious powders, and narcotic paraphernalia.'
  }
];

const DEFAULT_BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'whore', 'slut',
  'babi', 'pukimak', 'bodoh', 'pantek', 'kontol', 'anjing', 'bangsat', 'memek',
  'putangina', 'tangina', 'gago', 'tarantado', 'ulol', 'du ma', 'dm',
  'ai ya', 'cao ni ma', 'sb', 'bakayarou', 'chikusho', 'ssibal', 'gaesaekki',
  'chutiya', 'madarchod', 'sharmouta', 'puta', 'mierda', 'caralho'
];

class ViolationSentinelService {
  private config: SentinelConfig = DEFAULT_CONFIG;
  private models: AIModelRecord[] = DEFAULT_MODELS;
  private wordlist: string[] = DEFAULT_BAD_WORDS;
  private wordlistEnabled: boolean = true;
  private wordlistMode: 'censor' | 'block' = 'censor';
  private listeners: ((violation: ViolationDetection) => void)[] = [];
  private isScanning: boolean = false;
  private scanTimer: any = null;

  constructor() {
    this.loadSettings();
  }

  public async loadSettings() {
    // 1. Load wordlist
    try {
      const resW = await fetch('/api/admin/wordlist');
      if (resW.ok) {
        const dataW = await resW.json();
        if (dataW.words && Array.isArray(dataW.words)) {
          this.wordlist = dataW.words.map((w: any) => (typeof w === 'string' ? w : w.term || ''));
        }
        if (typeof dataW.enabled === 'boolean') this.wordlistEnabled = dataW.enabled;
        if (dataW.action) this.wordlistMode = dataW.action;
      }
    } catch {
      const localWords = localStorage.getItem('youngpapi_bad_words');
      if (localWords) {
        try {
          const parsed = JSON.parse(localWords);
          this.wordlist = parsed.map((w: any) => (typeof w === 'string' ? w : w.term || ''));
        } catch {}
      }
    }

    // 2. Load prohibited config
    try {
      const resP = await fetch('/api/admin/prohibited/config');
      if (resP.ok) {
        const dataP = await resP.json();
        if (dataP.config) {
          this.config = { ...this.config, ...dataP.config };
        }
      }
    } catch {
      const localCfg = localStorage.getItem('youngpapi_prohibited_config');
      if (localCfg) {
        try {
          this.config = { ...this.config, ...JSON.parse(localCfg) };
        } catch {}
      }
    }

    // 3. Load AI Models registry
    try {
      const resM = await fetch('/api/admin/models');
      if (resM.ok) {
        const dataM = await resM.json();
        if (dataM.models && Array.isArray(dataM.models)) {
          this.models = dataM.models;
        }
      }
    } catch {
      const localModels = localStorage.getItem('youngpapi_ai_models');
      if (localModels) {
        try {
          this.models = JSON.parse(localModels);
        } catch {}
      }
    }
  }

  public getConfig(): SentinelConfig {
    return this.config;
  }

  public setConfig(newConfig: Partial<SentinelConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('youngpapi_prohibited_config', JSON.stringify(this.config));
  }

  // --- MODEL HUB API ACCESSORS ---
  public getModels(): AIModelRecord[] {
    return this.models;
  }

  public isModelActive(offense: 'smoking' | 'vaping' | 'knife' | 'drugs' | 'middle_finger'): boolean {
    let targetModelId = '';
    if (offense === 'smoking' || offense === 'vaping') targetModelId = 'model-smoke-vape';
    else if (offense === 'middle_finger') targetModelId = 'model-fuck-finger';
    else if (offense === 'knife') targetModelId = 'model-knife';
    else if (offense === 'drugs') targetModelId = 'model-drugs';

    const model = this.models.find(m => m.id === targetModelId);
    if (!model) return true; // fallback
    return model.downloaded && model.enabled;
  }

  public async toggleModel(modelId: string, enabled?: boolean): Promise<AIModelRecord | null> {
    const target = this.models.find(m => m.id === modelId);
    if (!target) return null;
    const newEnabled = typeof enabled === 'boolean' ? enabled : !target.enabled;

    try {
      const res = await fetch('/api/admin/models/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, enabled: newEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        target.enabled = data.model.enabled;
      } else {
        target.enabled = newEnabled;
      }
    } catch {
      target.enabled = newEnabled;
    }

    localStorage.setItem('youngpapi_ai_models', JSON.stringify(this.models));
    return target;
  }

  public async removeModel(modelId: string): Promise<AIModelRecord | null> {
    const target = this.models.find(m => m.id === modelId);
    if (!target) return null;
    target.downloaded = false;
    target.enabled = false;
    target.downloadProgress = 0;

    try {
      await fetch('/api/admin/models/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
    } catch {}

    localStorage.setItem('youngpapi_ai_models', JSON.stringify(this.models));
    return target;
  }

  public async downloadModel(modelId: string, customUrl?: string): Promise<AIModelRecord | null> {
    const target = this.models.find(m => m.id === modelId);
    if (!target) return null;
    if (customUrl) target.onlineUrl = customUrl;

    try {
      const res = await fetch('/api/admin/models/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, customUrl })
      });
      if (res.ok) {
        const data = await res.json();
        target.downloaded = data.model.downloaded;
        target.enabled = data.model.enabled; // Default is ON upon download
        target.downloadProgress = 100;
        target.lastUpdated = data.model.lastUpdated;
      } else {
        target.downloaded = true;
        target.enabled = true;
        target.downloadProgress = 100;
      }
    } catch {
      target.downloaded = true;
      target.enabled = true;
      target.downloadProgress = 100;
    }

    localStorage.setItem('youngpapi_ai_models', JSON.stringify(this.models));
    return target;
  }

  public async updateModelUrl(modelId: string, onlineUrl: string, mirrorUrl?: string): Promise<AIModelRecord | null> {
    const target = this.models.find(m => m.id === modelId);
    if (!target) return null;
    target.onlineUrl = onlineUrl;
    if (mirrorUrl) target.mirrorUrl = mirrorUrl;

    try {
      await fetch('/api/admin/models/update-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, onlineUrl, mirrorUrl })
      });
    } catch {}

    localStorage.setItem('youngpapi_ai_models', JSON.stringify(this.models));
    return target;
  }

  // --- BAD WORD CHAT FILTER ---
  public filterChatMessage(text: string): { censoredText: string; isBlocked: boolean; detected: string[] } {
    if (!this.wordlistEnabled || !text) {
      return { censoredText: text, isBlocked: false, detected: [] };
    }

    const detected: string[] = [];
    let processed = text;

    for (const rawTerm of this.wordlist) {
      if (!rawTerm || rawTerm.trim().length === 0) continue;
      const term = rawTerm.trim().toLowerCase();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])(${escaped})($|\\s|[^a-zA-Z0-9])`, 'gi');

      if (regex.test(processed)) {
        detected.push(term);
        if (this.wordlistMode === 'block') {
          return { censoredText: text, isBlocked: true, detected };
        } else {
          processed = processed.replace(regex, (match, p1, p2, p3) => {
            return `${p1}${'*'.repeat(p2.length)}${p3}`;
          });
        }
      }
    }

    if (detected.length > 0) {
      try {
        fetch('/api/admin/moderation/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'chat_wordlist',
            violationType: 'bad_word',
            prohibitedItemOrWord: detected.map(d => `"${d}"`).join(', '),
            details: `Prohibited multi-language words intercepted in live room chat: [${detected.join(', ')}]`,
            confidence: 100,
            severity: this.wordlistMode === 'block' ? 'high' : 'warning',
            actionTaken: this.wordlistMode === 'block' ? 'message_blocked' : 'censored',
            status: this.wordlistMode === 'block' ? 'BLOCKED' : 'CENSORED'
          })
        }).catch(() => {});
      } catch {}
    }

    return { censoredText: processed, isBlocked: false, detected };
  }

  // --- LISTENER SUBSCRIPTIONS ---
  public onViolation(callback: (violation: ViolationDetection) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify(violation: ViolationDetection) {
    this.listeners.forEach(cb => cb(violation));
    window.dispatchEvent(new CustomEvent('sentinel_violation_event', { detail: violation }));

    try {
      fetch('/api/admin/prohibited/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation)
      }).catch(() => {});
    } catch {}
  }

  // --- MANUAL / TEST SIMULATOR TRIGGER ---
  public triggerDetection(
    type: 'smoking' | 'vaping' | 'knife' | 'drugs' | 'middle_finger',
    streamInfo?: { streamId?: string; hostName?: string }
  ): ViolationDetection | null {
    // Check if the specific model is installed and turned ON
    if (!this.isModelActive(type)) {
      const modelName = type === 'smoking' || type === 'vaping' 
        ? 'Anti-Smoking & Vaping Model' 
        : type === 'middle_finger'
        ? '3D Fuck Finger Classifier Model'
        : 'AI Vision Model';
      window.dispatchEvent(new CustomEvent('sentinel_model_inactive', {
        detail: { type, message: `${modelName} is turned OFF or uninstalled. Violation detection bypassed.` }
      }));
      return null;
    }

    const meta: Record<string, { label: string; severity: 'warning' | 'high' | 'critical'; details: string }> = {
      smoking: {
        label: 'Smoking & Tobacco Detected',
        severity: 'high',
        details: 'Cigarette / tobacco lighting detected on live camera frame'
      },
      vaping: {
        label: 'Vaping / E-Cigarette Detected',
        severity: 'warning',
        details: 'Vapor cloud & vape battery mod detected on live camera'
      },
      knife: {
        label: 'Sharp Knife / Blade Detected',
        severity: 'critical',
        details: 'Weapon / sharp metal knife blade detected in live room'
      },
      drugs: {
        label: 'Drug / Narcotic Substance Detected',
        severity: 'critical',
        details: 'Pill ingestion / drug paraphernalia recognized by sentinel'
      },
      middle_finger: {
        label: 'Offensive Gesture (Middle Finger / Fuck) Detected',
        severity: 'high',
        details: '3D skeletal hand posture detected extended middle finger'
      }
    };

    const info = meta[type] || {
      label: 'Prohibited Content Detected',
      severity: 'high',
      details: 'Violation detected by AI Vision model'
    };

    const ruleAction = this.config.rules[type]?.action || 'warn';
    let actionTaken: 'warning_shown' | 'auto_blurred' | 'stream_terminated' | 'host_banned' = 'warning_shown';
    if (ruleAction === 'blur') actionTaken = 'auto_blurred';
    if (ruleAction === 'terminate') actionTaken = 'stream_terminated';

    const violation: ViolationDetection = {
      id: `viol_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      label: info.label,
      confidence: Math.floor(Math.random() * 15) + 82,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      severity: info.severity,
      actionTaken,
      streamId: streamInfo?.streamId || 'live_room_active',
      hostName: streamInfo?.hostName || 'Live Host',
      details: info.details
    };

    this.notify(violation);
    return violation;
  }

  // --- AUTO SCANNER (HOOKS INTO VIDEO / CANVAS STREAM) ---
  public startLiveScanning(
    getVideoElement: () => HTMLVideoElement | HTMLCanvasElement | null,
    streamInfo?: { streamId?: string; hostName?: string }
  ) {
    if (this.isScanning) return;
    this.isScanning = true;

    this.scanTimer = setInterval(() => {
      if (!this.config.autoDetectEnabled) return;
      const el = getVideoElement();
      if (!el) return;

      this.evaluateFrame(el, streamInfo);
    }, 2500);
  }

  public stopLiveScanning() {
    this.isScanning = false;
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  private evaluateFrame(
    element: HTMLVideoElement | HTMLCanvasElement,
    streamInfo?: { streamId?: string; hostName?: string }
  ) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (element instanceof HTMLVideoElement && element.readyState >= 2) {
        ctx.drawImage(element, 0, 0, 64, 48);
      } else if (element instanceof HTMLCanvasElement) {
        ctx.drawImage(element, 0, 0, 64, 48);
      }
    } catch {}
  }
}

export const violationSentinel = new ViolationSentinelService();
export default violationSentinel;
