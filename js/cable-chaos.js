/**
 * cable-chaos.js — Cable Chaos game logic
 *
 * Scenarios are generated procedurally each game — never the same twice.
 * The generator picks device topologies from a pool, assigns random labels,
 * shuffles positions, and derives the correct cable for each connection
 * from the device type pair rule table.
 *
 * Cable type rules (always applied consistently):
 *   straight  — different OSI-layer device types (PC/Server/Printer/AP -> Switch/Router/Firewall)
 *   crossover — same device category (PC-PC, Switch-Switch, Router-Router, Server-Server)
 *   fiber     — long-distance backbone: Switch-Switch over explicit backbone flag
 *   console   — PC/Laptop (admin role) -> Router or Switch console port
 *   sfp       — SFP-capable uplink between switches or switch-router in datacenter context
 *
 * Difficulty:
 *   easy   — 3-4 connections, straight/crossover/console only, hints shown, no timer
 *   medium — 5-6 connections, all cable types possible, no timer
 *   hard   — 7-9 connections, all cable types, 90s countdown, device labels abbreviated
 */

// ============================================================
// DEVICE TYPE DEFINITIONS
// ============================================================

// Device categories — used to derive cable type from the rule table
const DEV_CATEGORY = {
  pc:       'host',     // end device, OSI L1
  laptop:   'host',
  printer:  'host',
  server:   'host',
  ap:       'host',     // AP connects like a host to switch
  switch:   'switch',   // OSI L2
  router:   'router',   // OSI L3
  firewall: 'router'    // treated as router-level for cable purposes
};

const DEVICE_ICONS = {
  pc:       '&#x1F4BB;',
  laptop:   '&#x1F4BB;',
  printer:  '&#x1F5A8;',
  server:   '&#x1F5A5;',
  ap:       '&#x1F4F6;',
  switch:   '&#x1F500;',
  router:   '&#x1F310;',
  firewall: '&#x1F6E1;'
};

// Label pools for each device type (FR / EN)
const DEVICE_LABELS = {
  pc:       { fr: ['PC-1','PC-2','PC-3','POSTE-A','POSTE-B','POSTE-C','BUREAU-1','BUREAU-2'],
              en: ['PC-1','PC-2','PC-3','WORKST-A','WORKST-B','WORKST-C','DESK-1','DESK-2'] },
  laptop:   { fr: ['LAPTOP-ADM','PORTABLE-1','PORTABLE-2','PC ADMIN','MGMT'],
              en: ['LAPTOP-ADM','LAPTOP-1','LAPTOP-2','ADMIN PC','MGMT'] },
  printer:  { fr: ['IMPRIMANTE','IMPRIM-A','IMPRIM-B'],
              en: ['PRINTER','PRINT-A','PRINT-B'] },
  server:   { fr: ['SERVEUR','SRV-APP','SRV-DB','SRV-WEB','NAS','SRV-BACK','SRV-MAIL'],
              en: ['SERVER','SRV-APP','SRV-DB','SRV-WEB','NAS','SRV-BACK','SRV-MAIL'] },
  ap:       { fr: ['AP-WIFI','BORNE-WIFI','AP-1','AP-2'],
              en: ['AP-WIFI','WIFI-AP','AP-1','AP-2'] },
  switch:   { fr: ['SW-1','SW-2','SW-3','SW-DIST','SW-ACC','SW-CORE','TOR-1','TOR-2'],
              en: ['SW-1','SW-2','SW-3','SW-DIST','SW-ACC','SW-CORE','TOR-1','TOR-2'] },
  router:   { fr: ['ROUTEUR','RT-1','RT-2','RT-SITE-A','RT-SITE-B','RT-COEUR'],
              en: ['ROUTER','RT-1','RT-2','RT-SITE-A','RT-SITE-B','CORE-RT'] },
  firewall: { fr: ['FIREWALL','FW-1','FW-PERIM','FW-DMZ'],
              en: ['FIREWALL','FW-1','FW-PERIM','FW-DMZ'] }
};

// ============================================================
// CABLE TYPE DEFINITIONS
// ============================================================

const CABLE_TYPES = {
  straight: {
    label_fr: 'DROIT',       label_en: 'STRAIGHT',
    hint_fr: 'Appareils de niveaux OSI differents : PC/Serveur vers Switch, Switch vers Routeur',
    hint_en: 'Different OSI layer devices: PC/Server to Switch, Switch to Router'
  },
  crossover: {
    label_fr: 'CROISE',      label_en: 'CROSSOVER',
    hint_fr: 'Meme type d\'appareil : PC-PC, Switch-Switch, Routeur-Routeur',
    hint_en: 'Same device type: PC-PC, Switch-Switch, Router-Router'
  },
  fiber: {
    label_fr: 'FIBRE',       label_en: 'FIBER',
    hint_fr: 'Liaison backbone longue distance entre switches ou vers routeur',
    hint_en: 'Long distance backbone link between switches or to router'
  },
  console: {
    label_fr: 'CONSOLE',     label_en: 'CONSOLE',
    hint_fr: 'Administration locale : PC admin vers port console du routeur ou switch',
    hint_en: 'Local admin: admin PC to router or switch console port'
  },
  sfp: {
    label_fr: 'SFP FIBRE',   label_en: 'SFP FIBER',
    hint_fr: 'Uplink fibre via port SFP entre switches ou vers routeur datacenter',
    hint_en: 'Fiber uplink via SFP port between switches or to datacenter router'
  }
};

// ============================================================
// CABLE RULE DERIVATION
// ============================================================

/**
 * Derive the correct cable type for a pair of device types.
 * @param {string} typeA  — device type key
 * @param {string} typeB  — device type key
 * @param {object} flags  — { consoleLink, backboneLink, sfpLink }
 * @returns {string} cable type key
 */
function deriveCable(typeA, typeB, flags) {
  // Console link is explicit — admin laptop/pc -> router or switch
  if (flags.consoleLink) return 'console';

  // SFP uplink is explicit — datacenter switch-switch or switch-router SFP
  if (flags.sfpLink) return 'sfp';

  // Backbone fiber is explicit — inter-floor or inter-site Switch-Switch
  if (flags.backboneLink) return 'fiber';

  const catA = DEV_CATEGORY[typeA];
  const catB = DEV_CATEGORY[typeB];

  // Same category
  if (catA === catB) return 'crossover';

  // host <-> switch or host <-> router: straight
  // switch <-> router: straight
  return 'straight';
}

// ============================================================
// TOPOLOGY TEMPLATES
// ============================================================

/**
 * A topology template defines the structure of a network scenario.
 * devices: array of { type, adminRole? }
 *   adminRole: true = this device gets a console link to a router/switch
 * links: array of { from (index), to (index), flags? }
 *   flags: { consoleLink, backboneLink, sfpLink }
 * difficulty: which pool this belongs to
 * context_fr / context_en: scenario description template
 *   Use {D0}, {D1} etc. as placeholders for device labels.
 */

const TOPOLOGIES_EASY = [
  // 1: PC + Printer + Server all wired to one Switch
  {
    devices: [
      { type: 'pc' },
      { type: 'printer' },
      { type: 'server' },
      { type: 'switch' }
    ],
    links: [
      { from: 0, to: 3 },
      { from: 1, to: 3 },
      { from: 2, to: 3 }
    ],
    context_fr: 'Bureau standard : {D0}, {D1} et {D2} sont branches sur {D3}.',
    context_en: 'Standard office: {D0}, {D1} and {D2} are wired to {D3}.'
  },
  // 2: Two PCs direct + one wired to switch
  {
    devices: [
      { type: 'pc' },
      { type: 'pc' },
      { type: 'switch' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 2 }
    ],
    context_fr: '{D0} et {D1} sont relies en direct. {D0} et {D3} passent par {D2}.',
    context_en: '{D0} and {D1} are directly linked. {D0} and {D3} go through {D2}.'
  },
  // 3: Admin laptop consoles into switch, switch serves two hosts
  {
    devices: [
      { type: 'laptop' },
      { type: 'switch' },
      { type: 'pc' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1, flags: { consoleLink: true } },
      { from: 2, to: 1 },
      { from: 3, to: 1 }
    ],
    context_fr: '{D0} accede au switch {D1} via console pour la configuration. {D2} et {D3} sont branches sur {D1}.',
    context_en: '{D0} accesses switch {D1} via console for configuration. {D2} and {D3} are wired to {D1}.'
  },
  // 4: Switch -> Router -> Server, PC on switch
  {
    devices: [
      { type: 'pc' },
      { type: 'switch' },
      { type: 'router' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 }
    ],
    context_fr: '{D0} est branche sur {D1}. {D1} remonte vers le routeur {D2}, qui relie {D3}.',
    context_en: '{D0} is wired to {D1}. {D1} uplinks to router {D2}, which connects {D3}.'
  },
  // 5: Two switches direct (crossover), hosts on each
  {
    devices: [
      { type: 'pc' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 3, to: 2 }
    ],
    context_fr: '{D0} est branche sur {D1}. {D1} et {D2} sont interconnectes. {D3} est branche sur {D2}.',
    context_en: '{D0} is wired to {D1}. {D1} and {D2} are interconnected. {D3} is wired to {D2}.'
  },
  // 6: AP + PC + Server on switch
  {
    devices: [
      { type: 'ap' },
      { type: 'pc' },
      { type: 'server' },
      { type: 'switch' }
    ],
    links: [
      { from: 0, to: 3 },
      { from: 1, to: 3 },
      { from: 2, to: 3 }
    ],
    context_fr: 'Reseau mixte filaire/WiFi : {D0}, {D1} et {D2} sont branches sur {D3}.',
    context_en: 'Mixed wired/WiFi network: {D0}, {D1} and {D2} are wired to {D3}.'
  }
];

const TOPOLOGIES_MEDIUM = [
  // 1: Two switches backbone + hosts + router
  {
    devices: [
      { type: 'pc' },
      { type: 'pc' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'server' },
      { type: 'router' }
    ],
    links: [
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3, flags: { backboneLink: true } },
      { from: 4, to: 3 },
      { from: 5, to: 3 }
    ],
    context_fr: 'LAN multi-switch : {D2} et {D3} sont relies en fibre backbone. {D0} et {D1} sur {D2}. {D4} et {D5} sur {D3}.',
    context_en: 'Multi-switch LAN: {D2} and {D3} are fiber backbone linked. {D0} and {D1} on {D2}. {D4} and {D5} on {D3}.'
  },
  // 2: DMZ with firewall
  {
    devices: [
      { type: 'laptop' },
      { type: 'router' },
      { type: 'firewall' },
      { type: 'switch' },
      { type: 'server' },
      { type: 'pc' }
    ],
    links: [
      { from: 0, to: 1, flags: { consoleLink: true } },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 2, to: 4 },
      { from: 5, to: 3 }
    ],
    context_fr: '{D0} administre {D1} via console. {D1} est relie au firewall {D2}. {D2} dessert le switch {D3} et le serveur DMZ {D4}. {D5} est sur le LAN ({D3}).',
    context_en: '{D0} manages {D1} via console. {D1} connects to firewall {D2}. {D2} serves switch {D3} and DMZ server {D4}. {D5} is on the LAN ({D3}).'
  },
  // 3: Two routers WAN + local networks
  {
    devices: [
      { type: 'router' },
      { type: 'router' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'pc' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 4, to: 2 },
      { from: 5, to: 3 }
    ],
    context_fr: 'Lien WAN entre {D0} et {D1}. Chaque routeur dessert son switch local ({D2} et {D3}). {D4} sur {D2}, {D5} sur {D3}.',
    context_en: 'WAN link between {D0} and {D1}. Each router serves its local switch ({D2} and {D3}). {D4} on {D2}, {D5} on {D3}.'
  },
  // 4: WiFi + wired mixed + backbone
  {
    devices: [
      { type: 'router' },
      { type: 'switch' },
      { type: 'ap' },
      { type: 'server' },
      { type: 'switch' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 2, to: 1 },
      { from: 3, to: 1 },
      { from: 1, to: 4, flags: { backboneLink: true } },
      { from: 5, to: 4 }
    ],
    context_fr: '{D0} est relie a {D1}. {D2} (WiFi) et {D3} sont branches sur {D1}. Liaison fibre backbone vers {D4} qui dessert {D5}.',
    context_en: '{D0} connects to {D1}. {D2} (WiFi) and {D3} are wired to {D1}. Fiber backbone to {D4} which serves {D5}.'
  },
  // 5: Admin + console + three-tier
  {
    devices: [
      { type: 'laptop' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'router' },
      { type: 'pc' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 3, flags: { consoleLink: true } },
      { from: 3, to: 1 },
      { from: 1, to: 2 },
      { from: 4, to: 1 },
      { from: 5, to: 2 }
    ],
    context_fr: '{D0} administre {D3} via console. {D3} est relie a {D1}. {D1} et {D2} sont interconnectes. {D4} sur {D1}, {D5} sur {D2}.',
    context_en: '{D0} manages {D3} via console. {D3} connects to {D1}. {D1} and {D2} are interconnected. {D4} on {D1}, {D5} on {D2}.'
  },
  // 6: Server farm switch + firewall + hosts
  {
    devices: [
      { type: 'firewall' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'server' },
      { type: 'server' },
      { type: 'pc' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 3, to: 1 },
      { from: 4, to: 2 },
      { from: 5, to: 1 }
    ],
    context_fr: '{D0} (firewall) separe deux zones : {D1} (serveurs) et {D2} (DMZ). {D3} et {D5} sur {D1}. {D4} sur {D2}.',
    context_en: '{D0} (firewall) splits two zones: {D1} (servers) and {D2} (DMZ). {D3} and {D5} on {D1}. {D4} on {D2}.'
  }
];

const TOPOLOGIES_HARD = [
  // 1: Multi-floor fiber backbone
  {
    devices: [
      { type: 'laptop' },
      { type: 'router' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'pc' },
      { type: 'server' },
      { type: 'pc' }
    ],
    links: [
      { from: 0, to: 1, flags: { consoleLink: true } },
      { from: 1, to: 2, flags: { backboneLink: true } },
      { from: 1, to: 3, flags: { backboneLink: true } },
      { from: 2, to: 4 },
      { from: 5, to: 2 },
      { from: 6, to: 3 },
      { from: 7, to: 4 }
    ],
    context_fr: 'Infrastructure multi-etages. {D0} administre {D1} via console. Liaisons fibre de {D1} vers {D2} et {D3}. {D2} est interconnecte a {D4}. Postes et serveurs sur chaque switch.',
    context_en: 'Multi-floor infrastructure. {D0} manages {D1} via console. Fiber links from {D1} to {D2} and {D3}. {D2} interconnects to {D4}. Hosts and servers on each switch.'
  },
  // 2: Datacenter SFP
  {
    devices: [
      { type: 'laptop' },
      { type: 'router' },
      { type: 'firewall' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'server' },
      { type: 'server' },
      { type: 'server' }
    ],
    links: [
      { from: 0, to: 1, flags: { consoleLink: true } },
      { from: 1, to: 2 },
      { from: 2, to: 3, flags: { sfpLink: true } },
      { from: 2, to: 4, flags: { sfpLink: true } },
      { from: 5, to: 3 },
      { from: 6, to: 3 },
      { from: 7, to: 4 }
    ],
    context_fr: 'Datacenter. {D0} administre {D1} via console. {D1} relie {D2}. {D2} utilise des ports SFP vers {D3} et {D4} (top-of-rack). Serveurs sur les TOR.',
    context_en: 'Datacenter. {D0} manages {D1} via console. {D1} connects {D2}. {D2} uses SFP ports to {D3} and {D4} (top-of-rack). Servers on TOR switches.'
  },
  // 3: WAN multi-site
  {
    devices: [
      { type: 'router' },
      { type: 'router' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'pc' },
      { type: 'server' },
      { type: 'pc' },
      { type: 'firewall' }
    ],
    links: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 7 },
      { from: 7, to: 3 },
      { from: 4, to: 2 },
      { from: 5, to: 2 },
      { from: 6, to: 3 }
    ],
    context_fr: 'Deux sites relies via WAN ({D0}-{D1}). Site A : {D0} dessert {D2} avec {D4} et {D5}. Site B : {D1} passe par firewall {D7} vers {D3} avec {D6}.',
    context_en: 'Two sites WAN linked ({D0}-{D1}). Site A: {D0} serves {D2} with {D4} and {D5}. Site B: {D1} goes through firewall {D7} to {D3} with {D6}.'
  },
  // 4: Hybrid campus
  {
    devices: [
      { type: 'laptop' },
      { type: 'router' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'ap' },
      { type: 'server' },
      { type: 'pc' },
      { type: 'printer' }
    ],
    links: [
      { from: 0, to: 1, flags: { consoleLink: true } },
      { from: 1, to: 2 },
      { from: 2, to: 3, flags: { backboneLink: true } },
      { from: 4, to: 2 },
      { from: 5, to: 3 },
      { from: 6, to: 3 },
      { from: 7, to: 2 }
    ],
    context_fr: 'Campus. {D0} administre {D1} via console. {D1} alimente {D2}. Liaison fibre backbone vers {D3}. AP {D4} et imprimante {D7} sur {D2}. Serveur {D5} et poste {D6} sur {D3}.',
    context_en: 'Campus. {D0} manages {D1} via console. {D1} feeds {D2}. Fiber backbone to {D3}. AP {D4} and printer {D7} on {D2}. Server {D5} and PC {D6} on {D3}.'
  },
  // 5: Core-distribution-access three tier
  {
    devices: [
      { type: 'router' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'switch' },
      { type: 'pc' },
      { type: 'server' },
      { type: 'pc' },
      { type: 'laptop' }
    ],
    links: [
      { from: 7, to: 0, flags: { consoleLink: true } },
      { from: 0, to: 1, flags: { backboneLink: true } },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 4, to: 2 },
      { from: 5, to: 2 },
      { from: 6, to: 3 }
    ],
    context_fr: 'Architecture 3 niveaux. {D7} administre {D0} via console. Lien fibre de {D0} vers {D1} (distribution). {D1} distribue vers {D2} et {D3} (acces). Postes et serveurs sur les switches d\'acces.',
    context_en: 'Three-tier architecture. {D7} manages {D0} via console. Fiber from {D0} to {D1} (distribution). {D1} distributes to {D2} and {D3} (access). Hosts and servers on access switches.'
  }
];

const TOPOLOGY_POOLS = {
  easy:   TOPOLOGIES_EASY,
  medium: TOPOLOGIES_MEDIUM,
  hard:   TOPOLOGIES_HARD
};

const CC_TIMERS = {
  easy:   null,
  medium: null,
  hard:   90
};

// ============================================================
// GAME STATE
// ============================================================

let ccState = {
  difficulty:  null,
  scenario:    null,   // resolved scenario: { title_fr, title_en, devices[], connections[] }
  answers:     {},     // { connKey: cableTypeKey | null }
  optionOrder: {},     // { connKey: string[] } — shuffled once at scenario build
  errors:      0,
  startTime:   null,
  timerInterval: null,
  timerLimit:  null,
  finished:    false
};

// ============================================================
// SCENARIO GENERATION
// ============================================================

/**
 * Pick a random element from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Fisher-Yates shuffle, returns a new array.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick a unique label for a device type, avoiding already-used labels.
 */
function pickLabel(type, lang, usedLabels) {
  const pool = DEVICE_LABELS[type]?.[lang] || [type.toUpperCase()];
  const available = pool.filter(l => !usedLabels.has(l));
  if (available.length === 0) return type.toUpperCase() + '-' + Math.floor(Math.random() * 9 + 1);
  const label = pick(available);
  usedLabels.add(label);
  return label;
}

/**
 * Build a concrete scenario from a topology template.
 * Assigns random device labels and derives cable types from rules.
 */
function buildScenario(topology) {
  const usedFr = new Set();
  const usedEn = new Set();

  // Assign labels to each device
  const devices = topology.devices.map((d, idx) => ({
    id:       'd' + idx,
    type:     d.type,
    label_fr: pickLabel(d.type, 'fr', usedFr),
    label_en: pickLabel(d.type, 'en', usedEn),
    col:      0,   // set below
    row:      0
  }));

  // Layout: spread devices on a grid based on index
  // Simple row/col assignment: up to 4 per row
  const cols = Math.min(4, devices.length);
  devices.forEach((d, i) => {
    d.col = i % cols;
    d.row = Math.floor(i / cols);
  });

  // Resolve connections
  const connections = topology.links.map(link => {
    const devA = devices[link.from];
    const devB = devices[link.to];
    const flags = link.flags || {};
    const correct = deriveCable(devA.type, devB.type, flags);

    // Build wrong options: 2-3 plausible alternatives
    const wrongPool = buildWrongOptions(correct, devA.type, devB.type, flags);

    return {
      from:          devA.id,
      to:            devB.id,
      correct,
      wrong_options: wrongPool
    };
  });

  // Build title by substituting {D0} placeholders with FR/EN labels
  const title_fr = topology.context_fr.replace(/\{D(\d+)\}/g, (_, i) => devices[+i]?.label_fr || '?');
  const title_en = topology.context_en.replace(/\{D(\d+)\}/g, (_, i) => devices[+i]?.label_en || '?');

  return { title_fr, title_en, devices, connections };
}

/**
 * Build plausible wrong cable options for a connection.
 * Always 2-3 wrong options, never duplicates the correct one.
 */
function buildWrongOptions(correct, typeA, typeB, flags) {
  // All cable types minus the correct one
  const all = Object.keys(CABLE_TYPES).filter(k => k !== correct);

  // Rank plausibility — prefer cables that are "close" to correct
  const plausible = all.filter(k => {
    // Always plausible: straight and crossover (most common confusion)
    if (k === 'straight' || k === 'crossover') return true;
    // fiber and sfp are plausible when a backbone or sfp link exists nearby
    if ((k === 'fiber' || k === 'sfp') && (flags.backboneLink || flags.sfpLink)) return true;
    // console is plausible if one device is a host type
    if (k === 'console' && (DEV_CATEGORY[typeA] === 'host' || DEV_CATEGORY[typeB] === 'host')) return true;
    return false;
  });

  // Fallback: add remaining if not enough
  const pool = plausible.length >= 2 ? plausible : all;

  // Pick 2 wrong options (shuffle and take first 2)
  return shuffle(pool).slice(0, 2);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
  });

  document.getElementById('cc-validate-btn').addEventListener('click', validateCabling);

  document.getElementById('post-save-play-again-btn').addEventListener('click', () => {
    document.getElementById('post-save-screen').style.display = 'none';
    document.getElementById('difficulty-screen').style.display = 'block';
  });

  document.addEventListener('langChange', () => {
    if (ccState.difficulty && !ccState.finished) {
      renderScenarioDescription();
      renderDiagram();
      renderConnectionPanel();
    }
  });
});

// ============================================================
// GAME START
// ============================================================

function startGame(difficulty) {
  const pool     = TOPOLOGY_POOLS[difficulty];
  const topology = pick(pool);
  const scenario = buildScenario(topology);

  // Pre-shuffle cable options order (stable for this game session)
  const optionOrder = {};
  scenario.connections.forEach(conn => {
    const key = connKey(conn.from, conn.to);
    optionOrder[key] = shuffle([conn.correct, ...conn.wrong_options]);
  });

  ccState = {
    difficulty,
    scenario,
    answers:      Object.fromEntries(scenario.connections.map(c => [connKey(c.from, c.to), null])),
    optionOrder,
    errors:       0,
    startTime:    Date.now(),
    timerInterval: null,
    timerLimit:   CC_TIMERS[difficulty],
    finished:     false
  };

  document.getElementById('difficulty-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('cc-result-overlay').style.display = 'none';

  renderScenarioDescription();
  renderDiagram();
  renderConnectionPanel();
  startTimer();
}

function connKey(from, to) {
  return from + '__' + to;
}

// ============================================================
// RENDER — SCENARIO DESCRIPTION
// ============================================================

function renderScenarioDescription() {
  const el = document.getElementById('cc-scenario');
  if (!el) return;
  const lang = i18n.getLang();
  el.textContent = lang === 'fr' ? ccState.scenario.title_fr : ccState.scenario.title_en;
}

// ============================================================
// RENDER — NETWORK DIAGRAM
// ============================================================

function renderDiagram() {
  const container = document.getElementById('cc-nodes');
  container.innerHTML = '';

  const { devices } = ccState.scenario;
  const lang = i18n.getLang();

  const maxCol = Math.max(...devices.map(d => d.col));
  const maxRow = Math.max(...devices.map(d => d.row));

  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${maxCol + 1}, 1fr)`;
  container.style.gridTemplateRows    = `repeat(${maxRow + 1}, auto)`;
  container.style.gap = '8px';

  devices.forEach(device => {
    const node = document.createElement('div');
    node.className = 'cc-node';
    node.dataset.deviceId = device.id;
    node.setAttribute('role', 'listitem');
    node.style.gridColumn = device.col + 1;
    node.style.gridRow    = device.row + 1;

    const icon = document.createElement('div');
    icon.className = 'cc-node__icon';
    icon.innerHTML = DEVICE_ICONS[device.type] || '&#x25A0;';

    const label = document.createElement('div');
    label.className = 'cc-node__label';
    label.textContent = lang === 'fr' ? device.label_fr : device.label_en;

    node.appendChild(icon);
    node.appendChild(label);
    container.appendChild(node);
  });
}

// ============================================================
// RENDER — CONNECTION PANEL
// ============================================================

function renderConnectionPanel() {
  const container = document.getElementById('cc-connections');
  container.innerHTML = '';

  const lang = i18n.getLang();
  const { scenario, difficulty, answers, optionOrder } = ccState;

  scenario.connections.forEach(conn => {
    const key        = connKey(conn.from, conn.to);
    const fromDevice = scenario.devices.find(d => d.id === conn.from);
    const toDevice   = scenario.devices.find(d => d.id === conn.to);
    const fromLabel  = lang === 'fr' ? fromDevice.label_fr : fromDevice.label_en;
    const toLabel    = lang === 'fr' ? toDevice.label_fr   : toDevice.label_en;

    const row = document.createElement('div');
    row.className = 'cc-conn-row';
    row.setAttribute('role', 'listitem');

    const connLabel = document.createElement('div');
    connLabel.className = 'cc-conn-label';
    connLabel.textContent = fromLabel + ' — ' + toLabel;
    row.appendChild(connLabel);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'cc-cable-options';
    optionsDiv.setAttribute('role', 'group');
    optionsDiv.setAttribute('aria-label', fromLabel + ' to ' + toLabel);

    const orderedOptions = optionOrder[key] || shuffle([conn.correct, ...conn.wrong_options]);

    orderedOptions.forEach(cableKey => {
      const cableType  = CABLE_TYPES[cableKey];
      const cableLabel = lang === 'fr' ? cableType.label_fr : cableType.label_en;

      const btn = document.createElement('button');
      btn.className = 'cc-cable-btn';
      btn.dataset.cable   = cableKey;
      btn.dataset.connKey = key;
      btn.textContent     = cableLabel;

      // Easy mode: tooltip hint
      if (difficulty === 'easy') {
        btn.title = lang === 'fr' ? cableType.hint_fr : cableType.hint_en;
      }

      if (answers[key] === cableKey) {
        btn.classList.add('cc-cable-btn--active');
      }

      btn.addEventListener('click', () => selectCable(key, cableKey, optionsDiv));
      optionsDiv.appendChild(btn);
    });

    row.appendChild(optionsDiv);
    container.appendChild(row);
  });
}

function selectCable(key, cableKey, optionsDiv) {
  if (ccState.finished) return;
  ccState.answers[key] = cableKey;

  optionsDiv.querySelectorAll('.cc-cable-btn').forEach(btn => {
    btn.classList.toggle('cc-cable-btn--active', btn.dataset.cable === cableKey);
    btn.classList.remove('cc-cable-btn--error');
  });

  document.getElementById('cc-result-overlay').style.display = 'none';
}

// ============================================================
// VALIDATE
// ============================================================

function validateCabling() {
  if (ccState.finished) return;

  const { scenario, answers } = ccState;
  const lang = i18n.getLang();

  // Check all answered
  const missing = scenario.connections.filter(c => answers[connKey(c.from, c.to)] === null);
  if (missing.length > 0) {
    showResultOverlay(
      lang === 'fr'
        ? missing.length + ' CONNEXION(S) NON CABLEES'
        : missing.length + ' CONNECTION(S) NOT CABLED',
      ''
    );
    return;
  }

  let correct = 0;
  const errorDetails = [];

  scenario.connections.forEach(conn => {
    const key    = connKey(conn.from, conn.to);
    const chosen = answers[key];

    if (chosen === conn.correct) {
      correct++;
    } else {
      ccState.errors++;
      const fromDev   = scenario.devices.find(d => d.id === conn.from);
      const toDev     = scenario.devices.find(d => d.id === conn.to);
      const fromLabel = lang === 'fr' ? fromDev.label_fr : fromDev.label_en;
      const toLabel   = lang === 'fr' ? toDev.label_fr   : toDev.label_en;
      const correctType  = CABLE_TYPES[conn.correct];
      const correctLabel = lang === 'fr' ? correctType.label_fr : correctType.label_en;
      errorDetails.push(fromLabel + '-' + toLabel + ': ' + correctLabel);
      markConnectionError(key);
    }
  });

  updateHUDErrors();

  if (correct === scenario.connections.length) {
    endGame(true);
  } else {
    const detail = (lang === 'fr' ? 'ERREUR : ' : 'ERROR: ') + errorDetails.join(' | ');
    showResultOverlay(
      correct + '/' + scenario.connections.length + (lang === 'fr' ? ' CORRECT' : ' CORRECT'),
      detail
    );
  }
}

function markConnectionError(key) {
  document.querySelectorAll(`[data-conn-key="${key}"].cc-cable-btn--active`).forEach(btn => {
    btn.classList.add('cc-cable-btn--error');
  });
}

function showResultOverlay(msg, detail) {
  const overlay  = document.getElementById('cc-result-overlay');
  const msgEl    = document.getElementById('cc-result-msg');
  const detailEl = document.getElementById('cc-result-detail');
  msgEl.textContent    = msg;
  detailEl.textContent = detail;
  overlay.style.display = 'block';
}

function updateHUDErrors() {
  const el = document.getElementById('hud-errors');
  if (el) el.textContent = ccState.errors;
}

// ============================================================
// TIMER
// ============================================================

function startTimer() {
  const timerEl = document.getElementById('hud-timer');

  if (!ccState.timerLimit) {
    ccState.timerInterval = setInterval(() => {
      if (ccState.finished) return;
      const elapsed = Math.floor((Date.now() - ccState.startTime) / 1000);
      if (timerEl) timerEl.textContent = formatTime(elapsed);
    }, 1000);
    if (timerEl) timerEl.textContent = '00:00';
    return;
  }

  ccState.timerInterval = setInterval(() => {
    if (ccState.finished) return;
    const elapsed   = Math.floor((Date.now() - ccState.startTime) / 1000);
    const remaining = ccState.timerLimit - elapsed;
    if (timerEl) timerEl.textContent = remaining > 0 ? formatTime(remaining) : '00:00';
    if (remaining <= 0) endGame(false);
  }, 1000);
}

function stopTimer() {
  clearInterval(ccState.timerInterval);
}

function formatTime(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

// ============================================================
// GAME OVER
// ============================================================

function endGame(win) {
  ccState.finished = true;
  stopTimer();

  const elapsed      = Math.floor((Date.now() - ccState.startTime) / 1000);
  const speedBonus   = Math.max(0, 400 - elapsed * 4);
  const errorPenalty = ccState.errors * 80;
  const base         = win ? 600 : 0;
  const finalScore   = Math.max(0, base + speedBonus - errorPenalty);

  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  document.getElementById('result-title').textContent = win ? i18n.t('victory') : i18n.t('game_over');
  document.getElementById('result-title').className   = win
    ? 'game-result__title game-result__title--win'
    : 'game-result__title game-result__title--lose';
  document.getElementById('result-score').textContent = String(finalScore).padStart(6, '0');

  document.getElementById('save-score-btn').onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('score-entry-screen').style.display = 'block';

    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, 'cable-chaos', ccState.difficulty, finalScore);
        document.getElementById('score-entry-screen').style.display = 'none';
        document.getElementById('post-save-screen').style.display = 'block';

        const newPins = checkRewards();
        showRewardNotifications(newPins, { isGamePage: true });

        document.getElementById('capture-btn').onclick = () => {
          ticket.generate({
            initials,
            game:      i18n.t('game_cable_chaos'),
            difficulty: ccState.difficulty,
            score:      finalScore,
            topScore:   1000
          });
        };
      }
    );
  };

  document.getElementById('play-again-btn').onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('difficulty-screen').style.display = 'block';
  };
}
