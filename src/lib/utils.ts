/* Utility functions */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-success', open: 'badge-success', approved: 'badge-success',
    completed: 'badge-success', hired: 'badge-success', present: 'badge-success',
    pending: 'badge-warning', screening: 'badge-warning', draft: 'badge-warning',
    in_progress: 'badge-info', interview: 'badge-info', scheduled: 'badge-info',
    shortlisted: 'badge-info', processing: 'badge-info',
    offered: 'badge-primary', on_notice: 'badge-warning',
    rejected: 'badge-danger', closed: 'badge-neutral', cancelled: 'badge-danger',
    resigned: 'badge-danger', terminated: 'badge-danger', absent: 'badge-danger',
    withdrawn: 'badge-neutral',
  };
  return map[status] || 'badge-neutral';
}

export function getScoreClass(score: number): string {
  if (score >= 75) return 'score-high';
  if (score >= 50) return 'score-medium';
  return 'score-low';
}

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
