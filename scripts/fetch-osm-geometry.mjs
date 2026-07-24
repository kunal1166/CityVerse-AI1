#!/usr/bin/env node
/**
 * FETCH REAL GEOMETRY FROM OPENSTREETMAP
 *
 * Run this ONCE. It downloads real road and metro geometry from OpenStreetMap
 * and writes it to server/data/osm-<city>.json. The app then reads those files -
 * there is NO live API call at runtime, so nothing can fail during your demo.
 *
 * Usage:
 *   node scripts/fetch-osm-geometry.mjs              # all three cities
 *   node scripts/fetch-osm-geometry.mjs singapore    # just one
 *
 * Takes 30-90 seconds per city. Overpass is a free public service - it is slow
 * and rate limited. Do not run this in a loop.
 *
 * Data (c) OpenStreetMap contributors, ODbL licence. You MUST credit them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'server', 'data');

// Public Overpass instances. We try them in order - the main one is often busy.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Overpass rejects requests without a descriptive User-Agent (HTTP 406).
// Node's bare fetch does not send a useful one, so we must set it explicitly.
const USER_AGENT = 'CityVerseAI/1.0 (smart-city dashboard; student project)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// [south, west, north, east] - the area we download for each city.
const CITIES = {
  singapore: { bbox: [1.20, 103.60, 1.48, 104.10], name: 'Singapore' },
  taipei:    { bbox: [24.95, 121.45, 25.15, 121.68], name: 'Taipei' },
  bengaluru: { bbox: [12.83, 77.45, 13.10, 77.78], name: 'Bengaluru' },
};

/**
 * Ramer-Douglas-Peucker simplification.
 * Raw OSM ways can carry thousands of points. This keeps the SHAPE of a road
 * (the curves, which is the whole point) while cutting the file size hard.
 */
function rdp(points, epsilon) {
  if (points.length < 3) return points;

  const [first] = points;
  const last = points[points.length - 1];

  let maxDist = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDistance(p, a, b) {
  const [py, px] = p;
  const [ay, ax] = a;
  const [by, bx] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Map an OSM highway tag onto the RoadType values the app already uses. */
function toRoadType(highway) {
  if (highway === 'motorway' || highway === 'motorway_link') return 'Highway';
  if (highway === 'trunk' || highway === 'trunk_link') return 'Highway';
  if (highway === 'primary' || highway === 'primary_link') return 'Primary';
  if (highway === 'secondary' || highway === 'secondary_link') return 'Secondary';
  return 'Residential';
}

async function overpass(query) {
  let lastErr;

  for (const url of ENDPOINTS) {
    // 429 means "busy, try again shortly" - worth retrying the same mirror.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        process.stdout.write(
          `      ${new URL(url).host}${attempt > 1 ? ` (retry ${attempt - 1})` : ''} ... `,
        );

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(180000),
        });

        if (res.status === 429 || res.status === 504) {
          console.log(`busy (HTTP ${res.status})`);
          if (attempt < 3) {
            const wait = attempt * 20;
            console.log(`      waiting ${wait}s before retry...`);
            await sleep(wait * 1000);
            continue;
          }
          throw new Error(`HTTP ${res.status} after 3 attempts`);
        }

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
        }

        const json = await res.json();
        console.log('ok');
        return json;
      } catch (err) {
        console.log(`failed (${err.message})`);
        lastErr = err;
        break; // move to the next mirror
      }
    }
  }
  throw lastErr || new Error('all Overpass endpoints failed');
}

async function fetchRoads(bbox) {
  const [s, w, n, e] = bbox;
  // `out geom` returns coordinates inline - far simpler than resolving node refs.
  const query = `
[out:json][timeout:180];
(
  way["highway"~"^(motorway|trunk|primary)$"](${s},${w},${n},${e});
);
out geom;`;

  const data = await overpass(query);
  const roads = [];

  for (const el of data.elements || []) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;

    const raw = el.geometry.map((g) => [g.lat, g.lon]);
    // epsilon ~0.0001 deg is roughly 11m - keeps curves, drops redundant points.
    const simplified = rdp(raw, 0.0001);

    roads.push({
      id: `osm-w-${el.id}`,
      name: el.tags?.name || el.tags?.ref || 'Unnamed Road',
      code: el.tags?.ref || '',
      roadType: toRoadType(el.tags?.highway),
      lanes: Number(el.tags?.lanes) || null,
      maxspeed: el.tags?.maxspeed || null,
      coordinates: simplified,
    });
  }
  return roads;
}

async function fetchMetro(bbox) {
  const [s, w, n, e] = bbox;
  const query = `
[out:json][timeout:180];
(
  relation["route"="subway"](${s},${w},${n},${e});
  relation["route"="light_rail"](${s},${w},${n},${e});
);
out geom;`;

  const data = await overpass(query);
  const lines = [];

  for (const el of data.elements || []) {
    if (el.type !== 'relation') continue;

    // A route relation is made of many member ways; keep each as its own path.
    const segments = [];
    for (const m of el.members || []) {
      if (m.type === 'way' && m.geometry && m.geometry.length > 1) {
        segments.push(rdp(m.geometry.map((g) => [g.lat, g.lon]), 0.00008));
      }
    }
    if (segments.length === 0) continue;

    lines.push({
      id: `osm-r-${el.id}`,
      name: el.tags?.name || el.tags?.ref || 'Unnamed Line',
      ref: el.tags?.ref || '',
      // OSM often stores the official line colour. Use it when present.
      color: el.tags?.colour || el.tags?.color || null,
      segments,
    });
  }
  return lines;
}

async function fetchStations(bbox) {
  const [s, w, n, e] = bbox;
  const query = `
[out:json][timeout:180];
(
  node["railway"="station"](${s},${w},${n},${e});
  node["railway"="halt"](${s},${w},${n},${e});
);
out body;`;

  const data = await overpass(query);
  return (data.elements || [])
    .filter((el) => el.type === 'node' && el.tags?.name)
    .map((el) => ({
      id: `osm-n-${el.id}`,
      name: el.tags.name,
      coordinates: [el.lat, el.lon],
      isInterchange: Boolean(el.tags.interchange) || /interchange/i.test(el.tags.name),
      operator: el.tags.operator || null,
    }));
}

async function run() {
  const requested = process.argv[2];
  const targets = requested ? { [requested]: CITIES[requested] } : CITIES;

  if (requested && !CITIES[requested]) {
    console.error(`Unknown city "${requested}". Options: ${Object.keys(CITIES).join(', ')}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let cityIndex = 0;
  for (const [id, cfg] of Object.entries(targets)) {
    if (cityIndex++ > 0) {
      console.log('\n  pausing 10s between cities...');
      await sleep(10000);
    }
    console.log(`\n=== ${cfg.name} ===`);

    try {
      console.log('  roads...');
      const roads = await fetchRoads(cfg.bbox);
      console.log(`      ${roads.length} road ways`);

      await sleep(5000); // be polite - Overpass is a free shared service
      console.log('  metro lines...');
      const metroLines = await fetchMetro(cfg.bbox);
      console.log(`      ${metroLines.length} metro/light rail routes`);

      await sleep(5000);
      console.log('  stations...');
      const stations = await fetchStations(cfg.bbox);
      console.log(`      ${stations.length} stations`);

      const payload = {
        city: id,
        generatedAt: new Date().toISOString(),
        attribution: '(c) OpenStreetMap contributors, ODbL',
        roads,
        metroLines,
        stations,
      };

      const file = path.join(OUT_DIR, `osm-${id}.json`);
      fs.writeFileSync(file, JSON.stringify(payload));
      const kb = Math.round(fs.statSync(file).size / 1024);
      console.log(`  -> wrote ${file} (${kb} KB)`);
    } catch (err) {
      console.error(`  !! ${cfg.name} failed: ${err.message}`);
      console.error('     The app will fall back to its built-in road data for this city.');
    }
  }

  console.log('\nDone. Restart the dev server to pick up the new geometry.\n');
}

run();
