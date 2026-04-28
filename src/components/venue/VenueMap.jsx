import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VENUE_COORDS } from '../../data/venueCoords.js';

function makePin(active) {
  const size = active ? 14 : 10;
  const color = active ? '#a78bfa' : '#7c3aed';
  const glow = active
    ? '0 0 10px rgba(167,139,250,0.9)'
    : '0 2px 6px rgba(124,58,237,0.6)';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,0.85);box-shadow:${glow}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function VenueMap({ venues, activeVenueId, onMarkerClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

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

    // Add or update markers
    for (const v of venues) {
      const coords = VENUE_COORDS[v.id];
      if (!coords) continue;
      if (existing[v.id]) {
        existing[v.id].setIcon(makePin(v.id === activeVenueId));
      } else {
        const m = L.marker(coords, { icon: makePin(v.id === activeVenueId) }).addTo(map);
        m.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onMarkerClick(v);
        });
        existing[v.id] = m;
      }
    }
    markersRef.current = existing;
  }, [venues, activeVenueId]);

  // Update pin styles when active venue changes without re-creating markers
  useEffect(() => {
    for (const [id, marker] of Object.entries(markersRef.current)) {
      marker.setIcon(makePin(id === activeVenueId));
    }
  }, [activeVenueId]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
