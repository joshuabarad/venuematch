/**
 * fetch-venues.mjs
 *
 * Monthly data pipeline: pulls venue data for East Village, Lower East Side,
 * and West Village from Google Places + Yelp, then dumps to CSV.
 *
 * Output: data/venues-raw.csv
 *
 * Required env vars:
 *   GOOGLE_PLACES_KEY   — Google Places API key (same one used in the app)
 *   YELP_API_KEY        — Yelp Fusion API key (free at yelp.com/developers)
 *
 * Usage:
 *   GOOGLE_PLACES_KEY=xxx YELP_API_KEY=xxx node scripts/fetch-venues.mjs
 *
 * Rate limits:
 *   Google Places: 1 req/s to stay well under quota
 *   Yelp Fusion:   500 calls/day on free tier — this script uses ~300 for reviews
 */

import { writeFileSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────

const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;
const YELP_KEY   = process.env.YELP_API_KEY;

if (!GOOGLE_KEY) { console.error('Missing GOOGLE_PLACES_KEY'); process.exit(1); }
if (!YELP_KEY)   { console.error('Missing YELP_API_KEY');   process.exit(1); }

const PLACES_SEARCH_URL  = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAIL_URL  = 'https://places.googleapis.com/v1/places';
const YELP_MATCH_URL     = 'https://api.yelp.com/v3/businesses/matches';
const YELP_REVIEWS_URL   = 'https://api.yelp.com/v3/businesses';

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

const GOOGLE_REVIEW_COUNT  = 5; // max Google returns free
const YELP_REVIEW_COUNT    = 3; // max Yelp returns on free tier
const DELAY_MS             = 1100; // ~1 req/s

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
  const body = {
    textQuery: `${query} ${locationArea} NYC`,
    locationBias: {
      circle: {
        center: { latitude: 40.7230, longitude: -73.9900 }, // downtown Manhattan center
        radius: 5000,
      },
    },
    maxResultCount: 20,
  };

  const res = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.shortFormattedAddress,places.types',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn(`  Google search failed (${res.status}) for "${query} ${locationArea}"`);
    return [];
  }

  const data = await res.json();
  return data.places || [];
}

// ── Google Places: details (description + hours + reviews) ────────────────────

async function fetchGoogleDetails(placeId) {
  const fieldMask = [
    'id',
    'displayName',
    'shortFormattedAddress',
    'addressComponents',
    'editorialSummary',
    'primaryTypeDisplayName',
    'types',
    'priceLevel',
    'rating',
    'regularOpeningHours',
    'reviews',
    'photos',
  ].join(',');

  const res = await fetch(`${PLACES_DETAIL_URL}/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': fieldMask,
    },
  });

  if (!res.ok) {
    console.warn(`  Google details failed (${res.status}) for ${placeId}`);
    return null;
  }

  return res.json();
}

function parseNeighborhood(addressComponents = []) {
  return (
    addressComponents.find(c => c.types?.includes('neighborhood'))?.longText ||
    addressComponents.find(c => c.types?.includes('sublocality_level_1'))?.longText ||
    ''
  );
}

function formatHours(regularOpeningHours) {
  if (!regularOpeningHours?.weekdayDescriptions?.length) return '';
  return regularOpeningHours.weekdayDescriptions.join(' | ');
}

function formatGoogleReviews(reviews = []) {
  return reviews
    .slice(0, GOOGLE_REVIEW_COUNT)
    .map(r => `[${r.rating}★ ${r.authorAttribution?.displayName || 'Anonymous'}]: ${r.text?.text || ''}`)
    .join(' ||| ');
}

// ── Yelp: business match ──────────────────────────────────────────────────────

async function fetchYelpMatch(name, address, neighborhood) {
  const params = new URLSearchParams({
    name,
    address1: address.split(',')[0] || '',
    city: 'New York City',
    state: 'NY',
    country: 'US',
    limit: '1',
  });

  const res = await fetch(`${YELP_MATCH_URL}?${params}`, {
    headers: { Authorization: `Bearer ${YELP_KEY}` },
  });

  if (!res.ok) {
    console.warn(`  Yelp match failed (${res.status}) for "${name}"`);
    return null;
  }

  const data = await res.json();
  return data.businesses?.[0] || null;
}

// ── Yelp: reviews ─────────────────────────────────────────────────────────────

async function fetchYelpReviews(yelpId) {
  const res = await fetch(`${YELP_REVIEWS_URL}/${yelpId}/reviews?limit=${YELP_REVIEW_COUNT}`, {
    headers: { Authorization: `Bearer ${YELP_KEY}` },
  });

  if (!res.ok) {
    console.warn(`  Yelp reviews failed (${res.status}) for ${yelpId}`);
    return [];
  }

  const data = await res.json();
  return data.reviews || [];
}

function formatYelpReviews(reviews = []) {
  return reviews
    .map(r => `[${r.rating}★ ${r.user?.name || 'Anonymous'}]: ${r.text || ''}`)
    .join(' ||| ');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== VenueMatch data pipeline ===\n');

  // Step 1: collect unique place IDs per neighborhood
  const byNeighborhood = {}; // neighborhood name → Set of place IDs
  const placeIdToNeighborhood = {}; // place ID → assigned neighborhood

  for (const hood of NEIGHBORHOODS) {
    const seen = new Set();
    byNeighborhood[hood.name] = seen;

    for (const angle of SEARCH_ANGLES) {
      console.log(`Searching: "${angle}" in ${hood.name}...`);
      const results = await searchGooglePlaces(angle, hood.city_area);
      for (const p of results) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          placeIdToNeighborhood[p.id] = hood.name;
        }
      }
      await sleep(DELAY_MS);
    }

    console.log(`  → ${seen.size} unique places in ${hood.name}\n`);
  }

  const allPlaceIds = Object.keys(placeIdToNeighborhood);
  console.log(`Total unique venues to enrich: ${allPlaceIds.length}\n`);

  // Step 2: fetch details + Yelp for each venue
  const CSV_HEADER = [
    'google_place_id',
    'name',
    'neighborhood',
    'address',
    'google_types',
    'google_price_level',
    'google_rating',
    'google_hours',
    'google_description',
    'google_reviews',
    'yelp_id',
    'yelp_name',
    'yelp_rating',
    'yelp_price',
    'yelp_categories',
    'yelp_reviews',
  ];

  const rows = [CSV_HEADER.join(',')];
  let processed = 0;

  for (const placeId of allPlaceIds) {
    const neighborhood = placeIdToNeighborhood[placeId];
    processed++;
    process.stdout.write(`[${processed}/${allPlaceIds.length}] Fetching details...`);

    // Google details
    const detail = await fetchGoogleDetails(placeId);
    await sleep(DELAY_MS);

    if (!detail) {
      process.stdout.write(' skipped (no details)\n');
      continue;
    }

    const name      = detail.displayName?.text || '';
    const address   = detail.shortFormattedAddress || '';
    const types     = (detail.types || []).join('; ');
    const price     = detail.priceLevel ?? '';
    const rating    = detail.rating ?? '';
    const hours     = formatHours(detail.regularOpeningHours);
    const desc      = detail.editorialSummary?.text || '';
    const gReviews  = formatGoogleReviews(detail.reviews);

    // Yelp match
    process.stdout.write(` → Yelp match...`);
    const yelpBiz  = await fetchYelpMatch(name, address, neighborhood);
    await sleep(DELAY_MS);

    let yelpId = '', yelpName = '', yelpRating = '', yelpPrice = '';
    let yelpCategories = '', yelpReviews = '';

    if (yelpBiz) {
      yelpId         = yelpBiz.id || '';
      yelpName       = yelpBiz.name || '';
      yelpRating     = yelpBiz.rating ?? '';
      yelpPrice      = yelpBiz.price || '';
      yelpCategories = (yelpBiz.categories || []).map(c => c.title).join('; ');

      // Yelp reviews
      const reviews  = await fetchYelpReviews(yelpId);
      yelpReviews    = formatYelpReviews(reviews);
      await sleep(DELAY_MS);
    }

    rows.push(rowToCSV([
      placeId,
      name,
      neighborhood,
      address,
      types,
      price,
      rating,
      hours,
      desc,
      gReviews,
      yelpId,
      yelpName,
      yelpRating,
      yelpPrice,
      yelpCategories,
      yelpReviews,
    ]));

    process.stdout.write(` ✓ ${name}\n`);

    // Write incrementally every 25 venues so partial progress is never lost
    if (processed % 25 === 0) {
      writeFileSync('data/venues-raw.csv', rows.join('\n'), 'utf8');
      console.log(`  → Saved checkpoint at ${processed} venues\n`);
    }
  }

  // Final write
  writeFileSync('data/venues-raw.csv', rows.join('\n'), 'utf8');
  console.log(`\n✓ Done. ${rows.length - 1} venues written to data/venues-raw.csv`);
}

main().catch(err => { console.error(err); process.exit(1); });
