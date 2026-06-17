/**
 * about-vfx.js
 * Sonoran Cosmos — About Page Title VFX
 *
 * Pixel scan fires on every word rotation — each word decodes in.
 * VFX-JS runs briefly per word then removes itself, so the canvas
 * is never a permanent overlay.
 *
 * Word cycle: Kevin Fowler → Designer → Researcher → Human → repeat
 */

import { VFX } from 'https://esm.sh/@vfx-js/core@0.5.2';

const h1    = document.getElementById('about-title');
const words = ['Kevin Fowler', 'Designer', 'Researcher', 'Human'];
let   idx   = 0;
let   busy  = false;

if (!h1) throw new Error('about-vfx: #about-title not found');

// ── Portfolio palette shader ─────────────────────────────────────────
const shader = `
precision highp float;
uniform sampler2D src;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float enterTime;
uniform float leaveTime;
uniform int   mode;
uniform float layers;
uniform float speed;
uniform float delay;
uniform float width;

#define W     width
#define LAYERS layers

vec4 readTex(vec2 uv) {
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return vec4(0);
  return texture(src, uv);
}
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(4859., 3985.))) * 3984.);
}
float sdBox(vec2 p, float r) {
  vec2 q = abs(p) - r;
  return min(length(q), max(q.y, q.x));
}
float dir = 1.;
float toRangeT(vec2 p, float scale) {
  float d;
  if      (mode == 0) d = p.x / (scale * 2.) + .5;
  else if (mode == 1) d = 1. - (p.y / (scale * 2.) + .5);
  else                d = length(p) / scale;
  return dir > 0. ? d : (1. - d);
}
vec4 cell(vec2 p, vec2 pi, float scale, float t, float edge) {
  vec2 pc  = pi + .5;
  vec2 uvc = pc / scale;
  uvc.y   /= resolution.y / resolution.x;
  uvc      = uvc * 0.5 + 0.5;
  if (uvc.x < 0. || uvc.x > 1. || uvc.y < 0. || uvc.y > 1.) return vec4(0);
  float alpha = smoothstep(.0, .1, texture2D(src, uvc, 3.).a);
  float sel   = fract(hash(pi + vec2(47.3, 23.7)));
  vec3  pal;
  if      (sel < 0.50) pal = vec3(0.039, 0.765, 0.604); /* aurora  */
  else if (sel < 0.85) pal = vec3(0.373, 0.145, 0.624); /* cosmos  */
  else                 pal = vec3(0.784, 0.094, 0.345); /* pulsar  */
  vec4  color = vec4(pal, 1.0);
  float x     = toRangeT(pi, scale);
  float n     = hash(pi);
  float anim  = smoothstep(W * 2., .0, abs(x + n * W - t));
  color      *= anim;
  color      *= mix(1., clamp(.3 / abs(sdBox(p - pc, .5)), 0., 10.), edge * pow(anim, 10.));
  return color * alpha;
}
vec4 cellsColor(vec2 p, float scale, float t) {
  vec2 pi = floor(p);
  vec2 d  = vec2(0, 1);
  vec4 cc = vec4(0);
  cc += cell(p, pi,        scale, t, .2) * 4.;
  cc += cell(p, pi + d.xy, scale, t, .9);
  cc += cell(p, pi - d.xy, scale, t, .9);
  cc += cell(p, pi + d.yx, scale, t, .9);
  cc += cell(p, pi - d.yx, scale, t, .9);
  return cc / 8.;
}
vec4 draw(vec2 uv, vec2 p, float t, float scale) {
  vec4  c  = readTex(uv);
  vec2  pi = floor(p * scale);
  float n  = hash(pi);
  t        = t * (1. + W * 4.) - W * 2.;
  float x  = toRangeT(pi, scale);
  float a1 = smoothstep(t, t - W, x + n * W);
  c       *= a1;
  c       += cellsColor(p * scale, scale, t) * 1.5;
  return c;
}
void main() {
  vec2  uv = (gl_FragCoord.xy - offset) / resolution;
  vec2  p  = uv * 2. - 1.;
  p.y     *= resolution.y / resolution.x;
  float t;
  if (leaveTime > 0.) {
    dir = -1.;
    t   = clamp(leaveTime * speed, 0., 1.);
  } else {
    t   = clamp((enterTime - delay) * speed, 0., 1.);
  }
  t = (fract(t * .99999) - 0.5) * dir + 0.5;
  for (float i = 0.; i < LAYERS; i++) {
    float s = cos(i) * 7.3 + 10.;
    gl_FragColor += draw(uv, p, t, abs(s));
  }
  gl_FragColor /= LAYERS;
  gl_FragColor *= smoothstep(0., 0.01, t);
}
`;

// ── Single reusable VFX instance ─────────────────────────────────────
const vfx = new VFX();

// ── Canvas z-index fix ───────────────────────────────────────────────
// Run after each vfx.add() — finds the VFX canvas and ensures it sits
// above the h1 but below the page sections (which have z-index: 2 in CSS).
function fixCanvas() {
  requestAnimationFrame(() => {
    document.querySelectorAll('canvas').forEach(c => {
      if (c.id !== 'stars') {
        c.style.zIndex        = '1';
        c.style.pointerEvents = 'none';
      }
    });
  });
}

// ── Word rotation ─────────────────────────────────────────────────────
// Wait for the h1 CSS entrance animation to finish before starting.
// 0.2s delay + 0.6s duration + 1.7s pause = 2.5s before first rotation.
setTimeout(rotateWord, 2500);

function rotateWord() {
  if (busy) return;
  busy = true;

  idx = (idx + 1) % words.length;

  // Swap text content
  h1.textContent = words[idx];

  // Re-add to VFX — triggers a fresh pixel scan
  try { vfx.remove(h1); } catch (_) {}

  vfx.add(h1, {
    shader,
    overflow: 40,
    intersection: { threshold: 0.5 },
    uniforms: {
      mode:   0,      // left-to-right (most readable for text)
      width:  0.22,
      layers: 2,      // fewer layers = faster, lighter
      speed:  1.2,    // faster scan per word rotation
      delay:  0,
    },
  });

  fixCanvas();

  // Scan duration: 1/speed * ~1000ms ≈ 830ms. Add buffer.
  const scanMs   = 900;
  const displayMs = 2000;

  setTimeout(() => {
    try { vfx.remove(h1); } catch (_) {}
    h1.style.opacity = '1';

    setTimeout(() => {
      busy = false;
      rotateWord();
    }, displayMs);
  }, scanMs);
}
