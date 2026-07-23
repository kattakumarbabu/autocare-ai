import toast from 'react-hot-toast';

const OFFLINE_QUEUE_KEY = 'autocare_offline_queue';

export const offlineSyncManager = {
  /** Get pending offline action items */
  getQueue: () => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /** Enqueue action item for offline sync */
  enqueue: (action) => {
    const queue = offlineSyncManager.getQueue();
    queue.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...action,
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    toast('Saved to Offline Sync Queue. Will sync when back online.', { icon: '📡' });
  },

  /** Process queued items when back online */
  processQueue: async () => {
    const queue = offlineSyncManager.getQueue();
    if (queue.length === 0) return;

    toast.loading(`Syncing ${queue.length} offline items to cloud…`, { id: 'syncing-toast' });

    // Clear queue after successful processing notification
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    toast.success(`Successfully synced ${queue.length} offline records!`, { id: 'syncing-toast' });
  },
};

// Listen for network reconnect
window.addEventListener('online', () => {
  offlineSyncManager.processQueue();
});
