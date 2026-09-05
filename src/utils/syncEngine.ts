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

import { auth } from '../services/googleAuthService';

export type SyncEntityType =
  | 'STUDENT' | 'LESSON' | 'SETTING' | 'PACKAGE' | 'MEDIA'
  | 'TRANSACTION' | 'WALLET' | 'INVOICE' | 'NOTIFICATION' | 'HELP' | 'AUDIT';
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

function getOrCreateClientId(): string {
  const key = 'app_sync_client_id_v1';
  let cid = '';
  try {
    cid = localStorage.getItem(key) || '';
    if (!cid) {
      cid = 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(key, cid);
    }
  } catch {
    cid = 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
  return cid;
}

export const CLIENT_ID = getOrCreateClientId();

class RealtimeSyncEngine {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, SyncListener> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: any = null;
  private lastSyncTimestamp = Date.now();
  private processedSyncIds: Set<string> = new Set();
  private offlineQueueKey = 'app_sync_offline_queue_v1';
  private currentUserRole = 'student';
  private currentStudentId = '';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.reconnectAttempts = 0;
        this.connect();
        void this.flushOfflineQueue();
      });
      window.addEventListener('offline', () => {
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
      this.reconnect();
    }
  }

  private async getFirebaseIdToken(): Promise<string | null> {
    try {
      return auth.currentUser ? await auth.currentUser.getIdToken() : null;
    } catch (error) {
      console.warn('[SyncEngine] Unable to obtain Firebase ID token:', error);
      return null;
    }
  }

  private connect() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource && (this.eventSource.readyState === EventSource.OPEN || this.eventSource.readyState === EventSource.CONNECTING)) return;

    void this.openAuthenticatedStream();
  }

  private async openAuthenticatedStream() {
    const token = await this.getFirebaseIdToken();
    if (!token) {
      this.scheduleReconnect();
      return;
    }

    try {
      const url = `/api/sync/stream?clientId=${encodeURIComponent(CLIENT_ID)}&role=${encodeURIComponent(this.currentUserRole)}&studentId=${encodeURIComponent(this.currentStudentId || '')}&access_token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(url);
      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        void this.fetchMissedDeltas();
      };
      this.eventSource.onmessage = (event) => {
        try {
          const delta: SyncDelta = JSON.parse(event.data);
          this.handleIncomingDelta(delta);
        } catch {
          // Ignore heartbeat/non-JSON SSE messages.
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
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
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
    return () => this.listeners.delete(listener.id);
  }

  private handleIncomingDelta(delta: SyncDelta) {
    if (!delta || !delta.syncId || delta.originClientId === CLIENT_ID) return;
    if (this.processedSyncIds.has(delta.syncId)) return;
    this.processedSyncIds.add(delta.syncId);
    if (this.processedSyncIds.size > 1000) {
      const first = this.processedSyncIds.values().next().value;
      if (first) this.processedSyncIds.delete(first);
    }
    if (delta.updatedAt > this.lastSyncTimestamp) this.lastSyncTimestamp = delta.updatedAt;
    this.listeners.forEach(listener => {
      if (!listener.entityType || listener.entityType === delta.entityType) {
        try { listener.callback(delta); } catch (e) { console.error('[SyncEngine] listener error:', e); }
      }
    });
  }

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
    this.processedSyncIds.add(syncId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueueOfflineMutation(delta);
      return { success: false, syncId };
    }

    try {
      const token = await this.getFirebaseIdToken();
      if (!token) throw new Error('Authenticated Firebase session is required for synchronization.');
      const res = await fetch('/api/sync/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(delta)
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const resData = await res.json();
      return { success: true, syncId: resData.syncId || syncId };
    } catch (err) {
      this.enqueueOfflineMutation(delta);
      return { success: false, syncId };
    }
  }

  private enqueueOfflineMutation(delta: SyncDelta) {
    try {
      const raw = localStorage.getItem(this.offlineQueueKey);
      const queue: SyncDelta[] = raw ? JSON.parse(raw) : [];
      const existingIndex = queue.findIndex(item => item.syncId === delta.syncId);
      if (existingIndex === -1) queue.push(delta);
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    } catch (e) {
      console.error('[SyncEngine] Failed to persist offline mutation:', e);
    }
  }

  private async flushOfflineQueue() {
    try {
      const raw = localStorage.getItem(this.offlineQueueKey);
      if (!raw) return;
      const queue: SyncDelta[] = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const token = await this.getFirebaseIdToken();
      if (!token) return;
      const remaining: SyncDelta[] = [];
      for (const delta of queue) {
        try {
          const res = await fetch('/api/sync/patch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(delta)
          });
          if (!res.ok) remaining.push(delta);
        } catch {
          remaining.push(delta);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(this.offlineQueueKey, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(this.offlineQueueKey);
      }
    } catch (e) {
      console.error('[SyncEngine] Error flushing offline queue:', e);
    }
  }

  private async fetchMissedDeltas() {
    try {
      const token = await this.getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`/api/sync/deltas?since=${this.lastSyncTimestamp}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.deltas)) data.deltas.forEach((delta: SyncDelta) => this.handleIncomingDelta(delta));
    } catch {
      // Non-fatal; SSE reconnect/catch-up will retry.
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
