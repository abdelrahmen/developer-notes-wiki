/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SyncConfig, WikiSyncPayload } from '../../types';
import { isValidSyncPayload } from '../wikiStorage';
import { parseGistId } from './parseRemoteId';
import { SyncProviderAdapter } from './types';

export const GIST_FILENAME = 'devnotes-wiki.json';
const API_BASE = 'https://api.github.com/gists';

function getGistId(config: SyncConfig): string {
  return parseGistId(config.gist.gistId);
}

function getHeaders(token: string, includeContentType = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function extractPayloadFromGist(data: unknown): WikiSyncPayload | null {
  if (!data || typeof data !== 'object') return null;
  const files = (data as { files?: Record<string, { content?: string }> }).files;
  if (!files || !files[GIST_FILENAME]?.content) return null;

  try {
    const parsed = JSON.parse(files[GIST_FILENAME].content as string);
    if (isValidSyncPayload(parsed)) return parsed;
  } catch {
    return null;
  }

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

export const gistProvider: SyncProviderAdapter = {
  async fetch(config) {
    const token = config.gist.token.trim();
    const gistId = getGistId(config);
    if (!token || !gistId) return null;

    const response = await fetch(`${API_BASE}/${gistId}`, {
      headers: getHeaders(token),
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    return extractPayloadFromGist(data);
  },

  async push(config, payload) {
    const token = config.gist.token.trim();
    const gistId = getGistId(config);
    if (!token || !gistId) {
      throw new Error('GitHub token and Gist ID are required');
    }

    const response = await fetch(`${API_BASE}/${gistId}`, {
      method: 'PATCH',
      headers: getHeaders(token, true),
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(payload, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  },

  async testConnection(config) {
    try {
      const token = config.gist.token.trim();
      const gistId = getGistId(config);
      if (!token) {
        return { ok: false, message: 'Personal Access Token is required' };
      }
      if (!gistId) {
        return { ok: false, message: 'Gist ID or URL is required' };
      }

      const response = await fetch(`${API_BASE}/${gistId}`, {
        headers: getHeaders(token),
      });

      if (response.ok) {
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
    const token = config.gist.token.trim();
    if (!token) {
      throw new Error('Personal Access Token is required to create a gist');
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getHeaders(token, true),
      body: JSON.stringify({
        description: 'Developer Notes Wiki sync data',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(initialPayload, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    const gistId = (data as { id?: string }).id;
    if (!gistId) {
      throw new Error('Failed to read new Gist ID from response');
    }

    return gistId;
  },
};
