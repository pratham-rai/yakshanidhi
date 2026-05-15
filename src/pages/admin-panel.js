import { getEventsByStatus, approveEvent, rejectEvent, updateEvent, getEvents, revertToPending, resolveMapLink } from '../data.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatShortDate } from '../utils/date.js';
import { statusBadgeClass, thittuBadgeClass, EVENT_STATUS, THITTU_TYPES } from '../utils/constants.js';

export function renderAdminPanel(container) {
  let activeTab = EVENT_STATUS.PENDING;
  let editingEvent = null;
  let events = [];
  let allEvents = [];
  let loading = true;

  async function loadEvents() {
    loading = true;
    renderUI();
    try {
      allEvents = await getEvents();
      events = activeTab === 'all' ? allEvents : allEvents.filter(e => e.status === activeTab);
    } catch (err) {
      console.error('Failed to load events:', err);
      allEvents = [];
      events = [];
    }
    loading = false;
    renderUI();
  }

  function renderUI() {
    const pending = allEvents.filter(e => e.status === EVENT_STATUS.PENDING).length;
    const approved = allEvents.filter(e => e.status === EVENT_STATUS.APPROVED).length;
    const rejected = allEvents.filter(e => e.status === EVENT_STATUS.REJECTED).length;

    container.innerHTML = `
      <div class="page-wrapper animate-fade-in-up">
        <div class="page-header">
          <h1>⚙️ Admin Panel</h1>
          <p>Manage event submissions</p>
        </div>

        <div class="stat-grid" style="max-width:600px">
          <div class="stat-card"><div class="stat-value" style="color:#FBBF24">${pending}</div><div class="stat-label">Pending</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--green-light)">${approved}</div><div class="stat-label">Approved</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--red-light)">${rejected}</div><div class="stat-label">Rejected</div></div>
          <div class="stat-card"><div class="stat-value">${allEvents.length}</div><div class="stat-label">Total</div></div>
        </div>

        <div class="tabs">
          <button class="tab-btn ${activeTab === EVENT_STATUS.PENDING ? 'active' : ''}" data-tab="${EVENT_STATUS.PENDING}">Pending (${pending})</button>
          <button class="tab-btn ${activeTab === EVENT_STATUS.APPROVED ? 'active' : ''}" data-tab="${EVENT_STATUS.APPROVED}">Approved (${approved})</button>
          <button class="tab-btn ${activeTab === EVENT_STATUS.REJECTED ? 'active' : ''}" data-tab="${EVENT_STATUS.REJECTED}">Rejected (${rejected})</button>
          <button class="tab-btn ${activeTab === 'all' ? 'active' : ''}" data-tab="all">All (${allEvents.length})</button>
        </div>

        ${loading ? `
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[1,2,3].map(() => `<div class="skeleton" style="height:80px;border-radius:var(--radius-md)"></div>`).join('')}
          </div>
        ` : events.length === 0 ? `
          <div class="empty-state"><div class="empty-icon">📋</div><h3>No ${activeTab} events</h3></div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px">
            ${events.map((event, i) => {
              const subDate = event.submittedAt ? new Date(event.submittedAt).toLocaleDateString() : '';
              return `
              <div class="admin-event-row animate-fade-in-up" style="animation-delay:${i * 60}ms">
                <div class="event-info">
                  <h3>${event.prasanga}</h3>
                  <p>${event.troupe || 'No troupe'} · ${formatShortDate(event.date)} · ${event.location}</p>
                  <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                    <span class="${statusBadgeClass(event.status)}">${event.status}</span>
                    <span class="${thittuBadgeClass(event.thittu)}">${event.thittu}</span>
                  </div>
                  <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">by ${event.submittedByName || 'Unknown'} on ${subDate}</p>
                  ${event.rejectionReason ? `<p style="font-size:0.8rem;color:var(--red-light);margin-top:4px">Reason: ${event.rejectionReason}</p>` : ''}
                </div>
                <div class="event-actions">
                  ${event.status === EVENT_STATUS.PENDING ? `
                    <button class="btn btn-sm btn-primary approve-btn" data-id="${event.id}">✅ Approve</button>
                    <button class="btn btn-sm btn-danger reject-btn" data-id="${event.id}">❌ Reject</button>
                  ` : ''}
                  ${event.status === EVENT_STATUS.APPROVED || event.status === EVENT_STATUS.REJECTED ? `
                    <button class="btn btn-sm btn-danger revert-btn" data-id="${event.id}">🔄 Revert to Pending</button>
                  ` : ''}
                  <button class="btn btn-sm btn-secondary edit-btn" data-id="${event.id}">✏️ Edit</button>
                </div>
              </div>`;
            }).join('')}
          </div>
        `}
      </div>
      ${editingEvent ? renderEditModal(editingEvent) : ''}
    `;

    // Tab clicks
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.tab; loadEvents(); });
    });

    // Approve
    container.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await approveEvent(btn.dataset.id); toastSuccess('Event approved!'); loadEvents(); }
        catch (e) { toastError('Failed: ' + e.message); }
      });
    });

    // Reject
    container.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const reason = prompt('Rejection reason (optional):') || '';
        try { await rejectEvent(btn.dataset.id, reason); toastSuccess('Event rejected'); loadEvents(); }
        catch (e) { toastError('Failed: ' + e.message); }
      });
    });

    // Edit
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        editingEvent = { ...allEvents.find(e => e.id === btn.dataset.id) };
        if (!editingEvent.posterUrls) editingEvent.posterUrls = [];
        renderUI();
      });
    });

    // Revert
    container.querySelectorAll('.revert-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to move this event back to pending?')) return;
        try { await revertToPending(btn.dataset.id); toastSuccess('Event moved to pending'); loadEvents(); }
        catch (e) { toastError('Failed: ' + e.message); }
      });
    });

    // Modal
    if (editingEvent) {
      container.querySelectorAll('.remove-poster-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          editingEvent.posterUrls.splice(idx, 1);
          renderUI();
        });
      });
      document.getElementById('modal-close')?.addEventListener('click', () => { editingEvent = null; renderUI(); });
      document.getElementById('modal-overlay')?.addEventListener('click', (e) => { if (e.target.id === 'modal-overlay') { editingEvent = null; renderUI(); }});
      document.getElementById('edit-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updated = {
          prasanga: document.getElementById('edit-prasanga').value,
          troupe: document.getElementById('edit-troupe').value,
          thittu: document.getElementById('edit-thittu').value,
          date: document.getElementById('edit-date').value,
          time: document.getElementById('edit-time').value,
          location: document.getElementById('edit-location').value,
          googleMapsLink: document.getElementById('edit-maps-link').value,
          latitude: parseFloat(document.getElementById('edit-lat').value) || null,
          longitude: parseFloat(document.getElementById('edit-lng').value) || null,
          description: document.getElementById('edit-description').value,
          posterUrls: editingEvent.posterUrls || []
        };
        const posterFiles = document.getElementById('edit-posters').files;
        const filesArray = posterFiles.length > 0 ? Array.from(posterFiles) : [];
        try { await updateEvent(editingEvent.id, updated, filesArray); toastSuccess('Event updated!'); editingEvent = null; loadEvents(); }
        catch (e) { toastError('Failed: ' + e.message); }
      });

      const editMapLinkInput = document.getElementById('edit-maps-link');
      if (editMapLinkInput) {
        editMapLinkInput.addEventListener('input', async (e) => {
          const url = e.target.value.trim();
          if (!url || !url.startsWith('http')) return;
          
          const latInput = document.getElementById('edit-lat');
          const lngInput = document.getElementById('edit-lng');
          
          if (latInput.value || lngInput.value) return;

          try {
            editMapLinkInput.style.opacity = '0.5';
            const coords = await resolveMapLink(url);
            if (coords.lat && coords.lng) {
              latInput.value = coords.lat;
              lngInput.value = coords.lng;
              toastSuccess('Coordinates auto-filled from Google Maps link!');
            }
          } catch (err) {
            console.warn('Could not auto-resolve coordinates:', err);
          } finally {
            editMapLinkInput.style.opacity = '1';
          }
        });
      }
    }
  }

  function renderEditModal(event) {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-content">
          <div class="modal-header"><h2>✏️ Edit Event</h2><button class="modal-close" id="modal-close">✕</button></div>
          <form class="modal-body" id="edit-form" style="display:flex;flex-direction:column;gap:14px">
            <div><label class="input-label">Prasanga <span class="required">*</span></label>
              <input class="input-field" id="edit-prasanga" value="${event.prasanga}" required /></div>
            <div><label class="input-label">Troupe</label>
              <input class="input-field" id="edit-troupe" value="${event.troupe || ''}" /></div>
            <div><label class="input-label">Thittu <span class="required">*</span></label>
              <select class="input-field" id="edit-thittu" required>
                ${THITTU_TYPES.map(t => `<option value="${t}" ${event.thittu === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div><label class="input-label">Date</label><input type="date" class="input-field" id="edit-date" value="${event.date}" required /></div>
              <div><label class="input-label">Time</label><input type="time" class="input-field" id="edit-time" value="${event.time}" required /></div>
            </div>
            <div><label class="input-label">Location</label><input class="input-field" id="edit-location" value="${event.location}" required /></div>
            <div><label class="input-label">Google Maps Link</label><input type="url" class="input-field" id="edit-maps-link" value="${event.googleMapsLink || ''}" /></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div><label class="input-label">Latitude</label><input type="number" step="any" class="input-field" id="edit-lat" value="${event.latitude || ''}" /></div>
              <div><label class="input-label">Longitude</label><input type="number" step="any" class="input-field" id="edit-lng" value="${event.longitude || ''}" /></div>
            </div>
            <div><label class="input-label">Description</label><textarea class="input-field" id="edit-description" rows="3">${event.description || ''}</textarea></div>
            <div>
              <label class="input-label">Existing Posters</label>
              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px">
                 ${event.posterUrls && event.posterUrls.length ? event.posterUrls.map((url, idx) => `
                    <div style="position:relative; width:60px; height:80px">
                      <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />
                      <button type="button" class="btn btn-sm btn-danger remove-poster-btn" data-idx="${idx}" style="position:absolute;top:-5px;right:-5px;padding:2px 5px;font-size:10px;min-width:auto;height:auto;line-height:1">✕</button>
                    </div>
                 `).join('') : '<p style="color:var(--text-muted);font-size:0.8rem">No posters</p>'}
              </div>
            </div>
            <div>
              <label class="input-label">Upload Additional Posters</label>
              <input type="file" id="edit-posters" accept="image/*" multiple class="input-field" style="padding:8px" />
            </div>
            <div class="modal-footer" style="padding:0">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-close').click()">Cancel</button>
              <button type="submit" class="btn btn-primary">💾 Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  loadEvents();
}
