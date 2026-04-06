/**
 * htp.js — How To Play collapsible toggle
 *
 * Handles the expand/collapse behaviour of the #htp-box block
 * present on game difficulty selection screens.
 * Used by: port-match, protocol-quiz, subnet-challenge.
 * (osi-puzzle manages its own toggle inline.)
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('htp-toggle');
  const content = document.getElementById('htp-content');
  const arrow = document.getElementById('htp-arrow');

  if (!toggle || !content) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    content.style.display = expanded ? 'none' : 'block';
    if (arrow) {
      arrow.innerHTML = expanded ? '&#x25BA;' : '&#x25BC;';
    }
  });
});
