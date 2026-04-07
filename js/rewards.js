/**
 * rewards.js — Rewards / Pins system
 * Checks unlock conditions against arcade_scores in localStorage.
 * Stores unlocked rewards in localStorage (arcade_rewards).
 * Provides SVG pixel art for each pin and a downloadable PNG ticket.
 *
 * Dependencies: none (standalone, loaded before game scripts).
 * Key conventions:
 *   - Game IDs match scores.js: 'port-match', 'osi-puzzle', 'protocol-quiz', 'subnet-challenge'
 *   - Difficulty values: 'easy' | 'medium' | 'hard'
 */

const REWARDS_KEY = 'arcade_rewards';

// ============================================================
// SVG PIXEL ART
// Each SVG uses viewBox="0 0 32 32", shapes are <rect> blocks.
// Colors per tier:
//   iron    : #9E9E9E / #BDBDBD
//   bronze  : #CD7F32 / #E8A050
//   silver  : #C0C0C0 / #E8E8E8
//   gold    : #FFD700 / #FFF176
//   platinum: #E040FB / #00FFFF  (animated glow)
// ============================================================

const SVG_DEFS = {

  // ── CATS ──────────────────────────────────────────────────────

  iron_cat: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- ears -->
  <rect x="6" y="4" width="4" height="5" fill="${c1}"/>
  <rect x="7" y="5" width="2" height="3" fill="${c2}"/>
  <rect x="22" y="4" width="4" height="5" fill="${c1}"/>
  <rect x="23" y="5" width="2" height="3" fill="${c2}"/>
  <!-- head -->
  <rect x="8" y="8" width="16" height="12" fill="${c1}"/>
  <!-- eyes -->
  <rect x="10" y="11" width="3" height="3" fill="#1a1a1a"/>
  <rect x="19" y="11" width="3" height="3" fill="#1a1a1a"/>
  <rect x="11" y="12" width="1" height="1" fill="${c2}"/>
  <rect x="20" y="12" width="1" height="1" fill="${c2}"/>
  <!-- nose -->
  <rect x="15" y="15" width="2" height="1" fill="#ff9999"/>
  <!-- mouth -->
  <rect x="14" y="16" width="1" height="1" fill="${c1}"/>
  <rect x="17" y="16" width="1" height="1" fill="${c1}"/>
  <!-- whiskers -->
  <rect x="5" y="14" width="5" height="1" fill="${c2}"/>
  <rect x="22" y="14" width="5" height="1" fill="${c2}"/>
  <rect x="5" y="16" width="4" height="1" fill="${c2}"/>
  <rect x="23" y="16" width="4" height="1" fill="${c2}"/>
  <!-- body -->
  <rect x="9" y="20" width="14" height="8" fill="${c1}"/>
  <!-- paws -->
  <rect x="7" y="26" width="4" height="3" fill="${c1}"/>
  <rect x="21" y="26" width="4" height="3" fill="${c1}"/>
  <!-- tail -->
  <rect x="24" y="18" width="3" height="10" fill="${c1}"/>
  <rect x="25" y="27" width="4" height="3" fill="${c1}"/>
  <!-- belly highlight -->
  <rect x="12" y="21" width="8" height="5" fill="${c2}"/>
</svg>`,

  // ── OCTOPUSES ─────────────────────────────────────────────────

  iron_octopus: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- head / mantle -->
  <rect x="8" y="4" width="16" height="14" fill="${c1}"/>
  <!-- top dome -->
  <rect x="10" y="2" width="12" height="4" fill="${c1}"/>
  <!-- eyes -->
  <rect x="10" y="8" width="4" height="4" fill="${c2}"/>
  <rect x="18" y="8" width="4" height="4" fill="${c2}"/>
  <rect x="11" y="9" width="2" height="2" fill="#1a1a1a"/>
  <rect x="19" y="9" width="2" height="2" fill="#1a1a1a"/>
  <!-- mouth -->
  <rect x="14" y="14" width="4" height="2" fill="${c2}"/>
  <!-- body base -->
  <rect x="8" y="17" width="16" height="4" fill="${c1}"/>
  <!-- tentacles (8 = 4 visible in pixel art) -->
  <rect x="5"  y="20" width="3" height="10" fill="${c1}"/>
  <rect x="4"  y="27" width="4" height="3"  fill="${c1}"/>
  <rect x="9"  y="21" width="3" height="9"  fill="${c1}"/>
  <rect x="8"  y="28" width="4" height="3"  fill="${c1}"/>
  <rect x="20" y="21" width="3" height="9"  fill="${c1}"/>
  <rect x="20" y="28" width="4" height="3"  fill="${c1}"/>
  <rect x="24" y="20" width="3" height="10" fill="${c1}"/>
  <rect x="24" y="27" width="4" height="3"  fill="${c1}"/>
  <!-- suckers hint -->
  <rect x="6"  y="22" width="1" height="1" fill="${c2}"/>
  <rect x="10" y="23" width="1" height="1" fill="${c2}"/>
  <rect x="21" y="23" width="1" height="1" fill="${c2}"/>
  <rect x="25" y="22" width="1" height="1" fill="${c2}"/>
</svg>`,

  // ── SNAKES ────────────────────────────────────────────────────

  iron_snake: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- body coils -->
  <rect x="4"  y="20" width="24" height="4" fill="${c1}"/>
  <rect x="4"  y="14" width="16" height="4" fill="${c1}"/>
  <rect x="16" y="8"  width="12" height="4" fill="${c1}"/>
  <!-- head -->
  <rect x="22" y="4"  width="8"  height="6" fill="${c1}"/>
  <!-- eye -->
  <rect x="27" y="5"  width="2"  height="2" fill="#1a1a1a"/>
  <rect x="28" y="5"  width="1"  height="1" fill="${c2}"/>
  <!-- tongue -->
  <rect x="30" y="7"  width="2"  height="1" fill="#ff4444"/>
  <rect x="31" y="6"  width="1"  height="1" fill="#ff4444"/>
  <rect x="31" y="8"  width="1"  height="1" fill="#ff4444"/>
  <!-- tail -->
  <rect x="4"  y="22" width="2"  height="4" fill="${c1}"/>
  <rect x="4"  y="26" width="3"  height="2" fill="${c1}"/>
  <!-- scale highlights -->
  <rect x="8"  y="21" width="2"  height="2" fill="${c2}"/>
  <rect x="14" y="21" width="2"  height="2" fill="${c2}"/>
  <rect x="20" y="21" width="2"  height="2" fill="${c2}"/>
  <rect x="8"  y="15" width="2"  height="2" fill="${c2}"/>
  <rect x="14" y="15" width="2"  height="2" fill="${c2}"/>
  <rect x="20" y="9"  width="2"  height="2" fill="${c2}"/>
  <rect x="26" y="9"  width="2"  height="2" fill="${c2}"/>
</svg>`,

  // ── DRAGONS (Firewall Blitz) ──────────────────────────────

  iron_dragon: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- wings -->
  <rect x="0"  y="8"  width="8"  height="12" fill="${c1}"/>
  <rect x="1"  y="7"  width="6"  height="2"  fill="${c1}"/>
  <rect x="24" y="8"  width="8"  height="12" fill="${c1}"/>
  <rect x="25" y="7"  width="6"  height="2"  fill="${c1}"/>
  <!-- wing membrane highlights -->
  <rect x="2"  y="10" width="4"  height="8"  fill="${c2}"/>
  <rect x="26" y="10" width="4"  height="8"  fill="${c2}"/>
  <!-- body -->
  <rect x="9"  y="10" width="14" height="14" fill="${c1}"/>
  <!-- neck -->
  <rect x="12" y="5"  width="8"  height="7"  fill="${c1}"/>
  <!-- head -->
  <rect x="10" y="2"  width="12" height="6"  fill="${c1}"/>
  <!-- snout -->
  <rect x="8"  y="4"  width="4"  height="4"  fill="${c1}"/>
  <rect x="20" y="4"  width="4"  height="4"  fill="${c1}"/>
  <!-- eyes (slit pupils) -->
  <rect x="11" y="3"  width="3"  height="3"  fill="#ffff00"/>
  <rect x="18" y="3"  width="3"  height="3"  fill="#ffff00"/>
  <rect x="12" y="3"  width="1"  height="3"  fill="#1a1a1a"/>
  <rect x="19" y="3"  width="1"  height="3"  fill="#1a1a1a"/>
  <!-- horns -->
  <rect x="11" y="0"  width="3"  height="3"  fill="${c1}"/>
  <rect x="10" y="0"  width="2"  height="2"  fill="${c1}"/>
  <rect x="18" y="0"  width="3"  height="3"  fill="${c1}"/>
  <rect x="20" y="0"  width="2"  height="2"  fill="${c1}"/>
  <!-- fire breath -->
  <rect x="4"  y="5"  width="4"  height="2"  fill="#ff6600"/>
  <rect x="2"  y="4"  width="3"  height="2"  fill="#ffaa00"/>
  <rect x="0"  y="3"  width="3"  height="2"  fill="#ffff00"/>
  <!-- belly scales -->
  <rect x="11" y="13" width="10" height="9"  fill="${c2}"/>
  <!-- tail -->
  <rect x="14" y="24" width="4"  height="4"  fill="${c1}"/>
  <rect x="15" y="28" width="3"  height="3"  fill="${c1}"/>
  <rect x="16" y="30" width="2"  height="2"  fill="${c1}"/>
  <!-- claws -->
  <rect x="9"  y="24" width="3"  height="3"  fill="${c1}"/>
  <rect x="8"  y="26" width="2"  height="2"  fill="${c2}"/>
  <rect x="20" y="24" width="3"  height="3"  fill="${c1}"/>
  <rect x="22" y="26" width="2"  height="2"  fill="${c2}"/>
</svg>`,

  // ── CROWS (DNS Chain) ─────────────────────────────────────

  iron_crow: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- tail feathers -->
  <rect x="12" y="26" width="8"  height="5"  fill="${c1}"/>
  <rect x="10" y="27" width="3"  height="4"  fill="${c1}"/>
  <rect x="19" y="27" width="3"  height="4"  fill="${c1}"/>
  <!-- body -->
  <rect x="8"  y="14" width="16" height="14" fill="${c1}"/>
  <!-- wings spread -->
  <rect x="1"  y="12" width="9"  height="8"  fill="${c1}"/>
  <rect x="22" y="12" width="9"  height="8"  fill="${c1}"/>
  <!-- wing tips -->
  <rect x="0"  y="14" width="3"  height="5"  fill="${c1}"/>
  <rect x="29" y="14" width="3"  height="5"  fill="${c1}"/>
  <!-- wing highlights -->
  <rect x="2"  y="13" width="6"  height="5"  fill="${c2}"/>
  <rect x="24" y="13" width="6"  height="5"  fill="${c2}"/>
  <!-- neck + head -->
  <rect x="11" y="8"  width="10" height="8"  fill="${c1}"/>
  <rect x="10" y="6"  width="12" height="5"  fill="${c1}"/>
  <!-- beak (sharp) -->
  <rect x="6"  y="8"  width="6"  height="3"  fill="${c1}"/>
  <rect x="4"  y="9"  width="4"  height="2"  fill="${c1}"/>
  <!-- eye -->
  <rect x="13" y="7"  width="3"  height="3"  fill="#1a1a1a"/>
  <rect x="14" y="7"  width="1"  height="1"  fill="${c2}"/>
  <!-- iridescent sheen on wing -->
  <rect x="3"  y="15" width="2"  height="2"  fill="#6644ff"/>
  <rect x="27" y="15" width="2"  height="2"  fill="#6644ff"/>
  <!-- feet / talons -->
  <rect x="11" y="28" width="3"  height="3"  fill="${c1}"/>
  <rect x="9"  y="30" width="2"  height="2"  fill="${c1}"/>
  <rect x="18" y="28" width="3"  height="3"  fill="${c1}"/>
  <rect x="21" y="30" width="2"  height="2"  fill="${c1}"/>
</svg>`,

  // ── WOLVES (Packet Tracer) ────────────────────────────────

  iron_wolf: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- ears (pointed) -->
  <rect x="5"  y="2"  width="5"  height="7"  fill="${c1}"/>
  <rect x="6"  y="3"  width="3"  height="5"  fill="${c2}"/>
  <rect x="22" y="2"  width="5"  height="7"  fill="${c1}"/>
  <rect x="23" y="3"  width="3"  height="5"  fill="${c2}"/>
  <!-- head -->
  <rect x="7"  y="7"  width="18" height="13" fill="${c1}"/>
  <!-- muzzle (elongated) -->
  <rect x="9"  y="15" width="14" height="6"  fill="${c2}"/>
  <rect x="7"  y="13" width="4"  height="5"  fill="${c2}"/>
  <rect x="21" y="13" width="4"  height="5"  fill="${c2}"/>
  <!-- eyes (amber) -->
  <rect x="9"  y="10" width="4"  height="4"  fill="#ffaa00"/>
  <rect x="19" y="10" width="4"  height="4"  fill="#ffaa00"/>
  <rect x="10" y="11" width="2"  height="2"  fill="#1a1a1a"/>
  <rect x="20" y="11" width="2"  height="2"  fill="#1a1a1a"/>
  <rect x="10" y="11" width="1"  height="1"  fill="${c2}"/>
  <rect x="20" y="11" width="1"  height="1"  fill="${c2}"/>
  <!-- nose (black) -->
  <rect x="14" y="15" width="4"  height="3"  fill="#1a1a1a"/>
  <!-- body -->
  <rect x="8"  y="20" width="16" height="9"  fill="${c1}"/>
  <!-- legs -->
  <rect x="8"  y="27" width="4"  height="5"  fill="${c1}"/>
  <rect x="13" y="27" width="4"  height="5"  fill="${c1}"/>
  <rect x="15" y="27" width="4"  height="5"  fill="${c1}"/>
  <rect x="20" y="27" width="4"  height="5"  fill="${c1}"/>
  <!-- tail (bushy, raised) -->
  <rect x="24" y="14" width="5"  height="10" fill="${c1}"/>
  <rect x="25" y="13" width="5"  height="3"  fill="${c1}"/>
  <rect x="26" y="11" width="4"  height="3"  fill="${c2}"/>
  <!-- fur texture -->
  <rect x="11" y="21" width="10" height="6"  fill="${c2}"/>
</svg>`,

  // ── FOXES ─────────────────────────────────────────────────────

  iron_fox: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- ears (pointed) -->
  <rect x="5"  y="3" width="6" height="7" fill="${c1}"/>
  <rect x="6"  y="4" width="4" height="5" fill="${c2}"/>
  <rect x="21" y="3" width="6" height="7" fill="${c1}"/>
  <rect x="22" y="4" width="4" height="5" fill="${c2}"/>
  <!-- head -->
  <rect x="7" y="8" width="18" height="12" fill="${c1}"/>
  <!-- muzzle (white/light area) -->
  <rect x="11" y="14" width="10" height="5" fill="${c2}"/>
  <!-- eyes -->
  <rect x="9"  y="11" width="3" height="3" fill="#1a1a1a"/>
  <rect x="20" y="11" width="3" height="3" fill="#1a1a1a"/>
  <rect x="10" y="12" width="1" height="1" fill="${c2}"/>
  <rect x="21" y="12" width="1" height="1" fill="${c2}"/>
  <!-- nose -->
  <rect x="15" y="15" width="2" height="2" fill="#1a1a1a"/>
  <!-- body -->
  <rect x="9" y="20" width="14" height="7" fill="${c1}"/>
  <!-- paws -->
  <rect x="8"  y="25" width="4" height="4" fill="${c1}"/>
  <rect x="20" y="25" width="4" height="4" fill="${c1}"/>
  <!-- tail (bushy) -->
  <rect x="25" y="16" width="5" height="12" fill="${c1}"/>
  <rect x="26" y="15" width="4" height="3"  fill="${c1}"/>
  <rect x="25" y="27" width="6" height="3"  fill="${c2}"/>
  <!-- tail tip white -->
  <rect x="26" y="28" width="4" height="2" fill="#ffffff"/>
</svg>`,

  // ── OWLS ──────────────────────────────────────────────────────

  iron_owl: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- ear tufts -->
  <rect x="8"  y="3" width="4" height="5" fill="${c1}"/>
  <rect x="20" y="3" width="4" height="5" fill="${c1}"/>
  <!-- head (round) -->
  <rect x="7" y="6" width="18" height="14" fill="${c1}"/>
  <!-- big eyes (owl characteristic) -->
  <rect x="8"  y="8" width="7" height="7" fill="${c2}"/>
  <rect x="17" y="8" width="7" height="7" fill="${c2}"/>
  <rect x="9"  y="9" width="5" height="5" fill="#1a1a1a"/>
  <rect x="18" y="9" width="5" height="5" fill="#1a1a1a"/>
  <rect x="10" y="10" width="2" height="2" fill="${c2}"/>
  <rect x="19" y="10" width="2" height="2" fill="${c2}"/>
  <!-- beak -->
  <rect x="14" y="14" width="4" height="3" fill="#ffb300"/>
  <rect x="15" y="15" width="2" height="2" fill="#e65100"/>
  <!-- facial disc -->
  <rect x="8" y="14" width="5" height="4" fill="${c2}"/>
  <rect x="19" y="14" width="5" height="4" fill="${c2}"/>
  <!-- body -->
  <rect x="8" y="20" width="16" height="9" fill="${c1}"/>
  <!-- wing pattern -->
  <rect x="6"  y="21" width="4" height="7" fill="${c1}"/>
  <rect x="22" y="21" width="4" height="7" fill="${c1}"/>
  <!-- belly spots -->
  <rect x="11" y="22" width="10" height="6" fill="${c2}"/>
  <!-- talons -->
  <rect x="9"  y="28" width="3" height="3" fill="#ffb300"/>
  <rect x="13" y="28" width="3" height="3" fill="#ffb300"/>
  <rect x="17" y="28" width="3" height="3" fill="#ffb300"/>
  <rect x="21" y="28" width="3" height="3" fill="#ffb300"/>
</svg>`,

  // ── DEER (VLAN Master) ────────────────────────────────────

  iron_deer: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- antlers left -->
  <rect x="4"  y="0"  width="2"  height="7"  fill="${c1}"/>
  <rect x="2"  y="2"  width="4"  height="2"  fill="${c1}"/>
  <rect x="1"  y="0"  width="2"  height="3"  fill="${c1}"/>
  <rect x="5"  y="0"  width="2"  height="3"  fill="${c1}"/>
  <!-- antlers right -->
  <rect x="26" y="0"  width="2"  height="7"  fill="${c1}"/>
  <rect x="26" y="2"  width="4"  height="2"  fill="${c1}"/>
  <rect x="27" y="0"  width="2"  height="3"  fill="${c1}"/>
  <rect x="29" y="0"  width="2"  height="3"  fill="${c1}"/>
  <!-- head -->
  <rect x="9"  y="5"  width="14" height="11" fill="${c1}"/>
  <!-- muzzle -->
  <rect x="11" y="13" width="10" height="5"  fill="${c2}"/>
  <!-- eyes -->
  <rect x="10" y="8"  width="3"  height="3"  fill="#1a1a1a"/>
  <rect x="19" y="8"  width="3"  height="3"  fill="#1a1a1a"/>
  <rect x="11" y="9"  width="1"  height="1"  fill="${c2}"/>
  <rect x="20" y="9"  width="1"  height="1"  fill="${c2}"/>
  <!-- nose -->
  <rect x="14" y="14" width="4"  height="2"  fill="#1a1a1a"/>
  <!-- neck -->
  <rect x="12" y="15" width="8"  height="5"  fill="${c1}"/>
  <!-- body -->
  <rect x="7"  y="19" width="18" height="10" fill="${c1}"/>
  <!-- belly -->
  <rect x="10" y="21" width="12" height="7"  fill="${c2}"/>
  <!-- legs -->
  <rect x="8"  y="27" width="3"  height="5"  fill="${c1}"/>
  <rect x="12" y="27" width="3"  height="5"  fill="${c1}"/>
  <rect x="17" y="27" width="3"  height="5"  fill="${c1}"/>
  <rect x="21" y="27" width="3"  height="5"  fill="${c1}"/>
  <!-- hooves -->
  <rect x="8"  y="30" width="3"  height="2"  fill="#1a1a1a"/>
  <rect x="12" y="30" width="3"  height="2"  fill="#1a1a1a"/>
  <rect x="17" y="30" width="3"  height="2"  fill="#1a1a1a"/>
  <rect x="21" y="30" width="3"  height="2"  fill="#1a1a1a"/>
  <!-- tail (white) -->
  <rect x="24" y="19" width="4"  height="4"  fill="#ffffff"/>
</svg>`,

  // ── TURTLES ───────────────────────────────────────────────────

  iron_turtle: (c1, c2) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <!-- head -->
  <rect x="13" y="3" width="6" height="5" fill="${c2}"/>
  <!-- neck -->
  <rect x="14" y="7" width="4" height="3" fill="${c2}"/>
  <!-- shell (hexagonal pixel style) -->
  <rect x="7"  y="9"  width="18" height="15" fill="${c1}"/>
  <rect x="5"  y="12" width="22" height="9"  fill="${c1}"/>
  <!-- shell hexagonal pattern -->
  <rect x="10" y="11" width="4" height="4" fill="${c2}"/>
  <rect x="15" y="11" width="4" height="4" fill="${c2}"/>
  <rect x="20" y="11" width="3" height="4" fill="${c2}"/>
  <rect x="12" y="16" width="4" height="4" fill="${c2}"/>
  <rect x="17" y="16" width="4" height="4" fill="${c2}"/>
  <!-- shell border -->
  <rect x="8"  y="9"  width="16" height="1" fill="${c2}"/>
  <rect x="7"  y="23" width="18" height="1" fill="${c2}"/>
  <!-- legs -->
  <rect x="4"  y="13" width="4" height="5" fill="${c2}"/>
  <rect x="24" y="13" width="4" height="5" fill="${c2}"/>
  <rect x="6"  y="22" width="4" height="5" fill="${c2}"/>
  <rect x="22" y="22" width="4" height="5" fill="${c2}"/>
  <!-- feet -->
  <rect x="3"  y="17" width="5" height="2" fill="${c2}"/>
  <rect x="24" y="17" width="5" height="2" fill="${c2}"/>
  <rect x="5"  y="26" width="5" height="2" fill="${c2}"/>
  <rect x="22" y="26" width="5" height="2" fill="${c2}"/>
  <!-- tail -->
  <rect x="14" y="24" width="4" height="4" fill="${c2}"/>
  <!-- eye -->
  <rect x="14" y="4" width="2" height="2" fill="#1a1a1a"/>
  <rect x="17" y="4" width="2" height="2" fill="#1a1a1a"/>
</svg>`
};

/**
 * Build a complete SVG string for a given reward.
 * Platinum gets a CSS animation class injected.
 * @param {string} animal  - 'cat' | 'octopus' | 'fox' | 'owl' | 'turtle'
 * @param {string} tier    - 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum'
 * @returns {string} SVG markup
 */
function buildSVG(animal, tier) {
  const colors = {
    iron:     ['#9E9E9E', '#BDBDBD'],
    bronze:   ['#CD7F32', '#E8A050'],
    silver:   ['#C0C0C0', '#E8E8E8'],
    gold:     ['#FFD700', '#FFF176'],
    platinum: ['#E040FB', '#00FFFF']
  };

  const [c1, c2] = colors[tier] || colors.iron;
  const key = `iron_${animal}`; // template key (iron_ prefix because the template is shared)
  const builder = SVG_DEFS[key];
  if (!builder) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"></svg>`;

  let svg = builder(c1, c2);

  if (tier === 'platinum') {
    // Wrap in a <g> with the glow class
    svg = svg.replace(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <style>
    .plat-glow { animation: plat-pulse 1.4s ease-in-out infinite alternate; }
    @keyframes plat-pulse {
      from { filter: drop-shadow(0 0 3px #E040FB); }
      to   { filter: drop-shadow(0 0 10px #00FFFF) drop-shadow(0 0 4px #E040FB); }
    }
  </style>
  <g class="plat-glow">`
    ).replace('</svg>', '</g></svg>');
  }

  return svg;
}

// ============================================================
// REWARDS CATALOGUE
// ============================================================

const REWARDS = {

  // ── CATS (cross-game) ───────────────────────────────────────

  iron_cat: {
    id:          'iron_cat',
    name:        'Chat de Fer',
    name_en:     'Iron Cat',
    description: 'Terminer les 4 jeux au moins une fois',
    desc_en:     'Complete all 4 games at least once',
    animal:      'cat',
    tier:        'iron',
    get svg()    { return buildSVG('cat', 'iron'); }
  },

  bronze_cat: {
    id:          'bronze_cat',
    name:        'Chat de Bronze',
    name_en:     'Bronze Cat',
    description: 'Score > 0 dans les 4 jeux',
    desc_en:     'Score > 0 in all 4 games',
    animal:      'cat',
    tier:        'bronze',
    get svg()    { return buildSVG('cat', 'bronze'); }
  },

  silver_cat: {
    id:          'silver_cat',
    name:        'Chat d\'Argent',
    name_en:     'Silver Cat',
    description: 'Score >= 500 dans chaque jeu',
    desc_en:     'Score >= 500 in each game',
    animal:      'cat',
    tier:        'silver',
    get svg()    { return buildSVG('cat', 'silver'); }
  },

  gold_cat: {
    id:          'gold_cat',
    name:        'Chat d\'Or',
    name_en:     'Gold Cat',
    description: 'Score >= 1000 dans chaque jeu',
    desc_en:     'Score >= 1000 in each game',
    animal:      'cat',
    tier:        'gold',
    get svg()    { return buildSVG('cat', 'gold'); }
  },

  platinum_cat: {
    id:          'platinum_cat',
    name:        'Chat de Platine',
    name_en:     'Platinum Cat',
    description: 'Score >= 1500 dans chaque jeu ET un run HARD complete dans chaque jeu',
    desc_en:     'Score >= 1500 in each game AND at least one HARD run completed in each game',
    animal:      'cat',
    tier:        'platinum',
    get svg()    { return buildSVG('cat', 'platinum'); }
  },

  // ── OCTOPUSES (Port Match) ───────────────────────────────────

  iron_octopus: {
    id:          'iron_octopus',
    name:        'Poulpe de Fer',
    name_en:     'Iron Octopus',
    description: 'Terminer Port Match une fois',
    desc_en:     'Complete Port Match once',
    animal:      'octopus',
    tier:        'iron',
    game:        'port-match',
    get svg()    { return buildSVG('octopus', 'iron'); }
  },

  bronze_octopus: {
    id:          'bronze_octopus',
    name:        'Poulpe de Bronze',
    name_en:     'Bronze Octopus',
    description: 'Port Match — score >= 500',
    desc_en:     'Port Match — score >= 500',
    animal:      'octopus',
    tier:        'bronze',
    game:        'port-match',
    get svg()    { return buildSVG('octopus', 'bronze'); }
  },

  silver_octopus: {
    id:          'silver_octopus',
    name:        'Poulpe d\'Argent',
    name_en:     'Silver Octopus',
    description: 'Port Match — score >= 700 en MEDIUM',
    desc_en:     'Port Match — score >= 700 on MEDIUM',
    animal:      'octopus',
    tier:        'silver',
    game:        'port-match',
    get svg()    { return buildSVG('octopus', 'silver'); }
  },

  gold_octopus: {
    id:          'gold_octopus',
    name:        'Poulpe d\'Or',
    name_en:     'Gold Octopus',
    description: 'Port Match — score >= 800 en HARD',
    desc_en:     'Port Match — score >= 800 on HARD',
    animal:      'octopus',
    tier:        'gold',
    game:        'port-match',
    get svg()    { return buildSVG('octopus', 'gold'); }
  },

  // ── FOXES (OSI Puzzle) ───────────────────────────────────────

  iron_fox: {
    id:          'iron_fox',
    name:        'Renard de Fer',
    name_en:     'Iron Fox',
    description: 'Terminer OSI Puzzle une fois',
    desc_en:     'Complete OSI Puzzle once',
    animal:      'fox',
    tier:        'iron',
    game:        'osi-puzzle',
    get svg()    { return buildSVG('fox', 'iron'); }
  },

  bronze_fox: {
    id:          'bronze_fox',
    name:        'Renard de Bronze',
    name_en:     'Bronze Fox',
    description: 'OSI Puzzle — score >= 500',
    desc_en:     'OSI Puzzle — score >= 500',
    animal:      'fox',
    tier:        'bronze',
    game:        'osi-puzzle',
    get svg()    { return buildSVG('fox', 'bronze'); }
  },

  silver_fox: {
    id:          'silver_fox',
    name:        'Renard d\'Argent',
    name_en:     'Silver Fox',
    description: 'OSI Puzzle — score >= 700 en MEDIUM',
    desc_en:     'OSI Puzzle — score >= 700 on MEDIUM',
    animal:      'fox',
    tier:        'silver',
    game:        'osi-puzzle',
    get svg()    { return buildSVG('fox', 'silver'); }
  },

  gold_fox: {
    id:          'gold_fox',
    name:        'Renard d\'Or',
    name_en:     'Gold Fox',
    description: 'OSI Puzzle — score >= 800 en HARD',
    desc_en:     'OSI Puzzle — score >= 800 on HARD',
    animal:      'fox',
    tier:        'gold',
    game:        'osi-puzzle',
    get svg()    { return buildSVG('fox', 'gold'); }
  },

  // ── OWLS (Protocol Quiz) ─────────────────────────────────────

  iron_owl: {
    id:          'iron_owl',
    name:        'Hibou de Fer',
    name_en:     'Iron Owl',
    description: 'Terminer Protocol Quiz une fois',
    desc_en:     'Complete Protocol Quiz once',
    animal:      'owl',
    tier:        'iron',
    game:        'protocol-quiz',
    get svg()    { return buildSVG('owl', 'iron'); }
  },

  bronze_owl: {
    id:          'bronze_owl',
    name:        'Hibou de Bronze',
    name_en:     'Bronze Owl',
    description: 'Protocol Quiz — score >= 500',
    desc_en:     'Protocol Quiz — score >= 500',
    animal:      'owl',
    tier:        'bronze',
    game:        'protocol-quiz',
    get svg()    { return buildSVG('owl', 'bronze'); }
  },

  silver_owl: {
    id:          'silver_owl',
    name:        'Hibou d\'Argent',
    name_en:     'Silver Owl',
    description: 'Protocol Quiz — score >= 700 en MEDIUM',
    desc_en:     'Protocol Quiz — score >= 700 on MEDIUM',
    animal:      'owl',
    tier:        'silver',
    game:        'protocol-quiz',
    get svg()    { return buildSVG('owl', 'silver'); }
  },

  gold_owl: {
    id:          'gold_owl',
    name:        'Hibou d\'Or',
    name_en:     'Gold Owl',
    description: 'Protocol Quiz — score >= 800 en HARD',
    desc_en:     'Protocol Quiz — score >= 800 on HARD',
    animal:      'owl',
    tier:        'gold',
    game:        'protocol-quiz',
    get svg()    { return buildSVG('owl', 'gold'); }
  },

  // ── TURTLES (Subnet Challenge) ───────────────────────────────

  iron_turtle: {
    id:          'iron_turtle',
    name:        'Tortue de Fer',
    name_en:     'Iron Turtle',
    description: 'Terminer Subnet Challenge une fois',
    desc_en:     'Complete Subnet Challenge once',
    animal:      'turtle',
    tier:        'iron',
    game:        'subnet-challenge',
    get svg()    { return buildSVG('turtle', 'iron'); }
  },

  bronze_turtle: {
    id:          'bronze_turtle',
    name:        'Tortue de Bronze',
    name_en:     'Bronze Turtle',
    description: 'Subnet Challenge — score >= 500',
    desc_en:     'Subnet Challenge — score >= 500',
    animal:      'turtle',
    tier:        'bronze',
    game:        'subnet-challenge',
    get svg()    { return buildSVG('turtle', 'bronze'); }
  },

  silver_turtle: {
    id:          'silver_turtle',
    name:        'Tortue d\'Argent',
    name_en:     'Silver Turtle',
    description: 'Subnet Challenge — score >= 700 en MEDIUM',
    desc_en:     'Subnet Challenge — score >= 700 on MEDIUM',
    animal:      'turtle',
    tier:        'silver',
    game:        'subnet-challenge',
    get svg()    { return buildSVG('turtle', 'silver'); }
  },

  gold_turtle: {
    id:          'gold_turtle',
    name:        'Tortue d\'Or',
    name_en:     'Gold Turtle',
    description: 'Subnet Challenge — score >= 800 en HARD',
    desc_en:     'Subnet Challenge — score >= 800 on HARD',
    animal:      'turtle',
    tier:        'gold',
    game:        'subnet-challenge',
    get svg()    { return buildSVG('turtle', 'gold'); }
  },

  // ── DRAGONS (Firewall Blitz) ────────────────────────────

  iron_dragon: {
    id:          'iron_dragon',
    name:        'Dragon de Fer',
    name_en:     'Iron Dragon',
    description: 'Terminer Firewall Blitz une fois',
    desc_en:     'Complete Firewall Blitz once',
    animal:      'dragon',
    tier:        'iron',
    game:        'firewall-blitz',
    get svg()    { return buildSVG('dragon', 'iron'); }
  },

  bronze_dragon: {
    id:          'bronze_dragon',
    name:        'Dragon de Bronze',
    name_en:     'Bronze Dragon',
    description: 'Firewall Blitz — score >= 500',
    desc_en:     'Firewall Blitz — score >= 500',
    animal:      'dragon',
    tier:        'bronze',
    game:        'firewall-blitz',
    get svg()    { return buildSVG('dragon', 'bronze'); }
  },

  silver_dragon: {
    id:          'silver_dragon',
    name:        'Dragon d\'Argent',
    name_en:     'Silver Dragon',
    description: 'Firewall Blitz — score >= 700 en MEDIUM',
    desc_en:     'Firewall Blitz — score >= 700 on MEDIUM',
    animal:      'dragon',
    tier:        'silver',
    game:        'firewall-blitz',
    get svg()    { return buildSVG('dragon', 'silver'); }
  },

  gold_dragon: {
    id:          'gold_dragon',
    name:        'Dragon d\'Or',
    name_en:     'Gold Dragon',
    description: 'Firewall Blitz — score >= 800 en HARD',
    desc_en:     'Firewall Blitz — score >= 800 on HARD',
    animal:      'dragon',
    tier:        'gold',
    game:        'firewall-blitz',
    get svg()    { return buildSVG('dragon', 'gold'); }
  },

  // ── CROWS (DNS Chain) ────────────────────────────────────

  iron_crow: {
    id:          'iron_crow',
    name:        'Corbeau de Fer',
    name_en:     'Iron Crow',
    description: 'Terminer DNS Chain une fois',
    desc_en:     'Complete DNS Chain once',
    animal:      'crow',
    tier:        'iron',
    game:        'dns-chain',
    get svg()    { return buildSVG('crow', 'iron'); }
  },

  bronze_crow: {
    id:          'bronze_crow',
    name:        'Corbeau de Bronze',
    name_en:     'Bronze Crow',
    description: 'DNS Chain — score >= 500',
    desc_en:     'DNS Chain — score >= 500',
    animal:      'crow',
    tier:        'bronze',
    game:        'dns-chain',
    get svg()    { return buildSVG('crow', 'bronze'); }
  },

  silver_crow: {
    id:          'silver_crow',
    name:        'Corbeau d\'Argent',
    name_en:     'Silver Crow',
    description: 'DNS Chain — score >= 700 en MEDIUM',
    desc_en:     'DNS Chain — score >= 700 on MEDIUM',
    animal:      'crow',
    tier:        'silver',
    game:        'dns-chain',
    get svg()    { return buildSVG('crow', 'silver'); }
  },

  gold_crow: {
    id:          'gold_crow',
    name:        'Corbeau d\'Or',
    name_en:     'Gold Crow',
    description: 'DNS Chain — score >= 800 en HARD',
    desc_en:     'DNS Chain — score >= 800 on HARD',
    animal:      'crow',
    tier:        'gold',
    game:        'dns-chain',
    get svg()    { return buildSVG('crow', 'gold'); }
  },

  // ── WOLVES (Packet Tracer) ───────────────────────────────

  iron_wolf: {
    id:          'iron_wolf',
    name:        'Loup de Fer',
    name_en:     'Iron Wolf',
    description: 'Terminer Packet Tracer une fois',
    desc_en:     'Complete Packet Tracer once',
    animal:      'wolf',
    tier:        'iron',
    game:        'packet-tracer',
    get svg()    { return buildSVG('wolf', 'iron'); }
  },

  bronze_wolf: {
    id:          'bronze_wolf',
    name:        'Loup de Bronze',
    name_en:     'Bronze Wolf',
    description: 'Packet Tracer — score >= 500',
    desc_en:     'Packet Tracer — score >= 500',
    animal:      'wolf',
    tier:        'bronze',
    game:        'packet-tracer',
    get svg()    { return buildSVG('wolf', 'bronze'); }
  },

  silver_wolf: {
    id:          'silver_wolf',
    name:        'Loup d\'Argent',
    name_en:     'Silver Wolf',
    description: 'Packet Tracer — score >= 700 en MEDIUM',
    desc_en:     'Packet Tracer — score >= 700 on MEDIUM',
    animal:      'wolf',
    tier:        'silver',
    game:        'packet-tracer',
    get svg()    { return buildSVG('wolf', 'silver'); }
  },

  gold_wolf: {
    id:          'gold_wolf',
    name:        'Loup d\'Or',
    name_en:     'Gold Wolf',
    description: 'Packet Tracer — score >= 800 en HARD',
    desc_en:     'Packet Tracer — score >= 800 on HARD',
    animal:      'wolf',
    tier:        'gold',
    game:        'packet-tracer',
    get svg()    { return buildSVG('wolf', 'gold'); }
  },

  // ── DEER (VLAN Master) ───────────────────────────────────

  iron_deer: {
    id:          'iron_deer',
    name:        'Cerf de Fer',
    name_en:     'Iron Deer',
    description: 'Terminer VLAN Master une fois',
    desc_en:     'Complete VLAN Master once',
    animal:      'deer',
    tier:        'iron',
    game:        'vlan-master',
    get svg()    { return buildSVG('deer', 'iron'); }
  },

  bronze_deer: {
    id:          'bronze_deer',
    name:        'Cerf de Bronze',
    name_en:     'Bronze Deer',
    description: 'VLAN Master — score >= 500',
    desc_en:     'VLAN Master — score >= 500',
    animal:      'deer',
    tier:        'bronze',
    game:        'vlan-master',
    get svg()    { return buildSVG('deer', 'bronze'); }
  },

  silver_deer: {
    id:          'silver_deer',
    name:        'Cerf d\'Argent',
    name_en:     'Silver Deer',
    description: 'VLAN Master — score >= 700 en MEDIUM',
    desc_en:     'VLAN Master — score >= 700 on MEDIUM',
    animal:      'deer',
    tier:        'silver',
    game:        'vlan-master',
    get svg()    { return buildSVG('deer', 'silver'); }
  },

  gold_deer: {
    id:          'gold_deer',
    name:        'Cerf d\'Or',
    name_en:     'Gold Deer',
    description: 'VLAN Master — score >= 800 en HARD',
    desc_en:     'VLAN Master — score >= 800 on HARD',
    animal:      'deer',
    tier:        'gold',
    game:        'vlan-master',
    get svg()    { return buildSVG('deer', 'gold'); }
  },

  // ── SNAKES (Cable Chaos) ─────────────────────────────────────

  iron_snake: {
    id:          'iron_snake',
    name:        'Serpent de Fer',
    name_en:     'Iron Snake',
    description: 'Terminer Cable Chaos une fois',
    desc_en:     'Complete Cable Chaos once',
    animal:      'snake',
    tier:        'iron',
    game:        'cable-chaos',
    get svg()    { return buildSVG('snake', 'iron'); }
  },

  bronze_snake: {
    id:          'bronze_snake',
    name:        'Serpent de Bronze',
    name_en:     'Bronze Snake',
    description: 'Cable Chaos — score >= 500',
    desc_en:     'Cable Chaos — score >= 500',
    animal:      'snake',
    tier:        'bronze',
    game:        'cable-chaos',
    get svg()    { return buildSVG('snake', 'bronze'); }
  },

  silver_snake: {
    id:          'silver_snake',
    name:        'Serpent d\'Argent',
    name_en:     'Silver Snake',
    description: 'Cable Chaos — score >= 700 en MEDIUM',
    desc_en:     'Cable Chaos — score >= 700 on MEDIUM',
    animal:      'snake',
    tier:        'silver',
    game:        'cable-chaos',
    get svg()    { return buildSVG('snake', 'silver'); }
  },

  gold_snake: {
    id:          'gold_snake',
    name:        'Serpent d\'Or',
    name_en:     'Gold Snake',
    description: 'Cable Chaos — score >= 800 en HARD',
    desc_en:     'Cable Chaos — score >= 800 on HARD',
    animal:      'snake',
    tier:        'gold',
    game:        'cable-chaos',
    get svg()    { return buildSVG('snake', 'gold'); }
  }
};

// ============================================================
// UNLOCK CONDITIONS
// Each function receives the full scores array and returns boolean.
// ============================================================

const REWARD_CONDITIONS = {

  iron_cat(all) {
    const games = ['port-match', 'osi-puzzle', 'protocol-quiz', 'subnet-challenge', 'cable-chaos', 'firewall-blitz', 'dns-chain', 'packet-tracer', 'vlan-master'];
    return games.every(g => all.some(e => e.game === g));
  },

  bronze_cat(all) {
    const games = ['port-match', 'osi-puzzle', 'protocol-quiz', 'subnet-challenge', 'cable-chaos', 'firewall-blitz', 'dns-chain', 'packet-tracer', 'vlan-master'];
    return games.every(g => all.some(e => e.game === g && e.score > 0));
  },

  silver_cat(all) {
    const games = ['port-match', 'osi-puzzle', 'protocol-quiz', 'subnet-challenge', 'cable-chaos', 'firewall-blitz', 'dns-chain', 'packet-tracer', 'vlan-master'];
    return games.every(g => all.some(e => e.game === g && e.score >= 500));
  },

  gold_cat(all) {
    const games = ['port-match', 'osi-puzzle', 'protocol-quiz', 'subnet-challenge', 'cable-chaos', 'firewall-blitz', 'dns-chain', 'packet-tracer', 'vlan-master'];
    return games.every(g => all.some(e => e.game === g && e.score >= 1000));
  },

  platinum_cat(all) {
    const games = ['port-match', 'osi-puzzle', 'protocol-quiz', 'subnet-challenge', 'cable-chaos', 'firewall-blitz', 'dns-chain', 'packet-tracer', 'vlan-master'];
    const highEnough = games.every(g => all.some(e => e.game === g && e.score >= 1500));
    const hardDone   = games.every(g => all.some(e => e.game === g && e.difficulty === 'hard'));
    return highEnough && hardDone;
  },

  // Port Match
  iron_octopus(all)   { return all.some(e => e.game === 'port-match'); },
  bronze_octopus(all) { return all.some(e => e.game === 'port-match' && e.score >= 500); },
  silver_octopus(all) { return all.some(e => e.game === 'port-match' && e.difficulty === 'medium' && e.score >= 700); },
  gold_octopus(all)   { return all.some(e => e.game === 'port-match' && e.difficulty === 'hard' && e.score >= 800); },

  // OSI Puzzle
  iron_fox(all)   { return all.some(e => e.game === 'osi-puzzle'); },
  bronze_fox(all) { return all.some(e => e.game === 'osi-puzzle' && e.score >= 500); },
  silver_fox(all) { return all.some(e => e.game === 'osi-puzzle' && e.difficulty === 'medium' && e.score >= 700); },
  gold_fox(all)   { return all.some(e => e.game === 'osi-puzzle' && e.difficulty === 'hard' && e.score >= 800); },

  // Protocol Quiz
  iron_owl(all)   { return all.some(e => e.game === 'protocol-quiz'); },
  bronze_owl(all) { return all.some(e => e.game === 'protocol-quiz' && e.score >= 500); },
  silver_owl(all) { return all.some(e => e.game === 'protocol-quiz' && e.difficulty === 'medium' && e.score >= 700); },
  gold_owl(all)   { return all.some(e => e.game === 'protocol-quiz' && e.difficulty === 'hard' && e.score >= 800); },

  // Subnet Challenge
  iron_turtle(all)   { return all.some(e => e.game === 'subnet-challenge'); },
  bronze_turtle(all) { return all.some(e => e.game === 'subnet-challenge' && e.score >= 500); },
  silver_turtle(all) { return all.some(e => e.game === 'subnet-challenge' && e.difficulty === 'medium' && e.score >= 700); },
  gold_turtle(all)   { return all.some(e => e.game === 'subnet-challenge' && e.difficulty === 'hard' && e.score >= 800); },

  // Cable Chaos
  iron_snake(all)   { return all.some(e => e.game === 'cable-chaos'); },
  bronze_snake(all) { return all.some(e => e.game === 'cable-chaos' && e.score >= 500); },
  silver_snake(all) { return all.some(e => e.game === 'cable-chaos' && e.difficulty === 'medium' && e.score >= 700); },
  gold_snake(all)   { return all.some(e => e.game === 'cable-chaos' && e.difficulty === 'hard' && e.score >= 800); },

  // Firewall Blitz
  iron_dragon(all)   { return all.some(e => e.game === 'firewall-blitz'); },
  bronze_dragon(all) { return all.some(e => e.game === 'firewall-blitz' && e.score >= 500); },
  silver_dragon(all) { return all.some(e => e.game === 'firewall-blitz' && e.difficulty === 'medium' && e.score >= 700); },
  gold_dragon(all)   { return all.some(e => e.game === 'firewall-blitz' && e.difficulty === 'hard' && e.score >= 800); },

  // DNS Chain
  iron_crow(all)   { return all.some(e => e.game === 'dns-chain'); },
  bronze_crow(all) { return all.some(e => e.game === 'dns-chain' && e.score >= 500); },
  silver_crow(all) { return all.some(e => e.game === 'dns-chain' && e.difficulty === 'medium' && e.score >= 700); },
  gold_crow(all)   { return all.some(e => e.game === 'dns-chain' && e.difficulty === 'hard' && e.score >= 800); },

  // Packet Tracer
  iron_wolf(all)   { return all.some(e => e.game === 'packet-tracer'); },
  bronze_wolf(all) { return all.some(e => e.game === 'packet-tracer' && e.score >= 500); },
  silver_wolf(all) { return all.some(e => e.game === 'packet-tracer' && e.difficulty === 'medium' && e.score >= 700); },
  gold_wolf(all)   { return all.some(e => e.game === 'packet-tracer' && e.difficulty === 'hard' && e.score >= 800); },

  // VLAN Master
  iron_deer(all)   { return all.some(e => e.game === 'vlan-master'); },
  bronze_deer(all) { return all.some(e => e.game === 'vlan-master' && e.score >= 500); },
  silver_deer(all) { return all.some(e => e.game === 'vlan-master' && e.difficulty === 'medium' && e.score >= 700); },
  gold_deer(all)   { return all.some(e => e.game === 'vlan-master' && e.difficulty === 'hard' && e.score >= 800); }
};

// ============================================================
// STORAGE HELPERS
// ============================================================

function _readUnlocked() {
  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_e) {
    return {};
  }
}

function _writeUnlocked(data) {
  localStorage.setItem(REWARDS_KEY, JSON.stringify(data));
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Check all conditions against current scores.
 * Saves newly unlocked rewards to localStorage.
 * @returns {string[]} IDs of rewards newly unlocked this call (empty if none)
 */
function checkRewards() {
  let allScores;
  try {
    const raw = localStorage.getItem('arcade_scores');
    allScores = raw ? JSON.parse(raw) : [];
  } catch (_e) {
    allScores = [];
  }

  const unlocked = _readUnlocked();
  const newlyUnlocked = [];
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  });

  Object.keys(REWARDS).forEach(id => {
    if (unlocked[id]) return; // already unlocked
    const condition = REWARD_CONDITIONS[id];
    if (condition && condition(allScores)) {
      unlocked[id] = { unlockedAt: now };
      newlyUnlocked.push(id);
    }
  });

  if (newlyUnlocked.length > 0) {
    _writeUnlocked(unlocked);
  }

  return newlyUnlocked;
}

/**
 * Return all rewards with their unlock status.
 * @returns {Array<{reward: Object, unlocked: boolean, unlockedAt: string|null}>}
 */
function getUnlockedRewards() {
  const unlocked = _readUnlocked();
  return Object.values(REWARDS).map(r => ({
    reward:     r,
    unlocked:   !!unlocked[r.id],
    unlockedAt: unlocked[r.id] ? unlocked[r.id].unlockedAt : null
  }));
}

/**
 * Return the SVG markup for a given reward ID.
 * @param {string} rewardId
 * @returns {string} SVG markup string
 */
function renderRewardBadge(rewardId) {
  const r = REWARDS[rewardId];
  if (!r) return '';
  return r.svg;
}

/**
 * Generate and download a PNG ticket for an unlocked reward.
 * Canvas 600x400, arcade style matching ticket.js aesthetic.
 * @param {string} rewardId
 */
function generateRewardTicket(rewardId) {
  const r = REWARDS[rewardId];
  if (!r) return;

  const unlocked = _readUnlocked();
  const dateStr = unlocked[r.id]
    ? unlocked[r.id].unlockedAt
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const W = 600;
  const H = 400;

  let canvas = document.getElementById('reward-ticket-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'reward-ticket-canvas';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
  }
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, y, W, 2);
  }

  // Dashed outer border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.setLineDash([]);

  // Inner glow border — color depends on tier
  const tierGlow = {
    iron:     '#9E9E9E',
    bronze:   '#CD7F32',
    silver:   '#C0C0C0',
    gold:     '#FFD700',
    platinum: '#E040FB'
  };
  const glowColor = tierGlow[r.tier] || '#00ffff';

  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.shadowBlur = 0;

  // Title
  ctx.font = 'bold 14px "Press Start 2P", monospace';
  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.textAlign = 'center';
  ctx.fillText('THE ARCADE BORNE', W / 2, 55);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.fillText('HALL OF PINS', W / 2, 72);

  // Divider
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(60, 82);
  ctx.lineTo(W - 60, 82);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Congratulations
  ctx.font = 'bold 11px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText('CONGRATULATIONS', W / 2, 105);
  ctx.shadowBlur = 0;

  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#cccccc';
  ctx.textAlign = 'center';
  ctx.fillText('YOU EARNED THIS PIN', W / 2, 122);

  // Render SVG as image on canvas
  const svgBlob = new Blob([r.svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl  = URL.createObjectURL(svgBlob);
  const img     = new Image();

  img.onload = () => {
    // Draw SVG centered at top-center area
    const imgSize = 96;
    const imgX = (W - imgSize) / 2;
    const imgY = 135;
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    URL.revokeObjectURL(svgUrl);

    // Pin name
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText(r.name.toUpperCase(), W / 2, 252);
    ctx.shadowBlur = 0;

    // Description line (may be long — scale font down)
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText(r.description, W / 2, 270);

    // Divider
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 285);
    ctx.lineTo(W - 50, 285);
    ctx.stroke();
    ctx.setLineDash([]);

    // Details rows
    const details = [
      { label: 'PIN ID',     value: r.id.toUpperCase(),   color: '#aaaaaa' },
      { label: 'TIER',       value: r.tier.toUpperCase(), color: glowColor },
      { label: 'UNLOCKED',   value: dateStr,              color: '#00ff00' }
    ];

    const startY = 305;
    const rowH   = 28;

    details.forEach((item, idx) => {
      const y = startY + idx * rowH;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = '#444444';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, 60, y);

      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 6;
      ctx.textAlign = 'right';
      ctx.fillText(item.value, W - 60, y);
      ctx.shadowBlur = 0;
    });

    // Footer
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('thmsryn.github.io — THE ARCADE BORNE', W / 2, H - 24);

    // Download
    const link = document.createElement('a');
    link.download = `arcade-pin-${r.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  img.onerror = () => {
    URL.revokeObjectURL(svgUrl);
  };

  img.src = svgUrl;
}

// ============================================================
// NOTIFICATION POPUP (arcade style)
// ============================================================

/**
 * Display an arcade-style popup for newly unlocked rewards.
 * Auto-dismisses after 6 seconds. Can also be closed manually.
 * @param {string[]} newIds - array of newly unlocked reward IDs
 * @param {Object}   [options]
 * @param {boolean}  [options.isGamePage=false] - true when called from a game page
 */
function showRewardNotifications(newIds, options) {
  if (!newIds || newIds.length === 0) return;

  const isGamePage = (options && options.isGamePage) || false;

  newIds.forEach((id, index) => {
    const r = REWARDS[id];
    if (!r) return;

    // Stagger multiple popups
    setTimeout(() => _showSingleNotification(r, isGamePage), index * 800);
  });
}

function _showSingleNotification(r, isGamePage) {
  // Remove any existing notification first
  const existing = document.getElementById('reward-notification');
  if (existing) existing.remove();

  const tierGlow = {
    iron:     '#9E9E9E',
    bronze:   '#CD7F32',
    silver:   '#C0C0C0',
    gold:     '#FFD700',
    platinum: '#E040FB'
  };
  const glow = tierGlow[r.tier] || '#00ffff';

  const overlay = document.createElement('div');
  overlay.id = 'reward-notification';
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Nouvelle recompense debloquee');
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: "Press Start 2P", monospace;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background: #0d0d0d;
    border: 2px solid ${glow};
    box-shadow: 0 0 24px ${glow}, 0 0 8px ${glow};
    padding: 32px 40px;
    text-align: center;
    max-width: 420px;
    width: 90%;
    position: relative;
  `;

  // Blinking header
  const header = document.createElement('p');
  header.style.cssText = `
    color: #ffff00;
    font-size: 0.55rem;
    margin: 0 0 16px;
    text-shadow: 0 0 10px #ffff00;
    animation: reward-blink 0.7s step-end infinite;
  `;
  header.textContent = 'NEW PIN UNLOCKED!';

  // SVG badge
  const badgeWrap = document.createElement('div');
  badgeWrap.style.cssText = `
    width: 80px;
    height: 80px;
    margin: 0 auto 16px;
    filter: drop-shadow(0 0 6px ${glow});
  `;
  badgeWrap.innerHTML = r.svg;

  // Name
  const name = document.createElement('p');
  name.style.cssText = `
    color: ${glow};
    font-size: 0.5rem;
    margin: 0 0 8px;
    text-shadow: 0 0 8px ${glow};
  `;
  name.textContent = r.name.toUpperCase();

  // Description
  const desc = document.createElement('p');
  desc.style.cssText = `
    color: #666;
    font-size: 0.32rem;
    margin: 0 0 20px;
    line-height: 1.6;
  `;
  desc.textContent = r.description;

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex; gap:12px; justify-content:center; flex-wrap:wrap;';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn--magenta';
  downloadBtn.style.cssText = 'font-size:0.36rem; padding:8px 14px; cursor:pointer;';
  downloadBtn.textContent = 'DOWNLOAD';
  downloadBtn.addEventListener('click', () => {
    generateRewardTicket(r.id);
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn--small';
  closeBtn.style.cssText = 'font-size:0.32rem; padding:8px 14px; cursor:pointer; border-color:#333; color:#666;';
  closeBtn.textContent = 'CLOSE';
  closeBtn.addEventListener('click', () => overlay.remove());

  btnRow.appendChild(downloadBtn);
  btnRow.appendChild(closeBtn);

  // Inject blink keyframe if not already present
  if (!document.getElementById('reward-blink-style')) {
    const style = document.createElement('style');
    style.id = 'reward-blink-style';
    style.textContent = `
      @keyframes reward-blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  box.appendChild(header);
  box.appendChild(badgeWrap);
  box.appendChild(name);
  box.appendChild(desc);
  box.appendChild(btnRow);
  overlay.appendChild(box);

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  // Auto-dismiss after 6 seconds
  const autoClose = setTimeout(() => overlay.remove(), 6000);
  closeBtn.addEventListener('click', () => clearTimeout(autoClose));
  downloadBtn.addEventListener('click', () => clearTimeout(autoClose));

  document.body.appendChild(overlay);
}

// ============================================================
// HALL OF PINS RENDERER (for index.html)
// ============================================================

/**
 * Render the full Hall of Pins section into a container element.
 * @param {HTMLElement} container
 */
function renderHallOfPins(container) {
  if (!container) return;

  const allRewards = getUnlockedRewards();
  const lang = (typeof i18n !== 'undefined') ? i18n.getLang() : 'fr';

  const tierGlow = {
    iron:     '#9E9E9E',
    bronze:   '#CD7F32',
    silver:   '#C0C0C0',
    gold:     '#FFD700',
    platinum: '#E040FB'
  };

  const items = allRewards.map(({ reward: r, unlocked, unlockedAt }) => {
    const glow = tierGlow[r.tier] || '#aaaaaa';
    const displayName = lang === 'en' ? r.name_en : r.name;
    const displayDesc = lang === 'en' ? r.desc_en : r.description;

    if (unlocked) {
      return `
        <div class="pin-item pin-item--unlocked"
             style="--pin-glow: ${glow};"
             aria-label="${displayName}">
          <div class="pin-item__badge" aria-hidden="true">
            ${r.svg}
          </div>
          <p class="pin-item__name">${displayName}</p>
          <p class="pin-item__desc">${displayDesc}</p>
          ${unlockedAt ? `<p class="pin-item__date">${unlockedAt}</p>` : ''}
          <button
            class="btn btn--small pin-item__download"
            data-reward-id="${r.id}"
            aria-label="Telecharger le pin ${displayName}"
          >DOWNLOAD</button>
        </div>
      `;
    } else {
      return `
        <div class="pin-item pin-item--locked" aria-label="${displayName} — verrouille">
          <div class="pin-item__badge pin-item__badge--locked" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
              <rect x="9" y="14" width="14" height="12" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
              <rect x="12" y="8"  width="8"  height="8"  fill="none"   stroke="#444" stroke-width="2"/>
              <rect x="14" y="17" width="4"  height="5"  fill="#444"/>
            </svg>
          </div>
          <p class="pin-item__name pin-item__name--locked">???</p>
          <p class="pin-item__desc pin-item__desc--locked">${displayDesc}</p>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `<div class="pins-grid">${items}</div>`;

  // Bind download buttons
  container.querySelectorAll('.pin-item__download').forEach(btn => {
    btn.addEventListener('click', () => {
      generateRewardTicket(btn.dataset.rewardId);
    });
  });
}
