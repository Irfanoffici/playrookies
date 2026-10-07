/**
 * Rookies - Main Game Orchestrator
 * Features:
 * - Direct Left Mic & Right Mic assignment and 1-click Swap
 * - Best of 3 / Best of 5 Series Scoreboard with glowing round-win stars
 * - Lengthy, thrilling marathon races with milestone surges
 * - Pure SVG vectors for all UI, HUD, and race emblems (Zero emoji)
 * - Parallax beach track, cheering spectator crabs, checkered finish gate
 * - Procedural Web Audio countdown, turbo sounds, and victory fanfare
 */

class RookiesGame {
  constructor() {
    this.canvas = document.getElementById('raceCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Game state: 'LOBBY', 'COUNTDOWN', 'RACING', 'ROUND_VICTORY', 'SERIES_VICTORY'
    this.state = 'LOBBY';
    this.raceDistance = 6000; // Default lengthy race (40-55s sustained battle)
    this.cameraX = 0;
    this.screenShake = 0;
    this.raceStartTime = 0;
    this.raceElapsedTime = 0;

    // Series / Match tracking (Best of 3 / 5)
    this.matchFormat = 3; // 3 = Best of 3 (first to 2 wins), 5 = Best of 5 (first to 3)
    this.boysScore = 0;
    this.girlsScore = 0;
    this.currentRound = 1;
    this.seriesWinner = null;
    this.boysSoundPoints = 0;
    this.girlsSoundPoints = 0;
    this.roundHistory = [];

    // Milestones hit during current race
    this.milestoneHalfway = false;
    this.milestoneFinalStretch = false;

    // Spectator crabs & background decorations
    this.decorations = [];
    this.confetti = [];

    // Setup racers
    this.boysRacer = new TurtleRacer({
      name: 'Boys',
      team: 'boys',
      laneY: 0,
      targetDistance: this.raceDistance
    });

    this.girlsRacer = new TurtleRacer({
      name: 'Girls',
      team: 'girls',
      laneY: 0,
      targetDistance: this.raceDistance
    });

    // Cache UI elements
    this.ui = {
      // Meters & cards
      boysDbText: document.getElementById('boys-db-text'),
      girlsDbText: document.getElementById('girls-db-text'),
      boysMeterFill: document.getElementById('boys-meter-fill'),
      girlsMeterFill: document.getElementById('girls-meter-fill'),
      boysPeakNeedle: document.getElementById('boys-peak-needle'),
      girlsPeakNeedle: document.getElementById('girls-peak-needle'),
      boysThresholdMarker: document.getElementById('boys-threshold-marker'),
      girlsThresholdMarker: document.getElementById('girls-threshold-marker'),
      boysStatus: document.getElementById('boys-status'),
      girlsStatus: document.getElementById('girls-status'),
      cardBoys: document.getElementById('card-boys') || document.querySelector('.team-boys'),
      cardGirls: document.getElementById('card-girls') || document.querySelector('.team-girls'),
      boysMicName: document.getElementById('boys-mic-name'),
      girlsMicName: document.getElementById('girls-mic-name'),
      boysScoreVal: document.getElementById('boys-score-val'),
      girlsScoreVal: document.getElementById('girls-score-val'),
      boysPeakStat: document.getElementById('boys-peak-stat'),
      girlsPeakStat: document.getElementById('girls-peak-stat'),
      boysSoundPts: document.getElementById('boys-sound-pts'),
      girlsSoundPts: document.getElementById('girls-sound-pts'),

      // Center HUD & Telemetry
      seriesRoundIndicator: document.getElementById('series-round-indicator'),
      seriesScoreSummary: document.getElementById('series-score-summary'),
      raceLeadText: document.getElementById('race-lead-text'),
      telemetryBoysFill: document.getElementById('telemetry-boys-fill'),
      telemetryGirlsFill: document.getElementById('telemetry-girls-fill'),
      telemetryBoysPin: document.getElementById('telemetry-boys-pin'),
      telemetryGirlsPin: document.getElementById('telemetry-girls-pin'),
      trackDistMid: document.getElementById('track-dist-mid'),
      trackDistFinish: document.getElementById('track-dist-finish'),

      // Footer controls & Quick mic selectors
      btnToggleMic: document.getElementById('btn-toggle-mic'),
      micBtnLabel: document.getElementById('mic-btn-label'),
      quickAudioMode: document.getElementById('quick-audio-mode'),
      quickDualMicBar: document.getElementById('quick-dual-mic-bar'),
      quickSingleMicBar: document.getElementById('quick-single-mic-bar'),
      quickKeyboardBar: document.getElementById('quick-keyboard-bar'),
      quickSelectLeftMic: document.getElementById('quick-select-left-mic'),
      quickSelectRightMic: document.getElementById('quick-select-right-mic'),
      quickSelectSingleMic: document.getElementById('quick-select-single-mic'),
      btnSwapMics: document.getElementById('btn-swap-mics'),
      btnAudioSetup: document.getElementById('btn-audio-setup'),
      btnStartRace: document.getElementById('btn-start-race'),
      btnStartLabel: document.getElementById('btn-start-label'),
      btnCalibrate: document.getElementById('btn-calibrate'),
      btnFullscreen: document.getElementById('btn-fullscreen'),
      quickSensitivity: document.getElementById('quick-sensitivity'),
      quickSensVal: document.getElementById('quick-sens-val'),
      quickThreshold: document.getElementById('quick-threshold'),
      quickThreshVal: document.getElementById('quick-thresh-val'),
      btnQuickAutoCalib: document.getElementById('btn-quick-auto-calib'),
      autoCalibBtnText: document.getElementById('auto-calib-btn-text'),
      btnToggleCalibMode: document.getElementById('btn-toggle-calib-mode'),
      deckLinkedCalib: document.getElementById('deck-linked-calib'),
      deckSplitCalib: document.getElementById('deck-split-calib'),
      splitBoysGain: document.getElementById('split-boys-gain'),
      splitBoysGate: document.getElementById('split-boys-gate'),
      splitGirlsGain: document.getElementById('split-girls-gain'),
      splitGirlsGate: document.getElementById('split-girls-gate'),
      quickFormatSelect: document.getElementById('quick-format-select'),

      // Settings Modal
      modalSettings: document.getElementById('modal-settings'),
      btnCloseModal: document.getElementById('btn-close-modal'),
      btnSaveSettings: document.getElementById('btn-save-settings'),
      btnModalAutoCalib: document.getElementById('btn-modal-auto-calib'),
      modalAutoCalibText: document.getElementById('modal-auto-calib-text'),
      modalDualMicFields: document.getElementById('modal-dual-mic-fields'),
      modalSingleMicFields: document.getElementById('modal-single-mic-fields'),
      selectModalLeftMic: document.getElementById('select-modal-left-mic'),
      selectModalRightMic: document.getElementById('select-modal-right-mic'),
      selectModalSingleMic: document.getElementById('select-modal-single-mic'),
      btnModalSwapMics: document.getElementById('btn-modal-swap-mics'),
      btnModalRefreshMics: document.getElementById('btn-modal-refresh-mics'),
      modalBoysGain: document.getElementById('modal-boys-gain'),
      modalBoysGainVal: document.getElementById('modal-boys-gain-val'),
      modalBoysGate: document.getElementById('modal-boys-gate'),
      modalBoysGateVal: document.getElementById('modal-boys-gate-val'),
      modalGirlsGain: document.getElementById('modal-girls-gain'),
      modalGirlsGainVal: document.getElementById('modal-girls-gain-val'),
      modalGirlsGate: document.getElementById('modal-girls-gate'),
      modalGirlsGateVal: document.getElementById('modal-girls-gate-val'),
      audioInputMode: document.getElementById('audio-input-mode'),
      selectMatchFormat: document.getElementById('select-match-format'),
      raceDistanceSelect: document.getElementById('race-distance-select'),
      boostThresholdSlider: document.getElementById('boost-threshold-slider'),
      boostThresholdVal: document.getElementById('boost-threshold-val'),
      calibBoysVal: document.getElementById('calib-boys-val'),
      calibGirlsVal: document.getElementById('calib-girls-val'),
      calibBoysFill: document.getElementById('calib-boys-fill'),
      calibGirlsFill: document.getElementById('calib-girls-fill'),

      // Announcement & Victory
      announcementOverlay: document.getElementById('announcement-overlay'),
      announcementText: document.getElementById('announcement-text'),
      modalVictory: document.getElementById('modal-victory'),
      victorySeriesBadge: document.getElementById('victory-series-badge'),
      victoryTitle: document.getElementById('victory-title'),
      victoryAvatar: document.getElementById('victory-avatar'),
      victorySubtitle: document.getElementById('victory-subtitle'),
      statBoysPeak: document.getElementById('stat-boys-peak'),
      statGirlsPeak: document.getElementById('stat-girls-peak'),
      statRaceTime: document.getElementById('stat-race-time'),
      statTotalEnergy: document.getElementById('stat-total-energy'),
      seriesHistoryBox: document.getElementById('series-history-box'),
      seriesHistoryTable: document.getElementById('series-history-table'),
      seriesHistoryBody: document.getElementById('series-history-body'),
      historyTableRule: document.getElementById('history-table-rule'),
      btnRematch: document.getElementById('btn-rematch'),
      btnNextActionLabel: document.getElementById('btn-next-action-label'),
      btnBackLobby: document.getElementById('btn-back-lobby')
    };

    this._initCanvasSize();
    this._initDecorations();
    this._updateSeriesScoreboard();
    this._bindEvents();

    // Populate mic devices on boot
    this._populateAudioDevices();

    // Start 60 FPS animation loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  _initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;

    const trackHeight = this.height * 0.72;
    const trackTop = this.height * 0.22;
    this.laneHeight = trackHeight / 2;

    this.boysRacer.laneY = trackTop + this.laneHeight * 0.48;
    this.girlsRacer.laneY = trackTop + this.laneHeight * 1.48;

    this.boysRacer.screenX = Math.min(220, this.width * 0.2);
    this.girlsRacer.screenX = Math.min(220, this.width * 0.2);
  }

  _initDecorations() {
    this.decorations = [];
    // Populate spectators along the lengthy track (up to 20,000 meters)
    const maxTrack = 22000;
    for (let x = 300; x < maxTrack; x += 180 + Math.random() * 140) {
      this.decorations.push({
        x: x,
        lane: Math.random() > 0.5 ? 'top' : 'bottom',
        type: Math.random() > 0.3 ? 'crab' : 'palm',
        flagColor: Math.random() > 0.5 ? '#7052ff' : '#ff7c77',
        bounceOffset: Math.random() * Math.PI * 2
      });
    }
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._initCanvasSize());

    // Toggle Mic
    this.ui.btnToggleMic.addEventListener('click', async () => {
      if (window.gameAudio.isListening) {
        window.gameAudio.stopListening();
        this.ui.micBtnLabel.textContent = 'ENABLE MIC';
        this.ui.btnToggleMic.classList.remove('btn-success');
        this.ui.btnToggleMic.classList.add('btn-primary');
        this.ui.btnStartRace.disabled = true;
      } else {
        const res = await window.gameAudio.startListening();
        if (res.success) {
          this.ui.micBtnLabel.textContent = 'MIC ON (ACTIVE)';
          this.ui.btnToggleMic.classList.remove('btn-primary');
          this.ui.btnToggleMic.classList.add('btn-success');
          this.ui.btnStartRace.disabled = false;
          await this._populateAudioDevices();
        } else {
          alert('Could not start microphone: ' + res.error + '\nYou can select Keyboard Simulator in Settings to test!');
        }
      }
    });

    // Start Race
    this.ui.btnStartRace.addEventListener('click', () => {
      this.startCountdown();
    });

    // Audio Input Mode Switchers (Synced between Footer and Modal)
    const handleModeChange = async (mode) => {
      await this._setAudioMode(mode);
    };

    if (this.ui.quickAudioMode) {
      this.ui.quickAudioMode.addEventListener('change', (e) => handleModeChange(e.target.value));
    }
    if (this.ui.audioInputMode) {
      this.ui.audioInputMode.addEventListener('change', (e) => handleModeChange(e.target.value));
    }

    // Quick Mic Selectors in Footer
    this.ui.quickSelectLeftMic.addEventListener('change', async (e) => {
      const devId = e.target.value;
      if (devId === '__request__') {
        await this._populateAudioDevices(true);
        return;
      }
      this.ui.selectModalLeftMic.value = devId;
      await window.gameAudio.setLeftDevice(devId);
      this._updateMicLabels();
    });

    this.ui.quickSelectRightMic.addEventListener('change', async (e) => {
      const devId = e.target.value;
      if (devId === '__request__') {
        await this._populateAudioDevices(true);
        return;
      }
      this.ui.selectModalRightMic.value = devId;
      await window.gameAudio.setRightDevice(devId);
      this._updateMicLabels();
    });

    // Single Shared Mic Selectors
    if (this.ui.quickSelectSingleMic) {
      this.ui.quickSelectSingleMic.addEventListener('change', async (e) => {
        const devId = e.target.value;
        if (devId === '__request__') {
          await this._populateAudioDevices(true);
          return;
        }
        if (this.ui.selectModalSingleMic) this.ui.selectModalSingleMic.value = devId;
        await window.gameAudio.setSingleDevice(devId);
        this._updateMicLabels();
      });
    }

    if (this.ui.selectModalSingleMic) {
      this.ui.selectModalSingleMic.addEventListener('change', async (e) => {
        const devId = e.target.value;
        if (devId === '__request__') {
          await this._populateAudioDevices(true);
          return;
        }
        if (this.ui.quickSelectSingleMic) this.ui.quickSelectSingleMic.value = devId;
        await window.gameAudio.setSingleDevice(devId);
        this._updateMicLabels();
      });
    }

    // Swap Mics button (1-click Left & Right channel flip)
    const handleSwap = async () => {
      const res = await window.gameAudio.swapMics();
      this.ui.quickSelectLeftMic.value = res.leftDeviceId;
      this.ui.quickSelectRightMic.value = res.rightDeviceId;
      this.ui.selectModalLeftMic.value = res.leftDeviceId;
      this.ui.selectModalRightMic.value = res.rightDeviceId;
      this._updateMicLabels();
    };
    this.ui.btnSwapMics.addEventListener('click', handleSwap);
    this.ui.btnModalSwapMics.addEventListener('click', handleSwap);

    // Modal Left & Right Mic selects
    this.ui.selectModalLeftMic.addEventListener('change', async (e) => {
      const devId = e.target.value;
      if (devId === '__request__') {
        await this._populateAudioDevices(true);
        return;
      }
      this.ui.quickSelectLeftMic.value = devId;
      await window.gameAudio.setLeftDevice(devId);
      this._updateMicLabels();
    });

    this.ui.selectModalRightMic.addEventListener('change', async (e) => {
      const devId = e.target.value;
      if (devId === '__request__') {
        await this._populateAudioDevices(true);
        return;
      }
      this.ui.quickSelectRightMic.value = devId;
      await window.gameAudio.setRightDevice(devId);
      this._updateMicLabels();
    });

    // Dedicated Audio Setup Dialog Trigger
    if (this.ui.btnAudioSetup) {
      this.ui.btnAudioSetup.addEventListener('click', async () => {
        await this._populateAudioDevices(false);
        this.ui.modalSettings.classList.remove('hidden');
      });
    }

    // Hardware Refresh Button in Modal
    if (this.ui.btnModalRefreshMics) {
      this.ui.btnModalRefreshMics.addEventListener('click', async () => {
        const originalText = this.ui.btnModalRefreshMics.innerHTML;
        this.ui.btnModalRefreshMics.disabled = true;
        this.ui.btnModalRefreshMics.textContent = 'Scanning hardware...';
        await this._populateAudioDevices(true);
        this.ui.btnModalRefreshMics.innerHTML = originalText;
        this.ui.btnModalRefreshMics.disabled = false;
      });
    }

    // Pre-emptive Detection on Dropdown Click
    const handleMicDropdownInteraction = async () => {
      if (!window.gameAudio.isListening) {
        await this._populateAudioDevices(true);
      }
    };

    [
      this.ui.quickSelectLeftMic,
      this.ui.quickSelectRightMic,
      this.ui.quickSelectSingleMic,
      this.ui.selectModalLeftMic,
      this.ui.selectModalRightMic,
      this.ui.selectModalSingleMic
    ].forEach(sel => {
      if (sel) {
        sel.addEventListener('mousedown', handleMicDropdownInteraction);
      }
    });

    // Hardware Plug/Unplug Listener
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', async () => {
        await this._populateAudioDevices(false);
      });
    }

    // --- ACOUSTIC CALIBRATION CONTROLS (LINKED & SPLIT MODES) ---
    // Toggle Linked vs Split Mode in Deck Bay 2
    if (this.ui.btnToggleCalibMode) {
      this.ui.btnToggleCalibMode.addEventListener('click', () => {
        const isLinked = window.gameAudio.calibrationMode === 'linked';
        window.gameAudio.calibrationMode = isLinked ? 'split' : 'linked';
        const newMode = window.gameAudio.calibrationMode;

        if (newMode === 'split') {
          this.ui.btnToggleCalibMode.textContent = 'SPLIT (B/G)';
          this.ui.btnToggleCalibMode.classList.add('split-active');
          if (this.ui.deckLinkedCalib) this.ui.deckLinkedCalib.style.display = 'none';
          if (this.ui.deckSplitCalib) this.ui.deckSplitCalib.style.display = 'flex';
        } else {
          this.ui.btnToggleCalibMode.textContent = 'LINKED (B+G)';
          this.ui.btnToggleCalibMode.classList.remove('split-active');
          if (this.ui.deckLinkedCalib) this.ui.deckLinkedCalib.style.display = 'flex';
          if (this.ui.deckSplitCalib) this.ui.deckSplitCalib.style.display = 'none';
        }
      });
    }

    // Helper: Update Boys Gain & UI
    const updateBoysGain = (val) => {
      window.gameAudio.boysSensitivity = val;
      if (this.ui.splitBoysGain) this.ui.splitBoysGain.value = val;
      if (this.ui.modalBoysGain) this.ui.modalBoysGain.value = val;
      if (this.ui.modalBoysGainVal) this.ui.modalBoysGainVal.textContent = val.toFixed(1) + 'x';
    };

    // Helper: Update Boys Noise Gate & UI
    const updateBoysGate = (val) => {
      window.gameAudio.boysNoiseFloor = val;
      if (this.ui.splitBoysGate) this.ui.splitBoysGate.value = val;
      if (this.ui.modalBoysGate) this.ui.modalBoysGate.value = val;
      if (this.ui.modalBoysGateVal) this.ui.modalBoysGateVal.textContent = val + ' dB';
      this._updateThresholdMarkers();
    };

    // Helper: Update Girls Gain & UI
    const updateGirlsGain = (val) => {
      window.gameAudio.girlsSensitivity = val;
      if (this.ui.splitGirlsGain) this.ui.splitGirlsGain.value = val;
      if (this.ui.modalGirlsGain) this.ui.modalGirlsGain.value = val;
      if (this.ui.modalGirlsGainVal) this.ui.modalGirlsGainVal.textContent = val.toFixed(1) + 'x';
    };

    // Helper: Update Girls Noise Gate & UI
    const updateGirlsGate = (val) => {
      window.gameAudio.girlsNoiseFloor = val;
      if (this.ui.splitGirlsGate) this.ui.splitGirlsGate.value = val;
      if (this.ui.modalGirlsGate) this.ui.modalGirlsGate.value = val;
      if (this.ui.modalGirlsGateVal) this.ui.modalGirlsGateVal.textContent = val + ' dB';
      this._updateThresholdMarkers();
    };

    // Master Linked Gain Slider
    this.ui.quickSensitivity.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.ui.quickSensVal.textContent = val.toFixed(1) + 'x';
      updateBoysGain(val);
      updateGirlsGain(val);
    });

    // Master Linked Noise Gate Slider
    this.ui.quickThreshold.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.ui.quickThreshVal.textContent = val + ' dB';
      updateBoysGate(val);
      updateGirlsGate(val);
    });

    // Independent Boys Sliders
    if (this.ui.splitBoysGain) this.ui.splitBoysGain.addEventListener('input', (e) => updateBoysGain(parseFloat(e.target.value)));
    if (this.ui.splitBoysGate) this.ui.splitBoysGate.addEventListener('input', (e) => updateBoysGate(parseInt(e.target.value)));
    if (this.ui.modalBoysGain) this.ui.modalBoysGain.addEventListener('input', (e) => updateBoysGain(parseFloat(e.target.value)));
    if (this.ui.modalBoysGate) this.ui.modalBoysGate.addEventListener('input', (e) => updateBoysGate(parseInt(e.target.value)));

    // Independent Girls Sliders
    if (this.ui.splitGirlsGain) this.ui.splitGirlsGain.addEventListener('input', (e) => updateGirlsGain(parseFloat(e.target.value)));
    if (this.ui.splitGirlsGate) this.ui.splitGirlsGate.addEventListener('input', (e) => updateGirlsGate(parseInt(e.target.value)));
    if (this.ui.modalGirlsGain) this.ui.modalGirlsGain.addEventListener('input', (e) => updateGirlsGain(parseFloat(e.target.value)));
    if (this.ui.modalGirlsGate) this.ui.modalGirlsGate.addEventListener('input', (e) => updateGirlsGate(parseInt(e.target.value)));

    // Dual-Channel Room Noise Auto-Calibration Handler
    const handleAutoCalib = () => {
      const btnQ = this.ui.btnQuickAutoCalib;
      const btnM = this.ui.btnModalAutoCalib;
      const labelQ = this.ui.autoCalibBtnText;
      const labelM = this.ui.modalAutoCalibText;

      if (btnQ) btnQ.disabled = true;
      if (btnM) btnM.disabled = true;
      if (labelQ) labelQ.textContent = 'TUNING...';
      if (labelM) labelM.textContent = 'Listening to ambient room noise on both channels (1.5s)...';

      window.gameAudio.startRoomAutoCalibration((res) => {
        const { boysNoiseFloor, girlsNoiseFloor, avgNoiseFloor } = res;
        updateBoysGate(boysNoiseFloor);
        updateGirlsGate(girlsNoiseFloor);
        if (this.ui.quickThreshold) this.ui.quickThreshold.value = avgNoiseFloor;
        if (this.ui.quickThreshVal) this.ui.quickThreshVal.textContent = avgNoiseFloor + ' dB';

        if (labelQ) labelQ.textContent = `B:${boysNoiseFloor} G:${girlsNoiseFloor}`;
        if (labelM) labelM.textContent = `Calibrated! Boys Gate: ${boysNoiseFloor} dB, Girls Gate: ${girlsNoiseFloor} dB`;

        setTimeout(() => {
          if (btnQ) btnQ.disabled = false;
          if (btnM) btnM.disabled = false;
          if (labelQ) labelQ.textContent = 'AUTO-GATE';
          if (labelM) labelM.textContent = 'Dual Channel Auto-Calibrate (1.5s Ambient Room Listen)';
        }, 2500);
      });
    };

    if (this.ui.btnQuickAutoCalib) this.ui.btnQuickAutoCalib.addEventListener('click', handleAutoCalib);
    if (this.ui.btnModalAutoCalib) this.ui.btnModalAutoCalib.addEventListener('click', handleAutoCalib);

    // Settings Modal Open/Close
    this.ui.btnCalibrate.addEventListener('click', async () => {
      await this._populateAudioDevices(false);
      this.ui.modalSettings.classList.remove('hidden');
    });

    this.ui.btnCloseModal.addEventListener('click', () => {
      this.ui.modalSettings.classList.add('hidden');
    });

    this.ui.btnSaveSettings.addEventListener('click', () => {
      this.ui.modalSettings.classList.add('hidden');
    });

    // Match Series Format (Best of 3, Best of 5, Single Race)
    const handleFormatChange = (newVal) => {
      this.matchFormat = parseInt(newVal);
      if (this.ui.selectMatchFormat) this.ui.selectMatchFormat.value = newVal;
      if (this.ui.quickFormatSelect) this.ui.quickFormatSelect.value = newVal;
      this.resetSeries();
    };

    if (this.ui.selectMatchFormat) {
      this.ui.selectMatchFormat.addEventListener('change', (e) => handleFormatChange(e.target.value));
    }
    if (this.ui.quickFormatSelect) {
      this.ui.quickFormatSelect.addEventListener('change', (e) => handleFormatChange(e.target.value));
    }

    // Race Distance (Lengthy race options)
    this.ui.raceDistanceSelect.addEventListener('change', (e) => {
      this.raceDistance = parseInt(e.target.value);
      this.boysRacer.targetDistance = this.raceDistance;
      this.girlsRacer.targetDistance = this.raceDistance;
      if (this.ui.trackDistMid) this.ui.trackDistMid.textContent = Math.round(this.raceDistance / 2) + 'm';
      if (this.ui.trackDistFinish) this.ui.trackDistFinish.textContent = this.raceDistance + 'm FINISH';
      this.resetRace();
    });

    this.ui.boostThresholdSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      window.gameAudio.boostThreshold = val;
      this.ui.boostThresholdVal.textContent = val + ' dB';
    });

    // Fullscreen Toggle
    this.ui.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Rematch / Next Round Button
    this.ui.btnRematch.addEventListener('click', () => {
      this.ui.modalVictory.classList.add('hidden');
      if (this.seriesWinner) {
        // Series was over -> start fresh series
        this.resetSeries();
      }
      this.startCountdown();
    });

    this.ui.btnBackLobby.addEventListener('click', () => {
      this.ui.modalVictory.classList.add('hidden');
      this.resetRace();
      this.state = 'LOBBY';
      this.ui.btnStartRace.disabled = !window.gameAudio.isListening;
    });

    this._updateThresholdMarkers();
  }

  _updateThresholdMarkers() {
    const pctB = Math.min(100, Math.max(0, ((window.gameAudio.boysNoiseFloor - 25) / 85) * 100));
    const pctG = Math.min(100, Math.max(0, ((window.gameAudio.girlsNoiseFloor - 25) / 85) * 100));
    if (this.ui.boysThresholdMarker) this.ui.boysThresholdMarker.style.left = `${pctB}%`;
    if (this.ui.girlsThresholdMarker) this.ui.girlsThresholdMarker.style.left = `${pctG}%`;
  }

  async _setAudioMode(mode) {
    await window.gameAudio.setInputMode(mode);
    if (this.ui.quickAudioMode) this.ui.quickAudioMode.value = mode;
    if (this.ui.audioInputMode) this.ui.audioInputMode.value = mode;

    if (this.ui.quickDualMicBar) {
      this.ui.quickDualMicBar.style.display = (mode === 'dual-device' || mode === 'stereo') ? 'flex' : 'none';
    }
    if (this.ui.quickSingleMicBar) {
      this.ui.quickSingleMicBar.style.display = (mode === 'single-shared') ? 'flex' : 'none';
    }
    if (this.ui.quickKeyboardBar) {
      this.ui.quickKeyboardBar.style.display = (mode === 'keyboard') ? 'flex' : 'none';
    }

    if (this.ui.modalDualMicFields) {
      this.ui.modalDualMicFields.style.display = (mode === 'dual-device' || mode === 'stereo') ? 'block' : 'none';
    }
    if (this.ui.modalSingleMicFields) {
      this.ui.modalSingleMicFields.style.display = (mode === 'single-shared') ? 'block' : 'none';
    }

    this._updateMicLabels();
  }

  async _populateAudioDevices(requestPermission = false) {
    const devices = await window.gameAudio.getAudioInputDevices(requestPermission);

    const selects = [
      this.ui.quickSelectLeftMic,
      this.ui.quickSelectRightMic,
      this.ui.quickSelectSingleMic,
      this.ui.selectModalLeftMic,
      this.ui.selectModalRightMic,
      this.ui.selectModalSingleMic
    ];

    selects.forEach(sel => {
      if (sel) sel.innerHTML = '';
    });

    if (devices && devices.length > 0) {
      devices.forEach((d, index) => {
        const label = d.label || `Microphone ${index + 1}`;
        selects.forEach(sel => {
          if (sel) sel.add(new Option(label, d.deviceId));
        });
      });

      if (!window.gameAudio.leftDeviceId && devices[0]) {
        window.gameAudio.leftDeviceId = devices[0].deviceId;
      }
      if (!window.gameAudio.rightDeviceId) {
        window.gameAudio.rightDeviceId = devices.length > 1 ? devices[1].deviceId : devices[0].deviceId;
      }
    } else {
      selects.forEach(sel => {
        if (sel) {
          sel.add(new Option('Default Microphone', 'default'));
          sel.add(new Option('Detect All Microphones...', '__request__'));
        }
      });
    }

    const currentLeft = window.gameAudio.leftDeviceId || 'default';
    const currentRight = window.gameAudio.rightDeviceId || 'default';

    if (this.ui.quickSelectLeftMic) this.ui.quickSelectLeftMic.value = currentLeft;
    if (this.ui.quickSelectRightMic) this.ui.quickSelectRightMic.value = currentRight;
    if (this.ui.quickSelectSingleMic) this.ui.quickSelectSingleMic.value = currentLeft;
    if (this.ui.selectModalLeftMic) this.ui.selectModalLeftMic.value = currentLeft;
    if (this.ui.selectModalRightMic) this.ui.selectModalRightMic.value = currentRight;
    if (this.ui.selectModalSingleMic) this.ui.selectModalSingleMic.value = currentLeft;

    this._updateMicLabels();
  }

  _updateMicLabels() {
    if (!this.ui.boysMicName || !this.ui.girlsMicName) return;

    if (window.gameAudio.inputMode === 'keyboard') {
      this.ui.boysMicName.textContent = 'Key [A]';
      this.ui.girlsMicName.textContent = 'Key [L]';
      this.ui.boysMicName.style.display = 'inline-block';
      this.ui.girlsMicName.style.display = 'inline-block';
      return;
    }

    if (window.gameAudio.inputMode === 'single-shared') {
      const opt = this.ui.quickSelectSingleMic ? this.ui.quickSelectSingleMic.selectedOptions[0] : null;
      const label = opt ? opt.textContent.split('(')[0].trim() : 'SHARED';
      this.ui.boysMicName.textContent = `SHARED (${label.slice(0, 10)})`;
      this.ui.girlsMicName.textContent = `SHARED (${label.slice(0, 10)})`;
      this.ui.boysMicName.style.display = 'inline-block';
      this.ui.girlsMicName.style.display = 'inline-block';
      return;
    }

    if (window.gameAudio.inputMode === 'stereo') {
      this.ui.boysMicName.textContent = 'STEREO L';
      this.ui.girlsMicName.textContent = 'STEREO R';
      this.ui.boysMicName.style.display = 'inline-block';
      this.ui.girlsMicName.style.display = 'inline-block';
      return;
    }

    const optL = this.ui.quickSelectLeftMic ? this.ui.quickSelectLeftMic.selectedOptions[0] : null;
    const optR = this.ui.quickSelectRightMic ? this.ui.quickSelectRightMic.selectedOptions[0] : null;

    const labelL = optL ? optL.textContent.split('(')[0].trim() : 'BOYS';
    const labelR = optR ? optR.textContent.split('(')[0].trim() : 'GIRLS';

    this.ui.boysMicName.textContent = labelL.slice(0, 14);
    this.ui.girlsMicName.textContent = labelR.slice(0, 14);
    this.ui.boysMicName.style.display = 'inline-block';
    this.ui.girlsMicName.style.display = 'inline-block';
  }

  /* ================= SERIES / MATCH SCOREBOARD ================= */

  resetSeries() {
    this.boysScore = 0;
    this.girlsScore = 0;
    this.boysSoundPoints = 0;
    this.girlsSoundPoints = 0;
    this.currentRound = 1;
    this.seriesWinner = null;
    this.roundHistory = [];
    if (this.ui.boysSoundPts) this.ui.boysSoundPts.textContent = '0';
    if (this.ui.girlsSoundPts) this.ui.girlsSoundPts.textContent = '0';
    this._updateSeriesScoreboard();
  }

  _updateSeriesScoreboard() {
    const winsNeeded = Math.ceil(this.matchFormat / 2);

    // Update match point digital digits in team cards
    if (this.ui.boysScoreVal) this.ui.boysScoreVal.textContent = this.boysScore;
    if (this.ui.girlsScoreVal) this.ui.girlsScoreVal.textContent = this.girlsScore;

    // Series Score Summary (e.g. "SERIES 1 — 0")
    if (this.ui.seriesScoreSummary) {
      this.ui.seriesScoreSummary.textContent = `SERIES ${this.boysScore} — ${this.girlsScore}`;
    }

    // Center series badge text & Master CTA label
    if (this.matchFormat === 1) {
      if (this.ui.seriesRoundIndicator) this.ui.seriesRoundIndicator.textContent = 'SINGLE SHOWDOWN';
      if (this.ui.btnStartLabel && this.state !== 'RACING') this.ui.btnStartLabel.textContent = 'START RACE';
    } else {
      const isMatchPoint = this.boysScore === winsNeeded - 1 || this.girlsScore === winsNeeded - 1;
      const isDecider = (this.boysScore === winsNeeded - 1 && this.girlsScore === winsNeeded - 1);
      
      let roundLabel;
      if (this.seriesWinner) {
        roundLabel = `SERIES CONCLUDED • ${this.seriesWinner.toUpperCase()} WIN`;
      } else if (isDecider) {
        roundLabel = `DECIDING ROUND ${this.currentRound} (SUDDEN DEATH)`;
      } else if (isMatchPoint) {
        roundLabel = `BEST OF ${this.matchFormat} • ROUND ${this.currentRound} (MATCH POINT)`;
      } else {
        roundLabel = `BEST OF ${this.matchFormat} • ROUND ${this.currentRound}`;
      }

      if (this.ui.seriesRoundIndicator) this.ui.seriesRoundIndicator.textContent = roundLabel;

      if (this.ui.btnStartLabel && this.state !== 'RACING') {
        if (this.seriesWinner) {
          this.ui.btnStartLabel.textContent = 'NEW SERIES';
        } else if (isDecider) {
          this.ui.btnStartLabel.textContent = `START ROUND ${this.currentRound} (DECIDER)`;
        } else if (isMatchPoint) {
          this.ui.btnStartLabel.textContent = `START ROUND ${this.currentRound} (MATCH POINT)`;
        } else {
          this.ui.btnStartLabel.textContent = `START ROUND ${this.currentRound}`;
        }
      }
    }
  }

  /* ================= RACE LIFECYCLE ================= */

  startCountdown() {
    this.resetRace();
    this.state = 'COUNTDOWN';
    this.ui.btnStartRace.disabled = true;

    this.ui.announcementOverlay.classList.remove('hidden');
    let count = 3;

    const tick = () => {
      if (count > 0) {
        this.ui.announcementText.textContent = count;
        this.ui.announcementText.style.animation = 'none';
        void this.ui.announcementText.offsetWidth;
        this.ui.announcementText.style.animation = 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        window.gameAudio.playCountdownBeep(false);
        count--;
        setTimeout(tick, 900);
      } else {
        this.ui.announcementText.textContent = 'SHOUT!';
        this.ui.announcementText.style.animation = 'none';
        void this.ui.announcementText.offsetWidth;
        this.ui.announcementText.style.animation = 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        window.gameAudio.playCountdownBeep(true);

        setTimeout(() => {
          this.ui.announcementOverlay.classList.add('hidden');
          this.state = 'RACING';
          this.raceStartTime = performance.now();
        }, 600);
      }
    };

    tick();
  }

  resetRace() {
    this.boysRacer.reset();
    this.girlsRacer.reset();
    this.boysRacer.targetDistance = this.raceDistance;
    this.girlsRacer.targetDistance = this.raceDistance;
    this.cameraX = 0;
    this.screenShake = 0;
    this.confetti = [];
    this.milestoneHalfway = false;
    this.milestoneFinalStretch = false;
    window.gameAudio.resetPeaks();

    if (this.ui.telemetryBoysFill) this.ui.telemetryBoysFill.style.width = '0%';
    if (this.ui.telemetryGirlsFill) this.ui.telemetryGirlsFill.style.width = '0%';
    if (this.ui.telemetryBoysPin) this.ui.telemetryBoysPin.style.left = '0%';
    if (this.ui.telemetryGirlsPin) this.ui.telemetryGirlsPin.style.left = '0%';
    if (this.ui.raceLeadText) {
      this.ui.raceLeadText.innerHTML = `<span>READY TO RACE • 0m</span>`;
    }
  }

  finishRace(winner) {
    this.state = 'ROUND_VICTORY';
    this.raceElapsedTime = ((performance.now() - this.raceStartTime) / 1000).toFixed(1);

    window.gameAudio.playVictoryFanfare();
    this._spawnVictoryConfetti(winner);

    // Update match scores
    if (winner === 'boys') {
      this.boysScore++;
    } else {
      this.girlsScore++;
    }

    const winsNeeded = Math.ceil(this.matchFormat / 2);
    const hasWonSeries = (this.boysScore >= winsNeeded) || (this.girlsScore >= winsNeeded);
    if (hasWonSeries) {
      this.seriesWinner = this.boysScore >= winsNeeded ? 'boys' : 'girls';
      this.state = 'SERIES_VICTORY';
    }

    // Record round in roundHistory
    this.roundHistory.push({
      round: this.currentRound,
      winner: winner,
      boysPeak: Math.round(window.gameAudio.boysPeak),
      girlsPeak: Math.round(window.gameAudio.girlsPeak),
      duration: this.raceElapsedTime,
      boysScore: this.boysScore,
      girlsScore: this.girlsScore
    });

    this._updateSeriesScoreboard();

    // Populate victory dialog
    setTimeout(() => {
      const isBoys = winner === 'boys';
      if (hasWonSeries) {
        // GRAND CHAMPIONSHIP VICTORY!
        this.ui.victoryTitle.textContent = isBoys
          ? 'BOYS ARE THE CHAMPIONS!'
          : 'GIRLS ARE THE CHAMPIONS!';
        this.ui.victoryTitle.style.background = isBoys
          ? 'linear-gradient(135deg, #a5b4fc, #7052ff, #d4f879)'
          : 'linear-gradient(135deg, #fed7aa, #ff7c77, #d4f879)';
        this.ui.victoryTitle.style.webkitBackgroundClip = 'text';

        const isSweep = (this.boysScore === winsNeeded && this.girlsScore === 0) || (this.girlsScore === winsNeeded && this.boysScore === 0);
        this.ui.victorySubtitle.textContent = isSweep
          ? `Dominant Series Sweep (${this.boysScore} — ${this.girlsScore})! Undefeated collegiate acoustic stamina!`
          : `Won the Series (${this.boysScore} — ${this.girlsScore})! Outstanding vocal stamina and collegiate pride!`;
        
        this.ui.btnNextActionLabel.textContent = `NEW SERIES (BEST OF ${this.matchFormat})`;
        if (this.ui.btnStartLabel) this.ui.btnStartLabel.textContent = 'NEW SERIES';
      } else {
        // ROUND VICTORY - NEXT ROUND UNLOCKED
        this.ui.victoryTitle.textContent = isBoys
          ? `BOYS WIN ROUND ${this.currentRound}!`
          : `GIRLS WIN ROUND ${this.currentRound}!`;
        this.ui.victoryTitle.style.background = isBoys
          ? 'linear-gradient(135deg, #a5b4fc, #7052ff)'
          : 'linear-gradient(135deg, #fed7aa, #ff7c77)';
        this.ui.victoryTitle.style.webkitBackgroundClip = 'text';

        const nextRound = this.currentRound + 1;
        const isMatchPoint = this.boysScore === winsNeeded - 1 || this.girlsScore === winsNeeded - 1;
        const isDecider = (this.boysScore === winsNeeded - 1 && this.girlsScore === winsNeeded - 1);

        this.ui.victorySubtitle.textContent = isDecider
          ? `Series Tied 1 — 1! Deciding Round 3 will determine the Collegiate Champion!`
          : `Series Standings: Boys ${this.boysScore} — ${this.girlsScore} Girls (First to ${winsNeeded} wins)`;
        
        this.currentRound = nextRound;
        
        const nextRoundCta = isDecider
          ? `START ROUND ${this.currentRound} (DECIDER)!`
          : (isMatchPoint ? `START ROUND ${this.currentRound} (MATCH POINT)!` : `START ROUND ${this.currentRound}!`);
        
        this.ui.btnNextActionLabel.textContent = nextRoundCta;
        if (this.ui.btnStartLabel) this.ui.btnStartLabel.textContent = nextRoundCta.replace('!', '');
      }

      this.ui.statBoysPeak.textContent = `${Math.round(window.gameAudio.boysPeak)} dB`;
      this.ui.statGirlsPeak.textContent = `${Math.round(window.gameAudio.girlsPeak)} dB`;
      this.ui.statRaceTime.textContent = `${this.raceElapsedTime}s`;
      if (this.ui.statTotalEnergy) {
        this.ui.statTotalEnergy.textContent = `${this.boysSoundPoints} vs ${this.girlsSoundPoints}`;
      }

      // Populate Series History Table
      this._renderHistoryTable();

      this.ui.modalVictory.classList.remove('hidden');
    }, 1200);
  }

  _renderHistoryTable() {
    if (!this.ui.seriesHistoryBody) return;
    const winsNeeded = Math.ceil(this.matchFormat / 2);
    if (this.ui.historyTableRule) {
      this.ui.historyTableRule.textContent = this.matchFormat === 1
        ? 'SINGLE RACE SHOWDOWN'
        : `BEST OF ${this.matchFormat} • FIRST TO ${winsNeeded} ROUNDS`;
    }

    this.ui.seriesHistoryBody.innerHTML = this.roundHistory.map((item) => `
      <tr>
        <td><strong>Round ${item.round}</strong></td>
        <td>
          <span class="winner-pill ${item.winner === 'boys' ? 'winner-boys' : 'winner-girls'}">
            ${item.winner === 'boys' ? 'BOYS' : 'GIRLS'}
          </span>
        </td>
        <td>${item.boysPeak} dB</td>
        <td>${item.girlsPeak} dB</td>
        <td>${item.duration}s</td>
        <td><strong>${item.boysScore} — ${item.girlsScore}</strong></td>
      </tr>
    `).join('');
  }

  _spawnVictoryConfetti(winner) {
    this.confetti = [];
    const colors = winner === 'boys'
      ? ['#00d2ff', '#0066ff', '#38ef7d', '#ffffff', '#ffd700']
      : ['#ff2a85', '#ff7300', '#ffd700', '#ffffff', '#a855f7'];

    for (let i = 0; i < 240; i++) {
      this.confetti.push({
        x: this.width * 0.5 + (Math.random() - 0.5) * 450,
        y: this.height * 0.4,
        vx: (Math.random() - 0.5) * 24,
        vy: -Math.random() * 20 - 4,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 16,
        gravity: 0.45
      });
    }
  }

  // Main 60 FPS animation loop
  gameLoop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastFrameTime) / 1000);
    this.lastFrameTime = currentTime;

    const audioState = window.gameAudio.update();
    this._updateAudioUI(audioState);

    if (this.state === 'RACING') {
      this.boysRacer.update(audioState.boysDb, audioState.boysActive, audioState.boysTurbo, dt, window.gameAudio.boysNoiseFloor);
      this.girlsRacer.update(audioState.girlsDb, audioState.girlsActive, audioState.girlsTurbo, dt, window.gameAudio.girlsNoiseFloor);

      // Accumulate vocal energy points
      if (audioState.boysActive) {
        this.boysSoundPoints += Math.max(1, Math.round((audioState.boysDb - window.gameAudio.boysNoiseFloor) * 0.4));
        if (this.ui.boysSoundPts) this.ui.boysSoundPts.textContent = this.boysSoundPoints.toLocaleString();
      }
      if (audioState.girlsActive) {
        this.girlsSoundPoints += Math.max(1, Math.round((audioState.girlsDb - window.gameAudio.girlsNoiseFloor) * 0.4));
        if (this.ui.girlsSoundPts) this.ui.girlsSoundPts.textContent = this.girlsSoundPoints.toLocaleString();
      }

      if (audioState.boysTurbo || audioState.girlsTurbo) {
        this.screenShake = Math.max(this.screenShake, 4.5);
      }

      // Check win condition
      if (this.boysRacer.distance >= this.raceDistance) {
        this.finishRace('boys');
      } else if (this.girlsRacer.distance >= this.raceDistance) {
        this.finishRace('girls');
      }

      this._updateRaceProgress();
    } else {
      this.boysRacer.update(audioState.boysDb, false, false, dt);
      this.girlsRacer.update(audioState.girlsDb, false, false, dt);
    }

    // Camera smoothly follows the lead turtle
    const leadDistance = Math.max(this.boysRacer.distance, this.girlsRacer.distance);
    this.cameraX += (leadDistance - this.cameraX) * 0.09;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // Update confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += c.gravity;
      c.rotation += c.rotSpeed;
      if (c.y > this.height + 50) this.confetti.splice(i, 1);
    }

    this._render();
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  _updateAudioUI(audio) {
    // Dynamic scale: 25 dB (ambient) to 110 dB (maximum roar)
    const boysPct = Math.min(100, Math.max(0, ((audio.boysDb - 25) / 85) * 100));
    const girlsPct = Math.min(100, Math.max(0, ((audio.girlsDb - 25) / 85) * 100));

    const boysPeakHoldPct = Math.min(100, Math.max(0, ((audio.boysPeakHold - 25) / 85) * 100));
    const girlsPeakHoldPct = Math.min(100, Math.max(0, ((audio.girlsPeakHold - 25) / 85) * 100));

    // Boys Meter & Peak Needle
    this.ui.boysDbText.textContent = `${audio.boysDb.toFixed(1)}`;
    this.ui.boysMeterFill.style.width = `${boysPct}%`;
    if (this.ui.boysPeakNeedle) {
      this.ui.boysPeakNeedle.style.left = `${boysPeakHoldPct}%`;
    }
    if (this.ui.boysPeakStat) {
      this.ui.boysPeakStat.textContent = Math.round(window.gameAudio.boysPeak);
    }

    // Girls Meter & Peak Needle
    this.ui.girlsDbText.textContent = `${audio.girlsDb.toFixed(1)}`;
    this.ui.girlsMeterFill.style.width = `${girlsPct}%`;
    if (this.ui.girlsPeakNeedle) {
      this.ui.girlsPeakNeedle.style.left = `${girlsPeakHoldPct}%`;
    }
    if (this.ui.girlsPeakStat) {
      this.ui.girlsPeakStat.textContent = Math.round(window.gameAudio.girlsPeak);
    }

    // Dynamic Screaming Font Bounce (>82 dB)
    if (audio.boysDb >= 82) {
      this.ui.boysDbText.classList.add('screaming');
    } else {
      this.ui.boysDbText.classList.remove('screaming');
    }

    if (audio.girlsDb >= 82) {
      this.ui.girlsDbText.classList.add('screaming');
    } else {
      this.ui.girlsDbText.classList.remove('screaming');
    }

    // Status SVGs & Text
    if (audio.boysTurbo) {
      this.ui.boysStatus.innerHTML = `
        <svg class="svg-icon svg-tiny" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.61 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" fill="currentColor"/></svg>
        <span>TURBO SCREAM!</span>
      `;
      this.ui.boysStatus.style.color = '#ffd700';
      this.ui.cardBoys.classList.add('surging');
    } else if (audio.boysActive) {
      this.ui.boysStatus.innerHTML = `
        <svg class="svg-icon svg-tiny" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor"/></svg>
        <span>SPRINTING</span>
      `;
      this.ui.boysStatus.style.color = 'var(--boys-primary)';
      this.ui.cardBoys.classList.remove('surging');
    } else {
      this.ui.boysStatus.innerHTML = `
        <svg class="svg-icon svg-tiny" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>
        <span>IDLE</span>
      `;
      this.ui.boysStatus.style.color = 'var(--text-dim)';
      this.ui.cardBoys.classList.remove('surging');
    }

    if (audio.girlsTurbo) {
      this.ui.girlsStatus.innerHTML = `
        <svg class="svg-icon svg-tiny" viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.61 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" fill="currentColor"/></svg>
        <span>TURBO SCREAM!</span>
      `;
      this.ui.girlsStatus.style.color = '#ffd700';
      this.ui.cardGirls.classList.add('surging');
    } else if (audio.girlsActive) {
      this.ui.girlsStatus.innerHTML = `
        <svg class="svg-icon svg-tiny" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor"/></svg>
        <span>SPRINTING</span>
      `;
      this.ui.girlsStatus.style.color = 'var(--girls-primary)';
      this.ui.cardGirls.classList.remove('surging');
    } else {
      this.ui.girlsStatus.innerHTML = `
        <svg class="svg-icon svg-tiny" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>
        <span>IDLE</span>
      `;
      this.ui.girlsStatus.style.color = 'var(--text-dim)';
      this.ui.cardGirls.classList.remove('surging');
    }

    // Calibration modal bars
    if (!this.ui.modalSettings.classList.contains('hidden')) {
      this.ui.calibBoysVal.textContent = `${audio.boysDb.toFixed(1)} dB`;
      this.ui.calibGirlsVal.textContent = `${audio.girlsDb.toFixed(1)} dB`;
      this.ui.calibBoysFill.style.width = `${boysPct}%`;
      this.ui.calibGirlsFill.style.width = `${girlsPct}%`;
    }
  }

  _updateRaceProgress() {
    const boysPct = Math.min(100, (this.boysRacer.distance / this.raceDistance) * 100);
    const girlsPct = Math.min(100, (this.girlsRacer.distance / this.raceDistance) * 100);

    if (this.ui.telemetryBoysFill) this.ui.telemetryBoysFill.style.width = `${boysPct}%`;
    if (this.ui.telemetryGirlsFill) this.ui.telemetryGirlsFill.style.width = `${girlsPct}%`;
    if (this.ui.telemetryBoysPin) this.ui.telemetryBoysPin.style.left = `${boysPct}%`;
    if (this.ui.telemetryGirlsPin) this.ui.telemetryGirlsPin.style.left = `${girlsPct}%`;

    const maxProgress = Math.max(boysPct, girlsPct);
    const diff = Math.round(this.boysRacer.distance - this.girlsRacer.distance);

    // Milestones
    if (maxProgress >= 50 && !this.milestoneHalfway) {
      this.milestoneHalfway = true;
      this._flashMilestone('HALFWAY MARK!');
    } else if (maxProgress >= 80 && !this.milestoneFinalStretch) {
      this.milestoneFinalStretch = true;
      this._flashMilestone('FINAL STRETCH!');
    }

    // Lead readout with vector icons (zero emojis)
    if (Math.abs(diff) < 25) {
      this.ui.raceLeadText.innerHTML = `
        <span style="color: var(--accent-gold); font-weight: 900;">NECK AND NECK (${Math.round(this.boysRacer.distance)}m)</span>
      `;
    } else if (diff > 0) {
      this.ui.raceLeadText.innerHTML = `
        <span style="color: var(--boys-primary); font-weight: 900;">BOYS AHEAD BY +${diff}m</span>
      `;
    } else {
      this.ui.raceLeadText.innerHTML = `
        <span style="color: var(--girls-primary); font-weight: 900;">GIRLS AHEAD BY +${Math.abs(diff)}m</span>
      `;
    }
  }

  _flashMilestone(text) {
    this.ui.announcementText.textContent = text;
    this.ui.announcementText.style.animation = 'none';
    void this.ui.announcementText.offsetWidth;
    this.ui.announcementText.style.animation = 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    this.ui.announcementOverlay.classList.remove('hidden');
    setTimeout(() => {
      this.ui.announcementOverlay.classList.add('hidden');
    }, 700);
  }

  _render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Synthwave Cosmic Sky, Glowing Sun & Mountains
    this._drawBackground(ctx);

    // 2. Cyber Laser Rails, Glowing Divider & Chevrons
    this._drawTrack(ctx);

    // 3. Futuristic HUD Lane Badges (BOYS LANE ⚡ / GIRLS LANE 🔥)
    this._drawHudLaneBadges(ctx);

    // 4. Cheering Rail Spectator Crabs with Pennants
    this._drawDecorations(ctx);

    // 5. Checkered Neon Finish Line Gate
    this._drawFinishLine(ctx);

    // 6. Racers with Laser Trails & Floor Reflections
    const leadDistance = Math.max(this.boysRacer.distance, this.girlsRacer.distance);
    const boysLag = this.boysRacer.distance - leadDistance;
    const girlsLag = this.girlsRacer.distance - leadDistance;

    // Anchor racers cleanly in view
    const baseScreenX = Math.max(260, this.width * 0.28);
    this.boysRacer.screenX = baseScreenX + boysLag * 0.65;
    this.girlsRacer.screenX = baseScreenX + girlsLag * 0.65;

    this.boysRacer.render(ctx);
    this.girlsRacer.render(ctx);

    if (this.confetti.length > 0) {
      this._drawConfetti(ctx);
    }

    ctx.restore();
  }

  /* ================= SYNTHWAVE COSMIC SKY & SUN ================= */
  _drawBackground(ctx) {
    const trackTop = this.height * 0.24;

    // Deep Cosmic Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#020412');
    skyGrad.addColorStop(0.25, '#070b24');
    skyGrad.addColorStop(0.5, '#0c133a');
    skyGrad.addColorStop(1, '#050716');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Shooting Stars / Diagonal Laser Streaks
    ctx.save();
    const streaks = [
      { x: this.width * 0.15, y: trackTop * 0.35, len: 90 },
      { x: this.width * 0.42, y: trackTop * 0.25, len: 75 },
      { x: this.width * 0.68, y: trackTop * 0.45, len: 110 }
    ];
    for (const s of streaks) {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len * 0.8, s.y - s.len * 0.5);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.6)');
      grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * 0.8, s.y - s.len * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // Giant Glowing Retro Synthwave Sun (Right Horizon)
    ctx.save();
    const sunX = this.width * 0.86;
    const sunY = trackTop * 0.95;

    // Atmospheric outer bloom
    const outerBloom = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 180);
    outerBloom.addColorStop(0, 'rgba(112, 82, 255, 0.35)');
    outerBloom.addColorStop(0.6, 'rgba(255, 124, 119, 0.16)');
    outerBloom.addColorStop(1, 'transparent');
    ctx.fillStyle = outerBloom;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
    ctx.fill();

    // Core Radiant Sun
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 75);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.28, '#ffdeae'); // MEC peach
    sunGrad.addColorStop(0.62, '#ff753a'); // MEC sunset orange
    sunGrad.addColorStop(0.85, '#ff7c77'); // MEC coral
    sunGrad.addColorStop(1, '#7052ff');    // MEC tech purple

    ctx.shadowColor = '#ff7c77';
    ctx.shadowBlur = 40;
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Volumetric Cyberpunk Clouds & Mountain Silhouettes (Left & Right Horizon)
    ctx.save();
    // Left side volumetric clouds
    ctx.fillStyle = '#080d24';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.35)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(40, trackTop - 10, 48, 0, Math.PI * 2);
    ctx.arc(90, trackTop - 25, 42, 0, Math.PI * 2);
    ctx.arc(140, trackTop - 12, 38, 0, Math.PI * 2);
    ctx.fill();

    // Secondary cloud layer
    ctx.fillStyle = '#0e163b';
    ctx.beginPath();
    ctx.arc(70, trackTop - 5, 36, 0, Math.PI * 2);
    ctx.arc(120, trackTop - 8, 32, 0, Math.PI * 2);
    ctx.fill();

    // Mountains overlapping the Sun (Right side)
    ctx.fillStyle = '#100726';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(sunX - 110, trackTop);
    ctx.lineTo(sunX - 55, trackTop - 35);
    ctx.lineTo(sunX - 10, trackTop - 12);
    ctx.lineTo(sunX + 35, trackTop - 42);
    ctx.lineTo(sunX + 85, trackTop - 15);
    ctx.lineTo(sunX + 130, trackTop);
    ctx.closePath();
    ctx.fill();

    // Rocky crags in bottom corners
    const trackBottom = trackTop + this.laneHeight * 2;
    ctx.fillStyle = '#090517';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 14;

    // Bottom-Left rocks
    ctx.beginPath();
    ctx.moveTo(0, trackBottom);
    ctx.lineTo(35, trackBottom - 26);
    ctx.lineTo(75, trackBottom - 10);
    ctx.lineTo(110, trackBottom - 35);
    ctx.lineTo(150, trackBottom);
    ctx.closePath();
    ctx.fill();

    // Bottom-Right rocks
    ctx.beginPath();
    ctx.moveTo(this.width, trackBottom);
    ctx.lineTo(this.width - 35, trackBottom - 30);
    ctx.lineTo(this.width - 80, trackBottom - 12);
    ctx.lineTo(this.width - 120, trackBottom - 24);
    ctx.lineTo(this.width - 160, trackBottom);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ================= TRACK LASER RAILS & REFLECTIONS ================= */
  _drawTrack(ctx) {
    const trackTop = this.height * 0.24;
    const trackHeight = this.laneHeight * 2;
    const trackBottom = trackTop + trackHeight;

    // Sleek Glossy Track Surface
    const groundGrad = ctx.createLinearGradient(0, trackTop, 0, trackBottom);
    groundGrad.addColorStop(0, '#060a1e');
    groundGrad.addColorStop(0.5, '#0a102d');
    groundGrad.addColorStop(1, '#060a1e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, trackTop, this.width, trackHeight);

    // Subtle Vertical Grid Guidelines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    const gridSpacing = 85;
    const offsetX = (this.cameraX * 0.65) % gridSpacing;
    for (let x = -offsetX; x < this.width + gridSpacing; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, trackTop);
      ctx.lineTo(x, trackBottom);
      ctx.stroke();
    }
    ctx.restore();

    // --- TOP LASER RAIL (MEC PURPLE BEAM) ---
    ctx.save();
    // Outer Neon Glow
    ctx.strokeStyle = '#7052ff';
    ctx.shadowColor = '#7052ff';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, trackTop);
    ctx.lineTo(this.width, trackTop);
    ctx.stroke();

    // Intense White Core
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, trackTop);
    ctx.lineTo(this.width, trackTop);
    ctx.stroke();
    ctx.restore();

    // --- BOTTOM LASER RAIL (MEC CORAL BEAM) ---
    ctx.save();
    // Outer Neon Glow
    ctx.strokeStyle = '#ff7c77';
    ctx.shadowColor = '#ff7c77';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, trackBottom);
    ctx.lineTo(this.width, trackBottom);
    ctx.stroke();

    // Intense White Core
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, trackBottom);
    ctx.lineTo(this.width, trackBottom);
    ctx.stroke();
    ctx.restore();

    // --- CENTER DIVIDER (CRISP DASHED NEON) ---
    const centerDividerY = trackTop + this.laneHeight;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([26, 22]);
    ctx.lineDashOffset = this.cameraX % 48;
    ctx.beginPath();
    ctx.moveTo(0, centerDividerY);
    ctx.lineTo(this.width, centerDividerY);
    ctx.stroke();
    ctx.restore();

    // --- CHEVRON BUMPERS (At Divider Ends as in Reference Image) ---
    // Left Purple Chevron (< < <)
    ctx.save();
    ctx.fillStyle = '#7052ff';
    ctx.shadowColor = '#7052ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(32, centerDividerY - 14);
    ctx.lineTo(16, centerDividerY);
    ctx.lineTo(32, centerDividerY + 14);
    ctx.lineTo(24, centerDividerY + 14);
    ctx.lineTo(8, centerDividerY);
    ctx.lineTo(24, centerDividerY - 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Right Coral Chevron (> > >)
    ctx.save();
    ctx.fillStyle = '#ff7c77';
    ctx.shadowColor = '#ff7c77';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.width - 32, centerDividerY - 14);
    ctx.lineTo(this.width - 16, centerDividerY);
    ctx.lineTo(this.width - 32, centerDividerY + 14);
    ctx.lineTo(this.width - 24, centerDividerY + 14);
    ctx.lineTo(this.width - 8, centerDividerY);
    ctx.lineTo(this.width - 24, centerDividerY - 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ================= FUTURISTIC HUD LANE BADGES ================= */
  _drawHudLaneBadges(ctx) {
    const trackTop = this.height * 0.24;

    // --- BOYS LANE BADGE (TOP LANE) ---
    this._drawChamferBadge(
      ctx,
      20,
      trackTop + this.laneHeight * 0.5 - 26,
      175,
      52,
      '#7052ff',
      'BOYS',
      ' LANE'
    );

    // --- GIRLS LANE BADGE (BOTTOM LANE) ---
    this._drawChamferBadge(
      ctx,
      20,
      trackTop + this.laneHeight * 1.5 - 26,
      175,
      52,
      '#ff7c77',
      'GIRLS',
      ' LANE'
    );
  }

  // Draw chamfered futuristic glass badge with hazard stripes
  _drawChamferBadge(ctx, x, y, w, h, neonColor, titlePart1, titlePart2) {
    ctx.save();
    const cut = 14; // Chamfer cut size

    // Path with angled top-left and bottom-right corners
    ctx.beginPath();
    ctx.moveTo(x + cut, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - cut);
    ctx.lineTo(x + w - cut, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + cut);
    ctx.closePath();

    // Dark Translucent Glass Fill
    ctx.fillStyle = 'rgba(4, 9, 24, 0.88)';
    ctx.fill();

    // Glowing Neon Stroke
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 16;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Diagonal Racing Hazard Stripes (Bottom Left)
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const sx = x + 10 + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx, y + h - 4);
      ctx.lineTo(sx + 5, y + h - 12);
      ctx.stroke();
    }

    // Badge Title: e.g. "BOYS" (White) + " LANE" (Neon)
    ctx.font = '900 22px Russo One, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const textY = y + h / 2 - 1;

    ctx.fillStyle = '#ffffff';
    ctx.fillText(titlePart1, x + 20, textY);

    const p1Width = ctx.measureText(titlePart1).width;
    ctx.fillStyle = neonColor;
    ctx.fillText(titlePart2, x + 20 + p1Width, textY);

    ctx.restore();
  }

  /* ================= SPECTATOR CRABS WITH FLAGS ================= */
  _drawDecorations(ctx) {
    const trackTop = this.height * 0.24;
    const baseScreenX = Math.max(260, this.width * 0.28);

    for (const dec of this.decorations) {
      const scrX = baseScreenX + (dec.x - this.cameraX) * 0.65;
      if (scrX < -60 || scrX > this.width + 60) continue;

      const decY = dec.lane === 'top'
        ? trackTop - 2
        : trackTop + this.laneHeight * 2 + 2;

      ctx.save();
      ctx.translate(scrX, decY);

      if (dec.type === 'crab') {
        // Cute stylized crab perched on rail (as in reference image)
        const bounce = Math.sin(performance.now() * 0.007 + dec.bounceOffset) * 2.5;
        ctx.translate(0, bounce);

        // Crab Body
        ctx.fillStyle = '#ff7300';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute Little Claws
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(-6, -6, 3.5, 0, Math.PI * 2);
        ctx.arc(6, -6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye bumps
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3, -4, 2, 0, Math.PI * 2);
        ctx.arc(3, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Flagpole
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6, -5);
        ctx.lineTo(6, -24);
        ctx.stroke();

        // Pennant Flag (Cyan or Pink)
        ctx.fillStyle = dec.flagColor;
        ctx.shadowColor = dec.flagColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(6, -24);
        ctx.lineTo(18, -19);
        ctx.lineTo(6, -14);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /* ================= CHECKERED NEON FINISH LINE GATE ================= */
  _drawFinishLine(ctx) {
    const trackTop = this.height * 0.24;
    const baseScreenX = Math.max(260, this.width * 0.28);
    const finishScreenX = baseScreenX + (this.raceDistance - this.cameraX) * 0.65;

    if (finishScreenX < -150 || finishScreenX > this.width + 300) return;

    const trackHeight = this.laneHeight * 2;
    const archTop = trackTop - 50;

    ctx.save();
    // Neon Gold Gate Pillars
    ctx.strokeStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(finishScreenX, archTop);
    ctx.lineTo(finishScreenX, trackTop + trackHeight + 15);
    ctx.stroke();

    // Checkered Stripe
    const boxSize = 14;
    for (let y = trackTop; y < trackTop + trackHeight; y += boxSize) {
      const isBlack = Math.floor(y / boxSize) % 2 === 0;
      ctx.fillStyle = isBlack ? '#ffffff' : '#0a0e1c';
      ctx.fillRect(finishScreenX - boxSize, y, boxSize, boxSize);
      ctx.fillStyle = !isBlack ? '#ffffff' : '#0a0e1c';
      ctx.fillRect(finishScreenX, y, boxSize, boxSize);
    }

    // Top Signboard
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(finishScreenX - 75, archTop - 36, 150, 36, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px Russo One, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FINISH LINE', finishScreenX, archTop - 18);

    ctx.restore();
  }

  _drawConfetti(ctx) {
    ctx.save();
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dashGame = new RookiesGame();
});
