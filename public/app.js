document.addEventListener('DOMContentLoaded', () => {
  // Shared Form & Control Elements
  const form = document.getElementById('magi-form');
  const queryInput = document.getElementById('query-input');
  const submitBtn = document.getElementById('submit-btn');
  const langSelect = document.getElementById('lang-select');
  const modeToggle = document.getElementById('mode-toggle');
  const systemStatusText = document.getElementById('system-status-text');

  // Tri-Mode View Switcher Elements
  const btnViewAnime = document.getElementById('btn-view-anime');
  const btnViewTactical = document.getElementById('btn-view-tactical');
  const btnViewDiagnostic = document.getElementById('btn-view-diagnostic');
  const animeView = document.getElementById('anime-view');
  const tacticalView = document.getElementById('tactical-view');
  const diagnosticView = document.getElementById('diagnostic-view');

  // Audio Toggle (Enabled by default)
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const savedAudioPref = localStorage.getItem('magi_audio_enabled');
  let audioEnabled = savedAudioPref !== null ? savedAudioPref === 'true' : true;
  let audioCtx = null;

  function updateAudioButtonUI() {
    if (!audioToggleBtn) return;
    if (audioEnabled) {
      audioToggleBtn.textContent = 'AUDIO: ON';
      audioToggleBtn.classList.add('active');
    } else {
      audioToggleBtn.textContent = 'AUDIO: OFF';
      audioToggleBtn.classList.remove('active');
    }
  }
  updateAudioButtonUI();

  // Browser Autoplay Policy: Unlock AudioContext on first user interaction anywhere
  function ensureAudioContext() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch {}
  }
  window.addEventListener('click', ensureAudioContext, { once: true });
  window.addEventListener('keydown', ensureAudioContext, { once: true });

  // Query Section Collapsible Elements
  const queryToggleBtn = document.getElementById('query-toggle-btn');
  const querySection = document.getElementById('query-section');

  // Copy ASCII Button
  const copyAsciiBtn = document.getElementById('copy-ascii-btn');

  // Diagnostic HUD Elements
  const timelineSection = document.getElementById('deliberation-timeline');
  const timelineStatusMsg = document.getElementById('timeline-status-msg');
  const magiCoreSection = document.getElementById('magi-core-section');

  // Tactical Elements
  const tacticalQueryDisplay = document.getElementById('tactical-query-display');
  const tacticalArrow1 = document.getElementById('tactical-arrow-1');
  const tacticalArrow2 = document.getElementById('tactical-arrow-2');
  const tacticalFlowStatus = document.getElementById('tactical-flow-status');
  const tacticalCoreBox = document.getElementById('tactical-core-box');
  const tacticalCoreDecision = document.getElementById('tactical-core-decision');
  const tacticalCoreConf = document.getElementById('tactical-core-conf');
  const tacticalCoreVerdict = document.getElementById('tactical-core-verdict');

  // Anime View Elements
  const animeScreenBalthasar = document.getElementById('anime-screen-balthasar');
  const animeScreenCasper = document.getElementById('anime-screen-casper');
  const animeScreenMelchior = document.getElementById('anime-screen-melchior');
  const animeVoteBalthasar = document.getElementById('anime-vote-balthasar');
  const animeVoteCasper = document.getElementById('anime-vote-casper');
  const animeVoteMelchior = document.getElementById('anime-vote-melchior');
  const animeConfBalthasar = document.getElementById('anime-conf-balthasar');
  const animeConfCasper = document.getElementById('anime-conf-casper');
  const animeConfMelchior = document.getElementById('anime-conf-melchior');
  const animeConsensusStamp = document.getElementById('anime-consensus-stamp');
  const animeStampText = document.getElementById('anime-stamp-text');
  const animeResolutionLabel = document.getElementById('anime-resolution-label');
  const animeCodeVal = document.getElementById('anime-code-val');
  const animeExMode = document.getElementById('anime-ex-mode');
  const animeQuestionForm = document.getElementById('anime-question-form');
  const animeConsoleInput = document.getElementById('anime-console-input');
  const animeConsoleSubmitBtn = document.getElementById('anime-console-submit-btn');

  // Anime Chat Elements
  const animeChatWrapper = document.getElementById('anime-chat-wrapper');
  const animeChatToggleBtn = document.getElementById('anime-chat-toggle-btn');
  const animeChatClearBtn = document.getElementById('anime-chat-clear-btn');
  const animeChatMessages = document.getElementById('anime-chat-messages');
  const animeChatCounter = document.getElementById('anime-chat-counter');
  const animeChatLed = document.getElementById('anime-chat-led');
  let chatMessageCount = 0;

  // Tactical / Anime Agent Inspect Modal Elements
  const tacticalAgentModal = document.getElementById('tactical-agent-modal');
  const tacticalModalTitle = document.getElementById('tactical-modal-title');
  const tacticalModalBody = document.getElementById('tactical-modal-body');
  const tacticalModalCloseBtn = document.getElementById('tactical-modal-close-btn');

  // Comparison Modal elements
  const compareBtn = document.getElementById('compare-btn');
  const compareModal = document.getElementById('compare-modal');
  const compareCloseBtn = document.getElementById('compare-close-btn');
  const compareSingleBody = document.getElementById('compare-single-body');
  const compareMagiBody = document.getElementById('compare-magi-body');
  const compareDiffSummary = document.getElementById('compare-diff-summary');

  // Benchmark Modal elements
  const benchmarkBtn = document.getElementById('benchmark-btn');
  const benchmarkModal = document.getElementById('benchmark-modal');
  const benchmarkCloseBtn = document.getElementById('benchmark-close-btn');
  const benchmarkContent = document.getElementById('benchmark-content');

  // JSON Modal elements
  const jsonModal = document.getElementById('json-modal');
  const jsonModalBtn = document.getElementById('json-modal-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCopyBtn = document.getElementById('modal-copy-btn');
  const modalJsonContent = document.getElementById('modal-json-content');

  // Diagnostic Beacons
  const beacons = {
    MELCHIOR: document.getElementById('beacon-melchior'),
    BALTHASAR: document.getElementById('beacon-balthasar'),
    CASPER: document.getElementById('beacon-casper'),
  };

  let currentResult = null;
  let activeRounds = {
    MELCHIOR: 0,
    BALTHASAR: 0,
    CASPER: 0,
  };

  // -------------------------------------------------------------
  // Tri-Mode View Switcher (Anime vs Tactical vs Diagnostic)
  // -------------------------------------------------------------
  function setViewMode(mode) {
    [btnViewAnime, btnViewTactical, btnViewDiagnostic].forEach(b => b?.classList.remove('active'));
    [animeView, tacticalView, diagnosticView].forEach(v => v?.classList.add('hidden'));

    if (mode === 'diagnostic') {
      btnViewDiagnostic.classList.add('active');
      diagnosticView.classList.remove('hidden');
    } else if (mode === 'tactical') {
      btnViewTactical.classList.add('active');
      tacticalView.classList.remove('hidden');
    } else {
      // Default: Anime MAGI View
      btnViewAnime.classList.add('active');
      animeView.classList.remove('hidden');
      mode = 'anime';
    }

    localStorage.setItem('magi_view_mode', mode);
  }

  btnViewAnime?.addEventListener('click', () => setViewMode('anime'));
  btnViewTactical?.addEventListener('click', () => setViewMode('tactical'));
  btnViewDiagnostic?.addEventListener('click', () => setViewMode('diagnostic'));

  // Restore preferred view mode (default to anime)
  const savedView = localStorage.getItem('magi_view_mode') || 'anime';
  setViewMode(savedView);

  // -------------------------------------------------------------
  // Web Audio Synthesizer (Zero External Dependencies)
  // -------------------------------------------------------------
  function playBeep(freq = 880, duration = 0.04, type = 'sine') {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable
    }
  }

  // Authentic 90s NERV Terminal "Beep-Beep-Beep" Electronic Triplet
  function playNervTripletBeep(type = 'approve') {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      // Vintage 90s Supercomputer Electronic Frequencies
      let freqs = [1860, 2340, 2780]; // Affirmative ascending high-tech computer burst
      let wave = 'square';
      let peakGain = 0.040;

      if (type === 'reject') {
        freqs = [620, 480, 370];       // Low alert electronic dissonance burst
        wave = 'sawtooth';
        peakGain = 0.050;
      } else if (type === 'conditional') {
        freqs = [1400, 1180, 1620];     // Amber analytical tones
        wave = 'square';
        peakGain = 0.035;
      } else if (type === 'processing') {
        freqs = [2200, 2600];          // Soft teletext calculation blips
        wave = 'sine';
        peakGain = 0.012;
      }

      freqs.forEach((freq, i) => {
        const startTime = now + (i * 0.045);
        const duration = 0.028;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        // 90s CRT / terminal speaker acoustic emulation (3.6kHz lowpass cutoff)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3600, startTime);

        osc.type = wave;
        osc.frequency.setValueAtTime(freq, startTime);

        // Crisp staccato envelope: instantaneous attack with rapid decay
        gain.gain.setValueAtTime(peakGain, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.005);
      });
    } catch {
      // AudioContext unavailable
    }
  }

  function playConsensusChime() {
    if (!audioEnabled) return;
    playBeep(523, 0.08, 'triangle'); // C5
    setTimeout(() => playBeep(659, 0.12, 'triangle'), 80); // E5
  }

  function playImpasseAlarm() {
    if (!audioEnabled) return;
    playBeep(260, 0.12, 'sawtooth');
    setTimeout(() => playBeep(220, 0.20, 'sawtooth'), 120);
  }

  audioToggleBtn?.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    localStorage.setItem('magi_audio_enabled', audioEnabled ? 'true' : 'false');
    updateAudioButtonUI();
    if (audioEnabled) {
      ensureAudioContext();
      playBeep(660, 0.06, 'triangle');
    }
  });

  // -------------------------------------------------------------
  // Collapsible Query Console Panel
  // -------------------------------------------------------------
  function setQueryCollapsed(collapsed) {
    if (!querySection || !queryToggleBtn) return;
    if (collapsed) {
      querySection.classList.add('collapsed');
      queryToggleBtn.classList.add('minimized');
      queryToggleBtn.textContent = 'QUERY: SHOW ▼';
      localStorage.setItem('magi_query_collapsed', 'true');
    } else {
      querySection.classList.remove('collapsed');
      queryToggleBtn.classList.remove('minimized');
      queryToggleBtn.textContent = 'QUERY: HIDE ▲';
      localStorage.setItem('magi_query_collapsed', 'false');
    }
  }

  queryToggleBtn?.addEventListener('click', () => {
    const isCurrentlyCollapsed = querySection?.classList.contains('collapsed');
    setQueryCollapsed(!isCurrentlyCollapsed);
    playBeep(480, 0.03, 'sine');
  });

  // Restore saved query panel state (default expanded)
  if (localStorage.getItem('magi_query_collapsed') === 'true') {
    setQueryCollapsed(true);
  }

  // -------------------------------------------------------------
  // Anime Inter-Core Discussion Chat & History Log
  // -------------------------------------------------------------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTimeNow() {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  }

  function updateChatCounter() {
    if (animeChatCounter) {
      animeChatCounter.textContent = `${chatMessageCount} ${chatMessageCount === 1 ? 'MSG' : 'MSGS'}`;
    }
  }

  function setAnimeChatCollapsed(collapsed) {
    if (!animeChatWrapper || !animeChatToggleBtn) return;
    if (collapsed) {
      animeChatWrapper.classList.add('collapsed');
      animeChatToggleBtn.textContent = 'MOSTRAR CHAT ▼';
      localStorage.setItem('magi_anime_chat_collapsed', 'true');
    } else {
      animeChatWrapper.classList.remove('collapsed');
      animeChatToggleBtn.textContent = 'ESCONDER CHAT ▲';
      localStorage.setItem('magi_anime_chat_collapsed', 'false');
    }
  }

  animeChatToggleBtn?.addEventListener('click', () => {
    const isCollapsed = animeChatWrapper?.classList.contains('collapsed');
    setAnimeChatCollapsed(!isCollapsed);
    playBeep(480, 0.03, 'sine');
  });

  animeChatClearBtn?.addEventListener('click', () => {
    if (!animeChatMessages) return;
    animeChatMessages.innerHTML = `
      <div class="anime-chat-system-msg">
        <span class="system-bracket">[SYSTEM]</span> HISTÓRICO LIMPO. NERV MAGI BUS ONLINE AGUARDANDO NOVAS DIRETRIZES...
      </div>
    `;
    chatMessageCount = 0;
    updateChatCounter();
    playBeep(330, 0.05, 'triangle');
  });

  // Restore collapsed state (default: expanded)
  if (localStorage.getItem('magi_anime_chat_collapsed') === 'true') {
    setAnimeChatCollapsed(true);
  }

  function appendChatMessage(html) {
    if (!animeChatMessages) return;
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    const msgEl = temp.firstElementChild;
    if (msgEl) {
      animeChatMessages.appendChild(msgEl);
      chatMessageCount++;
      updateChatCounter();
      animeChatMessages.scrollTop = animeChatMessages.scrollHeight;
    }
  }

  function addChatUserQuery(query) {
    const time = formatTimeNow();
    appendChatMessage(`
      <div class="chat-entry chat-user">
        <div class="chat-entry-header">
          <div class="chat-sender-info">
            <span>👤 OPERADOR // DIRETRIZ SUBMETIDA</span>
          </div>
          <span class="chat-time">[${time}]</span>
        </div>
        <div class="chat-user-text">&gt;&gt;&gt; ${escapeHtml(query)}</div>
      </div>
    `);
  }

  function addChatAgentMessage(agentId, roundNumber, output) {
    const time = formatTimeNow();
    const agentNames = {
      MELCHIOR: 'MELCHIOR-1 [A CIENTISTA]',
      BALTHASAR: 'BALTHASAR-2 [A MÃE]',
      CASPER: 'CASPER-3 [A MULHER]',
    };
    const roleName = agentNames[agentId.toUpperCase()] || agentId;
    const agentClass = `chat-${agentId.toLowerCase()}`;
    const stance = output.stance || 'CONDITIONAL';
    const confPct = Math.round((output.confidence || 0.8) * 100);

    let critiquesHtml = '';
    if (Array.isArray(output.critiquesOfPeers) && output.critiquesOfPeers.length > 0) {
      const items = output.critiquesOfPeers.map(c => `
        <div class="chat-critique-item">
          ↳ <span class="chat-critique-target">vs ${escapeHtml(c.targetAgent || 'PAR')}:</span> ${escapeHtml(c.critique || c.argument || '')}
        </div>
      `).join('');
      critiquesHtml = `
        <div class="chat-critiques-box">
          <div class="chat-critiques-title">💬 CONTESTAÇÃO / DEBATE COM PARES:</div>
          ${items}
        </div>
      `;
    }

    appendChatMessage(`
      <div class="chat-entry chat-agent ${agentClass}">
        <div class="chat-entry-header">
          <div class="chat-sender-info">
            <span>${roleName}</span>
            <span class="chat-stance-pill ${stance}">${stance} [${confPct}%]</span>
          </div>
          <span class="chat-time">RODADA ${roundNumber} • [${time}]</span>
        </div>
        <div class="chat-agent-summary">${escapeHtml(output.summary || '')}</div>
        ${critiquesHtml}
      </div>
    `);
  }

  function addChatGateNotice(type, text) {
    const time = formatTimeNow();
    const isDivergence = type === 'disagreement';
    appendChatMessage(`
      <div class="chat-entry chat-gate ${isDivergence ? 'chat-disagreement' : 'chat-consensus'}">
        <span>${isDivergence ? '⚡' : '✓'} [${time}] ${escapeHtml(text)}</span>
      </div>
    `);
  }

  function addChatSynthesisMessage(result) {
    const time = formatTimeNow();
    const decision = result.finalDecision || 'CONSENSUS_REACHED';
    const tokens = result.totalTokensUsed || 0;
    const cost = (result.estimatedCostUsd || 0).toFixed(4);
    const duration = result.metadata?.durationMs ? (result.metadata.durationMs / 1000).toFixed(1) : '--';

    appendChatMessage(`
      <div class="chat-entry chat-synthesis">
        <div class="chat-entry-header">
          <div class="chat-sender-info">
            <span>🧠 MAGI CORE // VEREDITO FINAL</span>
            <span class="chat-stance-pill APPROVE">${escapeHtml(decision)}</span>
          </div>
          <span class="chat-time">[${time}]</span>
        </div>
        <div class="chat-verdict-text">${escapeHtml(result.coreVerdict || '')}</div>
        <div class="chat-synthesis-summary">${escapeHtml(result.synthesisSummary || '')}</div>
        <div class="chat-telemetry-row">
          <span>⏱️ ${duration}s</span>
          <span>🪙 ${tokens} TOKENS</span>
          <span>💵 $${cost} USD</span>
        </div>
      </div>
    `);
  }

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Initial Health Check & Engine Mode Persistence
  // -------------------------------------------------------------
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.geminiConfigured) {
          systemStatusText.textContent = 'ONLINE // GEMINI 3.1 PRO READY';
        } else {
          systemStatusText.textContent = 'ONLINE // MOCK FIXTURES ACTIVE';
        }

        const savedMode = localStorage.getItem('magi_engine_mode');
        if (savedMode) {
          modeToggle.value = savedMode;
        } else if (data.geminiConfigured) {
          modeToggle.value = 'gemini';
        } else {
          modeToggle.value = 'mock';
        }
      }
    } catch {
      systemStatusText.textContent = 'SYSTEM OFFLINE';
    }
  }
  checkHealth();

  modeToggle?.addEventListener('change', () => {
    localStorage.setItem('magi_engine_mode', modeToggle.value);
    playBeep(520, 0.04, 'sine');
  });

  // -------------------------------------------------------------
  // Preset Pills & Query Input Sync
  // -------------------------------------------------------------
  document.querySelectorAll('.preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      queryInput.value = q;
      syncQueryDisplay(q);
      queryInput.focus();
    });
  });

  queryInput?.addEventListener('input', () => {
    syncQueryDisplay(queryInput.value, 'main');
  });

  animeConsoleInput?.addEventListener('input', () => {
    syncQueryDisplay(animeConsoleInput.value, 'anime');
  });

  function syncQueryDisplay(q, source = null) {
    const text = q.trim() || 'Awaiting query...';
    if (tacticalQueryDisplay) tacticalQueryDisplay.textContent = text;
    if (animeConsoleInput && source !== 'anime') animeConsoleInput.value = q;
    if (queryInput && source !== 'main') queryInput.value = q;
  }

  // Allow direct submission directly from the anime console question field!
  animeQuestionForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (animeConsoleInput?.value || '').trim();
    if (!q) return;
    queryInput.value = q;
    if (form.requestSubmit) {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  // -------------------------------------------------------------
  // Beacon & Stepper Helpers
  // -------------------------------------------------------------
  function setBeacon(agentId, active) {
    const beacon = beacons[agentId.toUpperCase()];
    if (beacon) {
      if (active) beacon.classList.add('active');
      else beacon.classList.remove('active');
    }
  }

  function clearAllBeacons() {
    Object.values(beacons).forEach(b => b?.classList.remove('active'));
  }

  function resetStepper() {
    ['step-r0', 'step-gate1', 'step-r1', 'step-gate2', 'step-r2', 'step-core'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active', 'passed');
    });
    timelineStatusMsg.textContent = 'SYNCHRONIZING INDEPENDENT SUPERCOMPUTERS...';
  }

  // -------------------------------------------------------------
  // Form Submission & Live SSE Streaming Execution
  // -------------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = queryInput.value.trim();
    if (!question) return;

    // Auto-collapse query console to maximize MAGI screen visualization
    setQueryCollapsed(true);
    syncQueryDisplay(question);
    addChatUserQuery(question);
    const language = langSelect.value || undefined;
    const isMock = modeToggle.value === 'mock';

    // UI Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">DELIBERATING...</span>';
    if (animeConsoleSubmitBtn) {
      animeConsoleSubmitBtn.disabled = true;
      animeConsoleSubmitBtn.textContent = 'BUSY...';
    }
    if (animeConsoleInput) animeConsoleInput.disabled = true;
    timelineSection.classList.remove('hidden');
    magiCoreSection.classList.add('hidden');
    tacticalCoreBox?.classList.remove('resolved');

    // Tactical Flow Status
    if (tacticalFlowStatus) {
      tacticalFlowStatus.textContent = 'DELIBERATING...';
      tacticalFlowStatus.classList.add('deliberating');
    }
    tacticalArrow1?.classList.add('active');
    tacticalArrow2?.classList.add('active');

    // Anime View: Transition to Active Deliberation (Blinking Strobe State)
    startAnimeDeliberation(question);

    clearAllBeacons();
    resetStepper();

    const playbackQueue = [];
    let isPlayingQueue = false;
    let queueDrainResolver = null;

    async function drainPlaybackQueue() {
      if (isPlayingQueue) return;
      isPlayingQueue = true;
      while (playbackQueue.length > 0) {
        const item = playbackQueue.shift();
        handleStreamEvent(item.eventType, item.payload);

        let delayMs = 0;
        if (item.eventType === 'round_start') {
          delayMs = isMock ? 120 : 400;
        } else if (item.eventType === 'agent_start') {
          delayMs = isMock ? 80 : 200;
        } else if (item.eventType === 'agent_complete') {
          delayMs = isMock ? 250 : 750;
        } else if (item.eventType === 'disagreement' || item.eventType === 'consensus') {
          delayMs = isMock ? 150 : 400;
        } else if (item.eventType === 'synthesis_start') {
          delayMs = isMock ? 250 : 800;
        }

        if (delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
      isPlayingQueue = false;
      if (queueDrainResolver) {
        queueDrainResolver();
        queueDrainResolver = null;
      }
    }

    try {
      const abortController = new AbortController();
      const timeoutMs = isMock ? 25000 : 85000;
      const timeoutTimer = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);

      const response = await fetch('/api/deliberate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language, mock: isMock }),
        signal: abortController.signal,
      });
      clearTimeout(timeoutTimer);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const block of events) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let dataStr = '';

          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.replace('data:', '').trim();
            }
          }

          if (dataStr) {
            try {
              const payload = JSON.parse(dataStr);
              playbackQueue.push({ eventType, payload });
              drainPlaybackQueue();
            } catch (err) {
              console.warn('SSE JSON parse error:', err);
            }
          }
        }
      }

      // Wait for all visual animations and audio beeps to finish playing with safety timeout
      if (isPlayingQueue || playbackQueue.length > 0) {
        await Promise.race([
          new Promise(r => { queueDrainResolver = r; }),
          new Promise(r => setTimeout(r, 8000)),
        ]);
      }
    } catch (err) {
      playbackQueue.length = 0;
      isPlayingQueue = false;
      alert(`[MAGI SYSTEM ERROR]: ${err.message}`);
      timelineStatusMsg.textContent = `SYSTEM ERROR: ${err.message}`;
      if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'SYSTEM FAULT';
      resetAnimeStandby();
    } finally {
      stopTelemetryCycling();
      clearAllBeacons();
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-text">DELIBERATE [STREAM]</span>';
      if (animeConsoleSubmitBtn) {
        animeConsoleSubmitBtn.disabled = false;
        animeConsoleSubmitBtn.textContent = 'EXECUTE [↵]';
      }
      if (animeConsoleInput) animeConsoleInput.disabled = false;
      tacticalArrow1?.classList.remove('active');
      tacticalArrow2?.classList.remove('active');
      tacticalFlowStatus?.classList.remove('deliberating');
    }
  });

  // -------------------------------------------------------------
  // SSE Event Handler
  // -------------------------------------------------------------
  function handleStreamEvent(eventType, payload) {
    switch (eventType) {
      case 'round_start': {
        const { roundNumber, title } = payload;
        clearAllBeacons();
        timelineStatusMsg.textContent = `ROUND ${roundNumber}: ${title.toUpperCase()} COMMENCED`;
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = `ROUND ${roundNumber} DELIBERATION`;
        playBeep(440, 0.05, 'sine');

        if (roundNumber === 0) {
          document.getElementById('step-r0')?.classList.add('active');
        } else if (roundNumber === 1) {
          document.getElementById('step-r0')?.classList.add('passed');
          document.getElementById('step-gate1')?.classList.add('passed');
          document.getElementById('step-r1')?.classList.add('active');
        } else if (roundNumber === 2) {
          document.getElementById('step-r1')?.classList.add('passed');
          document.getElementById('step-gate2')?.classList.add('passed');
          document.getElementById('step-r2')?.classList.add('active');
        }
        break;
      }

      case 'agent_start': {
        const { roundNumber, agentId } = payload;
        setBeacon(agentId, true);
        timelineStatusMsg.textContent = `${agentId} FORMULATING DELIBERATION ARGUMENTS (ROUND ${roundNumber})...`;
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = `${agentId} DELIBERATING...`;
        playBeep(580, 0.03, 'triangle');
        break;
      }

      case 'agent_complete': {
        const { roundNumber, output } = payload;
        setBeacon(output.agentId, false);

        // Render live diagnostic panel, tactical card, anime polygon screen, and inter-core chat
        renderLiveAgentOutput(output.agentId, roundNumber, output);
        renderTacticalAgent(output.agentId, output);
        renderAnimeAgent(output.agentId, output);
        addChatAgentMessage(output.agentId, roundNumber, output);

        // Authentic 90s NERV confirmation beeps (Approved vs Rejected)
        if (output.stance === 'APPROVE') {
          playNervTripletBeep('approve');
        } else if (output.stance === 'REJECT') {
          playNervTripletBeep('reject');
        } else {
          playNervTripletBeep('conditional');
        }
        break;
      }

      case 'disagreement': {
        const { roundNumber, report } = payload;
        const deltaPct = Math.round(report.maxConfidenceDelta * 100);
        timelineStatusMsg.textContent = `DIVERGENCE DETECTED (STANCE DELTA: ${deltaPct}%) -> ADVANCING TO PEER CRITIQUE`;
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = `DIVERGENCE (Δ ${deltaPct}%)`;
        addChatGateNotice('disagreement', `DIVERGÊNCIA IDENTIFICADA (DELTA ${deltaPct}%). INICIANDO RODADA ${roundNumber + 1} DE CONTESTAÇÃO CRUZADA.`);
        playBeep(320, 0.08, 'sawtooth');

        if (roundNumber === 0) {
          document.getElementById('step-gate1')?.classList.add('active');
        } else if (roundNumber === 1) {
          document.getElementById('step-gate2')?.classList.add('active');
        }
        break;
      }

      case 'consensus': {
        const { report } = payload;
        const deltaPct = Math.round(report.maxConfidenceDelta * 100);
        timelineStatusMsg.textContent = `CONSENSUS REACHED (STANCE DELTA: ${deltaPct}%) -> ADVANCING TO SYNTHESIS`;
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'CONSENSUS ACHIEVED';
        addChatGateNotice('consensus', `CONSENSO ALCANÇADO ENTRE OS NÚCLEOS (DELTA ${deltaPct}%). AVANÇANDO PARA ARBITRAGEM FINAL.`);
        document.getElementById('step-gate1')?.classList.add('passed');
        break;
      }

      case 'synthesis_start': {
        clearAllBeacons();
        timelineStatusMsg.textContent = 'MAGI CORE ARBITRATION & EPISTEMIC SYNTHESIS IN PROGRESS...';
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'SYNTHESIZING...';
        if (animeResolutionLabel) animeResolutionLabel.textContent = 'SYNTHESIS: ARBITRATING CONSENSUS...';
        if (animeConsensusStamp) {
          animeConsensusStamp.className = 'anime-stamp-box stamp-deliberating';
          if (animeStampText) animeStampText.textContent = '調 停';
        }
        document.getElementById('step-core')?.classList.add('active');
        playBeep(600, 0.06, 'triangle');
        break;
      }

      case 'complete': {
        currentResult = payload.result;
        renderResults(currentResult);
        addChatSynthesisMessage(currentResult);
        break;
      }

      case 'error': {
        throw new Error(payload.error || 'Server stream failed');
      }
    }
  }

  // -------------------------------------------------------------
  // Anime View State Machine & Dynamic Telemetry Cycling
  // -------------------------------------------------------------
  let telemetryInterval = null;
  let calcFlickerInterval = null;
  const finishedAnimeAgents = new Set();

  function startTelemetryCycling() {
    stopTelemetryCycling();
    const codes = [473, 582, 601, 804, 912, 108, 305, 731, 246, 690, 815, 937];
    let teleTick = 0;
    telemetryInterval = setInterval(() => {
      if (animeCodeVal) {
        const nextCode = codes[Math.floor(Math.random() * codes.length)];
        animeCodeVal.textContent = nextCode;
      }
      if (++teleTick % 6 === 0) {
        playNervTripletBeep('processing');
      }
    }, 85);

    calcFlickerInterval = setInterval(() => {
      if (!finishedAnimeAgents.has('BALTHASAR') && animeConfBalthasar) {
        animeConfBalthasar.textContent = `${Math.floor(40 + Math.random() * 55)}%`;
      }
      if (!finishedAnimeAgents.has('CASPER') && animeConfCasper) {
        animeConfCasper.textContent = `${Math.floor(40 + Math.random() * 55)}%`;
      }
      if (!finishedAnimeAgents.has('MELCHIOR') && animeConfMelchior) {
        animeConfMelchior.textContent = `${Math.floor(40 + Math.random() * 55)}%`;
      }
    }, 110);
  }

  function stopTelemetryCycling(finalCode = 473) {
    if (telemetryInterval) {
      clearInterval(telemetryInterval);
      telemetryInterval = null;
    }
    if (calcFlickerInterval) {
      clearInterval(calcFlickerInterval);
      calcFlickerInterval = null;
    }
    if (animeCodeVal) {
      animeCodeVal.textContent = finalCode;
    }
  }

  function resetAnimeStandby() {
    stopTelemetryCycling();
    finishedAnimeAgents.clear();

    const screens = [animeScreenBalthasar, animeScreenCasper, animeScreenMelchior];
    screens.forEach(s => {
      if (!s) return;
      s.className = s.className.replace(/state-\w+/g, '').trim();
      s.classList.add('state-standby');
    });

    if (animeVoteBalthasar) animeVoteBalthasar.textContent = 'STANDBY';
    if (animeVoteCasper) animeVoteCasper.textContent = 'STANDBY';
    if (animeVoteMelchior) animeVoteMelchior.textContent = 'STANDBY';

    if (animeConfBalthasar) animeConfBalthasar.textContent = '';
    if (animeConfCasper) animeConfCasper.textContent = '';
    if (animeConfMelchior) animeConfMelchior.textContent = '';

    if (animeConsensusStamp) {
      animeConsensusStamp.className = 'anime-stamp-box stamp-standby';
      if (animeStampText) animeStampText.textContent = '待 機';
    }
    if (animeResolutionLabel) animeResolutionLabel.textContent = 'RESOLUTION: STANDBY';
    if (animeExMode) animeExMode.textContent = 'OFF';
  }

  function startAnimeDeliberation(question) {
    finishedAnimeAgents.clear();
    startTelemetryCycling();

    const screens = [animeScreenBalthasar, animeScreenCasper, animeScreenMelchior];
    screens.forEach(s => {
      if (!s) return;
      s.className = s.className.replace(/state-\w+/g, '').trim();
      s.classList.add('state-deliberating');
    });

    if (animeVoteBalthasar) animeVoteBalthasar.textContent = 'PROCESSING';
    if (animeVoteCasper) animeVoteCasper.textContent = 'PROCESSING';
    if (animeVoteMelchior) animeVoteMelchior.textContent = 'PROCESSING';

    if (animeConsensusStamp) {
      animeConsensusStamp.className = 'anime-stamp-box stamp-deliberating';
      if (animeStampText) animeStampText.textContent = '審 議';
    }
    if (animeResolutionLabel) animeResolutionLabel.textContent = 'DELIBERATING...';

    if (animeExMode) animeExMode.textContent = 'ACTIVE';
    if (animeConsoleQuestion) animeConsoleQuestion.textContent = question;
  }

  function renderAnimeAgent(agentId, output) {
    finishedAnimeAgents.add(agentId.toUpperCase());

    let screenEl = null;
    let voteEl = null;
    let confEl = null;

    if (agentId === 'BALTHASAR') {
      screenEl = animeScreenBalthasar;
      voteEl = animeVoteBalthasar;
      confEl = animeConfBalthasar;
    } else if (agentId === 'CASPER') {
      screenEl = animeScreenCasper;
      voteEl = animeVoteCasper;
      confEl = animeConfCasper;
    } else if (agentId === 'MELCHIOR') {
      screenEl = animeScreenMelchior;
      voteEl = animeVoteMelchior;
      confEl = animeConfMelchior;
    }

    if (!screenEl) return;

    screenEl.className = screenEl.className.replace(/state-\w+/g, '').trim();

    const stance = output.stance;
    const confPct = Math.round(output.confidence * 100);

    if (stance === 'APPROVE') {
      screenEl.classList.add('state-approved');
      if (voteEl) voteEl.textContent = 'APPROVED';
    } else if (stance === 'REJECT') {
      screenEl.classList.add('state-rejected');
      if (voteEl) voteEl.textContent = 'REJECTED';
    } else {
      screenEl.classList.add('state-conditional');
      if (voteEl) voteEl.textContent = stance;
    }

    if (confEl) confEl.textContent = `${confPct}%`;
  }

  function renderAnimeResolution(result) {
    stopTelemetryCycling(473);
    if (animeExMode) animeExMode.textContent = 'NOMINAL';

    // Count votes across the triad
    const analysis = result.initialAnalysis;
    const votes = [analysis.MELCHIOR?.stance, analysis.BALTHASAR?.stance, analysis.CASPER?.stance];
    const approveCount = votes.filter(v => v === 'APPROVE').length;
    const rejectCount = votes.filter(v => v === 'REJECT').length;

    const isRejected = result.finalDecision.includes('REJECT') || rejectCount >= 2;

    if (isRejected) {
      // Scenario B: Impasse / Rejection Lockout
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-rejected';
        if (animeStampText) animeStampText.textContent = '否 決';
      }
      if (animeResolutionLabel) animeResolutionLabel.textContent = 'SECURITY LOCK: IMPASSE / REJECTED';
      playImpasseAlarm();
    } else if (approveCount === 3) {
      // Scenario A: Unanimous Pass (3-0)
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-consensus';
        if (animeStampText) animeStampText.textContent = '合 意';
      }
      if (animeResolutionLabel) animeResolutionLabel.textContent = 'RESOLUTION: PASSED (3-0 UNANIMOUS)';
      playConsensusChime();
    } else {
      // Scenario A: Majority / Conditional Pass (2-1)
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-passed';
        if (animeStampText) animeStampText.textContent = '可 決';
      }
      if (animeResolutionLabel) animeResolutionLabel.textContent = `RESOLUTION: PASSED (${result.finalDecision.replace('_', ' ')})`;
      playConsensusChime();
    }

    const tokensVal = document.getElementById('anime-telemetry-tokens');
    if (tokensVal) {
      if (result.metadata?.totalTokensUsed) {
        const tokens = result.metadata.totalTokensUsed.toLocaleString();
        const cost = result.metadata.estimatedCostUsd ? `$${result.metadata.estimatedCostUsd.toFixed(5)}` : '$0.00';
        tokensVal.textContent = `TOKENS: ${tokens} | EST. COST: ${cost} USD`;
      } else {
        tokensVal.textContent = 'TOKENS: MOCK (0) | EST. COST: $0.00 USD';
      }
    }
  }

  // -------------------------------------------------------------
  // Tactical Card Rendering
  // -------------------------------------------------------------
  function renderTacticalAgent(agentId, output) {
    const id = agentId.toLowerCase();
    const stanceEl = document.getElementById(`tactical-stance-${id}`);
    const confEl = document.getElementById(`tactical-conf-${id}`);

    if (stanceEl) {
      stanceEl.textContent = output.stance;
      stanceEl.className = `tactical-stance-badge ${output.stance}`;
    }

    if (confEl) {
      const confPct = Math.round(output.confidence * 100);
      animateNumber(confEl, confPct, '%');
    }
  }

  function renderTacticalCore(result) {
    if (tacticalCoreBox) tacticalCoreBox.classList.add('resolved');
    if (tacticalCoreDecision) tacticalCoreDecision.textContent = result.finalDecision.replace('_', ' ');

    const confs = Object.values(result.initialAnalysis).map(a => a.confidence);
    const avgConf = Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100);
    if (tacticalCoreConf) animateNumber(tacticalCoreConf, avgConf, '%');

    if (tacticalCoreVerdict) tacticalCoreVerdict.textContent = result.coreVerdict;
    if (tacticalFlowStatus) {
      tacticalFlowStatus.textContent = result.deliberationRoundsCount === 0
        ? 'IMMEDIATE CONSENSUS'
        : `CONVERGED (${result.deliberationRoundsCount} ROUND${result.deliberationRoundsCount > 1 ? 'S' : ''})`;
    }
  }

  function animateNumber(element, targetNum, suffix = '') {
    if (!element) return;
    let start = 0;
    const duration = 500;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.round(start + (targetNum - start) * progress);
      element.textContent = `${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // -------------------------------------------------------------
  // Agent Reasoning Audit Popover (Works for both Anime & Tactical)
  // -------------------------------------------------------------
  document.querySelectorAll('.tactical-card, .anime-screen').forEach(el => {
    el.addEventListener('click', () => {
      const agentId = el.getAttribute('data-agent');
      if (!currentResult) {
        alert('Please submit a query first to audit supercomputer deliberation logs.');
        return;
      }
      openTacticalAgentModal(agentId);
    });
  });

  function openTacticalAgentModal(agentId) {
    if (!currentResult) return;
    const latestRound = currentResult.deliberationRoundsCount;
    let output = null;
    if (latestRound > 0 && currentResult.rounds.length) {
      const rObj = currentResult.rounds.find(r => r.roundNumber === latestRound);
      output = rObj?.agentOutputs[agentId];
    }
    if (!output) {
      output = currentResult.initialAnalysis[agentId];
    }
    if (!output) return;

    const confPct = Math.round(output.confidence * 100);
    tacticalModalTitle.textContent = `${agentId} // REASONING AUDIT (ROUND ${latestRound})`;
    tacticalModalBody.innerHTML = `
      <div class="tactical-popover-content">
        <div class="tactical-popover-meta">
          <span class="stance-badge ${output.stance}">${output.stance}</span>
          <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: bold; color: var(--core-color);">CONFIDENCE: ${confPct}%</span>
        </div>

        <div>
          <div class="section-title">EXECUTIVE SUMMARY</div>
          <p class="summary-text" style="margin-top: 0.3rem;">${escapeHtml(output.summary)}</p>
        </div>

        <div>
          <div class="section-title">CORE ARGUMENTS (${output.keyArguments.length})</div>
          <ul class="bullet-list" style="margin-top: 0.3rem;">
            ${output.keyArguments.map(arg => `<li>${escapeHtml(arg)}</li>`).join('')}
          </ul>
        </div>

        <div>
          <div class="section-title">IDENTIFIED RISKS &amp; VULNERABILITIES (${output.identifiedRisks.length})</div>
          <ul class="bullet-list risk-list" style="margin-top: 0.3rem;">
            ${output.identifiedRisks.length ? output.identifiedRisks.map(r => `<li>${escapeHtml(r)}</li>`).join('') : '<li>No fatal vulnerabilities detected.</li>'}
          </ul>
        </div>

        ${output.critiquesOfPeers && output.critiquesOfPeers.length > 0 ? `
          <div>
            <div class="section-title">PEER CRITIQUES</div>
            <div style="margin-top: 0.3rem;">
              ${output.critiquesOfPeers.map(c => `
                <div style="font-size: 0.8rem; margin-bottom: 0.4rem;">
                  <strong style="color: var(--core-color);">↳ VS ${c.targetAgent}:</strong> ${escapeHtml(c.rebuttal)}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    tacticalAgentModal.classList.remove('hidden');
  }

  tacticalModalCloseBtn?.addEventListener('click', () => {
    tacticalAgentModal.classList.add('hidden');
  });

  tacticalAgentModal?.addEventListener('click', (e) => {
    if (e.target === tacticalAgentModal) tacticalAgentModal.classList.add('hidden');
  });

  // -------------------------------------------------------------
  // Live Diagnostic Output Rendering (during streaming)
  // -------------------------------------------------------------
  function renderLiveAgentOutput(agentId, roundNum, output) {
    const prefix = agentId.toLowerCase();

    const stanceEl = document.getElementById(`${prefix}-stance`);
    if (stanceEl) {
      stanceEl.textContent = output.stance;
      stanceEl.className = `stance-badge ${output.stance}`;
    }

    const confVal = Math.round(output.confidence * 100);
    const confEl = document.getElementById(`${prefix}-conf`);
    const meterEl = document.getElementById(`${prefix}-meter`);
    if (confEl) confEl.textContent = `${confVal}%`;
    if (meterEl) meterEl.style.width = `${confVal}%`;

    const sumEl = document.getElementById(`${prefix}-summary`);
    if (sumEl) sumEl.textContent = output.summary;

    const argsList = document.getElementById(`${prefix}-arguments`);
    if (argsList) argsList.innerHTML = output.keyArguments.map(arg => `<li>${escapeHtml(arg)}</li>`).join('');

    const risksList = document.getElementById(`${prefix}-risks`);
    if (risksList) {
      risksList.innerHTML = output.identifiedRisks.length
        ? output.identifiedRisks.map(r => `<li>${escapeHtml(r)}</li>`).join('')
        : '<li>No critical risks identified.</li>';
    }

    const critiquesBox = document.getElementById(`${prefix}-critiques-box`);
    const critiquesContainer = document.getElementById(`${prefix}-critiques`);
    if (critiquesBox && critiquesContainer) {
      if (output.critiquesOfPeers && output.critiquesOfPeers.length > 0) {
        critiquesBox.classList.remove('hidden');
        critiquesContainer.innerHTML = output.critiquesOfPeers.map(c => `
          <div style="margin-bottom: 0.5rem; font-size: 0.78rem;">
            <strong style="color: var(--core-color);">↳ VS ${c.targetAgent}:</strong> ${escapeHtml(c.rebuttal)}
          </div>
        `).join('');
      } else {
        critiquesBox.classList.add('hidden');
        critiquesContainer.innerHTML = '';
      }
    }
  }

  // -------------------------------------------------------------
  // Result Rendering (Finalizes All 3 Views)
  // -------------------------------------------------------------
  function renderResults(result) {
    const totalRounds = result.deliberationRoundsCount;

    // 1. Diagnostic View Finalization
    document.getElementById('step-r0')?.classList.add('passed');
    document.getElementById('step-gate1')?.classList.add('passed');

    if (totalRounds >= 1) {
      document.getElementById('step-r1')?.classList.add('passed');
      document.getElementById('step-gate2')?.classList.add('passed');
    }
    if (totalRounds >= 2) {
      document.getElementById('step-r2')?.classList.add('passed');
    }
    document.getElementById('step-core')?.classList.add('passed');

    const statusText = totalRounds === 0
      ? 'IMMEDIATE CONSENSUS REACHED IN ROUND 0'
      : `DELIBERATION CONVERGED AFTER ${totalRounds} ROUND${totalRounds > 1 ? 'S' : ''}`;
    if (timelineStatusMsg) timelineStatusMsg.textContent = statusText;

    const latestRoundNum = totalRounds;
    activeRounds = {
      MELCHIOR: latestRoundNum,
      BALTHASAR: latestRoundNum,
      CASPER: latestRoundNum,
    };

    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      setupAgentTabs(agentId, totalRounds);
      renderAgentRound(agentId, latestRoundNum);
    });

    renderMagiCore(result);

    // 2. Tactical View Finalization
    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      const output = latestRoundNum > 0 && result.rounds.length
        ? result.rounds.find(r => r.roundNumber === latestRoundNum)?.agentOutputs[agentId] || result.initialAnalysis[agentId]
        : result.initialAnalysis[agentId];
      if (output) renderTacticalAgent(agentId, output);
    });

    renderTacticalCore(result);

    // 3. Anime View Finalization
    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(agentId => {
      const output = latestRoundNum > 0 && result.rounds.length
        ? result.rounds.find(r => r.roundNumber === latestRoundNum)?.agentOutputs[agentId] || result.initialAnalysis[agentId]
        : result.initialAnalysis[agentId];
      if (output) renderAnimeAgent(agentId, output);
    });

    renderAnimeResolution(result);
  }

  // -------------------------------------------------------------
  // Diagnostic Agent Round Navigation Tabs
  // -------------------------------------------------------------
  function setupAgentTabs(agentId, totalRounds) {
    const tabsContainer = document.getElementById(`tabs-${agentId.toLowerCase()}`);
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    const btn0 = createTabBtn(agentId, 0, totalRounds === 0);
    tabsContainer.appendChild(btn0);

    if (totalRounds >= 1) {
      const btn1 = createTabBtn(agentId, 1, totalRounds === 1);
      tabsContainer.appendChild(btn1);
    }

    if (totalRounds >= 2) {
      const btn2 = createTabBtn(agentId, 2, true);
      tabsContainer.appendChild(btn2);
    }
  }

  function createTabBtn(agentId, roundNum, isActive) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tab-btn ${isActive ? 'active' : ''}`;
    btn.textContent = `R${roundNum}`;
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRounds[agentId] = roundNum;
      renderAgentRound(agentId, roundNum);
    });
    return btn;
  }

  function renderAgentRound(agentId, roundNum) {
    if (!currentResult) return;

    let output;
    if (roundNum === 0) {
      output = currentResult.initialAnalysis[agentId];
    } else {
      const roundObj = currentResult.rounds.find(r => r.roundNumber === roundNum);
      output = roundObj?.agentOutputs[agentId] || currentResult.initialAnalysis[agentId];
    }

    if (!output) return;
    renderLiveAgentOutput(agentId, roundNum, output);
  }

  // -------------------------------------------------------------
  // MAGI Core Rendering (Diagnostic View)
  // -------------------------------------------------------------
  function renderMagiCore(result) {
    magiCoreSection?.classList.remove('hidden');

    const badge = document.getElementById('core-decision-badge');
    if (badge) badge.textContent = result.finalDecision.replace('_', ' ');

    const vText = document.getElementById('core-verdict-text');
    if (vText) vText.textContent = result.coreVerdict;

    const scores = result.argumentQualityScore;
    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(id => {
      const lower = id.toLowerCase();
      const val = scores[id] || 0;
      const numEl = document.getElementById(`score-val-${lower}`);
      const barEl = document.getElementById(`score-bar-${lower}`);
      if (numEl) numEl.textContent = `${val}/10`;
      if (barEl) barEl.style.width = `${val * 10}%`;
    });

    const factorsList = document.getElementById('core-decisive-factors');
    if (factorsList) {
      factorsList.innerHTML = result.decisiveFactors.map(f => `<li>${escapeHtml(f)}</li>`).join('');
    }

    const sumEl = document.getElementById('core-synthesis-summary');
    if (sumEl) sumEl.textContent = result.synthesisSummary;

    const dissentList = document.getElementById('core-dissenting-list');
    if (dissentList) {
      dissentList.innerHTML = result.dissentingOpinionsNoted?.length
        ? result.dissentingOpinionsNoted.map(d => `<li>${escapeHtml(d)}</li>`).join('')
        : '<li>None recorded. Deliberation resolved all major objections.</li>';
    }

    if (result.metadata) {
      const dEl = document.getElementById('meta-duration');
      const rEl = document.getElementById('meta-rounds');
      const mEl = document.getElementById('meta-model');
      const lEl = document.getElementById('meta-lang');
      const tEl = document.getElementById('meta-tokens');
      const cEl = document.getElementById('meta-cost');
      if (dEl) dEl.textContent = `DURATION: ${result.metadata.durationMs} ms`;
      if (rEl) rEl.textContent = `ROUNDS: ${result.deliberationRoundsCount}`;
      if (mEl) mEl.textContent = `MODEL: ${result.metadata.model}`;
      if (lEl) lEl.textContent = `LANG: ${result.metadata.language}`;
      if (tEl) tEl.textContent = result.metadata.totalTokensUsed ? `TOKENS: ${result.metadata.totalTokensUsed.toLocaleString()}` : 'TOKENS: MOCK (0)';
      if (cEl) cEl.textContent = result.metadata.estimatedCostUsd !== undefined ? `EST. COST: $${result.metadata.estimatedCostUsd.toFixed(5)}` : 'EST. COST: $0.00';
    }
  }

  // -------------------------------------------------------------
  // ASCII Diagram Generator & Clipboard Exporter
  // -------------------------------------------------------------
  copyAsciiBtn?.addEventListener('click', () => {
    const question = (currentResult?.question || queryInput.value.trim()) || 'Should we migrate to Rust?';
    const melchior = currentResult?.initialAnalysis.MELCHIOR || { stance: 'APPROVE', confidence: 0.90 };
    const balthasar = currentResult?.initialAnalysis.BALTHASAR || { stance: 'REJECT', confidence: 0.92 };
    const casper = currentResult?.initialAnalysis.CASPER || { stance: 'PIVOT', confidence: 0.85 };
    const decision = currentResult?.finalDecision ? currentResult.finalDecision.replace('_', ' ') : 'CONDITIONAL PASS';

    const confs = [melchior.confidence, balthasar.confidence, casper.confidence];
    const avgConf = Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100);

    const mConf = Math.round(melchior.confidence * 100) + '%';
    const bConf = Math.round(balthasar.confidence * 100) + '%';
    const cConf = Math.round(casper.confidence * 100) + '%';

    const mStance = padRight(melchior.stance, 10);
    const bStance = padRight(balthasar.stance, 10);
    const cStance = padRight(casper.stance, 10);

    const asciiArt = [
      '┌────────────────────────────────────────────────────────┐',
      '│                      MAGI SYSTEM                       │',
      '├────────────────────────────────────────────────────────┤',
      '│                                                        │',
      '│  QUERY                                                 │',
      `│  ┌──────────────────────────────────────────────────┐  │`,
      `│  │ ${padRight(truncate(question, 48), 48)} │  │`,
      `│  └──────────────────────────────────────────────────┘  │`,
      '│                                                        │',
      '│  ┌────────────┐   ┌────────────┐   ┌────────────┐      │',
      '│  │ MELCHIOR   │   │ BALTHASAR  │   │ CASPER     │      │',
      '│  │ ANALYSIS   │   │ CRITIQUE   │   │ ALTERNATIVE│      │',
      '│  │            │   │            │   │            │      │',
      `│  │ ${mStance} │   │ ${bStance} │   │ ${cStance} │      │`,
      `│  │ ${padRight(mConf, 10)} │   │ ${padRight(bConf, 10)} │   │ ${padRight(cConf, 10)} │      │`,
      '│  └────────────┘   └────────────┘   └────────────┘      │',
      '│                         ↓                              │',
      '│                    DELIBERATION                        │',
      '│                         ↓                              │',
      '│                     MAGI CORE                          │',
      `│               ${padRight(truncate(`${decision} – ${avgConf}%`, 38), 38)} │`,
      '│                                                        │',
      '└────────────────────────────────────────────────────────┘',
    ].join('\n');

    navigator.clipboard.writeText(asciiArt).then(() => {
      copyAsciiBtn.textContent = 'COPIED ASCII!';
      playBeep(880, 0.08, 'triangle');
      setTimeout(() => { copyAsciiBtn.textContent = 'COPY ASCII'; }, 2000);
    });
  });

  function padRight(str, len) {
    return str.padEnd(len, ' ');
  }

  function truncate(str, max) {
    return str.length > max ? str.substring(0, max - 3) + '...' : str;
  }

  // -------------------------------------------------------------
  // Comparison vs Single Gemini Modal
  // -------------------------------------------------------------
  compareBtn?.addEventListener('click', async () => {
    let question = queryInput.value.trim();
    if (!question) {
      question = 'How effective would a Magi supercomputer run society actually be?';
      queryInput.value = question;
      syncQueryDisplay(question);
    }

    const language = langSelect.value || undefined;
    const isMock = modeToggle.value === 'mock';

    compareModal.classList.remove('hidden');
    compareSingleBody.innerHTML = '<div class="loading-spinner">GENERATING SINGLE BASELINE RESPONSE...</div>';
    compareMagiBody.innerHTML = '<div class="loading-spinner">RUNNING FULL MAGI TRIAD DELIBERATION...</div>';
    compareDiffSummary.innerHTML = '';

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language, mock: isMock }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed comparison' }));
        throw new Error(err.error || `HTTP error ${res.status}`);
      }

      const report = await res.json();
      renderComparisonReport(report);
    } catch (err) {
      compareSingleBody.innerHTML = `<div style="color: var(--balthasar-color);">Error: ${escapeHtml(err.message)}</div>`;
      compareMagiBody.innerHTML = `<div style="color: var(--balthasar-color);">Error: ${escapeHtml(err.message)}</div>`;
    }
  });

  compareCloseBtn?.addEventListener('click', () => {
    compareModal.classList.add('hidden');
  });

  compareModal?.addEventListener('click', (e) => {
    if (e.target === compareModal) compareModal.classList.add('hidden');
  });

  function renderComparisonReport(report) {
    const single = report.singleBaseline;
    const magi = report.magiResult;
    const diff = report.differential;

    compareSingleBody.innerHTML = `
      <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.4rem;">MODEL: ${escapeHtml(single.model)}</div>
      <div class="section-title">VERDICT & SUMMARY</div>
      <p><strong>${escapeHtml(single.verdict)}</strong></p>
      <p class="summary-text">${escapeHtml(single.summary)}</p>

      <div class="section-title" style="margin-top: 0.8rem;">BENEFITS / PROS IDENTIFIED (${single.pros.length})</div>
      <ul class="bullet-list">
        ${single.pros.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>

      <div class="section-title" style="margin-top: 0.8rem;">RISKS & VULNERABILITIES (${single.cons.length})</div>
      <ul class="bullet-list risk-list">
        ${single.cons.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
    `;

    compareMagiBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="stance-badge ${magi.finalDecision}">${magi.finalDecision.replace('_', ' ')}</span>
        <span style="font-size: 0.75rem; color: var(--text-dim);">${magi.deliberationRoundsCount} DELIBERATION ROUND(S)</span>
      </div>
      <div class="section-title">CORE VERDICT</div>
      <p><strong>${escapeHtml(magi.coreVerdict)}</strong></p>
      <p class="summary-text">${escapeHtml(magi.synthesisSummary)}</p>

      <div class="section-title" style="margin-top: 0.8rem;">TRIAD INDEPENDENT PERSPECTIVES</div>
      <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.3rem;">
        <div><strong style="color: var(--melchior-color);">MELCHIOR-1 (${magi.argumentQualityScore.MELCHIOR}/10):</strong> ${escapeHtml(magi.initialAnalysis.MELCHIOR?.stance || 'N/A')}</div>
        <div><strong style="color: var(--balthasar-color);">BALTHASAR-2 (${magi.argumentQualityScore.BALTHASAR}/10):</strong> ${escapeHtml(magi.initialAnalysis.BALTHASAR?.stance || 'N/A')}</div>
        <div><strong style="color: var(--casper-color);">CASPER-3 (${magi.argumentQualityScore.CASPER}/10):</strong> ${escapeHtml(magi.initialAnalysis.CASPER?.stance || 'N/A')}</div>
      </div>

      <div class="section-title" style="margin-top: 0.8rem;">DECISIVE FACTORS</div>
      <ul class="bullet-list">
        ${magi.decisiveFactors.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
      </ul>

      <div class="section-title" style="margin-top: 0.8rem;">DISSENTING OPINIONS & MITIGATIONS</div>
      <ul class="bullet-list risk-list">
        ${magi.dissentingOpinionsNoted.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
      </ul>
    `;

    compareDiffSummary.innerHTML = `
      <div class="diff-metric">
        <span class="diff-metric-label">PERSPECTIVES</span>
        <span class="diff-metric-val">${diff.perspectivesCount.single} vs ${diff.perspectivesCount.magi}</span>
      </div>
      <div class="diff-metric">
        <span class="diff-metric-label">MAGI UNMITIGATED RISKS</span>
        <span class="diff-metric-val">+${diff.unmitigatedRisksCaughtByMagi.length}</span>
      </div>
      <div class="diff-metric">
        <span class="diff-metric-label">ALTERNATIVE COMPROMISES</span>
        <span class="diff-metric-val">${diff.alternativeCompromisesIntroduced.length}</span>
      </div>
      <div class="diff-metric">
        <span class="diff-metric-label">DELIBERATION ROUNDS</span>
        <span class="diff-metric-val">${diff.deliberationRoundsUsed}</span>
      </div>
      <div class="diff-metric">
        <span class="diff-metric-label">EPISTEMIC QUALITY</span>
        <span class="diff-metric-val">${diff.epistemicAuditQualityAvg.toFixed(1)}/10</span>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Benchmark Modal & Suite Runner
  // -------------------------------------------------------------
  benchmarkBtn?.addEventListener('click', async () => {
    const isMock = modeToggle.value === 'mock';
    benchmarkModal.classList.remove('hidden');
    benchmarkContent.innerHTML = '<div class="loading-spinner">EXECUTING 5 THEMATIC BENCHMARK SUITES (TECHNICAL, ETHICAL, STRATEGIC, EVANGELION, CONSENSUS)...</div>';

    try {
      const res = await fetch(`/api/benchmark?mock=${isMock}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const summary = await res.json();
      renderBenchmarkSummary(summary);
    } catch (err) {
      benchmarkContent.innerHTML = `<div style="color: var(--balthasar-color);">Benchmark Failed: ${escapeHtml(err.message)}</div>`;
    }
  });

  benchmarkCloseBtn?.addEventListener('click', () => {
    benchmarkModal.classList.add('hidden');
  });

  benchmarkModal?.addEventListener('click', (e) => {
    if (e.target === benchmarkModal) benchmarkModal.classList.add('hidden');
  });

  function renderBenchmarkSummary(summary) {
    const consensusPct = Math.round(summary.consensusRate * 100);

    const rows = summary.scorecards.map(s => {
      const avgScore = ((s.qualityScores.MELCHIOR + s.qualityScores.BALTHASAR + s.qualityScores.CASPER) / 3).toFixed(1);
      const decisionClass = s.finalDecision.toLowerCase().includes('reject') ? 'FAIL' : 'PASS';
      return `
        <tr>
          <td>
            <strong>${escapeHtml(s.title)}</strong><br>
            <span style="font-size: 0.7rem; color: var(--text-dim);">${escapeHtml(s.dilemmaId)}</span>
          </td>
          <td><span class="meta-pill">${escapeHtml(s.category)}</span></td>
          <td><span class="bench-status-badge ${decisionClass}">${escapeHtml(s.finalDecision)}</span></td>
          <td style="text-align: center;">${s.roundsCount}</td>
          <td>
            <span style="color: var(--melchior-color); font-weight: bold;">M:${s.qualityScores.MELCHIOR}</span> /
            <span style="color: var(--balthasar-color); font-weight: bold;">B:${s.qualityScores.BALTHASAR}</span> /
            <span style="color: var(--casper-color); font-weight: bold;">C:${s.qualityScores.CASPER}</span>
            <span style="color: var(--text-dim); font-size: 0.72rem;">(Avg ${avgScore})</span>
          </td>
          <td style="text-align: right;">${s.durationMs} ms</td>
          <td><div style="max-height: 60px; overflow-y: auto; font-size: 0.78rem;">${escapeHtml(s.coreVerdict)}</div></td>
        </tr>
      `;
    }).join('');

    benchmarkContent.innerHTML = `
      <div class="bench-summary-bar">
        <div class="bench-stat-item">
          <span class="bench-stat-label">TOTAL SUITES</span>
          <span class="bench-stat-val">${summary.totalDilemmas}</span>
        </div>
        <div class="bench-stat-item">
          <span class="bench-stat-label">CONSENSUS RATE</span>
          <span class="bench-stat-val">${consensusPct}%</span>
        </div>
        <div class="bench-stat-item">
          <span class="bench-stat-label">AVG ROUNDS</span>
          <span class="bench-stat-val">${summary.averageRounds.toFixed(1)}</span>
        </div>
        <div class="bench-stat-item">
          <span class="bench-stat-label">AVG LATENCY</span>
          <span class="bench-stat-val">${Math.round(summary.averageDurationMs)} ms</span>
        </div>
        <div class="bench-stat-item">
          <span class="bench-stat-label">TIMESTAMP</span>
          <span class="bench-stat-val" style="font-size: 0.85rem; color: var(--text-dim);">${new Date(summary.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      <table class="benchmark-table">
        <thead>
          <tr>
            <th>DILEMMA / TITLE</th>
            <th>CATEGORY</th>
            <th>DECISION</th>
            <th>ROUNDS</th>
            <th>QUALITY RATINGS</th>
            <th>LATENCY</th>
            <th>VERDICT SUMMARY</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  // -------------------------------------------------------------
  // JSON Modal Handlers
  // -------------------------------------------------------------
  jsonModalBtn?.addEventListener('click', () => {
    if (!currentResult) return;
    modalJsonContent.textContent = JSON.stringify(currentResult, null, 2);
    jsonModal.classList.remove('hidden');
  });

  modalCloseBtn?.addEventListener('click', () => {
    jsonModal.classList.add('hidden');
  });

  jsonModal?.addEventListener('click', (e) => {
    if (e.target === jsonModal) jsonModal.classList.add('hidden');
  });

  modalCopyBtn?.addEventListener('click', () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2)).then(() => {
      modalCopyBtn.textContent = 'COPIED!';
      setTimeout(() => { modalCopyBtn.textContent = 'COPY TO CLIPBOARD'; }, 2000);
    });
  });

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
