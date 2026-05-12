// Auth module — JWT + REST API
import { api } from './api.js';
import { setState, getState } from './store.js';
import { ROLES } from './utils/constants.js';

export async function initAuth() {
  const token = localStorage.getItem('yn_token');
  if (token) {
    try {
      const user = await api.getMe();
      setState('user', user);
    } catch {
      localStorage.removeItem('yn_token');
      setState('user', null);
    }
  } else {
    setState('user', null);
  }
}

export async function login(email, password) {
  const { token, user } = await api.login(email, password);
  localStorage.setItem('yn_token', token);
  setState('user', user);
  return user;
}

export async function register(email, password, displayName) {
  const { token, user } = await api.register(email, password, displayName);
  localStorage.setItem('yn_token', token);
  setState('user', user);
  return user;
}

export function logout() {
  localStorage.removeItem('yn_token');
  setState('user', null);
}

export function continueAsGuest() {
  setState('user', null);
}

export function getCurrentUser() {
  return getState('user');
}

export function isLoggedIn() {
  return !!getState('user');
}

export function isAdmin() {
  const user = getState('user');
  return user && (user.role === ROLES.ADMIN || user.role === ROLES.MASTER_ADMIN);
}

export function isMasterAdmin() {
  const user = getState('user');
  return user && user.role === ROLES.MASTER_ADMIN;
}

export async function getAllUsers() {
  return api.getUsers();
}

export async function toggleAdminRole(uid) {
  return api.toggleRole(uid);
}
