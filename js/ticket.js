/**
 * ticket.js — Score ticket generator
 * Draws a retro arcade-style receipt on a Canvas (600x400px)
 * and offers it as a downloadable PNG.
 *
 * Requires: i18n.js loaded before this script.
 */

const ticket = {
  /**
   * Generate and download a PNG ticket.
   * @param {Object} params
   * @param {string} params.initials   - 3-letter player name
   * @param {string} params.game       - game display name
   * @param {string} params.difficulty - 'easy' | 'medium' | 'hard'
   * @param {number} params.score      - numeric score
   * @param {number} params.topScore   - best possible score for this game/diff (optional)
   */
  generate({ initials, game, difficulty, score, topScore }) {
    const W = 600;
    const H = 400;

    // Create or reuse a hidden canvas
    let canvas = document.getElementById('ticket-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'ticket-canvas';
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
    }
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');

    // --------------------------------------------------------
    // Background
    // --------------------------------------------------------
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Scanlines
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, y, W, 2);
    }

    // --------------------------------------------------------
    // Dashed ticket border
    // --------------------------------------------------------
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.setLineDash([]);

    // Inner glow border (cyan)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.shadowBlur = 0;

    // --------------------------------------------------------
    // Title: THE ARCADE BORNE
    // --------------------------------------------------------
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 16;
    ctx.textAlign = 'center';
    ctx.fillText('THE ARCADE BORNE', W / 2, 65);
    ctx.shadowBlur = 0;

    // Decorative line under title
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(60, 78);
    ctx.lineTo(W - 60, 78);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --------------------------------------------------------
    // Mini pixel arcade cabinet SVG (drawn with canvas primitives)
    // --------------------------------------------------------
    this._drawPixelCabinet(ctx, W / 2, 120);

    // --------------------------------------------------------
    // Stars decoration
    // --------------------------------------------------------
    this._drawPixelStars(ctx);

    // --------------------------------------------------------
    // Coin decorations
    // --------------------------------------------------------
    this._drawPixelCoin(ctx, 60, 115, 10);
    this._drawPixelCoin(ctx, W - 60, 115, 10);

    // --------------------------------------------------------
    // Congratulations message
    // --------------------------------------------------------
    const isHighScore = topScore && score >= topScore * 0.8;
    const msg = isHighScore
      ? i18n.t('ticket_congratulations')
      : i18n.t('ticket_well_played');

    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 14;
    ctx.textAlign = 'center';
    ctx.fillText(msg, W / 2, 185);
    ctx.shadowBlur = 0;

    // --------------------------------------------------------
    // Score details
    // --------------------------------------------------------
    const diffLabel = i18n.t(difficulty);
    const gameLabel = game.toUpperCase();
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const details = [
      { label: i18n.t('initials'), value: initials.toUpperCase(), color: '#00ffff' },
      { label: i18n.t('game'),     value: gameLabel,              color: '#ff00ff' },
      { label: i18n.t('difficulty'), value: diffLabel,            color: '#ffff00' },
      { label: i18n.t('score'),    value: String(score).padStart(6, '0'), color: '#00ff00' },
      { label: i18n.t('date'),     value: dateStr,                color: '#ffffff' },
    ];

    const startY = 215;
    const rowH = 30;

    details.forEach((item, idx) => {
      const y = startY + idx * rowH;
      const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0)';
      ctx.fillStyle = rowBg;
      ctx.fillRect(50, y - 16, W - 100, rowH - 4);

      // Label
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#555555';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, 60, y);

      // Value
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'right';
      ctx.fillText(item.value, W - 60, y);
      ctx.shadowBlur = 0;
    });

    // --------------------------------------------------------
    // Divider
    // --------------------------------------------------------
    const divY = startY + details.length * rowH + 4;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, divY);
    ctx.lineTo(W - 50, divY);
    ctx.stroke();
    ctx.setLineDash([]);

    // --------------------------------------------------------
    // Footer
    // --------------------------------------------------------
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#555555';
    ctx.textAlign = 'center';
    ctx.fillText(i18n.t('ticket_footer'), W / 2, H - 28);

    // Pixel dots at bottom corners
    this._drawPixelCoin(ctx, 50, H - 40, 6);
    this._drawPixelCoin(ctx, W - 50, H - 40, 6);

    // --------------------------------------------------------
    // Download
    // --------------------------------------------------------
    const link = document.createElement('a');
    link.download = `arcade-score-${initials.toLowerCase()}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  },

  /**
   * Draw a minimal pixel-art arcade cabinet.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx - center x
   * @param {number} cy - center y
   */
  _drawPixelCabinet(ctx, cx, cy) {
    const s = 2; // pixel size multiplier
    // Cabinet body (magenta outline)
    ctx.fillStyle = '#1a0a1a';
    ctx.fillRect(cx - 14 * s, cy - 18 * s, 28 * s, 34 * s);
    ctx.strokeStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = s;
    ctx.strokeRect(cx - 14 * s, cy - 18 * s, 28 * s, 34 * s);
    ctx.shadowBlur = 0;

    // Screen (cyan)
    ctx.fillStyle = '#001a1a';
    ctx.fillRect(cx - 9 * s, cy - 14 * s, 18 * s, 12 * s);
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 9 * s, cy - 14 * s, 18 * s, 12 * s);
    ctx.shadowBlur = 0;

    // Screen glow content (tiny pixels)
    ctx.fillStyle = '#00ffff';
    const glowPixels = [
      [-6, -12], [-4, -12], [-2, -12], [0, -12], [2, -12],
      [-6, -10], [2, -10],
      [-4, -8], [0, -8],
    ];
    glowPixels.forEach(([dx, dy]) => {
      ctx.fillRect(cx + dx * s, cy + dy * s, s, s);
    });

    // Joystick
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx - 6 * s, cy + 4 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Buttons
    const btnColors = ['#00ff00', '#ff00ff', '#ffff00'];
    btnColors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(cx + (3 + i * 4) * s, cy + 4 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Coin slot
    ctx.fillStyle = '#555555';
    ctx.fillRect(cx - 4 * s, cy + 10 * s, 8 * s, s);
  },

  /**
   * Draw small decorative pixel stars.
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawPixelStars(ctx) {
    const positions = [
      [80, 80], [520, 80], [40, 200], [560, 200],
      [100, 350], [500, 350], [30, 320], [570, 130]
    ];
    positions.forEach(([x, y], i) => {
      const size = i % 2 === 0 ? 3 : 2;
      const color = i % 3 === 0 ? '#ffff00' : i % 3 === 1 ? '#ff00ff' : '#00ffff';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      // Plus-sign star shape
      ctx.fillRect(x, y - size, size, size * 3);
      ctx.fillRect(x - size, y, size * 3, size);
      ctx.shadowBlur = 0;
    });
  },

  /**
   * Draw a pixel art coin.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} r - radius
   */
  _drawPixelCoin(ctx, x, y, r) {
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 8;
    // Approximate circle with rectangles for pixel look
    const d = Math.floor(r * 0.7);
    ctx.fillRect(x - d, y - r, d * 2, r * 2);
    ctx.fillRect(x - r, y - d, r * 2, d * 2);
    ctx.shadowBlur = 0;
    // Inner detail
    ctx.fillStyle = '#aa8800';
    ctx.fillRect(x - Math.floor(d * 0.5), y - Math.floor(r * 0.5),
                 Math.floor(d), Math.floor(r));
  }
};
