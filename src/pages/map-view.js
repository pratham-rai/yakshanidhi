import { getApprovedEvents } from '../data.js';
import { navigate } from '../router.js';
import { formatShortDate, formatTime, isUpcoming } from '../utils/date.js';

export async function renderMapView(container) {
  container.innerHTML = `
    <div class="page-wrapper animate-fade-in-up">
      <div class="page-header">
        <h1>🗺️ Event Map</h1>
        <p>Loading events...</p>
      </div>
      <div id="main-map" class="map-container" style="height:calc(100vh - 220px);min-height:400px">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted)">Loading map...</div>
      </div>
    </div>
  `;

  let events = [];
  try {
    const all = await getApprovedEvents();
    events = all.filter(e => e.latitude && e.longitude && isUpcoming(e.date));
  } catch (err) {
    console.error('Failed to load events for map:', err);
  }

  // Update subtitle
  container.querySelector('.page-header p').textContent = `${events.length} events with location data`;

  try {
    const leaflet = await import('leaflet');
    const L = leaflet.default || leaflet;
    const mapEl = document.getElementById('main-map');
    if (!mapEl) return;
    mapEl.innerHTML = '';

    const map = L.map(mapEl).setView([13.2, 74.9], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const icon = L.divIcon({
      html: '<div style="background:linear-gradient(135deg,#E8751A,#F4A623);width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(232,117,26,0.4)"><img src="/logo.png" style="width:16px;height:16px;transform:rotate(45deg);object-fit:contain" /></div>',
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32], className: '',
    });

    events.forEach(event => {
      L.marker([event.latitude, event.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px;font-family:Outfit,sans-serif">
            <strong style="font-size:1rem">${event.prasanga}</strong>
            ${event.troupe ? `<br><span style="color:#666">🎪 ${event.troupe}</span>` : ''}
            <br><span style="color:#666">📅 ${formatShortDate(event.date)} · ${formatTime(event.time)}</span>
            <br><span style="color:#666">📍 ${event.location}</span>
            <br><a href="#/event/${event.id}" style="color:#E8751A;font-weight:600">View Details →</a>
          </div>
        `);
    });

    if (events.length > 0) {
      const bounds = L.latLngBounds(events.map(e => [e.latitude, e.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    setTimeout(() => map.invalidateSize(), 200);
  } catch (e) {
    console.warn('Map init failed:', e);
  }
}
