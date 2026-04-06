/**
 * vlan-master.js — VLAN Master game logic
 *
 * The player is given a network policy and must correctly configure
 * switch ports (access vs trunk, VLAN assignment, native VLAN, allowed VLANs).
 *
 * Difficulty:
 *   easy   — single switch, 4 ports, simple access port assignment
 *   medium — single switch, 6 ports, mix of access + trunk, native VLAN
 *   hard   — multi-switch topology, inter-VLAN routing, trunk allowed lists,
 *             mismatch errors to find, timer
 *
 * Score: 1400 base - (errors * 100) + (timeLeft * 6)
 */

// ============================================================
// SCENARIO DEFINITIONS
// ============================================================

const VM_SCENARIOS_EASY = [
  {
    id: 'easy_office',
    title_fr: 'Bureau : segmentation VLAN simple',
    title_en:  'Office: simple VLAN segmentation',
    policy_fr: [
      'VLAN 10 = EMPLOYES (PC bureautique)',
      'VLAN 20 = SERVEURS (serveurs internes)',
      'VLAN 30 = INVITES (WiFi invités)',
      'Chaque port est un port ACCESS sur un seul VLAN.',
    ],
    policy_en: [
      'VLAN 10 = EMPLOYEES (office PCs)',
      'VLAN 20 = SERVERS (internal servers)',
      'VLAN 30 = GUESTS (guest WiFi)',
      'Each port is an ACCESS port on a single VLAN.',
    ],
    ports: [
      { id: 'Fa0/1', device_fr: 'PC-RH (Ressources Humaines)',   device_en: 'PC-HR (Human Resources)',   correct_vlan: 10, correct_mode: 'access' },
      { id: 'Fa0/2', device_fr: 'PC-COMPTA (Comptabilite)',       device_en: 'PC-ACCT (Accounting)',       correct_vlan: 10, correct_mode: 'access' },
      { id: 'Fa0/3', device_fr: 'Serveur de fichiers',            device_en: 'File server',                correct_vlan: 20, correct_mode: 'access' },
      { id: 'Fa0/4', device_fr: 'Borne WiFi invites',             device_en: 'Guest WiFi access point',    correct_vlan: 30, correct_mode: 'access' },
    ],
    vlans: [10, 20, 30],
    modes: ['access'],
  },
  {
    id: 'easy_dev',
    title_fr: 'Dev / Prod : isolation des environnements',
    title_en:  'Dev / Prod: environment isolation',
    policy_fr: [
      'VLAN 100 = PRODUCTION (serveurs prod)',
      'VLAN 200 = DEVELOPPEMENT (postes devs)',
      'VLAN 300 = MANAGEMENT (switches, routeurs)',
      'Chaque port est un port ACCESS.',
    ],
    policy_en: [
      'VLAN 100 = PRODUCTION (prod servers)',
      'VLAN 200 = DEVELOPMENT (dev workstations)',
      'VLAN 300 = MANAGEMENT (switches, routers)',
      'Each port is an ACCESS port.',
    ],
    ports: [
      { id: 'Gi0/1', device_fr: 'Serveur Web PROD',   device_en: 'PROD Web server',      correct_vlan: 100, correct_mode: 'access' },
      { id: 'Gi0/2', device_fr: 'Serveur BDD PROD',   device_en: 'PROD DB server',       correct_vlan: 100, correct_mode: 'access' },
      { id: 'Gi0/3', device_fr: 'Poste Developpeur A', device_en: 'Developer workstation A', correct_vlan: 200, correct_mode: 'access' },
      { id: 'Gi0/4', device_fr: 'Poste Developpeur B', device_en: 'Developer workstation B', correct_vlan: 200, correct_mode: 'access' },
      { id: 'Gi0/5', device_fr: 'Interface mgmt switch', device_en: 'Switch mgmt interface', correct_vlan: 300, correct_mode: 'access' },
    ],
    vlans: [100, 200, 300],
    modes: ['access'],
  },
];

const VM_SCENARIOS_MEDIUM = [
  {
    id: 'medium_trunk',
    title_fr: 'Switch avec trunk vers routeur (Router-on-a-Stick)',
    title_en:  'Switch with trunk to router (Router-on-a-Stick)',
    policy_fr: [
      'VLAN 10 = EMPLOYES, VLAN 20 = INVITES, VLAN 99 = NATIF (management)',
      'Ports PC : ACCESS sur VLAN 10',
      'Port WiFi : ACCESS sur VLAN 20',
      'Port vers Routeur : TRUNK, Native VLAN 99, autorise VLAN 10+20',
      'Port uplink vers switch superieur : TRUNK, Native VLAN 99, tous VLANs',
    ],
    policy_en: [
      'VLAN 10 = EMPLOYEES, VLAN 20 = GUESTS, VLAN 99 = NATIVE (management)',
      'PC ports: ACCESS on VLAN 10',
      'WiFi port: ACCESS on VLAN 20',
      'Uplink to Router: TRUNK, Native VLAN 99, allowed VLAN 10+20',
      'Uplink to upper switch: TRUNK, Native VLAN 99, all VLANs',
    ],
    ports: [
      { id: 'Fa0/1', device_fr: 'PC Employe A',          device_en: 'Employee PC A',        correct_vlan: 10,  correct_mode: 'access',  native: null,    allowed: null },
      { id: 'Fa0/2', device_fr: 'PC Employe B',          device_en: 'Employee PC B',        correct_vlan: 10,  correct_mode: 'access',  native: null,    allowed: null },
      { id: 'Fa0/3', device_fr: 'Borne WiFi Invites',    device_en: 'Guest WiFi AP',        correct_vlan: 20,  correct_mode: 'access',  native: null,    allowed: null },
      { id: 'Gi0/1', device_fr: 'Routeur (sous-interfaces)', device_en: 'Router (subinterfaces)', correct_vlan: null, correct_mode: 'trunk', native: 99, allowed: '10,20' },
      { id: 'Gi0/2', device_fr: 'Switch Distribution',   device_en: 'Distribution switch',  correct_vlan: null, correct_mode: 'trunk',   native: 99,  allowed: 'all' },
    ],
    vlans: [10, 20, 99],
    modes: ['access', 'trunk'],
    show_native: true,
    show_allowed: true,
  },
  {
    id: 'medium_voip',
    title_fr: 'VoIP : VLAN voix separe du VLAN donnees',
    title_en:  'VoIP: voice VLAN separate from data VLAN',
    policy_fr: [
      'VLAN 10 = DONNEES (PC)',
      'VLAN 20 = VOIX (telephones IP)',
      'VLAN 99 = NATIF',
      'Ports telephone : ACCESS VLAN 20 (data), voice VLAN 10 — dual-mode',
      'Port serveur de comm : ACCESS VLAN 20',
      'Uplink vers coeur : TRUNK, native 99, autorise 10+20',
    ],
    policy_en: [
      'VLAN 10 = DATA (PCs)',
      'VLAN 20 = VOICE (IP phones)',
      'VLAN 99 = NATIVE',
      'Phone ports: ACCESS VLAN 10 (data), voice VLAN 20 — dual-mode',
      'Comm server port: ACCESS VLAN 20',
      'Uplink to core: TRUNK, native 99, allowed 10+20',
    ],
    ports: [
      { id: 'Fa0/1', device_fr: 'Telephone IP + PC',   device_en: 'IP Phone + PC',       correct_vlan: 10,   correct_mode: 'access',  native: null, allowed: null },
      { id: 'Fa0/2', device_fr: 'Telephone IP + PC',   device_en: 'IP Phone + PC',       correct_vlan: 10,   correct_mode: 'access',  native: null, allowed: null },
      { id: 'Fa0/3', device_fr: 'Serveur de comm',     device_en: 'Communications server', correct_vlan: 20, correct_mode: 'access',  native: null, allowed: null },
      { id: 'Gi0/1', device_fr: 'Switch Coeur',        device_en: 'Core switch',          correct_vlan: null, correct_mode: 'trunk',   native: 99,   allowed: '10,20' },
    ],
    vlans: [10, 20, 99],
    modes: ['access', 'trunk'],
    show_native: true,
    show_allowed: true,
  },
];

const VM_SCENARIOS_HARD = [
  {
    id: 'hard_multisw',
    title_fr: 'Multi-switch : trouver les erreurs de configuration',
    title_en:  'Multi-switch: find the configuration errors',
    policy_fr: [
      'Topologie : SW-ACCES → SW-DISTRIB → Routeur',
      'VLAN 10 = RH, VLAN 20 = INFO, VLAN 30 = DIRECTION, VLAN 99 = NATIF',
      'SW-ACCES : ports PC en access, uplink vers SW-DISTRIB en trunk (native 99)',
      'SW-DISTRIB : tous trunks, native 99, uplink vers Routeur autorise 10+20+30',
      'PROBLEME : identifier les 3 ports mal configures dans la liste ci-dessous.',
    ],
    policy_en: [
      'Topology: SW-ACCESS → SW-DISTRIB → Router',
      'VLAN 10 = HR, VLAN 20 = IT, VLAN 30 = EXEC, VLAN 99 = NATIVE',
      'SW-ACCESS: PC ports in access mode, uplink to SW-DISTRIB in trunk (native 99)',
      'SW-DISTRIB: all trunks, native 99, uplink to Router allowed 10+20+30',
      'ISSUE: find the 3 misconfigured ports in the list below.',
    ],
    ports: [
      { id: 'SW-ACC Fa0/1',  device_fr: 'PC-RH',              device_en: 'HR-PC',            correct_vlan: 10,  correct_mode: 'access', native: null, allowed: null, has_error: false },
      { id: 'SW-ACC Fa0/2',  device_fr: 'PC-RH (ERREUR: VLAN 20)', device_en: 'HR-PC (ERROR: VLAN 20)', correct_vlan: 10, correct_mode: 'access', native: null, allowed: null, has_error: true,  error_type: 'wrong_vlan' },
      { id: 'SW-ACC Fa0/3',  device_fr: 'PC-INFO',             device_en: 'IT-PC',            correct_vlan: 20,  correct_mode: 'access', native: null, allowed: null, has_error: false },
      { id: 'SW-ACC Gi0/1',  device_fr: 'Uplink SW-DISTRIB (ERREUR: native 1)', device_en: 'Uplink SW-DISTRIB (ERROR: native 1)', correct_vlan: null, correct_mode: 'trunk', native: 99, allowed: 'all', has_error: true, error_type: 'wrong_native' },
      { id: 'SW-DIS Gi0/1',  device_fr: 'Uplink SW-ACCES',    device_en: 'Uplink SW-ACCESS', correct_vlan: null, correct_mode: 'trunk',  native: 99, allowed: 'all', has_error: false },
      { id: 'SW-DIS Gi0/2',  device_fr: 'Uplink Routeur (ERREUR: autorise 10 seulement)', device_en: 'Uplink Router (ERROR: allowed 10 only)', correct_vlan: null, correct_mode: 'trunk', native: 99, allowed: '10,20,30', has_error: true, error_type: 'wrong_allowed' },
    ],
    vlans: [10, 20, 30, 99],
    modes: ['access', 'trunk'],
    show_native: true,
    show_allowed: true,
    error_mode: true,  // player must identify misconfigs
    error_count: 3,
  },
  {
    id: 'hard_stp',
    title_fr: 'STP + VLAN : Spanning Tree et boucles',
    title_en:  'STP + VLAN: Spanning Tree and loops',
    policy_fr: [
      'Topologie : 3 switches en triangle (SW1, SW2, SW3)',
      'STP PVST+ actif par VLAN',
      'VLAN 10 : SW1 = Root, port SW3-SW2 = BLOQUE',
      'VLAN 20 : SW2 = Root, port SW1-SW3 = BLOQUE',
      'PROBLEME : identifier les ports qui doivent etre en etat BLOCKING pour chaque VLAN.',
    ],
    policy_en: [
      'Topology: 3 switches in triangle (SW1, SW2, SW3)',
      'STP PVST+ active per VLAN',
      'VLAN 10: SW1 = Root, SW3-SW2 port = BLOCKED',
      'VLAN 20: SW2 = Root, SW1-SW3 port = BLOCKED',
      'ISSUE: identify ports that must be in BLOCKING state for each VLAN.',
    ],
    ports: [
      { id: 'SW1-SW2 Gi0/1', device_fr: 'Liaison SW1 → SW2 (VLAN 10)',  device_en: 'Link SW1 → SW2 (VLAN 10)',  correct_vlan: null, correct_mode: 'trunk', native: 99, allowed: '10,20', stp_state_vlan10: 'forwarding', stp_state_vlan20: 'forwarding', has_error: false },
      { id: 'SW1-SW3 Gi0/2', device_fr: 'Liaison SW1 → SW3 (VLAN 20)',  device_en: 'Link SW1 → SW3 (VLAN 20)',  correct_vlan: null, correct_mode: 'trunk', native: 99, allowed: '10,20', stp_state_vlan10: 'forwarding', stp_state_vlan20: 'blocking', has_error: false },
      { id: 'SW2-SW3 Gi0/1', device_fr: 'Liaison SW2 → SW3 (VLAN 10)',  device_en: 'Link SW2 → SW3 (VLAN 10)',  correct_vlan: null, correct_mode: 'trunk', native: 99, allowed: '10,20', stp_state_vlan10: 'blocking', stp_state_vlan20: 'forwarding', has_error: false },
      { id: 'SW3-Acc Fa0/1', device_fr: 'PC EMPLOYE (VLAN 10)',          device_en: 'EMPLOYEE PC (VLAN 10)',      correct_vlan: 10, correct_mode: 'access', native: null, allowed: null, has_error: false },
      { id: 'SW3-Acc Fa0/2', device_fr: 'PC INVITES (VLAN 20)',          device_en: 'GUEST PC (VLAN 20)',         correct_vlan: 20, correct_mode: 'access', native: null, allowed: null, has_error: false },
    ],
    vlans: [10, 20, 99],
    modes: ['access', 'trunk'],
    show_native: true,
    show_allowed: true,
    stp_mode: true,
  },
];

// ============================================================
// GAME STATE
// ============================================================

const vmState = {
  difficulty:    null,
  scenario:      null,
  // playerConfig: array of { vlan, mode, native, allowed } indexed by port
  playerConfig:  [],
  score:         0,
  errors:        0,
  timeLeft:      0,
  timerInterval: null,
  gameId:        'vlan-master',
  validated:     false,
  initials:      null,
};

// ============================================================
// HELPERS
// ============================================================

function vmGetLang() {
  return (typeof i18n !== 'undefined') ? i18n.getLang() : 'fr';
}

function vmShow(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function vmHide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

function vmUpdateHUD() {
  const min = String(Math.floor(vmState.timeLeft / 60)).padStart(2, '0');
  const sec = String(vmState.timeLeft % 60).padStart(2, '0');
  const t = document.getElementById('vm-timer'); if (t) t.textContent = `${min}:${sec}`;
  const e = document.getElementById('vm-errors'); if (e) e.textContent = vmState.errors;
}

// ============================================================
// INIT
// ============================================================

function vmStartGame(difficulty) {
  vmState.difficulty  = difficulty;
  vmState.score       = 0;
  vmState.errors      = 0;
  vmState.validated   = false;

  const pool = difficulty === 'easy'   ? VM_SCENARIOS_EASY :
               difficulty === 'medium' ? VM_SCENARIOS_MEDIUM : VM_SCENARIOS_HARD;
  vmState.scenario = pool[Math.floor(Math.random() * pool.length)];

  // Init player config with nulls
  vmState.playerConfig = vmState.scenario.ports.map(() => ({
    mode:    null,
    vlan:    null,
    native:  null,
    allowed: null,
    flagged: false,   // hard error-mode: player flagged this as misconfig
  }));

  if (difficulty === 'easy')   vmState.timeLeft = 0;
  if (difficulty === 'medium') vmState.timeLeft = 120;
  if (difficulty === 'hard')   vmState.timeLeft = 90;

  vmHide('difficulty-screen');
  vmHide('result-screen');
  vmHide('score-entry-screen');
  vmHide('post-save-screen');
  vmShow('game-screen');

  vmRender();
  vmUpdateHUD();

  if (difficulty !== 'easy') {
    vmState.timerInterval = setInterval(() => {
      vmState.timeLeft--;
      vmUpdateHUD();
      if (vmState.timeLeft <= 0) vmEndGame(false);
    }, 1000);
  }
}

// ============================================================
// RENDER
// ============================================================

function vmRender() {
  const lang     = vmGetLang();
  const scenario = vmState.scenario;
  const isError  = !!scenario.error_mode;
  const isSTP    = !!scenario.stp_mode;

  // Policy
  const titleEl = document.getElementById('vm-title');
  if (titleEl) titleEl.textContent = lang === 'fr' ? scenario.title_fr : scenario.title_en;
  const policyEl = document.getElementById('vm-policy');
  if (policyEl) {
    const rules = lang === 'fr' ? scenario.policy_fr : scenario.policy_en;
    policyEl.innerHTML = rules.map(r => `<li class="vm-rule">${r}</li>`).join('');
  }

  // Ports table
  const tableEl = document.getElementById('vm-ports-table');
  if (!tableEl) return;

  const showNative  = !!scenario.show_native;
  const showAllowed = !!scenario.show_allowed;

  let headerCols = `<th>PORT</th><th>${lang === 'fr' ? 'EQUIPEMENT' : 'DEVICE'}</th><th>MODE</th>`;
  if (!isError) headerCols += `<th>VLAN</th>`;
  if (showNative  && !isError) headerCols += `<th>NATIF</th>`;
  if (showAllowed && !isError) headerCols += `<th>AUTORISE</th>`;
  if (isError) headerCols += `<th>${lang === 'fr' ? 'ERREUR ?' : 'ERROR?'}</th>`;
  if (isSTP)   headerCols += `<th>STP V10</th><th>STP V20</th>`;

  const rows = scenario.ports.map((port, idx) => {
    const cfg = vmState.playerConfig[idx];
    const deviceLabel = lang === 'fr' ? port.device_fr : port.device_en;

    let cells = `<td class="vm-port-id">${port.id}</td><td class="vm-device">${deviceLabel}</td>`;

    if (isError) {
      // Error-finding mode: player marks ports as misconfig
      const checked = cfg.flagged ? 'checked' : '';
      cells += `<td>
        <select class="vm-select" data-idx="${idx}" data-field="mode">
          <option value="">--</option>
          ${scenario.modes.map(m => `<option value="${m}" ${cfg.mode === m ? 'selected' : ''}>${m.toUpperCase()}</option>`).join('')}
        </select>
      </td>`;
      cells += `<td><label class="vm-flag-label"><input type="checkbox" class="vm-flag-cb" data-idx="${idx}" ${checked}> FLAG</label></td>`;
    } else {
      // Normal mode: player picks mode, vlan, optionally native/allowed
      cells += `<td>
        <select class="vm-select" data-idx="${idx}" data-field="mode">
          <option value="">--</option>
          ${scenario.modes.map(m => `<option value="${m}" ${cfg.mode === m ? 'selected' : ''}>${m.toUpperCase()}</option>`).join('')}
        </select>
      </td>`;

      cells += `<td>
        <select class="vm-select vm-select--vlan" data-idx="${idx}" data-field="vlan">
          <option value="">--</option>
          ${scenario.vlans.map(v => `<option value="${v}" ${cfg.vlan == v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </td>`;

      if (showNative) {
        cells += `<td>
          <select class="vm-select vm-select--vlan" data-idx="${idx}" data-field="native">
            <option value="">--</option>
            ${scenario.vlans.map(v => `<option value="${v}" ${cfg.native == v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </td>`;
      }

      if (showAllowed) {
        // Simple text choices for allowed VLAN list
        const allowedChoices = ['all', ...scenario.vlans.map(v => v.toString()),
          scenario.vlans.slice(0,2).join(','), scenario.vlans.slice(0,3).join(',')];
        const uniqueChoices = [...new Set(allowedChoices)];
        cells += `<td>
          <select class="vm-select" data-idx="${idx}" data-field="allowed">
            <option value="">--</option>
            ${uniqueChoices.map(c => `<option value="${c}" ${cfg.allowed === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </td>`;
      }
    }

    if (isSTP) {
      const stpChoices = ['forwarding', 'blocking'];
      cells += `<td>
        <select class="vm-select vm-select--stp" data-idx="${idx}" data-field="stp10">
          <option value="">--</option>
          ${stpChoices.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('')}
        </select>
      </td>`;
      cells += `<td>
        <select class="vm-select vm-select--stp" data-idx="${idx}" data-field="stp20">
          <option value="">--</option>
          ${stpChoices.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('')}
        </select>
      </td>`;
    }

    return `<tr id="vm-row-${idx}" class="vm-row">${cells}</tr>`;
  }).join('');

  tableEl.innerHTML = `
    <table class="vm-table" role="table">
      <thead><tr>${headerCols}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  vmAttachEvents();

  // Feedback reset
  const fb = document.getElementById('vm-feedback');
  if (fb) { fb.textContent = ''; fb.className = 'vm-feedback'; }
}

// ============================================================
// EVENTS
// ============================================================

function vmAttachEvents() {
  document.querySelectorAll('.vm-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const idx   = parseInt(sel.dataset.idx, 10);
      const field = sel.dataset.field;
      vmState.playerConfig[idx][field] = sel.value || null;
    });
  });

  document.querySelectorAll('.vm-flag-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const idx = parseInt(cb.dataset.idx, 10);
      vmState.playerConfig[idx].flagged = cb.checked;
    });
  });
}

// ============================================================
// VALIDATE
// ============================================================

function vmValidate() {
  const lang     = vmGetLang();
  const scenario = vmState.scenario;
  const isError  = !!scenario.error_mode;
  const isSTP    = !!scenario.stp_mode;

  let correct = 0;
  let total   = scenario.ports.length;
  const wrongIdxs = [];

  scenario.ports.forEach((port, idx) => {
    const cfg = vmState.playerConfig[idx];
    let portOk = true;

    if (isError) {
      // Player must flag ports with has_error === true
      if (cfg.flagged !== !!port.has_error) portOk = false;
    } else if (isSTP) {
      if (port.stp_state_vlan10 && cfg.stp10 !== port.stp_state_vlan10) portOk = false;
      if (port.stp_state_vlan20 && cfg.stp20 !== port.stp_state_vlan20) portOk = false;
      if (cfg.mode !== port.correct_mode) portOk = false;
    } else {
      if (cfg.mode !== port.correct_mode) portOk = false;
      if (port.correct_mode === 'access' && String(cfg.vlan) !== String(port.correct_vlan)) portOk = false;
      if (port.correct_mode === 'trunk') {
        if (scenario.show_native && port.native !== null && String(cfg.native) !== String(port.native)) portOk = false;
        if (scenario.show_allowed && port.allowed !== null && cfg.allowed !== port.allowed) portOk = false;
      }
    }

    if (portOk) {
      correct++;
      const row = document.getElementById(`vm-row-${idx}`);
      if (row) row.classList.add('vm-row--correct');
    } else {
      wrongIdxs.push(idx);
      const row = document.getElementById(`vm-row-${idx}`);
      if (row) row.classList.add('vm-row--wrong');
    }
  });

  if (correct === total) {
    clearInterval(vmState.timerInterval);
    const base = vmState.difficulty === 'hard' ? 1400 :
                 vmState.difficulty === 'medium' ? 1200 : 1000;
    vmState.score = Math.max(0, base - (vmState.errors * 100) + (vmState.timeLeft * 6));
    vmEndGame(true);
  } else {
    vmState.errors++;
    vmUpdateHUD();

    if (vmState.difficulty !== 'easy') {
      vmState.timeLeft = Math.max(0, vmState.timeLeft - 10);
      vmUpdateHUD();
    }

    const fb = document.getElementById('vm-feedback');
    if (fb) {
      fb.textContent = lang === 'fr'
        ? `${wrongIdxs.length} port(s) incorrect(s). Corrigez et revalidez.`
        : `${wrongIdxs.length} port(s) incorrect. Fix and revalidate.`;
      fb.className = 'vm-feedback vm-feedback--error';
    }

    // Clear wrong highlight after 1s so player can correct
    setTimeout(() => {
      wrongIdxs.forEach(idx => {
        const row = document.getElementById(`vm-row-${idx}`);
        if (row) row.classList.remove('vm-row--wrong');
      });
    }, 1200);

    // Clear correct highlight too
    document.querySelectorAll('.vm-row--correct').forEach(r => r.classList.remove('vm-row--correct'));
  }
}

// ============================================================
// END GAME
// ============================================================

function vmEndGame(completed) {
  clearInterval(vmState.timerInterval);
  if (!completed) vmState.score = Math.max(0, 150 - vmState.errors * 50);

  vmHide('game-screen');
  vmShow('result-screen');

  const titleEl = document.getElementById('result-title');
  const scoreEl = document.getElementById('result-score');
  if (titleEl) titleEl.textContent = i18n.t(completed ? 'victory' : 'game_over');
  if (scoreEl) scoreEl.textContent = String(vmState.score).padStart(6, '0');
}

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => vmStartGame(btn.dataset.difficulty));
  });

  const validateBtn = document.getElementById('vm-validate-btn');
  if (validateBtn) validateBtn.addEventListener('click', vmValidate);

  const saveBtn = document.getElementById('save-score-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    vmHide('result-screen');
    vmShow('score-entry-screen');
    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        vmState.initials = initials;
        scores.saveScore(initials, vmState.gameId, vmState.difficulty, vmState.score);
        if (typeof checkRewards === 'function') checkRewards();
        vmHide('score-entry-screen');
        vmShow('post-save-screen');
      }
    );
  });

  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
    vmHide('result-screen');
    vmShow('difficulty-screen');
  });

  const postSavePlayAgain = document.getElementById('post-save-play-again-btn');
  if (postSavePlayAgain) postSavePlayAgain.addEventListener('click', () => {
    vmHide('post-save-screen');
    vmShow('difficulty-screen');
  });

  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) captureBtn.addEventListener('click', () => {
    if (typeof ticket !== 'undefined' && typeof ticket.generate === 'function') {
      ticket.generate({
        initials:   vmState.initials || 'AAA',
        game:       i18n.t('game_vlan_master'),
        difficulty: vmState.difficulty,
        score:      vmState.score,
        topScore:   1400
      });
    }
  });

  document.addEventListener('langChange', () => {
    if (vmState.scenario) vmRender();
  });
});
