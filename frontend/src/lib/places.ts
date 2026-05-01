import type { Venue, CustomSeedVenue } from '@venuematch/shared';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

let enrichedVenueCache: Venue[] | null = null;
let enrichVenuePromise: Promise<Venue[]> | null = null;

interface PlacePhoto {
  name: string;
}

interface PlaceResult {
  id?: string;
  photos?: PlacePhoto[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: { openNow?: boolean };
  editorialSummary?: { text?: string };
  displayName?: { text?: string };
  shortFormattedAddress?: string;
  addressComponents?: Array<{ types?: string[]; longText?: string }>;
  primaryTypeDisplayName?: { text?: string };
}

interface PlacesResponse {
  places?: PlaceResult[];
}

async function fetchVenueData(
  name: string,
  key: string
): Promise<Partial<Venue>> {
  try {
    const r = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.id,places.photos,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.editorialSummary',
      },
      body: JSON.stringify({
        textQuery: `${name} NYC nightlife`,
        locationBias: {
          circle: {
            center: { latitude: 40.7128, longitude: -74.006 },
            radius: 40000,
          },
        },
        maxResultCount: 1,
      }),
    });
    const d = (await r.json()) as PlacesResponse;
    const place = d.places?.[0];
    if (!place) return {};
    const photo = place.photos?.[0];
    return {
      photo: photo
        ? `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=200&key=${key}`
        : null,
      googleRating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? 0,
      isOpenNow: place.regularOpeningHours?.openNow ?? null,
      editorialSummary: place.editorialSummary?.text ?? null,
    };
  } catch {
    return {};
  }
}

export async function enrichCuratedVenues(venues: Venue[]): Promise<Venue[]> {
  if (enrichedVenueCache) return enrichedVenueCache;
  if (enrichVenuePromise) return enrichVenuePromise;
  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
  if (!key) return venues;
  enrichVenuePromise = Promise.all(
    venues.map(async (v) => {
      const data = await fetchVenueData(v.name, key);
      return { ...v, ...data };
    })
  ).then((results) => {
    enrichedVenueCache = results;
    return results;
  });
  return enrichVenuePromise;
}

function extractNeighborhood(address: string): string {
  const parts = address.split(',').map((s) => s.trim());
  const nyIndex = parts.findIndex(
    (p) => /^New York/i.test(p) || /^NY\s/i.test(p)
  );
  if (nyIndex > 1) return parts[nyIndex - 1];
  if (parts.length >= 2)
    return parts[parts.length - 2].replace(/\s+NY.*/, '').trim();
  return address;
}

export async function searchVenues(query: string): Promise<CustomSeedVenue[]> {
  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
  if (!key || !query || query.length < 2) return [];
  try {
    const r = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.shortFormattedAddress,places.addressComponents,places.photos,places.primaryTypeDisplayName,places.types',
      },
      body: JSON.stringify({
        textQuery: `${query} bar club venue NYC`,
        locationBias: {
          circle: {
            center: { latitude: 40.7128, longitude: -74.006 },
            radius: 40000,
          },
        },
        maxResultCount: 10,
      }),
    });
    const d = (await r.json()) as PlacesResponse;
    return (d.places || []).map((p) => {
      const components = p.addressComponents || [];
      const neighborhood =
        components.find((c) => c.types?.includes('neighborhood'))?.longText ||
        components.find((c) =>
          c.types?.includes('sublocality_level_1')
        )?.longText ||
        components.find((c) => c.types?.includes('locality'))?.longText ||
        extractNeighborhood(p.shortFormattedAddress || '');
      return {
        id: p.id ?? '',
        name: p.displayName?.text ?? '',
        neighborhood: neighborhood ?? '',
        address: p.shortFormattedAddress ?? '',
        photo: p.photos?.[0]
          ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=200&key=${key}`
          : null,
        source: 'google',
      };
    });
  } catch {
    return [];
  }
}
