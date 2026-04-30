import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VENUE_COORDS } from '../../data/venueCoords.js';

function scoreColor(score) {
  if (score >= 92) return { fill: '#e879f9', glow: 'rgba(232,121,249,0.8)' }; // fuchsia
  if (score >= 85) return { fill: '#a78bfa', glow: 'rgba(167,139,250,0.7)' }; // purple
  if (score >= 75) return { fill: '#818cf8', glow: 'rgba(129,140,248,0.6)' }; // indigo
  return { fill: '#475569', glow: 'rgba(71,85,105,0.4)' };                    // slate
}

function makePin(active, score = 75) {
  const { fill, glow } = scoreColor(score);
  const size = active ? 15 : score >= 90 ? 12 : 10;
  const border = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)';
  const shadow = active
    ? `0 0 12px ${glow}, 0 0 4px rgba(255,255,255,0.4)`
    : `0 0 6px ${glow}`;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${active ? '#fff' : fill};border-radius:50%;border:2px solid ${border};box-shadow:${shadow};transition:all 0.2s"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function VenueMap({ venues, activeVenueId, onMarkerClick, scores = {} }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const venuesRef = useRef({});

  // Init map once
  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [40.706, -73.948],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

    // Close active venue on map click
    mapRef.current.on('click', () => onMarkerClick(null));

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Sync markers whenever venues list changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existing = markersRef.current;
    const nextIds = new Set(venues.map(v => v.id));

    // Remove markers no longer in the list
    for (const id of Object.keys(existing)) {
      if (!nextIds.has(id)) {
        existing[id].remove();
        delete existing[id];
      }
    }

    // Keep venuesRef up-to-date so click handlers always get enriched data
    for (const v of venues) venuesRef.current[v.id] = v;

    // Add or update markers
    for (const v of venues) {
      const coords = VENUE_COORDS[v.id];
      if (!coords) continue;
      const score = scores[v.id] ?? 75;
      if (existing[v.id]) {
        existing[v.id].setIcon(makePin(v.id === activeVenueId, score));
      } else {
        const m = L.marker(coords, { icon: makePin(v.id === activeVenueId, score) }).addTo(map);
        m.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onMarkerClick(venuesRef.current[v.id] ?? v);
        });
        existing[v.id] = m;
      }
    }
    markersRef.current = existing;
  }, [venues, activeVenueId]);

  // Update pin styles when active venue or scores change
  useEffect(() => {
    for (const [id, marker] of Object.entries(markersRef.current)) {
      marker.setIcon(makePin(id === activeVenueId, scores[id] ?? 75));
    }
  }, [activeVenueId, scores]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
