/**
 * protocol-quiz.js — Protocol Quiz game logic
 *
 * QCM on network protocols. Questions are drawn randomly from a pool
 * filtered by level per difficulty.
 *
 * Each question has a level field:
 *   'basic'        — easy fundamentals
 *   'intermediate' — routing, VLAN, security, supervision
 *   'advanced'     — BGP attributes, OSPF LSA, STP timers, PKI, IPv6 NDP, etc.
 *
 * Difficulty configs:
 *   easy   — 12 questions drawn from level 'basic' only
 *   medium — 20 questions drawn from 'basic' + 'intermediate'
 *   hard   — 30 questions drawn from all levels, 10 seconds per question
 */

// ── Full question bank (120+ questions) ───────────────────────

const QUESTION_BANK = [

  // ════════════════════════════════════════════════════════════
  // BASIC
  // ════════════════════════════════════════════════════════════

  // TCP vs UDP
  {
    level: 'basic',
    q_fr: 'Lequel de ces protocoles est ORIENTE CONNEXION ?',
    q_en: 'Which protocol is CONNECTION-ORIENTED?',
    answers_fr: ['TCP', 'UDP', 'ICMP', 'ARP'],
    answers_en: ['TCP', 'UDP', 'ICMP', 'ARP'],
    correct: 0,
    explanation_fr: 'TCP etablit une connexion via un handshake a 3 voies avant tout echange de donnees.',
    explanation_en: 'TCP establishes a connection via a 3-way handshake before any data exchange.'
  },
  {
    level: 'basic',
    q_fr: 'UDP est plus rapide que TCP car il :',
    q_en: 'UDP is faster than TCP because it:',
    answers_fr: ['Compresse les donnees', 'N\'etablit pas de connexion', 'Utilise IPv6', 'Chiffre les paquets'],
    answers_en: ['Compresses data', 'Does not establish a connection', 'Uses IPv6', 'Encrypts packets'],
    correct: 1,
    explanation_fr: 'UDP n\'effectue pas de handshake ni de verification de reception, ce qui reduit la latence.',
    explanation_en: 'UDP performs no handshake or receipt acknowledgment, reducing latency.'
  },

  // Protocol roles
  {
    level: 'basic',
    q_fr: 'DNS sert principalement a :',
    q_en: 'DNS is primarily used to:',
    answers_fr: ['Attribuer des adresses IP', 'Resoudre des noms en adresses IP', 'Chiffrer le trafic web', 'Router les paquets'],
    answers_en: ['Assign IP addresses', 'Resolve names to IP addresses', 'Encrypt web traffic', 'Route packets'],
    correct: 1,
    explanation_fr: 'DNS traduit les noms de domaine (ex: google.com) en adresses IP.',
    explanation_en: 'DNS translates domain names (e.g. google.com) into IP addresses.'
  },
  {
    level: 'basic',
    q_fr: 'DHCP est utilise pour :',
    q_en: 'DHCP is used to:',
    answers_fr: ['Resoudre les noms DNS', 'Attribuer automatiquement des adresses IP', 'Securiser les connexions SSH', 'Monitorer le reseau'],
    answers_en: ['Resolve DNS names', 'Automatically assign IP addresses', 'Secure SSH connections', 'Monitor the network'],
    correct: 1,
    explanation_fr: 'DHCP attribue automatiquement adresses IP, masque, passerelle et DNS aux clients.',
    explanation_en: 'DHCP automatically assigns IP addresses, subnet masks, gateways and DNS to clients.'
  },

  // Ports
  {
    level: 'basic',
    q_fr: 'Quel port utilise HTTPS par defaut ?',
    q_en: 'What port does HTTPS use by default?',
    answers_fr: ['80', '8080', '443', '8443'],
    answers_en: ['80', '8080', '443', '8443'],
    correct: 2,
    explanation_fr: 'HTTPS utilise le port 443/TCP. HTTP utilise le port 80/TCP.',
    explanation_en: 'HTTPS uses port 443/TCP. HTTP uses port 80/TCP.'
  },
  {
    level: 'basic',
    q_fr: 'Quel est le port par defaut de SSH ?',
    q_en: 'What is the default port of SSH?',
    answers_fr: ['21', '22', '23', '25'],
    answers_en: ['21', '22', '23', '25'],
    correct: 1,
    explanation_fr: 'SSH utilise le port 22/TCP. Telnet (non chiffre) utilise le port 23.',
    explanation_en: 'SSH uses port 22/TCP. Telnet (unencrypted) uses port 23.'
  },
  {
    level: 'basic',
    q_fr: 'Quel port utilise DNS par defaut ?',
    q_en: 'What port does DNS use by default?',
    answers_fr: ['25', '53', '80', '389'],
    answers_en: ['25', '53', '80', '389'],
    correct: 1,
    explanation_fr: 'DNS utilise le port 53, en UDP pour les requetes et en TCP pour les transferts de zone.',
    explanation_en: 'DNS uses port 53, UDP for queries and TCP for zone transfers.'
  },
  {
    level: 'basic',
    q_fr: 'SMTP utilise quel port par defaut ?',
    q_en: 'What port does SMTP use by default?',
    answers_fr: ['25', '110', '143', '465'],
    answers_en: ['25', '110', '143', '465'],
    correct: 0,
    explanation_fr: 'SMTP utilise le port 25 pour l\'envoi de mail entre serveurs.',
    explanation_en: 'SMTP uses port 25 for mail transfer between servers.'
  },
  {
    level: 'basic',
    q_fr: 'Quel port utilise RDP ?',
    q_en: 'What port does RDP use?',
    answers_fr: ['22', '3389', '5900', '5985'],
    answers_en: ['22', '3389', '5900', '5985'],
    correct: 1,
    explanation_fr: 'RDP de Microsoft utilise le port 3389/TCP.',
    explanation_en: 'Microsoft\'s RDP uses port 3389/TCP.'
  },

  // OSI layers
  {
    level: 'basic',
    q_fr: 'A quelle couche OSI opere TCP ?',
    q_en: 'At which OSI layer does TCP operate?',
    answers_fr: ['Couche 2 — Liaison', 'Couche 3 — Reseau', 'Couche 4 — Transport', 'Couche 7 — Application'],
    answers_en: ['Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport', 'Layer 7 — Application'],
    correct: 2,
    explanation_fr: 'TCP et UDP operent a la couche 4 (Transport) du modele OSI.',
    explanation_en: 'TCP and UDP operate at layer 4 (Transport) of the OSI model.'
  },
  {
    level: 'basic',
    q_fr: 'A quelle couche OSI opere IP ?',
    q_en: 'At which OSI layer does IP operate?',
    answers_fr: ['Couche 1 — Physique', 'Couche 2 — Liaison', 'Couche 3 — Reseau', 'Couche 4 — Transport'],
    answers_en: ['Layer 1 — Physical', 'Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport'],
    correct: 2,
    explanation_fr: 'IP opere a la couche 3 (Reseau) du modele OSI.',
    explanation_en: 'IP operates at layer 3 (Network) of the OSI model.'
  },
  {
    level: 'basic',
    q_fr: 'A quelle couche OSI se trouve Ethernet ?',
    q_en: 'At which OSI layer is Ethernet found?',
    answers_fr: ['Couche 1 — Physique', 'Couche 2 — Liaison', 'Couche 3 — Reseau', 'Couche 5 — Session'],
    answers_en: ['Layer 1 — Physical', 'Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 5 — Session'],
    correct: 1,
    explanation_fr: 'Ethernet opere a la couche 2 (Liaison), utilisant des adresses MAC.',
    explanation_en: 'Ethernet operates at layer 2 (Data Link) using MAC addresses.'
  },
  {
    level: 'basic',
    q_fr: 'Un switch opere principalement a quelle couche OSI ?',
    q_en: 'A switch primarily operates at which OSI layer?',
    answers_fr: ['Couche 1', 'Couche 2', 'Couche 3', 'Couche 4'],
    answers_en: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4'],
    correct: 1,
    explanation_fr: 'Un switch opere a la couche 2 (Liaison) via les adresses MAC. Un routeur opere a la couche 3.',
    explanation_en: 'A switch operates at layer 2 (Data Link) using MAC addresses. A router operates at layer 3.'
  },

  // HTTP vs HTTPS
  {
    level: 'basic',
    q_fr: 'Quelle est la principale difference entre HTTP et HTTPS ?',
    q_en: 'What is the main difference between HTTP and HTTPS?',
    answers_fr: ['HTTPS est plus rapide', 'HTTPS chiffre les communications via TLS', 'HTTPS utilise IPv6', 'HTTPS ne necessite pas de port'],
    answers_en: ['HTTPS is faster', 'HTTPS encrypts communications via TLS', 'HTTPS uses IPv6', 'HTTPS requires no port'],
    correct: 1,
    explanation_fr: 'HTTPS encapsule HTTP dans une couche TLS, chiffrant les donnees echangees.',
    explanation_en: 'HTTPS wraps HTTP inside a TLS layer, encrypting the data exchanged.'
  },

  // ARP, ICMP
  {
    level: 'basic',
    q_fr: 'ARP est utilise pour :',
    q_en: 'ARP is used to:',
    answers_fr: ['Resoudre les noms DNS', 'Convertir une adresse IP en adresse MAC', 'Attribuer des adresses IP', 'Tester la connectivite reseau'],
    answers_en: ['Resolve DNS names', 'Convert an IP address to a MAC address', 'Assign IP addresses', 'Test network connectivity'],
    correct: 1,
    explanation_fr: 'ARP resout une adresse IP en adresse MAC sur le reseau local.',
    explanation_en: 'ARP resolves an IP address to a MAC address on the local network.'
  },
  {
    level: 'basic',
    q_fr: 'La commande PING utilise quel protocole ?',
    q_en: 'The PING command uses which protocol?',
    answers_fr: ['TCP', 'UDP', 'ICMP', 'ARP'],
    answers_en: ['TCP', 'UDP', 'ICMP', 'ARP'],
    correct: 2,
    explanation_fr: 'ping utilise ICMP, specifiquement les messages Echo Request et Echo Reply.',
    explanation_en: 'ping uses ICMP, specifically Echo Request and Echo Reply messages.'
  },

  // TCP handshake
  {
    level: 'basic',
    q_fr: 'Quelle est la sequence correcte du handshake TCP a 3 voies ?',
    q_en: 'What is the correct sequence of the TCP 3-way handshake?',
    answers_fr: ['SYN → ACK → SYN-ACK', 'SYN → SYN-ACK → ACK', 'ACK → SYN → SYN-ACK', 'SYN-ACK → SYN → ACK'],
    answers_en: ['SYN → ACK → SYN-ACK', 'SYN → SYN-ACK → ACK', 'ACK → SYN → SYN-ACK', 'SYN-ACK → SYN → ACK'],
    correct: 1,
    explanation_fr: 'Le client envoie SYN, le serveur repond SYN-ACK, le client confirme avec ACK.',
    explanation_en: 'The client sends SYN, the server replies SYN-ACK, the client confirms with ACK.'
  },
  {
    level: 'basic',
    q_fr: 'Qu\'indique le flag SYN dans un segment TCP ?',
    q_en: 'What does the SYN flag indicate in a TCP segment?',
    answers_fr: ['Fin de la connexion', 'Demande d\'initialisation de connexion', 'Acquittement de donnees', 'Reset de la connexion'],
    answers_en: ['End of connection', 'Connection initialization request', 'Data acknowledgment', 'Connection reset'],
    correct: 1,
    explanation_fr: 'SYN initialise une connexion TCP. FIN la termine. RST l\'interrompt abruptement.',
    explanation_en: 'SYN initiates a TCP connection. FIN closes it. RST abruptly terminates it.'
  },

  // Email
  {
    level: 'basic',
    q_fr: 'Quel est le role de IMAP par rapport a POP3 ?',
    q_en: 'What is IMAP\'s role compared to POP3?',
    answers_fr: ['IMAP est plus rapide', 'IMAP garde les emails sur le serveur', 'IMAP chiffre les emails', 'IMAP utilise moins de bande passante'],
    answers_en: ['IMAP is faster', 'IMAP keeps emails on the server', 'IMAP encrypts emails', 'IMAP uses less bandwidth'],
    correct: 1,
    explanation_fr: 'IMAP synchronise les emails sur le serveur (multi-appareils). POP3 les telecharge et les supprime.',
    explanation_en: 'IMAP synchronizes emails on the server (multi-device). POP3 downloads and deletes them.'
  },

  // FTP
  {
    level: 'basic',
    q_fr: 'FTP transfere les fichiers via :',
    q_en: 'FTP transfers files via:',
    answers_fr: ['Un seul port', 'Deux ports (commande + donnees)', 'Un tunnel SSL', 'Le port 80'],
    answers_en: ['A single port', 'Two ports (command + data)', 'An SSL tunnel', 'Port 80'],
    correct: 1,
    explanation_fr: 'FTP utilise le port 21 pour les commandes et le port 20 (mode actif) pour les donnees.',
    explanation_en: 'FTP uses port 21 for commands and port 20 (active mode) for data.'
  },

  // DNS records
  {
    level: 'basic',
    q_fr: 'Quel enregistrement DNS associe un nom a une adresse IPv6 ?',
    q_en: 'Which DNS record maps a name to an IPv6 address?',
    answers_fr: ['A', 'AAAA', 'MX', 'PTR'],
    answers_en: ['A', 'AAAA', 'MX', 'PTR'],
    correct: 1,
    explanation_fr: 'L\'enregistrement AAAA pointe un nom vers une adresse IPv6. A pointe vers IPv4.',
    explanation_en: 'The AAAA record maps a name to an IPv6 address. A maps to IPv4.'
  },
  {
    level: 'basic',
    q_fr: 'Quel enregistrement DNS designe le serveur de messagerie d\'un domaine ?',
    q_en: 'Which DNS record designates the mail server for a domain?',
    answers_fr: ['A', 'CNAME', 'MX', 'TXT'],
    answers_en: ['A', 'CNAME', 'MX', 'TXT'],
    correct: 2,
    explanation_fr: 'L\'enregistrement MX pointe vers le ou les serveurs de messagerie d\'un domaine.',
    explanation_en: 'The MX record points to the mail server(s) for a domain.'
  },
  {
    level: 'basic',
    q_fr: 'Quel enregistrement DNS est un alias vers un autre nom ?',
    q_en: 'Which DNS record is an alias pointing to another name?',
    answers_fr: ['A', 'AAAA', 'CNAME', 'PTR'],
    answers_en: ['A', 'AAAA', 'CNAME', 'PTR'],
    correct: 2,
    explanation_fr: 'CNAME cree un alias vers un autre enregistrement DNS.',
    explanation_en: 'CNAME creates an alias to another DNS record.'
  },
  {
    level: 'basic',
    q_fr: 'Quel enregistrement DNS est utilise pour la resolution inverse (IP -> nom) ?',
    q_en: 'Which DNS record is used for reverse lookup (IP to name)?',
    answers_fr: ['A', 'MX', 'SRV', 'PTR'],
    answers_en: ['A', 'MX', 'SRV', 'PTR'],
    correct: 3,
    explanation_fr: 'L\'enregistrement PTR est utilise pour la resolution inverse.',
    explanation_en: 'The PTR record is used for reverse lookup.'
  },

  // Databases
  {
    level: 'basic',
    q_fr: 'Quel protocole utilise le port 3306 ?',
    q_en: 'Which protocol uses port 3306?',
    answers_fr: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
    answers_en: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
    correct: 1,
    explanation_fr: 'MySQL utilise le port 3306/TCP. PostgreSQL utilise 5432.',
    explanation_en: 'MySQL uses port 3306/TCP by default. PostgreSQL uses 5432.'
  },
  {
    level: 'basic',
    q_fr: 'Quel est le port de PostgreSQL ?',
    q_en: 'What is the default port for PostgreSQL?',
    answers_fr: ['1433', '3306', '5432', '27017'],
    answers_en: ['1433', '3306', '5432', '27017'],
    correct: 2,
    explanation_fr: 'PostgreSQL utilise le port 5432/TCP. MySQL utilise 3306, MSSQL utilise 1433.',
    explanation_en: 'PostgreSQL uses port 5432/TCP. MySQL uses 3306, MSSQL uses 1433.'
  },

  // IPv6 basics
  {
    level: 'basic',
    q_fr: 'Une adresse IPv6 qui commence par FE80::/10 est de type :',
    q_en: 'An IPv6 address starting with FE80::/10 is of type:',
    answers_fr: ['Loopback', 'Link-local', 'Multicast', 'Global unicast'],
    answers_en: ['Loopback', 'Link-local', 'Multicast', 'Global unicast'],
    correct: 1,
    explanation_fr: 'Les adresses link-local IPv6 commencent par FE80::/10 et sont valables uniquement sur le segment local.',
    explanation_en: 'IPv6 link-local addresses start with FE80::/10 and are only valid on the local segment.'
  },
  {
    level: 'basic',
    q_fr: 'L\'adresse IPv6 de loopback est :',
    q_en: 'The IPv6 loopback address is:',
    answers_fr: ['::0', '::1', 'FF02::1', 'FE80::1'],
    answers_en: ['::0', '::1', 'FF02::1', 'FE80::1'],
    correct: 1,
    explanation_fr: '::1 est l\'adresse de loopback IPv6, equivalente a 127.0.0.1 en IPv4.',
    explanation_en: '::1 is the IPv6 loopback address, equivalent to 127.0.0.1 in IPv4.'
  },

  // TLS misc
  {
    level: 'basic',
    q_fr: 'Quelle couche OSI gere le chiffrement TLS ?',
    q_en: 'Which OSI layer handles TLS encryption?',
    answers_fr: ['Couche 3 — Reseau', 'Couche 4 — Transport', 'Couche 6 — Presentation', 'Couche 7 — Application'],
    answers_en: ['Layer 3 — Network', 'Layer 4 — Transport', 'Layer 6 — Presentation', 'Layer 7 — Application'],
    correct: 2,
    explanation_fr: 'TLS/SSL est classe a la couche 6 (Presentation).',
    explanation_en: 'TLS/SSL is classified at layer 6 (Presentation) of the OSI model.'
  },
  {
    level: 'basic',
    q_fr: 'Un paquet IP qui ne peut pas atteindre sa destination recoit :',
    q_en: 'An IP packet that cannot reach its destination receives:',
    answers_fr: ['Un message TCP RST', 'Un message ICMP Destination Unreachable', 'Un message ARP Reply', 'Un message DHCP NACK'],
    answers_en: ['A TCP RST message', 'An ICMP Destination Unreachable message', 'An ARP Reply', 'A DHCP NACK message'],
    correct: 1,
    explanation_fr: 'ICMP envoie un message "Destination Unreachable" quand un paquet ne peut pas etre delivre.',
    explanation_en: 'ICMP sends a "Destination Unreachable" message when a packet cannot be delivered.'
  },

  // Windows / Linux misc
  {
    level: 'basic',
    q_fr: 'WinRM utilise quel port par defaut (HTTP) ?',
    q_en: 'WinRM uses which default port (HTTP)?',
    answers_fr: ['3389', '5985', '5986', '8080'],
    answers_en: ['3389', '5985', '5986', '8080'],
    correct: 1,
    explanation_fr: 'WinRM utilise le port 5985/TCP en HTTP et 5986/TCP en HTTPS.',
    explanation_en: 'WinRM uses port 5985/TCP for HTTP and 5986/TCP for HTTPS.'
  },
  {
    level: 'basic',
    q_fr: 'NFS utilise quel port par defaut ?',
    q_en: 'NFS uses which default port?',
    answers_fr: ['139', '445', '873', '2049'],
    answers_en: ['139', '445', '873', '2049'],
    correct: 3,
    explanation_fr: 'NFS utilise le port 2049/TCP et UDP. SMB utilise 445.',
    explanation_en: 'NFS uses port 2049/TCP and UDP. SMB uses 445.'
  },
  {
    level: 'basic',
    q_fr: 'Samba/SMB utilise quel port principal ?',
    q_en: 'Samba/SMB uses which main port?',
    answers_fr: ['139', '389', '445', '2049'],
    answers_en: ['139', '389', '445', '2049'],
    correct: 2,
    explanation_fr: 'SMB utilise le port 445/TCP. Le port 139 (NetBIOS) est l\'ancienne methode.',
    explanation_en: 'SMB uses port 445/TCP. Port 139 (NetBIOS) is the legacy method.'
  },
  {
    level: 'basic',
    q_fr: 'Quel protocole utilise traceroute sous Linux par defaut ?',
    q_en: 'Which protocol does traceroute (Linux) use by default?',
    answers_fr: ['TCP SYN', 'UDP', 'ICMP Echo', 'ARP'],
    answers_en: ['TCP SYN', 'UDP', 'ICMP Echo', 'ARP'],
    correct: 1,
    explanation_fr: 'traceroute (Linux) envoie des paquets UDP avec un TTL incrementiel. tracert (Windows) utilise ICMP Echo.',
    explanation_en: 'traceroute (Linux) sends UDP packets with an incremental TTL. tracert (Windows) uses ICMP Echo.'
  },
  {
    level: 'basic',
    q_fr: 'Quel enregistrement DNS contient du texte libre (ex: SPF, DKIM) ?',
    q_en: 'Which DNS record holds free-form text (e.g. SPF, DKIM)?',
    answers_fr: ['A', 'MX', 'TXT', 'CNAME'],
    answers_en: ['A', 'MX', 'TXT', 'CNAME'],
    correct: 2,
    explanation_fr: 'L\'enregistrement TXT est utilise pour SPF, DKIM, DMARC et la verification de domaine.',
    explanation_en: 'The TXT record is used for SPF, DKIM, DMARC, and domain verification.'
  },

  // ════════════════════════════════════════════════════════════
  // INTERMEDIATE
  // ════════════════════════════════════════════════════════════

  // Routing protocols
  {
    level: 'intermediate',
    q_fr: 'BGP est utilise pour le routage :',
    q_en: 'BGP is used for:',
    answers_fr: ['Interne a un LAN', 'Entre systemes autonomes (AS) sur Internet', 'Dans les VLAN', 'Dans les tunnels VPN'],
    answers_en: ['Internal to a LAN', 'Between autonomous systems (AS) on the Internet', 'Within VLANs', 'Inside VPN tunnels'],
    correct: 1,
    explanation_fr: 'BGP est le protocole de routage inter-AS qui gere les routes sur Internet.',
    explanation_en: 'BGP is the inter-AS routing protocol that manages routes on the Internet.'
  },
  {
    level: 'intermediate',
    q_fr: 'OSPF est un protocole de routage de type :',
    q_en: 'OSPF is a routing protocol of type:',
    answers_fr: ['Distance-vector', 'Link-state', 'Path-vector', 'Statique'],
    answers_en: ['Distance-vector', 'Link-state', 'Path-vector', 'Static'],
    correct: 1,
    explanation_fr: 'OSPF est un protocole link-state. Chaque routeur connait la topologie complete du reseau.',
    explanation_en: 'OSPF is a link-state protocol. Each router knows the complete network topology.'
  },
  {
    level: 'intermediate',
    q_fr: 'Quelle est la distance administrative par defaut d\'OSPF ?',
    q_en: 'What is the default administrative distance of OSPF?',
    answers_fr: ['90', '110', '120', '170'],
    answers_en: ['90', '110', '120', '170'],
    correct: 1,
    explanation_fr: 'OSPF a une distance administrative de 110. RIP = 120, EIGRP interne = 90, eBGP = 20.',
    explanation_en: 'OSPF has an administrative distance of 110. RIP = 120, EIGRP internal = 90, eBGP = 20.'
  },
  {
    level: 'intermediate',
    q_fr: 'RIP utilise quel mecanisme pour calculer la meilleure route ?',
    q_en: 'RIP uses which mechanism to select the best route?',
    answers_fr: ['Bande passante', 'Nombre de sauts (hop count)', 'Cout OSPF', 'Metrique composite'],
    answers_en: ['Bandwidth', 'Hop count', 'OSPF cost', 'Composite metric'],
    correct: 1,
    explanation_fr: 'RIP utilise le hop count (max 15). Au-dela de 15 sauts, la route est inaccessible.',
    explanation_en: 'RIP uses hop count (max 15). Beyond 15 hops, the route is unreachable.'
  },
  {
    level: 'intermediate',
    q_fr: 'EIGRP est developpe par :',
    q_en: 'EIGRP was developed by:',
    answers_fr: ['Microsoft', 'Cisco', 'Juniper', 'IETF'],
    answers_en: ['Microsoft', 'Cisco', 'Juniper', 'IETF'],
    correct: 1,
    explanation_fr: 'EIGRP est un protocole proprietaire Cisco, hybride entre distance-vector et link-state.',
    explanation_en: 'EIGRP is a Cisco proprietary protocol, hybrid between distance-vector and link-state.'
  },
  {
    level: 'intermediate',
    q_fr: 'La distance administrative d\'une route statique est :',
    q_en: 'The administrative distance of a static route is:',
    answers_fr: ['0', '1', '5', '110'],
    answers_en: ['0', '1', '5', '110'],
    correct: 1,
    explanation_fr: 'Une route statique a une distance administrative de 1. Une route directement connectee vaut 0.',
    explanation_en: 'A static route has an administrative distance of 1. A directly connected route is 0.'
  },
  {
    level: 'intermediate',
    q_fr: 'Quelle distance administrative a une route iBGP ?',
    q_en: 'What is the administrative distance of an iBGP route?',
    answers_fr: ['20', '90', '110', '200'],
    answers_en: ['20', '90', '110', '200'],
    correct: 3,
    explanation_fr: 'iBGP (interne) a une distance administrative de 200. eBGP (externe) a 20.',
    explanation_en: 'iBGP (internal) has an administrative distance of 200. eBGP (external) has 20.'
  },
  {
    level: 'intermediate',
    q_fr: 'OSPF utilise quel algorithme pour calculer les routes ?',
    q_en: 'OSPF uses which algorithm to calculate routes?',
    answers_fr: ['Bellman-Ford', 'Dijkstra (SPF)', 'RIP metric', 'EIGRP metric'],
    answers_en: ['Bellman-Ford', 'Dijkstra (SPF)', 'RIP metric', 'EIGRP metric'],
    correct: 1,
    explanation_fr: 'OSPF utilise l\'algorithme SPF (Shortest Path First) de Dijkstra.',
    explanation_en: 'OSPF uses Dijkstra\'s SPF (Shortest Path First) algorithm.'
  },

  // VLAN and 802.1Q
  {
    level: 'intermediate',
    q_fr: '802.1Q est la norme pour :',
    q_en: '802.1Q is the standard for:',
    answers_fr: ['L\'authentification Wi-Fi', 'Le trunking VLAN', 'Le spanning tree', 'Le routage inter-VLAN'],
    answers_en: ['Wi-Fi authentication', 'VLAN trunking', 'Spanning tree', 'Inter-VLAN routing'],
    correct: 1,
    explanation_fr: '802.1Q est la norme IEEE pour le trunking VLAN, ajoutant un tag de 4 octets dans la trame Ethernet.',
    explanation_en: '802.1Q is the IEEE standard for VLAN trunking, adding a 4-byte tag to Ethernet frames.'
  },
  {
    level: 'intermediate',
    q_fr: 'Un port trunk VLAN transporte :',
    q_en: 'A VLAN trunk port carries:',
    answers_fr: ['Un seul VLAN', 'Plusieurs VLANs simultanement', 'Uniquement le VLAN natif', 'Le trafic en clair sans tag'],
    answers_en: ['A single VLAN', 'Multiple VLANs simultaneously', 'Only the native VLAN', 'Untagged traffic only'],
    correct: 1,
    explanation_fr: 'Un port trunk transporte le trafic de plusieurs VLANs avec des tags 802.1Q.',
    explanation_en: 'A trunk port carries traffic from multiple VLANs using 802.1Q tags.'
  },
  {
    level: 'intermediate',
    q_fr: 'Le tag 802.1Q contient combien d\'octets ?',
    q_en: 'The 802.1Q tag contains how many bytes?',
    answers_fr: ['2', '4', '6', '8'],
    answers_en: ['2', '4', '6', '8'],
    correct: 1,
    explanation_fr: 'Le tag 802.1Q fait 4 octets : TPID (0x8100, 2 octets) + TCI (PCP 3 bits, DEI 1 bit, VID 12 bits).',
    explanation_en: 'The 802.1Q tag is 4 bytes: TPID (0x8100, 2 bytes) + TCI (PCP 3 bits, DEI 1 bit, VID 12 bits).'
  },
  {
    level: 'intermediate',
    q_fr: 'Combien de bits le champ VID du tag 802.1Q utilise-t-il ?',
    q_en: 'How many bits does the VID field of the 802.1Q tag use?',
    answers_fr: ['4', '8', '12', '16'],
    answers_en: ['4', '8', '12', '16'],
    correct: 2,
    explanation_fr: 'Le VID (VLAN Identifier) utilise 12 bits, permettant 4094 VLANs (1-4094).',
    explanation_en: 'The VID (VLAN Identifier) uses 12 bits, allowing 4094 VLANs (1-4094).'
  },

  // Supervision
  {
    level: 'intermediate',
    q_fr: 'Quel protocole est utilise pour synchroniser l\'heure sur un reseau ?',
    q_en: 'Which protocol is used to synchronize time on a network?',
    answers_fr: ['SNMP', 'NTP', 'LDAP', 'RADIUS'],
    answers_en: ['SNMP', 'NTP', 'LDAP', 'RADIUS'],
    correct: 1,
    explanation_fr: 'NTP synchronise les horloges des systemes sur un reseau, via le port 123/UDP.',
    explanation_en: 'NTP synchronizes system clocks across a network, using port 123/UDP.'
  },
  {
    level: 'intermediate',
    q_fr: 'SNMP est utilise pour :',
    q_en: 'SNMP is used for:',
    answers_fr: ['Chiffrer les emails', 'Surveiller et gerer les equipements reseau', 'Resoudre les noms DNS', 'Authentifier les utilisateurs'],
    answers_en: ['Encrypt emails', 'Monitor and manage network devices', 'Resolve DNS names', 'Authenticate users'],
    correct: 1,
    explanation_fr: 'SNMP permet de superviser et configurer les equipements reseau.',
    explanation_en: 'SNMP is used to monitor and configure network equipment.'
  },
  {
    level: 'intermediate',
    q_fr: 'Quelle version de SNMP introduit l\'authentification et le chiffrement ?',
    q_en: 'Which version of SNMP introduces authentication and encryption?',
    answers_fr: ['SNMPv1', 'SNMPv2c', 'SNMPv3', 'SNMPv4'],
    answers_en: ['SNMPv1', 'SNMPv2c', 'SNMPv3', 'SNMPv4'],
    correct: 2,
    explanation_fr: 'SNMPv3 ajoute l\'authentification (MD5/SHA) et le chiffrement (DES/AES).',
    explanation_en: 'SNMPv3 adds authentication (MD5/SHA) and encryption (DES/AES).'
  },
  {
    level: 'intermediate',
    q_fr: 'Quel type de message ICMP est envoye par traceroute pour chaque saut ?',
    q_en: 'Which ICMP message type does traceroute rely on at each hop?',
    answers_fr: ['Echo Reply', 'Time Exceeded', 'Destination Unreachable', 'Redirect'],
    answers_en: ['Echo Reply', 'Time Exceeded', 'Destination Unreachable', 'Redirect'],
    correct: 1,
    explanation_fr: 'Chaque routeur qui decremente le TTL a 0 renvoie un message ICMP Time Exceeded (type 11).',
    explanation_en: 'Each router that decrements TTL to 0 sends back an ICMP Time Exceeded (type 11) message.'
  },

  // Security
  {
    level: 'intermediate',
    q_fr: 'Quel protocole gere l\'authentification dans un reseau 802.1X ?',
    q_en: 'Which protocol handles authentication in an 802.1X network?',
    answers_fr: ['LDAP', 'RADIUS', 'TACACS+', 'Kerberos'],
    answers_en: ['LDAP', 'RADIUS', 'TACACS+', 'Kerberos'],
    correct: 1,
    explanation_fr: 'RADIUS est le serveur d\'authentification standard pour le 802.1X.',
    explanation_en: 'RADIUS is the standard authentication server for 802.1X.'
  },
  {
    level: 'intermediate',
    q_fr: 'IPSec en mode TRANSPORT chiffre :',
    q_en: 'IPSec in TRANSPORT mode encrypts:',
    answers_fr: ['L\'en-tete IP et la charge utile', 'La charge utile uniquement', 'Uniquement l\'en-tete IP', 'Le segment TCP uniquement'],
    answers_en: ['The IP header and payload', 'The payload only', 'The IP header only', 'The TCP segment only'],
    correct: 1,
    explanation_fr: 'En mode transport, IPSec chiffre la charge utile et conserve l\'en-tete IP original.',
    explanation_en: 'In transport mode, IPSec encrypts only the payload and keeps the original IP header.'
  },
  {
    level: 'intermediate',
    q_fr: 'IKE est utilise dans IPSec pour :',
    q_en: 'IKE is used in IPSec to:',
    answers_fr: ['Chiffrer les paquets IP', 'Negocier et echanger les cles de session', 'Authentifier les utilisateurs Active Directory', 'Compresser les paquets'],
    answers_en: ['Encrypt IP packets', 'Negotiate and exchange session keys', 'Authenticate Active Directory users', 'Compress packets'],
    correct: 1,
    explanation_fr: 'IKE gere la negociation des algorithmes de chiffrement et l\'echange des cles entre les pairs IPSec.',
    explanation_en: 'IKE manages the negotiation of encryption algorithms and key exchange between IPSec peers.'
  },
  {
    level: 'intermediate',
    q_fr: 'Quel protocole utilise le port 389 pour les annuaires ?',
    q_en: 'Which protocol uses port 389 for directory services?',
    answers_fr: ['RADIUS', 'NTP', 'LDAP', 'SNMP'],
    answers_en: ['RADIUS', 'NTP', 'LDAP', 'SNMP'],
    correct: 2,
    explanation_fr: 'LDAP utilise le port 389/TCP pour interroger les annuaires comme Active Directory.',
    explanation_en: 'LDAP uses port 389/TCP to query directory services like Active Directory.'
  },
  {
    level: 'intermediate',
    q_fr: 'Kerberos est utilise pour :',
    q_en: 'Kerberos is used for:',
    answers_fr: ['Le routage inter-AS', 'L\'authentification dans les reseaux Windows', 'La supervision reseau', 'La synchronisation d\'heure'],
    answers_en: ['Inter-AS routing', 'Authentication in Windows networks', 'Network monitoring', 'Time synchronization'],
    correct: 1,
    explanation_fr: 'Kerberos est le protocole d\'authentification par tickets utilise dans les environnements Windows/Active Directory.',
    explanation_en: 'Kerberos is the ticket-based authentication protocol used in Windows/Active Directory environments.'
  },

  // Cloud and containers
  {
    level: 'intermediate',
    q_fr: 'Sur quel port ecoute etcd par defaut ?',
    q_en: 'What port does etcd listen on by default?',
    answers_fr: ['2375', '2379', '6443', '8080'],
    answers_en: ['2375', '2379', '6443', '8080'],
    correct: 1,
    explanation_fr: 'etcd ecoute sur le port 2379/TCP (client) et 2380/TCP (peer).',
    explanation_en: 'etcd listens on port 2379/TCP (client) and 2380/TCP (peer).'
  },
  {
    level: 'intermediate',
    q_fr: 'L\'API Kubernetes ecoute par defaut sur quel port ?',
    q_en: 'The Kubernetes API server listens on which default port?',
    answers_fr: ['443', '2379', '6443', '8080'],
    answers_en: ['443', '2379', '6443', '8080'],
    correct: 2,
    explanation_fr: 'Le kube-apiserver ecoute sur le port 6443/TCP (HTTPS).',
    explanation_en: 'The kube-apiserver listens on port 6443/TCP (HTTPS).'
  },
  {
    level: 'intermediate',
    q_fr: 'Le daemon Docker (non securise) ecoute sur quel port ?',
    q_en: 'The Docker daemon (unsecured) listens on which port?',
    answers_fr: ['2375', '2376', '4243', '8080'],
    answers_en: ['2375', '2376', '4243', '8080'],
    correct: 0,
    explanation_fr: 'Le daemon Docker non securise ecoute sur 2375/TCP. Avec TLS, il utilise 2376/TCP.',
    explanation_en: 'The unsecured Docker daemon listens on 2375/TCP. With TLS enabled, it uses 2376/TCP.'
  },

  // Windows RPC
  {
    level: 'intermediate',
    q_fr: 'Les ports dynamiques RPC sous Windows sont dans quelle plage ?',
    q_en: 'Dynamic RPC ports on Windows are in which range?',
    answers_fr: ['1024-4096', '1024-65535', '49152-65535', '32768-60999'],
    answers_en: ['1024-4096', '1024-65535', '49152-65535', '32768-60999'],
    correct: 2,
    explanation_fr: 'Windows utilise la plage 49152-65535 pour les ports RPC dynamiques (depuis Vista/2008).',
    explanation_en: 'Windows uses the 49152-65535 range for dynamic RPC ports (since Vista/2008).'
  },

  // STP/RSTP
  {
    level: 'intermediate',
    q_fr: 'STP (Spanning Tree Protocol) est utilise pour :',
    q_en: 'STP (Spanning Tree Protocol) is used to:',
    answers_fr: ['Router entre VLANs', 'Eliminer les boucles dans un reseau commute', 'Aggreger des liens', 'Chiffrer le trafic L2'],
    answers_en: ['Route between VLANs', 'Eliminate loops in a switched network', 'Aggregate links', 'Encrypt L2 traffic'],
    correct: 1,
    explanation_fr: 'STP elimine les boucles L2 en bloquant certains ports redondants.',
    explanation_en: 'STP eliminates L2 loops by blocking redundant ports.'
  },
  {
    level: 'intermediate',
    q_fr: 'Quel est le timer Hello par defaut de STP ?',
    q_en: 'What is the default STP Hello timer?',
    answers_fr: ['1 seconde', '2 secondes', '5 secondes', '10 secondes'],
    answers_en: ['1 second', '2 seconds', '5 seconds', '10 seconds'],
    correct: 1,
    explanation_fr: 'Le timer Hello STP est de 2 secondes. Forward delay = 15s, Max age = 20s.',
    explanation_en: 'The STP Hello timer is 2 seconds. Forward delay = 15s, Max age = 20s.'
  },
  {
    level: 'intermediate',
    q_fr: 'Le root bridge STP est elu sur la base de :',
    q_en: 'The STP root bridge is elected based on:',
    answers_fr: ['La plus haute adresse MAC', 'La plus haute priorite de bridge', 'La plus basse priorite de bridge puis la plus basse adresse MAC', 'La plus grande bande passante'],
    answers_en: ['The highest MAC address', 'The highest bridge priority', 'The lowest bridge priority then lowest MAC address', 'The highest bandwidth'],
    correct: 2,
    explanation_fr: 'Le root bridge est le switch avec la plus basse Bridge ID = priorite (defaut 32768) + adresse MAC.',
    explanation_en: 'The root bridge is the switch with the lowest Bridge ID = priority (default 32768) + MAC address.'
  },

  // Redundancy
  {
    level: 'intermediate',
    q_fr: 'VRRP utilise quelle adresse multicast pour ses annonces ?',
    q_en: 'VRRP uses which multicast address for its announcements?',
    answers_fr: ['224.0.0.2', '224.0.0.18', '224.0.0.5', '224.0.0.102'],
    answers_en: ['224.0.0.2', '224.0.0.18', '224.0.0.5', '224.0.0.102'],
    correct: 1,
    explanation_fr: 'VRRP utilise l\'adresse multicast 224.0.0.18. HSRP utilise 224.0.0.2.',
    explanation_en: 'VRRP uses multicast address 224.0.0.18. HSRP uses 224.0.0.2.'
  },
  {
    level: 'intermediate',
    q_fr: 'HSRP utilise quel port UDP pour ses messages de groupe ?',
    q_en: 'HSRP uses which UDP port for its group messages?',
    answers_fr: ['512', '1985', '2000', '3222'],
    answers_en: ['512', '1985', '2000', '3222'],
    correct: 1,
    explanation_fr: 'HSRP utilise le port UDP 1985 et l\'adresse multicast 224.0.0.2.',
    explanation_en: 'HSRP uses UDP port 1985 and multicast address 224.0.0.2.'
  },

  // Load balancing
  {
    level: 'intermediate',
    q_fr: 'Un load balancer L7 peut router sur la base de :',
    q_en: 'An L7 load balancer can route based on:',
    answers_fr: ['L\'adresse IP source uniquement', 'L\'URL, les headers HTTP, les cookies', 'Le port TCP source', 'La taille des paquets'],
    answers_en: ['Source IP address only', 'URL, HTTP headers, cookies', 'Source TCP port', 'Packet size'],
    correct: 1,
    explanation_fr: 'Un LB L7 inspecte le contenu HTTP (URL, headers, cookies) pour prendre ses decisions de routage.',
    explanation_en: 'An L7 LB inspects HTTP content (URL, headers, cookies) to make routing decisions.'
  },
  {
    level: 'intermediate',
    q_fr: 'L\'algorithme "least connections" en load balancing choisit :',
    q_en: 'The "least connections" load balancing algorithm selects:',
    answers_fr: ['Le serveur dans l\'ordre sequentiel', 'Le serveur avec le moins de connexions actives', 'Le serveur base sur le hash de l\'IP', 'Le serveur le plus rapide'],
    answers_en: ['Servers in sequential order', 'The server with the fewest active connections', 'The server based on IP hash', 'The fastest server'],
    correct: 1,
    explanation_fr: 'Least-connections envoie la requete au serveur ayant le moins de connexions actives en cours.',
    explanation_en: 'Least-connections sends the request to the server with the fewest active connections.'
  },

  // Security L2
  {
    level: 'intermediate',
    q_fr: 'DHCP Snooping est utilise pour :',
    q_en: 'DHCP Snooping is used to:',
    answers_fr: ['Accelerer les requetes DHCP', 'Bloquer les serveurs DHCP non autorises sur les ports non trusted', 'Chiffrer les echanges DHCP', 'Attribuer des adresses statiques'],
    answers_en: ['Speed up DHCP requests', 'Block unauthorized DHCP servers on untrusted ports', 'Encrypt DHCP exchanges', 'Assign static addresses'],
    correct: 1,
    explanation_fr: 'DHCP Snooping distingue les ports trusted (uplink) des ports untrusted et bloque les serveurs DHCP rogue.',
    explanation_en: 'DHCP Snooping distinguishes trusted (uplink) from untrusted ports and blocks rogue DHCP servers.'
  },
  {
    level: 'intermediate',
    q_fr: 'Dynamic ARP Inspection (DAI) protege contre :',
    q_en: 'Dynamic ARP Inspection (DAI) protects against:',
    answers_fr: ['Les attaques de routage BGP', 'L\'ARP spoofing / ARP poisoning', 'Les floods de broadcast', 'Le vol de sessions TCP'],
    answers_en: ['BGP routing attacks', 'ARP spoofing / ARP poisoning', 'Broadcast floods', 'TCP session hijacking'],
    correct: 1,
    explanation_fr: 'DAI valide les reponses ARP par rapport a la table DHCP Snooping pour eviter l\'ARP spoofing.',
    explanation_en: 'DAI validates ARP replies against the DHCP Snooping binding table to prevent ARP spoofing.'
  },

  // IPv6 DHCPv6
  {
    level: 'intermediate',
    q_fr: 'DHCPv6 est utilise pour :',
    q_en: 'DHCPv6 is used for:',
    answers_fr: ['Attribuer des adresses IPv4', 'Attribuer des adresses IPv6 avec etat', 'Chiffrer le trafic IPv6', 'Remplacer NDP'],
    answers_en: ['Assign IPv4 addresses', 'Assign IPv6 addresses with state', 'Encrypt IPv6 traffic', 'Replace NDP'],
    correct: 1,
    explanation_fr: 'DHCPv6 attribue des adresses IPv6 et des parametres reseau de facon avec etat.',
    explanation_en: 'DHCPv6 assigns IPv6 addresses and network parameters in a stateful manner.'
  },
  {
    level: 'intermediate',
    q_fr: 'Le protocole NDP (Neighbor Discovery Protocol) est l\'equivalent IPv6 de :',
    q_en: 'NDP (Neighbor Discovery Protocol) is the IPv6 equivalent of:',
    answers_fr: ['DNS', 'ARP', 'DHCP', 'ICMP'],
    answers_en: ['DNS', 'ARP', 'DHCP', 'ICMP'],
    correct: 1,
    explanation_fr: 'NDP remplace ARP en IPv6 pour la resolution d\'adresses sur le lien local. Il utilise ICMPv6.',
    explanation_en: 'NDP replaces ARP in IPv6 for link-local address resolution. It uses ICMPv6.'
  },

  // DNS SRV
  {
    level: 'intermediate',
    q_fr: 'L\'enregistrement DNS SRV sert a :',
    q_en: 'The DNS SRV record is used to:',
    answers_fr: ['Definir un alias', 'Localiser un service reseau (host + port)', 'Pointer vers un serveur mail', 'Valider SPF/DKIM'],
    answers_en: ['Define an alias', 'Locate a network service (host + port)', 'Point to a mail server', 'Validate SPF/DKIM'],
    correct: 1,
    explanation_fr: 'Un enregistrement SRV indique le nom d\'hote et le port d\'un service specifique.',
    explanation_en: 'An SRV record specifies the hostname and port of a specific service.'
  },

  // ════════════════════════════════════════════════════════════
  // ADVANCED
  // ════════════════════════════════════════════════════════════

  // BGP attributes
  {
    level: 'advanced',
    q_fr: 'Quel attribut BGP est utilise pour influencer le chemin sortant depuis un AS ?',
    q_en: 'Which BGP attribute is used to influence outbound path selection from an AS?',
    answers_fr: ['AS-PATH', 'MED', 'LOCAL-PREF', 'NEXT-HOP'],
    answers_en: ['AS-PATH', 'MED', 'LOCAL-PREF', 'NEXT-HOP'],
    correct: 2,
    explanation_fr: 'LOCAL-PREF influence la selection du chemin sortant a l\'interieur d\'un AS. Plus la valeur est haute, plus le chemin est prefere.',
    explanation_en: 'LOCAL-PREF influences outbound path selection within an AS. Higher value = preferred path.'
  },
  {
    level: 'advanced',
    q_fr: 'L\'attribut BGP MED est utilise pour :',
    q_en: 'The BGP MED attribute is used to:',
    answers_fr: ['Identifier l\'AS d\'origine', 'Influencer le chemin entrant vers un AS depuis un AS adjacent', 'Definir le saut suivant', 'Indiquer la preference locale'],
    answers_en: ['Identify the originating AS', 'Influence inbound path from an adjacent AS', 'Define the next hop', 'Indicate local preference'],
    correct: 1,
    explanation_fr: 'MED (Multi-Exit Discriminator) est envoye aux AS voisins pour suggerer quel chemin entrant preferer.',
    explanation_en: 'MED (Multi-Exit Discriminator) is sent to neighboring ASes to suggest which inbound path to prefer.'
  },
  {
    level: 'advanced',
    q_fr: 'L\'attribut BGP AS-PATH sert a :',
    q_en: 'The BGP AS-PATH attribute is used to:',
    answers_fr: ['Lister les routeurs traverses', 'Lister les AS traverses et eviter les boucles', 'Indiquer le prochain saut IP', 'Definir la metrique interne'],
    answers_en: ['List the routers traversed', 'List traversed ASes and prevent loops', 'Indicate the next IP hop', 'Define the internal metric'],
    correct: 1,
    explanation_fr: 'AS-PATH liste les numeros d\'AS traverses. Un routeur qui voit son propre AS dans AS-PATH rejette la route (boucle).',
    explanation_en: 'AS-PATH lists the AS numbers traversed. A router that sees its own AS in AS-PATH rejects the route (loop prevention).'
  },
  {
    level: 'advanced',
    q_fr: 'L\'attribut BGP WEIGHT est :',
    q_en: 'The BGP WEIGHT attribute is:',
    answers_fr: ['Standard IETF, partage entre pairs', 'Proprietaire Cisco, local au routeur uniquement', 'Un attribut transitif partage avec les AS voisins', 'Identique a LOCAL-PREF'],
    answers_en: ['IETF standard, shared between peers', 'Cisco proprietary, local to the router only', 'A transitive attribute shared with neighboring ASes', 'Identical to LOCAL-PREF'],
    correct: 1,
    explanation_fr: 'WEIGHT est un attribut proprietaire Cisco, non transmis aux pairs BGP. Valeur plus haute = chemin prefere.',
    explanation_en: 'WEIGHT is a Cisco proprietary attribute, not transmitted to BGP peers. Higher value = preferred path.'
  },

  // OSPF LSA types
  {
    level: 'advanced',
    q_fr: 'Un LSA de type 1 OSPF est :',
    q_en: 'An OSPF type 1 LSA is:',
    answers_fr: ['Un Network LSA', 'Un Router LSA genere par chaque routeur OSPF', 'Un Summary LSA inter-zone', 'Un External LSA'],
    answers_en: ['A Network LSA', 'A Router LSA generated by every OSPF router', 'An inter-area Summary LSA', 'An External LSA'],
    correct: 1,
    explanation_fr: 'Le LSA type 1 (Router LSA) est genere par chaque routeur OSPF et reste dans sa zone.',
    explanation_en: 'Type 1 LSA (Router LSA) is generated by every OSPF router and stays within its area.'
  },
  {
    level: 'advanced',
    q_fr: 'Quel type de LSA OSPF est genere par un ABR pour les routes inter-zones ?',
    q_en: 'Which OSPF LSA type is generated by an ABR for inter-area routes?',
    answers_fr: ['Type 1', 'Type 2', 'Type 3', 'Type 5'],
    answers_en: ['Type 1', 'Type 2', 'Type 3', 'Type 5'],
    correct: 2,
    explanation_fr: 'Le LSA type 3 (Summary LSA) est genere par les ABR pour annoncer les reseaux d\'une zone vers les autres zones.',
    explanation_en: 'Type 3 LSA (Summary LSA) is generated by ABRs to advertise networks from one area to other areas.'
  },
  {
    level: 'advanced',
    q_fr: 'Un LSA OSPF de type 5 correspond a :',
    q_en: 'An OSPF type 5 LSA corresponds to:',
    answers_fr: ['Un Router LSA', 'Un Network LSA', 'Un Summary LSA', 'Un External LSA redistribue depuis un autre protocole'],
    answers_en: ['A Router LSA', 'A Network LSA', 'A Summary LSA', 'An External LSA redistributed from another protocol'],
    correct: 3,
    explanation_fr: 'Le LSA type 5 (AS External LSA) est genere par un ASBR pour les routes redistribuees depuis d\'autres protocoles.',
    explanation_en: 'Type 5 LSA (AS External LSA) is generated by an ASBR for routes redistributed from other protocols.'
  },

  // STP advanced
  {
    level: 'advanced',
    q_fr: 'Dans RSTP, quel est le role d\'un port "Alternate" ?',
    q_en: 'In RSTP, what is the role of an "Alternate" port?',
    answers_fr: ['Port actif vers le root bridge', 'Port de secours pouvant remplacer rapidement le root port', 'Port bloque definitif', 'Port qui genere des BPDUs'],
    answers_en: ['Active port towards the root bridge', 'Backup port that can quickly replace the root port', 'Permanently blocked port', 'Port that generates BPDUs'],
    correct: 1,
    explanation_fr: 'Un port Alternate RSTP offre un chemin alternatif vers le root. Si le root port tombe, il bascule immediatement.',
    explanation_en: 'An RSTP Alternate port provides an alternate path to the root. If the root port fails, it transitions immediately.'
  },
  {
    level: 'advanced',
    q_fr: 'Quel est le Forward Delay par defaut dans STP classique ?',
    q_en: 'What is the default Forward Delay in classic STP?',
    answers_fr: ['2 secondes', '10 secondes', '15 secondes', '30 secondes'],
    answers_en: ['2 seconds', '10 seconds', '15 seconds', '30 seconds'],
    correct: 2,
    explanation_fr: 'Le Forward Delay STP est de 15 secondes. Hello = 2s, Max age = 20s.',
    explanation_en: 'The STP Forward Delay is 15 seconds. Hello = 2s, Max age = 20s.'
  },

  // IPv6 NDP ICMPv6
  {
    level: 'advanced',
    q_fr: 'Quel type ICMPv6 correspond a un Router Advertisement (RA) ?',
    q_en: 'Which ICMPv6 type corresponds to a Router Advertisement (RA)?',
    answers_fr: ['133', '134', '135', '136'],
    answers_en: ['133', '134', '135', '136'],
    correct: 1,
    explanation_fr: 'ICMPv6 type 133 = Router Solicitation, 134 = Router Advertisement, 135 = Neighbor Solicitation, 136 = Neighbor Advertisement.',
    explanation_en: 'ICMPv6 type 133 = Router Solicitation, 134 = Router Advertisement, 135 = Neighbor Solicitation, 136 = Neighbor Advertisement.'
  },
  {
    level: 'advanced',
    q_fr: 'SLAAC (Stateless Address Autoconfiguration) IPv6 utilise :',
    q_en: 'SLAAC (Stateless Address Autoconfiguration) IPv6 uses:',
    answers_fr: ['Un serveur DHCPv6 pour obtenir l\'adresse', 'Les Router Advertisements ICMPv6 pour se configurer sans serveur', 'Un serveur RADIUS', 'Les messages ARP Reply'],
    answers_en: ['A DHCPv6 server to get the address', 'ICMPv6 Router Advertisements to self-configure without a server', 'A RADIUS server', 'ARP Reply messages'],
    correct: 1,
    explanation_fr: 'SLAAC utilise les RA (ICMPv6 type 134) pour obtenir le prefixe et genere son adresse sans serveur.',
    explanation_en: 'SLAAC uses RA messages (ICMPv6 type 134) to get the prefix and self-generates its address without a server.'
  },
  {
    level: 'advanced',
    q_fr: 'Une adresse IPv6 anycast est :',
    q_en: 'An IPv6 anycast address is:',
    answers_fr: ['Attribuee a un seul hote', 'Attribuee a plusieurs interfaces — paquet delivre au plus proche', 'Un groupe multicast', 'Une adresse de broadcast'],
    answers_en: ['Assigned to a single host', 'Assigned to multiple interfaces — packet delivered to nearest one', 'A multicast group', 'A broadcast address'],
    correct: 1,
    explanation_fr: 'Une adresse anycast est attribuee a plusieurs interfaces. Le paquet est livre a l\'interface la plus proche routage-wise.',
    explanation_en: 'An anycast address is assigned to multiple interfaces. The packet is delivered to the nearest interface routing-wise.'
  },

  // DNS advanced
  {
    level: 'advanced',
    q_fr: 'DNSSEC utilise quel type d\'enregistrement pour signer les zones ?',
    q_en: 'DNSSEC uses which record type to sign zones?',
    answers_fr: ['DNSKEY', 'RRSIG', 'DS', 'NSEC'],
    answers_en: ['DNSKEY', 'RRSIG', 'DS', 'NSEC'],
    correct: 1,
    explanation_fr: 'RRSIG (Resource Record Signature) contient la signature numerique d\'un RRset. DNSKEY contient la cle publique.',
    explanation_en: 'RRSIG (Resource Record Signature) contains the digital signature of an RRset. DNSKEY holds the public key.'
  },
  {
    level: 'advanced',
    q_fr: 'DNS over TLS (DoT) utilise quel port ?',
    q_en: 'DNS over TLS (DoT) uses which port?',
    answers_fr: ['443', '853', '5353', '8053'],
    answers_en: ['443', '853', '5353', '8053'],
    correct: 1,
    explanation_fr: 'DoT (DNS over TLS) utilise le port 853/TCP. DoH (DNS over HTTPS) utilise le port 443.',
    explanation_en: 'DoT (DNS over TLS) uses port 853/TCP. DoH (DNS over HTTPS) uses port 443.'
  },
  {
    level: 'advanced',
    q_fr: 'Un transfert de zone DNS complet utilise quel type de requete ?',
    q_en: 'A full DNS zone transfer uses which query type?',
    answers_fr: ['AXFR', 'IXFR', 'ANY', 'SOA'],
    answers_en: ['AXFR', 'IXFR', 'ANY', 'SOA'],
    correct: 0,
    explanation_fr: 'AXFR est un transfert de zone complet. IXFR est un transfert incremental (seulement les modifications).',
    explanation_en: 'AXFR is a full zone transfer. IXFR is an incremental transfer (only the changes).'
  },

  // PKI and certificates
  {
    level: 'advanced',
    q_fr: 'OCSP est utilise pour :',
    q_en: 'OCSP is used to:',
    answers_fr: ['Chiffrer les certificats', 'Verifier en temps reel la validite d\'un certificat', 'Generer des cles RSA', 'Signer une zone DNS'],
    answers_en: ['Encrypt certificates', 'Check a certificate\'s validity in real time', 'Generate RSA keys', 'Sign a DNS zone'],
    correct: 1,
    explanation_fr: 'OCSP (Online Certificate Status Protocol) permet de verifier si un certificat est revoque, en alternative aux CRL.',
    explanation_en: 'OCSP (Online Certificate Status Protocol) allows checking whether a certificate is revoked, as an alternative to CRLs.'
  },
  {
    level: 'advanced',
    q_fr: 'Un champ SAN dans un certificat TLS sert a :',
    q_en: 'A SAN field in a TLS certificate is used to:',
    answers_fr: ['Stocker la cle privee', 'Lister les noms de domaine ou adresses IP couverts par le certificat', 'Indiquer la CA emettrice', 'Definir la duree de validite'],
    answers_en: ['Store the private key', 'List the domain names or IP addresses covered by the certificate', 'Indicate the issuing CA', 'Define the validity period'],
    correct: 1,
    explanation_fr: 'Le SAN (Subject Alternative Name) liste les noms DNS ou IPs couverts par le certificat, remplacant progressivement le CN.',
    explanation_en: 'The SAN (Subject Alternative Name) lists the DNS names or IPs covered by the certificate, gradually replacing CN.'
  },
  {
    level: 'advanced',
    q_fr: 'mTLS (mutual TLS) se distingue de TLS classique car :',
    q_en: 'mTLS (mutual TLS) differs from standard TLS because:',
    answers_fr: ['Il utilise un algorithme de chiffrement different', 'Le client ET le serveur presentent chacun un certificat', 'Il ne necessite pas de CA', 'Il utilise le port 8443 obligatoirement'],
    answers_en: ['It uses a different encryption algorithm', 'Both client AND server present a certificate', 'It requires no CA', 'It mandates port 8443'],
    correct: 1,
    explanation_fr: 'En mTLS, le client presente un certificat au serveur (authentification mutuelle). En TLS classique, seul le serveur s\'authentifie.',
    explanation_en: 'In mTLS, the client presents a certificate to the server (mutual authentication). In standard TLS, only the server authenticates.'
  },

  // Firewall and filtering
  {
    level: 'advanced',
    q_fr: 'Un pare-feu STATEFUL se distingue d\'un pare-feu STATELESS car :',
    q_en: 'A STATEFUL firewall differs from a STATELESS firewall because:',
    answers_fr: ['Il est plus rapide', 'Il suit les etats des connexions et autorise le trafic de retour automatiquement', 'Il filtre uniquement au niveau IP', 'Il ne necessite pas de regles'],
    answers_en: ['It is faster', 'It tracks connection states and automatically allows return traffic', 'It filters at IP level only', 'It requires no rules'],
    correct: 1,
    explanation_fr: 'Un FW stateful maintient une table d\'etats et autorise le trafic de retour des connexions etablies sans regle explicite.',
    explanation_en: 'A stateful FW maintains a state table and allows return traffic for established connections without explicit rules.'
  },
  {
    level: 'advanced',
    q_fr: 'Une ACL etendue Cisco permet de filtrer sur :',
    q_en: 'A Cisco extended ACL allows filtering on:',
    answers_fr: ['L\'adresse IP source uniquement', 'L\'adresse IP source et destination + protocole + ports', 'Le VLAN uniquement', 'Le contenu applicatif'],
    answers_en: ['Source IP address only', 'Source + destination IP + protocol + ports', 'VLAN only', 'Application content'],
    correct: 1,
    explanation_fr: 'Une ACL etendue filtre sur l\'IP source, IP destination, protocole (TCP/UDP/ICMP) et les ports source/destination.',
    explanation_en: 'An extended ACL filters on source IP, destination IP, protocol (TCP/UDP/ICMP) and source/destination ports.'
  },

  // 802.1X advanced
  {
    level: 'advanced',
    q_fr: 'Dans une architecture 802.1X, le supplicant est :',
    q_en: 'In an 802.1X architecture, the supplicant is:',
    answers_fr: ['Le switch ou le point d\'acces', 'Le serveur RADIUS', 'Le client qui demande l\'acces au reseau', 'Le serveur LDAP'],
    answers_en: ['The switch or access point', 'The RADIUS server', 'The client requesting network access', 'The LDAP server'],
    correct: 2,
    explanation_fr: 'Le supplicant (client) envoie les credentials via EAP. L\'authenticator (switch/AP) relaie au serveur RADIUS.',
    explanation_en: 'The supplicant (client) sends credentials via EAP. The authenticator (switch/AP) relays to the RADIUS server.'
  },
  {
    level: 'advanced',
    q_fr: 'Port Security "sticky MAC" sur un switch Cisco :',
    q_en: 'Port Security "sticky MAC" on a Cisco switch:',
    answers_fr: ['Bloque tous les MAC sauf ceux configures manuellement', 'Apprend dynamiquement les MAC et les inscrit dans la configuration courante', 'Chiffre le trafic sur le port', 'Desactive le port si le VLAN change'],
    answers_en: ['Blocks all MACs except manually configured ones', 'Dynamically learns MACs and writes them to the running config', 'Encrypts traffic on the port', 'Disables the port if the VLAN changes'],
    correct: 1,
    explanation_fr: 'Sticky MAC apprend dynamiquement les adresses MAC et les enregistre dans la running-config comme si elles etaient configurees statiquement.',
    explanation_en: 'Sticky MAC dynamically learns MAC addresses and saves them to the running-config as if statically configured.'
  },

  // IP Source Guard
  {
    level: 'advanced',
    q_fr: 'IP Source Guard protege contre :',
    q_en: 'IP Source Guard protects against:',
    answers_fr: ['Les attaques BGP', 'Le spoofing d\'adresses IP sur les ports clients du switch', 'Les inondations ICMP', 'Les attaques de fragmentation IP'],
    answers_en: ['BGP attacks', 'IP address spoofing on switch client ports', 'ICMP floods', 'IP fragmentation attacks'],
    correct: 1,
    explanation_fr: 'IP Source Guard valide le couple IP/MAC d\'un port par rapport a la table DHCP Snooping, rejetant le trafic avec une IP source non attendue.',
    explanation_en: 'IP Source Guard validates the IP/MAC pair of a port against the DHCP Snooping table, rejecting traffic with an unexpected source IP.'
  },

  // Misc advanced
  {
    level: 'advanced',
    q_fr: 'Le protocole HSRP est developpe par :',
    q_en: 'The HSRP protocol was developed by:',
    answers_fr: ['IETF', 'Cisco', 'IEEE', 'IANA'],
    answers_en: ['IETF', 'Cisco', 'IEEE', 'IANA'],
    correct: 1,
    explanation_fr: 'HSRP (Hot Standby Router Protocol) est proprietaire Cisco. VRRP est la version standard IETF equivalente.',
    explanation_en: 'HSRP (Hot Standby Router Protocol) is Cisco proprietary. VRRP is the equivalent IETF standard.'
  },
  {
    level: 'advanced',
    q_fr: 'MQTT est un protocole de messagerie utilise principalement dans :',
    q_en: 'MQTT is a messaging protocol used mainly in:',
    answers_fr: ['La supervision reseau', 'L\'IoT (Internet of Things)', 'Le transfert de fichiers', 'L\'authentification 802.1X'],
    answers_en: ['Network monitoring', 'IoT (Internet of Things)', 'File transfer', '802.1X authentication'],
    correct: 1,
    explanation_fr: 'MQTT (port 1883/TCP, TLS sur 8883) est un protocole pub/sub leger, standard de facto pour l\'IoT.',
    explanation_en: 'MQTT (port 1883/TCP, TLS on 8883) is a lightweight pub/sub protocol, de facto IoT standard.'
  },
  {
    level: 'advanced',
    q_fr: 'Le protocole Modbus utilise quel port par defaut ?',
    q_en: 'The Modbus protocol uses which default port?',
    answers_fr: ['104', '502', '1883', '47808'],
    answers_en: ['104', '502', '1883', '47808'],
    correct: 1,
    explanation_fr: 'Modbus TCP utilise le port 502/TCP. C\'est un protocole industriel (SCADA, automates).',
    explanation_en: 'Modbus TCP uses port 502/TCP. It is an industrial protocol (SCADA, PLCs).'
  },
  {
    level: 'advanced',
    q_fr: 'mDNS (Multicast DNS) utilise quel port ?',
    q_en: 'mDNS (Multicast DNS) uses which port?',
    answers_fr: ['53', '853', '5353', '5355'],
    answers_en: ['53', '853', '5353', '5355'],
    correct: 2,
    explanation_fr: 'mDNS utilise le port 5353/UDP et l\'adresse multicast 224.0.0.251. LLMNR utilise 5355.',
    explanation_en: 'mDNS uses port 5353/UDP and multicast address 224.0.0.251. LLMNR uses 5355.'
  },

  // ── Extra basic ───────────────────────────────────────────────
  {
    level: 'basic',
    q_fr: 'Quel protocole utilise le port 110 ?',
    q_en: 'Which protocol uses port 110?',
    answers_fr: ['SMTP', 'IMAP', 'POP3', 'LDAP'],
    answers_en: ['SMTP', 'IMAP', 'POP3', 'LDAP'],
    correct: 2,
    explanation_fr: 'POP3 (Post Office Protocol v3) utilise le port 110/TCP pour recuperer les emails.',
    explanation_en: 'POP3 (Post Office Protocol v3) uses port 110/TCP to retrieve emails.'
  },
  {
    level: 'basic',
    q_fr: 'Quel port utilise IMAP par defaut ?',
    q_en: 'What port does IMAP use by default?',
    answers_fr: ['110', '143', '465', '993'],
    answers_en: ['110', '143', '465', '993'],
    correct: 1,
    explanation_fr: 'IMAP utilise le port 143/TCP (993 pour IMAPS). POP3 utilise 110.',
    explanation_en: 'IMAP uses port 143/TCP (993 for IMAPS). POP3 uses 110.'
  },
  {
    level: 'basic',
    q_fr: 'Quel port utilise Telnet ?',
    q_en: 'Which port does Telnet use?',
    answers_fr: ['21', '22', '23', '25'],
    answers_en: ['21', '22', '23', '25'],
    correct: 2,
    explanation_fr: 'Telnet utilise le port 23/TCP. Il envoie tout en clair — SSH (port 22) est son remplacant securise.',
    explanation_en: 'Telnet uses port 23/TCP. It transmits everything in plaintext — SSH (port 22) is its secure replacement.'
  },
  {
    level: 'basic',
    q_fr: 'LDAP utilise quel port par defaut ?',
    q_en: 'What port does LDAP use by default?',
    answers_fr: ['389', '443', '636', '3268'],
    answers_en: ['389', '443', '636', '3268'],
    correct: 0,
    explanation_fr: 'LDAP utilise le port 389/TCP. LDAPS (LDAP over TLS) utilise le port 636.',
    explanation_en: 'LDAP uses port 389/TCP. LDAPS (LDAP over TLS) uses port 636.'
  },
  {
    level: 'basic',
    q_fr: 'Quel protocole resout les adresses MAC en adresses IP (sens inverse d\'ARP) ?',
    q_en: 'Which protocol resolves MAC addresses to IP addresses (reverse of ARP)?',
    answers_fr: ['RARP', 'ICMP', 'NDP', 'DHCP'],
    answers_en: ['RARP', 'ICMP', 'NDP', 'DHCP'],
    correct: 0,
    explanation_fr: 'RARP (Reverse ARP) permet a une machine de trouver son adresse IP depuis son adresse MAC. Il est obsolete (remplace par DHCP).',
    explanation_en: 'RARP (Reverse ARP) allows a host to find its IP address from its MAC. It is obsolete (replaced by DHCP).'
  },
  {
    level: 'basic',
    q_fr: 'Le modele TCP/IP contient combien de couches ?',
    q_en: 'The TCP/IP model contains how many layers?',
    answers_fr: ['4', '5', '7', '8'],
    answers_en: ['4', '5', '7', '8'],
    correct: 0,
    explanation_fr: 'Le modele TCP/IP a 4 couches : Application, Transport, Internet, Acces reseau (vs 7 couches pour OSI).',
    explanation_en: 'The TCP/IP model has 4 layers: Application, Transport, Internet, Network Access (vs 7 for OSI).'
  },
  {
    level: 'basic',
    q_fr: 'NTP utilise quel protocole de transport ?',
    q_en: 'NTP uses which transport protocol?',
    answers_fr: ['TCP', 'UDP', 'ICMP', 'SCTP'],
    answers_en: ['TCP', 'UDP', 'ICMP', 'SCTP'],
    correct: 1,
    explanation_fr: 'NTP utilise UDP sur le port 123. La faible latence d\'UDP est essentielle pour la precision de la synchronisation.',
    explanation_en: 'NTP uses UDP on port 123. UDP\'s low latency is essential for synchronization precision.'
  },

  // ── Extra intermediate ─────────────────────────────────────────
  {
    level: 'intermediate',
    q_fr: 'Quel attribut STP identifie le commutateur root bridge ?',
    q_en: 'Which STP attribute identifies the root bridge switch?',
    answers_fr: ['Port cost le plus bas', 'Bridge ID le plus bas (priorite + MAC)', 'Nombre de ports le plus eleve', 'IP de management la plus basse'],
    answers_en: ['Lowest port cost', 'Lowest Bridge ID (priority + MAC)', 'Highest port count', 'Lowest management IP'],
    correct: 1,
    explanation_fr: 'Le root bridge est elu sur la base du Bridge ID le plus bas = priorite (defaut 32768) + adresse MAC.',
    explanation_en: 'The root bridge is elected based on the lowest Bridge ID = priority (default 32768) + MAC address.'
  },
  {
    level: 'intermediate',
    q_fr: 'Le protocole TACACS+ separe l\'authentification, l\'autorisation et la comptabilite (AAA) car :',
    q_en: 'TACACS+ separates authentication, authorization, and accounting (AAA) because:',
    answers_fr: ['Il est plus lent que RADIUS', 'Il utilise TCP et permet une granularite fine des privileges', 'Il ne supporte que les utilisateurs locaux', 'Il chiffre uniquement le mot de passe'],
    answers_en: ['It is slower than RADIUS', 'It uses TCP and allows fine-grained privilege control', 'It only supports local users', 'It only encrypts the password'],
    correct: 1,
    explanation_fr: 'TACACS+ utilise TCP (port 49), chiffre la totalite du payload et permet une autorisation commande par commande (contrairement a RADIUS).',
    explanation_en: 'TACACS+ uses TCP (port 49), encrypts the full payload, and allows per-command authorization (unlike RADIUS).'
  },
  {
    level: 'intermediate',
    q_fr: 'RSTP (802.1w) est une amelioration de STP principalement car :',
    q_en: 'RSTP (802.1w) is an improvement over STP mainly because:',
    answers_fr: ['Il supprime les VLANs', 'Il converge beaucoup plus vite (< 1 seconde vs ~30-50s)', 'Il n\'utilise pas de BPDU', 'Il necessite moins de ports'],
    answers_en: ['It removes VLANs', 'It converges much faster (< 1 second vs ~30-50s)', 'It does not use BPDUs', 'It requires fewer ports'],
    correct: 1,
    explanation_fr: 'RSTP converge en moins d\'une seconde grace aux mecanismes de negociation rapide (proposal/agreement), contre 30-50s pour STP classique.',
    explanation_en: 'RSTP converges in under a second thanks to rapid negotiation (proposal/agreement), vs 30-50s for classic STP.'
  },
  {
    level: 'intermediate',
    q_fr: 'L\'encapsulation GRE (Generic Routing Encapsulation) permet de :',
    q_en: 'GRE (Generic Routing Encapsulation) allows:',
    answers_fr: ['Chiffrer les tunnels VPN', 'Transporter n\'importe quel protocole reseau sur IP', 'Compresser les paquets', 'Assurer la QoS'],
    answers_en: ['Encrypt VPN tunnels', 'Transport any network protocol over IP', 'Compress packets', 'Ensure QoS'],
    correct: 1,
    explanation_fr: 'GRE cree un tunnel IP qui peut transporter n\'importe quel protocole de couche 3 (IPv4, IPv6, IPX). Il n\'offre pas de chiffrement natif.',
    explanation_en: 'GRE creates an IP tunnel that can carry any layer 3 protocol (IPv4, IPv6, IPX). It provides no native encryption.'
  },
  {
    level: 'intermediate',
    q_fr: 'OSPF utilise quel numero de protocole IP (IP protocol number) ?',
    q_en: 'OSPF uses which IP protocol number?',
    answers_fr: ['6 (TCP)', '17 (UDP)', '89', '112'],
    answers_en: ['6 (TCP)', '17 (UDP)', '89', '112'],
    correct: 2,
    explanation_fr: 'OSPF utilise le protocole IP numero 89 (pas TCP ni UDP). VRRP utilise le protocole 112.',
    explanation_en: 'OSPF uses IP protocol number 89 (not TCP or UDP). VRRP uses protocol number 112.'
  },

  // ── Extra advanced ─────────────────────────────────────────────
  {
    level: 'advanced',
    q_fr: 'Un certificat wildcard (ex: *.example.com) couvre :',
    q_en: 'A wildcard certificate (e.g. *.example.com) covers:',
    answers_fr: ['Tous les sous-domaines a un seul niveau de profondeur', 'Tous les sous-domaines a n\'importe quelle profondeur', 'Uniquement le domaine racine', 'Uniquement les adresses IP du domaine'],
    answers_en: ['All subdomains at one level of depth', 'All subdomains at any depth', 'Only the root domain', 'Only IP addresses of the domain'],
    correct: 0,
    explanation_fr: '*.example.com couvre mail.example.com mais pas sub.mail.example.com. Les wildcards ne sont valides qu\'a un seul niveau.',
    explanation_en: '*.example.com covers mail.example.com but not sub.mail.example.com. Wildcards are valid at only one level.'
  },
  {
    level: 'advanced',
    q_fr: 'La CRL (Certificate Revocation List) est :',
    q_en: 'A CRL (Certificate Revocation List) is:',
    answers_fr: ['Une liste de certificats valides', 'Une liste signee de certificats revoques publiee par la CA', 'Un protocole en temps reel', 'Un type d\'enregistrement DNS'],
    answers_en: ['A list of valid certificates', 'A signed list of revoked certificates published by the CA', 'A real-time protocol', 'A DNS record type'],
    correct: 1,
    explanation_fr: 'La CRL est une liste signee par la CA des certificats revoques avant leur expiration. OCSP est l\'alternative en temps reel.',
    explanation_en: 'The CRL is a CA-signed list of certificates revoked before their expiry. OCSP is the real-time alternative.'
  },
  {
    level: 'advanced',
    q_fr: 'Le certificate pinning consiste a :',
    q_en: 'Certificate pinning consists of:',
    answers_fr: ['Attacher un certificat a un PIN numerique', 'Forcer le client a n\'accepter qu\'un certificat ou une cle publique specifique', 'Chiffrer le certificat avec une cle symetrique', 'Utiliser un certificat auto-signe'],
    answers_en: ['Attaching a certificate to a numeric PIN', 'Forcing the client to accept only a specific certificate or public key', 'Encrypting the certificate with a symmetric key', 'Using a self-signed certificate'],
    correct: 1,
    explanation_fr: 'Le certificate pinning ancre un certificat (ou sa cle publique) dans le client pour eviter les attaques MITM meme si la CA est compromise.',
    explanation_en: 'Certificate pinning anchors a certificate (or its public key) in the client to prevent MITM attacks even if the CA is compromised.'
  },
  {
    level: 'advanced',
    q_fr: 'Le protocole EIGRP utilise quel numero de protocole IP ?',
    q_en: 'EIGRP uses which IP protocol number?',
    answers_fr: ['17 (UDP)', '88', '89', '112'],
    answers_en: ['17 (UDP)', '88', '89', '112'],
    correct: 1,
    explanation_fr: 'EIGRP utilise le protocole IP numero 88. OSPF utilise 89, VRRP utilise 112.',
    explanation_en: 'EIGRP uses IP protocol number 88. OSPF uses 89, VRRP uses 112.'
  },
  {
    level: 'advanced',
    q_fr: 'Le protocole VRRP utilise quel numero de protocole IP ?',
    q_en: 'VRRP uses which IP protocol number?',
    answers_fr: ['88', '89', '103', '112'],
    answers_en: ['88', '89', '103', '112'],
    correct: 3,
    explanation_fr: 'VRRP utilise le protocole IP numero 112. PIM utilise 103, EIGRP 88, OSPF 89.',
    explanation_en: 'VRRP uses IP protocol number 112. PIM uses 103, EIGRP 88, OSPF 89.'
  },
  {
    level: 'advanced',
    q_fr: 'En DNS, le split-horizon signifie :',
    q_en: 'In DNS, split-horizon means:',
    answers_fr: ['Diviser les zones DNS en deux', 'Retourner des reponses differentes selon l\'interface ou l\'IP source de la requete', 'Deleguer une zone a deux serveurs differents', 'Synchroniser deux serveurs DNS primaires'],
    answers_en: ['Splitting DNS zones in two', 'Returning different answers depending on the query source interface or IP', 'Delegating a zone to two different servers', 'Synchronizing two primary DNS servers'],
    correct: 1,
    explanation_fr: 'Le DNS split-horizon renvoie des enregistrements differents (ex: IP interne vs externe) selon l\'origine de la requete (LAN vs Internet).',
    explanation_en: 'Split-horizon DNS returns different records (e.g., internal vs external IP) depending on query origin (LAN vs Internet).'
  },
  {
    level: 'basic',
    q_fr: 'Quel protocole est utilise pour envoyer des syslog sur le reseau ?',
    q_en: 'Which protocol is used to send syslogs over the network?',
    answers_fr: ['SNMP', 'SYSLOG / UDP 514', 'ICMP', 'NTP'],
    answers_en: ['SNMP', 'SYSLOG / UDP 514', 'ICMP', 'NTP'],
    correct: 1,
    explanation_fr: 'Le protocole Syslog envoie les messages de log vers un serveur central, generalement via UDP port 514 (ou TCP pour la fiabilite).',
    explanation_en: 'The Syslog protocol sends log messages to a central server, typically via UDP port 514 (or TCP for reliability).'
  },
  {
    level: 'intermediate',
    q_fr: 'La QoS DSCP (Differentiated Services Code Point) est encodee dans :',
    q_en: 'QoS DSCP (Differentiated Services Code Point) is encoded in:',
    answers_fr: ['L\'en-tete TCP', 'Le champ ToS / DS de l\'en-tete IP', 'L\'en-tete Ethernet', 'L\'en-tete UDP'],
    answers_en: ['The TCP header', 'The ToS / DS field of the IP header', 'The Ethernet header', 'The UDP header'],
    correct: 1,
    explanation_fr: 'DSCP utilise les 6 bits de poids fort du champ ToS (Type of Service) / DS de l\'en-tete IPv4 ou IPv6 pour marquer la priorite des paquets.',
    explanation_en: 'DSCP uses the 6 most significant bits of the ToS / DS field in the IPv4 or IPv6 header to mark packet priority.'
  },
  {
    level: 'advanced',
    q_fr: 'BGP utilise quel transport et quel port ?',
    q_en: 'BGP uses which transport and port?',
    answers_fr: ['UDP 179', 'TCP 179', 'TCP 646', 'UDP 520'],
    answers_en: ['UDP 179', 'TCP 179', 'TCP 646', 'UDP 520'],
    correct: 1,
    explanation_fr: 'BGP utilise TCP port 179. La fiabilite de TCP est necessaire pour maintenir des sessions stables entre pairs BGP.',
    explanation_en: 'BGP uses TCP port 179. TCP reliability is required to maintain stable sessions between BGP peers.'
  }
];

// ── Difficulty configs ────────────────────────────────────────

const QUIZ_CONFIG = {
  easy:   { count: 12, levels: ['basic'],                              timerPerQuestion: null },
  medium: { count: 20, levels: ['basic', 'intermediate'],              timerPerQuestion: null },
  hard:   { count: 30, levels: ['basic', 'intermediate', 'advanced'],  timerPerQuestion: 10   }
};

// Game state
let quizState = {
  difficulty: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  questionStartTime: null,
  timerInterval: null,
  finished: false
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
  });
});

function startGame(difficulty) {
  const config = QUIZ_CONFIG[difficulty];

  // Filter pool by allowed levels, then shuffle and pick
  const filtered = QUESTION_BANK.filter(q => config.levels.includes(q.level));
  const shuffled = shuffleArray(filtered);
  const selected = shuffled.slice(0, config.count);

  quizState = {
    difficulty,
    questions: selected,
    currentIndex: 0,
    score: 0,
    answered: false,
    questionStartTime: null,
    timerInterval: null,
    finished: false
  };

  document.getElementById('difficulty-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('result-screen').style.display = 'none';

  renderQuestion();
}

// ============================================================
// RENDER
// ============================================================

function renderQuestion() {
  const q = quizState.questions[quizState.currentIndex];
  const lang = i18n.getLang();
  const total = quizState.questions.length;

  quizState.answered = false;
  quizState.questionStartTime = Date.now();

  // Progress
  document.getElementById('quiz-progress').textContent =
    `${i18n.t('hud_question')} ${quizState.currentIndex + 1} / ${total}`;

  // Score
  document.getElementById('hud-score').textContent =
    String(quizState.score).padStart(5, '0');

  // Question text
  const questionText = lang === 'fr' ? q.q_fr : q.q_en;
  document.getElementById('quiz-question').textContent = questionText;

  // Answers
  const answersContainer = document.getElementById('quiz-answers');
  answersContainer.innerHTML = '';

  const answers = lang === 'fr' ? q.answers_fr : q.answers_en;
  answers.forEach((answer, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer';
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${answer}`;
    btn.dataset.index = idx;
    btn.setAttribute('aria-label', answer);

    btn.addEventListener('click', () => onAnswerClick(idx));
    answersContainer.appendChild(btn);
  });

  // Explanation area
  document.getElementById('quiz-explanation').style.display = 'none';
  document.getElementById('quiz-explanation').textContent = '';

  // Next button
  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.style.display = 'none';

  // Timer (hard mode only)
  clearInterval(quizState.timerInterval);
  const timerEl = document.getElementById('quiz-timer');

  if (QUIZ_CONFIG[quizState.difficulty].timerPerQuestion) {
    timerEl.style.display = 'block';
    let remaining = QUIZ_CONFIG[quizState.difficulty].timerPerQuestion;
    timerEl.textContent = remaining;

    quizState.timerInterval = setInterval(() => {
      remaining--;
      timerEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(quizState.timerInterval);
        onAnswerClick(-1);
      }
    }, 1000);
  } else {
    timerEl.style.display = 'none';
  }
}

function onAnswerClick(selectedIdx) {
  if (quizState.answered) return;
  quizState.answered = true;

  clearInterval(quizState.timerInterval);

  const q = quizState.questions[quizState.currentIndex];
  const lang = i18n.getLang();
  const isCorrect = selectedIdx === q.correct;

  // Elapsed time for speed bonus
  const elapsed = (Date.now() - quizState.questionStartTime) / 1000;
  const speedBonus = isCorrect ? Math.max(0, Math.floor((10 - elapsed) * 3)) : 0;

  if (isCorrect) {
    quizState.score += 100 + speedBonus;
    showFlash(i18n.t('pq_correct'), 'success');
  }

  // Disable all buttons and mark correct / wrong
  const buttons = document.querySelectorAll('.quiz-answer');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add('correct');
    if (idx === selectedIdx && !isCorrect) btn.classList.add('wrong');
  });

  // Show explanation
  const explanation = lang === 'fr' ? q.explanation_fr : q.explanation_en;
  const explanationEl = document.getElementById('quiz-explanation');
  explanationEl.style.display = 'block';
  const prefix = isCorrect ? '' : `${i18n.t('pq_correct_was')} ${(lang === 'fr' ? q.answers_fr : q.answers_en)[q.correct]}. `;
  explanationEl.textContent = prefix + explanation;

  // Update score display
  document.getElementById('hud-score').textContent =
    String(quizState.score).padStart(5, '0');

  // Next / Finish button
  const nextBtn = document.getElementById('quiz-next-btn');
  const isLast = quizState.currentIndex >= quizState.questions.length - 1;

  nextBtn.textContent = isLast ? i18n.t('pq_finish') : i18n.t('pq_next');
  nextBtn.style.display = 'inline-block';
  nextBtn.onclick = () => {
    if (isLast) {
      endGame();
    } else {
      quizState.currentIndex++;
      renderQuestion();
    }
  };
}

// ============================================================
// GAME OVER
// ============================================================

function endGame() {
  quizState.finished = true;
  clearInterval(quizState.timerInterval);

  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  const correctCount = Math.floor(quizState.score / 100);
  const win = correctCount >= Math.ceil(quizState.questions.length * 0.6);

  document.getElementById('result-title').textContent = win
    ? i18n.t('victory')
    : i18n.t('game_over');
  document.getElementById('result-title').className = win
    ? 'game-result__title game-result__title--win'
    : 'game-result__title game-result__title--lose';
  document.getElementById('result-score').textContent =
    String(quizState.score).padStart(6, '0');

  document.getElementById('save-score-btn').onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('score-entry-screen').style.display = 'block';

    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, 'protocol-quiz', quizState.difficulty, quizState.score);
        document.getElementById('score-entry-screen').style.display = 'none';
        document.getElementById('post-save-screen').style.display = 'block';

        // Check and show newly unlocked rewards
        const newPins = checkRewards();
        showRewardNotifications(newPins, { isGamePage: true });

        document.getElementById('capture-btn').onclick = () => {
          ticket.generate({
            initials,
            game: i18n.t('game_protocol_quiz'),
            difficulty: quizState.difficulty,
            score: quizState.score,
            topScore: quizState.questions.length * 130
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

function showFlash(message, type) {
  const existing = document.querySelector('.flash-message');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = `flash-message flash-message--${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

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
