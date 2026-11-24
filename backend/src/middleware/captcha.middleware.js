import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/helpers.js';

// Self-hosted CAPTCHA for public forms that send email or create records (register, forgot password, resend
// verification, "Leave us a message", "Notify me"). No outside service.
//
//   GET /api/v1/captcha   -> { enabled, id, image }   image = an SVG of a distorted 5-digit code
//   form submit           -> body.captchaId + body.captchaAnswer, checked by withCaptcha (then removed)
//
// The digits are drawn as stroked paths (no <text>), so the answer is not in the page source. The id is a signed,
// stateless token: HMAC(secret, answer + expiry + nonce). Each id works once (used nonces are remembered in memory
// until they expire) and expires after 10 minutes. Turn it off with CAPTCHA_ENABLED=false (e.g. automated tests).

const LENGTH = 5;
const TTL_MS = 10 * 60 * 1000;
const SECRET = crypto.createHash('sha256').update(`captcha:${env.jwt.accessSecret}`).digest();
const used = new Map(); // nonce -> expiry (ms)

// Digits on a 10 x 16 grid, each a list of strokes (polylines).
const GLYPHS = {
  0: [[[2, 0], [8, 0], [10, 3], [10, 13], [8, 16], [2, 16], [0, 13], [0, 3], [2, 0]], [[8, 3], [2, 13]]],
  1: [[[2, 4], [6, 0], [6, 16]], [[2, 16], [10, 16]]],
  2: [[[0, 3], [2, 0], [8, 0], [10, 3], [10, 6], [0, 16], [10, 16]]],
  3: [[[0, 1], [2, 0], [8, 0], [10, 3], [10, 6], [7, 8], [3, 8]], [[7, 8], [10, 10], [10, 13], [8, 16], [2, 16], [0, 15]]],
  4: [[[7, 16], [7, 0], [0, 11], [10, 11]]],
  5: [[[10, 0], [1, 0], [0, 7], [7, 6], [10, 9], [10, 13], [8, 16], [2, 16], [0, 14]]],
  6: [[[9, 1], [6, 0], [3, 0], [0, 4], [0, 13], [2, 16], [8, 16], [10, 13], [10, 10], [8, 7], [2, 7], [0, 9]]],
  7: [[[0, 0], [10, 0], [4, 16]], [[3, 8], [8, 8]]],
  8: [[[5, 8], [1, 6], [1, 2], [3, 0], [7, 0], [9, 2], [9, 6], [5, 8], [0, 11], [0, 14], [2, 16], [8, 16], [10, 14], [10, 11], [5, 8]]],
  9: [[[10, 7], [8, 9], [2, 9], [0, 6], [0, 3], [2, 0], [8, 0], [10, 3], [10, 12], [7, 16], [3, 16], [1, 15]]],
};

const W = 200;
const H = 64;
const rand = (min, max) => min + crypto.randomInt(0, 1_000_000) / 1_000_000 * (max - min);
const round = (n) => Math.round(n * 10) / 10;
const COLORS = ['#3b1a4f', '#5c297c', '#4a3b5c', '#6b2d5c', '#2f3e5c', '#7a4a00'];
const pick = (list) => list[crypto.randomInt(0, list.length)];

function digitPaths(digit, x0) {
  const angle = rand(-0.3, 0.3);
  const sx = rand(1.9, 2.4);
  const sy = rand(1.95, 2.3);
  const cx = x0 + 5 * sx;
  const cy = H / 2 + rand(-4, 4);
  const color = pick(COLORS);
  const width = round(rand(2.6, 3.6));
  return GLYPHS[digit].map((stroke) => {
    const pts = stroke.map(([x, y]) => {
      const px = (x - 5) * sx + rand(-1.1, 1.1);
      const py = (y - 8) * sy + rand(-1.1, 1.1);
      return [round(cx + px * Math.cos(angle) - py * Math.sin(angle)), round(cy + px * Math.sin(angle) + py * Math.cos(angle))];
    });
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
    return `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
}

function noise() {
  const parts = [];
  for (let i = 0; i < 26; i += 1) {
    parts.push(`<circle cx="${round(rand(0, W))}" cy="${round(rand(0, H))}" r="${round(rand(0.8, 2.2))}" fill="${pick(COLORS)}" opacity="${round(rand(0.15, 0.4))}"/>`);
  }
  for (let i = 0; i < 3; i += 1) {
    const y1 = round(rand(8, H - 8));
    const y2 = round(rand(8, H - 8));
    parts.push(`<path d="M0 ${y1}Q${round(rand(40, W - 40))} ${round(rand(-20, H + 20))} ${W} ${y2}" stroke="${pick(COLORS)}" stroke-width="${round(rand(1.4, 2.2))}" fill="none" opacity="${round(rand(0.45, 0.7))}"/>`);
  }
  return parts;
}

function drawCode(code) {
  // 22px margin each side: a rotated digit never touches the edge.
  const step = (W - 44) / LENGTH;
  const digits = [...code].flatMap((d, i) => digitPaths(d, 22 + i * step + rand(0, step - 25)));
  // Some noise behind the digits, some (incl. the curves) on top so the strokes are not cleanly separable.
  const dots = noise();
  const behind = dots.slice(0, 20);
  const front = dots.slice(20);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="10" fill="#f6f2fa"/>${behind.join('')}${digits.join('')}${front.join('')}</svg>`;
}

const sign = (answer, exp, nonce) => crypto.createHmac('sha256', SECRET).update(`${answer}|${exp}|${nonce}`).digest('base64url');

export function createChallenge() {
  const code = Array.from({ length: LENGTH }, () => crypto.randomInt(0, 10)).join('');
  const exp = Date.now() + TTL_MS;
  const nonce = crypto.randomBytes(12).toString('base64url');
  return { id: `${exp}.${nonce}.${sign(code, exp, nonce)}`, image: drawCode(code), length: LENGTH, expiresInSeconds: TTL_MS / 1000 };
}

function prune(now) {
  for (const [nonce, exp] of used) if (exp < now) used.delete(nonce);
}

// 'ok' | 'missing' | 'expired' | 'wrong' | 'used'
export function checkChallenge(id, answer) {
  if (!id || !answer) return 'missing';
  const [expText, nonce, mac] = String(id).split('.');
  const exp = Number(expText);
  const now = Date.now();
  prune(now);
  if (!exp || !nonce || !mac) return 'wrong';
  if (exp < now) return 'expired';
  if (used.has(nonce)) return 'used';
  const expected = Buffer.from(sign(String(answer).replace(/\D/g, ''), exp, nonce));
  const given = Buffer.from(mac);
  // Burn the id on any attempt, so it can't be guessed repeatedly.
  used.set(nonce, exp);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? 'ok' : 'wrong';
}

const MESSAGES = {
  missing: 'Please type the numbers shown in the security check.',
  expired: 'The security code expired. Please type the new code.',
  used: 'Please type the new security code.',
  wrong: 'The security code did not match. Please try the new code.',
};

// Takes the code out of the body before validation (so the form's own schema stays unchanged).
function takeCaptcha(req, res, next) {
  req.captcha = {
    id: typeof req.body?.captchaId === 'string' ? req.body.captchaId.slice(0, 300) : '',
    answer: typeof req.body?.captchaAnswer === 'string' ? req.body.captchaAnswer.slice(0, 20) : '',
  };
  if (req.body) {
    delete req.body.captchaId;
    delete req.body.captchaAnswer;
  }
  next();
}

function checkCaptcha(req, res, next) {
  if (!env.captcha.enabled) return next();
  const result = checkChallenge(req.captcha?.id, req.captcha?.answer);
  if (result === 'ok') return next();
  const message = MESSAGES[result];
  return next(ApiError.badRequest(message, { captcha: message, reason: 'captcha' }));
}

// Use in place of the form's validator: router.post('/', limiter, ...withCaptcha(validate(schema)), handler).
// The form fields are validated first, so a typo in a field doesn't use up the code (each code works once).
export const withCaptcha = (validator) => [takeCaptcha, validator, checkCaptcha];

// Public: a new code. Never cached (each image is single-use).
export function captchaChallenge(req, res) {
  res.set('Cache-Control', 'no-store');
  if (!env.captcha.enabled) return res.json({ success: true, data: { enabled: false } });
  res.json({ success: true, data: { enabled: true, ...createChallenge() } });
}
