/**
 * main.js — Entry point for the homepage (index.html).
 * Renders the Hall of Fame scores table and the Hall of Pins.
 * Language toggle and i18n are handled by i18n.js.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderHallOfFame();
  renderHallOfPins(document.getElementById('hall-of-pins-grid'));

  // Re-render when language changes
  document.addEventListener('langChange', () => {
    renderHallOfFame();
    renderHallOfPins(document.getElementById('hall-of-pins-grid'));
  });
});

/**
 * Render the Hall of Fame table with top 10 scores from all games.
 */
function renderHallOfFame() {
  const container = document.getElementById('hall-of-fame-table');
  if (!container) return;

  const topScores = scores.getTopScores(null, 10);
  scoresTable.render(container, topScores, i18n.getLang());
}
