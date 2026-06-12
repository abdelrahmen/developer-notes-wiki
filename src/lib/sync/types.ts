/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncConfig, WikiSyncPayload } from '../../types';

export interface SyncTestResult {
  ok: boolean;
  message: string;
}

export interface SyncProviderAdapter {
  fetch(config: SyncConfig): Promise<WikiSyncPayload | null>;
  push(config: SyncConfig, payload: WikiSyncPayload): Promise<void>;
  testConnection(config: SyncConfig): Promise<SyncTestResult>;
  createRemote(config: SyncConfig, initialPayload: WikiSyncPayload): Promise<string>;
}
