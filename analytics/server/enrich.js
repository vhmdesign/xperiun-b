// Enriquecimento server-side: parse de user agent (device/browser/os) e geo por IP (offline).
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

// Normaliza o tipo de dispositivo do ua-parser para 3 buckets (como o Clarity).
function deviceType(parsed) {
  const t = parsed.device?.type;
  if (t === 'mobile') return 'mobile';
  if (t === 'tablet') return 'tablet';
  return 'desktop'; // ua-parser deixa desktop sem type
}

export function parseUserAgent(ua) {
  if (!ua) return { device_type: null, browser: null, os: null };
  const p = UAParser(ua);
  const browser = [p.browser?.name, p.browser?.version?.split('.')[0]].filter(Boolean).join(' ') || null;
  const os = [p.os?.name, p.os?.version].filter(Boolean).join(' ') || null;
  return { device_type: deviceType(p), browser, os };
}

// Pega o IP real do request, respeitando proxy reverso (x-forwarded-for) quando houver.
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || '';
}

// Geo offline via geoip-lite. IPs locais/privados retornam null (uso de teste).
export function geoFromIp(ip) {
  if (!ip) return { country: null, city: null };
  const clean = ip.replace(/^::ffff:/, ''); // IPv4 mapeado em IPv6
  if (clean === '127.0.0.1' || clean === '::1' || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(clean)) {
    return { country: null, city: null };
  }
  const g = geoip.lookup(clean);
  if (!g) return { country: null, city: null };
  return { country: g.country || null, city: g.city || null };
}
