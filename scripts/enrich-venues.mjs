/**
 * enrich-venues.mjs
 *
 * Standalone enrichment pass: reads an existing venues-raw.csv (or any CSV with
 * the expected columns), calls Claude Haiku for each row that is missing a
 * `vectors` column, and writes an enriched output CSV.
 *
 * Use this to add vectors to a CSV without re-fetching Google Places data.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY — Claude API key
 *
 * Usage:
 *   node --env-file=.env scripts/enrich-venues.mjs [input.csv] [output.csv]
 *   Defaults: data/venues-raw.csv → data/venues-enriched.csv
 *
 * Rate limits:
 *   Claude Haiku: ~3 req/s, well within limits
 */

import { readFileSync, writeFileSync } from 'fs';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY — run with: node --env-file=.env scripts/enrich-venues.mjs');
  process.exit(1);
}

const inputFile  = process.argv[2] || 'data/venues-raw.csv';
const outputFile = process.argv[3] || 'data/venues-enriched.csv';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSV(raw) {
  const lines = raw.split('\n').filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).map((line) => {
      const vals = parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return obj;
    }),
  };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function escapeCSV(val) {
  if (val == null) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// ── Claude Haiku enrichment ──────────────────────────────────────────────────

async function enrichWithClaude({ name, description, types, reviews, priceLevel, rating }) {
  const reviewSnippets = reviews
    .slice(0, 5)
    .map((r) => `"${r}"`)
    .join('\n');

  const prompt = `You are a NYC nightlife data enricher. Analyze this venue and return a VenueVector JSON.

Venue: ${name}
Description: ${description || 'none'}
Google types: ${types}
Price level: ${priceLevel || 'unknown'} (1=free, 2=moderate, 3=expensive, 4=very expensive)
Google rating: ${rating || 'unknown'}
Recent reviews:
${reviewSnippets || 'No reviews available'}

Return ONLY valid JSON (no markdown, no explanation):
{
  "genres": ["3-6 specific lowercase genre tags like techno, hip-hop, indie rock, jazz, house, r&b"],
  "vibe": [energy_0_to_1, underground_0_to_1, social_0_to_1, dance_0_to_1],
  "cost": 1_to_4
}

Vibe dimensions (0-1):
- energy:      0=mellow lounge, 1=high-energy club
- underground: 0=mainstream/commercial, 1=underground/alternative
- social:      0=focused listening crowd, 1=mixer/meetup
- dance:       0=standing bar, 1=dance floor focus

Cost: match the price_level (null=cost 1-2, 1=cost 1, 2=cost 2, 3=cost 3, 4=cost 4)`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  const json = text.replace(/```json|```/g, '').trim();
  const vectors = JSON.parse(json);
  vectors.vibe = vectors.vibe.map((v) => Math.max(0, Math.min(1, Number(v))));
  vectors.cost = Math.max(1, Math.min(4, Math.round(Number(vectors.cost))));
  return vectors;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${inputFile}…`);
  let raw;
  try {
    raw = readFileSync(inputFile, 'utf8');
  } catch {
    console.error(`Cannot read ${inputFile}. Run fetch-venues.mjs first.`);
    process.exit(1);
  }

  const { headers, rows } = parseCSV(raw);

  // Ensure vectors column exists in headers
  const outHeaders = headers.includes('vectors')
    ? headers
    : [...headers, 'vectors'];

  const outRows = [outHeaders.join(',')];
  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row['name'] || `row ${i}`;
    process.stdout.write(`[${i + 1}/${rows.length}] ${name}… `);

    // Skip rows that already have vectors
    if (row['vectors'] && row['vectors'].trim() !== '') {
      process.stdout.write('already enriched\n');
      skipped++;
      outRows.push(outHeaders.map((h) => escapeCSV(row[h] ?? '')).join(','));
      continue;
    }

    try {
      const vectors = await enrichWithClaude({
        name,
        description: row['description'] || '',
        types: row['google_types'] || '',
        reviews: (row['google_reviews'] || '').split(' ||| ').filter(Boolean),
        priceLevel: row['price_level'],
        rating: row['google_rating'],
      });
      row['vectors'] = JSON.stringify(vectors);
      process.stdout.write(`✦ enriched\n`);
      enriched++;
    } catch (err) {
      process.stdout.write(`✗ failed: ${err.message}\n`);
      row['vectors'] = '';
      failed++;
    }

    outRows.push(outHeaders.map((h) => escapeCSV(row[h] ?? '')).join(','));

    // Checkpoint every 50 rows
    if ((i + 1) % 50 === 0) {
      writeFileSync(outputFile, outRows.join('\n'), 'utf8');
      console.log(`  → Checkpoint: ${i + 1} rows processed\n`);
    }

    await sleep(350); // ~3 req/s
  }

  writeFileSync(outputFile, outRows.join('\n'), 'utf8');
  console.log(`\n✓ Done.`);
  console.log(`  Enriched: ${enriched} | Already done: ${skipped} | Failed: ${failed}`);
  console.log(`  Output: ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
