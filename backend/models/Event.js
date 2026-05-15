const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  prasanga: { type: String, required: true, trim: true },
  troupe: { type: String, trim: true, default: '' },
  thittu: { type: String, required: true, enum: ['Thenku', 'Badagu', 'Bada-Badagu'] },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true, trim: true },
  googleMapsLink: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  description: { type: String, default: '' },
  posterUrls: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: { type: String, default: '' },
  actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionedByName: { type: String, default: '' },
}, { timestamps: true });

// Index for common queries
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
