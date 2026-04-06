# The Arcade Borne

Educational arcade games for sysadmins, network engineers and DevOps.
1980s arcade cabinet visual design. No framework, no build step, no server required.

## How to play

Open `index.html` in any modern browser. No installation, no dependencies beyond Google Fonts.

```
open index.html
```

Works fully offline (Google Fonts will fall back to system monospace if no internet connection).

## Games

### Port Match

Match network service names to their port numbers.
Two columns, click a service then its matching port.

- Easy: 8 common ports (HTTP, HTTPS, SSH, FTP, DNS, SMTP, RDP, MySQL)
- Medium: 12 ports (adds LDAP, Telnet, SNMP, PostgreSQL)
- Hard: 16 ports (adds Kerberos, IMAP, POP3, NTP)

Score: `1000 - (seconds * 10) - (errors * 50)`

### OSI Puzzle

Drag and drop (or tap on mobile) the 7 OSI layers into their correct numbered slots.

- Easy: top-down order (7 to 1), slot labels visible
- Medium: bottom-up order (1 to 7), no hints
- Hard: random slot order, 60-second countdown, protocol examples hidden

Score: `700 base + speed bonus - error penalty`

### Protocol Quiz

Multiple choice questions on network protocols.
30+ questions covering TCP/UDP, port numbers, OSI layers, routing protocols, DNS, DHCP, ARP, ICMP and more.
Available in French and English.

- Easy: 10 questions, no timer
- Medium: 15 questions, no timer
- Hard: 20 questions, 15 seconds per question

Score: `100 per correct answer + speed bonus`

### Subnet Challenge

Given an IP address and prefix length, calculate the subnet details.

- Easy: /8, /16, /24 — network address only
- Medium: /25 to /28 — network, broadcast, usable hosts
- Hard: /29, /30 — all fields (network, broadcast, hosts, first host, last host)

Each answer comes with a full calculation explanation.

Score: `200 per correct answer - 50 penalty per failed attempt`

## Features

- Hall of Fame — top 10 scores from all games, persisted in localStorage
- 3-letter initials entry (arcade style, keyboard and click navigation)
- Score ticket generator — draws a retro receipt on Canvas and downloads it as PNG
- FR / EN language toggle (all labels, instructions, question content)
- Responsive layout — works on mobile, tablet and desktop

## File structure

```
the-arcade-borne/
├── index.html              — Main menu + Hall of Fame
├── css/
│   └── style.css           — All styles, design tokens, animations
├── js/
│   ├── main.js             — Homepage logic (Hall of Fame render)
│   ├── i18n.js             — FR/EN translation module
│   ├── scores.js           — localStorage score management + entry UI
│   ├── ticket.js           — Canvas PNG ticket generator
│   ├── port-match.js       — Port Match game logic
│   ├── osi-puzzle.js       — OSI Puzzle game logic
│   ├── protocol-quiz.js    — Protocol Quiz game logic
│   └── subnet-challenge.js — Subnet Challenge game logic
└── games/
    ├── port-match.html
    ├── osi-puzzle.html
    ├── protocol-quiz.html
    └── subnet-challenge.html
```

## Stack

- HTML5 / CSS3 / Vanilla JavaScript (ES6+)
- Zero external dependencies (Google Fonts only)
- localStorage for score persistence
- HTML5 Canvas for ticket generation
- HTML5 Drag and Drop API for OSI Puzzle

## Credits

Built by Thomas Rayon
Font: Press Start 2P by CodeMan38 (Google Fonts, OFL license)
