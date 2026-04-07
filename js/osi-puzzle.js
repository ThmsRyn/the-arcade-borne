/**
 * osi-puzzle.js — OSI Puzzle game logic
 *
 * Puzzle types:
 *   osi        — 7 OSI layers
 *   tcpip      — 4 TCP/IP layers
 *   handshake  — TCP handshake steps (3 easy / 7 medium / 10 hard)
 *   dhcp       — 4 DHCP DORA steps
 *   encap      — 5 packet encapsulation layers
 *
 * Difficulty behaviour:
 *   easy   — phase 1 only (noms des couches), chrono qui compte, pas de limite
 *   medium — phase 1 noms → phase 2 protocoles, chrono qui compte, pas de limite
 *            (handshake/dhcp : une seule phase, temps imparti 60s)
 *   hard   — phase 1 noms 20s → phase 2 protocoles 30s
 *            (handshake/dhcp : une seule phase, temps imparti 20s)
 *
 * Slots : toujours dans l'ordre fixe (7→1 pour OSI, 1→N pour les autres)
 * Pièces : toujours mélangées
 */

// ============================================================
// PUZZLE DATA
// ============================================================

const OSI_LAYERS = [
  { num: 7, key: 'layer_7', proto: ['HTTP', 'FTP', 'DNS'] },
  { num: 6, key: 'layer_6', proto: ['SSL/TLS', 'JPEG'] },
  { num: 5, key: 'layer_5', proto: ['NetBIOS', 'RPC'] },
  { num: 4, key: 'layer_4', proto: ['TCP', 'UDP'] },
  { num: 3, key: 'layer_3', proto: ['IP', 'ICMP'] },
  { num: 2, key: 'layer_2', proto: ['Ethernet', 'MAC'] },
  { num: 1, key: 'layer_1', proto: ['Cable', 'Fibre'] }
];

const TCPIP_LAYERS = [
  { num: 1, label_fr: 'APPLICATION',  label_en: 'APPLICATION',   proto: ['HTTP', 'FTP', 'DNS', 'SMTP'] },
  { num: 2, label_fr: 'TRANSPORT',    label_en: 'TRANSPORT',     proto: ['TCP', 'UDP'] },
  { num: 3, label_fr: 'INTERNET',     label_en: 'INTERNET',      proto: ['IP', 'ICMP', 'ARP'] },
  { num: 4, label_fr: 'ACCES RESEAU', label_en: 'NETWORK ACCESS', proto: ['Ethernet', 'WiFi', 'MAC'] }
];

const HANDSHAKE_STEPS = {
  easy: [
    { num: 1, short: 'SYN',     full_fr: 'SYN — Client vers Serveur',      full_en: 'SYN — Client to Server' },
    { num: 2, short: 'SYN-ACK', full_fr: 'SYN-ACK — Serveur vers Client',  full_en: 'SYN-ACK — Server to Client' },
    { num: 3, short: 'ACK',     full_fr: 'ACK — Client vers Serveur',      full_en: 'ACK — Client to Server' }
  ],
  medium: [
    { num: 1, short: 'SYN',     full_fr: 'SYN — Client vers Serveur',      full_en: 'SYN — Client to Server' },
    { num: 2, short: 'SYN-ACK', full_fr: 'SYN-ACK — Serveur vers Client',  full_en: 'SYN-ACK — Server to Client' },
    { num: 3, short: 'ACK',     full_fr: 'ACK — Client vers Serveur',      full_en: 'ACK — Client to Server' },
    { num: 4, short: 'DATA',    full_fr: 'DATA — Client vers Serveur',     full_en: 'DATA — Client to Server' },
    { num: 5, short: 'ACK',     full_fr: 'ACK — Serveur vers Client',      full_en: 'ACK — Server to Client' },
    { num: 6, short: 'FIN',     full_fr: 'FIN — Client vers Serveur',      full_en: 'FIN — Client to Server' },
    { num: 7, short: 'FIN-ACK', full_fr: 'FIN-ACK — Serveur vers Client',  full_en: 'FIN-ACK — Server to Client' }
  ],
  hard: [
    { num: 1,  short: 'SYN',     full_fr: 'SYN — Client vers Serveur',     full_en: 'SYN — Client to Server' },
    { num: 2,  short: 'SYN-ACK', full_fr: 'SYN-ACK — Serveur vers Client', full_en: 'SYN-ACK — Server to Client' },
    { num: 3,  short: 'ACK',     full_fr: 'ACK — Client vers Serveur',     full_en: 'ACK — Client to Server' },
    { num: 4,  short: 'DATA',    full_fr: 'DATA — Client vers Serveur',    full_en: 'DATA — Client to Server' },
    { num: 5,  short: 'ACK',     full_fr: 'ACK — Serveur vers Client',     full_en: 'ACK — Server to Client' },
    { num: 6,  short: 'DATA',    full_fr: 'DATA — Serveur vers Client',    full_en: 'DATA — Server to Client' },
    { num: 7,  short: 'ACK',     full_fr: 'ACK — Client vers Serveur',     full_en: 'ACK — Client to Server' },
    { num: 8,  short: 'FIN',     full_fr: 'FIN — Client vers Serveur',     full_en: 'FIN — Client to Server' },
    { num: 9,  short: 'FIN-ACK', full_fr: 'FIN-ACK — Serveur vers Client', full_en: 'FIN-ACK — Server to Client' },
    { num: 10, short: 'ACK',     full_fr: 'ACK — Client vers Serveur',     full_en: 'ACK — Client to Server' }
  ]
};

const DHCP_STEPS = [
  { num: 1, letter: 'D', full_fr: 'DISCOVER — Client (broadcast)',            full_en: 'DISCOVER — Client (broadcast)' },
  { num: 2, letter: 'O', full_fr: 'OFFER — Serveur (unicast/broadcast)',      full_en: 'OFFER — Server (unicast/broadcast)' },
  { num: 3, letter: 'R', full_fr: 'REQUEST — Client (broadcast)',             full_en: 'REQUEST — Client (broadcast)' },
  { num: 4, letter: 'A', full_fr: 'ACKNOWLEDGE — Serveur (unicast/broadcast)', full_en: 'ACKNOWLEDGE — Server (unicast/broadcast)' }
];

const ENCAP_LAYERS = [
  { num: 1, label_fr: 'DONNEES',        label_en: 'DATA',            proto: ['Payload'] },
  { num: 2, label_fr: 'EN-TETE SEGMENT', label_en: 'SEGMENT HEADER', proto: ['TCP', 'UDP'] },
  { num: 3, label_fr: 'EN-TETE PAQUET', label_en: 'PACKET HEADER',  proto: ['IP'] },
  { num: 4, label_fr: 'EN-TETE TRAME',  label_en: 'FRAME HEADER',   proto: ['Ethernet'] },
  { num: 5, label_fr: 'BITS PHYSIQUES', label_en: 'PHYSICAL BITS',  proto: ['Signal'] }
];

// Types that have no protocol phase — use single-phase timed mode for medium/hard
const NO_PROTO_TYPES = ['handshake', 'dhcp'];

// ============================================================
// GAME STATE
// ============================================================

let osiState = {
  puzzleType:   null,
  difficulty:   null,
  phase:        1,      // 1 = noms des couches, 2 = protocoles
  items:        [],
  slotOrder:    [],
  placedSlots:  {},
  errors:       0,
  phase1Score:  0,
  startTime:    null,
  timerInterval: null,
  timerLimit:   null,
  finished:     false,
  selectedPiece: null
};

// ============================================================
// HELPERS — types with no protocol phase
// ============================================================

function hasProtoPhase(type) {
  return !NO_PROTO_TYPES.includes(type);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-puzzle-type]').forEach(btn => {
    btn.addEventListener('click', () => selectPuzzleType(btn.dataset.puzzleType));
  });

  const backBtn = document.getElementById('back-to-type-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('difficulty-screen').style.display = 'none';
      document.getElementById('type-screen').style.display = 'block';
    });
  }

  const htpToggle = document.getElementById('htp-toggle');
  if (htpToggle) {
    htpToggle.addEventListener('click', () => {
      const content = document.getElementById('htp-content');
      const arrow   = document.getElementById('htp-arrow');
      const expanded = htpToggle.getAttribute('aria-expanded') === 'true';
      htpToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      content.style.display = expanded ? 'none' : 'block';
      arrow.innerHTML = expanded ? '&#x25BA;' : '&#x25BC;';
    });
  }

  const postSavePlayAgain = document.getElementById('post-save-play-again-btn');
  if (postSavePlayAgain) {
    postSavePlayAgain.addEventListener('click', () => {
      document.getElementById('post-save-screen').style.display = 'none';
      document.getElementById('type-screen').style.display = 'block';
    });
  }

  document.addEventListener('langChange', () => {
    if (osiState.difficulty && !osiState.finished) {
      renderSlots();
      renderPieces();
    }
  });
});

// ============================================================
// PUZZLE TYPE SELECTION
// ============================================================

function selectPuzzleType(type) {
  osiState.puzzleType = type;

  const htpTextEl = document.getElementById('htp-text');
  if (htpTextEl) htpTextEl.textContent = i18n.t('htp_' + type);

  buildDifficultyButtons(type);

  document.getElementById('type-screen').style.display = 'none';
  document.getElementById('difficulty-screen').style.display = 'block';

  const htpContent = document.getElementById('htp-content');
  const htpToggle  = document.getElementById('htp-toggle');
  const htpArrow   = document.getElementById('htp-arrow');
  if (htpContent) htpContent.style.display = 'block';
  if (htpToggle)  htpToggle.setAttribute('aria-expanded', 'true');
  if (htpArrow)   htpArrow.innerHTML = '&#x25BC;';
}

function buildDifficultyButtons(type) {
  const container = document.getElementById('difficulty-buttons-container');
  if (!container) return;
  container.innerHTML = '';

  const subtitles = getDifficultySubtitles(type);
  const diffs = [
    { key: 'easy',   cls: 'btn--easy',   i18n: 'easy' },
    { key: 'medium', cls: 'btn--medium', i18n: 'medium' },
    { key: 'hard',   cls: 'btn--hard',   i18n: 'hard' }
  ];

  diffs.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + d.cls + ' btn--large';
    btn.dataset.difficulty = d.key;
    btn.innerHTML = `<span data-i18n="${d.i18n}">${i18n.t(d.i18n)}</span><br>
      <small style="font-size:0.32rem; opacity:0.7;">${subtitles[d.key]}</small>`;
    btn.addEventListener('click', () => startGame(d.key));
    container.appendChild(btn);
  });
}

function getDifficultySubtitles(type) {
  const lang = i18n.getLang();
  const fr = lang === 'fr';
  const noProto = !hasProtoPhase(type);

  if (type === 'osi') return {
    easy:   fr ? 'NOMS + CHRONO'                     : 'NAMES + STOPWATCH',
    medium: fr ? 'NOMS → PROTOCOLES + CHRONO'        : 'NAMES → PROTOCOLS + STOPWATCH',
    hard:   fr ? 'NOMS 20s → PROTOCOLES 30s'         : 'NAMES 20s → PROTOCOLS 30s'
  };
  if (type === 'tcpip') return {
    easy:   fr ? 'NOMS + CHRONO'                     : 'NAMES + STOPWATCH',
    medium: fr ? 'NOMS → PROTOCOLES + CHRONO'        : 'NAMES → PROTOCOLS + STOPWATCH',
    hard:   fr ? 'NOMS 20s → PROTOCOLES 30s'         : 'NAMES 20s → PROTOCOLS 30s'
  };
  if (type === 'handshake') return {
    easy:   '3 ETAPES + CHRONO',
    medium: fr ? '7 ETAPES + 60s'                    : '7 STEPS + 60s',
    hard:   fr ? '10 ETAPES + 20s'                   : '10 STEPS + 20s'
  };
  if (type === 'dhcp') return {
    easy:   fr ? 'NOMS + CHRONO'                     : 'NAMES + STOPWATCH',
    medium: fr ? 'NOMS + 60s'                        : 'NAMES + 60s',
    hard:   fr ? 'NOMS + 20s'                        : 'NAMES + 20s'
  };
  if (type === 'encap') return {
    easy:   fr ? 'NOMS + CHRONO'                     : 'NAMES + STOPWATCH',
    medium: fr ? 'NOMS → PROTOCOLES + CHRONO'        : 'NAMES → PROTOCOLS + STOPWATCH',
    hard:   fr ? 'NOMS 20s → PROTOCOLES 30s'         : 'NAMES 20s → PROTOCOLS 30s'
  };
  return { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
}

// ============================================================
// GAME START
// ============================================================

function startGame(difficulty) {
  const type  = osiState.puzzleType;
  const items = buildItemsForType(type, difficulty, 1);

  const slotOrder = type === 'osi'
    ? [7, 6, 5, 4, 3, 2, 1]
    : items.map(item => item.num);

  // Timer logic:
  // easy        → no limit (stopwatch)
  // medium      → no limit unless no-proto type (60s)
  // hard        → 20s phase 1 (or 20s single phase for no-proto)
  let timerLimit = null;
  if (difficulty === 'medium' && !hasProtoPhase(type)) timerLimit = 60;
  if (difficulty === 'hard')                            timerLimit = 20;

  osiState = {
    puzzleType:    type,
    difficulty,
    phase:         1,
    items,
    slotOrder,
    placedSlots:   {},
    errors:        0,
    phase1Score:   0,
    startTime:     Date.now(),
    timerInterval: null,
    timerLimit,
    finished:      false,
    selectedPiece: null
  };

  const slotsTitle = document.getElementById('osi-slots-title');
  if (slotsTitle) slotsTitle.textContent = getSlotColumnTitle(type);

  const phaseEl = document.getElementById('osi-phase-label');
  if (phaseEl) phaseEl.textContent = getPhaseLabel(1);

  document.getElementById('difficulty-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('result-screen').style.display = 'none';

  renderSlots();
  renderPieces();
  startTimer();
}

function getSlotColumnTitle(type) {
  const titles = {
    osi:       i18n.t('osi_slots_title'),
    tcpip:     i18n.t('osi_type_tcpip'),
    handshake: i18n.t('osi_type_handshake'),
    dhcp:      i18n.t('osi_type_dhcp'),
    encap:     i18n.t('osi_type_encap')
  };
  return titles[type] || 'MODEL';
}

function getPhaseLabel(phase) {
  const lang = i18n.getLang();
  if (phase === 1) return lang === 'fr' ? 'PHASE 1 — NOMS' : 'PHASE 1 — NAMES';
  return lang === 'fr' ? 'PHASE 2 — PROTOCOLES' : 'PHASE 2 — PROTOCOLS';
}

// ============================================================
// BUILD ITEMS
// ============================================================

// phase 1 = noms des couches/etapes, phase 2 = protocoles representatifs
function buildItemsForType(type, difficulty, phase) {
  if (type === 'osi') {
    if (phase === 1) {
      return OSI_LAYERS.map(l => ({
        num:   l.num,
        label: () => i18n.t(l.key),
        piece: () => i18n.t(l.key)
      }));
    }
    // Phase 2 : un protocole représentatif par couche
    return OSI_LAYERS.map(l => ({
      num:   l.num,
      label: () => i18n.t(l.key),
      piece: () => l.proto[0]
    }));
  }

  if (type === 'tcpip') {
    if (phase === 1) {
      return TCPIP_LAYERS.map(l => ({
        num:   l.num,
        label: () => i18n.getLang() === 'fr' ? l.label_fr : l.label_en,
        piece: () => i18n.getLang() === 'fr' ? l.label_fr : l.label_en
      }));
    }
    return TCPIP_LAYERS.map(l => ({
      num:   l.num,
      label: () => i18n.getLang() === 'fr' ? l.label_fr : l.label_en,
      piece: () => l.proto[0]
    }));
  }

  if (type === 'handshake') {
    const steps = HANDSHAKE_STEPS[difficulty] || HANDSHAKE_STEPS.easy;
    return steps.map(s => ({
      num:   s.num,
      label: () => i18n.getLang() === 'fr' ? s.full_fr : s.full_en,
      piece: () => s.short
    }));
  }

  if (type === 'dhcp') {
    return DHCP_STEPS.map(s => ({
      num:   s.num,
      label: () => i18n.getLang() === 'fr' ? s.full_fr : s.full_en,
      piece: () => s.letter
    }));
  }

  if (type === 'encap') {
    if (phase === 1) {
      return ENCAP_LAYERS.map(l => ({
        num:   l.num,
        label: () => i18n.getLang() === 'fr' ? l.label_fr : l.label_en,
        piece: () => i18n.getLang() === 'fr' ? l.label_fr : l.label_en
      }));
    }
    return ENCAP_LAYERS.map(l => ({
      num:   l.num,
      label: () => i18n.getLang() === 'fr' ? l.label_fr : l.label_en,
      piece: () => l.proto[0]
    }));
  }

  return [];
}

// ============================================================
// RENDER — SLOTS
// ============================================================

function renderSlots() {
  const container = document.getElementById('osi-slots');
  container.innerHTML = '';

  osiState.slotOrder.forEach(num => {
    const slot = document.createElement('div');
    slot.className = 'osi-slot';
    slot.dataset.slotNum = num;
    slot.setAttribute('aria-label', `Slot ${num}`);
    slot.setAttribute('aria-dropeffect', 'move');

    // Slots : toujours numéro seul — la difficulté est dans les pièces et le timer
    slot.innerHTML = `<span class="osi-slot__num">${num}</span>`;

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const itemNum = parseInt(e.dataTransfer.getData('text/plain'), 10);
      handlePlace(num, itemNum, slot);
    });
    slot.addEventListener('click', () => {
      if (osiState.selectedPiece !== null && !osiState.placedSlots[num]) {
        handlePlace(num, osiState.selectedPiece, slot);
        osiState.selectedPiece = null;
        clearPieceSelection();
      }
    });

    container.appendChild(slot);
  });

  // Restaurer les pièces déjà placées si re-render
  Object.entries(osiState.placedSlots).forEach(([slotNum, itemNum]) => {
    const slotEl = container.querySelector(`[data-slot-num="${slotNum}"]`);
    if (slotEl) markSlotFilled(slotEl, parseInt(slotNum, 10), itemNum);
  });
}

// ============================================================
// RENDER — PIECES
// ============================================================

function renderPieces() {
  const container = document.getElementById('osi-pieces');
  container.innerHTML = '';

  const shuffled = shuffleArray([...osiState.items]);

  shuffled.forEach(item => {
    if (Object.values(osiState.placedSlots).includes(item.num)) return;

    const piece = document.createElement('div');
    piece.className = 'osi-piece osi-piece--tappable';
    piece.dataset.itemNum = item.num;
    piece.setAttribute('draggable', 'true');
    piece.setAttribute('role', 'button');
    piece.setAttribute('tabindex', '0');
    piece.setAttribute('aria-grabbed', 'false');

    // Phase 1 : nom de la couche / étape
    // Phase 2 : protocole représentatif
    piece.innerHTML = `<strong>${item.piece()}</strong>`;

    piece.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.num);
      e.dataTransfer.effectAllowed = 'move';
      piece.classList.add('dragging');
      piece.setAttribute('aria-grabbed', 'true');
    });
    piece.addEventListener('dragend', () => {
      piece.classList.remove('dragging');
      piece.setAttribute('aria-grabbed', 'false');
    });
    piece.addEventListener('click', () => {
      if (osiState.selectedPiece === item.num) {
        osiState.selectedPiece = null;
        clearPieceSelection();
      } else {
        osiState.selectedPiece = item.num;
        clearPieceSelection();
        piece.classList.add('osi-piece--selected');
      }
    });
    piece.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); piece.click(); }
    });

    container.appendChild(piece);
  });
}

function clearPieceSelection() {
  document.querySelectorAll('.osi-piece--selected').forEach(el => el.classList.remove('osi-piece--selected'));
}

function markSlotFilled(slotEl, slotNum, itemNum) {
  const item = osiState.items.find(i => i.num === itemNum);
  slotEl.classList.add('correct');
  slotEl.innerHTML = `
    <span class="osi-slot__num text-green">${slotNum}</span>
    <span>${item.label()}</span>
  `;
}

// ============================================================
// INTERACTION
// ============================================================

function handlePlace(slotNum, itemNum, slotEl) {
  if (osiState.finished) return;
  if (osiState.placedSlots[slotNum]) return;

  const isCorrect = slotNum === itemNum;

  if (isCorrect) {
    osiState.placedSlots[slotNum] = itemNum;
    markSlotFilled(slotEl, slotNum, itemNum);

    const pieceEl = document.querySelector(`[data-item-num="${itemNum}"]`);
    if (pieceEl) {
      pieceEl.classList.add('placed');
      pieceEl.setAttribute('draggable', 'false');
      setTimeout(() => pieceEl.remove(), 300);
    }

    if (Object.keys(osiState.placedSlots).length === osiState.items.length) {
      phaseComplete();
    }
  } else {
    osiState.errors++;
    updateHUDErrors();

    slotEl.classList.add('incorrect');
    setTimeout(() => slotEl.classList.remove('incorrect'), 500);

    const pieceEl = document.querySelector(`[data-item-num="${itemNum}"]`);
    if (pieceEl) {
      pieceEl.style.borderColor = 'var(--red)';
      pieceEl.style.color = 'var(--red)';
      setTimeout(() => { pieceEl.style.borderColor = ''; pieceEl.style.color = ''; }, 500);
    }
  }
}

function updateHUDErrors() {
  const el = document.getElementById('hud-errors');
  if (el) el.textContent = osiState.errors;
}

// ============================================================
// PHASE COMPLETE
// ============================================================

function phaseComplete() {
  const type       = osiState.puzzleType;
  const difficulty = osiState.difficulty;
  const elapsed    = Math.floor((Date.now() - osiState.startTime) / 1000);

  // Types sans phase 2, ou facile (une seule phase) → fin de partie
  const goToPhase2 = osiState.phase === 1
    && hasProtoPhase(type)
    && (difficulty === 'medium' || difficulty === 'hard');

  if (!goToPhase2) {
    endGame(true);
    return;
  }

  // Sauvegarder le score partiel de la phase 1
  const speedBonus1   = Math.max(0, 200 - elapsed * 3);
  const errorPenalty1 = osiState.errors * 20;
  osiState.phase1Score = Math.max(0, 350 + speedBonus1 - errorPenalty1);

  stopTimer();

  // Transition vers phase 2
  osiState.phase        = 2;
  osiState.placedSlots  = {};
  osiState.errors       = 0;
  osiState.startTime    = Date.now();
  osiState.timerLimit   = difficulty === 'hard' ? 30 : null;
  osiState.items        = buildItemsForType(type, difficulty, 2);

  const phaseEl = document.getElementById('osi-phase-label');
  if (phaseEl) phaseEl.textContent = getPhaseLabel(2);

  // Flash rapide pour signaler la transition
  const gameScreen = document.getElementById('game-screen');
  gameScreen.style.opacity = '0.3';
  setTimeout(() => {
    gameScreen.style.opacity = '1';
    renderSlots();
    renderPieces();
    startTimer();
  }, 400);
}

// ============================================================
// TIMER
// ============================================================

function startTimer() {
  const timerEl = document.getElementById('hud-timer');
  osiState.startTime = Date.now();

  osiState.timerInterval = setInterval(() => {
    if (!osiState.startTime) return;
    const elapsed = Math.floor((Date.now() - osiState.startTime) / 1000);

    if (osiState.timerLimit) {
      const remaining = osiState.timerLimit - elapsed;
      if (timerEl) timerEl.textContent = remaining > 0 ? remaining + 's' : '0s';
      if (remaining <= 0) endGame(false);
    } else {
      if (timerEl) timerEl.textContent = formatTime(elapsed);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(osiState.timerInterval);
  osiState.timerInterval = null;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============================================================
// GAME OVER
// ============================================================

function endGame(win) {
  osiState.finished = true;
  stopTimer();

  const total       = osiState.items.length;
  const placed      = Object.keys(osiState.placedSlots).length;
  const elapsed     = Math.floor((Date.now() - osiState.startTime) / 1000);
  const speedBonus  = Math.max(0, 200 - elapsed * 3);
  const errorPenalty = osiState.errors * 20;
  const baseScore   = win ? 350 : Math.floor((placed / total) * 350);
  const phase2Score = Math.max(0, baseScore + speedBonus - errorPenalty);
  const finalScore  = osiState.phase1Score + phase2Score;

  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  document.getElementById('result-title').textContent = win ? i18n.t('victory') : i18n.t('game_over');
  document.getElementById('result-title').className = win
    ? 'game-result__title game-result__title--win'
    : 'game-result__title game-result__title--lose';
  document.getElementById('result-score').textContent = String(finalScore).padStart(6, '0');

  document.getElementById('save-score-btn').onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('score-entry-screen').style.display = 'block';

    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, 'osi-puzzle', osiState.difficulty, finalScore);
        document.getElementById('score-entry-screen').style.display = 'none';
        document.getElementById('post-save-screen').style.display = 'block';

        const newPins = checkRewards();
        showRewardNotifications(newPins, { isGamePage: true });

        document.getElementById('capture-btn').onclick = () => {
          ticket.generate({
            initials,
            game:       i18n.t('game_osi_puzzle'),
            difficulty: osiState.difficulty,
            score:      finalScore,
            topScore:   1000
          });
        };
      }
    );
  };

  document.getElementById('play-again-btn').onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('type-screen').style.display = 'block';
  };
}

// ============================================================
// UTILITIES
// ============================================================

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
