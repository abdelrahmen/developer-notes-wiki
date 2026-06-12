/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncConfig, WikiSyncPayload } from '../../types';
import { isValidSyncPayload } from '../wikiStorage';
import { parseJsonBinId } from './parseRemoteId';
import { SyncProviderAdapter } from './types';

const API_BASE = 'https://api.jsonbin.io/v3/b';

function getBinId(config: SyncConfig): string {
  return parseJsonBinId(config.jsonbin.binId);
}

function getHeaders(apiKey: string, includeContentType = false): HeadersInit {
  const headers: Record<string, string> = {
    'X-Master-Key': apiKey,
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function extractRecord(data: unknown): WikiSyncPayload | null {
  if (!data || typeof data !== 'object') return null;
  const record = (data as { record?: unknown }).record;
  if (isValidSyncPayload(record)) return record;
  if (isValidSyncPayload(data)) return data;
  return null;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      return String((body as { message: string }).message);
    }
  } catch {
    // ignore parse errors
  }
  return `HTTP ${response.status}`;
}

export const jsonbinProvider: SyncProviderAdapter = {
  async fetch(config) {
    const apiKey = config.jsonbin.apiKey.trim();
    const binId = getBinId(config);
    if (!apiKey || !binId) return null;

    const response = await fetch(`${API_BASE}/${binId}`, {
      headers: getHeaders(apiKey),
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    return extractRecord(data);
  },

  async push(config, payload) {
    const apiKey = config.jsonbin.apiKey.trim();
    const binId = getBinId(config);
    if (!apiKey || !binId) {
      throw new Error('JSONBin API key and Bin ID are required');
    }

    const response = await fetch(`${API_BASE}/${binId}`, {
      method: 'PUT',
      headers: getHeaders(apiKey, true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  },

  async testConnection(config) {
    try {
      const apiKey = config.jsonbin.apiKey.trim();
      const binId = getBinId(config);
      if (!apiKey) {
        return { ok: false, message: 'Master Key is required' };
      }
      if (!binId) {
        return { ok: false, message: 'Bin ID is required' };
      }

      const response = await fetch(`${API_BASE}/${binId}`, {
        headers: getHeaders(apiKey),
      });

      if (response.ok || response.status === 404) {
        return { ok: true, message: 'Connection successful' };
      }

      return { ok: false, message: await parseErrorMessage(response) };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },

  async createRemote(config, initialPayload) {
    const apiKey = config.jsonbin.apiKey.trim();
    if (!apiKey) {
      throw new Error('Master Key is required to create a bin');
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getHeaders(apiKey, true),
      body: JSON.stringify(initialPayload),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    const binId = (data as { metadata?: { id?: string } }).metadata?.id;
    if (!binId) {
      throw new Error('Failed to read new Bin ID from response');
    }

    return binId;
  },
};
