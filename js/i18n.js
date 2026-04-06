/**
 * i18n.js — Internationalization module
 * Supports FR and EN. Language is persisted in localStorage.
 */

const TRANSLATIONS = {
  fr: {
    // Site-wide
    site_title: 'THE ARCADE BORNE',
    site_subtitle: 'APPRENDRE. JOUER. GAGNER.',
    lang_toggle: 'EN',
    back: '< RETOUR',
    insert_coin: 'INSERER UNE PIECE POUR CONTINUER',
    loading: 'CHARGEMENT...',
    hall_of_fame: 'HALL OF FAME',
    no_scores: 'AUCUN SCORE ENREGISTRE.\nJOUEZ POUR APPARAITRE ICI !',
    rank: 'RG',
    initials: 'NOM',
    game: 'JEU',
    difficulty: 'DIFF',
    score: 'SCORE',
    date: 'DATE',

    // Difficulty labels
    easy: 'FACILE',
    medium: 'MOYEN',
    hard: 'DIFFICILE',
    select_difficulty: 'CHOISIR LA DIFFICULTE',

    // Game names
    game_port_match: 'PORT MATCH',
    game_osi_puzzle: 'OSI PUZZLE',
    game_protocol_quiz: 'PROTOCOL QUIZ',
    game_subnet_challenge: 'SUBNET CHALLENGE',

    // Game descriptions
    desc_port_match: 'Associez les services a leurs ports',
    desc_osi_puzzle: 'Reconstituez le modele OSI',
    desc_protocol_quiz: 'Testez vos connaissances protocoles',
    desc_subnet_challenge: 'Calculez les sous-reseaux',

    // HUD
    hud_score: 'SCORE',
    hud_time: 'TEMPS',
    hud_errors: 'ERREURS',
    hud_question: 'QUESTION',

    // Game result
    game_over: 'GAME OVER',
    victory: 'VICTOIRE !',
    well_played: 'BIEN JOUE',
    your_score: 'VOTRE SCORE',
    play_again: 'REJOUER',
    menu: 'MENU',
    save_score: 'ENREGISTRER LE SCORE',
    capture_score: 'CAPTURE SCORE',

    // Score entry
    enter_initials: 'ENTREZ VOS INITIALES',
    enter_confirm: 'CONFIRMER',
    enter_hint: 'FLECHES HAUT/BAS POUR CHANGER LA LETTRE',

    // Port Match
    pm_services: 'SERVICES',
    pm_ports: 'PORTS',
    pm_instruction: 'Cliquez un service, puis son port correspondant.',
    pm_complete: 'TOUS LES PORTS ASSOCIES !',

    // OSI Puzzle
    osi_instruction_easy: 'Glissez les couches de la couche 7 a la couche 1.',
    osi_instruction_medium: 'Glissez les couches de la couche 1 a la couche 7. Pas d\'indice.',
    osi_instruction_hard: 'Ordre aleatoire. Timer serre. Bonne chance.',
    osi_pieces_title: 'COUCHES DISPONIBLES',
    osi_slots_title: 'MODELE OSI',
    osi_layer: 'COUCHE',
    osi_complete: 'MODELE RECONSTITUE !',

    // OSI layer names
    layer_7: 'APPLICATION',
    layer_6: 'PRESENTATION',
    layer_5: 'SESSION',
    layer_4: 'TRANSPORT',
    layer_3: 'RESEAU',
    layer_2: 'LIAISON',
    layer_1: 'PHYSIQUE',

    // Protocol Quiz
    pq_instruction: 'Choisissez la bonne reponse.',
    pq_next: 'QUESTION SUIVANTE',
    pq_finish: 'VOIR LES RESULTATS',
    pq_correct: 'BONNE REPONSE !',
    pq_wrong: 'MAUVAISE REPONSE.',
    pq_correct_was: 'LA BONNE REPONSE ETAIT :',

    // Subnet Challenge
    sc_instruction: 'Calculez les informations du sous-reseau.',
    sc_network: 'ADRESSE RESEAU',
    sc_broadcast: 'ADRESSE BROADCAST',
    sc_hosts: 'NB HOTES UTILISABLES',
    sc_first_host: 'PREMIER HOTE',
    sc_last_host: 'DERNIER HOTE',
    sc_validate: 'VALIDER',
    sc_next: 'SUIVANT',
    sc_explanation: 'EXPLICATION',
    sc_correct: 'CORRECT !',
    sc_wrong: 'INCORRECT.',

    // Ticket
    ticket_btn: 'TELECHARGER LE TICKET',
    ticket_congratulations: 'FELICITATIONS',
    ticket_well_played: 'BIEN JOUE',
    ticket_footer: 'INSERER UNE PIECE POUR REJOUER',

    // OSI Puzzle — puzzle type selection
    osi_select_type: 'CHOISIR LE PUZZLE',
    osi_type_osi: 'MODELE OSI',
    osi_type_tcpip: 'MODELE TCP/IP',
    osi_type_handshake: 'TCP HANDSHAKE',
    osi_type_dhcp: 'DHCP DORA',
    osi_type_encap: 'ENCAPSULATION',
    osi_type_osi_sub: '7 COUCHES OSI',
    osi_type_tcpip_sub: '4 COUCHES TCP/IP',
    osi_type_handshake_sub: 'THREE-WAY HANDSHAKE',
    osi_type_dhcp_sub: 'DISCOVER > ACK',
    osi_type_encap_sub: 'DATA > BITS',

    // OSI Puzzle — How to Play titles
    htp_title: 'COMMENT JOUER',

    // OSI Puzzle — How to Play per type
    htp_osi: 'Glisse les 7 couches OSI dans le bon ordre. Couche 7 = APPLICATION en haut, couche 1 = PHYSIQUE en bas.',
    htp_tcpip: 'Glisse les 4 couches TCP/IP dans le bon ordre, de APPLICATION (haut) vers NETWORK ACCESS (bas).',
    htp_handshake: 'Remets les etapes du handshake TCP dans le bon ordre chronologique.',
    htp_dhcp: 'Remets les 4 etapes DHCP dans le bon ordre : Discover - Offer - Request - Acknowledge.',
    htp_encap: 'Ordonne les couches reseau de la donnee applicative (haut) jusqu\'aux bits physiques (bas), telle que la donnee est encapsulee.',

    // Cable Chaos
    game_cable_chaos: 'CABLE CHAOS',
    desc_cable_chaos: 'Cabblez le reseau correctement',
    cc_connect_title: 'CONNEXIONS A ETABLIR',
    cc_validate: 'VALIDER LE CABLAGE',
    cc_diff_easy_sub: '4 APPAREILS',
    cc_diff_medium_sub: '6 APPAREILS',
    cc_diff_hard_sub: '8 APPAREILS + TIMER',
    htp_cable_chaos: 'Un scenario reseau t\'est presente. Pour chaque paire d\'appareils relies, choisis le bon type de cable : DROIT (droit = appareils de niveaux OSI differents : PC vers Switch, Switch vers Routeur), CROISE (meme type : PC-PC, Switch-Switch, Routeur-Routeur), FIBRE (liaison longue distance ou backbone), CONSOLE (PC admin vers port console du routeur/switch), SFP FIBRE (port SFP uplink entre switches). Valide le cablage quand tu as tout connecte.',

    // Port Match — How to Play
    htp_port_match: 'Associe chaque service a gauche avec son numero de port a droite. Clique un service, puis son port. Vert = correct. Rouge = erreur (-50 pts, -5s). Complete toutes les paires avant la fin du temps.',

    // Protocol Quiz — How to Play
    htp_protocol_quiz: 'Reponds aux questions sur les protocoles reseau. 4 choix par question. Clique la bonne reponse. En mode DIFFICILE, tu as un temps limite par question. Ton score depend des bonnes reponses et de ta rapidite.',

    // Subnet Challenge — How to Play
    htp_subnet: 'Une adresse IP et un masque CIDR te sont donnes. Calcule : l\'adresse reseau (tous les bits hotes = 0), le broadcast (tous les bits hotes = 1), le nombre d\'hotes utilisables (total - 2), le premier et le dernier hote.',
    htp_subnet_example: 'Exemple : 192.168.1.0/24 -> Reseau : 192.168.1.0 | Broadcast : 192.168.1.255 | Hotes : 254',

    // How to Play toggle
    htp_collapse: 'COMMENT JOUER',

    // Firewall Blitz
    game_firewall_blitz:   'FIREWALL BLITZ',
    desc_firewall_blitz:   'Acceptez ou bloquez les paquets',
    fb_diff_easy_sub:      'REGLES SIMPLES',
    fb_diff_medium_sub:    'ZONES + DIRECTIONS',
    fb_diff_hard_sub:      'STATEFUL + NAT + TIMER',
    fb_policy_title:       'POLITIQUE FIREWALL',
    fb_packet_label:       'PAQUET A TRAITER',
    fb_accept:             'ACCEPT',
    fb_deny:               'DENY',
    htp_firewall_blitz:    'La politique firewall est affichee en haut. Un paquet arrive — lis sa source, sa destination et son port. Clique ACCEPT s\'il correspond a une regle d\'autorisation, DENY sinon. En mode DIFFICILE, un timer par paquet s\'ajoute : reagis vite. Erreur = -80 pts et -5s sur le timer global.',

    // DNS Chain
    game_dns_chain:        'DNS CHAIN',
    desc_dns_chain:        'Reconstituez la chaine DNS',
    dc_diff_easy_sub:      'RESOLUTION A / CACHE',
    dc_diff_medium_sub:    'MX / CNAME / PTR',
    dc_diff_hard_sub:      'DNSSEC + SPLIT-HORIZON',
    dc_pieces_title:       'ETAPES DISPONIBLES',
    dc_slots_title:        'ORDRE DE RESOLUTION',
    dc_validate:           'VALIDER L\'ORDRE',
    htp_dns_chain:         'Une chaine de resolution DNS est a reconstituer. Clique une etape dans la colonne gauche pour la selectionner (surlignee), puis clique le slot cible dans la colonne droite pour la placer. Clique un slot rempli pour retirer l\'etape. Valide quand toutes les etapes sont placees dans le bon ordre. En DIFFICILE : DNSSEC et Split-Horizon avec timer serre. Erreur = -80 pts et -8s.',

    // Packet Tracer
    game_packet_tracer:    'PACKET TRACER',
    desc_packet_tracer:    'Suivez le paquet saut par saut',
    pt_diff_easy_sub:      'L2 / L3 BASIQUE',
    pt_diff_medium_sub:    'NAT / ACL / ARP',
    pt_diff_hard_sub:      'BGP / FRAGMENTATION',
    pt_device_label:       'EQUIPEMENT ACTIF',
    htp_packet_tracer:     'Un paquet traverse un reseau saut par saut. A chaque equipement, une question te demande quelle action il effectue. Choisis la bonne reponse parmi 4 options melangees. Bonne reponse = points. Mauvaise = la correcte est revelee, -60 pts et -8s (medium/hard). En DIFFICILE : BGP, fragmentation, routage asymetrique.',

    // VLAN Master
    game_vlan_master:      'VLAN MASTER',
    desc_vlan_master:      'Configurez les ports switch',
    vm_diff_easy_sub:      'ACCESS PORTS SIMPLE',
    vm_diff_medium_sub:    'ACCESS + TRUNK + NATIF',
    vm_diff_hard_sub:      'MULTI-SWITCH + STP + ERREURS',
    vm_policy_title:       'POLITIQUE VLAN',
    vm_validate:           'VALIDER LA CONFIG',
    htp_vlan_master:       'Une politique VLAN est donnee. Pour chaque port du switch, selectionne le bon mode (ACCESS ou TRUNK), le bon VLAN d\'acces, et en mode MOYEN/DIFFICILE le VLAN natif et les VLANs autorises sur les trunks. En mode DIFFICILE, certains ports sont deja configures avec des erreurs — flagge ceux qui sont incorrects. Valide quand tous les ports sont corrects.',
  },

  en: {
    // Site-wide
    site_title: 'THE ARCADE BORNE',
    site_subtitle: 'LEARN. PLAY. WIN.',
    lang_toggle: 'FR',
    back: '< BACK',
    insert_coin: 'INSERT COIN TO CONTINUE',
    loading: 'LOADING...',
    hall_of_fame: 'HALL OF FAME',
    no_scores: 'NO SCORES RECORDED YET.\nPLAY A GAME TO APPEAR HERE!',
    rank: 'RK',
    initials: 'NAME',
    game: 'GAME',
    difficulty: 'DIFF',
    score: 'SCORE',
    date: 'DATE',

    // Difficulty labels
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
    select_difficulty: 'SELECT DIFFICULTY',

    // Game names
    game_port_match: 'PORT MATCH',
    game_osi_puzzle: 'OSI PUZZLE',
    game_protocol_quiz: 'PROTOCOL QUIZ',
    game_subnet_challenge: 'SUBNET CHALLENGE',

    // Game descriptions
    desc_port_match: 'Match services to their ports',
    desc_osi_puzzle: 'Rebuild the OSI model',
    desc_protocol_quiz: 'Test your protocol knowledge',
    desc_subnet_challenge: 'Calculate subnets',

    // HUD
    hud_score: 'SCORE',
    hud_time: 'TIME',
    hud_errors: 'ERRORS',
    hud_question: 'QUESTION',

    // Game result
    game_over: 'GAME OVER',
    victory: 'VICTORY!',
    well_played: 'WELL PLAYED',
    your_score: 'YOUR SCORE',
    play_again: 'PLAY AGAIN',
    menu: 'MENU',
    save_score: 'SAVE SCORE',
    capture_score: 'CAPTURE SCORE',

    // Score entry
    enter_initials: 'ENTER YOUR INITIALS',
    enter_confirm: 'CONFIRM',
    enter_hint: 'UP/DOWN ARROWS TO CHANGE LETTER',

    // Port Match
    pm_services: 'SERVICES',
    pm_ports: 'PORTS',
    pm_instruction: 'Click a service, then its matching port.',
    pm_complete: 'ALL PORTS MATCHED!',

    // OSI Puzzle
    osi_instruction_easy: 'Drag the layers from layer 7 down to layer 1.',
    osi_instruction_medium: 'Drag the layers from layer 1 up to layer 7. No hints.',
    osi_instruction_hard: 'Random order. Tight timer. Good luck.',
    osi_pieces_title: 'AVAILABLE LAYERS',
    osi_slots_title: 'OSI MODEL',
    osi_layer: 'LAYER',
    osi_complete: 'MODEL COMPLETE!',

    // OSI layer names
    layer_7: 'APPLICATION',
    layer_6: 'PRESENTATION',
    layer_5: 'SESSION',
    layer_4: 'TRANSPORT',
    layer_3: 'NETWORK',
    layer_2: 'DATA LINK',
    layer_1: 'PHYSICAL',

    // Protocol Quiz
    pq_instruction: 'Choose the correct answer.',
    pq_next: 'NEXT QUESTION',
    pq_finish: 'SEE RESULTS',
    pq_correct: 'CORRECT!',
    pq_wrong: 'WRONG!',
    pq_correct_was: 'THE CORRECT ANSWER WAS:',

    // Subnet Challenge
    sc_instruction: 'Calculate the subnet information.',
    sc_network: 'NETWORK ADDRESS',
    sc_broadcast: 'BROADCAST ADDRESS',
    sc_hosts: 'USABLE HOSTS',
    sc_first_host: 'FIRST HOST',
    sc_last_host: 'LAST HOST',
    sc_validate: 'VALIDATE',
    sc_next: 'NEXT',
    sc_explanation: 'EXPLANATION',
    sc_correct: 'CORRECT!',
    sc_wrong: 'INCORRECT.',

    // Ticket
    ticket_btn: 'DOWNLOAD TICKET',
    ticket_congratulations: 'CONGRATULATIONS',
    ticket_well_played: 'WELL PLAYED',
    ticket_footer: 'INSERT COIN TO PLAY AGAIN',

    // OSI Puzzle — puzzle type selection
    osi_select_type: 'SELECT PUZZLE TYPE',
    osi_type_osi: 'OSI MODEL',
    osi_type_tcpip: 'TCP/IP MODEL',
    osi_type_handshake: 'TCP HANDSHAKE',
    osi_type_dhcp: 'DHCP DORA',
    osi_type_encap: 'ENCAPSULATION',
    osi_type_osi_sub: '7 OSI LAYERS',
    osi_type_tcpip_sub: '4 TCP/IP LAYERS',
    osi_type_handshake_sub: 'THREE-WAY HANDSHAKE',
    osi_type_dhcp_sub: 'DISCOVER > ACK',
    osi_type_encap_sub: 'DATA > BITS',

    // OSI Puzzle — How to Play titles
    htp_title: 'HOW TO PLAY',

    // OSI Puzzle — How to Play per type
    htp_osi: 'Drag the 7 OSI layers into the correct order. Layer 7 = APPLICATION at top, Layer 1 = PHYSICAL at bottom.',
    htp_tcpip: 'Drag the 4 TCP/IP layers into the correct order, from APPLICATION (top) to NETWORK ACCESS (bottom).',
    htp_handshake: 'Put the TCP connection steps in the correct chronological order.',
    htp_dhcp: 'Put the 4 DHCP steps in the correct order: Discover - Offer - Request - Acknowledge.',
    htp_encap: 'Order the network layers from application data (top) to physical bits (bottom), as data gets encapsulated.',

    // Cable Chaos
    game_cable_chaos: 'CABLE CHAOS',
    desc_cable_chaos: 'Wire the network correctly',
    cc_connect_title: 'CONNECTIONS TO ESTABLISH',
    cc_validate: 'VALIDATE CABLING',
    cc_diff_easy_sub: '4 DEVICES',
    cc_diff_medium_sub: '6 DEVICES',
    cc_diff_hard_sub: '8 DEVICES + TIMER',
    htp_cable_chaos: 'A network scenario is shown. For each device pair, choose the correct cable type: STRAIGHT (different OSI layer devices: PC to Switch, Switch to Router), CROSSOVER (same device type: PC-PC, Switch-Switch, Router-Router), FIBER (long distance or backbone), CONSOLE (admin PC to router/switch console port), SFP FIBER (SFP uplink between switches). Validate the cabling when all connections are set.',

    // Port Match — How to Play
    htp_port_match: 'Match each service on the LEFT with its port number on the RIGHT. Click a service, then click its port. Green = correct. Red = wrong (-50 pts, -5s). Complete all pairs before time runs out.',

    // Protocol Quiz — How to Play
    htp_protocol_quiz: 'Answer questions about networking protocols. 4 choices per question. Click the correct answer. In HARD mode, you have limited time per question. Your score depends on correct answers and speed.',

    // Subnet Challenge — How to Play
    htp_subnet: 'You are given an IP address and a subnet mask (CIDR). Calculate: the network address (all host bits = 0), the broadcast (all host bits = 1), the number of usable hosts (total - 2), the first and last host.',
    htp_subnet_example: 'Example: 192.168.1.0/24 -> Network: 192.168.1.0 | Broadcast: 192.168.1.255 | Hosts: 254',

    // How to Play toggle
    htp_collapse: 'HOW TO PLAY',

    // Firewall Blitz
    game_firewall_blitz:   'FIREWALL BLITZ',
    desc_firewall_blitz:   'Accept or block packets',
    fb_diff_easy_sub:      'SIMPLE RULES',
    fb_diff_medium_sub:    'ZONES + DIRECTIONS',
    fb_diff_hard_sub:      'STATEFUL + NAT + TIMER',
    fb_policy_title:       'FIREWALL POLICY',
    fb_packet_label:       'INCOMING PACKET',
    fb_accept:             'ACCEPT',
    fb_deny:               'DENY',
    htp_firewall_blitz:    'The firewall policy is displayed at the top. A packet arrives — read its source, destination and port. Click ACCEPT if it matches an allow rule, DENY otherwise. In HARD mode, a per-packet timer is added: react fast. Wrong answer = -80 pts and -5s on the global timer.',

    // DNS Chain
    game_dns_chain:        'DNS CHAIN',
    desc_dns_chain:        'Rebuild the DNS resolution chain',
    dc_diff_easy_sub:      'A RECORD / CACHE',
    dc_diff_medium_sub:    'MX / CNAME / PTR',
    dc_diff_hard_sub:      'DNSSEC + SPLIT-HORIZON',
    dc_pieces_title:       'AVAILABLE STEPS',
    dc_slots_title:        'RESOLUTION ORDER',
    dc_validate:           'VALIDATE ORDER',
    htp_dns_chain:         'A DNS resolution chain must be rebuilt. Click a step in the left column to select it (highlighted), then click the target slot in the right column to place it. Click a filled slot to remove the step. Validate when all steps are in the correct order. In HARD: DNSSEC and Split-Horizon with tight timer. Wrong = -80 pts and -8s.',

    // Packet Tracer
    game_packet_tracer:    'PACKET TRACER',
    desc_packet_tracer:    'Follow the packet hop by hop',
    pt_diff_easy_sub:      'L2 / L3 BASIC',
    pt_diff_medium_sub:    'NAT / ACL / ARP',
    pt_diff_hard_sub:      'BGP / FRAGMENTATION',
    pt_device_label:       'ACTIVE DEVICE',
    htp_packet_tracer:     'A packet crosses a network hop by hop. At each device, a question asks what action it takes. Choose the correct answer from 4 shuffled options. Correct = points. Wrong = correct answer revealed, -60 pts and -8s (medium/hard). In HARD: BGP, IP fragmentation, asymmetric routing.',

    // VLAN Master
    game_vlan_master:      'VLAN MASTER',
    desc_vlan_master:      'Configure the switch ports',
    vm_diff_easy_sub:      'SIMPLE ACCESS PORTS',
    vm_diff_medium_sub:    'ACCESS + TRUNK + NATIVE',
    vm_diff_hard_sub:      'MULTI-SWITCH + STP + ERRORS',
    vm_policy_title:       'VLAN POLICY',
    vm_validate:           'VALIDATE CONFIG',
    htp_vlan_master:       'A VLAN policy is given. For each switch port, select the correct mode (ACCESS or TRUNK), the right access VLAN, and in MEDIUM/HARD mode the native VLAN and allowed VLANs on trunks. In HARD mode, some ports are already configured with errors — flag the misconfigured ones. Validate when all ports are correctly set.',
  }
};

const I18N_KEY = 'arcade_lang';

const i18n = {
  /**
   * Get the current language code ('fr' or 'en').
   * @returns {string}
   */
  getLang() {
    return localStorage.getItem(I18N_KEY) || 'fr';
  },

  /**
   * Set the active language and persist it.
   * @param {string} lang - 'fr' or 'en'
   */
  setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    localStorage.setItem(I18N_KEY, lang);
  },

  /**
   * Toggle between 'fr' and 'en'.
   * @returns {string} New language code
   */
  toggleLang() {
    const current = this.getLang();
    const next = current === 'fr' ? 'en' : 'fr';
    this.setLang(next);
    return next;
  },

  /**
   * Translate a key. Returns the key itself if not found.
   * @param {string} key
   * @returns {string}
   */
  t(key) {
    const lang = this.getLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
  },

  /**
   * Apply translations to the current page.
   * Elements with data-i18n="key" get their textContent replaced.
   * Elements with data-i18n-placeholder="key" get their placeholder replaced.
   */
  applyToDOM() {
    const lang = this.getLang();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
      el.textContent = translation;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
      el.placeholder = translation;
    });
    // Update lang toggle button text
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.textContent = TRANSLATIONS[lang].lang_toggle;
    }
    // Update html lang attribute
    document.documentElement.lang = lang;
  }
};

// Auto-apply on DOMContentLoaded if this script is loaded in a page
document.addEventListener('DOMContentLoaded', () => {
  i18n.applyToDOM();
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      i18n.toggleLang();
      i18n.applyToDOM();
      // Notify other modules that language changed
      document.dispatchEvent(new CustomEvent('langChange', { detail: { lang: i18n.getLang() } }));
    });
  }
});
