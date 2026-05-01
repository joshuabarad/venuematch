/**
 * fetch-venues.mjs
 *
 * Monthly data pipeline: pulls venue data for East Village, Lower East Side,
 * and West Village from Google Places, then dumps to CSV.
 *
 * Output: data/venues-raw.csv
 *
 * Required env vars:
 *   GOOGLE_PLACES_KEY — Google Places API key (same one used in the app)
 *
 * Usage:
 *   GOOGLE_PLACES_KEY=xxx node scripts/fetch-venues.mjs
 *
 * Rate limits:
 *   Google Places Text Search: 1 req/s keeps well under quota
 *   Google Places Details:     1 req/s, ~300 calls total per run
 */

import { writeFileSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────

const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;
if (!GOOGLE_KEY) { console.error('Missing GOOGLE_PLACES_KEY'); process.exit(1); }

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAIL_URL = 'https://places.googleapis.com/v1/places';

// Target: ~100 venues per neighborhood via 5 search angles × 20 results each
const NEIGHBORHOODS = [
  { name: 'East Village',    city_area: 'East Village, Manhattan' },
  { name: 'Lower East Side', city_area: 'Lower East Side, Manhattan' },
  { name: 'West Village',    city_area: 'West Village, Manhattan' },
];

const SEARCH_ANGLES = [
  'bars',
  'nightclubs',
  'music venues',
  'cocktail bars',
  'dive bars',
];

const DELAY_MS = 1100; // ~1 req/s

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function escapeCSV(val) {
  if (val == null) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function rowToCSV(cols) {
  return cols.map(escapeCSV).join(',');
}

// ── Google Places: search ─────────────────────────────────────────────────────

async function searchGooglePlaces(query, locationArea) {
  const res = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.shortFormattedAddress,places.types',
    },
    body: JSON.stringify({
      textQuery: `${query} ${locationArea} NYC`,
      locationBias: {
        circle: {
          center: { latitude: 40.7230, longitude: -73.9900 },
          radius: 5000,
        },
      },
      maxResultCount: 20,
    }),
  });

  if (!res.ok) {
    console.warn(`  Search failed (${res.status}) for "${query} ${locationArea}"`);
    return [];
  }

  const data = await res.json();
  return data.places || [];
}

// ── Google Places: details + reviews ─────────────────────────────────────────

async function fetchGoogleDetails(placeId) {
  const res = await fetch(`${PLACES_DETAIL_URL}/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'shortFormattedAddress',
        'addressComponents',
        'editorialSummary',
        'primaryTypeDisplayName',
        'types',
        'priceLevel',
        'rating',
        'userRatingCount',
        'regularOpeningHours',
        'reviews',
      ].join(','),
    },
  });

  if (!res.ok) {
    console.warn(`  Details failed (${res.status}) for ${placeId}`);
    return null;
  }

  return res.json();
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours?.weekdayDescriptions?.length) return '';
  return regularOpeningHours.weekdayDescriptions.join(' | ');
}

function formatReviews(reviews = []) {
  // Dump up to 5 reviews as a single cell, pipe-delimited, with rating + author + text
  return reviews
    .slice(0, 5)
    .map(r => `[${r.rating}★ ${r.authorAttribution?.displayName || 'Anonymous'}]: ${r.text?.text || ''}`)
    .join(' ||| ');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== VenueMatch data pipeline ===\n');

  // Step 1: collect unique place IDs across all neighborhoods + search angles
  const placeIdToNeighborhood = {};

  for (const hood of NEIGHBORHOODS) {
    const seen = new Set();

    for (const angle of SEARCH_ANGLES) {
      console.log(`Searching: "${angle}" in ${hood.name}...`);
      const results = await searchGooglePlaces(angle, hood.city_area);

      for (const p of results) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          // Only assign neighborhood on first encounter
          if (!placeIdToNeighborhood[p.id]) {
            placeIdToNeighborhood[p.id] = hood.name;
          }
        }
      }

      await sleep(DELAY_MS);
    }

    console.log(`  → ${seen.size} unique places in ${hood.name}\n`);
  }

  const allPlaceIds = Object.keys(placeIdToNeighborhood);
  console.log(`Total unique venues to enrich: ${allPlaceIds.length}\n`);

  // Step 2: fetch details for each venue
  const CSV_HEADER = [
    'google_place_id',
    'name',
    'neighborhood',
    'address',
    'primary_type',
    'google_types',
    'price_level',
    'google_rating',
    'review_count',
    'hours',
    'description',
    'google_reviews',
  ];

  const rows = [CSV_HEADER.join(',')];
  let processed = 0;

  for (const placeId of allPlaceIds) {
    const neighborhood = placeIdToNeighborhood[placeId];
    processed++;
    process.stdout.write(`[${processed}/${allPlaceIds.length}] ${neighborhood} — fetching...`);

    const detail = await fetchGoogleDetails(placeId);
    await sleep(DELAY_MS);

    if (!detail) {
      process.stdout.write(' skipped\n');
      continue;
    }

    rows.push(rowToCSV([
      placeId,
      detail.displayName?.text || '',
      neighborhood,
      detail.shortFormattedAddress || '',
      detail.primaryTypeDisplayName?.text || '',
      (detail.types || []).join('; '),
      detail.priceLevel ?? '',
      detail.rating ?? '',
      detail.userRatingCount ?? '',
      formatHours(detail.regularOpeningHours),
      detail.editorialSummary?.text || '',
      formatReviews(detail.reviews),
    ]));

    process.stdout.write(` ✓ ${detail.displayName?.text || placeId}\n`);

    // Checkpoint every 25 venues so a partial run is never lost
    if (processed % 25 === 0) {
      writeFileSync('data/venues-raw.csv', rows.join('\n'), 'utf8');
      console.log(`  → Checkpoint saved (${processed} venues)\n`);
    }
  }

  writeFileSync('data/venues-raw.csv', rows.join('\n'), 'utf8');
  console.log(`\n✓ Done. ${rows.length - 1} venues written to data/venues-raw.csv`);
}

main().catch(err => { console.error(err); process.exit(1); });
