/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncConfig, SyncStatus, WikiState, WikiSyncPayload } from '../../types';
import {
  applySyncPayload,
  buildPayloadFromStorage,
  getLocalUpdatedAt,
  hasCompletedFirstSync,
  loadSyncConfig,
  markFirstSyncComplete,
  persistWikiState,
  saveSyncConfig,
} from '../wikiStorage';
import { gistProvider } from './gistProvider';
import { jsonbinProvider } from './jsonbinProvider';
import { SyncProviderAdapter } from './types';

const PUSH_DEBOUNCE_MS = 1500;

type StatusListener = (status: SyncStatus, errorMessage?: string, lastSyncedAt?: string) => void;
type StateListener = (state: WikiState) => void;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
let statusListener: StatusListener | null = null;
let stateListener: StateListener | null = null;
let lastSyncedAt: string | null = null;
let lastErrorMessage: string | null = null;

function getAdapter(provider: SyncConfig['provider']): SyncProviderAdapter | null {
  if (provider === 'jsonbin') return jsonbinProvider;
  if (provider === 'gist') return gistProvider;
  return null;
}

function isSyncEnabled(config: SyncConfig): boolean {
  if (config.provider === 'jsonbin') {
    return Boolean(config.jsonbin.apiKey.trim() && config.jsonbin.binId.trim());
  }
  if (config.provider === 'gist') {
    return Boolean(config.gist.token.trim() && config.gist.gistId.trim());
  }
  return false;
}

function setStatus(status: SyncStatus, errorMessage?: string) {
  if (status === 'synced') {
    lastSyncedAt = new Date().toISOString();
    lastErrorMessage = null;
  }
  if (status === 'error') {
    lastErrorMessage = errorMessage ?? 'Sync failed';
  }
  statusListener?.(status, errorMessage ?? lastErrorMessage ?? undefined, lastSyncedAt ?? undefined);
}

function compareUpdatedAt(a: string, b: string): number {
  const timeA = Date.parse(a);
  const timeB = Date.parse(b);
  if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
  if (Number.isNaN(timeA)) return -1;
  if (Number.isNaN(timeB)) return 1;
  return timeA - timeB;
}

async function pushPayload(config: SyncConfig, payload: WikiSyncPayload): Promise<void> {
  const adapter = getAdapter(config.provider);
  if (!adapter) return;
  await adapter.push(config, payload);
}

async function fetchRemote(config: SyncConfig): Promise<WikiSyncPayload | null> {
  const adapter = getAdapter(config.provider);
  if (!adapter) return null;
  return adapter.fetch(config);
}

export function initSyncManager(options: {
  onStatusChange: StatusListener;
  onStateApplied: StateListener;
}): void {
  statusListener = options.onStatusChange;
  stateListener = options.onStateApplied;
}

export function getLastSyncedAt(): string | null {
  return lastSyncedAt;
}

export function schedulePush(): void {
  const config = loadSyncConfig();
  if (!isSyncEnabled(config)) return;

  if (pushTimer) {
    clearTimeout(pushTimer);
  }

  pushTimer = setTimeout(() => {
    void pushNow();
  }, PUSH_DEBOUNCE_MS);
}

export async function pushNow(): Promise<void> {
  const config = loadSyncConfig();
  if (!isSyncEnabled(config) || isSyncing) return;

  isSyncing = true;
  setStatus('syncing');

  try {
    const payload = buildPayloadFromStorage();
    await pushPayload(config, payload);
    setStatus('synced');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync push failed';
    setStatus('error', message);
  } finally {
    isSyncing = false;
  }
}

export async function pullAndMerge(): Promise<WikiState | null> {
  const config = loadSyncConfig();
  if (!isSyncEnabled(config) || isSyncing) return null;

  isSyncing = true;
  setStatus('syncing');

  try {
    const localUpdatedAt = getLocalUpdatedAt();
    const localPayload = buildPayloadFromStorage();
    const remotePayload = await fetchRemote(config);
    const isFirstSync = !hasCompletedFirstSync(config);

    if (isFirstSync) {
      if (remotePayload) {
        const nextState = applySyncPayload(remotePayload);
        markFirstSyncComplete(config);
        stateListener?.(nextState);
        setStatus('synced');
        return nextState;
      }

      await pushPayload(config, localPayload);
      markFirstSyncComplete(config);
      setStatus('synced');
      return null;
    }

    if (!remotePayload) {
      await pushPayload(config, localPayload);
      setStatus('synced');
      return null;
    }

    const remoteIsNewer = compareUpdatedAt(remotePayload.updatedAt, localUpdatedAt) > 0;
    const localIsNewer = compareUpdatedAt(localUpdatedAt, remotePayload.updatedAt) > 0;

    if (remoteIsNewer) {
      const nextState = applySyncPayload(remotePayload);
      stateListener?.(nextState);
      setStatus('synced');
      return nextState;
    }

    if (localIsNewer) {
      await pushPayload(config, localPayload);
    }

    setStatus('synced');
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync pull failed';
    setStatus('error', message);
    return null;
  } finally {
    isSyncing = false;
  }
}

export async function syncNow(): Promise<WikiState | null> {
  return pullAndMerge();
}

export async function testConnection(config: SyncConfig) {
  const adapter = getAdapter(config.provider);
  if (!adapter) {
    return { ok: false, message: 'No sync provider selected' };
  }
  return adapter.testConnection(config);
}

export async function createRemote(config: SyncConfig): Promise<string> {
  const adapter = getAdapter(config.provider);
  if (!adapter) {
    throw new Error('No sync provider selected');
  }

  const initialPayload = buildPayloadFromStorage();
  const remoteId = await adapter.createRemote(config, initialPayload);

  const nextConfig: SyncConfig = { ...config };
  if (config.provider === 'jsonbin') {
    nextConfig.jsonbin = { ...nextConfig.jsonbin, binId: remoteId };
  } else if (config.provider === 'gist') {
    nextConfig.gist = { ...nextConfig.gist, gistId: remoteId };
  }

  saveSyncConfig(nextConfig);
  await pushPayload(nextConfig, initialPayload);
  markFirstSyncComplete(nextConfig);
  setStatus('synced');
  return remoteId;
}

export function notifyLocalChange(state: WikiState): WikiSyncPayload {
  const payload = persistWikiState(state);
  schedulePush();
  return payload;
}

export function saveSyncConfigAndApply(config: SyncConfig): void {
  saveSyncConfig(config);
  if (!isSyncEnabled(config)) {
    setStatus('idle');
    return;
  }
  void pullAndMerge();
}
