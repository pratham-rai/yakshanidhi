import { getPastEvents } from '../data.js';
import { formatShortDate } from '../utils/date.js';
import { thittuBadgeClass } from '../utils/constants.js';

export function renderPastEvents(container) {
  let events = [];
  let loading = true;

  async function loadEvents() {
    loading = true;
    renderUI();
    try {
      events = await getPastEvents();
    } catch (err) {
      console.error('Failed to load past events:', err);
      events = [];
    }
    loading = false;
    renderUI();
  }

  function renderUI() {
    container.innerHTML = `
      <div class="page-wrapper animate-fade-in-up">
        <div class="page-header">
          <h1>🗄️ Past Events Archive</h1>
          <p>A history of all completed Yakshagana events (Master Admin Only)</p>
        </div>

        <div class="stat-grid" style="max-width:300px">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--text-muted)">${events.length}</div>
            <div class="stat-label">Total Archived</div>
          </div>
        </div>

        ${loading ? `
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:24px;">
            ${[1, 2, 3].map(() => `<div class="skeleton" style="height:80px;border-radius:var(--radius-md)"></div>`).join('')}
          </div>
        ` : events.length === 0 ? `
          <div class="empty-state" style="margin-top:24px;">
            <div class="empty-icon">🗃️</div>
            <h3>No past events found</h3>
            <p style="color:var(--text-muted)">Completed events will appear here 12 hours after their start time.</p>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:24px;">
            ${events.map((event, i) => {
              const eventDateTime = new Date(`${event.date}T${event.time}:00+05:30`);
              return `
              <div class="admin-event-row animate-fade-in-up" style="animation-delay:${i * 60}ms;opacity:0.8;">
                <div class="event-info">
                  <h3 style="color:var(--text-muted)">${event.prasanga}</h3>
                  <p>${event.troupe || 'No troupe'} · ${formatShortDate(event.date)} · ${event.location}</p>
                  <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                    <span class="badge badge-rejected" style="background:var(--bg-card-hover);color:var(--text-muted);border:1px solid var(--border-light)">Archived</span>
                    <span class="${thittuBadgeClass(event.thittu)}">${event.thittu}</span>
                  </div>
                </div>
                <div class="event-actions" style="justify-content:center;align-items:center;padding:0 16px;">
                  <span style="font-size:0.8rem;color:var(--text-muted)">Completed<br>${eventDateTime.toLocaleDateString()}</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  loadEvents();
}
