import { getApprovedEvents } from '../data.js';
import { getCurrentUser, isLoggedIn } from '../auth.js';
import { navigate } from '../router.js';
import { formatShortDate, formatTime, isUpcoming, isToday, isThisWeek, isThisMonth } from '../utils/date.js';
import { thittuBadgeClass, THITTU_TYPES } from '../utils/constants.js';

export function renderHome(container) {
  let searchQuery = '';
  let filterThittu = '';
  let filterDate = '';
  let allEvents = [];

  async function loadEvents() {
    // Show loading skeleton
    container.innerHTML = `
      <div class="page-wrapper animate-fade-in-up">
        <div class="page-header" style="text-align:center;margin-bottom:40px">
          <img src="/logo.png" alt="YakshaNidhi Logo" style="display:block;margin:0 auto 8px auto;width:80px;height:80px;object-fit:contain" />
          <h1 style="font-size:2.5rem;margin:0">YakshaNidhi</h1>
          <p style="font-size:1.1rem;max-width:500px;margin:0 auto;margin-top:8px">Discover Yakshagana events happening near you</p>
        </div>
        <div class="event-grid">
          ${[1,2,3].map(() => `
            <div class="card" style="padding:0;overflow:hidden">
              <div class="skeleton" style="height:180px;border-radius:0"></div>
              <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
                <div class="skeleton" style="height:16px;width:60px"></div>
                <div class="skeleton" style="height:20px;width:80%"></div>
                <div class="skeleton" style="height:14px;width:70%"></div>
                <div class="skeleton" style="height:14px;width:50%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    try {
      allEvents = await getApprovedEvents();
    } catch (err) {
      console.error('Failed to load events:', err);
      allEvents = [];
    }
    render();
  }

  function getFilteredEvents() {
    let events = allEvents.filter(e => isUpcoming(e.date));
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.prasanga.toLowerCase().includes(q) ||
        (e.troupe && e.troupe.toLowerCase().includes(q)) ||
        e.location.toLowerCase().includes(q)
      );
    }
    if (filterThittu) events = events.filter(e => e.thittu === filterThittu);
    if (filterDate === 'today') events = events.filter(e => isToday(e.date));
    else if (filterDate === 'week') events = events.filter(e => isThisWeek(e.date));
    else if (filterDate === 'month') events = events.filter(e => isThisMonth(e.date));
    return events;
  }

  function render() {
    const events = getFilteredEvents();
    const user = getCurrentUser();

    container.innerHTML = `
      <div class="page-wrapper animate-fade-in-up">
        <div class="page-header" style="text-align:center;margin-bottom:40px">
          <img src="/logo.png" alt="YakshaNidhi Logo" style="display:block;margin:0 auto 8px auto;width:80px;height:80px;object-fit:contain" />
          <h1 style="font-size:2.5rem;margin:0">YakshaNidhi</h1>
          <p style="font-size:1.1rem;max-width:500px;margin:0 auto;margin-top:8px">Discover Yakshagana events happening near you</p>
        </div>

        <div class="stat-grid" style="max-width:500px;margin:0 auto 32px">
          <div class="stat-card">
            <div class="stat-value">${events.length}</div>
            <div class="stat-label">Upcoming Events</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${new Set(events.map(e => e.thittu)).size}</div>
            <div class="stat-label">Thittu Types</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${new Set(events.map(e => e.location)).size}</div>
            <div class="stat-label">Locations</div>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" class="input-field" id="search-input" placeholder="Search prasanga, troupe, or location..."
              value="${searchQuery}" style="padding-left:42px" />
          </div>
          <div class="filter-group">
            <select class="input-field" id="filter-thittu" style="width:auto;min-width:120px">
              <option value="">All Thittu</option>
              ${THITTU_TYPES.map(t => `<option value="${t}" ${filterThittu === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
            <select class="input-field" id="filter-date" style="width:auto;min-width:130px">
              <option value="" ${!filterDate ? 'selected' : ''}>All Dates</option>
              <option value="today" ${filterDate === 'today' ? 'selected' : ''}>Today</option>
              <option value="week" ${filterDate === 'week' ? 'selected' : ''}>This Week</option>
              <option value="month" ${filterDate === 'month' ? 'selected' : ''}>This Month</option>
            </select>
          </div>
        </div>

        ${events.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🎪</div>
            <h3>No events found</h3>
            <p>Try adjusting your search or filters, or check back later for new events.</p>
          </div>
        ` : `
          <div class="event-grid">
            ${events.map((event, i) => {
              const cardHtml = `
              <div class="event-card animate-fade-in-up" style="animation-delay:${i * 80}ms" data-event-id="${event.id}">
                ${event.posterUrls && event.posterUrls.length > 0
                  ? `<img class="poster" src="${event.posterUrls[0]}" alt="${event.prasanga}" />`
                  : `<div class="poster-placeholder" style="display:flex;align-items:center;justify-content:center"><img src="/logo.png" alt="Placeholder" style="width:64px;height:64px;object-fit:contain;opacity:0.3" /></div>`}
                <div class="card-body">
                  <div style="margin-bottom:8px">
                    <span class="${thittuBadgeClass(event.thittu)}">${event.thittu}</span>
                    ${isToday(event.date) ? '<span class="badge badge-approved" style="margin-left:4px">TODAY</span>' : ''}
                  </div>
                  <h3 class="card-title">${event.prasanga}</h3>
                  <div class="card-meta">
                    ${event.troupe ? `<div class="card-meta-item">🎪 ${event.troupe}</div>` : ''}
                    <div class="card-meta-item">📅 ${formatShortDate(event.date)} · ${formatTime(event.time)}</div>
                    <div class="card-meta-item">📍 ${event.location}</div>
                  </div>
                </div>
              </div>`;

              // Inject a Google Ad slot after every 6 events
              if ((i + 1) % 6 === 0) {
                return cardHtml + `
                  <div class="event-card ad-container" style="display:flex;align-items:center;justify-content:center;background:var(--bg-card);border:1px dashed var(--border-light);min-height:200px">
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-format="fluid"
                         data-ad-layout-key="-fb+5w+4e-db+86"
                         data-ad-client="ca-pub-5976380201620086"
                         data-ad-slot="1234567890"></ins>
                  </div>
                `;
              }
              return cardHtml;
            }).join('')}
          </div>
        `}
      </div>

      ${isLoggedIn() ? `<a href="#/add" class="fab" title="Add Event">+</a>` : ''}
    `;

    // Push to adsbygoogle
    setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Adsense error:', e);
      }
    }, 500);

    // Listeners
    document.getElementById('search-input')?.addEventListener('input', (e) => { searchQuery = e.target.value; render(); });
    document.getElementById('filter-thittu')?.addEventListener('change', (e) => { filterThittu = e.target.value; render(); });
    document.getElementById('filter-date')?.addEventListener('change', (e) => { filterDate = e.target.value; render(); });
    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => navigate(`/event/${card.dataset.eventId}`));
    });
  }

  loadEvents();
}
