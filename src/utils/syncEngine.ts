/**
 * Real-Time Two-Way Synchronization Engine
 * 
 * Features:
 * - Sub-second live updates via Server-Sent Events (SSE)
 * - Granular field/row-level delta dispatching (No full-table rewrites)
 * - Echo loop prevention using unique originClientId and syncId
 * - Stale data protection using epoch updatedAt timestamps
 * - Offline mutation queue with auto-reconnection and delta replay
 * - Authoritative Student ID first integrity
 */

export type SyncEntityType =
  | 'STUDENT'
  | 'LESSON'
  | 'SETTING'
  | 'PACKAGE'
  | 'MEDIA'
  | 'TRANSACTION'
  | 'WALLET'
  | 'INVOICE'
  | 'NOTIFICATION'
  | 'HELP'
  | 'AUDIT';
export type SyncActionType = 'UPDATE' | 'CREATE' | 'DELETE';

export interface SyncDelta {
  syncId: string;
  originClientId: string;
  entityType: SyncEntityType;
  action: SyncActionType;
  entityId: string;
  data: any;
  updatedAt: number;
  studentId?: string;
}

export interface SyncListener {
  id: string;
  entityType?: SyncEntityType;
  callback: (delta: SyncDelta) => void;
}

// Generate or retrieve persistent browser client ID
function getOrCreateClientId(): string {
  const key = 'app_sync_client_id_v1';
  let cid = '';
  try {
    cid = localStorage.getItem(key) || '';
    if (!cid) {
      cid = 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(key, cid);
    }
  } catch (e) {
    cid = 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
  return cid;
}

export const CLIENT_ID = getOrCreateClientId();

class RealtimeSyncEngine {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, SyncListener> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectDelay: number = 30000;
  private reconnectTimer: any = null;
  private lastSyncTimestamp: number = Date.now();
  private processedSyncIds: Set<string> = new Set();
  private offlineQueueKey = 'app_sync_offline_queue_v1';
  private currentUserRole: string = 'student';
  private currentStudentId: string = '';

  constructor() {
    // Listen to online/offline network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncEngine] Network connection restored. Reconnecting and flushing offline queue...');
        this.reconnectAttempts = 0;
        this.connect();
        this.flushOfflineQueue();
      });

      window.addEventListener('offline', () => {
        console.warn('[SyncEngine] Network connection lost. Operating in protected offline mode.');
        this.disconnect();
      });
    }
  }

  public init(role: string = 'student', studentId: string = '') {
    this.currentUserRole = role;
    this.currentStudentId = studentId;
    this.connect();
  }

  public updateIdentity(role: string, studentId: string) {
    if (this.currentUserRole !== role || this.currentStudentId !== studentId) {
      this.currentUserRole = role;
      this.currentStudentId = studentId;
      // Reconnect with new role and student ID headers for scoped filtering
      this.reconnect();
    }
  }

  private connect() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource && (this.eventSource.readyState === EventSource.OPEN || this.eventSource.readyState === EventSource.CONNECTING)) {
      return;
    }

    try {
      const url = `/api/sync/stream?clientId=${encodeURIComponent(CLIENT_ID)}&role=${encodeURIComponent(this.currentUserRole)}&studentId=${encodeURIComponent(this.currentStudentId || '')}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[SyncEngine] SSE Real-time stream connected.');
        // Catch up on any deltas missed while disconnected
        this.fetchMissedDeltas();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const delta: SyncDelta = JSON.parse(event.data);
          this.handleIncomingDelta(delta);
        } catch (err) {
          // Ignore heartbeat or non-JSON message
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn('[SyncEngine] Failed to initialize SSE EventSource:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      console.log(`[SyncEngine] Attempting reconnect (${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.set(listener.id, listener);
    return () => {
      this.listeners.delete(listener.id);
    };
  }

  private handleIncomingDelta(delta: SyncDelta) {
    if (!delta || !delta.syncId) return;

    // 1. Echo-loop prevention: Ignore deltas originating from this exact client
    if (delta.originClientId === CLIENT_ID) {
      return;
    }

    // 2. Deduping: Avoid processing duplicate deliveries
    if (this.processedSyncIds.has(delta.syncId)) {
      return;
    }
    this.processedSyncIds.add(delta.syncId);
    if (this.processedSyncIds.size > 1000) {
      const first = Array.from(this.processedSyncIds)[0];
      this.processedSyncIds.delete(first);
    }

    // Update watermark
    if (delta.updatedAt > this.lastSyncTimestamp) {
      this.lastSyncTimestamp = delta.updatedAt;
    }

    // Notify registered listeners
    this.listeners.forEach((listener) => {
      if (!listener.entityType || listener.entityType === delta.entityType) {
        try {
          listener.callback(delta);
        } catch (e) {
          console.error('[SyncEngine] Error in listener callback:', e);
        }
      }
    });
  }

  /**
   * Dispatches a targeted granular patch to the backend server and Google Sheets.
   * Optimistically returns immediately and broadcasts asynchronously.
   */
  public async dispatchTargetedPatch(
    entityType: SyncEntityType,
    entityId: string,
    data: any,
    action: SyncActionType = 'UPDATE',
    studentId?: string
  ): Promise<{ success: boolean; syncId: string }> {
    const updatedAt = Date.now();
    const syncId = `sync-${updatedAt}-${Math.random().toString(36).substring(2, 9)}`;

    const delta: SyncDelta = {
      syncId,
      originClientId: CLIENT_ID,
      entityType,
      action,
      entityId,
      data,
      updatedAt,
      studentId: studentId || (entityType === 'STUDENT' ? entityId : undefined)
    };

    // Mark as processed locally so we don't re-apply our own action
    this.processedSyncIds.add(syncId);

    // If offline, queue mutation locally
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueueOfflineMutation(delta);
      return { success: true, syncId };
    }

    try {
      const res = await fetch('/api/sync/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(delta)
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const resData = await res.json();
      return { success: true, syncId: resData.syncId || syncId };
    } catch (err) {
      console.warn('[SyncEngine] Failed to push patch online. Storing in offline replay queue:', err);
      this.enqueueOfflineMutation(delta);
      return { success: true, syncId };
    }
  }

  private enqueueOfflineMutation(delta: SyncDelta) {
    try {
      const raw = localStorage.getItem(this.offlineQueueKey);
      const queue: SyncDelta[] = raw ? JSON.parse(raw) : [];
      queue.push(delta);
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    } catch (e) {
      console.error('[SyncEngine] Failed to enqueue offline mutation:', e);
    }
  }

  private async flushOfflineQueue() {
    try {
      const raw = localStorage.getItem(this.offlineQueueKey);
      if (!raw) return;
      const queue: SyncDelta[] = JSON.parse(raw);
      if (queue.length === 0) return;

      console.log(`[SyncEngine] Flushing ${queue.length} offline mutations...`);
      localStorage.removeItem(this.offlineQueueKey);

      for (const delta of queue) {
        await fetch('/api/sync/patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(delta)
        }).catch(e => console.warn('[SyncEngine] Replay item failed:', e));
      }
    } catch (e) {
      console.error('[SyncEngine] Error flushing offline queue:', e);
    }
  }

  private async fetchMissedDeltas() {
    try {
      const res = await fetch(`/api/sync/deltas?since=${this.lastSyncTimestamp}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.deltas)) {
          data.deltas.forEach((delta: SyncDelta) => {
            this.handleIncomingDelta(delta);
          });
        }
      }
    } catch (err) {
      // Non-fatal
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      clientId: CLIENT_ID,
      role: this.currentUserRole,
      studentId: this.currentStudentId,
      lastSyncTimestamp: this.lastSyncTimestamp
    };
  }
}

export const syncEngine = new RealtimeSyncEngine();
