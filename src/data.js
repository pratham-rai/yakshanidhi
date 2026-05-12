// Data module — REST API
import { api } from './api.js';

export async function getApprovedEvents() {
  return api.getApprovedEvents();
}

export async function getEventById(id) {
  return api.getEventById(id);
}

export async function getEvents() {
  return api.getAllEvents();
}

export async function getEventsByStatus(status) {
  return api.getAllEvents(status);
}

export async function addEvent(eventData, files = []) {
  // Upload poster files first
  let posterUrls = [];
  if (files.length > 0) {
    posterUrls = await api.uploadPosters(files);
  }
  return api.createEvent({ ...eventData, posterUrls });
}

export async function updateEvent(id, data) {
  return api.updateEvent(id, data);
}

export async function approveEvent(id) {
  return api.approveEvent(id);
}

export async function rejectEvent(id, reason) {
  return api.rejectEvent(id, reason);
}
