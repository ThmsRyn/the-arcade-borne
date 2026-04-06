/**
 * packet-tracer.js — Packet Tracer game logic
 *
 * A network topology is shown. A packet travels from source to destination.
 * At each hop, the player must identify what happens to the packet:
 * which action the network device takes (forward, route, NAT, drop, switch...).
 *
 * Difficulty:
 *   easy   — 2-hop paths, simple L2/L3, single correct action per hop
 *   medium — 3-4 hops, NAT, ACL, ARP involvement
 *   hard   — 5+ hops, TTL expiry, fragmentation, asymmetric routing, decoys
 *
 * Score: 1300 base - (errors * 90) + (timeLeft * 5)
 */

// ============================================================
// SCENARIO DEFINITIONS
// ============================================================

/**
 * Each scenario has:
 *   - title (fr/en)
 *   - topology description (fr/en)
 *   - hops: array of { device, action_fr, action_en, options_fr[], options_en[], correct }
 *     correct = index in options array
 */

const PT_SCENARIOS_EASY = [
  {
    id: 'easy_switch_forward',
    title_fr: 'PC-A envoie un ping a PC-B (meme VLAN)',
    title_en:  'PC-A pings PC-B (same VLAN)',
    topo_fr:   'PC-A (192.168.1.10) → Switch → PC-B (192.168.1.20) — meme sous-reseau /24',
    topo_en:   'PC-A (192.168.1.10) → Switch → PC-B (192.168.1.20) — same /24 subnet',
    hops: [
      {
        device:     'PC-A',
        action_fr:  'PC-A verifie sa table ARP — PC-B non trouve. Que fait PC-A ?',
        action_en:  'PC-A checks ARP table — PC-B not found. What does PC-A do?',
        options_fr: ['Envoie ARP Request en broadcast', 'Envoie directement le paquet IP', 'Contacte le routeur par defaut', 'Abandonne la communication'],
        options_en: ['Sends ARP Request as broadcast', 'Sends IP packet directly', 'Contacts the default gateway', 'Drops the communication'],
        correct: 0
      },
      {
        device:     'Switch',
        action_fr:  'Le Switch recoit l\'ARP Request. Que fait-il ?',
        action_en:  'Switch receives the ARP Request. What does it do?',
        options_fr: ['Inonde sur tous les ports sauf le port source (flood)', 'Route le paquet vers le routeur', 'Bloque le broadcast', 'Repond avec sa propre adresse MAC'],
        options_en: ['Floods all ports except source (flood)', 'Routes packet to router', 'Blocks the broadcast', 'Replies with its own MAC address'],
        correct: 0
      },
      {
        device:     'PC-B',
        action_fr:  'PC-B recoit l\'ARP Request pour son IP. Que fait-il ?',
        action_en:  'PC-B receives ARP Request for its IP. What does it do?',
        options_fr: ['Envoie un ARP Reply en unicast a PC-A', 'Envoie un ARP Reply en broadcast', 'Ignore la requete', 'Transfere a la passerelle'],
        options_en: ['Sends unicast ARP Reply to PC-A', 'Sends broadcast ARP Reply', 'Ignores the request', 'Forwards to gateway'],
        correct: 0
      },
      {
        device:     'Switch',
        action_fr:  'PC-A envoie maintenant le frame ICMP. Le Switch connait l\'adresse MAC de PC-B. Que fait-il ?',
        action_en:  'PC-A sends ICMP frame. Switch knows PC-B MAC address. What does it do?',
        options_fr: ['Forward en unicast vers le port de PC-B (via table MAC)', 'Inonde sur tous les ports', 'Route via la table IP', 'Envoie au routeur'],
        options_en: ['Unicast forward to PC-B port (via MAC table)', 'Floods all ports', 'Routes via IP table', 'Sends to router'],
        correct: 0
      }
    ]
  },
  {
    id: 'easy_router_forward',
    title_fr: 'PC-A envoie un paquet vers un serveur distant',
    title_en:  'PC-A sends packet to a remote server',
    topo_fr:   'PC-A (192.168.1.10) → Routeur (GW: 192.168.1.1) → Internet → Serveur (8.8.8.8)',
    topo_en:   'PC-A (192.168.1.10) → Router (GW: 192.168.1.1) → Internet → Server (8.8.8.8)',
    hops: [
      {
        device:     'PC-A',
        action_fr:  'PC-A veut joindre 8.8.8.8. Adresse hors sous-reseau local. Que fait PC-A ?',
        action_en:  'PC-A wants to reach 8.8.8.8. Address outside local subnet. What does PC-A do?',
        options_fr: ['Envoie le paquet a la passerelle par defaut (192.168.1.1)', 'Envoie directement a 8.8.8.8', 'Broadcast pour trouver 8.8.8.8', 'Abandonne — destination injoignable'],
        options_en: ['Sends packet to default gateway (192.168.1.1)', 'Sends directly to 8.8.8.8', 'Broadcasts to find 8.8.8.8', 'Drops — destination unreachable'],
        correct: 0
      },
      {
        device:     'Routeur',
        action_fr:  'Le Routeur recoit le paquet destine a 8.8.8.8. Que fait-il ?',
        action_en:  'Router receives packet destined to 8.8.8.8. What does it do?',
        options_fr: ['Consulte la table de routage et transfère via l\'interface WAN', 'Envoie un ARP pour 8.8.8.8', 'Repond directement a PC-A', 'Bloque (TTL = 0)'],
        options_en: ['Checks routing table and forwards via WAN interface', 'Sends ARP for 8.8.8.8', 'Replies directly to PC-A', 'Drops (TTL = 0)'],
        correct: 0
      },
      {
        device:     'Serveur 8.8.8.8',
        action_fr:  'Le paquet arrive au serveur 8.8.8.8. Que se passe-t-il ?',
        action_en:  'Packet arrives at 8.8.8.8. What happens?',
        options_fr: ['Le serveur traite la requete et envoie une reponse a PC-A', 'Le serveur renvoie le paquet a l\'expediteur sans traitement', 'Le serveur broadcast la reponse', 'Le serveur ignore — TTL trop bas'],
        options_en: ['Server processes request and sends response to PC-A', 'Server returns packet unprocessed', 'Server broadcasts the reply', 'Server ignores — TTL too low'],
        correct: 0
      }
    ]
  },
  {
    id: 'easy_ttl_expiry',
    title_fr: 'Paquet avec TTL = 1 traverse un routeur',
    title_en:  'Packet with TTL=1 crosses a router',
    topo_fr:   'PC (TTL=1) → Routeur-A → Routeur-B → Destination',
    topo_en:   'PC (TTL=1) → Router-A → Router-B → Destination',
    hops: [
      {
        device:     'Routeur-A',
        action_fr:  'Routeur-A recoit le paquet avec TTL=1. Que fait-il ?',
        action_en:  'Router-A receives packet with TTL=1. What does it do?',
        options_fr: ['Decremente TTL a 0 → jette le paquet + envoie ICMP Time Exceeded', 'Transmet le paquet normalement', 'Remet TTL a 64 et transmet', 'Envoie le paquet en broadcast'],
        options_en: ['Decrements TTL to 0 → drops packet + sends ICMP Time Exceeded', 'Forwards packet normally', 'Resets TTL to 64 and forwards', 'Broadcasts the packet'],
        correct: 0
      },
      {
        device:     'PC Source',
        action_fr:  'PC recoit un message ICMP Time Exceeded. D\'ou vient-il ?',
        action_en:  'PC receives ICMP Time Exceeded. Where does it come from?',
        options_fr: ['De Routeur-A (qui a jete le paquet)', 'De la destination finale', 'Du DNS', 'Du switch local'],
        options_en: ['From Router-A (which dropped the packet)', 'From the final destination', 'From DNS', 'From local switch'],
        correct: 0
      }
    ]
  }
];

const PT_SCENARIOS_MEDIUM = [
  {
    id: 'medium_nat',
    title_fr: 'NAT : PC interne accede a Internet',
    title_en:  'NAT: internal PC accesses the Internet',
    topo_fr:   'PC (192.168.0.10:49152) → Routeur NAT (WAN: 203.0.113.1) → Serveur (93.184.216.34:80)',
    topo_en:   'PC (192.168.0.10:49152) → NAT Router (WAN: 203.0.113.1) → Server (93.184.216.34:80)',
    hops: [
      {
        device:     'PC',
        action_fr:  'PC envoie un paquet TCP vers 93.184.216.34:80. IP source = ?',
        action_en:  'PC sends TCP packet to 93.184.216.34:80. Source IP = ?',
        options_fr: ['192.168.0.10 (adresse privee)', '203.0.113.1 (adresse publique)', '10.0.0.1 (passerelle)', '127.0.0.1 (loopback)'],
        options_en: ['192.168.0.10 (private address)', '203.0.113.1 (public address)', '10.0.0.1 (gateway)', '127.0.0.1 (loopback)'],
        correct: 0
      },
      {
        device:     'Routeur NAT',
        action_fr:  'Le routeur NAT recoit le paquet. Que fait-il avant de transmettre ?',
        action_en:  'NAT Router receives the packet. What does it do before forwarding?',
        options_fr: ['Remplace 192.168.0.10:49152 par 203.0.113.1:1024 (NAPT) et enregistre dans la table NAT', 'Transmet le paquet sans modification', 'Cree une route statique', 'Bloque le paquet (RFC 1918)'],
        options_en: ['Replaces 192.168.0.10:49152 with 203.0.113.1:1024 (NAPT) and records in NAT table', 'Forwards packet unchanged', 'Creates a static route', 'Drops packet (RFC 1918)'],
        correct: 0
      },
      {
        device:     'Serveur',
        action_fr:  'Le serveur recoit le paquet. Quelle adresse IP source voit-il ?',
        action_en:  'Server receives the packet. What source IP does it see?',
        options_fr: ['203.0.113.1 (IP publique du routeur NAT)', '192.168.0.10 (IP privee du PC)', '10.0.0.1', '0.0.0.0'],
        options_en: ['203.0.113.1 (public IP of NAT router)', '192.168.0.10 (PC private IP)', '10.0.0.1', '0.0.0.0'],
        correct: 0
      },
      {
        device:     'Routeur NAT (retour)',
        action_fr:  'La reponse du serveur arrive sur 203.0.113.1:1024. Que fait le routeur ?',
        action_en:  'Server reply arrives at 203.0.113.1:1024. What does the router do?',
        options_fr: ['Consulte la table NAT → remplace dest par 192.168.0.10:49152 et transfère au PC', 'Broadcast la reponse sur le LAN', 'Jette la reponse (session inconnue)', 'Envoie vers la passerelle WAN'],
        options_en: ['Checks NAT table → replaces dest with 192.168.0.10:49152 and forwards to PC', 'Broadcasts reply on LAN', 'Drops reply (unknown session)', 'Sends to WAN gateway'],
        correct: 0
      }
    ]
  },
  {
    id: 'medium_acl',
    title_fr: 'ACL : paquet bloque par une liste de controle',
    title_en:  'ACL: packet blocked by access control list',
    topo_fr:   'PC-RH (10.10.1.5) → Routeur (ACL) → Serveur-PROD (10.20.0.10:22)',
    topo_en:   'PC-HR (10.10.1.5) → Router (ACL) → PROD-Server (10.20.0.10:22)',
    hops: [
      {
        device:     'PC-RH',
        action_fr:  'PC-RH tente de se connecter en SSH au serveur de prod. Que se passe-t-il en premier ?',
        action_en:  'PC-HR tries SSH to prod server. What happens first?',
        options_fr: ['PC-RH envoie un paquet TCP SYN vers 10.20.0.10:22', 'Le serveur envoie un challenge d\'authentification', 'Le DNS resout l\'adresse', 'Le routeur envoie une alerte SNMP'],
        options_en: ['PC-HR sends TCP SYN to 10.20.0.10:22', 'Server sends authentication challenge', 'DNS resolves the address', 'Router sends SNMP alert'],
        correct: 0
      },
      {
        device:     'Routeur (ACL)',
        action_fr:  'Le routeur applique l\'ACL entrant : DENY tcp 10.10.1.0/24 any eq 22. Que se passe-t-il ?',
        action_en:  'Router applies inbound ACL: DENY tcp 10.10.1.0/24 any eq 22. What happens?',
        options_fr: ['Le paquet est bloque — ACL match, DENY applique', 'Le paquet passe — la regle ne correspond pas', 'Le routeur redirige vers un proxy SSH', 'Un log est cree mais le paquet passe'],
        options_en: ['Packet is blocked — ACL match, DENY applied', 'Packet passes — rule does not match', 'Router redirects to SSH proxy', 'Log created but packet passes'],
        correct: 0
      },
      {
        device:     'PC-RH',
        action_fr:  'PC-RH ne recoit pas de reponse. Quel message ICMP peut-il recevoir du routeur ?',
        action_en:  'PC-HR receives no response. What ICMP message might it receive from router?',
        options_fr: ['ICMP Destination Unreachable — Admin Prohibited (type 3 code 13)', 'ICMP Time Exceeded (TTL expire)', 'ICMP Echo Reply', 'Aucun — les ACL silencieux ne repondent pas'],
        options_en: ['ICMP Destination Unreachable — Admin Prohibited (type 3 code 13)', 'ICMP Time Exceeded (TTL expired)', 'ICMP Echo Reply', 'None — silent ACL does not respond'],
        correct: 0
      }
    ]
  },
  {
    id: 'medium_arp_poison',
    title_fr: 'ARP Spoofing detecte sur le reseau',
    title_en:  'ARP Spoofing detected on the network',
    topo_fr:   'PC-A (192.168.1.10) ↔ Attaquant (192.168.1.99) ↔ Routeur (192.168.1.1)',
    topo_en:   'PC-A (192.168.1.10) ↔ Attacker (192.168.1.99) ↔ Router (192.168.1.1)',
    hops: [
      {
        device:     'Attaquant',
        action_fr:  'L\'attaquant envoie un ARP Reply gratuit a PC-A. Que contient ce paquet ?',
        action_en:  'Attacker sends a gratuitous ARP Reply to PC-A. What does it contain?',
        options_fr: ['IP du Routeur (192.168.1.1) associee a la MAC de l\'Attaquant', 'IP de PC-A associee a sa propre MAC', 'Une requete ARP normale', 'Un paquet ICMP deguise en ARP'],
        options_en: ['Router IP (192.168.1.1) mapped to Attacker MAC', 'PC-A IP mapped to its own MAC', 'Normal ARP request', 'ICMP packet disguised as ARP'],
        correct: 0
      },
      {
        device:     'PC-A',
        action_fr:  'PC-A met a jour sa table ARP. Que se passe-t-il maintenant quand PC-A envoie un paquet au routeur ?',
        action_en:  'PC-A updates its ARP table. What happens when PC-A sends a packet to the router?',
        options_fr: ['Le paquet est envoye a la MAC de l\'Attaquant (man-in-the-middle)', 'Le paquet arrive au vrai routeur', 'PC-A detecte l\'anomalie et alerte', 'Le switch bloque le trafic'],
        options_en: ['Packet is sent to Attacker MAC (man-in-the-middle)', 'Packet reaches the real router', 'PC-A detects anomaly and alerts', 'Switch blocks the traffic'],
        correct: 0
      },
      {
        device:     'Switch (DAI)',
        action_fr:  'Le switch a la fonction Dynamic ARP Inspection (DAI) activee. Que fait-il face au ARP Reply frauduleux ?',
        action_en:  'Switch has Dynamic ARP Inspection (DAI) enabled. What does it do with the fraudulent ARP Reply?',
        options_fr: ['Compare avec la table DHCP snooping — MAC/IP ne correspond pas → jette le paquet et log', 'Transmet le ARP Reply normalement', 'Redirige vers le VLAN de quarantaine', 'Envoie une alerte SNMP seulement'],
        options_en: ['Checks against DHCP snooping table — MAC/IP mismatch → drops and logs', 'Forwards ARP Reply normally', 'Redirects to quarantine VLAN', 'Sends SNMP alert only'],
        correct: 0
      }
    ]
  }
];

const PT_SCENARIOS_HARD = [
  {
    id: 'hard_asymmetric',
    title_fr: 'Routage asymetrique : chemin aller != chemin retour',
    title_en:  'Asymmetric routing: forward path != return path',
    topo_fr:   'PC (10.0.1.5) → R1 → R2 → Serveur (10.0.2.5) / Retour : Serveur → R3 → R1 → PC',
    topo_en:   'PC (10.0.1.5) → R1 → R2 → Server (10.0.2.5) / Return: Server → R3 → R1 → PC',
    hops: [
      {
        device:     'R1 (aller)',
        action_fr:  'R1 recoit un paquet de PC vers Serveur. Chemin via R2 (metrique 10). Que choisit R1 ?',
        action_en:  'R1 receives packet from PC to Server. Path via R2 (metric 10). What does R1 choose?',
        options_fr: ['Transfère via R2 (meilleure metrique)', 'Transfère via R3 (metrique 20)', 'Load balance sur R2 et R3', 'Jette — route inconnue'],
        options_en: ['Forwards via R2 (better metric)', 'Forwards via R3 (metric 20)', 'Load balances on R2 and R3', 'Drops — unknown route'],
        correct: 0
      },
      {
        device:     'Serveur (retour)',
        action_fr:  'Le serveur repond a PC. Sa table de routage utilise R3 comme gateway. Que se passe-t-il ?',
        action_en:  'Server replies to PC. Its routing table uses R3 as gateway. What happens?',
        options_fr: ['La reponse suit R3 → R1 → PC (chemin different de l\'aller)', 'La reponse suit le meme chemin que l\'aller', 'La reponse est droppee (pas de route)', 'R3 redirige vers R2'],
        options_en: ['Reply follows R3 → R1 → PC (different from forward path)', 'Reply follows same path as forward', 'Reply is dropped (no route)', 'R3 redirects to R2'],
        correct: 0
      },
      {
        device:     'Firewall Stateful',
        action_fr:  'Un firewall stateful sur R1 voit la reponse arriver par une interface differente de l\'aller. Que fait-il ?',
        action_en:  'Stateful firewall on R1 sees reply arriving on a different interface than the request. What does it do?',
        options_fr: ['Jette le paquet — session asymetrique non reconnue dans la table d\'etat', 'Accepte la reponse normalement', 'Cree une nouvelle session', 'Redirige vers R2 pour re-symetriser'],
        options_en: ['Drops packet — asymmetric session not found in state table', 'Accepts the reply normally', 'Creates a new session', 'Redirects to R2 to re-symmetrize'],
        correct: 0
      }
    ]
  },
  {
    id: 'hard_fragmentation',
    title_fr: 'Fragmentation IP : MTU trop petit',
    title_en:  'IP Fragmentation: MTU too small',
    topo_fr:   'PC → Routeur-A (MTU 1500) → Liaison (MTU 576) → Routeur-B → Destination',
    topo_en:   'PC → Router-A (MTU 1500) → Link (MTU 576) → Router-B → Destination',
    hops: [
      {
        device:     'PC',
        action_fr:  'PC envoie un paquet IP de 1400 octets avec bit DF=0. Que se passe-t-il au niveau de Routeur-A ?',
        action_en:  'PC sends a 1400-byte IP packet with DF=0. What happens at Router-A?',
        options_fr: ['Routeur-A fragmente le paquet en plusieurs fragments de <= 576 octets', 'Routeur-A jette le paquet et envoie ICMP Fragmentation Needed', 'Routeur-A compresse le paquet', 'Le paquet passe sans modification'],
        options_en: ['Router-A fragments packet into chunks of <= 576 bytes', 'Router-A drops and sends ICMP Fragmentation Needed', 'Router-A compresses the packet', 'Packet passes unchanged'],
        correct: 0
      },
      {
        device:     'Routeur-A (DF=1)',
        action_fr:  'Meme scenario mais avec DF=1 (Don\'t Fragment). Routeur-A ne peut pas fragmenter. Que fait-il ?',
        action_en:  'Same scenario but with DF=1 (Don\'t Fragment). Router-A cannot fragment. What does it do?',
        options_fr: ['Jette le paquet et envoie ICMP Type 3 Code 4 (Fragmentation Needed) a la source', 'Fragmente quand meme (ignore DF)', 'Envoie le paquet incomplet', 'Redirige vers un chemin avec MTU plus grand'],
        options_en: ['Drops and sends ICMP Type 3 Code 4 (Fragmentation Needed) to source', 'Fragments anyway (ignores DF)', 'Sends truncated packet', 'Redirects to path with larger MTU'],
        correct: 0
      },
      {
        device:     'Routeur-B (reassemblage)',
        action_fr:  'Routeur-B recoit des fragments IP. Que fait-il ?',
        action_en:  'Router-B receives IP fragments. What does it do?',
        options_fr: ['Transmet les fragments tels quels — le reassemblage se fait a la destination finale', 'Reassemble les fragments et envoie un seul paquet', 'Jette les fragments orphelins', 'Re-fragmente pour le prochain saut'],
        options_en: ['Forwards fragments as-is — reassembly happens at final destination', 'Reassembles fragments into one packet', 'Drops orphan fragments', 'Re-fragments for next hop'],
        correct: 0
      }
    ]
  },
  {
    id: 'hard_bgp_route',
    title_fr: 'BGP : selection du meilleur chemin AS',
    title_en:  'BGP: best AS path selection',
    topo_fr:   'AS100 (ton reseau) → AS200 → AS300 → Destination / ou AS100 → AS400 → Destination',
    topo_en:   'AS100 (your network) → AS200 → AS300 → Destination / or AS100 → AS400 → Destination',
    hops: [
      {
        device:     'Routeur BGP AS100',
        action_fr:  'Deux routes BGP vers la destination : AS-PATH [200 300] et AS-PATH [400]. BGP choisit la meilleure. Laquelle ?',
        action_en:  'Two BGP routes to destination: AS-PATH [200 300] and AS-PATH [400]. BGP picks best. Which one?',
        options_fr: ['AS-PATH [400] — chemin AS le plus court (1 AS vs 2 AS)', 'AS-PATH [200 300] — prefere les chemins longs', 'Les deux en ECMP', 'Celle avec le LOCAL_PREF le plus bas'],
        options_en: ['AS-PATH [400] — shortest AS path (1 AS vs 2 AS)', 'AS-PATH [200 300] — prefers longer paths', 'Both in ECMP', 'The one with lowest LOCAL_PREF'],
        correct: 0
      },
      {
        device:     'AS400',
        action_fr:  'Le trafic passe par AS400. AS400 applique une politique BGP : MED=200 vers AS100, MED=100 vers AS500. Que signifie cela ?',
        action_en:  'Traffic goes via AS400. AS400 sets BGP policy: MED=200 to AS100, MED=100 to AS500. What does this mean?',
        options_fr: ['AS400 prefere que son trafic retour passe par AS500 (MED plus bas = prefere)', 'MED plus haut = prefere pour AS100', 'MED n\'affecte pas le routage inter-AS', 'AS500 est completement exclu'],
        options_en: ['AS400 prefers return traffic via AS500 (lower MED = preferred)', 'Higher MED = preferred for AS100', 'MED does not affect inter-AS routing', 'AS500 is completely excluded'],
        correct: 0
      },
      {
        device:     'Routeur BGP (route leak)',
        action_fr:  'AS400 annonce accidentellement les prefixes prives de AS100 vers AS500. C\'est un route leak. Quel est le risque ?',
        action_en:  'AS400 accidentally announces AS100 private prefixes to AS500. This is a route leak. What is the risk?',
        options_fr: ['Le trafic destine a AS100 peut etre detourne vers AS500 (hijack partiel)', 'Aucun risque — BGP filtre automatiquement', 'AS100 perd ses routes BGP', 'AS500 ne peut pas utiliser ces routes'],
        options_en: ['Traffic to AS100 may be diverted to AS500 (partial hijack)', 'No risk — BGP filters automatically', 'AS100 loses its BGP routes', 'AS500 cannot use these routes'],
        correct: 0
      }
    ]
  }
];

// ============================================================
// GAME STATE
// ============================================================

const ptState = {
  difficulty:    null,
  scenario:      null,
  hopIdx:        0,
  score:         0,
  errors:        0,
  timeLeft:      0,
  timerInterval: null,
  gameId:        'packet-tracer',
  answered:      false,
};

// ============================================================
// HELPERS
// ============================================================

function ptShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ptGetLang() {
  return (typeof i18n !== 'undefined') ? i18n.getLang() : 'fr';
}

function ptShow(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function ptHide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

function ptUpdateHUD() {
  const min = String(Math.floor(ptState.timeLeft / 60)).padStart(2, '0');
  const sec = String(ptState.timeLeft % 60).padStart(2, '0');
  const t = document.getElementById('pt-timer'); if (t) t.textContent = `${min}:${sec}`;
  const e = document.getElementById('pt-errors'); if (e) e.textContent = ptState.errors;
  const h = document.getElementById('pt-hop-counter');
  if (h && ptState.scenario) h.textContent = `HOP ${ptState.hopIdx + 1} / ${ptState.scenario.hops.length}`;
}

// ============================================================
// INIT
// ============================================================

function ptStartGame(difficulty) {
  ptState.difficulty = difficulty;
  ptState.score      = 0;
  ptState.errors     = 0;
  ptState.hopIdx     = 0;

  const pool = difficulty === 'easy'   ? PT_SCENARIOS_EASY :
               difficulty === 'medium' ? PT_SCENARIOS_MEDIUM : PT_SCENARIOS_HARD;
  ptState.scenario = pool[Math.floor(Math.random() * pool.length)];

  if (difficulty === 'easy')   ptState.timeLeft = 0;
  if (difficulty === 'medium') ptState.timeLeft = 120;
  if (difficulty === 'hard')   ptState.timeLeft = 90;

  ptHide('difficulty-screen');
  ptHide('result-screen');
  ptHide('score-entry-screen');
  ptHide('post-save-screen');
  ptShow('game-screen');

  ptRenderHop();
  ptUpdateHUD();

  if (difficulty !== 'easy') {
    ptState.timerInterval = setInterval(() => {
      ptState.timeLeft--;
      ptUpdateHUD();
      if (ptState.timeLeft <= 0) ptEndGame(false);
    }, 1000);
  }
}

// ============================================================
// RENDER HOP
// ============================================================

function ptRenderHop() {
  const lang     = ptGetLang();
  const scenario = ptState.scenario;
  const hop      = scenario.hops[ptState.hopIdx];

  // Topology header
  const titleEl = document.getElementById('pt-title');
  if (titleEl) titleEl.textContent = lang === 'fr' ? scenario.title_fr : scenario.title_en;
  const topoEl = document.getElementById('pt-topo');
  if (topoEl) topoEl.textContent = lang === 'fr' ? scenario.topo_fr : scenario.topo_en;

  // Device + question
  const deviceEl = document.getElementById('pt-device');
  if (deviceEl) deviceEl.textContent = hop.device;
  const questionEl = document.getElementById('pt-question');
  if (questionEl) questionEl.textContent = lang === 'fr' ? hop.action_fr : hop.action_en;

  // Shuffle options for display (keep correct index tracking)
  const opts = (lang === 'fr' ? hop.options_fr : hop.options_en);
  // Create indexed options
  const indexed = opts.map((text, i) => ({ text, origIdx: i }));
  const shuffled = ptShuffle(indexed);

  const choicesEl = document.getElementById('pt-choices');
  if (choicesEl) {
    choicesEl.innerHTML = shuffled.map(opt => `
      <button class="pt-choice" data-orig="${opt.origIdx}" data-correct="${opt.origIdx === hop.correct ? 'true' : 'false'}">
        ${opt.text}
      </button>
    `).join('');

    choicesEl.querySelectorAll('.pt-choice').forEach(btn => {
      btn.addEventListener('click', () => ptOnChoice(btn, hop.correct));
    });
  }

  // Feedback reset
  const fbEl = document.getElementById('pt-feedback');
  if (fbEl) { fbEl.textContent = ''; fbEl.className = 'pt-feedback'; }

  const nextBtn = document.getElementById('pt-next-btn');
  if (nextBtn) nextBtn.style.display = 'none';

  ptUpdateHUD();
  ptState.answered = false;
}

// ============================================================
// ANSWER
// ============================================================

function ptOnChoice(btn, correctOrigIdx) {
  if (ptState.answered) return;
  ptState.answered = true;

  // Disable all
  document.querySelectorAll('.pt-choice').forEach(b => b.disabled = true);

  const isCorrect = btn.dataset.correct === 'true';
  const lang = ptGetLang();

  if (isCorrect) {
    btn.classList.add('pt-choice--correct');
    let pts = ptState.difficulty === 'hard' ? 200 : ptState.difficulty === 'medium' ? 160 : 120;
    ptState.score += pts;
    const fb = document.getElementById('pt-feedback');
    if (fb) { fb.textContent = lang === 'fr' ? 'CORRECT !' : 'CORRECT!'; fb.className = 'pt-feedback pt-feedback--correct'; }
  } else {
    btn.classList.add('pt-choice--wrong');
    // Reveal correct
    document.querySelectorAll('.pt-choice').forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('pt-choice--correct');
    });
    ptState.errors++;
    ptState.score = Math.max(0, ptState.score - 60);
    if (ptState.difficulty !== 'easy') {
      ptState.timeLeft = Math.max(0, ptState.timeLeft - 8);
    }
    const fb = document.getElementById('pt-feedback');
    if (fb) {
      const correctText = btn.parentElement.querySelector('[data-correct="true"]').textContent.trim();
      fb.textContent = (lang === 'fr' ? 'INCORRECT. Bonne reponse : ' : 'INCORRECT. Correct: ') + correctText;
      fb.className = 'pt-feedback pt-feedback--error';
    }
  }

  ptUpdateHUD();

  // Show next / finish button
  const nextBtn = document.getElementById('pt-next-btn');
  if (nextBtn) {
    const isLast = ptState.hopIdx >= ptState.scenario.hops.length - 1;
    nextBtn.textContent = isLast ? (lang === 'fr' ? 'VOIR RESULTATS' : 'SEE RESULTS') : (lang === 'fr' ? 'HOP SUIVANT' : 'NEXT HOP');
    nextBtn.style.display = '';
    nextBtn.onclick = () => {
      ptState.hopIdx++;
      if (ptState.hopIdx >= ptState.scenario.hops.length) {
        ptEndGame(true);
      } else {
        ptRenderHop();
      }
    };
  }
}

// ============================================================
// END GAME
// ============================================================

function ptEndGame(completed) {
  clearInterval(ptState.timerInterval);
  if (completed) ptState.score += ptState.timeLeft * 5;
  ptState.score = Math.max(0, ptState.score);

  ptHide('game-screen');
  ptShow('result-screen');

  const titleEl = document.getElementById('result-title');
  const scoreEl = document.getElementById('result-score');
  if (titleEl) titleEl.textContent = i18n.t(completed ? 'victory' : 'game_over');
  if (scoreEl) scoreEl.textContent = String(ptState.score).padStart(6, '0');
}

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => ptStartGame(btn.dataset.difficulty));
  });

  const saveBtn = document.getElementById('save-score-btn');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    ptHide('result-screen');
    ptShow('score-entry-screen');
    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, ptState.gameId, ptState.difficulty, ptState.score);
        if (typeof checkRewards === 'function') checkRewards();
        ptHide('score-entry-screen');
        ptShow('post-save-screen');
      }
    );
  });

  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
    ptHide('result-screen');
    ptShow('difficulty-screen');
  });

  const postSavePlayAgain = document.getElementById('post-save-play-again-btn');
  if (postSavePlayAgain) postSavePlayAgain.addEventListener('click', () => {
    ptHide('post-save-screen');
    ptShow('difficulty-screen');
  });

  const captureBtn = document.getElementById('capture-btn');
  if (captureBtn) captureBtn.addEventListener('click', () => {
    if (typeof generateTicket === 'function') {
      generateTicket({
        game:       i18n.t('game_packet_tracer'),
        difficulty: ptState.difficulty,
        score:      ptState.score,
        errors:     ptState.errors,
        lang:       ptGetLang()
      });
    }
  });

  document.addEventListener('langChange', () => {
    if (ptState.scenario) ptRenderHop();
  });
});
