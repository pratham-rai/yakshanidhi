import { getEventsByStatus, approveEvent, rejectEvent, updateEvent, getEvents } from '../data.js';
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
        renderUI();
      });
    });

    // Modal
    if (editingEvent) {
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
          description: document.getElementById('edit-description').value,
        };
        try { await updateEvent(editingEvent.id, updated); toastSuccess('Event updated!'); editingEvent = null; loadEvents(); }
        catch (e) { toastError('Failed: ' + e.message); }
      });
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
            <div><label class="input-label">Description</label><textarea class="input-field" id="edit-description" rows="3">${event.description || ''}</textarea></div>
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
