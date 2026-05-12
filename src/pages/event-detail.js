import { getEventById } from '../data.js';
import { formatDate, formatTime } from '../utils/date.js';
import { thittuBadgeClass } from '../utils/constants.js';

export async function renderEventDetail(container, params) {
  // Loading state
  container.innerHTML = `
    <div class="page-wrapper" style="display:flex;align-items:center;justify-content:center;min-height:50vh">
      <div style="text-align:center"><img src="/logo.png" style="width:64px;height:64px;margin-bottom:12px;object-fit:contain;animation:pulse 2s infinite" /><p style="color:var(--text-secondary)">Loading event...</p></div>
    </div>
  `;

  const event = await getEventById(params.id);

  if (!event) {
    container.innerHTML = `
      <div class="page-wrapper">
        <div class="empty-state animate-fade-in-up">
          <div class="empty-icon">🔍</div>
          <h3>Event Not Found</h3>
          <p>This event may have been removed or doesn't exist.</p>
          <br><a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      </div>
    `;
    return;
  }

  const hasCoords = event.latitude && event.longitude;
  const mapLink = event.googleMapsLink || (hasCoords ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}` : '');
  const submittedDate = event.submittedAt ? new Date(event.submittedAt).toLocaleDateString() : '';

  container.innerHTML = `
    <div class="page-wrapper animate-fade-in-up">
      <button class="btn btn-ghost" id="back-btn" style="margin-bottom:20px">← Back to Events</button>

      <div class="card-strong" style="overflow:hidden">
        <!-- Poster / Header -->
        <div style="background:linear-gradient(135deg, var(--bg-elevated), var(--bg-card));padding:48px 32px;text-align:center;position:relative">
          ${event.posterUrls && event.posterUrls.length > 0
            ? `<img src="${event.posterUrls[0]}" alt="${event.prasanga}" style="max-height:300px;border-radius:var(--radius-md);margin:0 auto 16px" />`
            : `<img src="/logo.png" alt="Placeholder" style="display:block;margin:0 auto 16px auto;width:120px;height:120px;object-fit:contain;opacity:0.3" />`}
          <span class="${thittuBadgeClass(event.thittu)}" style="font-size:0.85rem;padding:6px 16px">${event.thittu}</span>
          <h1 style="font-size:2rem;font-weight:800;margin-top:16px;background:linear-gradient(135deg,var(--text-primary),var(--accent-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${event.prasanga}</h1>
          ${event.troupe ? `<p style="color:var(--text-secondary);font-size:1.1rem;margin-top:8px">🎪 ${event.troupe}</p>` : ''}
        </div>

        <div style="padding:32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px">
          <div class="card" style="padding:20px">
            <div style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">📅 Date & Time</div>
            <div style="font-size:1.1rem;font-weight:600">${formatDate(event.date)}</div>
            <div style="color:var(--accent-light);font-size:1rem;margin-top:4px">${formatTime(event.time)}</div>
          </div>
          <div class="card" style="padding:20px">
            <div style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">📍 Location</div>
            <div style="font-size:1.1rem;font-weight:600">${event.location}</div>
            ${mapLink ? `<a href="${mapLink}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary" style="margin-top:12px">🗺️ Open in Maps</a>` : ''}
          </div>
        </div>

        ${event.description ? `
          <div style="padding:0 32px 32px">
            <div class="card" style="padding:20px">
              <div style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">📝 Description</div>
              <p style="color:var(--text-secondary);line-height:1.7">${event.description}</p>
            </div>
          </div>
        ` : ''}

        ${hasCoords ? `<div style="padding:0 32px 32px"><div id="detail-map" class="map-container" style="height:300px"></div></div>` : ''}

        <div style="padding:0 32px 32px">
          <p style="color:var(--text-muted);font-size:0.8rem">Submitted by ${event.submittedByName || 'Unknown'} on ${submittedDate}</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => window.history.back());

  if (hasCoords) {
    setTimeout(() => {
      import('leaflet').then(leaflet => {
        const L = leaflet.default || leaflet;
        const mapEl = document.getElementById('detail-map');
        if (!mapEl) return;
        const map = L.map(mapEl).setView([event.latitude, event.longitude], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
        L.marker([event.latitude, event.longitude]).addTo(map).bindPopup(`<strong>${event.prasanga}</strong><br>${event.location}`).openPopup();
        setTimeout(() => map.invalidateSize(), 200);
      }).catch(() => {});
    }, 100);
  }
}
