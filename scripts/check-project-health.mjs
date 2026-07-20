/**
 * Build-time catalog reachability probe.
 * Fetches each project.url (HEAD, GET fallback), writes src/data/projectHealth.json.
 *
 * Privacy: server-side / CI only — no browser requests, no user tracking.
 * Does not fail the build when nodes are degraded; use --strict to exit non-zero.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsPath = path.join(__dirname, '../src/data/projects.json');
const outputPath = path.join(__dirname, '../src/data/projectHealth.json');

const TIMEOUT_MS = 12_000;
const CONCURRENCY = 5;
const USER_AGENT = 'go1inkus-health-check/1.0 (+https://go.1ink.us)';

const VALID_HEALTH = new Set(['live', 'degraded', 'unknown']);

function classifyStatus(httpStatus) {
  if (httpStatus >= 200 && httpStatus < 400) return 'live';
  if (httpStatus >= 400) return 'degraded';
  return 'unknown';
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function probeUrl(url) {
  const checkedAt = new Date().toISOString();
  const start = Date.now();

  try {
    let response = await fetchWithTimeout(url, 'HEAD');

    if (response.status === 405 || response.status === 501) {
      response = await fetchWithTimeout(url, 'GET');
    }

    const latencyMs = Date.now() - start;
    const health = classifyStatus(response.status);

    return {
      health,
      httpStatus: response.status,
      latencyMs,
      checkedAt,
      error: null,
    };
  } catch (err) {
    try {
      const response = await fetchWithTimeout(url, 'GET');
      const latencyMs = Date.now() - start;
      const health = classifyStatus(response.status);
      return {
        health,
        httpStatus: response.status,
        latencyMs,
        checkedAt,
        error: null,
      };
    } catch (retryErr) {
      return {
        health: 'unknown',
        httpStatus: null,
        latencyMs: null,
        checkedAt,
        error: retryErr instanceof Error ? retryErr.message : String(retryErr),
      };
    }
  }
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function resolveEffectiveHealth(project, probe) {
  if (project.healthOverride && VALID_HEALTH.has(project.healthOverride)) {
    return {
      health: project.healthOverride,
      httpStatus: probe.httpStatus,
      latencyMs: probe.latencyMs,
      checkedAt: probe.checkedAt,
      error: probe.error,
      overridden: true,
    };
  }
  return { ...probe, overridden: false };
}

async function main() {
  const strict = process.argv.includes('--strict');
  const projects = JSON.parse(readFileSync(projectsPath, 'utf8'));

  console.log(`Probing ${projects.length} catalog URLs (timeout ${TIMEOUT_MS}ms)...`);

  const probes = await mapPool(projects, CONCURRENCY, async (project) => {
    process.stdout.write(`  • ${project.title} ... `);
    const probe = await probeUrl(project.url);
    const effective = resolveEffectiveHealth(project, probe);
    console.log(`${effective.health.toUpperCase()}${effective.httpStatus ? ` (${effective.httpStatus})` : ''}`);
    return { id: project.id, ...effective };
  });

  const projectsMap = {};
  const summary = { live: 0, degraded: 0, unknown: 0, total: projects.length };

  for (const entry of probes) {
    projectsMap[String(entry.id)] = {
      health: entry.health,
      httpStatus: entry.httpStatus,
      latencyMs: entry.latencyMs,
      checkedAt: entry.checkedAt,
      error: entry.error,
    };
    summary[entry.health] += 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: process.env.CI ? 'ci' : 'local',
    projects: projectsMap,
    summary,
  };

  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log('\n--- Health summary ---');
  console.log(`  LIVE:      ${summary.live}`);
  console.log(`  DEGRADED:  ${summary.degraded}`);
  console.log(`  UNKNOWN:   ${summary.unknown}`);
  console.log(`  Written:   ${outputPath}`);

  if (strict && (summary.degraded > 0 || summary.unknown > 0)) {
    console.error('\nStrict mode: unreachable or degraded nodes detected.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Health check failed:', err);
  process.exit(1);
});
