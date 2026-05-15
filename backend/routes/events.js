const express = require('express');
const Event = require('../models/Event');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/events — approved events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' }).sort({ date: 1 });
    res.json(events.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/all — all events (admin only)
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events.map(formatEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id — single event (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(formatEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events — create event (logged in only)
router.post('/', auth, async (req, res) => {
  try {
    const { prasanga, troupe, thittu, date, time, location, googleMapsLink, latitude, longitude, description, posterUrls } = req.body;
    if (!prasanga || !thittu || !date || !time || !location) {
      return res.status(400).json({ error: 'Prasanga, thittu, date, time, and location are required' });
    }

    const event = await Event.create({
      prasanga, troupe, thittu, date, time, location,
      googleMapsLink: googleMapsLink || '',
      latitude: latitude || null,
      longitude: longitude || null,
      description: description || '',
      posterUrls: posterUrls || [],
      status: 'pending',
      submittedBy: req.user._id,
      submittedByName: req.user.displayName,
    });

    res.status(201).json(formatEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/events/:id — update event (admin only)
router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(formatEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/approve — approve event (admin only)
router.post('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(formatEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/reject — reject event (admin only)
router.post('/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await Event.findByIdAndUpdate(req.params.id, {
      status: 'rejected', rejectionReason: reason || ''
    }, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(formatEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/pending — revert event to pending (admin only)
router.post('/:id/pending', auth, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, {
      status: 'pending', rejectionReason: ''
    }, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(formatEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/resolve-map-link — resolve google maps link to coordinates
router.post('/resolve-map-link', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const finalUrl = response.url;
    
    let lat = null;
    let lng = null;

    // Pattern 1: !3d and !4d (Exact Pin Marker - most accurate)
    const pinMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) {
      lat = parseFloat(pinMatch[1]);
      lng = parseFloat(pinMatch[2]);
    } else {
      // Pattern 2: @lat,lng (Viewport Center - less accurate but good fallback)
      const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      } else {
        // Pattern 3: ?q=lat,lng
        const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (qMatch) {
          lat = parseFloat(qMatch[1]);
          lng = parseFloat(qMatch[2]);
        } else {
          // Pattern 4: HTML fallback
          const html = await response.text();
          const coordsMatch = html.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordsMatch) {
            lat = parseFloat(coordsMatch[1]);
            lng = parseFloat(coordsMatch[2]);
          }
        }
      }
    }

    if (lat !== null && lng !== null) {
      res.json({ lat, lng });
    } else {
      res.status(404).json({ error: 'Could not extract coordinates from the provided link' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve link: ' + err.message });
  }
});

function formatEvent(e) {
  return {
    id: e._id,
    prasanga: e.prasanga,
    troupe: e.troupe,
    thittu: e.thittu,
    date: e.date,
    time: e.time,
    location: e.location,
    googleMapsLink: e.googleMapsLink,
    latitude: e.latitude,
    longitude: e.longitude,
    description: e.description,
    posterUrls: e.posterUrls,
    status: e.status,
    rejectionReason: e.rejectionReason,
    submittedBy: e.submittedBy,
    submittedByName: e.submittedByName,
    submittedAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

module.exports = router;
