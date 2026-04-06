/**
 * firewall-blitz.js — Firewall Blitz game logic
 *
 * A firewall policy is displayed at the top.
 * A stream of connection requests arrives one by one.
 * Player must quickly click ACCEPT or DENY.
 * Correct = green flash, points. Wrong = red flash, penalty.
 *
 * Difficulty:
 *   easy   — simple rules, 10 packets, 90s, single-direction
 *   medium — compound rules (port + protocol + direction), 15 packets, 75s
 *   hard   — stateful rules, NAT, exceptions, 20 packets, 60s, timer per packet
 *
 * Score: base 1500 - (errors * 100) + speed bonus (remaining time * 5)
 */

// ============================================================
// DATA — POLICIES + PACKET POOLS
// ============================================================

/**
 * A policy is a set of rules to display at the start of the round.
 * Packets are then shown one by one; each packet has a correct verdict.
 */

const FB_POLICIES_EASY = [
  {
    id: 'p_easy_1',
    rules_fr: [
      'AUTORISER : TCP port 80 (HTTP)',
      'AUTORISER : TCP port 443 (HTTPS)',
      'AUTORISER : TCP port 22 (SSH)',
      'BLOQUER : tout le reste',
    ],
    rules_en: [
      'ALLOW: TCP port 80 (HTTP)',
      'ALLOW: TCP port 443 (HTTPS)',
      'ALLOW: TCP port 22 (SSH)',
      'DENY: everything else',
    ],
    packets: [
      { desc_fr: 'TCP 192.168.1.5 → 10.0.0.1:80',   desc_en: 'TCP 192.168.1.5 → 10.0.0.1:80',   verdict: 'accept' },
      { desc_fr: 'TCP 192.168.1.5 → 10.0.0.1:443',  desc_en: 'TCP 192.168.1.5 → 10.0.0.1:443',  verdict: 'accept' },
      { desc_fr: 'TCP 192.168.1.5 → 10.0.0.1:22',   desc_en: 'TCP 192.168.1.5 → 10.0.0.1:22',   verdict: 'accept' },
      { desc_fr: 'TCP 192.168.1.5 → 10.0.0.1:23',   desc_en: 'TCP 192.168.1.5 → 10.0.0.1:23',   verdict: 'deny'   },
      { desc_fr: 'UDP 192.168.1.5 → 10.0.0.1:53',   desc_en: 'UDP 192.168.1.5 → 10.0.0.1:53',   verdict: 'deny'   },
      { desc_fr: 'TCP 10.0.0.2 → 10.0.0.1:8080',    desc_en: 'TCP 10.0.0.2 → 10.0.0.1:8080',    verdict: 'deny'   },
      { desc_fr: 'TCP 10.0.0.3 → 10.0.0.1:443',     desc_en: 'TCP 10.0.0.3 → 10.0.0.1:443',     verdict: 'accept' },
      { desc_fr: 'ICMP 10.0.0.4 → 10.0.0.1',        desc_en: 'ICMP 10.0.0.4 → 10.0.0.1',        verdict: 'deny'   },
      { desc_fr: 'TCP 10.0.0.5 → 10.0.0.1:22',      desc_en: 'TCP 10.0.0.5 → 10.0.0.1:22',      verdict: 'accept' },
      { desc_fr: 'TCP 10.0.0.6 → 10.0.0.1:3389',    desc_en: 'TCP 10.0.0.6 → 10.0.0.1:3389',    verdict: 'deny'   },
    ]
  },
  {
    id: 'p_easy_2',
    rules_fr: [
      'AUTORISER : tout depuis 192.168.0.0/24',
      'AUTORISER : TCP port 443 depuis n\'importe où',
      'BLOQUER : UDP depuis 10.10.0.0/16',
      'BLOQUER : tout le reste',
    ],
    rules_en: [
      'ALLOW: all from 192.168.0.0/24',
      'ALLOW: TCP port 443 from anywhere',
      'DENY: UDP from 10.10.0.0/16',
      'DENY: everything else',
    ],
    packets: [
      { desc_fr: 'TCP 192.168.0.10 → 10.0.0.1:80',   desc_en: 'TCP 192.168.0.10 → 10.0.0.1:80',   verdict: 'accept' },
      { desc_fr: 'TCP 192.168.0.99 → 10.0.0.1:22',   desc_en: 'TCP 192.168.0.99 → 10.0.0.1:22',   verdict: 'accept' },
      { desc_fr: 'TCP 172.16.0.1 → 10.0.0.1:443',    desc_en: 'TCP 172.16.0.1 → 10.0.0.1:443',    verdict: 'accept' },
      { desc_fr: 'UDP 10.10.5.3 → 10.0.0.1:53',      desc_en: 'UDP 10.10.5.3 → 10.0.0.1:53',      verdict: 'deny'   },
      { desc_fr: 'UDP 10.10.0.1 → 10.0.0.1:161',     desc_en: 'UDP 10.10.0.1 → 10.0.0.1:161',     verdict: 'deny'   },
      { desc_fr: 'TCP 172.16.0.5 → 10.0.0.1:80',     desc_en: 'TCP 172.16.0.5 → 10.0.0.1:80',     verdict: 'deny'   },
      { desc_fr: 'ICMP 192.168.0.20 → 10.0.0.1',     desc_en: 'ICMP 192.168.0.20 → 10.0.0.1',     verdict: 'accept' },
      { desc_fr: 'TCP 8.8.8.8 → 10.0.0.1:443',       desc_en: 'TCP 8.8.8.8 → 10.0.0.1:443',       verdict: 'accept' },
      { desc_fr: 'UDP 192.168.1.5 → 10.0.0.1:67',    desc_en: 'UDP 192.168.1.5 → 10.0.0.1:67',    verdict: 'deny'   },
      { desc_fr: 'TCP 192.168.0.50 → 10.0.0.1:3306', desc_en: 'TCP 192.168.0.50 → 10.0.0.1:3306', verdict: 'accept' },
    ]
  },
  {
    id: 'p_easy_3',
    rules_fr: [
      'AUTORISER : TCP ports 80, 443, 8080',
      'AUTORISER : ICMP depuis le LAN (10.0.0.0/8)',
      'BLOQUER : tout le reste',
    ],
    rules_en: [
      'ALLOW: TCP ports 80, 443, 8080',
      'ALLOW: ICMP from LAN (10.0.0.0/8)',
      'DENY: everything else',
    ],
    packets: [
      { desc_fr: 'TCP 172.16.0.1 → 10.0.0.1:80',    desc_en: 'TCP 172.16.0.1 → 10.0.0.1:80',    verdict: 'accept' },
      { desc_fr: 'TCP 192.168.1.1 → 10.0.0.1:8080',  desc_en: 'TCP 192.168.1.1 → 10.0.0.1:8080',  verdict: 'accept' },
      { desc_fr: 'TCP 10.0.5.2 → 10.0.0.1:443',     desc_en: 'TCP 10.0.5.2 → 10.0.0.1:443',     verdict: 'accept' },
      { desc_fr: 'ICMP 10.1.2.3 → 10.0.0.1',        desc_en: 'ICMP 10.1.2.3 → 10.0.0.1',        verdict: 'accept' },
      { desc_fr: 'ICMP 172.16.0.1 → 10.0.0.1',      desc_en: 'ICMP 172.16.0.1 → 10.0.0.1',      verdict: 'deny'   },
      { desc_fr: 'TCP 10.0.0.5 → 10.0.0.1:22',      desc_en: 'TCP 10.0.0.5 → 10.0.0.1:22',      verdict: 'deny'   },
      { desc_fr: 'UDP 10.0.0.5 → 10.0.0.1:53',      desc_en: 'UDP 10.0.0.5 → 10.0.0.1:53',      verdict: 'deny'   },
      { desc_fr: 'TCP 8.8.8.8 → 10.0.0.1:8080',     desc_en: 'TCP 8.8.8.8 → 10.0.0.1:8080',     verdict: 'accept' },
      { desc_fr: 'TCP 10.0.0.9 → 10.0.0.1:3389',    desc_en: 'TCP 10.0.0.9 → 10.0.0.1:3389',    verdict: 'deny'   },
      { desc_fr: 'TCP 172.16.0.2 → 10.0.0.1:443',   desc_en: 'TCP 172.16.0.2 → 10.0.0.1:443',   verdict: 'accept' },
    ]
  }
];

const FB_POLICIES_MEDIUM = [
  {
    id: 'p_medium_1',
    rules_fr: [
      'AUTORISER : TCP 443 entrant depuis INTERNET (> 192.168.0.0)',
      'AUTORISER : TCP 22 entrant depuis 10.0.0.0/8 seulement',
      'AUTORISER : UDP 53 sortant vers 8.8.8.8 ou 1.1.1.1',
      'BLOQUER : TCP 23 (Telnet) dans les deux sens',
      'BLOQUER : tout le reste',
    ],
    rules_en: [
      'ALLOW: TCP 443 inbound from INTERNET (not 192.168.x.x)',
      'ALLOW: TCP 22 inbound from 10.0.0.0/8 only',
      'ALLOW: UDP 53 outbound to 8.8.8.8 or 1.1.1.1',
      'DENY: TCP 23 (Telnet) in both directions',
      'DENY: everything else',
    ],
    packets: [
      { desc_fr: 'TCP IN 203.0.113.5 → srv:443',     desc_en: 'TCP IN 203.0.113.5 → srv:443',     verdict: 'accept' },
      { desc_fr: 'TCP IN 10.0.5.2 → srv:22',         desc_en: 'TCP IN 10.0.5.2 → srv:22',         verdict: 'accept' },
      { desc_fr: 'TCP IN 172.16.0.1 → srv:22',       desc_en: 'TCP IN 172.16.0.1 → srv:22',       verdict: 'deny'   },
      { desc_fr: 'UDP OUT srv → 8.8.8.8:53',         desc_en: 'UDP OUT srv → 8.8.8.8:53',         verdict: 'accept' },
      { desc_fr: 'UDP OUT srv → 9.9.9.9:53',         desc_en: 'UDP OUT srv → 9.9.9.9:53',         verdict: 'deny'   },
      { desc_fr: 'TCP IN 192.168.1.5 → srv:443',     desc_en: 'TCP IN 192.168.1.5 → srv:443',     verdict: 'deny'   },
      { desc_fr: 'TCP IN 10.0.0.3 → srv:23',         desc_en: 'TCP IN 10.0.0.3 → srv:23',         verdict: 'deny'   },
      { desc_fr: 'UDP OUT srv → 1.1.1.1:53',         desc_en: 'UDP OUT srv → 1.1.1.1:53',         verdict: 'accept' },
      { desc_fr: 'TCP IN 198.51.100.1 → srv:443',    desc_en: 'TCP IN 198.51.100.1 → srv:443',    verdict: 'accept' },
      { desc_fr: 'TCP IN 10.0.1.5 → srv:80',         desc_en: 'TCP IN 10.0.1.5 → srv:80',         verdict: 'deny'   },
      { desc_fr: 'TCP OUT srv → 203.0.113.5:23',     desc_en: 'TCP OUT srv → 203.0.113.5:23',     verdict: 'deny'   },
      { desc_fr: 'TCP IN 10.0.2.9 → srv:22',         desc_en: 'TCP IN 10.0.2.9 → srv:22',         verdict: 'accept' },
      { desc_fr: 'ICMP IN 203.0.113.5 → srv',        desc_en: 'ICMP IN 203.0.113.5 → srv',        verdict: 'deny'   },
      { desc_fr: 'TCP IN 203.0.113.8 → srv:8443',    desc_en: 'TCP IN 203.0.113.8 → srv:8443',    verdict: 'deny'   },
      { desc_fr: 'UDP OUT srv → 1.1.1.1:53',         desc_en: 'UDP OUT srv → 1.1.1.1:53',         verdict: 'accept' },
    ]
  },
  {
    id: 'p_medium_2',
    rules_fr: [
      'ZONE DMZ (172.16.0.0/24) → INTERNET : TCP 80, 443 autorisé',
      'ZONE LAN (192.168.0.0/24) → DMZ : TCP 22 autorisé',
      'INTERNET → DMZ : TCP 443 autorisé uniquement',
      'INTERNET → LAN : TOUT BLOQUÉ',
      'LAN → INTERNET : TOUT BLOQUÉ (pas de sortie directe)',
      'BLOQUER : tout le reste',
    ],
    rules_en: [
      'ZONE DMZ (172.16.0.0/24) → INTERNET: TCP 80, 443 allowed',
      'ZONE LAN (192.168.0.0/24) → DMZ: TCP 22 allowed',
      'INTERNET → DMZ: TCP 443 allowed only',
      'INTERNET → LAN: ALL BLOCKED',
      'LAN → INTERNET: ALL BLOCKED (no direct egress)',
      'DENY: everything else',
    ],
    packets: [
      { desc_fr: 'TCP 172.16.0.5 → 8.8.8.8:443',     desc_en: 'TCP 172.16.0.5 → 8.8.8.8:443',     verdict: 'accept' },
      { desc_fr: 'TCP 172.16.0.5 → 8.8.8.8:80',      desc_en: 'TCP 172.16.0.5 → 8.8.8.8:80',      verdict: 'accept' },
      { desc_fr: 'TCP 192.168.0.10 → 172.16.0.5:22', desc_en: 'TCP 192.168.0.10 → 172.16.0.5:22', verdict: 'accept' },
      { desc_fr: 'TCP 203.0.113.5 → 172.16.0.5:443', desc_en: 'TCP 203.0.113.5 → 172.16.0.5:443', verdict: 'accept' },
      { desc_fr: 'TCP 203.0.113.5 → 172.16.0.5:80',  desc_en: 'TCP 203.0.113.5 → 172.16.0.5:80',  verdict: 'deny'   },
      { desc_fr: 'TCP 203.0.113.5 → 192.168.0.10:80',desc_en: 'TCP 203.0.113.5 → 192.168.0.10:80',verdict: 'deny'   },
      { desc_fr: 'TCP 192.168.0.20 → 8.8.8.8:443',   desc_en: 'TCP 192.168.0.20 → 8.8.8.8:443',   verdict: 'deny'   },
      { desc_fr: 'TCP 172.16.0.8 → 8.8.8.8:22',      desc_en: 'TCP 172.16.0.8 → 8.8.8.8:22',      verdict: 'deny'   },
      { desc_fr: 'TCP 192.168.0.5 → 172.16.0.5:80',  desc_en: 'TCP 192.168.0.5 → 172.16.0.5:80',  verdict: 'deny'   },
      { desc_fr: 'TCP 203.0.113.9 → 172.16.0.5:443', desc_en: 'TCP 203.0.113.9 → 172.16.0.5:443', verdict: 'accept' },
      { desc_fr: 'UDP 192.168.0.1 → 8.8.8.8:53',     desc_en: 'UDP 192.168.0.1 → 8.8.8.8:53',     verdict: 'deny'   },
      { desc_fr: 'TCP 172.16.0.2 → 8.8.8.8:8080',    desc_en: 'TCP 172.16.0.2 → 8.8.8.8:8080',    verdict: 'deny'   },
      { desc_fr: 'TCP 192.168.0.15 → 172.16.0.3:22', desc_en: 'TCP 192.168.0.15 → 172.16.0.3:22', verdict: 'accept' },
      { desc_fr: 'TCP 203.0.113.1 → 192.168.0.5:22', desc_en: 'TCP 203.0.113.1 → 192.168.0.5:22', verdict: 'deny'   },
      { desc_fr: 'TCP 172.16.0.9 → 8.8.8.8:443',     desc_en: 'TCP 172.16.0.9 → 8.8.8.8:443',     verdict: 'accept' },
    ]
  }
];

const FB_POLICIES_HARD = [
  {
    id: 'p_hard_1',
    rules_fr: [
      'STATEFUL : connexions établies autorisées en retour automatiquement',
      'NAT : 192.168.0.0/24 traduit en 203.0.113.100 en sortie',
      'AUTORISER : TCP 443 entrant (public → DMZ 172.16.0.0/24)',
      'AUTORISER : TCP 22 entrant depuis 10.0.0.0/8 → ANY',
      'AUTORISER : UDP 53 sortant (DNS) vers 8.8.8.8 uniquement',
      'BLOQUER : ICMP entrant depuis INTERNET',
      'BLOQUER : TCP 23, 21 dans les deux sens',
      'BLOQUER : tout le reste',
    ],
    rules_en: [
      'STATEFUL: established connections automatically allowed back',
      'NAT: 192.168.0.0/24 translated to 203.0.113.100 outbound',
      'ALLOW: TCP 443 inbound (public → DMZ 172.16.0.0/24)',
      'ALLOW: TCP 22 inbound from 10.0.0.0/8 → ANY',
      'ALLOW: UDP 53 outbound DNS to 8.8.8.8 only',
      'DENY: ICMP inbound from INTERNET',
      'DENY: TCP 23, 21 both directions',
      'DENY: everything else',
    ],
    packets: [
      { desc_fr: 'TCP IN 203.0.113.5 → 172.16.0.5:443',           desc_en: 'TCP IN 203.0.113.5 → 172.16.0.5:443',           verdict: 'accept' },
      { desc_fr: 'TCP IN 10.0.5.2 → 10.0.0.1:22',                 desc_en: 'TCP IN 10.0.5.2 → 10.0.0.1:22',                 verdict: 'accept' },
      { desc_fr: 'TCP RETURN 203.0.113.5:443 → 203.0.113.100 (ESTABLISHED)', desc_en: 'TCP RETURN 203.0.113.5:443 → 203.0.113.100 (ESTABLISHED)', verdict: 'accept' },
      { desc_fr: 'ICMP IN 8.8.8.8 → 172.16.0.5',                  desc_en: 'ICMP IN 8.8.8.8 → 172.16.0.5',                  verdict: 'deny'   },
      { desc_fr: 'UDP OUT 192.168.0.10 → 8.8.8.8:53 (via NAT)',    desc_en: 'UDP OUT 192.168.0.10 → 8.8.8.8:53 (via NAT)',    verdict: 'accept' },
      { desc_fr: 'UDP OUT 192.168.0.10 → 9.9.9.9:53 (via NAT)',    desc_en: 'UDP OUT 192.168.0.10 → 9.9.9.9:53 (via NAT)',    verdict: 'deny'   },
      { desc_fr: 'TCP IN 172.16.0.8 → 10.0.0.1:21',               desc_en: 'TCP IN 172.16.0.8 → 10.0.0.1:21',               verdict: 'deny'   },
      { desc_fr: 'TCP OUT 192.168.0.5:22 → 203.0.113.100 (ESTABLISHED)', desc_en: 'TCP OUT 192.168.0.5:22 → 203.0.113.100 (ESTABLISHED)', verdict: 'accept' },
      { desc_fr: 'TCP IN 203.0.113.5 → 172.16.0.5:80',             desc_en: 'TCP IN 203.0.113.5 → 172.16.0.5:80',             verdict: 'deny'   },
      { desc_fr: 'TCP IN 172.16.5.5 → 10.0.0.1:22',               desc_en: 'TCP IN 172.16.5.5 → 10.0.0.1:22',               verdict: 'deny'   },
      { desc_fr: 'TCP IN 10.0.0.5 → 10.0.0.1:23',                 desc_en: 'TCP IN 10.0.0.5 → 10.0.0.1:23',                 verdict: 'deny'   },
      { desc_fr: 'TCP IN 203.0.113.2 → 172.16.0.2:443',           desc_en: 'TCP IN 203.0.113.2 → 172.16.0.2:443',           verdict: 'accept' },
      { desc_fr: 'UDP RETURN 8.8.8.8:53 → 203.0.113.100 (ESTABLISHED)', desc_en: 'UDP RETURN 8.8.8.8:53 → 203.0.113.100 (ESTABLISHED)', verdict: 'accept' },
      { desc_fr: 'TCP IN 203.0.113.9 → 172.16.0.5:8443',          desc_en: 'TCP IN 203.0.113.9 → 172.16.0.5:8443',          verdict: 'deny'   },
      { desc_fr: 'ICMP OUT 192.168.0.5 → 8.8.8.8',                desc_en: 'ICMP OUT 192.168.0.5 → 8.8.8.8',                verdict: 'deny'   },
      { desc_fr: 'TCP IN 10.0.1.1 → 192.168.0.5:22',              desc_en: 'TCP IN 10.0.1.1 → 192.168.0.5:22',              verdict: 'accept' },
      { desc_fr: 'TCP OUT 192.168.0.8:21 → 8.8.8.8 (via NAT)',    desc_en: 'TCP OUT 192.168.0.8:21 → 8.8.8.8 (via NAT)',    verdict: 'deny'   },
      { desc_fr: 'UDP OUT 192.168.0.12 → 1.1.1.1:53 (via NAT)',   desc_en: 'UDP OUT 192.168.0.12 → 1.1.1.1:53 (via NAT)',   verdict: 'deny'   },
      { desc_fr: 'TCP IN 10.0.8.3 → 172.16.0.5:22',               desc_en: 'TCP IN 10.0.8.3 → 172.16.0.5:22',               verdict: 'accept' },
      { desc_fr: 'TCP RETURN 203.0.113.5:443 → 203.0.113.101 (NEW)', desc_en: 'TCP RETURN 203.0.113.5:443 → 203.0.113.101 (NEW)', verdict: 'deny' },
    ]
  }
];

// ============================================================
// GAME STATE
// ============================================================

const fbState = {
  difficulty:    null,
  policy:        null,
  packets:       [],
  currentIdx:    0,
  score:         0,
  errors:        0,
  timeLeft:      0,
  timerInterval: null,
  packetTimeout: null,  // hard mode only: per-packet timer
  gameId:        'firewall-blitz',
};

// ============================================================
// HELPERS
// ============================================================

function fbShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fbPick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function fbGetLang() {
  return (typeof i18n !== 'undefined') ? i18n.getLang() : 'fr';
}

// ============================================================
// UI HELPERS
// ============================================================

function fbShow(id)    { const el = document.getElementById(id); if (el) el.style.display = ''; }
function fbHide(id)    { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

function fbUpdateHUD() {
  const min = String(Math.floor(fbState.timeLeft / 60)).padStart(2, '0');
  const sec = String(fbState.timeLeft % 60).padStart(2, '0');
  const timerEl = document.getElementById('fb-timer');
  if (timerEl) timerEl.textContent = `${min}:${sec}`;
  const errEl = document.getElementById('fb-errors');
  if (errEl) errEl.textContent = fbState.errors;
}

// ============================================================
// GAME INIT
// ============================================================

function fbStartGame(difficulty) {
  fbState.difficulty = difficulty;
  fbState.score      = 0;
  fbState.errors     = 0;
  fbState.currentIdx = 0;

  // Pick policy
  let pool;
  if (difficulty === 'easy')   pool = FB_POLICIES_EASY;
  if (difficulty === 'medium') pool = FB_POLICIES_MEDIUM;
  if (difficulty === 'hard')   pool = FB_POLICIES_HARD;
  fbState.policy = fbPick(pool);

  // Shuffle packets
  fbState.packets = fbShuffle(fbState.policy.packets);

  // Time limits
  if (difficulty === 'easy')   fbState.timeLeft = 90;
  if (difficulty === 'medium') fbState.timeLeft = 75;
  if (difficulty === 'hard')   fbState.timeLeft = 60;

  // Show screens
  fbHide('difficulty-screen');
  fbHide('result-screen');
  fbHide('score-entry-screen');
  fbHide('post-save-screen');
  fbShow('game-screen');

  fbRenderPolicy();
  fbRenderPacket();
  fbUpdateHUD();

  // Global countdown
  fbState.timerInterval = setInterval(() => {
    fbState.timeLeft--;
    fbUpdateHUD();
    if (fbState.timeLeft <= 0) {
      fbEndGame(false);
    }
  }, 1000);

  // Hard mode: per-packet timer bar
  if (difficulty === 'hard') {
    fbStartPacketTimer();
  }
}

// ============================================================
// POLICY RENDERING
// ============================================================

function fbRenderPolicy() {
  const lang = fbGetLang();
  const rules = lang === 'fr' ? fbState.policy.rules_fr : fbState.policy.rules_en;
  const container = document.getElementById('fb-policy');
  if (!container) return;
  container.innerHTML = rules.map(r => `<li class="fb-rule">${r}</li>`).join('');
}

// ============================================================
// PACKET RENDERING
// ============================================================

function fbRenderPacket() {
  const lang = fbGetLang();
  const pkt = fbState.packets[fbState.currentIdx];
  const el = document.getElementById('fb-packet');
  if (!el || !pkt) return;
  el.textContent = lang === 'fr' ? pkt.desc_fr : pkt.desc_en;

  // Progress
  const prog = document.getElementById('fb-progress');
  if (prog) prog.textContent = `${fbState.currentIdx + 1} / ${fbState.packets.length}`;

  // Reset button states
  document.querySelectorAll('.fb-verdict-btn').forEach(btn => {
    btn.classList.remove('fb-verdict-btn--accept', 'fb-verdict-btn--deny', 'fb-verdict-btn--correct', 'fb-verdict-btn--wrong');
    btn.disabled = false;
  });

  // Reset packet timer bar
  const bar = document.getElementById('fb-packet-bar');
  if (bar) bar.style.width = '100%';
}

// ============================================================
// VERDICT
// ============================================================

function fbOnVerdict(verdict) {
  const pkt = fbState.packets[fbState.currentIdx];
  if (!pkt) return;

  // Disable buttons immediately
  document.querySelectorAll('.fb-verdict-btn').forEach(btn => btn.disabled = true);

  // Cancel per-packet timer if any
  if (fbState.packetTimeout) {
    clearTimeout(fbState.packetTimeout);
    fbState.packetTimeout = null;
  }

  const correct = verdict === pkt.verdict;
  const acceptBtn = document.getElementById('fb-btn-accept');
  const denyBtn   = document.getElementById('fb-btn-deny');

  if (correct) {
    // Points: 100 base, bonus in hard for speed
    let pts = 100;
    if (fbState.difficulty === 'hard') pts = 150;
    if (fbState.difficulty === 'medium') pts = 120;
    fbState.score += pts;

    if (verdict === 'accept' && acceptBtn) acceptBtn.classList.add('fb-verdict-btn--correct');
    if (verdict === 'deny'   && denyBtn)   denyBtn.classList.add('fb-verdict-btn--correct');
  } else {
    fbState.errors++;
    fbState.score = Math.max(0, fbState.score - 80);

    // Highlight correct answer and wrong one
    if (verdict === 'accept' && acceptBtn) acceptBtn.classList.add('fb-verdict-btn--wrong');
    if (verdict === 'deny'   && denyBtn)   denyBtn.classList.add('fb-verdict-btn--wrong');
    if (pkt.verdict === 'accept' && acceptBtn) acceptBtn.classList.add('fb-verdict-btn--correct');
    if (pkt.verdict === 'deny'   && denyBtn)   denyBtn.classList.add('fb-verdict-btn--correct');

    // Time penalty
    fbState.timeLeft = Math.max(0, fbState.timeLeft - 5);
    fbUpdateHUD();
  }

  fbUpdateHUD();

  // Advance
  setTimeout(() => {
    fbState.currentIdx++;
    if (fbState.currentIdx >= fbState.packets.length) {
      fbEndGame(true);
    } else {
      fbRenderPacket();
      if (fbState.difficulty === 'hard') fbStartPacketTimer();
    }
  }, 700);
}

// ============================================================
// PER-PACKET TIMER (hard only)
// ============================================================

function fbStartPacketTimer() {
  const LIMIT = 8000; // 8 seconds per packet
  const bar   = document.getElementById('fb-packet-bar');
  const start = Date.now();

  function tick() {
    const elapsed = Date.now() - start;
    const pct = Math.max(0, 100 - (elapsed / LIMIT) * 100);
    if (bar) bar.style.width = pct + '%';
    if (elapsed >= LIMIT) {
      // Time out on this packet: treat as wrong
      fbOnVerdict(fbState.packets[fbState.currentIdx].verdict === 'accept' ? 'deny' : 'accept');
    } else {
      fbState.packetTimeout = setTimeout(tick, 50);
    }
  }
  fbState.packetTimeout = setTimeout(tick, 50);
}

// ============================================================
// END GAME
// ============================================================

function fbEndGame(completed) {
  clearInterval(fbState.timerInterval);
  if (fbState.packetTimeout) clearTimeout(fbState.packetTimeout);

  // Speed bonus
  if (completed) {
    fbState.score += fbState.timeLeft * 5;
  }
  fbState.score = Math.max(0, fbState.score);

  fbHide('game-screen');
  fbShow('result-screen');

  const titleEl = document.getElementById('result-title');
  const scoreEl = document.getElementById('result-score');
  if (titleEl) titleEl.textContent = i18n.t(completed ? 'victory' : 'game_over');
  if (scoreEl) scoreEl.textContent = String(fbState.score).padStart(6, '0');
}

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // Difficulty buttons
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => {
      fbStartGame(btn.dataset.difficulty);
    });
  });

  // ACCEPT / DENY buttons
  const acceptBtn = document.getElementById('fb-btn-accept');
  const denyBtn   = document.getElementById('fb-btn-deny');
  if (acceptBtn) acceptBtn.addEventListener('click', () => fbOnVerdict('accept'));
  if (denyBtn)   denyBtn.addEventListener('click',   () => fbOnVerdict('deny'));

  // Result screen
  const saveBtn = document.getElementById('save-score-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    fbHide('result-screen');
    fbShow('score-entry-screen');
    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        fbState.initials = initials;
        scores.saveScore(initials, fbState.gameId, fbState.difficulty, fbState.score);
        if (typeof checkRewards === 'function') checkRewards();
        fbHide('score-entry-screen');
        fbShow('post-save-screen');
      }
    );
  });

  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
    fbHide('result-screen');
    fbShow('difficulty-screen');
  });

  const postSavePlayAgain = document.getElementById('post-save-play-again-btn');
  if (postSavePlayAgain) postSavePlayAgain.addEventListener('click', () => {
    fbHide('post-save-screen');
    fbShow('difficulty-screen');
  });

  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) captureBtn.addEventListener('click', () => {
    ticket.generate({
      initials:   fbState.initials || 'AAA',
      game:       i18n.t('game_firewall_blitz'),
      difficulty: fbState.difficulty,
      score:      fbState.score,
      topScore:   1500
    });
  });

  // Language change
  document.addEventListener('langChange', () => {
    if (fbState.policy) fbRenderPolicy();
    if (fbState.packets[fbState.currentIdx]) fbRenderPacket();
  });
});
