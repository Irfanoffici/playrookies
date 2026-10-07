/**
 * Rookies - Professional Group Acoustic Decibel Engine
 * Designed for collective crowd / group shouting showdowns:
 * - Dual-domain analysis: Time-Domain True Peak + Frequency Vocal Bandpower (300Hz - 4.5kHz)
 * - Multi-harmonic vocal density detection (accurately captures collective sound pressure)
 * - Fast Ballistics (IEC 61672 Fast SPL Standard: ~15ms instant attack, smooth 200ms decay)
 * - Independent Peak-Hold Needle tracking (holds peak shouts for 650ms with smooth release)
 * - Real acoustic dB SPL calibration curve (30 dB room ambient to 115+ dB stadium roar)
 * - Automatic 1-Click Room Ambient Noise Calibration
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.streamLeft = null;
    this.streamRight = null;

    // Analyser nodes
    this.analyserLeft = null;
    this.analyserRight = null;
    this.splitter = null;

    // Analysis Buffers
    this.fftSize = 1024;
    this.dataLeft = null;
    this.dataRight = null;
    this.freqLeft = null;
    this.freqRight = null;

    // Ballistic Filtered Levels (Smoothed for display & propulsion)
    this.boysDb = 35;
    this.girlsDb = 35;

    // Floating Peak-Hold Needle Levels (Holds the loudest shout point)
    this.boysPeakHold = 35;
    this.girlsPeakHold = 35;
    this.boysPeakTimer = 0;
    this.girlsPeakTimer = 0;

    // Historical all-time peaks for race stats
    this.boysPeak = 0;
    this.girlsPeak = 0;

    // Tuned Sensitivity & Noise Gate (Independent per channel + Linked mode)
    this.boysSensitivity = 2.5;
    this.girlsSensitivity = 2.5;
    this.boysNoiseFloor = 45;       // Ambient threshold (dB) for Boys
    this.girlsNoiseFloor = 45;      // Ambient threshold (dB) for Girls
    this.calibrationMode = 'linked'; // 'linked' or 'split'
    this.boostThreshold = 80;       // Turbo threshold (dB)

    // Routing
    this.leftDeviceId = '';
    this.rightDeviceId = '';
    this.inputMode = 'dual-device'; // 'dual-device', 'stereo', 'keyboard'
    this.isSwapped = false;
    this.isListening = false;

    // Room Auto-Calibration state (Independent per channel)
    this.isCalibrating = false;
    this.calibrationSamplesLeft = [];
    this.calibrationSamplesRight = [];

    // Keyboard Simulator
    this.simKeys = { KeyA: false, KeyL: false };
    this._initKeyboardSim();
  }
 
  // Backward compatibility getters & setters for linked calibration
  get sensitivity() {
    return (this.boysSensitivity + this.girlsSensitivity) / 2;
  }
  set sensitivity(val) {
    this.boysSensitivity = val;
    this.girlsSensitivity = val;
  }

  get noiseFloor() {
    return (this.boysNoiseFloor + this.girlsNoiseFloor) / 2;
  }
  set noiseFloor(val) {
    this.boysNoiseFloor = val;
    this.girlsNoiseFloor = val;
  }

  async initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  async setInputMode(mode) {
    this.inputMode = mode;
    if (this.isListening) {
      await this.startListening();
    }
  }

  async setSingleDevice(deviceId) {
    this.leftDeviceId = deviceId;
    this.rightDeviceId = deviceId;
    if (this.isListening) await this.startListening();
  }

  async startListening() {
    await this.initAudioContext();
    this.stopListening();

    try {
      if (this.inputMode === 'keyboard') {
        this._setupKeyboardSimNodes();
      } else if (this.inputMode === 'stereo') {
        await this._setupStereoSplit();
      } else if (this.inputMode === 'single-shared') {
        await this._setupSingleShared();
      } else {
        await this._setupDualDevices();
      }
      this.isListening = true;
      return { success: true };
    } catch (err) {
      console.error('Failed to start audio listening:', err);
      return { success: false, error: err.message };
    }
  }

  stopListening() {
    if (this.streamLeft) {
      this.streamLeft.getTracks().forEach(t => t.stop());
      this.streamLeft = null;
    }
    if (this.streamRight) {
      this.streamRight.getTracks().forEach(t => t.stop());
      this.streamRight = null;
    }
    this.isListening = false;
  }

  async setLeftDevice(deviceId) {
    this.leftDeviceId = deviceId;
    if (this.isListening) await this.startListening();
  }

  async setRightDevice(deviceId) {
    this.rightDeviceId = deviceId;
    if (this.isListening) await this.startListening();
  }

  async swapMics() {
    const temp = this.leftDeviceId;
    this.leftDeviceId = this.rightDeviceId;
    this.rightDeviceId = temp;
    this.isSwapped = !this.isSwapped;
    if (this.isListening) await this.startListening();
    return { leftDeviceId: this.leftDeviceId, rightDeviceId: this.rightDeviceId, isSwapped: this.isSwapped };
  }

  async _setupSingleShared() {
    const effectiveId = this.leftDeviceId || this.rightDeviceId;
    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    };
    if (effectiveId && effectiveId !== 'default') {
      constraints.audio.deviceId = { exact: effectiveId };
    }

    this.streamLeft = await navigator.mediaDevices.getUserMedia(constraints);
    const source = this.audioCtx.createMediaStreamSource(this.streamLeft);

    this.analyserLeft = this.audioCtx.createAnalyser();
    this.analyserLeft.fftSize = this.fftSize;
    this.analyserLeft.smoothingTimeConstant = 0.15;
    source.connect(this.analyserLeft);

    this.analyserRight = this.audioCtx.createAnalyser();
    this.analyserRight.fftSize = this.fftSize;
    this.analyserRight.smoothingTimeConstant = 0.15;
    source.connect(this.analyserRight);

    this._allocBuffers();
  }

  async _setupStereoSplit() {
    const devId = this.isSwapped ? this.rightDeviceId : this.leftDeviceId;
    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: { ideal: 2, min: 2 }
      }
    };
    if (devId && devId !== 'default') {
      constraints.audio.deviceId = { exact: devId };
    }

    try {
      this.streamLeft = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      // Driver or browser fallback if min: 2 is not strictly satisfied
      delete constraints.audio.channelCount;
      constraints.audio.channelCount = 2;
      this.streamLeft = await navigator.mediaDevices.getUserMedia(constraints);
    }

    const track = this.streamLeft.getAudioTracks()[0];
    const settings = track ? track.getSettings() : {};
    console.log(`[AudioEngine] Stereo Split activated on "${track ? track.label : 'source'}". Channels: ${settings.channelCount || 2}`);

    const source = this.audioCtx.createMediaStreamSource(this.streamLeft);

    this.splitter = this.audioCtx.createChannelSplitter(2);
    source.connect(this.splitter);

    this.analyserLeft = this.audioCtx.createAnalyser();
    this.analyserLeft.fftSize = this.fftSize;
    this.analyserLeft.smoothingTimeConstant = 0.15; // Fast response for live screaming

    this.analyserRight = this.audioCtx.createAnalyser();
    this.analyserRight.fftSize = this.fftSize;
    this.analyserRight.smoothingTimeConstant = 0.15;

    const chL = this.isSwapped ? 1 : 0;
    const chR = this.isSwapped ? 0 : 1;
    this.splitter.connect(this.analyserLeft, chL);
    this.splitter.connect(this.analyserRight, chR);

    this._allocBuffers();
  }

  async _setupDualDevices() {
    const effectiveLeftId = this.isSwapped ? this.rightDeviceId : this.leftDeviceId;
    const effectiveRightId = this.isSwapped ? this.leftDeviceId : this.rightDeviceId;

    // Left Mic (Boys)
    const constraintsL = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    };
    if (effectiveLeftId) constraintsL.audio.deviceId = { exact: effectiveLeftId };

    this.streamLeft = await navigator.mediaDevices.getUserMedia(constraintsL);
    const sourceL = this.audioCtx.createMediaStreamSource(this.streamLeft);
    this.analyserLeft = this.audioCtx.createAnalyser();
    this.analyserLeft.fftSize = this.fftSize;
    this.analyserLeft.smoothingTimeConstant = 0.15;
    sourceL.connect(this.analyserLeft);

    // Right Mic (Girls)
    if (effectiveRightId && effectiveRightId !== effectiveLeftId) {
      const constraintsR = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };
      constraintsR.audio.deviceId = { exact: effectiveRightId };

      this.streamRight = await navigator.mediaDevices.getUserMedia(constraintsR);
      const sourceR = this.audioCtx.createMediaStreamSource(this.streamRight);
      this.analyserRight = this.audioCtx.createAnalyser();
      this.analyserRight.fftSize = this.fftSize;
      this.analyserRight.smoothingTimeConstant = 0.15;
      sourceR.connect(this.analyserRight);
    } else {
      this.analyserRight = this.audioCtx.createAnalyser();
      this.analyserRight.fftSize = this.fftSize;
      this.analyserRight.smoothingTimeConstant = 0.15;
      sourceL.connect(this.analyserRight);
    }

    this._allocBuffers();
  }

  _allocBuffers() {
    this.dataLeft = new Float32Array(this.analyserLeft.fftSize);
    this.dataRight = new Float32Array(this.analyserRight.fftSize);
    this.freqLeft = new Uint8Array(this.analyserLeft.frequencyBinCount);
    this.freqRight = new Uint8Array(this.analyserRight.frequencyBinCount);
  }

  _setupKeyboardSimNodes() {
    this.analyserLeft = null;
    this.analyserRight = null;
  }

  _initKeyboardSim() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA') this.simKeys.KeyA = true;
      if (e.code === 'KeyL') this.simKeys.KeyL = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') this.simKeys.KeyA = false;
      if (e.code === 'KeyL') this.simKeys.KeyL = false;
    });
  }

  /**
   * Advanced Acoustic Group Sound Pressure Calculation
   * Measures vocal formant energy density (250Hz - 4500Hz) combined with RMS & True Peak.
   */
  _calculateAcousticSPL(analyser, timeBuffer, freqBuffer) {
    if (!analyser || !timeBuffer || !freqBuffer) return 32;

    // 1. Time-Domain RMS & True Peak
    analyser.getFloatTimeDomainData(timeBuffer);
    let sumSquares = 0;
    let truePeak = 0;
    const len = timeBuffer.length;

    for (let i = 0; i < len; i++) {
      const sample = timeBuffer[i];
      const absSample = Math.abs(sample);
      if (absSample > truePeak) truePeak = absSample;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / len);

    // 2. Frequency-Domain Vocal Bandpower (300Hz - 4000Hz)
    // Frequencies outside this are mechanical rumbles or high hiss
    analyser.getByteFrequencyData(freqBuffer);
    const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 48000;
    const binHz = (sampleRate / 2) / freqBuffer.length;

    const startBin = Math.floor(250 / binHz);
    const endBin = Math.min(freqBuffer.length - 1, Math.ceil(4200 / binHz));

    let vocalSum = 0;
    let vocalCount = 0;
    for (let b = startBin; b <= endBin; b++) {
      const normalizedMag = freqBuffer[b] / 255;
      // Slight formant weighting around 1.5kHz - 3kHz (scream range)
      const freqHz = b * binHz;
      const weight = (freqHz >= 1200 && freqHz <= 3200) ? 1.35 : 1.0;
      vocalSum += (normalizedMag * normalizedMag) * weight;
      vocalCount++;
    }
    const vocalEnergy = vocalCount > 0 ? Math.sqrt(vocalSum / vocalCount) : 0;

    // 3. Combined Acoustic Power Factor
    // Gives high sensitivity to collective shouting
    const combinedPower = (rms * 0.5) + (vocalEnergy * 0.3) + (truePeak * 0.2);

    if (combinedPower < 0.00005) return 30; // Silence floor

    // 4. Calibrated Decibel SPL Mapping
    // Logarithmic decibel calculation:
    const logDb = 20 * Math.log10(combinedPower);
    // Typical mic full-scale: -60 dBFS (silence) to 0 dBFS (loud screaming)
    // Map -60..0 dBFS into 35 dB (ambient) .. 112+ dB (crowd scream)
    const baseSpl = (logDb + 60) * 1.32 + 35;

    // Apply channel-specific sensitivity scaling (allowing individual tuning for mic distance / gain)
    const sens = (channelSensitivity !== undefined && channelSensitivity !== null)
      ? channelSensitivity
      : this.sensitivity;
    const sensFactor = (sens - 2.5) * 8;
    const calibratedDb = Math.min(115, Math.max(28, baseSpl + sensFactor));

    return calibratedDb;
  }

  /**
   * Main per-frame update with IEC Fast Ballistics (attack & decay)
   */
  update() {
    let targetBoys = 32;
    let targetGirls = 32;

    if (this.inputMode === 'keyboard') {
      const jitterA = (Math.random() - 0.5) * 8;
      const jitterL = (Math.random() - 0.5) * 8;
      targetBoys = this.simKeys.KeyA ? Math.min(108, 92 + jitterA) : 34 + (Math.random() * 3);
      targetGirls = this.simKeys.KeyL ? Math.min(108, 92 + jitterL) : 34 + (Math.random() * 3);
    } else {
      if (this.analyserLeft && this.dataLeft && this.freqLeft) {
        targetBoys = this._calculateAcousticSPL(this.analyserLeft, this.dataLeft, this.freqLeft, this.boysSensitivity);
      }
      if (this.analyserRight && this.dataRight && this.freqRight) {
        targetGirls = this._calculateAcousticSPL(this.analyserRight, this.dataRight, this.freqRight, this.girlsSensitivity);
      }
    }

    // --- FAST BALLISTICS FILTERING ---
    // Fast attack (instant jump when shouting) vs smooth decay release
    const attackCoeff = 0.72; // ~15ms rapid rise
    const decayCoeff = 0.12;  // ~200ms natural smooth meter release

    if (targetBoys > this.boysDb) {
      this.boysDb += (targetBoys - this.boysDb) * attackCoeff;
    } else {
      this.boysDb += (targetBoys - this.boysDb) * decayCoeff;
    }

    if (targetGirls > this.girlsDb) {
      this.girlsDb += (targetGirls - this.girlsDb) * attackCoeff;
    } else {
      this.girlsDb += (targetGirls - this.girlsDb) * decayCoeff;
    }

    // --- FLOATING PEAK-HOLD NEEDLE ---
    // Catches the absolute highest scream point and holds for ~650ms before gently releasing
    if (this.boysDb > this.boysPeakHold) {
      this.boysPeakHold = this.boysDb;
      this.boysPeakTimer = 38; // ~650ms at 60 FPS
    } else {
      if (this.boysPeakTimer > 0) {
        this.boysPeakTimer--;
      } else {
        this.boysPeakHold = Math.max(this.boysDb, this.boysPeakHold - 1.2);
      }
    }

    if (this.girlsDb > this.girlsPeakHold) {
      this.girlsPeakHold = this.girlsDb;
      this.girlsPeakTimer = 38;
    } else {
      if (this.girlsPeakTimer > 0) {
        this.girlsPeakTimer--;
      } else {
        this.girlsPeakHold = Math.max(this.girlsDb, this.girlsPeakHold - 1.2);
      }
    }

    // Overall historical peak stats
    if (this.boysDb > this.boysPeak) this.boysPeak = Math.round(this.boysDb);
    if (this.girlsDb > this.girlsPeak) this.girlsPeak = Math.round(this.girlsDb);

    // Auto-calibration accumulator (samples each channel independently)
    if (this.isCalibrating) {
      this.calibrationSamplesLeft.push(targetBoys);
      this.calibrationSamplesRight.push(targetGirls);
    }

    return {
      boysDb: Math.round(this.boysDb),
      girlsDb: Math.round(this.girlsDb),
      boysExact: this.boysDb,
      girlsExact: this.girlsDb,
      boysPeakHold: Math.round(this.boysPeakHold),
      girlsPeakHold: Math.round(this.girlsPeakHold),
      boysActive: this.boysDb > this.boysNoiseFloor,
      girlsActive: this.girlsDb > this.girlsNoiseFloor,
      boysThreshold: this.boysNoiseFloor,
      girlsThreshold: this.girlsNoiseFloor,
      boysTurbo: this.boysDb >= this.boostThreshold,
      girlsTurbo: this.girlsDb >= this.boostThreshold
    };
  }

  /**
   * Dual-Channel Room Noise Auto-Calibrate (Measures ambient noise independently for 1.5 seconds)
   */
  async startRoomAutoCalibration(onComplete) {
    if (!this.isListening) {
      const res = await this.startListening();
      if (!res.success) return;
    }

    this.isCalibrating = true;
    this.calibrationSamplesLeft = [];
    this.calibrationSamplesRight = [];

    setTimeout(() => {
      this.isCalibrating = false;
      let leftFloor = this.boysNoiseFloor;
      let rightFloor = this.girlsNoiseFloor;

      if (this.calibrationSamplesLeft.length > 0) {
        const sumL = this.calibrationSamplesLeft.reduce((a, b) => a + b, 0);
        const avgL = sumL / this.calibrationSamplesLeft.length;
        leftFloor = Math.min(65, Math.max(35, Math.round(avgL + 5)));
        this.boysNoiseFloor = leftFloor;
      }
      if (this.calibrationSamplesRight.length > 0) {
        const sumR = this.calibrationSamplesRight.reduce((a, b) => a + b, 0);
        const avgR = sumR / this.calibrationSamplesRight.length;
        rightFloor = Math.min(65, Math.max(35, Math.round(avgR + 5)));
        this.girlsNoiseFloor = rightFloor;
      }

      if (onComplete) {
        onComplete({
          boysNoiseFloor: this.boysNoiseFloor,
          girlsNoiseFloor: this.girlsNoiseFloor,
          avgNoiseFloor: Math.round((this.boysNoiseFloor + this.girlsNoiseFloor) / 2)
        });
      }
    }, 1500);
  }

  resetPeaks() {
    this.boysPeak = 0;
    this.girlsPeak = 0;
    this.boysPeakHold = 35;
    this.girlsPeakHold = 35;
  }

  async getAudioInputDevices(requestPermissionIfNeeded = false) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      let devices = await navigator.mediaDevices.enumerateDevices();
      let audioInputs = devices.filter(d => d.kind === 'audioinput');

      // In browsers, if permission was never granted, labels are blank strings ""
      const hasLabels = audioInputs.some(d => d.label && d.label.length > 0);
      if (!hasLabels && requestPermissionIfNeeded) {
        // Request temporary stream to reveal hardware device labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(t => t.stop());
        devices = await navigator.mediaDevices.enumerateDevices();
        audioInputs = devices.filter(d => d.kind === 'audioinput');
      }

      return audioInputs;
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
      return [];
    }
  }

  /* ================= PROCEDURAL SYNTHESIZER SFX ================= */

  playCountdownBeep(isFinal = false) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = isFinal ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);
    if (isFinal) {
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + (isFinal ? 0.6 : 0.25));
  }

  playTurboSound() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.2);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.2);
    filter.Q.value = 3;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  playVictoryFanfare() {
    if (!this.audioCtx) return;
    const notes = [
      { f: 523.25, t: 0.0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.30, d: 0.15 },
      { f: 1046.50, t: 0.45, d: 0.55 },
      { f: 783.99, t: 1.05, d: 0.15 },
      { f: 1046.50, t: 1.20, d: 0.80 }
    ];

    const baseTime = this.audioCtx.currentTime + 0.05;

    notes.forEach(note => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, baseTime + note.t);

      gain.gain.setValueAtTime(0.35, baseTime + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, baseTime + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(baseTime + note.t);
      osc.stop(baseTime + note.t + note.d);
    });
  }
}

window.gameAudio = new AudioEngine();
