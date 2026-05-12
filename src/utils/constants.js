// Thittu types
export const THITTU_TYPES = ['Thenku', 'Badagu', 'Bada-Badagu'];

// Event status
export const EVENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// User roles
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MASTER_ADMIN: 'masterAdmin',
};

// Max file upload
export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Badge CSS class for thittu
export function thittuBadgeClass(thittu) {
  if (!thittu) return 'badge';
  const key = thittu.toLowerCase().replace('-', '-');
  if (key.includes('bada')) return 'badge badge-bada-badagu';
  if (key.includes('badagu')) return 'badge badge-badagu';
  return 'badge badge-thenku';
}

// Status badge class
export function statusBadgeClass(status) {
  return `badge badge-${status}`;
}
