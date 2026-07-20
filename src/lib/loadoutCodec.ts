import type { LoadoutPack } from '../types';
import { sanitizeIds } from './loadoutIds';

export { sanitizeIds, validProjectIds, parseIdsParam } from './loadoutIds';

interface WirePack {
  v: 1;
  n?: string;
  i: number[];
}

export function parseLoadoutPack(json: unknown): LoadoutPack {
  if (typeof json === 'string') {
    try {
      return parseLoadoutPack(JSON.parse(json));
    } catch {
      throw new Error('Invalid JSON');
    }
  }
  if (!json || typeof json !== 'object') throw new Error('Invalid loadout pack');
  const obj = json as Record<string, unknown>;
  if (obj.version !== 1) throw new Error('Unsupported loadout version');
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : undefined;
  const ids = sanitizeIds(obj.ids);
  if (ids.length === 0) throw new Error('Loadout must contain at least one valid project id');
  return { version: 1, ...(name ? { name } : {}), ids };
}

export function serializeLoadoutPack(pack: LoadoutPack): string {
  return JSON.stringify(pack, null, 2);
}

function toWire(pack: LoadoutPack): WirePack {
  return { v: 1, ...(pack.name ? { n: pack.name } : {}), i: pack.ids };
}

function fromWire(wire: WirePack): LoadoutPack {
  const ids = sanitizeIds(wire.i);
  if (ids.length === 0) throw new Error('Loadout must contain at least one valid project id');
  const name = typeof wire.n === 'string' && wire.n.trim() ? wire.n.trim() : undefined;
  return { version: 1, ...(name ? { name } : {}), ids };
}

function parseWireJson(json: string): WirePack {
  const parsed = JSON.parse(json) as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid pack payload');
  const wire = parsed as Record<string, unknown>;
  if (wire.v !== 1 || !Array.isArray(wire.i)) throw new Error('Invalid pack payload');
  return { v: 1, ...(typeof wire.n === 'string' ? { n: wire.n } : {}), i: wire.i as number[] };
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(param: string): string {
  const padded = param.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function deflateBytes(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  await writer.write(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  await writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function inflateBytes(input: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  await writer.write(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  await writer.close();
  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** URL-safe base64 of minified wire JSON. */
export function encodePackParam(pack: LoadoutPack): string {
  return base64UrlEncode(JSON.stringify(toWire(pack)));
}

/** Compress when raw encoding exceeds ~120 chars (prefixed with `z.`). */
export async function encodePackParamCompressed(pack: LoadoutPack): Promise<string> {
  const plain = encodePackParam(pack);
  if (plain.length <= 120) return plain;
  const wireJson = JSON.stringify(toWire(pack));
  const deflated = await deflateBytes(new TextEncoder().encode(wireJson));
  let binary = '';
  deflated.forEach((b) => { binary += String.fromCharCode(b); });
  return `z.${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function decodePackParamSync(param: string): LoadoutPack {
  if (param.startsWith('z.')) {
    throw new Error('Compressed pack requires async decode');
  }
  return fromWire(parseWireJson(base64UrlDecode(param)));
}

export async function decodePackParam(param: string): Promise<LoadoutPack> {
  if (param.startsWith('z.')) {
    const b64 = param.slice(2).replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (b64.length % 4)) % 4;
    const binary = atob(b64 + '='.repeat(padLen));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const inflated = await inflateBytes(bytes);
    const json = new TextDecoder().decode(inflated);
    return fromWire(parseWireJson(json));
  }
  return decodePackParamSync(param);
}

export function buildShareUrl(ids: number[], name?: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  if (name) {
    const pack = encodePackParam({ version: 1, name, ids });
    return `${origin}${pathname}?pack=${pack}`;
  }
  return `${origin}${pathname}?ids=${ids.join(',')}`;
}
