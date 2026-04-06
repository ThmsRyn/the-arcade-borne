/**
 * osi-puzzle.js — OSI Puzzle game logic
 *
 * Puzzle types:
 *   osi        — drag 7 OSI layers into correct order
 *   tcpip      — drag 4 TCP/IP layers into correct order
 *   handshake  — drag TCP handshake steps into correct order (3/7/10 steps by difficulty)
 *   dhcp       — drag 4 DHCP DORA steps into correct order
 *   encap      — drag 5 packet encapsulation layers into correct order
 *
 * Difficulty behaviour:
 *   easy   — slots show number + full label, pieces show label + description
 *   medium — slots show number only, pieces show description only
 *   hard   — slots in random order, countdown timer, pieces show short label only
 *
 * Score: 700 base + speed bonus - error penalties
 */

// ============================================================
// PUZZLE DATA
// ============================================================

// OSI MODEL — 7 layers, position = correct slot number (7 = top)
const OSI_LAYERS = [
  { num: 7, key: 'layer_7',  examples_fr: 'HTTP, FTP, DNS',  examples_en: 'HTTP, FTP, DNS' },
  { num: 6, key: 'layer_6',  examples_fr: 'SSL/TLS, JPEG',   examples_en: 'SSL/TLS, JPEG' },
  { num: 5, key: 'layer_5',  examples_fr: 'NetBIOS, RPC',    examples_en: 'NetBIOS, RPC' },
  { num: 4, key: 'layer_4',  examples_fr: 'TCP, UDP',        examples_en: 'TCP, UDP' },
  { num: 3, key: 'layer_3',  examples_fr: 'IP, ICMP',        examples_en: 'IP, ICMP' },
  { num: 2, key: 'layer_2',  examples_fr: 'Ethernet, MAC',   examples_en: 'Ethernet, MAC' },
  { num: 1, key: 'layer_1',  examples_fr: 'Cable, Fibre',    examples_en: 'Cable, Fiber' }
];

// Protocol Sort data (kept for potential future use — not used in this refactor)
const PROTOCOL_SORT_ITEMS = [
  { name: 'HTTP',      layer: 7 },
  { name: 'FTP',       layer: 7 },
  { name: 'DNS',       layer: 7 },
  { name: 'SSL/TLS',   layer: 6 },
  { name: 'JPEG',      layer: 6 },
  { name: 'NetBIOS',   layer: 5 },
  { name: 'RPC',       layer: 5 },
  { name: 'TCP',       layer: 4 },
  { name: 'UDP',       layer: 4 },
  { name: 'IP',        layer: 3 },
  { name: 'ICMP',      layer: 3 },
  { name: 'Ethernet',  layer: 2 },
  { name: 'MAC',       layer: 2 },
  { name: 'Cable',     layer: 1 }
];

// TCP/IP MODEL — 4 layers, slot 1 = top (Application)
const TCPIP_LAYERS = [
  {
    num: 1,
    label_fr: 'APPLICATION',
    label_en: 'APPLICATION',
    desc_fr: 'HTTP, FTP, DNS, SMTP',
    desc_en: 'HTTP, FTP, DNS, SMTP'
  },
  {
    num: 2,
    label_fr: 'TRANSPORT',
    label_en: 'TRANSPORT',
    desc_fr: 'TCP, UDP',
    desc_en: 'TCP, UDP'
  },
  {
    num: 3,
    label_fr: 'INTERNET',
    label_en: 'INTERNET',
    desc_fr: 'IP, ICMP, ARP',
    desc_en: 'IP, ICMP, ARP'
  },
  {
    num: 4,
    label_fr: 'ACCES RESEAU',
    label_en: 'NETWORK ACCESS',
    desc_fr: 'Ethernet, WiFi, MAC',
    desc_en: 'Ethernet, WiFi, MAC'
  }
];

// TCP HANDSHAKE — steps vary by difficulty
// Each step has: num (correct position), short (hard mode label), full_fr, full_en
const HANDSHAKE_STEPS = {
  easy: [
    { num: 1, short: 'SYN',     full_fr: 'SYN — Client vers Serveur',       full_en: 'SYN — Client to Server' },
    { num: 2, short: 'SYN-ACK', full_fr: 'SYN-ACK — Serveur vers Client',   full_en: 'SYN-ACK — Server to Client' },
    { num: 3, short: 'ACK',     full_fr: 'ACK — Client vers Serveur',       full_en: 'ACK — Client to Server' }
  ],
  medium: [
    { num: 1, short: 'SYN',     full_fr: 'SYN — Client vers Serveur',       full_en: 'SYN — Client to Server' },
    { num: 2, short: 'SYN-ACK', full_fr: 'SYN-ACK — Serveur vers Client',   full_en: 'SYN-ACK — Server to Client' },
    { num: 3, short: 'ACK',     full_fr: 'ACK — Client vers Serveur',       full_en: 'ACK — Client to Server' },
    { num: 4, short: 'DATA',    full_fr: 'DATA — Client vers Serveur',      full_en: 'DATA — Client to Server' },
    { num: 5, short: 'ACK',     full_fr: 'ACK — Serveur vers Client',       full_en: 'ACK — Server to Client' },
    { num: 6, short: 'FIN',     full_fr: 'FIN — Client vers Serveur',       full_en: 'FIN — Client to Server' },
    { num: 7, short: 'FIN-ACK', full_fr: 'FIN-ACK — Serveur vers Client',   full_en: 'FIN-ACK — Server to Client' }
  ],
  hard: [
    { num: 1,  short: 'SYN',     full_fr: 'SYN — Client vers Serveur',      full_en: 'SYN — Client to Server' },
    { num: 2,  short: 'SYN-ACK', full_fr: 'SYN-ACK — Serveur vers Client',  full_en: 'SYN-ACK — Server to Client' },
    { num: 3,  short: 'ACK',     full_fr: 'ACK — Client vers Serveur',      full_en: 'ACK — Client to Server' },
    { num: 4,  short: 'DATA',    full_fr: 'DATA — Client vers Serveur',     full_en: 'DATA — Client to Server' },
    { num: 5,  short: 'ACK',     full_fr: 'ACK — Serveur vers Client',      full_en: 'ACK — Server to Client' },
    { num: 6,  short: 'DATA',    full_fr: 'DATA — Serveur vers Client',     full_en: 'DATA — Server to Client' },
    { num: 7,  short: 'ACK',     full_fr: 'ACK — Client vers Serveur',      full_en: 'ACK — Client to Server' },
    { num: 8,  short: 'FIN',     full_fr: 'FIN — Client vers Serveur',      full_en: 'FIN — Client to Server' },
    { num: 9,  short: 'FIN-ACK', full_fr: 'FIN-ACK — Serveur vers Client',  full_en: 'FIN-ACK — Server to Client' },
    { num: 10, short: 'ACK',     full_fr: 'ACK — Client vers Serveur',      full_en: 'ACK — Client to Server' }
  ]
};

// DHCP DORA — 4 steps, same order for all difficulties
// Hard mode: pieces show only the single letter (D/O/R/A)
const DHCP_STEPS = [
  {
    num: 1,
    letter: 'D',
    full_fr: 'DISCOVER — Client (broadcast)',
    full_en: 'DISCOVER — Client (broadcast)'
  },
  {
    num: 2,
    letter: 'O',
    full_fr: 'OFFER — Serveur (unicast/broadcast)',
    full_en: 'OFFER — Server (unicast/broadcast)'
  },
  {
    num: 3,
    letter: 'R',
    full_fr: 'REQUEST — Client (broadcast)',
    full_en: 'REQUEST — Client (broadcast)'
  },
  {
    num: 4,
    letter: 'A',
    full_fr: 'ACKNOWLEDGE — Serveur (unicast/broadcast)',
    full_en: 'ACKNOWLEDGE — Server (unicast/broadcast)'
  }
];

// PACKET ENCAPSULATION — 5 layers, slot 1 = top (data), slot 5 = bottom (bits)
const ENCAP_LAYERS = [
  {
    num: 1,
    label_fr: 'DONNEES',
    label_en: 'DATA',
    desc_fr: 'Payload applicatif',
    desc_en: 'Application payload'
  },
  {
    num: 2,
    label_fr: 'EN-TETE SEGMENT',
    label_en: 'SEGMENT HEADER',
    desc_fr: 'TCP / UDP',
    desc_en: 'TCP / UDP'
  },
  {
    num: 3,
    label_fr: 'EN-TETE PAQUET',
    label_en: 'PACKET HEADER',
    desc_fr: 'IP',
    desc_en: 'IP'
  },
  {
    num: 4,
    label_fr: 'EN-TETE TRAME',
    label_en: 'FRAME HEADER',
    desc_fr: 'Ethernet',
    desc_en: 'Ethernet'
  },
  {
    num: 5,
    label_fr: 'BITS PHYSIQUES',
    label_en: 'PHYSICAL BITS',
    desc_fr: 'Signal electrique / optique',
    desc_en: 'Electrical / optical signal'
  }
];

// ============================================================
// GAME STATE
// ============================================================

let osiState = {
  puzzleType: null,      // 'osi' | 'tcpip' | 'handshake' | 'dhcp' | 'encap'
  difficulty: null,      // 'easy' | 'medium' | 'hard'
  items: [],             // ordered dataset for the current puzzle type + difficulty
  slotOrder: [],         // slot numbers in display order (shuffled in hard mode)
  placedSlots: {},       // { slotNum: itemNum } — what is placed in each slot
  errors: 0,
  startTime: null,
  timerInterval: null,
  timerLimit: null,
  finished: false,
  selectedPiece: null    // for mobile tap: item num currently selected
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // Puzzle type selection buttons
  document.querySelectorAll('[data-puzzle-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectPuzzleType(btn.dataset.puzzleType);
    });
  });

  // Back to type selection
  const backBtn = document.getElementById('back-to-type-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('difficulty-screen').style.display = 'none';
      document.getElementById('type-screen').style.display = 'block';
    });
  }

  // How to Play toggle
  const htpToggle = document.getElementById('htp-toggle');
  if (htpToggle) {
    htpToggle.addEventListener('click', () => {
      const content = document.getElementById('htp-content');
      const arrow = document.getElementById('htp-arrow');
      const expanded = htpToggle.getAttribute('aria-expanded') === 'true';
      htpToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      content.style.display = expanded ? 'none' : 'block';
      arrow.innerHTML = expanded ? '&#x25BA;' : '&#x25BC;';
    });
  }

  // Post-save play again button — returns to type selection
  const postSavePlayAgain = document.getElementById('post-save-play-again-btn');
  if (postSavePlayAgain) {
    postSavePlayAgain.addEventListener('click', () => {
      document.getElementById('post-save-screen').style.display = 'none';
      document.getElementById('type-screen').style.display = 'block';
    });
  }

  // Language change — re-render pieces if a game is in progress
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

  // Update the How to Play text based on selected type
  const htpTextEl = document.getElementById('htp-text');
  if (htpTextEl) {
    const key = 'htp_' + type;
    htpTextEl.textContent = i18n.t(key);
  }

  // Inject difficulty buttons depending on puzzle type
  buildDifficultyButtons(type);

  document.getElementById('type-screen').style.display = 'none';
  document.getElementById('difficulty-screen').style.display = 'block';

  // Ensure How to Play is expanded when arriving on difficulty screen
  const htpContent = document.getElementById('htp-content');
  const htpToggle = document.getElementById('htp-toggle');
  const htpArrow = document.getElementById('htp-arrow');
  if (htpContent) htpContent.style.display = 'block';
  if (htpToggle) htpToggle.setAttribute('aria-expanded', 'true');
  if (htpArrow) htpArrow.innerHTML = '&#x25BC;';
}

function buildDifficultyButtons(type) {
  const container = document.getElementById('difficulty-buttons-container');
  if (!container) return;
  container.innerHTML = '';

  // Handshake has different subtitles per difficulty
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
  const subtitles = {
    osi: {
      easy:   lang === 'fr' ? '7 > 1 + INDICES'        : '7 > 1 + HINTS',
      medium: lang === 'fr' ? '1 > 7 SANS INDICES'     : '1 > 7 NO HINTS',
      hard:   lang === 'fr' ? 'ALEATOIRE + TIMER'       : 'RANDOM + TIMER'
    },
    tcpip: {
      easy:   lang === 'fr' ? '4 > 1 + INDICES' : '4 > 1 + HINTS',
      medium: lang === 'fr' ? '4 COUCHES SANS INDICE' : '4 LAYERS NO HINTS',
      hard:   lang === 'fr' ? 'ALEATOIRE + TIMER' : 'RANDOM + TIMER'
    },
    handshake: {
      easy:   '3 STEPS',
      medium: '7 STEPS',
      hard:   '10 STEPS + TIMER'
    },
    dhcp: {
      easy:   lang === 'fr' ? 'NOM + DETAILS'  : 'NAME + DETAILS',
      medium: lang === 'fr' ? 'NOM SEULEMENT'  : 'NAME ONLY',
      hard:   lang === 'fr' ? 'LETTRE + TIMER' : 'LETTER + TIMER'
    },
    encap: {
      easy:   lang === 'fr' ? '5 ELEMENTS + DESC'  : '5 ELEMENTS + DESC',
      medium: lang === 'fr' ? 'NOMS TECHNIQUES'    : 'TECHNICAL NAMES',
      hard:   lang === 'fr' ? 'COURT + TIMER 30s'  : 'SHORT + TIMER 30s'
    }
  };
  return subtitles[type] || { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
}

// ============================================================
// GAME START
// ============================================================

function startGame(difficulty) {
  const type = osiState.puzzleType;
  const items = buildItemsForType(type, difficulty);
  const total = items.length;

  let slotOrder;
  let timerLimit = null;

  if (difficulty === 'easy') {
    // OSI easy: slots 7 down to 1 (Application at top, Physical at bottom)
    // All other types: slots 1 to N (natural top-to-bottom order)
    slotOrder = type === 'osi'
      ? [7, 6, 5, 4, 3, 2, 1]
      : items.map(item => item.num);
  } else if (difficulty === 'medium') {
    // OSI medium: slots 1 to 7 (Physical at top — player must know the direction)
    // All other types: slots 1 to N
    slotOrder = type === 'osi'
      ? [1, 2, 3, 4, 5, 6, 7]
      : items.map(item => item.num);
  } else {
    // Hard: random slot order + countdown timer
    slotOrder = shuffleArray(items.map(item => item.num));
    timerLimit = type === 'encap' ? 30 : 45;
  }

  osiState = {
    puzzleType: type,
    difficulty,
    items,
    slotOrder,
    placedSlots: {},
    errors: 0,
    startTime: Date.now(),
    timerInterval: null,
    timerLimit,
    finished: false,
    selectedPiece: null
  };

  // Update slot column title
  const slotsTitle = document.getElementById('osi-slots-title');
  if (slotsTitle) {
    slotsTitle.textContent = getSlotColumnTitle(type);
  }

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

// Build the ordered item list for the selected type and difficulty
function buildItemsForType(type, difficulty) {
  if (type === 'osi') {
    // OSI: slot 7 = top (Application), slot 1 = bottom (Physical)
    return OSI_LAYERS.map(l => ({
      num: l.num,
      label: () => i18n.t(l.key),
      desc: () => (i18n.getLang() === 'fr' ? l.examples_fr : l.examples_en),
      short: () => i18n.t(l.key)
    }));
  }

  if (type === 'tcpip') {
    return TCPIP_LAYERS.map(l => ({
      num: l.num,
      label: () => (i18n.getLang() === 'fr' ? l.label_fr : l.label_en),
      desc: () => (i18n.getLang() === 'fr' ? l.desc_fr : l.desc_en),
      short: () => (i18n.getLang() === 'fr' ? l.label_fr : l.label_en)
    }));
  }

  if (type === 'handshake') {
    const steps = HANDSHAKE_STEPS[difficulty] || HANDSHAKE_STEPS.easy;
    return steps.map(s => ({
      num: s.num,
      label: () => (i18n.getLang() === 'fr' ? s.full_fr : s.full_en),
      desc: () => '',
      short: () => s.short
    }));
  }

  if (type === 'dhcp') {
    return DHCP_STEPS.map(s => ({
      num: s.num,
      label: () => (i18n.getLang() === 'fr' ? s.full_fr : s.full_en),
      desc: () => '',
      short: () => s.letter
    }));
  }

  if (type === 'encap') {
    return ENCAP_LAYERS.map(l => ({
      num: l.num,
      label: () => (i18n.getLang() === 'fr' ? l.label_fr : l.label_en),
      desc: () => (i18n.getLang() === 'fr' ? l.desc_fr : l.desc_en),
      short: () => (i18n.getLang() === 'fr' ? l.label_fr : l.label_en)
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
    const item = osiState.items.find(i => i.num === num);
    const slot = document.createElement('div');
    slot.className = 'osi-slot';
    slot.dataset.slotNum = num;
    slot.setAttribute('aria-label', `Slot ${num}`);
    slot.setAttribute('aria-dropeffect', 'move');

    // EASY  : slot shows number + layer name → pieces show protocol examples only
    //         Player must match protocols to layer names
    // MEDIUM: slot shows number only → pieces show layer name only
    //         Player must recall what each number corresponds to
    // HARD  : slot shows "???" in random order → pieces show short label only
    //         Player has zero positional hint
    let slotContent;
    if (osiState.difficulty === 'easy') {
      slotContent = `
        <span class="osi-slot__num">${num}</span>
        <span class="osi-slot__hint">${item.label()}</span>
      `;
    } else if (osiState.difficulty === 'medium') {
      slotContent = `<span class="osi-slot__num">${num}</span>`;
    } else {
      slotContent = `<span class="osi-slot__num" style="color:#666;">???</span>`;
    }

    slot.innerHTML = slotContent;

    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
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

  // Restore already placed items on re-render
  Object.entries(osiState.placedSlots).forEach(([slotNum, itemNum]) => {
    const slotEl = container.querySelector(`[data-slot-num="${slotNum}"]`);
    if (slotEl) {
      markSlotFilled(slotEl, parseInt(slotNum, 10), itemNum);
    }
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
    // Skip already placed items
    const alreadyPlaced = Object.values(osiState.placedSlots).includes(item.num);
    if (alreadyPlaced) return;

    const piece = document.createElement('div');
    piece.className = 'osi-piece osi-piece--tappable';
    piece.dataset.itemNum = item.num;
    piece.setAttribute('draggable', 'true');
    piece.setAttribute('role', 'button');
    piece.setAttribute('tabindex', '0');
    piece.setAttribute('aria-label', item.label());
    piece.setAttribute('aria-grabbed', 'false');

    // Piece content per difficulty — never shows the slot number
    //
    // EASY  : protocol examples only (no layer name)
    //         Slot shows the layer name → player matches protocols to layer
    //         e.g. piece shows "HTTP, FTP, DNS" → must go into slot "APPLICATION"
    //
    // MEDIUM: layer name only (no examples, no number)
    //         Slot shows number only → player must know that name = which number
    //         e.g. piece shows "APPLICATION" → must go into slot "7"
    //
    // HARD  : short label only, slots are "???" in random order
    //         Player must know the full order from memory
    if (osiState.difficulty === 'easy') {
      const desc = item.desc();
      // If no description available (handshake steps, dhcp letters), fall back to label
      piece.innerHTML = desc
        ? `<span style="font-size:0.32rem; color:#ccc;">${desc}</span>`
        : `<strong>${item.label()}</strong>`;
    } else if (osiState.difficulty === 'medium') {
      piece.innerHTML = `<strong>${item.label()}</strong>`;
    } else {
      // Hard: short label only
      piece.textContent = item.short();
    }

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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        piece.click();
      }
    });

    container.appendChild(piece);
  });
}

function clearPieceSelection() {
  document.querySelectorAll('.osi-piece--selected').forEach(el => {
    el.classList.remove('osi-piece--selected');
  });
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
      endGame(true);
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
      setTimeout(() => {
        pieceEl.style.borderColor = '';
        pieceEl.style.color = '';
      }, 500);
    }
  }
}

function updateHUDErrors() {
  const el = document.getElementById('hud-errors');
  if (el) el.textContent = osiState.errors;
}

// ============================================================
// TIMER
// ============================================================

function startTimer() {
  const timerEl = document.getElementById('hud-timer');

  osiState.timerInterval = setInterval(() => {
    if (!osiState.startTime) return;
    const elapsed = Math.floor((Date.now() - osiState.startTime) / 1000);

    if (osiState.timerLimit) {
      const remaining = osiState.timerLimit - elapsed;
      if (timerEl) timerEl.textContent = remaining > 0 ? remaining + 's' : '00';
      if (remaining <= 0) {
        endGame(false);
      }
    } else {
      if (timerEl) timerEl.textContent = formatTime(elapsed);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(osiState.timerInterval);
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

  const total = osiState.items.length;
  const placed = Object.keys(osiState.placedSlots).length;
  const elapsed = Math.floor((Date.now() - osiState.startTime) / 1000);
  const speedBonus = Math.max(0, 300 - elapsed * 5);
  const errorPenalty = osiState.errors * 30;
  const baseScore = win ? 700 : Math.floor((placed / total) * 700);
  const finalScore = Math.max(0, baseScore + speedBonus - errorPenalty);

  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  document.getElementById('result-title').textContent = win
    ? i18n.t('victory')
    : i18n.t('game_over');
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
            game: i18n.t('game_osi_puzzle'),
            difficulty: osiState.difficulty,
            score: finalScore,
            topScore: 1000
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
