/**
 * port-match.js — Port Match game logic
 *
 * Two columns: services (left) and port numbers (right).
 * Player clicks a service, then a port. Correct = both turn green.
 * Wrong = red flash, time penalty.
 *
 * Score: 1000 base - (elapsed seconds * 10) - (errors * 50)
 *
 * Difficulty timers:
 *   easy   — 120 seconds countdown (10 ports picked from 30+)
 *   medium —  90 seconds countdown (16 ports picked from 50+)
 *   hard   —  60 seconds countdown (22 ports picked from 70+, short labels)
 */

// ── Full port pools ───────────────────────────────────────────

// Easy pool — 30 entries. 10 picked per game.
const PORT_POOL_EASY = [
  { service: 'HTTP',        port: 80    },
  { service: 'HTTPS',       port: 443   },
  { service: 'SSH',         port: 22    },
  { service: 'FTP',         port: 21    },
  { service: 'DNS',         port: 53    },
  { service: 'SMTP',        port: 25    },
  { service: 'RDP',         port: 3389  },
  { service: 'MySQL',       port: 3306  },
  { service: 'Telnet',      port: 23    },
  { service: 'SNMP',        port: 161   },
  { service: 'DHCP',        port: 67    },
  { service: 'DHCP-Client', port: 68    },
  { service: 'TFTP',        port: 69    },
  { service: 'POP3',        port: 110   },
  { service: 'IMAP',        port: 143   },
  { service: 'LDAP',        port: 389   },
  { service: 'SMB',         port: 445   },
  { service: 'PostgreSQL',  port: 5432  },
  { service: 'Redis',       port: 6379  },
  { service: 'MongoDB',     port: 27017 },
  { service: 'Elastic',     port: 9200  },
  { service: 'Kibana',      port: 5601  },
  { service: 'HTTP-Alt',    port: 8080  },
  { service: 'HTTPS-Alt',   port: 8443  },
  { service: 'VNC',         port: 5900  },
  { service: 'IRC',         port: 6667  },
  { service: 'Syslog',      port: 514   },
  { service: 'NTP',         port: 123   },
  { service: 'Kerberos',    port: 88    },
  { service: 'RPC',         port: 135   },
];

// Medium pool — 50 entries (easy + extras). 16 picked per game.
const PORT_POOL_MEDIUM = [
  ...PORT_POOL_EASY,
  { service: 'BGP',         port: 179   },
  { service: 'LDAPS',       port: 636   },
  { service: 'FTPS',        port: 990   },
  { service: 'WinRM',       port: 5985  },
  { service: 'WinRM-TLS',   port: 5986  },
  { service: 'RADIUS',      port: 1812  },
  { service: 'RADIUS-Acct', port: 1813  },
  { service: 'TACACS+',     port: 49    },
  { service: 'L2TP',        port: 1701  },
  { service: 'PPTP',        port: 1723  },
  { service: 'OpenVPN',     port: 1194  },
  { service: 'WireGuard',   port: 51820 },
  { service: 'Docker',      port: 2375  },
  { service: 'Docker-TLS',  port: 2376  },
  { service: 'etcd',        port: 2379  },
  { service: 'K8s-API',     port: 6443  },
  { service: 'Prometheus',  port: 9090  },
  { service: 'Grafana',     port: 3000  },
  { service: 'Alertmgr',   port: 9093  },
  { service: 'NodeExp',     port: 9100  },
];

// Hard pool — 70+ entries (medium + extras). 22 picked per game.
// Short technical labels only (hard mode rule).
const PORT_POOL_HARD = [
  // Re-define all entries with short labels for hard mode
  { service: 'HTTP',       port: 80    },
  { service: 'HTTPS',      port: 443   },
  { service: 'SSH',        port: 22    },
  { service: 'FTP',        port: 21    },
  { service: 'DNS',        port: 53    },
  { service: 'SMTP',       port: 25    },
  { service: 'RDP',        port: 3389  },
  { service: 'MySQL',      port: 3306  },
  { service: 'Telnet',     port: 23    },
  { service: 'SNMP',       port: 161   },
  { service: 'DHCP-S',     port: 67    },
  { service: 'DHCP-C',     port: 68    },
  { service: 'TFTP',       port: 69    },
  { service: 'POP3',       port: 110   },
  { service: 'IMAP',       port: 143   },
  { service: 'LDAP',       port: 389   },
  { service: 'SMB',        port: 445   },
  { service: 'PgSQL',      port: 5432  },
  { service: 'Redis',      port: 6379  },
  { service: 'MongoDB',    port: 27017 },
  { service: 'Elastic',    port: 9200  },
  { service: 'Kibana',     port: 5601  },
  { service: 'HTTP-Alt',   port: 8080  },
  { service: 'HTTPS-Alt',  port: 8443  },
  { service: 'VNC',        port: 5900  },
  { service: 'Syslog',     port: 514   },
  { service: 'NTP',        port: 123   },
  { service: 'Kerberos',   port: 88    },
  { service: 'RPC',        port: 135   },
  { service: 'BGP',        port: 179   },
  { service: 'LDAPS',      port: 636   },
  { service: 'FTPS',       port: 990   },
  { service: 'WinRM',      port: 5985  },
  { service: 'WinRM-TLS',  port: 5986  },
  { service: 'RADIUS',     port: 1812  },
  { service: 'RADIUS-A',   port: 1813  },
  { service: 'TACACS+',    port: 49    },
  { service: 'L2TP',       port: 1701  },
  { service: 'PPTP',       port: 1723  },
  { service: 'OpenVPN',    port: 1194  },
  { service: 'WireGuard',  port: 51820 },
  { service: 'Docker',     port: 2375  },
  { service: 'Docker-TLS', port: 2376  },
  { service: 'etcd',       port: 2379  },
  { service: 'K8s-API',    port: 6443  },
  { service: 'Prometheus', port: 9090  },
  { service: 'Grafana',    port: 3000  },
  { service: 'Alertmgr',  port: 9093  },
  { service: 'NodeExp',    port: 9100  },
  { service: 'HAProxy',    port: 8404  },
  { service: 'Consul',     port: 8500  },
  { service: 'Vault',      port: 8200  },
  { service: 'Nomad',      port: 4646  },
  { service: 'Jenkins',    port: 8080  },
  { service: 'Nexus',      port: 8081  },
  { service: 'SonarQube',  port: 9000  },
  { service: 'RabbitMQ',   port: 5672  },
  { service: 'AMQP-Mgmt',  port: 15672 },
  { service: 'Kafka',      port: 9092  },
  { service: 'Zookeeper',  port: 2181  },
  { service: 'Cassandra',  port: 9042  },
  { service: 'CouchDB',    port: 5984  },
  { service: 'InfluxDB',   port: 8086  },
  { service: 'Splunk',     port: 8089  },
  { service: 'Logstash',   port: 5044  },
  { service: 'NetBIOS-NS', port: 137   },
  { service: 'NetBIOS-DG', port: 138   },
  { service: 'NetBIOS-SS', port: 139   },
  { service: 'WINS',       port: 1512  },
  { service: 'Kerb-pwd',   port: 464   },
  { service: 'LDAP-GC',    port: 3268  },
  { service: 'LDAPS-GC',   port: 3269  },
  { service: 'MS-SQL',     port: 1433  },
  { service: 'MS-SQL-M',   port: 1434  },
  { service: 'Oracle',     port: 1521  },
  { service: 'MQTT',       port: 1883  },
  { service: 'MQTT-TLS',   port: 8883  },
  { service: 'XMPP',       port: 5222  },
  { service: 'SIP',        port: 5060  },
  { service: 'SIP-TLS',    port: 5061  },
  { service: 'RTSP',       port: 554   },
  { service: 'RTMP',       port: 1935  },
  { service: 'Modbus',     port: 502   },
  { service: 'DNP3',       port: 20000 },
  { service: 'BACnet',     port: 47808 },
  { service: 'DICOM',      port: 104   },
  { service: 'mDNS',       port: 5353  },
  { service: 'LLMNR',      port: 5355  },
  { service: 'HSRP',       port: 1985  },
];

// Count to pick per difficulty
const PM_PICK_COUNT = {
  easy:   10,
  medium: 16,
  hard:   22
};

// Pool reference per difficulty
const PM_POOL = {
  easy:   PORT_POOL_EASY,
  medium: PORT_POOL_MEDIUM,
  hard:   PORT_POOL_HARD
};

// Countdown timers (seconds) per difficulty
const PM_TIMERS = {
  easy:   120,
  medium:  90,
  hard:    60
};

// Game state
let pmState = {
  difficulty: null,
  pairs: [],
  selectedService: null,
  selectedPort: null,
  matched: [],
  errors: 0,
  startTime: null,
  timerInterval: null,
  timerLimit: null,
  finished: false
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Difficulty buttons
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.dataset.difficulty;
      startGame(diff);
    });
  });

  document.addEventListener('langChange', () => {
    if (pmState.difficulty) {
      updateHUDLabels();
    }
  });
});

/**
 * Pick N random entries from a pool using Fisher-Yates partial shuffle.
 * @param {Array} pool
 * @param {number} n
 * @returns {Array} n unique entries
 */
function pickRandom(pool, n) {
  const arr = [...pool];
  const count = Math.min(n, arr.length);
  for (let i = arr.length - 1; i > arr.length - 1 - count; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(arr.length - count);
}

/**
 * Start the game with the selected difficulty.
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 */
function startGame(difficulty) {
  // Pick a random subset from the pool each game
  const pairs = pickRandom(PM_POOL[difficulty], PM_PICK_COUNT[difficulty]);
  const shuffledPorts = shuffleArray(pairs.map(p => p.port));

  pmState = {
    difficulty,
    pairs,
    portOrder: shuffledPorts,
    selectedService: null,
    selectedPort: null,
    matched: [],
    errors: 0,
    startTime: Date.now(),
    timerInterval: null,
    timerLimit: PM_TIMERS[difficulty],
    finished: false
  };

  // Hide difficulty selector, show game area
  document.getElementById('difficulty-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.getElementById('result-screen').style.display = 'none';

  renderBoard();
  startTimer();
}

// ============================================================
// RENDER
// ============================================================

function renderBoard() {
  const servicesCol = document.getElementById('services-col');
  const portsCol = document.getElementById('ports-col');

  servicesCol.innerHTML = '';
  portsCol.innerHTML = '';

  // Services column (in original order)
  pmState.pairs.forEach(pair => {
    const btn = document.createElement('button');
    btn.className = 'port-item';
    btn.dataset.service = pair.service;
    btn.textContent = pair.service;
    btn.setAttribute('aria-pressed', 'false');

    if (pmState.matched.includes(pair.service)) {
      btn.classList.add('matched');
      btn.disabled = true;
      btn.setAttribute('aria-pressed', 'true');
    }

    btn.addEventListener('click', () => onServiceClick(pair.service, btn));
    servicesCol.appendChild(btn);
  });

  // Ports column (shuffled)
  pmState.portOrder.forEach(port => {
    const service = pmState.pairs.find(p => p.port === port).service;
    if (pmState.matched.includes(service)) return; // skip matched ports

    const btn = document.createElement('button');
    btn.className = 'port-item';
    btn.dataset.port = port;
    btn.textContent = port;

    btn.addEventListener('click', () => onPortClick(port, btn));
    portsCol.appendChild(btn);
  });

  updateHUDLabels();
}

function updateHUDLabels() {
  const errEl = document.getElementById('hud-errors');
  if (errEl) errEl.textContent = pmState.errors;
}

// ============================================================
// INTERACTION
// ============================================================

function onServiceClick(service, btn) {
  if (pmState.finished) return;
  if (pmState.matched.includes(service)) return;

  // Deselect previous service
  document.querySelectorAll('#services-col .port-item.selected').forEach(el => {
    el.classList.remove('selected');
    el.setAttribute('aria-pressed', 'false');
  });

  pmState.selectedService = service;
  btn.classList.add('selected');
  btn.setAttribute('aria-pressed', 'true');

  // If a port was already selected, try to match
  if (pmState.selectedPort !== null) {
    attemptMatch();
  }
}

function onPortClick(port, btn) {
  if (pmState.finished) return;

  // Deselect previous port
  document.querySelectorAll('#ports-col .port-item.selected').forEach(el => {
    el.classList.remove('selected');
  });

  pmState.selectedPort = port;
  btn.classList.add('selected');

  // If a service was already selected, try to match
  if (pmState.selectedService !== null) {
    attemptMatch();
  }
}

function attemptMatch() {
  const service = pmState.selectedService;
  const port = pmState.selectedPort;

  const correctPair = pmState.pairs.find(p => p.service === service);
  const isCorrect = correctPair && correctPair.port === port;

  const serviceBtn = document.querySelector(`[data-service="${service}"]`);
  const portBtn = document.querySelector(`[data-port="${port}"]`);

  if (isCorrect) {
    // Mark as matched
    pmState.matched.push(service);
    if (serviceBtn) {
      serviceBtn.classList.remove('selected');
      serviceBtn.classList.add('matched');
      serviceBtn.disabled = true;
    }
    if (portBtn) {
      portBtn.classList.remove('selected');
      portBtn.classList.add('matched');
      portBtn.disabled = true;
    }

    // Check if all matched
    if (pmState.matched.length === pmState.pairs.length) {
      endGame(true);
    }
  } else {
    // Wrong match — flash red
    pmState.errors++;
    updateHUDLabels();

    if (serviceBtn) {
      serviceBtn.classList.add('error');
      setTimeout(() => serviceBtn.classList.remove('error'), 500);
    }
    if (portBtn) {
      portBtn.classList.add('error');
      setTimeout(() => {
        portBtn.classList.remove('error');
        portBtn.classList.remove('selected');
      }, 500);
    }
    // Deselect port but keep service selected for retry
    pmState.selectedPort = null;
    return;
  }

  pmState.selectedService = null;
  pmState.selectedPort = null;
}

// ============================================================
// TIMER — countdown mode
// ============================================================

function startTimer() {
  const timerEl = document.getElementById('hud-timer');

  pmState.timerInterval = setInterval(() => {
    if (!pmState.startTime || pmState.finished) return;
    const elapsed = Math.floor((Date.now() - pmState.startTime) / 1000);
    const remaining = pmState.timerLimit - elapsed;

    if (timerEl) {
      timerEl.textContent = remaining > 0 ? formatTime(remaining) : '00:00';
    }

    if (remaining <= 0) {
      endGame(false);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(pmState.timerInterval);
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
  pmState.finished = true;
  stopTimer();

  const elapsed = Math.floor((Date.now() - pmState.startTime) / 1000);
  const rawScore = 1000 - (elapsed * 10) - (pmState.errors * 50);
  const finalScore = Math.max(0, rawScore);

  // Show result screen
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  document.getElementById('result-title').textContent = win
    ? i18n.t('victory')
    : i18n.t('game_over');
  document.getElementById('result-title').className = win
    ? 'game-result__title game-result__title--win'
    : 'game-result__title game-result__title--lose';
  document.getElementById('result-score').textContent = String(finalScore).padStart(6, '0');

  // Save score button
  const saveBtn = document.getElementById('save-score-btn');
  saveBtn.onclick = () => {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('score-entry-screen').style.display = 'block';

    scoreEntry.render(
      document.getElementById('score-entry-container'),
      (initials) => {
        scores.saveScore(initials, 'port-match', pmState.difficulty, finalScore);
        document.getElementById('score-entry-screen').style.display = 'none';
        document.getElementById('post-save-screen').style.display = 'block';

        // Check and show newly unlocked rewards
        const newPins = checkRewards();
        showRewardNotifications(newPins, { isGamePage: true });

        // Capture ticket button
        document.getElementById('capture-btn').onclick = () => {
          ticket.generate({
            initials,
            game: i18n.t('game_port_match'),
            difficulty: pmState.difficulty,
            score: finalScore,
            topScore: 1000
          });
        };
      }
    );
  };

  // Play again button
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
