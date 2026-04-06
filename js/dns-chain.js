/**
 * dns-chain.js — DNS Chain game logic
 *
 * The player must reconstruct the DNS resolution chain by dragging/clicking
 * steps into the correct order. Multiple chain types of increasing complexity.
 *
 * Difficulty:
 *   easy   — forward DNS, standard A record query (7 steps)
 *   medium — MX/CNAME/PTR records, 8-9 steps, no hints
 *   hard   — DNSSEC chain, reverse DNS, split-horizon, 10+ steps, timer
 *
 * Score: 1200 base - (errors * 80) + (timeLeft * 4)
 */

// ============================================================
// CHAIN DEFINITIONS
// Each step has an id, label (FR+EN), and correct position (0-indexed).
// ============================================================

const DNS_CHAINS = {

  // ── EASY ────────────────────────────────────────────────────

  easy_forward_a: {
    id: 'easy_forward_a',
    title_fr: 'Resolution A : www.example.com',
    title_en: 'A Record: www.example.com',
    desc_fr:  'Remettez les etapes de la resolution DNS dans le bon ordre.',
    desc_en:  'Put the DNS resolution steps in the correct order.',
    steps: [
      { id: 's1', fr: '1. Client envoie une requete DNS au resolver local',           en: '1. Client sends DNS query to local resolver',               pos: 0 },
      { id: 's2', fr: '2. Resolver verifie son cache — cache vide',                   en: '2. Resolver checks cache — cache miss',                     pos: 1 },
      { id: 's3', fr: '3. Resolver interroge un Root Name Server (.)',                en: '3. Resolver queries Root Name Server (.)',                  pos: 2 },
      { id: 's4', fr: '4. Root repond : contacter le TLD .com',                       en: '4. Root replies: contact .com TLD server',                  pos: 3 },
      { id: 's5', fr: '5. Resolver interroge le TLD .com',                            en: '5. Resolver queries .com TLD server',                       pos: 4 },
      { id: 's6', fr: '6. TLD repond : contacter le NS de example.com',               en: '6. TLD replies: contact example.com NS',                    pos: 5 },
      { id: 's7', fr: '7. Resolver interroge le NS autoritaire de example.com',       en: '7. Resolver queries authoritative NS for example.com',      pos: 6 },
      { id: 's8', fr: '8. NS autoritaire repond avec l\'adresse IP (A record)',        en: '8. Authoritative NS replies with IP address (A record)',     pos: 7 },
      { id: 's9', fr: '9. Resolver met la reponse en cache (TTL) et repond au client', en: '9. Resolver caches response (TTL) and replies to client',   pos: 8 },
    ]
  },

  easy_cache_hit: {
    id: 'easy_cache_hit',
    title_fr: 'Resolution avec cache : mail.domain.net',
    title_en: 'Cached resolution: mail.domain.net',
    desc_fr:  'Le resolver a cette entree en cache. Remettez les etapes dans l\'ordre.',
    desc_en:  'The resolver has this entry cached. Put steps in correct order.',
    steps: [
      { id: 's1', fr: '1. Client envoie une requete DNS au resolver local',           en: '1. Client sends DNS query to local resolver',              pos: 0 },
      { id: 's2', fr: '2. Resolver verifie son cache — entree trouvee (TTL valide)',  en: '2. Resolver checks cache — entry found (TTL valid)',        pos: 1 },
      { id: 's3', fr: '3. Resolver repond directement au client depuis le cache',     en: '3. Resolver replies directly to client from cache',         pos: 2 },
      { id: 's4', fr: '4. Client recoit l\'adresse IP — connexion etablie',           en: '4. Client receives IP address — connection established',    pos: 3 },
    ]
  },

  easy_nxdomain: {
    id: 'easy_nxdomain',
    title_fr: 'NXDOMAIN : notexist.example.org',
    title_en: 'NXDOMAIN: notexist.example.org',
    desc_fr:  'Le domaine n\'existe pas. Remettez les etapes dans le bon ordre.',
    desc_en:  'The domain does not exist. Put steps in correct order.',
    steps: [
      { id: 's1', fr: '1. Client envoie une requete DNS au resolver',                  en: '1. Client sends DNS query to resolver',                    pos: 0 },
      { id: 's2', fr: '2. Resolver interroge le Root Name Server',                    en: '2. Resolver queries Root Name Server',                     pos: 1 },
      { id: 's3', fr: '3. Root repond : contacter le TLD .org',                       en: '3. Root replies: contact .org TLD',                        pos: 2 },
      { id: 's4', fr: '4. Resolver interroge le TLD .org',                            en: '4. Resolver queries .org TLD',                             pos: 3 },
      { id: 's5', fr: '5. TLD repond : contacter le NS de example.org',               en: '5. TLD replies: contact example.org NS',                   pos: 4 },
      { id: 's6', fr: '6. NS autoritaire repond NXDOMAIN (domaine inexistant)',        en: '6. Authoritative NS replies NXDOMAIN (domain not found)',   pos: 5 },
      { id: 's7', fr: '7. Resolver transmet NXDOMAIN au client',                      en: '7. Resolver forwards NXDOMAIN to client',                  pos: 6 },
    ]
  },

  // ── MEDIUM ──────────────────────────────────────────────────

  medium_mx: {
    id: 'medium_mx',
    title_fr: 'Resolution MX : smtp.company.com',
    title_en: 'MX record: smtp.company.com',
    desc_fr:  'Resolution d\'un enregistrement MX pour l\'envoi d\'email.',
    desc_en:  'MX record resolution for email delivery.',
    steps: [
      { id: 's1', fr: '1. Serveur SMTP emetteur envoie requete MX pour company.com', en: '1. Sending SMTP server queries MX for company.com',          pos: 0 },
      { id: 's2', fr: '2. Resolver interroge Root → TLD .com → NS company.com',      en: '2. Resolver queries Root → .com TLD → company.com NS',       pos: 1 },
      { id: 's3', fr: '3. NS autoritaire repond avec l\'enregistrement MX',           en: '3. Authoritative NS replies with MX record',                pos: 2 },
      { id: 's4', fr: '4. MX pointe vers mail.company.com (priorite 10)',             en: '4. MX points to mail.company.com (priority 10)',             pos: 3 },
      { id: 's5', fr: '5. Resolver effectue une requete A pour mail.company.com',     en: '5. Resolver performs A query for mail.company.com',          pos: 4 },
      { id: 's6', fr: '6. NS repond avec l\'adresse IP du serveur mail',              en: '6. NS replies with mail server IP address',                 pos: 5 },
      { id: 's7', fr: '7. SMTP emetteur se connecte a l\'IP sur le port 25',         en: '7. Sending SMTP connects to IP on port 25',                  pos: 6 },
    ]
  },

  medium_cname: {
    id: 'medium_cname',
    title_fr: 'Resolution CNAME : cdn.shop.fr',
    title_en: 'CNAME chain: cdn.shop.fr',
    desc_fr:  'Un CNAME pointe vers un autre nom — resolution en chaine.',
    desc_en:  'A CNAME points to another name — chained resolution.',
    steps: [
      { id: 's1', fr: '1. Client requete A pour cdn.shop.fr',                          en: '1. Client queries A for cdn.shop.fr',                        pos: 0 },
      { id: 's2', fr: '2. NS autoritaire repond : cdn.shop.fr CNAME shop.cdn-provider.net', en: '2. Authoritative NS: cdn.shop.fr CNAME shop.cdn-provider.net', pos: 1 },
      { id: 's3', fr: '3. Resolver suit le CNAME : requete A pour shop.cdn-provider.net', en: '3. Resolver follows CNAME: A query for shop.cdn-provider.net', pos: 2 },
      { id: 's4', fr: '4. NS de cdn-provider.net repond avec l\'IP du CDN',            en: '4. cdn-provider.net NS replies with CDN IP',                 pos: 3 },
      { id: 's5', fr: '5. Resolver renvoie au client l\'IP finale (et le CNAME)',       en: '5. Resolver returns final IP to client (and the CNAME)',     pos: 4 },
      { id: 's6', fr: '6. Client se connecte a l\'IP du CDN',                          en: '6. Client connects to CDN IP',                              pos: 5 },
    ]
  },

  medium_ptr: {
    id: 'medium_ptr',
    title_fr: 'Resolution inverse PTR : 192.168.1.50',
    title_en: 'Reverse PTR lookup: 192.168.1.50',
    desc_fr:  'Resolution DNS inverse (IP → nom de domaine).',
    desc_en:  'Reverse DNS lookup (IP → hostname).',
    steps: [
      { id: 's1', fr: '1. Client construit la requete inverse : 50.1.168.192.in-addr.arpa', en: '1. Client builds reverse query: 50.1.168.192.in-addr.arpa', pos: 0 },
      { id: 's2', fr: '2. Resolver interroge Root → TLD arpa → in-addr.arpa',              en: '2. Resolver queries Root → arpa TLD → in-addr.arpa',          pos: 1 },
      { id: 's3', fr: '3. Delegation vers le NS responsable du bloc 192.168.1.0/24',        en: '3. Delegation to NS responsible for 192.168.1.0/24 block',    pos: 2 },
      { id: 's4', fr: '4. NS autoritaire repond avec le PTR record : host.local.example',   en: '4. Authoritative NS replies with PTR record: host.local.example', pos: 3 },
      { id: 's5', fr: '5. Resolver retourne le nom de domaine au client',                   en: '5. Resolver returns hostname to client',                       pos: 4 },
    ]
  },

  // ── HARD ────────────────────────────────────────────────────

  hard_dnssec: {
    id: 'hard_dnssec',
    title_fr: 'DNSSEC : secure.bank.com',
    title_en: 'DNSSEC: secure.bank.com',
    desc_fr:  'Resolution securisee avec validation DNSSEC. Chaque reponse est signee.',
    desc_en:  'Secure resolution with DNSSEC validation. Each reply is signed.',
    steps: [
      { id: 's1',  fr: '1.  Client envoie requete A + flag DO (DNSSEC OK)',                         en: '1.  Client sends A query with DO bit (DNSSEC OK)',                         pos: 0 },
      { id: 's2',  fr: '2.  Resolver interroge Root — verifie RRSIG + DNSKEY de .',                 en: '2.  Resolver queries Root — validates RRSIG + DNSKEY for .',                pos: 1 },
      { id: 's3',  fr: '3.  Root renvoie delegation .com avec DS record',                           en: '3.  Root returns .com delegation with DS record',                         pos: 2 },
      { id: 's4',  fr: '4.  Resolver verifie la chaine de confiance Root → .com (DS + DNSKEY)',     en: '4.  Resolver verifies trust chain Root → .com (DS + DNSKEY)',              pos: 3 },
      { id: 's5',  fr: '5.  Resolver interroge TLD .com — verifie RRSIG',                           en: '5.  Resolver queries .com TLD — validates RRSIG',                          pos: 4 },
      { id: 's6',  fr: '6.  TLD repond avec delegation bank.com + DS record',                       en: '6.  TLD replies with bank.com delegation + DS record',                    pos: 5 },
      { id: 's7',  fr: '7.  Resolver verifie la chaine .com → bank.com (DS + DNSKEY)',              en: '7.  Resolver verifies .com → bank.com trust chain (DS + DNSKEY)',          pos: 6 },
      { id: 's8',  fr: '8.  Resolver interroge NS autoritaire bank.com',                             en: '8.  Resolver queries bank.com authoritative NS',                           pos: 7 },
      { id: 's9',  fr: '9.  NS repond avec A record + RRSIG signe par la ZSK de bank.com',          en: '9.  NS replies with A record + RRSIG signed by bank.com ZSK',              pos: 8 },
      { id: 's10', fr: '10. Resolver valide la signature — reponse authentique (AD bit)',            en: '10. Resolver validates signature — authentic response (AD bit set)',        pos: 9 },
      { id: 's11', fr: '11. Client recoit la reponse avec bit AD — connexion securisee',             en: '11. Client receives response with AD bit — secure connection',             pos: 10 },
    ]
  },

  hard_split_horizon: {
    id: 'hard_split_horizon',
    title_fr: 'Split-Horizon DNS : intranet.corp.local',
    title_en: 'Split-Horizon DNS: intranet.corp.local',
    desc_fr:  'Le DNS repond differemment selon la source (interne/externe).',
    desc_en:  'DNS returns different answers based on source (internal/external).',
    steps: [
      { id: 's1', fr: '1. Client interne requete intranet.corp.local',                  en: '1. Internal client queries intranet.corp.local',               pos: 0 },
      { id: 's2', fr: '2. Resolver interne (10.0.0.53) recoit la requete',              en: '2. Internal resolver (10.0.0.53) receives query',              pos: 1 },
      { id: 's3', fr: '3. Vue interne active : zone .local servie localement',          en: '3. Internal view active: .local zone served locally',          pos: 2 },
      { id: 's4', fr: '4. NS interne repond avec IP privee 10.0.5.20',                  en: '4. Internal NS replies with private IP 10.0.5.20',             pos: 3 },
      { id: 's5', fr: '5. Client externe requete intranet.corp.local via Internet',     en: '5. External client queries intranet.corp.local via Internet',   pos: 4 },
      { id: 's6', fr: '6. DNS public (vue externe) recoit la requete',                  en: '6. Public DNS (external view) receives query',                 pos: 5 },
      { id: 's7', fr: '7. Vue externe active : repond NXDOMAIN (domaine non expose)',   en: '7. External view active: replies NXDOMAIN (domain not exposed)',pos: 6 },
      { id: 's8', fr: '8. Acces refuse depuis l\'exterieur — split-horizon effectif',   en: '8. Access denied from outside — split-horizon effective',       pos: 7 },
    ]
  }
};

const DNS_EASY_POOL   = ['easy_forward_a', 'easy_cache_hit', 'easy_nxdomain'];
const DNS_MEDIUM_POOL = ['medium_mx', 'medium_cname', 'medium_ptr'];
const DNS_HARD_POOL   = ['hard_dnssec', 'hard_split_horizon'];

// ============================================================
// GAME STATE
// ============================================================

const dcState = {
  difficulty:    null,
  chain:         null,
  shuffled:      [],   // shuffled step order displayed to player
  answer:        [],   // player's current slot arrangement (step ids)
  score:         0,
  errors:        0,
  timeLeft:      0,
  timerInterval: null,
  gameId:        'dns-chain',
  attempts:      0,    // number of times player hit "validate" with wrong answer
};

// ============================================================
// HELPERS
// ============================================================

function dcShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dcGetLang() {
  return (typeof i18n !== 'undefined') ? i18n.getLang() : 'fr';
}

function dcShow(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function dcHide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

function dcUpdateHUD() {
  const min = String(Math.floor(dcState.timeLeft / 60)).padStart(2, '0');
  const sec = String(dcState.timeLeft % 60).padStart(2, '0');
  const timerEl = document.getElementById('dc-timer');
  if (timerEl) timerEl.textContent = `${min}:${sec}`;
  const errEl = document.getElementById('dc-errors');
  if (errEl) errEl.textContent = dcState.errors;
}

// ============================================================
// INIT
// ============================================================

function dcStartGame(difficulty) {
  dcState.difficulty = difficulty;
  dcState.score      = 0;
  dcState.errors     = 0;
  dcState.attempts   = 0;

  const pool = difficulty === 'easy' ? DNS_EASY_POOL :
               difficulty === 'medium' ? DNS_MEDIUM_POOL : DNS_HARD_POOL;
  const key = pool[Math.floor(Math.random() * pool.length)];
  dcState.chain = DNS_CHAINS[key];

  // Shuffle steps for display
  dcState.shuffled = dcShuffle(dcState.chain.steps);
  // Answer slots: initially empty (null)
  dcState.answer = new Array(dcState.chain.steps.length).fill(null);

  if (difficulty === 'easy')   dcState.timeLeft = 0;   // no timer
  if (difficulty === 'medium') dcState.timeLeft = 120;
  if (difficulty === 'hard')   dcState.timeLeft = 90;

  dcHide('difficulty-screen');
  dcHide('result-screen');
  dcHide('score-entry-screen');
  dcHide('post-save-screen');
  dcShow('game-screen');

  dcRender();
  dcUpdateHUD();

  if (difficulty !== 'easy') {
    dcState.timerInterval = setInterval(() => {
      dcState.timeLeft--;
      dcUpdateHUD();
      if (dcState.timeLeft <= 0) dcEndGame(false);
    }, 1000);
  }
}

// ============================================================
// RENDER
// ============================================================

function dcRender() {
  const lang  = dcGetLang();
  const chain = dcState.chain;

  // Title + desc
  const titleEl = document.getElementById('dc-chain-title');
  if (titleEl) titleEl.textContent = lang === 'fr' ? chain.title_fr : chain.title_en;
  const descEl = document.getElementById('dc-chain-desc');
  if (descEl) descEl.textContent = lang === 'fr' ? chain.desc_fr : chain.desc_en;

  // Available pieces (not yet placed)
  const placedIds = dcState.answer.filter(Boolean);
  const available = dcState.shuffled.filter(s => !placedIds.includes(s.id));

  const piecesEl = document.getElementById('dc-pieces');
  if (piecesEl) {
    piecesEl.innerHTML = available.map(step => `
      <div class="dc-piece" data-step-id="${step.id}" role="button" tabindex="0" aria-label="${lang === 'fr' ? step.fr : step.en}">
        ${lang === 'fr' ? step.fr : step.en}
      </div>
    `).join('');
  }

  // Slots
  const slotsEl = document.getElementById('dc-slots');
  if (slotsEl) {
    slotsEl.innerHTML = dcState.answer.map((stepId, idx) => {
      const step = stepId ? chain.steps.find(s => s.id === stepId) : null;
      const label = step ? (lang === 'fr' ? step.fr : step.en) : '';
      return `
        <div class="dc-slot ${stepId ? 'dc-slot--filled' : 'dc-slot--empty'}" data-slot="${idx}" role="button" tabindex="0" aria-label="Slot ${idx + 1}${stepId ? ': ' + label : ' vide'}">
          <span class="dc-slot__num">${idx + 1}</span>
          <span class="dc-slot__content">${label}</span>
        </div>
      `;
    }).join('');
  }

  dcAttachEvents();
}

// ============================================================
// EVENTS — click-to-place interaction
// ============================================================

let dcSelectedPiece = null;

function dcAttachEvents() {
  // Pieces: click to select
  document.querySelectorAll('.dc-piece').forEach(piece => {
    piece.addEventListener('click', () => {
      document.querySelectorAll('.dc-piece').forEach(p => p.classList.remove('dc-piece--selected'));
      if (dcSelectedPiece === piece.dataset.stepId) {
        dcSelectedPiece = null;
      } else {
        dcSelectedPiece = piece.dataset.stepId;
        piece.classList.add('dc-piece--selected');
      }
    });
  });

  // Slots: click to place selected piece, or unplace if already filled
  document.querySelectorAll('.dc-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const slotIdx = parseInt(slot.dataset.slot, 10);
      if (dcSelectedPiece) {
        // Place piece in slot (swap if slot already filled)
        const existing = dcState.answer[slotIdx];
        dcState.answer[slotIdx] = dcSelectedPiece;
        // If slot was occupied, put it back in available
        // (it's already not in answer at another slot since we track by position)
        // Remove dcSelectedPiece from any other slot where it might already be
        dcState.answer = dcState.answer.map((id, i) =>
          i !== slotIdx && id === dcSelectedPiece ? existing : id
        );
        dcSelectedPiece = null;
        dcRender();
      } else if (dcState.answer[slotIdx]) {
        // Unplace: remove from slot → goes back to pieces
        dcState.answer[slotIdx] = null;
        dcRender();
      }
    });
  });
}

// ============================================================
// VALIDATE
// ============================================================

function dcValidate() {
  const chain = dcState.chain;

  // Check all slots filled
  if (dcState.answer.some(id => id === null)) {
    const msg = document.getElementById('dc-feedback');
    if (msg) {
      msg.textContent = dcGetLang() === 'fr' ? 'Placez toutes les etapes avant de valider.' : 'Place all steps before validating.';
      msg.className = 'dc-feedback dc-feedback--error';
    }
    return;
  }

  // Check order
  let allCorrect = true;
  const wrongSlots = [];
  dcState.answer.forEach((stepId, slotIdx) => {
    const step = chain.steps.find(s => s.id === stepId);
    if (!step || step.pos !== slotIdx) {
      allCorrect = false;
      wrongSlots.push(slotIdx);
    }
  });

  if (allCorrect) {
    clearInterval(dcState.timerInterval);
    // Score calculation
    const baseScore = dcState.difficulty === 'hard' ? 1400 :
                      dcState.difficulty === 'medium' ? 1200 : 1000;
    dcState.score = Math.max(0, baseScore - (dcState.errors * 80) + (dcState.timeLeft * 4));
    dcEndGame(true);
  } else {
    dcState.errors++;
    dcState.attempts++;
    dcUpdateHUD();

    // Time penalty (medium/hard)
    if (dcState.difficulty !== 'easy') {
      dcState.timeLeft = Math.max(0, dcState.timeLeft - 8);
      dcUpdateHUD();
    }

    // Highlight wrong slots briefly
    const slotsEl = document.getElementById('dc-slots');
    if (slotsEl) {
      wrongSlots.forEach(idx => {
        const slotEl = slotsEl.querySelector(`[data-slot="${idx}"]`);
        if (slotEl) {
          slotEl.classList.add('dc-slot--wrong');
          setTimeout(() => slotEl.classList.remove('dc-slot--wrong'), 800);
        }
      });
    }

    const msg = document.getElementById('dc-feedback');
    if (msg) {
      const lang = dcGetLang();
      msg.textContent = lang === 'fr'
        ? `${wrongSlots.length} etape(s) mal placee(s). Reessayez.`
        : `${wrongSlots.length} step(s) in wrong position. Try again.`;
      msg.className = 'dc-feedback dc-feedback--error';
    }

    // Hard difficulty hint after 3 errors: reveal one correct slot
    if (dcState.difficulty === 'hard' && dcState.attempts >= 3) {
      const firstWrong = wrongSlots[0];
      const correctStep = chain.steps.find(s => s.pos === firstWrong);
      if (correctStep) {
        const hintEl = document.getElementById('dc-hint');
        const lang = dcGetLang();
        if (hintEl) {
          hintEl.textContent = lang === 'fr'
            ? `Indice : slot ${firstWrong + 1} = "${correctStep.fr}"`
            : `Hint: slot ${firstWrong + 1} = "${correctStep.en}"`;
          dcState.attempts = 0;
        }
      }
    }
  }
}

// ============================================================
// END GAME
// ============================================================

function dcEndGame(completed) {
  clearInterval(dcState.timerInterval);
  if (!completed) dcState.score = Math.max(0, 200 - dcState.errors * 80);

  dcHide('game-screen');
  dcShow('result-screen');

  const titleEl = document.getElementById('result-title');
  const scoreEl = document.getElementById('result-score');
  if (titleEl) titleEl.textContent = i18n.t(completed ? 'victory' : 'game_over');
  if (scoreEl) scoreEl.textContent = String(dcState.score).padStart(6, '0');
}

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => dcStartGame(btn.dataset.difficulty));
  });

  const validateBtn = document.getElementById('dc-validate-btn');
  if (validateBtn) validateBtn.addEventListener('click', dcValidate);

  const saveBtn = document.getElementById('save-score-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    dcHide('result-screen');
    dcShow('score-entry-screen');
    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, dcState.gameId, dcState.difficulty, dcState.score);
        if (typeof checkRewards === 'function') checkRewards();
        dcHide('score-entry-screen');
        dcShow('post-save-screen');
      }
    );
  });

  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
    dcHide('result-screen');
    dcShow('difficulty-screen');
  });

  const postSavePlayAgain = document.getElementById('post-save-play-again-btn');
  if (postSavePlayAgain) postSavePlayAgain.addEventListener('click', () => {
    dcHide('post-save-screen');
    dcShow('difficulty-screen');
  });

  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) captureBtn.addEventListener('click', () => {
    if (typeof generateTicket === 'function') {
      generateTicket({
        game:       i18n.t('game_dns_chain'),
        difficulty: dcState.difficulty,
        score:      dcState.score,
        errors:     dcState.errors,
        lang:       dcGetLang()
      });
    }
  });

  document.addEventListener('langChange', () => {
    if (dcState.chain) dcRender();
  });
});
