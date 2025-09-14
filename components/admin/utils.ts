import type { MockUser } from './types';

export const getStatusBadge = (status: MockUser['status']) => {
  const variants = {
    online: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    offline: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    'in-call': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
  };
  return variants[status];
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};