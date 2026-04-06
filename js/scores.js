/**
 * scores.js — Score management module
 * Handles saving, retrieving and displaying scores from localStorage.
 * Score format: { initials, game, difficulty, score, date }
 */

const SCORES_KEY = 'arcade_scores';
const MAX_SCORES_TOTAL = 100;

const scores = {
  /**
   * Read all scores from localStorage.
   * @returns {Array<{initials: string, game: string, difficulty: string, score: number, date: string}>}
   */
  _read() {
    try {
      const raw = localStorage.getItem(SCORES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_e) {
      return [];
    }
  },

  /**
   * Write scores array back to localStorage.
   * @param {Array} data
   */
  _write(data) {
    localStorage.setItem(SCORES_KEY, JSON.stringify(data));
  },

  /**
   * Save a new score entry.
   * @param {string} initials - 3-letter player name
   * @param {string} game     - game identifier (e.g. 'port-match')
   * @param {string} difficulty - 'easy' | 'medium' | 'hard'
   * @param {number} score    - numeric score
   */
  saveScore(initials, game, difficulty, score) {
    const all = this._read();
    const entry = {
      initials: String(initials).toUpperCase().slice(0, 3),
      game,
      difficulty,
      score: Math.max(0, Math.floor(score)),
      date: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })
    };
    all.push(entry);
    // Keep only the highest MAX_SCORES_TOTAL entries to avoid unbounded growth
    all.sort((a, b) => b.score - a.score);
    this._write(all.slice(0, MAX_SCORES_TOTAL));
    return entry;
  },

  /**
   * Get top scores for a specific game.
   * @param {string} game  - game identifier, or null for all games
   * @param {number} limit - max number of entries to return
   * @returns {Array}
   */
  getTopScores(game, limit) {
    const all = this._read();
    const filtered = game ? all.filter(e => e.game === game) : all;
    filtered.sort((a, b) => b.score - a.score);
    return limit ? filtered.slice(0, limit) : filtered;
  },

  /**
   * Get all scores sorted by descending score.
   * @returns {Array}
   */
  getAllScores() {
    const all = this._read();
    return all.sort((a, b) => b.score - a.score);
  },

  /**
   * Clear all scores (utility — not exposed in UI).
   */
  clearAll() {
    this._write([]);
  }
};

// ============================================================
// SCORE ENTRY UI — 3-letter initials input, arcade style
// ============================================================

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const scoreEntry = {
  /**
   * Render the score entry widget into a container element.
   * Calls onConfirm(initials) when the player confirms.
   *
   * @param {HTMLElement} container
   * @param {Function} onConfirm - callback(initials: string)
   */
  render(container, onConfirm) {
    const letters = ['A', 'A', 'A'];
    let activeSlot = 0;

    const html = `
      <div class="score-entry" role="form" aria-label="${i18n.t('enter_initials')}">
        <p class="score-entry__title" data-i18n="enter_initials">${i18n.t('enter_initials')}</p>
        <div class="score-entry__letters" id="letter-slots" role="group">
          ${[0, 1, 2].map(i => `
            <div class="letter-slot ${i === 0 ? 'letter-slot__active' : ''}" data-slot="${i}">
              <button
                class="letter-slot__btn"
                data-dir="up"
                data-slot="${i}"
                aria-label="Lettre ${i + 1} vers le haut"
              >&#9650;</button>
              <span class="letter-slot__char" id="letter-char-${i}">${letters[i]}</span>
              <button
                class="letter-slot__btn"
                data-dir="down"
                data-slot="${i}"
                aria-label="Lettre ${i + 1} vers le bas"
              >&#9660;</button>
            </div>
          `).join('')}
        </div>
        <p class="text-grey mt-sm" style="font-size:0.35rem;" data-i18n="enter_hint">${i18n.t('enter_hint')}</p>
        <div class="mt-md">
          <button class="btn btn--primary" id="score-confirm-btn" data-i18n="enter_confirm">${i18n.t('enter_confirm')}</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Sync active slot highlight
    const syncSlots = () => {
      container.querySelectorAll('.letter-slot').forEach((el, idx) => {
        el.classList.toggle('letter-slot__active', idx === activeSlot);
      });
    };

    // Change a letter in a slot
    const changeLetter = (slot, dir) => {
      const idx = ALPHABET.indexOf(letters[slot]);
      if (dir === 'up') {
        letters[slot] = ALPHABET[(idx - 1 + 26) % 26];
      } else {
        letters[slot] = ALPHABET[(idx + 1) % 26];
      }
      container.querySelector(`#letter-char-${slot}`).textContent = letters[slot];
    };

    // Button clicks (up / down arrows on each slot)
    container.querySelectorAll('.letter-slot__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot, 10);
        const dir = btn.dataset.dir;
        activeSlot = slot;
        syncSlots();
        changeLetter(slot, dir);
      });
    });

    // Click on a slot to make it active
    container.querySelectorAll('.letter-slot').forEach(el => {
      el.addEventListener('click', e => {
        // Avoid double-triggering with the inner buttons
        if (e.target.classList.contains('letter-slot__btn')) return;
        activeSlot = parseInt(el.dataset.slot, 10);
        syncSlots();
      });
    });

    // Keyboard navigation
    const onKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          changeLetter(activeSlot, 'up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeLetter(activeSlot, 'down');
          break;
        case 'ArrowRight':
        case 'Tab':
          if (e.key === 'Tab') e.preventDefault();
          activeSlot = (activeSlot + 1) % 3;
          syncSlots();
          break;
        case 'ArrowLeft':
          activeSlot = (activeSlot - 1 + 3) % 3;
          syncSlots();
          break;
        case 'Enter':
          container.querySelector('#score-confirm-btn').click();
          break;
        default:
          // Direct letter input
          if (/^[a-zA-Z]$/.test(e.key)) {
            letters[activeSlot] = e.key.toUpperCase();
            container.querySelector(`#letter-char-${activeSlot}`).textContent = letters[activeSlot];
            activeSlot = Math.min(activeSlot + 1, 2);
            syncSlots();
          }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    // Confirm button
    container.querySelector('#score-confirm-btn').addEventListener('click', () => {
      document.removeEventListener('keydown', onKeyDown);
      onConfirm(letters.join(''));
    });
  }
};

// ============================================================
// SCORES TABLE RENDERER
// ============================================================

const scoresTable = {
  /**
   * Render a scores table into a container.
   * @param {HTMLElement} container
   * @param {Array}       data     - array of score objects
   * @param {string}      lang     - current language
   */
  render(container, data, lang) {
    if (!data || data.length === 0) {
      container.innerHTML = `
        <p class="no-scores">${i18n.t('no_scores').replace('\\n', '<br>')}</p>
      `;
      return;
    }

    const gameLabels = {
      'port-match':       i18n.t('game_port_match'),
      'osi-puzzle':       i18n.t('game_osi_puzzle'),
      'protocol-quiz':    i18n.t('game_protocol_quiz'),
      'subnet-challenge': i18n.t('game_subnet_challenge'),
      'cable-chaos':      i18n.t('game_cable_chaos'),
      'firewall-blitz':   i18n.t('game_firewall_blitz'),
      'dns-chain':        i18n.t('game_dns_chain'),
      'packet-tracer':    i18n.t('game_packet_tracer'),
      'vlan-master':      i18n.t('game_vlan_master'),
    };

    const diffBadge = (diff) => {
      const label = i18n.t(diff);
      return `<span class="badge badge--${diff}">${label}</span>`;
    };

    const rows = data.map((entry, idx) => `
      <tr>
        <td class="score-rank">${String(idx + 1).padStart(2, '0')}</td>
        <td class="score-initials">${entry.initials}</td>
        <td>${gameLabels[entry.game] || entry.game}</td>
        <td>${diffBadge(entry.difficulty)}</td>
        <td class="text-yellow">${String(entry.score).padStart(6, '0')}</td>
        <td class="text-grey">${entry.date}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <table class="scores-table" role="table" aria-label="${i18n.t('hall_of_fame')}">
        <thead>
          <tr>
            <th scope="col">${i18n.t('rank')}</th>
            <th scope="col">${i18n.t('initials')}</th>
            <th scope="col">${i18n.t('game')}</th>
            <th scope="col">${i18n.t('difficulty')}</th>
            <th scope="col">${i18n.t('score')}</th>
            <th scope="col">${i18n.t('date')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
};
