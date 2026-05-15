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
          <div style="display:flex;flex-direction:column;gap:20px;margin-top:24px;">
            ${events.map((event, i) => {
              const eventDateTime = new Date(`${event.date}T${event.time}:00+05:30`);
              const subDate = event.submittedAt ? new Date(event.submittedAt).toLocaleDateString() : 'Unknown';
              
              return `
              <div class="admin-event-row animate-fade-in-up" style="animation-delay:${i * 60}ms; flex-direction:column; align-items:stretch; gap:16px; padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
                  <div class="event-info" style="flex:1">
                    <h3 style="font-size:1.25rem; margin-bottom:4px;">${event.prasanga}</h3>
                    <p style="font-size:1rem; color:var(--text-secondary); margin-bottom:8px;">
                      ${event.troupe || 'No troupe'} · ${formatShortDate(event.date)} · ${event.time} · ${event.location}
                    </p>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
                      <span class="badge badge-rejected" style="background:var(--bg-card-hover); color:var(--text-muted); border:1px solid var(--border-light)">Archived</span>
                      <span class="${thittuBadgeClass(event.thittu)}">${event.thittu}</span>
                      ${event.googleMapsLink ? `<a href="${event.googleMapsLink}" target="_blank" class="badge" style="background:var(--bg-card); border:1px solid var(--border-light); color:var(--accent-light); text-decoration:none;">📍 Map Link</a>` : ''}
                    </div>
                  </div>
                  <div style="text-align:right; min-width:120px;">
                    <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">Completed on</span>
                    <span style="font-weight:600; font-size:0.9rem;">${eventDateTime.toLocaleDateString()}</span>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr; gap:16px; border-top:1px solid var(--border-light); padding-top:16px;">
                  ${event.description ? `
                    <div style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); background:var(--bg-card); padding:12px; border-radius:var(--radius-md);">
                      <strong style="display:block; margin-bottom:4px; color:var(--text-main);">Description:</strong>
                      ${event.description}
                    </div>
                  ` : ''}

                  <div style="display:flex; flex-wrap:wrap; gap:24px;">
                    <div>
                      <strong style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">Submitted By</strong>
                      <span style="font-size:0.9rem;">${event.submittedByName || 'Unknown'}</span>
                      <span style="font-size:0.75rem; color:var(--text-muted); display:block;">on ${subDate}</span>
                    </div>
                    ${event.actionedByName ? `
                      <div>
                        <strong style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">Approved By</strong>
                        <span style="font-size:0.9rem; color:var(--green-light); font-weight:500;">${event.actionedByName}</span>
                      </div>
                    ` : ''}
                  </div>

                  ${event.posterUrls && event.posterUrls.length > 0 ? `
                    <div>
                      <strong style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.05em;">Posters</strong>
                      <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;">
                        ${event.posterUrls.map(url => `
                          <img src="${url}" style="height:120px; width:auto; border-radius:var(--radius-sm); border:1px solid var(--border-light); object-fit:cover; cursor:pointer;" onclick="window.open('${url}', '_blank')" />
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
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
