/**
 * subnet-challenge.js — Subnet Challenge game logic
 *
 * Given an IP / prefix (or a descriptive challenge), the player answers
 * subnet-related questions.
 *
 * Score: 200 per correct answer - penalty per failed attempt.
 *
 * Difficulty:
 *   easy   — 5 questions, /8 /16 /24 only, IPs generated dynamically
 *   medium — 8 questions, /17-/28, IPs generated dynamically
 *   hard   — 10 questions, mix of dynamic IPv4 calc (/17-/30) + MCQ
 *             (VLSM, membership, supernetting, IPv6 type)
 *
 * Dynamic generation ensures no two questions share the same IP in
 * one game session.
 */

// ============================================================
// SUBNET MATH UTILITIES
// ============================================================

/**
 * Convert an IP string to a 32-bit unsigned integer.
 * @param {string} ip
 * @returns {number}
 */
function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Convert a 32-bit unsigned integer to an IP string.
 * @param {number} n
 * @returns {string}
 */
function intToIp(n) {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8)  & 0xff,
    n          & 0xff
  ].join('.');
}

/**
 * Calculate all subnet info from an IP and prefix.
 * @param {string} ip
 * @param {number} prefix
 * @returns {{ network, broadcast, firstHost, lastHost, hosts, mask }}
 */
function calcSubnet(ip, prefix) {
  const ipInt    = ipToInt(ip);
  const maskInt  = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const netInt   = (ipInt & maskInt) >>> 0;
  const bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;
  const firstInt = prefix >= 31 ? netInt   : (netInt + 1) >>> 0;
  const lastInt  = prefix >= 31 ? bcastInt : (bcastInt - 1) >>> 0;
  const hosts    = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, bcastInt - netInt - 1);

  return {
    network:   intToIp(netInt),
    broadcast: intToIp(bcastInt),
    firstHost: intToIp(firstInt),
    lastHost:  intToIp(lastInt),
    hosts,
    mask:      intToIp(maskInt)
  };
}

/**
 * Return a random integer in [min, max] inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// DYNAMIC IP GENERATION
// ============================================================

/**
 * Generate a random private IP that, once masked with `prefix`, produces
 * a network address that has not been used yet in `usedNetworks`.
 *
 * Private ranges used:
 *   Class A  10.x.x.x
 *   Class B  172.16.x.x – 172.31.x.x
 *   Class C  192.168.x.x
 *
 * The returned IP is a host address inside the subnet (not the network or
 * broadcast address), so that medium/hard problems present a realistic host IP.
 *
 * @param {number} prefix
 * @param {Set<string>} usedNetworks
 * @returns {{ ip: string, prefix: number }}
 */
function generateUniqueIP(prefix, usedNetworks) {
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const hostBits = 32 - prefix;
  const subnetSize = Math.pow(2, hostBits);

  // Max 200 tries to find a unique network
  for (let attempt = 0; attempt < 200; attempt++) {
    let baseOctets;
    const range = randInt(0, 2);

    if (range === 0) {
      // 10.x.x.x
      baseOctets = [10, randInt(0, 255), randInt(0, 255), randInt(0, 255)];
    } else if (range === 1) {
      // 172.16-31.x.x
      baseOctets = [172, randInt(16, 31), randInt(0, 255), randInt(0, 255)];
    } else {
      // 192.168.x.x
      baseOctets = [192, 168, randInt(0, 255), randInt(0, 255)];
    }

    const rawInt = ((baseOctets[0] << 24) | (baseOctets[1] << 16) | (baseOctets[2] << 8) | baseOctets[3]) >>> 0;
    const netInt = (rawInt & maskInt) >>> 0;
    const networkKey = `${intToIp(netInt)}/${prefix}`;

    if (usedNetworks.has(networkKey)) continue;

    usedNetworks.add(networkKey);

    // For prefixes <=30, generate a host IP inside the subnet
    // (not the network address and not broadcast)
    let hostInt = netInt;
    if (prefix <= 30 && subnetSize > 2) {
      const offset = randInt(1, subnetSize - 2);
      hostInt = (netInt + offset) >>> 0;
    }

    return { ip: intToIp(hostInt), prefix };
  }

  // Fallback: return a predictable address (should never happen in practice)
  return { ip: '10.0.0.1', prefix };
}

// ============================================================
// STATIC MCQ POOLS (hard mode variety)
// ============================================================

// IPv6 address type identification
const MCQ_IPV6 = [
  {
    type: 'ipv6-type',
    question_fr: 'Quel est le type de l\'adresse IPv6 : FE80::1/64 ?',
    question_en: 'What is the type of IPv6 address: FE80::1/64?',
    choices_fr: ['Global unicast', 'Link-local', 'Loopback', 'Multicast'],
    choices_en: ['Global unicast', 'Link-local', 'Loopback', 'Multicast'],
    correct: 1,
    explanation_fr: 'FE80::/10 est la plage link-local IPv6, valable uniquement sur le segment reseau local.',
    explanation_en: 'FE80::/10 is the IPv6 link-local range, valid only on the local network segment.'
  },
  {
    type: 'ipv6-type',
    question_fr: 'Quel est le type de l\'adresse IPv6 : ::1 ?',
    question_en: 'What is the type of IPv6 address: ::1?',
    choices_fr: ['Global unicast', 'Link-local', 'Loopback', 'Multicast'],
    choices_en: ['Global unicast', 'Link-local', 'Loopback', 'Multicast'],
    correct: 2,
    explanation_fr: '::1 est l\'adresse de loopback IPv6, equivalente a 127.0.0.1 en IPv4.',
    explanation_en: '::1 is the IPv6 loopback address, equivalent to 127.0.0.1 in IPv4.'
  },
  {
    type: 'ipv6-type',
    question_fr: 'Quel est le type de l\'adresse IPv6 : FF02::1 ?',
    question_en: 'What is the type of IPv6 address: FF02::1?',
    choices_fr: ['Global unicast', 'Link-local', 'Loopback', 'Multicast'],
    choices_en: ['Global unicast', 'Link-local', 'Loopback', 'Multicast'],
    correct: 3,
    explanation_fr: 'FF00::/8 est la plage multicast IPv6. FF02::1 est le groupe "all nodes" sur le lien local.',
    explanation_en: 'FF00::/8 is the IPv6 multicast range. FF02::1 is the "all nodes" group on the local link.'
  },
  {
    type: 'ipv6-type',
    question_fr: 'Quel est le type de l\'adresse IPv6 : 2001:DB8::1 ?',
    question_en: 'What is the type of IPv6 address: 2001:DB8::1?',
    choices_fr: ['Link-local', 'Unique-local (ULA)', 'Global unicast', 'Multicast'],
    choices_en: ['Link-local', 'Unique-local (ULA)', 'Global unicast', 'Multicast'],
    correct: 2,
    explanation_fr: '2000::/3 couvre les adresses IPv6 globales unicast (GUA), routables sur Internet.',
    explanation_en: '2000::/3 covers globally routable IPv6 unicast addresses (GUA).'
  },
  {
    type: 'ipv6-type',
    question_fr: 'Quel est le type de l\'adresse IPv6 : FD00::1 ?',
    question_en: 'What is the type of IPv6 address: FD00::1?',
    choices_fr: ['Global unicast', 'Link-local', 'Unique-local (ULA)', 'Multicast'],
    choices_en: ['Global unicast', 'Link-local', 'Unique-local (ULA)', 'Multicast'],
    correct: 2,
    explanation_fr: 'FC00::/7 (souvent FD00::/8 en pratique) est la plage unique-local, l\'equivalent IPv6 des plages privees IPv4.',
    explanation_en: 'FC00::/7 (often FD00::/8 in practice) is the unique-local range, the IPv6 equivalent of IPv4 private ranges.'
  },
  {
    type: 'ipv6-type',
    question_fr: 'Quel prefixe identifie les adresses IPv6 globales routables sur Internet ?',
    question_en: 'Which prefix identifies globally routable IPv6 addresses on the Internet?',
    choices_fr: ['FE80::/10', 'FC00::/7', '2000::/3', 'FF00::/8'],
    choices_en: ['FE80::/10', 'FC00::/7', '2000::/3', 'FF00::/8'],
    correct: 2,
    explanation_fr: '2000::/3 couvre les adresses IPv6 Global Unicast (GUA) routables sur Internet.',
    explanation_en: '2000::/3 covers globally routable IPv6 unicast addresses (GUA) on the Internet.'
  },
  {
    type: 'ipv6-type',
    question_fr: 'L\'adresse ::1/128 est de type :',
    question_en: 'The address ::1/128 is of type:',
    choices_fr: ['Multicast', 'Link-local', 'Loopback', 'Unique-local'],
    choices_en: ['Multicast', 'Link-local', 'Loopback', 'Unique-local'],
    correct: 2,
    explanation_fr: '::1/128 est la seule adresse de loopback IPv6, equivalente a 127.0.0.1/8 en IPv4.',
    explanation_en: '::1/128 is the only IPv6 loopback address, equivalent to 127.0.0.1/8 in IPv4.'
  }
];

// VLSM questions
const MCQ_VLSM = [
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 30 hotes utilisables. Quel est le masque le plus petit suffisant ?',
    question_en: 'You need 30 usable hosts. What is the smallest sufficient subnet mask?',
    choices_fr: ['/25 (126 hotes)', '/26 (62 hotes)', '/27 (30 hotes)', '/28 (14 hotes)'],
    choices_en: ['/25 (126 hosts)', '/26 (62 hosts)', '/27 (30 hosts)', '/28 (14 hosts)'],
    correct: 2,
    explanation_fr: '/27 donne 2^5 - 2 = 30 hotes utilisables. /28 ne donne que 14, insuffisant.',
    explanation_en: '/27 gives 2^5 - 2 = 30 usable hosts. /28 only gives 14, insufficient.'
  },
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 60 hotes utilisables. Quel masque choisir ?',
    question_en: 'You need 60 usable hosts. Which mask to use?',
    choices_fr: ['/24 (254 hotes)', '/25 (126 hotes)', '/26 (62 hotes)', '/27 (30 hotes)'],
    choices_en: ['/24 (254 hosts)', '/25 (126 hosts)', '/26 (62 hosts)', '/27 (30 hosts)'],
    correct: 2,
    explanation_fr: '/26 donne 2^6 - 2 = 62 hotes utilisables, ce qui couvre 60.',
    explanation_en: '/26 gives 2^6 - 2 = 62 usable hosts, which covers 60.'
  },
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 2 hotes utilisables (lien point-a-point). Quel masque choisir ?',
    question_en: 'You need 2 usable hosts (point-to-point link). Which mask to use?',
    choices_fr: ['/28 (14 hotes)', '/29 (6 hotes)', '/30 (2 hotes)', '/31 (2 hotes, RFC 3021)'],
    choices_en: ['/28 (14 hosts)', '/29 (6 hosts)', '/30 (2 hosts)', '/31 (2 hosts, RFC 3021)'],
    correct: 2,
    explanation_fr: '/30 est le masque standard pour un lien point-a-point avec 2 hotes utilisables.',
    explanation_en: '/30 is the standard mask for a point-to-point link with 2 usable hosts.'
  },
  {
    type: 'vlsm',
    question_fr: 'Combien d\'hotes utilisables contient un reseau /25 ?',
    question_en: 'How many usable hosts does a /25 network contain?',
    choices_fr: ['62', '126', '128', '254'],
    choices_en: ['62', '126', '128', '254'],
    correct: 1,
    explanation_fr: '/25 laisse 7 bits pour les hotes : 2^7 - 2 = 126 hotes utilisables.',
    explanation_en: '/25 leaves 7 bits for hosts: 2^7 - 2 = 126 usable hosts.'
  },
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 500 hotes. Quel masque est le plus adapte ?',
    question_en: 'You need 500 hosts. Which mask is most appropriate?',
    choices_fr: ['/22 (1022 hotes)', '/23 (510 hotes)', '/24 (254 hotes)', '/21 (2046 hotes)'],
    choices_en: ['/22 (1022 hosts)', '/23 (510 hosts)', '/24 (254 hosts)', '/21 (2046 hosts)'],
    correct: 1,
    explanation_fr: '/23 donne 2^9 - 2 = 510 hotes utilisables. C\'est le plus petit suffisant pour 500.',
    explanation_en: '/23 gives 2^9 - 2 = 510 usable hosts. It is the smallest that fits 500.'
  },
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 10 hotes utilisables. Quel masque choisir ?',
    question_en: 'You need 10 usable hosts. Which mask to use?',
    choices_fr: ['/26 (62 hotes)', '/27 (30 hotes)', '/28 (14 hotes)', '/29 (6 hotes)'],
    choices_en: ['/26 (62 hosts)', '/27 (30 hosts)', '/28 (14 hosts)', '/29 (6 hosts)'],
    correct: 2,
    explanation_fr: '/28 donne 2^4 - 2 = 14 hotes, le plus petit suffisant pour 10.',
    explanation_en: '/28 gives 2^4 - 2 = 14 hosts, the smallest that fits 10.'
  },
  {
    type: 'vlsm',
    question_fr: 'Combien d\'hotes utilisables dans un /29 ?',
    question_en: 'How many usable hosts in a /29?',
    choices_fr: ['2', '4', '6', '8'],
    choices_en: ['2', '4', '6', '8'],
    correct: 2,
    explanation_fr: '/29 laisse 3 bits hotes : 2^3 - 2 = 6 hotes utilisables.',
    explanation_en: '/29 leaves 3 host bits: 2^3 - 2 = 6 usable hosts.'
  },
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 120 hotes. Quel est le masque le plus petit suffisant ?',
    question_en: 'You need 120 hosts. What is the smallest sufficient mask?',
    choices_fr: ['/24 (254 hotes)', '/25 (126 hotes)', '/26 (62 hotes)', '/23 (510 hotes)'],
    choices_en: ['/24 (254 hosts)', '/25 (126 hosts)', '/26 (62 hosts)', '/23 (510 hosts)'],
    correct: 1,
    explanation_fr: '/25 donne 126 hotes utilisables, le plus petit couvrant 120.',
    explanation_en: '/25 gives 126 usable hosts, the smallest that covers 120.'
  },
  {
    type: 'vlsm',
    question_fr: 'Tu as besoin de 200 hotes. Quel masque choisir ?',
    question_en: 'You need 200 hosts. Which mask to use?',
    choices_fr: ['/23 (510 hotes)', '/24 (254 hotes)', '/25 (126 hotes)', '/22 (1022 hotes)'],
    choices_en: ['/23 (510 hosts)', '/24 (254 hosts)', '/25 (126 hosts)', '/22 (1022 hosts)'],
    correct: 1,
    explanation_fr: '/24 donne 254 hotes utilisables, le plus petit couvrant 200.',
    explanation_en: '/24 gives 254 usable hosts, the smallest that covers 200.'
  },
  {
    type: 'vlsm',
    question_fr: 'Combien de sous-reseaux /27 peut-on creer dans un /24 ?',
    question_en: 'How many /27 subnets can be created inside a /24?',
    choices_fr: ['4', '6', '8', '16'],
    choices_en: ['4', '6', '8', '16'],
    correct: 2,
    explanation_fr: 'Un /24 a 8 bits hotes. Un /27 en prend 3 pour le reseau. 2^3 = 8 sous-reseaux /27.',
    explanation_en: 'A /24 has 8 host bits. A /27 uses 3 for the subnet. 2^3 = 8 subnets of /27.'
  }
];

// Supernetting questions
const MCQ_SUPERNET = [
  {
    type: 'supernet',
    question_fr: 'Quel est le supernet commun a 192.168.0.0/24 et 192.168.1.0/24 ?',
    question_en: 'What is the common supernet of 192.168.0.0/24 and 192.168.1.0/24?',
    choices_fr: ['192.168.0.0/22', '192.168.0.0/23', '192.168.0.0/24', '192.168.0.0/25'],
    choices_en: ['192.168.0.0/22', '192.168.0.0/23', '192.168.0.0/24', '192.168.0.0/25'],
    correct: 1,
    explanation_fr: '192.168.0.0 et 192.168.1.0 ne different que par le bit 0 du 3e octet. Supernet = 192.168.0.0/23.',
    explanation_en: '192.168.0.0 and 192.168.1.0 differ only by bit 0 of the 3rd octet. Supernet = 192.168.0.0/23.'
  },
  {
    type: 'supernet',
    question_fr: 'Quel supernet agrege 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24 et 10.0.3.0/24 ?',
    question_en: 'Which supernet aggregates 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24, and 10.0.3.0/24?',
    choices_fr: ['10.0.0.0/21', '10.0.0.0/22', '10.0.0.0/23', '10.0.0.0/24'],
    choices_en: ['10.0.0.0/21', '10.0.0.0/22', '10.0.0.0/23', '10.0.0.0/24'],
    correct: 1,
    explanation_fr: '4 reseaux /24 consecutifs depuis .0 → /22. 2^(24-22) = 4 sous-reseaux.',
    explanation_en: '4 consecutive /24 networks starting at .0 → /22. 2^(24-22) = 4 subnets.'
  },
  {
    type: 'supernet',
    question_fr: 'Quel est le supernet de 172.16.4.0/24 et 172.16.5.0/24 ?',
    question_en: 'What is the supernet of 172.16.4.0/24 and 172.16.5.0/24?',
    choices_fr: ['172.16.4.0/21', '172.16.4.0/23', '172.16.0.0/22', '172.16.4.0/24'],
    choices_en: ['172.16.4.0/21', '172.16.4.0/23', '172.16.0.0/22', '172.16.4.0/24'],
    correct: 1,
    explanation_fr: '172.16.4.0 et 172.16.5.0 different au bit 0 du 3e octet → supernet 172.16.4.0/23.',
    explanation_en: '172.16.4.0 and 172.16.5.0 differ at bit 0 of the 3rd octet → supernet 172.16.4.0/23.'
  },
  {
    type: 'supernet',
    question_fr: 'Quel supernet agrege 10.10.8.0/24 et 10.10.9.0/24 ?',
    question_en: 'Which supernet aggregates 10.10.8.0/24 and 10.10.9.0/24?',
    choices_fr: ['10.10.8.0/22', '10.10.8.0/23', '10.10.0.0/21', '10.10.8.0/25'],
    choices_en: ['10.10.8.0/22', '10.10.8.0/23', '10.10.0.0/21', '10.10.8.0/25'],
    correct: 1,
    explanation_fr: '10.10.8.0 (00001000) et 10.10.9.0 (00001001) different au bit 0 → supernet 10.10.8.0/23.',
    explanation_en: '10.10.8.0 (00001000) and 10.10.9.0 (00001001) differ at bit 0 → supernet 10.10.8.0/23.'
  },
  {
    type: 'supernet',
    question_fr: 'Quel supernet agrege 192.168.4.0/24, 192.168.5.0/24, 192.168.6.0/24 et 192.168.7.0/24 ?',
    question_en: 'Which supernet aggregates 192.168.4.0/24, 192.168.5.0/24, 192.168.6.0/24 and 192.168.7.0/24?',
    choices_fr: ['192.168.4.0/21', '192.168.4.0/22', '192.168.0.0/21', '192.168.4.0/23'],
    choices_en: ['192.168.4.0/21', '192.168.4.0/22', '192.168.0.0/21', '192.168.4.0/23'],
    correct: 1,
    explanation_fr: '4 reseaux /24 consecutifs depuis .4 → /22. Adresse base = 192.168.4.0/22.',
    explanation_en: '4 consecutive /24 networks starting at .4 → /22. Base address = 192.168.4.0/22.'
  }
];

// Membership questions — generated dynamically at runtime
// The pool below contains static examples; additional ones are generated per game.
const MCQ_MEMBERSHIP_STATIC = [
  {
    type: 'membership',
    question_fr: 'L\'adresse 10.0.0.45 est-elle dans le reseau 10.0.0.32/27 ?',
    question_en: 'Is the address 10.0.0.45 in the network 10.0.0.32/27?',
    choices_fr: ['Oui, elle est dans ce reseau', 'Non, elle est hors de ce reseau'],
    choices_en: ['Yes, it is in this network', 'No, it is outside this network'],
    correct: 0,
    explanation_fr: '10.0.0.32/27 couvre 10.0.0.32 - 10.0.0.63. .45 est dans cette plage → Oui.',
    explanation_en: '10.0.0.32/27 covers 10.0.0.32 to 10.0.0.63. .45 is within this range → Yes.'
  },
  {
    type: 'membership',
    question_fr: 'L\'adresse 172.16.10.100 est-elle dans le reseau 172.16.10.64/27 ?',
    question_en: 'Is the address 172.16.10.100 in the network 172.16.10.64/27?',
    choices_fr: ['Oui, elle est dans ce reseau', 'Non, elle est hors de ce reseau'],
    choices_en: ['Yes, it is in this network', 'No, it is outside this network'],
    correct: 1,
    explanation_fr: '172.16.10.64/27 couvre .64 - .95. .100 est hors de cette plage → Non.',
    explanation_en: '172.16.10.64/27 covers .64 to .95. .100 is outside → No.'
  },
  {
    type: 'membership',
    question_fr: 'L\'adresse 192.168.1.200 est-elle dans le reseau 192.168.1.128/26 ?',
    question_en: 'Is the address 192.168.1.200 in the network 192.168.1.128/26?',
    choices_fr: ['Oui, elle est dans ce reseau', 'Non, elle est hors de ce reseau'],
    choices_en: ['Yes, it is in this network', 'No, it is outside this network'],
    correct: 1,
    explanation_fr: '192.168.1.128/26 couvre .128 - .191. .200 est hors de cette plage → Non.',
    explanation_en: '192.168.1.128/26 covers .128 to .191. .200 is outside → No.'
  },
  {
    type: 'membership',
    question_fr: 'L\'adresse 10.10.10.130 est-elle dans le reseau 10.10.10.128/25 ?',
    question_en: 'Is the address 10.10.10.130 in the network 10.10.10.128/25?',
    choices_fr: ['Oui, elle est dans ce reseau', 'Non, elle est hors de ce reseau'],
    choices_en: ['Yes, it is in this network', 'No, it is outside this network'],
    correct: 0,
    explanation_fr: '10.10.10.128/25 couvre .128 - .255. .130 est dans cette plage → Oui.',
    explanation_en: '10.10.10.128/25 covers .128 to .255. .130 is within this range → Yes.'
  },
  {
    type: 'membership',
    question_fr: 'L\'adresse 192.168.5.50 est-elle dans le reseau 192.168.5.32/28 ?',
    question_en: 'Is the address 192.168.5.50 in the network 192.168.5.32/28?',
    choices_fr: ['Oui, elle est dans ce reseau', 'Non, elle est hors de ce reseau'],
    choices_en: ['Yes, it is in this network', 'No, it is outside this network'],
    correct: 1,
    explanation_fr: '192.168.5.32/28 couvre .32 - .47. .50 est hors de cette plage → Non.',
    explanation_en: '192.168.5.32/28 covers .32 to .47. .50 is outside → No.'
  }
];

/**
 * Generate a random membership MCQ question.
 * @returns {object} MCQ question object
 */
function generateMembershipQuestion(lang) {
  const prefixes = [24, 25, 26, 27, 28, 29];
  const prefix = prefixes[randInt(0, prefixes.length - 1)];
  const maskInt = (~0 << (32 - prefix)) >>> 0;
  const hostBits = 32 - prefix;
  const subnetSize = Math.pow(2, hostBits);

  // Pick a random private base
  const ranges = [
    () => [10, randInt(0, 255), randInt(0, 255), 0],
    () => [172, randInt(16, 31), randInt(0, 255), 0],
    () => [192, 168, randInt(0, 255), 0]
  ];
  const octets = ranges[randInt(0, 2)]();

  // Round down to subnet boundary
  const baseInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  const netInt = (baseInt & maskInt) >>> 0;
  const bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;

  const networkStr = intToIp(netInt);

  // Randomly decide if the test IP is inside or outside
  const isInside = Math.random() < 0.5;
  let testInt;

  if (isInside) {
    // Pick a host inside (not network, not broadcast)
    const offset = subnetSize > 2 ? randInt(1, subnetSize - 2) : 0;
    testInt = (netInt + offset) >>> 0;
  } else {
    // Pick a host clearly outside (at least subnetSize away)
    const delta = subnetSize + randInt(1, subnetSize);
    testInt = (Math.random() < 0.5)
      ? (netInt - delta) >>> 0
      : (bcastInt + delta) >>> 0;
    // Clamp to plausible private range
    testInt = testInt >>> 0;
  }

  const testIP = intToIp(testInt);

  // Verify membership by actual calculation
  const actualInside = ((testInt & maskInt) >>> 0) === netInt;
  const correctIdx = actualInside ? 0 : 1;

  const question_fr = `L'adresse ${testIP} est-elle dans le reseau ${networkStr}/${prefix} ?`;
  const question_en = `Is the address ${testIP} in the network ${networkStr}/${prefix}?`;

  const broadcastStr = intToIp(bcastInt);
  const rangeDesc_fr = `${networkStr}/${prefix} couvre ${networkStr} - ${broadcastStr}.`;
  const rangeDesc_en = `${networkStr}/${prefix} covers ${networkStr} to ${broadcastStr}.`;

  return {
    type: 'membership',
    question_fr,
    question_en,
    choices_fr: ['Oui, elle est dans ce reseau', 'Non, elle est hors de ce reseau'],
    choices_en: ['Yes, it is in this network', 'No, it is outside this network'],
    correct: correctIdx,
    explanation_fr: `${rangeDesc_fr} ${testIP} est ${actualInside ? 'dans' : 'hors de'} cette plage → ${actualInside ? 'Oui' : 'Non'}.`,
    explanation_en: `${rangeDesc_en} ${testIP} is ${actualInside ? 'within' : 'outside'} this range → ${actualInside ? 'Yes' : 'No'}.`
  };
}

// Fields shown per difficulty for IPv4 classic questions
const DIFF_FIELDS = {
  easy:   ['network'],
  medium: ['network', 'broadcast', 'hosts'],
  hard:   ['network', 'broadcast', 'hosts', 'first_host', 'last_host']
};

// Question counts per difficulty
const DIFF_COUNT = {
  easy:   5,
  medium: 8,
  hard:   10
};

// Prefix ranges per difficulty
const DIFF_PREFIXES = {
  easy:   [8, 16, 24],
  medium: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  hard:   [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
};

// Game state
let scState = {
  difficulty: null,
  problems: [],
  currentIndex: 0,
  score: 0,
  attempts: 0,
  finished: false,
  totalProblems: 0
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
  });
});

/**
 * Build the problem list for one game session.
 * @param {string} difficulty
 * @returns {Array} list of problem objects
 */
function buildProblemList(difficulty) {
  const usedNetworks = new Set();
  const count = DIFF_COUNT[difficulty];
  const problems = [];

  if (difficulty === 'easy' || difficulty === 'medium') {
    const prefixes = DIFF_PREFIXES[difficulty];
    for (let i = 0; i < count; i++) {
      const prefix = prefixes[randInt(0, prefixes.length - 1)];
      const { ip } = generateUniqueIP(prefix, usedNetworks);
      problems.push({ type: 'ipv4', ip, prefix });
    }
    return shuffleArray(problems);
  }

  // Hard: mix dynamic IPv4 + static MCQ categories
  // Target breakdown: ~4 IPv4 calc, ~2 VLSM, ~2 membership, ~1 supernet, ~1 IPv6
  const ipv4Count   = 4;
  const vlsmCount   = 2;
  const memberCount = 2;
  const superCount  = 1;
  const ipv6Count   = 1;

  // IPv4 calc
  const prefixes = DIFF_PREFIXES.hard;
  for (let i = 0; i < ipv4Count; i++) {
    const prefix = prefixes[randInt(0, prefixes.length - 1)];
    const { ip } = generateUniqueIP(prefix, usedNetworks);
    problems.push({ type: 'ipv4', ip, prefix });
  }

  // VLSM
  const shuffledVlsm = shuffleArray([...MCQ_VLSM]);
  for (let i = 0; i < Math.min(vlsmCount, shuffledVlsm.length); i++) {
    problems.push(shuffledVlsm[i]);
  }

  // Membership: mix static + dynamic
  const memberProblems = [];
  // Add static ones first
  shuffleArray([...MCQ_MEMBERSHIP_STATIC]).slice(0, memberCount - 1).forEach(q => memberProblems.push(q));
  // Fill remaining with dynamic
  while (memberProblems.length < memberCount) {
    memberProblems.push(generateMembershipQuestion());
  }
  memberProblems.forEach(q => problems.push(q));

  // Supernet
  const shuffledSuper = shuffleArray([...MCQ_SUPERNET]);
  for (let i = 0; i < Math.min(superCount, shuffledSuper.length); i++) {
    problems.push(shuffledSuper[i]);
  }

  // IPv6 type
  const shuffledIpv6 = shuffleArray([...MCQ_IPV6]);
  for (let i = 0; i < Math.min(ipv6Count, shuffledIpv6.length); i++) {
    problems.push(shuffledIpv6[i]);
  }

  return shuffleArray(problems).slice(0, count);
}

function startGame(difficulty) {
  const problems = buildProblemList(difficulty);

  scState = {
    difficulty,
    problems,
    currentIndex: 0,
    score: 0,
    attempts: 0,
    finished: false,
    totalProblems: problems.length
  };

  document.getElementById('difficulty-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('result-screen').style.display = 'none';

  renderProblem();
}

// ============================================================
// RENDER
// ============================================================

function renderProblem() {
  const problem = scState.problems[scState.currentIndex];
  scState.attempts = 0;

  // Update HUD
  document.getElementById('hud-score').textContent = String(scState.score).padStart(5, '0');
  document.getElementById('hud-progress').textContent =
    `${scState.currentIndex + 1}/${scState.totalProblems}`;

  // Explanation area reset
  const explArea = document.getElementById('subnet-explanation');
  explArea.style.display = 'none';
  explArea.innerHTML = '';

  // Validate button
  const validateBtn = document.getElementById('validate-btn');
  const nextBtn = document.getElementById('next-btn');
  validateBtn.style.display = 'inline-block';
  validateBtn.textContent = i18n.t('sc_validate');
  nextBtn.style.display = 'none';

  // Dispatch to the appropriate renderer
  const problemType = problem.type || 'ipv4';

  if (problemType === 'ipv4') {
    renderIPv4Problem(problem);
    validateBtn.onclick = validateIPv4Answers;
  } else {
    // MCQ-style problems
    renderMCQProblem(problem);
    validateBtn.style.display = 'none';
  }
}

// ── IPv4 classic render ───────────────────────────────────────

function renderIPv4Problem(problem) {
  const calc = calcSubnet(problem.ip, problem.prefix);
  const fields = DIFF_FIELDS[scState.difficulty] || DIFF_FIELDS.hard;

  // Store correct answers in DOM dataset for validation
  const gameArea = document.getElementById('subnet-game-area');
  gameArea.dataset.network   = calc.network;
  gameArea.dataset.broadcast = calc.broadcast;
  gameArea.dataset.hosts     = calc.hosts;
  gameArea.dataset.firstHost = calc.firstHost;
  gameArea.dataset.lastHost  = calc.lastHost;

  // Render IP + prefix
  document.getElementById('subnet-ip-display').textContent = problem.ip;
  document.getElementById('subnet-prefix-display').textContent = `/${problem.prefix}`;
  document.getElementById('subnet-mask-display').textContent = `(${calc.mask})`;

  // Render input fields
  const fieldsContainer = document.getElementById('subnet-fields');
  fieldsContainer.innerHTML = '';

  const fieldDefs = [
    { key: 'network',    label: i18n.t('sc_network'),    id: 'input-network',    placeholder: 'x.x.x.x' },
    { key: 'broadcast',  label: i18n.t('sc_broadcast'),  id: 'input-broadcast',  placeholder: 'x.x.x.x' },
    { key: 'hosts',      label: i18n.t('sc_hosts'),      id: 'input-hosts',      placeholder: '0'        },
    { key: 'first_host', label: i18n.t('sc_first_host'), id: 'input-first-host', placeholder: 'x.x.x.x' },
    { key: 'last_host',  label: i18n.t('sc_last_host'),  id: 'input-last-host',  placeholder: 'x.x.x.x' },
  ];

  fieldDefs.filter(f => fields.includes(f.key)).forEach(fd => {
    const div = document.createElement('div');
    div.className = 'subnet-field';
    div.innerHTML = `
      <label class="subnet-field__label" for="${fd.id}">${fd.label}</label>
      <input
        type="text"
        class="subnet-field__input"
        id="${fd.id}"
        data-field="${fd.key}"
        placeholder="${fd.placeholder}"
        autocomplete="off"
        spellcheck="false"
        aria-label="${fd.label}"
      >
    `;
    fieldsContainer.appendChild(div);
  });
}

// ── MCQ render (IPv6, VLSM, supernet, membership) ─────────────

function renderMCQProblem(problem) {
  const lang = i18n.getLang();

  // Clear IP display fields
  document.getElementById('subnet-ip-display').textContent = '';
  document.getElementById('subnet-prefix-display').textContent = '';
  document.getElementById('subnet-mask-display').textContent = '';

  const fieldsContainer = document.getElementById('subnet-fields');
  fieldsContainer.innerHTML = '';

  const questionText = lang === 'fr' ? problem.question_fr : problem.question_en;
  const choices = lang === 'fr' ? problem.choices_fr : problem.choices_en;

  const qEl = document.createElement('p');
  qEl.className = 'subnet-mcq-question';
  qEl.textContent = questionText;
  fieldsContainer.appendChild(qEl);

  choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer subnet-mcq-answer';
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${choice}`;
    btn.dataset.index = idx;

    btn.addEventListener('click', () => onMCQAnswer(idx, problem));
    fieldsContainer.appendChild(btn);
  });
}

// ============================================================
// VALIDATION — IPv4 classic
// ============================================================

function validateIPv4Answers() {
  const gameArea = document.getElementById('subnet-game-area');
  const fields   = DIFF_FIELDS[scState.difficulty] || DIFF_FIELDS.hard;

  const correctMap = {
    network:    gameArea.dataset.network,
    broadcast:  gameArea.dataset.broadcast,
    hosts:      gameArea.dataset.hosts,
    first_host: gameArea.dataset.firstHost,
    last_host:  gameArea.dataset.lastHost,
  };

  let allCorrect = true;

  document.querySelectorAll('.subnet-field__input').forEach(input => {
    const field = input.dataset.field;
    const answer = input.value.trim();
    const correct = correctMap[field];

    const isCorrect = answer === String(correct);

    input.classList.remove('correct', 'wrong');
    if (isCorrect) {
      input.classList.add('correct');
    } else {
      input.classList.add('wrong');
      allCorrect = false;
    }
  });

  scState.attempts++;

  if (allCorrect) {
    const penalty = (scState.attempts - 1) * 50;
    const earned  = Math.max(0, 200 - penalty);
    scState.score += earned;
    document.getElementById('hud-score').textContent = String(scState.score).padStart(5, '0');
  }

  showIPv4Explanation(correctMap);

  document.getElementById('validate-btn').style.display = 'none';
  advanceOrFinish();
}

function showIPv4Explanation(correctMap) {
  const problem = scState.problems[scState.currentIndex];
  const fields  = DIFF_FIELDS[scState.difficulty] || DIFF_FIELDS.hard;
  const explArea = document.getElementById('subnet-explanation');

  const fieldLabels = {
    network:    i18n.t('sc_network'),
    broadcast:  i18n.t('sc_broadcast'),
    hosts:      i18n.t('sc_hosts'),
    first_host: i18n.t('sc_first_host'),
    last_host:  i18n.t('sc_last_host'),
  };

  const lines = fields.map(f => `${fieldLabels[f]}: <span class="text-green">${correctMap[f]}</span>`).join('<br>');

  const calc = calcSubnet(problem.ip, problem.prefix);
  const binaryMask = intToIp(ipToInt(calc.mask)).split('.').map(o =>
    parseInt(o, 10).toString(2).padStart(8, '0')
  ).join('.');

  explArea.style.display = 'block';
  explArea.innerHTML = `
    <p class="subnet-explanation__title">${i18n.t('sc_explanation')}</p>
    <p>${problem.ip}/${problem.prefix} &mdash; Masque: ${calc.mask}</p>
    <p style="font-size:0.32rem; color:#555; margin-top:8px;">${binaryMask}</p>
    <hr class="divider" style="margin:12px 0;">
    ${lines}
  `;
}

// ============================================================
// VALIDATION — MCQ (IPv6, VLSM, supernet, membership)
// ============================================================

function onMCQAnswer(selectedIdx, problem) {
  const lang = i18n.getLang();

  document.querySelectorAll('.subnet-mcq-answer').forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === problem.correct) btn.classList.add('correct');
    if (idx === selectedIdx && idx !== problem.correct) btn.classList.add('wrong');
  });

  scState.attempts = 1;
  const isCorrect = selectedIdx === problem.correct;

  if (isCorrect) {
    scState.score += 200;
    document.getElementById('hud-score').textContent = String(scState.score).padStart(5, '0');
  }

  const explArea = document.getElementById('subnet-explanation');
  const explanationText = lang === 'fr' ? problem.explanation_fr : problem.explanation_en;
  explArea.style.display = 'block';
  explArea.innerHTML = `
    <p class="subnet-explanation__title">${i18n.t('sc_explanation')}</p>
    <p>${explanationText}</p>
  `;

  document.getElementById('validate-btn').style.display = 'none';
  advanceOrFinish();
}

// ============================================================
// NAVIGATION
// ============================================================

function advanceOrFinish() {
  const nextBtn = document.getElementById('next-btn');
  const isLast = scState.currentIndex >= scState.totalProblems - 1;
  nextBtn.textContent = isLast ? i18n.t('pq_finish') : i18n.t('sc_next');
  nextBtn.style.display = 'inline-block';
  nextBtn.onclick = () => {
    if (isLast) {
      endGame();
    } else {
      scState.currentIndex++;
      renderProblem();
    }
  };
}

// ============================================================
// GAME OVER
// ============================================================

function endGame() {
  scState.finished = true;

  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  const maxScore = scState.totalProblems * 200;
  const win = scState.score >= maxScore * 0.5;

  document.getElementById('result-title').textContent = win
    ? i18n.t('victory')
    : i18n.t('game_over');
  document.getElementById('result-title').className = win
    ? 'game-result__title game-result__title--win'
    : 'game-result__title game-result__title--lose';
  document.getElementById('result-score').textContent =
    String(scState.score).padStart(6, '0');

  document.getElementById('save-score-btn').onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('score-entry-screen').style.display = 'block';

    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, 'subnet-challenge', scState.difficulty, scState.score);
        document.getElementById('score-entry-screen').style.display = 'none';
        document.getElementById('post-save-screen').style.display = 'block';

        // Check and show newly unlocked rewards
        const newPins = checkRewards();
        showRewardNotifications(newPins, { isGamePage: true });

        document.getElementById('capture-btn').onclick = () => {
          ticket.generate({
            initials,
            game: i18n.t('game_subnet_challenge'),
            difficulty: scState.difficulty,
            score: scState.score,
            topScore: maxScore
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

// ============================================================
// UTILITIES
// ============================================================

/**
 * Fisher-Yates shuffle — returns a shuffled copy.
 * @param {Array} array
 * @returns {Array}
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
