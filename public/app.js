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
  const animeCrtMonitor = document.querySelector('.anime-crt-monitor');
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
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const animeMonitorFsBtn = document.getElementById('anime-monitor-fullscreen-btn');

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
  // Comprehensive Internationalization (i18n) System (7 Languages)
  // -------------------------------------------------------------
  let currentLang = localStorage.getItem('magi_language') || 'en';

  const I18N = {
    en: {
      ctrl_view: 'VIEW:',
      ctrl_lang: 'LANG:',
      ctrl_engine: 'ENGINE:',
      view_anime: 'ANIME MAGI',
      view_tactical: 'TACTICAL',
      view_diagnostic: 'DIAGNOSTIC',
      audio_on: 'AUDIO: ON',
      audio_off: 'AUDIO: OFF',
      query_hide: 'QUERY: HIDE ▲',
      query_show: 'QUERY: SHOW ▼',
      system_ready: 'SYSTEM READY',
      system_busy: 'DELIBERATING...',
      terminal_title: 'SUBMIT QUERY FOR SUPERCOMPUTER CONSENSUS',
      query_placeholder: 'Type your question here (e.g. Should we migrate to Rust?)',
      presets_label: 'PRESETS:',
      preset_1_title: 'Evangelion Society?',
      preset_1_query: 'How effective would a Magi supercomputer run society actually be?',
      preset_2_title: 'Rust Rewrite?',
      preset_2_query: 'Should we migrate to Rust?',
      preset_3_title: 'Microservices?',
      preset_3_query: 'Should our engineering organization migrate to microservices?',
      preset_4_title: 'CI/CD Pipeline?',
      preset_4_query: 'Should we adopt automated continuous delivery pipelines?',
      btn_copy_ascii: 'COPY ASCII',
      btn_compare: 'COMPARE VS SINGLE GEMINI',
      btn_benchmark: 'RUN BENCHMARK',
      btn_deliberate: 'DELIBERATE [STREAM]',
      btn_deliberating: 'DELIBERATING...',
      anime_res_standby: 'RESOLUTION: STANDBY',
      anime_res_deliberating: 'DELIBERATING...',
      anime_inspect_hint: '[CLICK TO AUDIT]',
      console_access_code: 'access code:',
      console_question: 'question:',
      console_placeholder: 'TYPE YOUR QUESTION (ENTER OR CLICK EXECUTE)...',
      console_execute_btn: 'EXECUTE [↵]',
      console_busy_btn: 'BUSY...',
      console_telemetry: 'telemetry:',
      chat_title: 'MAGI INTER-CORE LOG // CHAT & DEBATE HISTORY',
      chat_clear_btn: 'CLEAR',
      chat_hide_btn: 'HIDE CHAT ▲',
      chat_show_btn: 'SHOW CHAT ▼',
      chat_system_bus: '[SYSTEM] MAGI INTER-CORE COMMUNICATION BUS ONLINE. AWAITING OPERATOR DIRECTIVES...',
      chat_user_label: '👤 OPERATOR // SUBMITTED DIRECTIVE',
      chat_round_prefix: 'ROUND',
      chat_critiques_title: '💬 CROSS-EXAMINATION / PEER DEBATE:',
      chat_divergence: (d, r) => `⚡ DIVERGENCE DETECTED (DELTA ${d}%). INITIATING ROUND ${r} OF PEER CRITIQUE.`,
      chat_consensus: (d) => `✓ CONSENSUS REACHED BETWEEN CORES (DELTA ${d}%). PROCEEDING TO FINAL SYNTHESIS.`,
      chat_synthesis_title: '⚖️ MAGI CORE // FINAL ARBITRATION',
      chat_cleared_msg: '[SYSTEM] SESSION LOG CLEARED. AWAITING OPERATOR DIRECTIVES...',
      agent_roles: {
        MELCHIOR: 'MELCHIOR-1 [THE SCIENTIST]',
        BALTHASAR: 'BALTHASAR-2 [THE MOTHER]',
        CASPER: 'CASPER-3 [THE WOMAN]',
      },
      tactical_query_label: 'QUERY',
      tactical_flow_title: 'CONSENSUS FLOW',
      tactical_inspect_tag: '[CLICK TO INSPECT]',
      tactical_roles: {
        MELCHIOR: 'ANALYSIS',
        BALTHASAR: 'CRITIQUE',
        CASPER: 'ALTERNATIVE',
      },
      diag_step_r0: 'ROUND 0<br><span>INDEPENDENT</span>',
      diag_step_gate1: 'CHECK 1<br><span>STANCE DELTA</span>',
      diag_step_r1: 'ROUND 1<br><span>PEER CRITIQUE</span>',
      diag_step_gate2: 'CHECK 2<br><span>CONVERGENCE</span>',
      diag_step_r2: 'ROUND 2<br><span>FINAL REBUTTAL</span>',
      diag_step_core: 'CORE<br><span>SYNTHESIS</span>',
    },
    pt: {
      ctrl_view: 'VISÃO:',
      ctrl_lang: 'IDIOMA:',
      ctrl_engine: 'MOTOR:',
      view_anime: 'MAGI ANIME',
      view_tactical: 'TÁTICO',
      view_diagnostic: 'DIAGNÓSTICO',
      audio_on: 'ÁUDIO: LIG',
      audio_off: 'ÁUDIO: DES',
      query_hide: 'CONSULTA: OCULTAR ▲',
      query_show: 'CONSULTA: EXIBIR ▼',
      system_ready: 'SISTEMA PRONTO',
      system_busy: 'DELIBERANDO...',
      terminal_title: 'ENVIAR CONSULTA PARA CONSENSO DO SUPERCOMPUTADOR',
      query_placeholder: 'Digite sua pergunta aqui (ex: Devemos migrar para Rust?)',
      presets_label: 'EXEMPLOS:',
      preset_1_title: 'Sociedade Evangelion?',
      preset_1_query: 'Quão eficaz seria uma sociedade realmente administrada por um supercomputador Magi?',
      preset_2_title: 'Reescrever em Rust?',
      preset_2_query: 'Devemos migrar nossa base de código para Rust?',
      preset_3_title: 'Microsserviços?',
      preset_3_query: 'Nossa organização de engenharia deve migrar para microsserviços?',
      preset_4_title: 'Pipeline CI/CD?',
      preset_4_query: 'Devemos adotar pipelines automatizados de entrega contínua (CI/CD)?',
      btn_copy_ascii: 'COPIAR ASCII',
      btn_compare: 'COMPARAR VS GEMINI ÚNICO',
      btn_benchmark: 'EXECUTAR BENCHMARK',
      btn_deliberate: 'DELIBERAR [STREAM]',
      btn_deliberating: 'DELIBERANDO...',
      anime_res_standby: 'RESOLUÇÃO: AGUARDANDO',
      anime_res_deliberating: 'DELIBERANDO...',
      anime_inspect_hint: '[CLIQUE PARA AUDITAR]',
      console_access_code: 'código de acesso:',
      console_question: 'pergunta:',
      console_placeholder: 'DIGITE SUA PERGUNTA (ENTER OU CLIQUE EM EXECUTE)...',
      console_execute_btn: 'EXECUTAR [↵]',
      console_busy_btn: 'OCUPADO...',
      console_telemetry: 'telemetria:',
      chat_title: 'LOG INTER-NÚCLEOS MAGI // HISTÓRICO E DEBATE',
      chat_clear_btn: 'LIMPAR',
      chat_hide_btn: 'ESCONDER CHAT ▲',
      chat_show_btn: 'MOSTRAR CHAT ▼',
      chat_system_bus: '[SISTEMA] BARRAMENTO INTER-NÚCLEOS MAGI ONLINE. AGUARDANDO DIRETRIZES DO OPERADOR...',
      chat_user_label: '👤 OPERADOR // DIRETRIZ SUBMETIDA',
      chat_round_prefix: 'RODADA',
      chat_critiques_title: '💬 CONTESTAÇÃO / DEBATE COM PARES:',
      chat_divergence: (d, r) => `⚡ DIVERGÊNCIA IDENTIFICADA (DELTA ${d}%). INICIANDO RODADA ${r} DE CONTESTAÇÃO CRUZADA.`,
      chat_consensus: (d) => `✓ CONSENSO ALCANÇADO ENTRE OS NÚCLEOS (DELTA ${d}%). AVANÇANDO PARA ARBITRAGEM FINAL.`,
      chat_synthesis_title: '⚖️ SÍNTESE FINAL // ARBITRAGEM MAGI CORE',
      chat_cleared_msg: '[SISTEMA] HISTÓRICO DA SESSÃO LIMPO. AGUARDANDO DIRETRIZES DO OPERADOR...',
      agent_roles: {
        MELCHIOR: 'MELCHIOR-1 [A CIENTISTA]',
        BALTHASAR: 'BALTHASAR-2 [A MÃE]',
        CASPER: 'CASPER-3 [A MULHER]',
      },
      tactical_query_label: 'CONSULTA',
      tactical_flow_title: 'FLUXO DE CONSENSO',
      tactical_inspect_tag: '[CLIQUE PARA INSPECIONAR]',
      tactical_roles: {
        MELCHIOR: 'ANÁLISE',
        BALTHASAR: 'CRÍTICA',
        CASPER: 'ALTERNATIVA',
      },
      diag_step_r0: 'RODADA 0<br><span>INDEPENDENTE</span>',
      diag_step_gate1: 'TESTE 1<br><span>DELTA POSIÇÃO</span>',
      diag_step_r1: 'RODADA 1<br><span>CONTESTAÇÃO</span>',
      diag_step_gate2: 'TESTE 2<br><span>CONVERGÊNCIA</span>',
      diag_step_r2: 'RODADA 2<br><span>RÉPLICA FINAL</span>',
      diag_step_core: 'CORE<br><span>SÍNTESE</span>',
    },
    es: {
      ctrl_view: 'VISTA:',
      ctrl_lang: 'IDIOMA:',
      ctrl_engine: 'MOTOR:',
      view_anime: 'MAGI ANIME',
      view_tactical: 'TÁCTICO',
      view_diagnostic: 'DIAGNÓSTICO',
      audio_on: 'AUDIO: ENC',
      audio_off: 'AUDIO: APAG',
      query_hide: 'CONSULTA: OCULTAR ▲',
      query_show: 'CONSULTA: MOSTRAR ▼',
      system_ready: 'SISTEMA LISTO',
      system_busy: 'DELIBERANDO...',
      terminal_title: 'ENVIAR CONSULTA PARA CONSENSO DEL SUPERORDENADOR',
      query_placeholder: 'Escriba su pregunta aquí (ej: ¿Debemos migrar a Rust?)',
      presets_label: 'EJEMPLOS:',
      preset_1_title: '¿Sociedad Evangelion?',
      preset_1_query: '¿Qué tan efectiva sería una sociedad administrada por un superordenador Magi?',
      preset_2_title: '¿Reescribir en Rust?',
      preset_2_query: '¿Deberíamos migrar nuestro código base a Rust?',
      preset_3_title: '¿Microservicios?',
      preset_3_query: '¿Debería nuestra organización de ingeniería migrar a microservicios?',
      preset_4_title: '¿Pipeline CI/CD?',
      preset_4_query: '¿Deberíamos adoptar pipelines automatizados de entrega continua (CI/CD)?',
      btn_copy_ascii: 'COPIAR ASCII',
      btn_compare: 'COMPARAR VS GEMINI ÚNICO',
      btn_benchmark: 'EJECUTAR BENCHMARK',
      btn_deliberate: 'DELIBERAR [STREAM]',
      btn_deliberating: 'DELIBERANDO...',
      anime_res_standby: 'RESOLUCIÓN: EN ESPERA',
      anime_res_deliberating: 'DELIBERANDO...',
      anime_inspect_hint: '[CLIC PARA AUDITAR]',
      console_access_code: 'código de acceso:',
      console_question: 'pregunta:',
      console_placeholder: 'ESCRIBA SU PREGUNTA (ENTER O CLIC EN EXECUTE)...',
      console_execute_btn: 'EJECUTAR [↵]',
      console_busy_btn: 'OCUPADO...',
      console_telemetry: 'telemetría:',
      chat_title: 'REGISTRO INTER-NÚCLEOS MAGI // HISTORIAL Y DEBATE',
      chat_clear_btn: 'LIMPIAR',
      chat_hide_btn: 'OCULTAR CHAT ▲',
      chat_show_btn: 'MOSTRAR CHAT ▼',
      chat_system_bus: '[SISTEMA] BUS DE COMUNICACIÓN INTER-NÚCLEOS ONLINE. ESPERANDO DIRECTIVAS...',
      chat_user_label: '👤 OPERADOR // DIRECTIVA ENVIADA',
      chat_round_prefix: 'RONDA',
      chat_critiques_title: '💬 REFUTACIÓN / DEBATE ENTRE PARES:',
      chat_divergence: (d, r) => `⚡ DIVERGENCIA DETECTADA (DELTA ${d}%). INICIANDO RONDA ${r} DE REFUTACIÓN.`,
      chat_consensus: (d) => `✓ CONSENSO ALCANZADO ENTRE NÚCLEOS (DELTA ${d}%). AVANZANDO A SÍNTESIS FINAL.`,
      chat_synthesis_title: '⚖️ SÍNTESIS FINAL // ARBITRAJE MAGI CORE',
      chat_cleared_msg: '[SISTEMA] REGISTRO DE SESIÓN LIMPIO. ESPERANDO DIRECTIVAS DEL OPERADOR...',
      agent_roles: {
        MELCHIOR: 'MELCHIOR-1 [EL CIENTÍFICO]',
        BALTHASAR: 'BALTHASAR-2 [LA MADRE]',
        CASPER: 'CASPER-3 [LA MUJER]',
      },
      tactical_query_label: 'CONSULTA',
      tactical_flow_title: 'FLUJO DE CONSENSO',
      tactical_inspect_tag: '[CLIC PARA INSPECCIONAR]',
      tactical_roles: {
        MELCHIOR: 'ANÁLISIS',
        BALTHASAR: 'CRÍTICA',
        CASPER: 'ALTERNATIVA',
      },
      diag_step_r0: 'RONDA 0<br><span>INDEPENDIENTE</span>',
      diag_step_gate1: 'CONTROL 1<br><span>DELTA POSTURA</span>',
      diag_step_r1: 'RONDA 1<br><span>REFUTACIÓN</span>',
      diag_step_gate2: 'CONTROL 2<br><span>CONVERGENCIA</span>',
      diag_step_r2: 'RONDA 2<br><span>RÉPLICA FINAL</span>',
      diag_step_core: 'CORE<br><span>SÍNTESIS</span>',
    },
    fr: {
      ctrl_view: 'VUE:',
      ctrl_lang: 'LANGUE:',
      ctrl_engine: 'MOTEUR:',
      view_anime: 'MAGI ANIME',
      view_tactical: 'TACTIQUE',
      view_diagnostic: 'DIAGNOSTIC',
      audio_on: 'AUDIO: ON',
      audio_off: 'AUDIO: OFF',
      query_hide: 'REQUÊTE: MASQUER ▲',
      query_show: 'REQUÊTE: AFFICHER ▼',
      system_ready: 'SYSTÈME PRÊT',
      system_busy: 'DÉLIBÉRATION...',
      terminal_title: 'SOUMETTRE UNE REQUÊTE POUR CONSENSUS DU SUPERORDINATEUR',
      query_placeholder: 'Entrez votre question ici (ex: Devrions-nous migrer vers Rust ?)',
      presets_label: 'EXEMPLES:',
      preset_1_title: 'Société Evangelion ?',
      preset_1_query: 'Dans quelle mesure une société dirigée par le superordinateur Magi serait-elle efficace ?',
      preset_2_title: 'Réécriture en Rust ?',
      preset_2_query: 'Devrions-nous migrer notre codebase vers Rust ?',
      preset_3_title: 'Microservices ?',
      preset_3_query: 'Notre organisation d’ingénierie devrait-elle adopter les microservices ?',
      preset_4_title: 'Pipeline CI/CD ?',
      preset_4_query: 'Devrions-nous adopter des pipelines de déploiement continu automatisés (CI/CD) ?',
      btn_copy_ascii: 'COPIER ASCII',
      btn_compare: 'COMPARER VS GEMINI UNIQUE',
      btn_benchmark: 'LANCER BENCHMARK',
      btn_deliberate: 'DÉLIBÉRER [STREAM]',
      btn_deliberating: 'DÉLIBÉRATION...',
      anime_res_standby: 'RÉSOLUTION: EN ATTENTE',
      anime_res_deliberating: 'DÉLIBÉRATION...',
      anime_inspect_hint: '[CLIQUER POUR AUDITER]',
      console_access_code: 'code d’accès:',
      console_question: 'question:',
      console_placeholder: 'TAPEZ VOTRE QUESTION (ENTRÉE OU CLIQUER SUR EXECUTE)...',
      console_execute_btn: 'EXÉCUTER [↵]',
      console_busy_btn: 'OCCUPÉ...',
      console_telemetry: 'télémétrie:',
      chat_title: 'JOURNAL INTER-CŒURS MAGI // HISTORIQUE ET DÉBAT',
      chat_clear_btn: 'EFFACER',
      chat_hide_btn: 'MASQUER CHAT ▲',
      chat_show_btn: 'AFFICHER CHAT ▼',
      chat_system_bus: '[SYSTÈME] BUS DE COMMUNICATION INTER-CŒURS EN LIGNE. EN ATTENTE DE DIRECTIVES...',
      chat_user_label: '👤 OPÉRATEUR // DIRECTIVE SOUMISE',
      chat_round_prefix: 'TOUR',
      chat_critiques_title: '💬 CONTESTATION / DÉBAT ENTRE PAIRS:',
      chat_divergence: (d, r) => `⚡ DIVERGENCE DÉTECTÉE (DELTA ${d}%). DÉBUT DU TOUR ${r} DE DÉBAT CROISÉ.`,
      chat_consensus: (d) => `✓ CONSENSUS OBTENU ENTRE LES CŒURS (DELTA ${d}%). PASSAGE À LA SYNTHÈSE FINALE.`,
      chat_synthesis_title: '⚖️ SYNTHÈSE FINALE // ARBITRAGE DU CŒUR MAGI',
      chat_cleared_msg: '[SYSTÈME] JOURNAL DE SESSION EFFACÉ. EN ATTENTE DE DIRECTIVES...',
      agent_roles: {
        MELCHIOR: 'MELCHIOR-1 [LA SCIENTIFIQUE]',
        BALTHASAR: 'BALTHASAR-2 [LA MÈRE]',
        CASPER: 'CASPER-3 [LA FEMME]',
      },
      tactical_query_label: 'REQUÊTE',
      tactical_flow_title: 'FLUX DE CONSENSUS',
      tactical_inspect_tag: '[CLIQUER POUR INSPECTER]',
      tactical_roles: {
        MELCHIOR: 'ANALYSE',
        BALTHASAR: 'CRITIQUE',
        CASPER: 'ALTERNATIVE',
      },
      diag_step_r0: 'TOUR 0<br><span>INDÉPENDANT</span>',
      diag_step_gate1: 'TEST 1<br><span>DELTA POSTURE</span>',
      diag_step_r1: 'TOUR 1<br><span>CONTESTATION</span>',
      diag_step_gate2: 'TEST 2<br><span>CONVERGENCE</span>',
      diag_step_r2: 'TOUR 2<br><span>RÉPLIQUE FINALE</span>',
      diag_step_core: 'CORE<br><span>SYNTHÈSE</span>',
    },
    de: {
      ctrl_view: 'ANSICHT:',
      ctrl_lang: 'SPRACHE:',
      ctrl_engine: 'ENGINE:',
      view_anime: 'ANIME MAGI',
      view_tactical: 'TAKTISCH',
      view_diagnostic: 'DIAGNOSE',
      audio_on: 'AUDIO: EIN',
      audio_off: 'AUDIO: AUS',
      query_hide: 'ANFRAGE: VERBERGEN ▲',
      query_show: 'ANFRAGE: ANZEIGEN ▼',
      system_ready: 'SYSTEM BEREIT',
      system_busy: 'BERATUNG LÄUFT...',
      terminal_title: 'ANFRAGE FÜR SUPERCOMPUTER-KONSENS ÜBERMITTELN',
      query_placeholder: 'Geben Sie Ihre Frage ein (z. B. Sollten wir zu Rust migrieren?)',
      presets_label: 'VORLAGEN:',
      preset_1_title: 'Evangelion Gesellschaft?',
      preset_1_query: 'Wie effektiv wäre eine Gesellschaft, die tatsächlich von einem Magi-Supercomputer gesteuert wird?',
      preset_2_title: 'Rust-Umschreibung?',
      preset_2_query: 'Sollten wir unsere Codebasis auf Rust umstellen?',
      preset_3_title: 'Microservices?',
      preset_3_query: 'Sollte unsere Softwareentwicklung auf Microservices migrieren?',
      preset_4_title: 'CI/CD Pipeline?',
      preset_4_query: 'Sollten wir automatisierte Continuous-Delivery-Pipelines (CI/CD) einführen?',
      btn_copy_ascii: 'ASCII KOPIEREN',
      btn_compare: 'VERGLEICH VS EINZEL-GEMINI',
      btn_benchmark: 'BENCHMARK STARTEN',
      btn_deliberate: 'BERATEN [STREAM]',
      btn_deliberating: 'BERATUNG LÄUFT...',
      anime_res_standby: 'STATUS: BEREIT',
      anime_res_deliberating: 'BERATUNG LÄUFT...',
      anime_inspect_hint: '[KLICKEN ZUM PRÜFEN]',
      console_access_code: 'zugangscode:',
      console_question: 'frage:',
      console_placeholder: 'FRAGE EINGEBEN (ENTER ODER EXECUTE KLICKEN)...',
      console_execute_btn: 'AUSFÜHREN [↵]',
      console_busy_btn: 'BESCHÄFTIGT...',
      console_telemetry: 'telemetrie:',
      chat_title: 'MAGI KERN-LOG // CHAT- UND DEBATTENVERLAUF',
      chat_clear_btn: 'LÖSCHEN',
      chat_hide_btn: 'CHAT VERBERGEN ▲',
      chat_show_btn: 'CHAT ANZEIGEN ▼',
      chat_system_bus: '[SYSTEM] MAGI KERN-KOMMUNIKATIONSBUS ONLINE. WARTE AUF OPERATOR-DIREKTIVEN...',
      chat_user_label: '👤 OPERATOR // DIREKTIVE ÜBERMITTELT',
      chat_round_prefix: 'RUNDE',
      chat_critiques_title: '💬 KREUZBEFRAGUNG / PEER-DEBATTE:',
      chat_divergence: (d, r) => `⚡ DIVERGENZ ERKANNT (DELTA ${d}%). STARTE RUNDE ${r} DER PEER-KRITIK.`,
      chat_consensus: (d) => `✓ KONSENS ZWISCHEN KERNEN ERREICHT (DELTA ${d}%). WEITER ZUR FINALSIGNATUR.`,
      chat_synthesis_title: '⚖️ MAGI CORE // FINALE SCHLICHTUNG',
      chat_cleared_msg: '[SYSTEM] SITZUNGSLOG GELÖSCHT. WARTE AUF OPERATOR-DIREKTIVEN...',
      agent_roles: {
        MELCHIOR: 'MELCHIOR-1 [DER WISSENSCHAFTLER]',
        BALTHASAR: 'BALTHASAR-2 [DIE MUTTER]',
        CASPER: 'CASPER-3 [DIE FRAU]',
      },
      tactical_query_label: 'ANFRAGE',
      tactical_flow_title: 'KONSENSFLUSS',
      tactical_inspect_tag: '[KLICKEN ZUR INSPEKTION]',
      tactical_roles: {
        MELCHIOR: 'ANALYSE',
        BALTHASAR: 'KRITIK',
        CASPER: 'ALTERNATIVE',
      },
      diag_step_r0: 'RUNDE 0<br><span>UNABHÄNGIG</span>',
      diag_step_gate1: 'CHECK 1<br><span>HALTUNGSDELTA</span>',
      diag_step_r1: 'RUNDE 1<br><span>PEER-KRITIK</span>',
      diag_step_gate2: 'CHECK 2<br><span>KONVERGENZ</span>',
      diag_step_r2: 'RUNDE 2<br><span>FINALE ERWIDERUNG</span>',
      diag_step_core: 'CORE<br><span>SYNTHESE</span>',
    },
    ru: {
      ctrl_view: 'ВИД:',
      ctrl_lang: 'ЯЗЫК:',
      ctrl_engine: 'ДВИЖОК:',
      view_anime: 'АНИМЕ МАГИ',
      view_tactical: 'ТАКТИЧЕСКИЙ',
      view_diagnostic: 'ДИАГНОСТИКА',
      audio_on: 'ЗВУК: ВКЛ',
      audio_off: 'ЗВУК: ВЫКЛ',
      query_hide: 'ЗАПРОС: СКРЫТЬ ▲',
      query_show: 'ЗАПРОС: ПОКАЗАТЬ ▼',
      system_ready: 'СИСТЕМА ГОТОВА',
      system_busy: 'ОБСУЖДЕНИЕ...',
      terminal_title: 'ОТПРАВИТЬ ЗАПРОС ДЛЯ КОНСЕНСУСА СУПЕРКОМПЬЮТЕРА',
      query_placeholder: 'Введите ваш вопрос (например: Стоит ли переходить на Rust?)',
      presets_label: 'ПРЕСЕТЫ:',
      preset_1_title: 'Общество Евангелиона?',
      preset_1_query: 'Насколько эффективно общество управлялось бы суперкомпьютером МАГИ?',
      preset_2_title: 'Переписать на Rust?',
      preset_2_query: 'Стоит ли переписать наш проект на Rust?',
      preset_3_title: 'Микросервисы?',
      preset_3_query: 'Стоит ли нашей инженерной команде перейти на микросервисы?',
      preset_4_title: 'CI/CD Пайплайн?',
      preset_4_query: 'Следует ли внедрить автоматизированный конвейер непрерывной доставки (CI/CD)?',
      btn_copy_ascii: 'КОПИРОВАТЬ ASCII',
      btn_compare: 'СРАВНИТЬ С GEMINI',
      btn_benchmark: 'ЗАПУСТИТЬ БЕНЧМАРК',
      btn_deliberate: 'ОБСУДИТЬ [STREAM]',
      btn_deliberating: 'ОБСУЖДЕНИЕ...',
      anime_res_standby: 'РЕШЕНИЕ: ОЖИДАНИЕ',
      anime_res_deliberating: 'ОБСУЖДЕНИЕ...',
      anime_inspect_hint: '[НАЖМИТЕ ДЛЯ АНАЛИЗА]',
      console_access_code: 'код доступа:',
      console_question: 'вопрос:',
      console_placeholder: 'ВВЕДИТЕ ВАШ ВОПРОС (ENTER ИЛИ НАЖМИТЕ EXECUTE)...',
      console_execute_btn: 'ВЫПОЛНИТЬ [↵]',
      console_busy_btn: 'ЗАНЯТО...',
      console_telemetry: 'телеметрия:',
      chat_title: 'МАГИ ЖУРНАЛ ЯДЕР // ИСТОРИЯ ЧАТА И ДЕБАТОВ',
      chat_clear_btn: 'ОЧИСТИТЬ',
      chat_hide_btn: 'СКРЫТЬ ЧАТ ▲',
      chat_show_btn: 'ПОКАЗАТЬ ЧАТ ▼',
      chat_system_bus: '[СИСТЕМА] ШИНА СВЯЗИ МЕЖДУ ЯДРАМИ МАГИ В СЕТИ. ОЖИДАНИЕ ДИРЕКТИВЫ ОПЕРАТОРА...',
      chat_user_label: '👤 ОПЕРАТОР // НАПРАВЛЕНА ДИРЕКТИВА',
      chat_round_prefix: 'РАУНД',
      chat_critiques_title: '💬 ПЕРЕКРЕСТНЫЙ АНАЛИЗ / ДЕБАТЫ С ЯДРАМИ:',
      chat_divergence: (d, r) => `⚡ ОБНАРУЖЕНО РАСХОЖДЕНИЕ (ДЕЛЬТА ${d}%). ЗАПУСК РАУНДА ${r} ВЗАИМНОЙ КРИТИКИ.`,
      chat_consensus: (d) => `✓ ДОСТИГНУТ КОНСЕНСУС МЕЖДУ ЯДРАМИ (ДЕЛЬТА ${d}%). ПЕРЕХОД К ФИНАЛЬНОМУ СИНТЕЗУ.`,
      chat_synthesis_title: '⚖️ МАГИ CORE // ФИНАЛЬНЫЙ АРБИТРАЖ',
      chat_cleared_msg: '[СИСТЕМА] ЖУРНАЛ СЕССИИ ОЧИЩЕН. ОЖИДАНИЕ ДИРЕКТИВЫ ОПЕРАТОРА...',
      agent_roles: {
        MELCHIOR: 'МЕЛЬХИОР-1 [УЧЁНЫЙ]',
        BALTHASAR: 'БАЛЬТАЗАР-2 [МАТЬ]',
        CASPER: 'КАСПАР-3 [ЖЕНЩИНА]',
      },
      tactical_query_label: 'ЗАПРОС',
      tactical_flow_title: 'ПОТОК КОНСЕНСУСА',
      tactical_inspect_tag: '[НАЖМИТЕ ДЛЯ АНАЛИЗА]',
      tactical_roles: {
        MELCHIOR: 'АНАЛИЗ',
        BALTHASAR: 'КРИТИКА',
        CASPER: 'АЛЬТЕРНАТИВА',
      },
      diag_step_r0: 'РАУНД 0<br><span>НЕЗАВИСИМЫЙ</span>',
      diag_step_gate1: 'ПРОВЕРКА 1<br><span>ДЕЛЬТА ПОЗИЦИЙ</span>',
      diag_step_r1: 'РАУНД 1<br><span>КРИТИКА ПАРТНЕРОВ</span>',
      diag_step_gate2: 'ПРОВЕРКА 2<br><span>СХОДИМОСТЬ</span>',
      diag_step_r2: 'РАУНД 2<br><span>ИТОГОВАЯ ОТПОВЕДЬ</span>',
      diag_step_core: 'CORE<br><span>СИНТЕЗ</span>',
    },
    ja: {
      ctrl_view: '表示:',
      ctrl_lang: '言語:',
      ctrl_engine: 'エンジン:',
      view_anime: 'アニメ MAGI',
      view_tactical: 'タクティカル',
      view_diagnostic: '診断 HUD',
      audio_on: '音声: 有効',
      audio_off: '音声: 無効',
      query_hide: '質問欄: 非表示 ▲',
      query_show: '質問欄: 表示 ▼',
      system_ready: 'システム準備完了',
      system_busy: '審議中...',
      terminal_title: 'スーパーコンピュータ合意審議用クエリ送信',
      query_placeholder: '質問を入力してください (例: Rustへの移行を行うべきか？)',
      presets_label: 'プリセット:',
      preset_1_title: 'エヴァンゲリオン社会?',
      preset_1_query: 'MAGIスーパーコンピュータが管理する社会は実際にどれほど効果的か？',
      preset_2_title: 'Rustへの移行?',
      preset_2_query: 'システムをRustで書き直すべきか？',
      preset_3_title: 'マイクロサービス化?',
      preset_3_query: '開発組織はマイクロサービスアーキテクチャに移行すべきか？',
      preset_4_title: 'CI/CDパイプライン?',
      preset_4_query: '自動CI/CDデリバリーパイプラインを導入すべきか？',
      btn_copy_ascii: 'ASCIIをコピー',
      btn_compare: '単一GEMINIと比較',
      btn_benchmark: 'ベンチマーク実行',
      btn_deliberate: '審議開始 [STREAM]',
      btn_deliberating: '審議中...',
      anime_res_standby: '決議: 待機中',
      anime_res_deliberating: '審議中...',
      anime_inspect_hint: '[クリックして監査]',
      console_access_code: 'アクセスコード:',
      console_question: '質問内容:',
      console_placeholder: '質問を入力してください (EnterキーまたはEXECUTEをクリック)...',
      console_execute_btn: '実行 [↵]',
      console_busy_btn: '処理中...',
      console_telemetry: 'テレメトリ:',
      chat_title: 'MAGI コア間通信ログ // ディベート履歴',
      chat_clear_btn: 'クリア',
      chat_hide_btn: 'チャット非表示 ▲',
      chat_show_btn: 'チャット表示 ▼',
      chat_system_bus: '[システム] MAGI コア間通信バス オンライン。オペレーター指令待機中...',
      chat_user_label: '👤 オペレーター // 指令送信',
      chat_round_prefix: 'ラウンド',
      chat_critiques_title: '💬 相互検証 / コア間反論ディベート:',
      chat_divergence: (d, r) => `⚡ 見解の相違を検出 (差分 ${d}%)。第${r}ラウンド相互批評を開始。`,
      chat_consensus: (d) => `✓ 各コア間で合意に達しました (差分 ${d}%)。最終統合審議へ移行。`,
      chat_synthesis_title: '⚖️ MAGI CORE // 最終裁定',
      chat_cleared_msg: '[システム] セッション履歴をクリアしました。オペレーター指令待機中...',
      agent_roles: {
        MELCHIOR: 'MELCHIOR-1 [科学者]',
        BALTHASAR: 'BALTHASAR-2 [母]',
        CASPER: 'CASPER-3 [女]',
      },
      tactical_query_label: 'クエリ',
      tactical_flow_title: '合意形成フロー',
      tactical_inspect_tag: '[クリックして詳細]',
      tactical_roles: {
        MELCHIOR: '分析・論理',
        BALTHASAR: '批評・防御',
        CASPER: '現実解・代替',
      },
      diag_step_r0: '第0ラウンド<br><span>独立分析</span>',
      diag_step_gate1: '検証1<br><span>見解差分</span>',
      diag_step_r1: '第1ラウンド<br><span>相互批評</span>',
      diag_step_gate2: '検証2<br><span>収束確認</span>',
      diag_step_r2: '第2ラウンド<br><span>最終反論</span>',
      diag_step_core: 'CORE<br><span>最終統合</span>',
    },
  };

  function applyLanguage(lang) {
    const t = I18N[lang] || I18N.en;
    currentLang = lang;
    if (langSelect && langSelect.value !== lang) {
      langSelect.value = lang;
    }

    // Header controls
    const lblCtrlLang = document.getElementById('lbl-ctrl-lang');
    if (lblCtrlLang) lblCtrlLang.textContent = t.ctrl_lang;
    const lblCtrlEngine = document.getElementById('lbl-ctrl-engine');
    if (lblCtrlEngine) lblCtrlEngine.textContent = t.ctrl_engine;

    // View toggle buttons
    if (btnViewAnime) btnViewAnime.textContent = t.view_anime;
    if (btnViewTactical) btnViewTactical.textContent = t.view_tactical;
    if (btnViewDiagnostic) btnViewDiagnostic.textContent = t.view_diagnostic;

    // Query section
    const lblTerminalTitle = document.getElementById('lbl-terminal-title');
    if (lblTerminalTitle) lblTerminalTitle.textContent = t.terminal_title;
    if (queryInput) queryInput.placeholder = t.query_placeholder;
    const lblPresets = document.getElementById('lbl-presets');
    if (lblPresets) lblPresets.textContent = t.presets_label;

    // Presets
    const p1 = document.getElementById('preset-btn-1');
    if (p1) { p1.textContent = t.preset_1_title; p1.setAttribute('data-query', t.preset_1_query); }
    const p2 = document.getElementById('preset-btn-2');
    if (p2) { p2.textContent = t.preset_2_title; p2.setAttribute('data-query', t.preset_2_query); }
    const p3 = document.getElementById('preset-btn-3');
    if (p3) { p3.textContent = t.preset_3_title; p3.setAttribute('data-query', t.preset_3_query); }
    const p4 = document.getElementById('preset-btn-4');
    if (p4) { p4.textContent = t.preset_4_title; p4.setAttribute('data-query', t.preset_4_query); }

    // Action buttons
    if (copyAsciiBtn) copyAsciiBtn.textContent = t.btn_copy_ascii;
    if (compareBtn) compareBtn.textContent = t.btn_compare;
    if (benchmarkBtn) benchmarkBtn.textContent = t.btn_benchmark;
    if (submitBtn && !submitBtn.disabled) submitBtn.innerHTML = `<span class="btn-text">${t.btn_deliberate}</span>`;

    // Anime Monitor & Console
    if (animeResolutionLabel && (animeResolutionLabel.textContent.includes('STANDBY') || animeResolutionLabel.textContent.includes('ESPERA') || animeResolutionLabel.textContent.includes('AGUARDANDO') || animeResolutionLabel.textContent.includes('BEREIT') || animeResolutionLabel.textContent.includes('ОЖИДАНИЕ') || animeResolutionLabel.textContent.includes('待機'))) {
      animeResolutionLabel.textContent = t.anime_res_standby;
    }
    const lblAccess = document.getElementById('lbl-access-code');
    if (lblAccess) lblAccess.textContent = t.console_access_code;
    const lblQuestion = document.getElementById('lbl-question');
    if (lblQuestion) lblQuestion.textContent = t.console_question;
    const lblTelemetry = document.getElementById('lbl-telemetry');
    if (lblTelemetry) lblTelemetry.textContent = t.console_telemetry;
    if (animeConsoleInput) animeConsoleInput.placeholder = t.console_placeholder;
    if (animeConsoleSubmitBtn && !animeConsoleSubmitBtn.disabled) {
      animeConsoleSubmitBtn.textContent = t.console_execute_btn;
    }

    // Anime Chat
    const lblChatTitle = document.getElementById('lbl-chat-title');
    if (lblChatTitle) lblChatTitle.textContent = t.chat_title;
    if (animeChatClearBtn) animeChatClearBtn.textContent = t.chat_clear_btn;
    if (animeChatToggleBtn) {
      const isCollapsed = animeChatWrapper?.classList.contains('collapsed');
      animeChatToggleBtn.textContent = isCollapsed ? t.chat_show_btn : t.chat_hide_btn;
    }
    const sysMsg = document.getElementById('anime-chat-system-msg');
    if (sysMsg && chatMessageCount === 0) {
      sysMsg.innerHTML = `<span class="system-bracket">[SYSTEM]</span> ${t.chat_system_bus}`;
    }

    // Tactical labels
    const tQueryLbl = document.querySelector('.tactical-query-label');
    if (tQueryLbl) tQueryLbl.textContent = t.tactical_query_label;
    const tFlowTitle = document.querySelector('.tactical-flow-title');
    if (tFlowTitle) tFlowTitle.textContent = t.tactical_flow_title;
    const tInspectTags = document.querySelectorAll('.tactical-inspect-tag');
    tInspectTags.forEach(el => el.textContent = t.tactical_inspect_tag);
    const tAnimeInspectHints = document.querySelectorAll('.anime-inspect-hint');
    tAnimeInspectHints.forEach(el => el.textContent = t.anime_inspect_hint);

    // Tactical Roles
    const tCardMelchiorRole = document.querySelector('#tactical-card-melchior .tactical-card-role');
    if (tCardMelchiorRole) tCardMelchiorRole.textContent = t.tactical_roles.MELCHIOR;
    const tCardBalthasarRole = document.querySelector('#tactical-card-balthasar .tactical-card-role');
    if (tCardBalthasarRole) tCardBalthasarRole.textContent = t.tactical_roles.BALTHASAR;
    const tCardCasperRole = document.querySelector('#tactical-card-casper .tactical-card-role');
    if (tCardCasperRole) tCardCasperRole.textContent = t.tactical_roles.CASPER;

    // Stepper track
    const sR0 = document.querySelector('#step-r0 .step-desc');
    if (sR0) sR0.innerHTML = t.diag_step_r0;
    const sGate1 = document.querySelector('#step-gate1 .step-desc');
    if (sGate1) sGate1.innerHTML = t.diag_step_gate1;
    const sR1 = document.querySelector('#step-r1 .step-desc');
    if (sR1) sR1.innerHTML = t.diag_step_r1;
    const sGate2 = document.querySelector('#step-gate2 .step-desc');
    if (sGate2) sGate2.innerHTML = t.diag_step_gate2;
    const sR2 = document.querySelector('#step-r2 .step-desc');
    if (sR2) sR2.innerHTML = t.diag_step_r2;
    const sCore = document.querySelector('#step-core .step-desc');
    if (sCore) sCore.innerHTML = t.diag_step_core;

    updateAudioButtonUI();
  }

  langSelect?.addEventListener('change', () => {
    const newLang = langSelect.value || 'en';
    localStorage.setItem('magi_language', newLang);
    applyLanguage(newLang);
    playBeep(480, 0.04, 'triangle');
  });

  // Apply saved or default language (en) on boot
  applyLanguage(currentLang);

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
    const t = I18N[currentLang] || I18N.en;
    if (audioToggleBtn) {
      audioToggleBtn.textContent = audioEnabled ? t.audio_on : t.audio_off;
      if (audioEnabled) audioToggleBtn.classList.add('active');
      else audioToggleBtn.classList.remove('active');
    }
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
    const t = I18N[currentLang] || I18N.en;
    if (collapsed) {
      querySection.classList.add('collapsed');
      queryToggleBtn.classList.add('minimized');
      queryToggleBtn.textContent = t.query_show;
      localStorage.setItem('magi_query_collapsed', 'true');
    } else {
      querySection.classList.remove('collapsed');
      queryToggleBtn.classList.remove('minimized');
      queryToggleBtn.textContent = t.query_hide;
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
    const t = I18N[currentLang] || I18N.en;
    appendChatMessage(`
      <div class="chat-entry chat-user">
        <div class="chat-entry-header">
          <div class="chat-sender-info">
            <span>${t.chat_user_label}</span>
          </div>
          <span class="chat-time">[${time}]</span>
        </div>
        <div class="chat-user-text">&gt;&gt;&gt; ${escapeHtml(query)}</div>
      </div>
    `);
  }

  function addChatAgentMessage(agentId, roundNumber, output) {
    const time = formatTimeNow();
    const t = I18N[currentLang] || I18N.en;
    const roleName = t.agent_roles[agentId.toUpperCase()] || agentId;
    const agentClass = `chat-${agentId.toLowerCase()}`;
    const stance = output.stance || 'CONDITIONAL';
    const confPct = Math.round((output.confidence || 0.8) * 100);

    let critiquesHtml = '';
    if (Array.isArray(output.critiquesOfPeers) && output.critiquesOfPeers.length > 0) {
      const items = output.critiquesOfPeers.map(c => `
        <div class="chat-critique-item">
          ↳ <span class="chat-critique-target">vs ${escapeHtml(c.targetAgent || 'PEER')}:</span> ${escapeHtml(c.rebuttal || (Array.isArray(c.pointsOfDisagreement) && c.pointsOfDisagreement.length ? c.pointsOfDisagreement.join('; ') : '') || c.critique || '')}
        </div>
      `).join('');
      critiquesHtml = `
        <div class="chat-critiques-box">
          <div class="chat-critiques-title">${t.chat_critiques_title}</div>
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
          <span class="chat-time">${t.chat_round_prefix} ${roundNumber} • [${time}]</span>
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
    const t = I18N[currentLang] || I18N.en;
    const decision = result.finalDecision || 'CONSENSUS_REACHED';
    const tokens = result.totalTokensUsed || 0;
    const cost = (result.estimatedCostUsd || 0).toFixed(4);
    const duration = result.metadata?.durationMs ? (result.metadata.durationMs / 1000).toFixed(1) : '--';

    appendChatMessage(`
      <div class="chat-entry chat-synthesis">
        <div class="chat-entry-header">
          <div class="chat-sender-info">
            <span>${t.chat_synthesis_title}</span>
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

  // Auto-resize for anime console textarea to expand downwards
  function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.max(38, Math.min(el.scrollHeight, 240));
    el.style.height = newHeight + 'px';
  }

  // Initial resize
  autoResizeTextarea(animeConsoleInput);

  queryInput?.addEventListener('input', () => {
    syncQueryDisplay(queryInput.value, 'main');
  });

  animeConsoleInput?.addEventListener('input', () => {
    autoResizeTextarea(animeConsoleInput);
    syncQueryDisplay(animeConsoleInput.value, 'anime');
  });

  // Enter to submit query, Shift+Enter for new line
  animeConsoleInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (animeQuestionForm.requestSubmit) {
        animeQuestionForm.requestSubmit();
      } else {
        animeQuestionForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  });

  function syncQueryDisplay(q, source = null) {
    const text = q.trim() || 'Awaiting query...';
    if (tacticalQueryDisplay) tacticalQueryDisplay.textContent = text;
    if (animeConsoleInput && source !== 'anime') {
      animeConsoleInput.value = q;
      autoResizeTextarea(animeConsoleInput);
    }
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
  // Fullscreen Management (HUD & Anime Monitor)
  // -------------------------------------------------------------
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
      playBeep(660, 0.05, 'sine');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      playBeep(440, 0.05, 'sine');
    }
  }

  function updateFullscreenUI() {
    const isFs = !!document.fullscreenElement;
    document.body.classList.toggle('is-fullscreen', isFs);
    if (fullscreenBtn) {
      fullscreenBtn.innerHTML = isFs ? 'EXIT FULLSCREEN ✕' : 'FULLSCREEN ⛶';
      fullscreenBtn.classList.toggle('active', isFs);
    }
    if (animeMonitorFsBtn) {
      animeMonitorFsBtn.innerHTML = isFs ? '✕ MINIMIZE' : '⛶ FULLSCREEN';
    }
  }

  fullscreenBtn?.addEventListener('click', toggleFullscreen);
  animeMonitorFsBtn?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

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
        const rawDelta = report.metrics?.maxConfidenceDelta ?? report.maxConfidenceDelta ?? 0;
        const deltaPct = isNaN(rawDelta) ? 0 : Math.round(rawDelta * 100);
        const t = I18N[currentLang] || I18N.en;
        timelineStatusMsg.textContent = `DIVERGENCE DETECTED (STANCE DELTA: ${deltaPct}%) -> ADVANCING TO PEER CRITIQUE`;
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = `DIVERGENCE (Δ ${deltaPct}%)`;
        addChatGateNotice('disagreement', t.chat_divergence(deltaPct, roundNumber + 1));
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
        const rawDelta = report.metrics?.maxConfidenceDelta ?? report.maxConfidenceDelta ?? 0;
        const deltaPct = isNaN(rawDelta) ? 0 : Math.round(rawDelta * 100);
        const t = I18N[currentLang] || I18N.en;
        timelineStatusMsg.textContent = `CONSENSUS REACHED (STANCE DELTA: ${deltaPct}%) -> ADVANCING TO SYNTHESIS`;
        if (tacticalFlowStatus) tacticalFlowStatus.textContent = 'CONSENSUS ACHIEVED';
        addChatGateNotice('consensus', t.chat_consensus(deltaPct));
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
    if (animeCrtMonitor) animeCrtMonitor.classList.remove('emergency-alarm');

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
    if (animeCrtMonitor) animeCrtMonitor.classList.remove('emergency-alarm');

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
    if (animeConsoleInput) animeConsoleInput.value = question;
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
      if (animeCrtMonitor) animeCrtMonitor.classList.add('emergency-alarm');
      if (animeConsensusStamp) {
        animeConsensusStamp.className = 'anime-stamp-box stamp-rejected';
        if (animeStampText) animeStampText.textContent = '否 決';
      }
      if (animeResolutionLabel) animeResolutionLabel.textContent = 'SECURITY LOCK: IMPASSE / REJECTED';
      playImpasseAlarm();
    } else {
      if (animeCrtMonitor) animeCrtMonitor.classList.remove('emergency-alarm');
      if (approveCount === 3) {
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
