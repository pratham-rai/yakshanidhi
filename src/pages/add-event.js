import { addEvent, resolveMapLink } from '../data.js';
import { getCurrentUser } from '../auth.js';
import { navigate } from '../router.js';
import { toastSuccess, toastError } from '../toast.js';
import { validateEventForm, validateFiles } from '../utils/validators.js';
import { THITTU_TYPES, MAX_FILES } from '../utils/constants.js';

export function renderAddEvent(container) {
  const user = getCurrentUser();
  let files = [];
  let errors = {};
  let submitting = false;

  function render() {
    container.innerHTML = `
      <div class="page-wrapper animate-fade-in-up">
        <div class="page-header">
          <h1>➕ Submit an Event</h1>
          <p>Share a Yakshagana event with the community. It will be reviewed by an admin before publishing.</p>
        </div>

        <div class="card-strong" style="padding:32px;max-width:700px">
          <form id="event-form" class="login-form">
            <div>
              <label class="input-label">Prasanga (Performance Name) <span class="required">*</span></label>
              <input type="text" class="input-field" id="ef-prasanga" placeholder="e.g., Karna Parva" required />
              ${errors.prasanga ? `<small style="color:var(--red-light)">${errors.prasanga}</small>` : ''}
            </div>
            <div>
              <label class="input-label">Troupe / Mela <span style="color:var(--text-muted)">(optional)</span></label>
              <input type="text" class="input-field" id="ef-troupe" placeholder="e.g., Dharmasthala Mela" />
            </div>
            <div>
              <label class="input-label">Thittu <span class="required">*</span></label>
              <select class="input-field" id="ef-thittu" required>
                <option value="">Select Thittu</option>
                ${THITTU_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
              ${errors.thittu ? `<small style="color:var(--red-light)">${errors.thittu}</small>` : ''}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div>
                <label class="input-label">Date <span class="required">*</span></label>
                <input type="date" class="input-field" id="ef-date" required />
                ${errors.date ? `<small style="color:var(--red-light)">${errors.date}</small>` : ''}
              </div>
              <div>
                <label class="input-label">Time <span class="required">*</span></label>
                <input type="time" class="input-field" id="ef-time" required />
                ${errors.time ? `<small style="color:var(--red-light)">${errors.time}</small>` : ''}
              </div>
            </div>
            <div>
              <label class="input-label">Location <span class="required">*</span></label>
              <input type="text" class="input-field" id="ef-location" placeholder="e.g., Dharmasthala Temple, Dharmasthala" required />
              ${errors.location ? `<small style="color:var(--red-light)">${errors.location}</small>` : ''}
            </div>
            <div>
              <label class="input-label">Google Maps Link <span style="color:var(--text-muted)">(optional)</span></label>
              <input type="url" class="input-field" id="ef-maps-link" placeholder="https://maps.google.com/..." />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div>
                <label class="input-label">Latitude <span style="color:var(--text-muted)">(optional)</span></label>
                <input type="number" step="any" class="input-field" id="ef-lat" placeholder="e.g., 12.9563" />
              </div>
              <div>
                <label class="input-label">Longitude <span style="color:var(--text-muted)">(optional)</span></label>
                <input type="number" step="any" class="input-field" id="ef-lng" placeholder="e.g., 75.3724" />
              </div>
            </div>
            <div>
              <label class="input-label">Description <span style="color:var(--text-muted)">(optional)</span></label>
              <textarea class="input-field" id="ef-description" placeholder="Describe the event..." rows="4"></textarea>
            </div>
            <div>
              <label class="input-label">Event Poster <span style="color:var(--text-muted)">(optional, up to ${MAX_FILES} files, max 5MB each)</span></label>
              <div class="file-upload" id="file-upload-area">
                <div class="upload-icon">📎</div>
                <div class="upload-text"><strong>Click to upload</strong> or drag & drop<br>JPG, PNG, WebP, or PDF</div>
                <input type="file" id="ef-files" multiple accept="image/*,.pdf" style="display:none" />
              </div>
              <div class="file-previews" id="file-previews">
                ${files.map((f, i) => `
                  <div class="file-preview">
                    ${f.type.startsWith('image/') ? `<img src="${URL.createObjectURL(f)}" alt="${f.name}" />` : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--bg-card);font-size:1.5rem">📄</div>`}
                    <button type="button" class="remove-file" data-idx="${i}">✕</button>
                  </div>
                `).join('')}
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" ${submitting ? 'disabled' : ''}>
              ${submitting ? '<div class="spinner"></div> Uploading & Submitting...' : '🎪 Submit Event'}
            </button>
          </form>
        </div>
      </div>
    `;

    // File upload handlers
    const uploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('ef-files');
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    container.querySelectorAll('.remove-file').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); files.splice(parseInt(btn.dataset.idx), 1); render(); });
    });

    document.getElementById('event-form').addEventListener('submit', (e) => { e.preventDefault(); handleSubmit(); });

    // Map link auto-resolver
    const mapLinkInput = document.getElementById('ef-maps-link');
    if (mapLinkInput) {
      mapLinkInput.addEventListener('change', async (e) => {
        const url = e.target.value.trim();
        if (!url) return;
        
        const latInput = document.getElementById('ef-lat');
        const lngInput = document.getElementById('ef-lng');
        
        if (latInput.value || lngInput.value) return; // Don't override if user already typed it

        try {
          mapLinkInput.style.opacity = '0.5';
          const coords = await resolveMapLink(url);
          if (coords.lat && coords.lng) {
            latInput.value = coords.lat;
            lngInput.value = coords.lng;
            toastSuccess('Coordinates auto-filled from Google Maps link!');
          }
        } catch (err) {
          console.warn('Could not auto-resolve coordinates:', err);
        } finally {
          mapLinkInput.style.opacity = '1';
        }
      });
    }
  }

  function handleFiles(fileList) {
    const newFiles = Array.from(fileList);
    const fileErrors = validateFiles([...files, ...newFiles]);
    if (fileErrors.length > 0) { toastError(fileErrors[0]); return; }
    files = [...files, ...newFiles].slice(0, MAX_FILES);
    render();
  }

  async function handleSubmit() {
    const data = {
      prasanga: document.getElementById('ef-prasanga').value,
      troupe: document.getElementById('ef-troupe').value,
      thittu: document.getElementById('ef-thittu').value,
      date: document.getElementById('ef-date').value,
      time: document.getElementById('ef-time').value,
      location: document.getElementById('ef-location').value,
      googleMapsLink: document.getElementById('ef-maps-link').value,
      latitude: parseFloat(document.getElementById('ef-lat').value) || null,
      longitude: parseFloat(document.getElementById('ef-lng').value) || null,
      description: document.getElementById('ef-description').value,
      submittedBy: user.uid,
      submittedByName: user.displayName,
    };

    const validation = validateEventForm(data);
    if (!validation.valid) { errors = validation.errors; render(); toastError('Please fix the highlighted errors'); return; }

    submitting = true;
    render();

    try {
      await addEvent(data, files);
      toastSuccess('Event submitted for review! An admin will approve it shortly.');
      navigate('/');
    } catch (err) {
      submitting = false;
      render();
      toastError('Failed to submit: ' + err.message);
    }
  }

  render();
}
