/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_CATEGORIES, INITIAL_PAGES } from '../data/topics';
import { Category, ContentBlock, Language, SyncConfig, TopicPage, WikiState, WikiSyncPayload } from '../types';
import { parseGistId, parseJsonBinId } from './sync/parseRemoteId';

export const STORAGE_KEYS = {
  categories: 'devnotes_categories_v1',
  pages: 'devnotes_pages_v1',
  completed: 'devnotes_completed_v1',
  notes: 'devnotes_notes_v1',
  language: 'devnotes_lang',
  syncConfig: 'devnotes_sync_config_v1',
  syncUpdatedAt: 'devnotes_sync_updated_at_v1',
  syncInitialized: 'devnotes_sync_initialized_v1',
} as const;

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  provider: 'none',
  jsonbin: { apiKey: '', binId: '' },
  gist: { token: '', gistId: '' },
};

type LegacyContentBlock = {
  id: string;
  type: string;
  textEn?: string;
  textAr?: string;
  titleEn?: string;
  titleAr?: string;
  code?: string;
  language?: string;
  links?: ContentBlock['links'];
  imageUrl?: string;
  captionEn?: string;
  captionAr?: string;
};
type LegacyTopicPage = TopicPage & {
  personalClarificationEn?: string;
  personalClarificationAr?: string;
};

function migrateContentBlock(block: LegacyContentBlock): ContentBlock {
  if (block.type !== 'definition') {
    return block as ContentBlock;
  }

  const titleEn = block.titleEn?.trim();
  const titleAr = block.titleAr?.trim();
  const textEn = block.textEn?.trim() ?? '';
  const textAr = block.textAr?.trim() ?? '';

  return {
    id: block.id,
    type: 'callout',
    textEn: titleEn ? `${titleEn}: ${textEn}` : textEn,
    textAr: titleAr ? `${titleAr}: ${textAr}` : textAr,
  };
}

export function normalizePage(page: LegacyTopicPage): TopicPage {
  const { personalClarificationEn: _en, personalClarificationAr: _ar, ...rest } = page;
  return {
    ...rest,
    blocks: (rest.blocks ?? []).map((block) => migrateContentBlock(block as LegacyContentBlock)),
  };
}

function normalizePages(pages: LegacyTopicPage[]): TopicPage[] {
  return pages.map(normalizePage);
}

export function loadSyncConfig(): SyncConfig {
  const raw = localStorage.getItem(STORAGE_KEYS.syncConfig);
  if (!raw) return { ...DEFAULT_SYNC_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<SyncConfig>;
    return {
      provider: parsed.provider ?? 'none',
      jsonbin: { ...DEFAULT_SYNC_CONFIG.jsonbin, ...parsed.jsonbin },
      gist: { ...DEFAULT_SYNC_CONFIG.gist, ...parsed.gist },
    };
  } catch {
    return { ...DEFAULT_SYNC_CONFIG };
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(STORAGE_KEYS.syncConfig, JSON.stringify(config));
}

export function getLocalUpdatedAt(): string {
  return localStorage.getItem(STORAGE_KEYS.syncUpdatedAt) ?? '';
}

export function setLocalUpdatedAt(updatedAt: string): void {
  localStorage.setItem(STORAGE_KEYS.syncUpdatedAt, updatedAt);
}

export function getSyncTargetKey(config: SyncConfig): string | null {
  if (config.provider === 'jsonbin') {
    const binId = parseJsonBinId(config.jsonbin.binId);
    return binId ? `jsonbin:${binId}` : null;
  }
  if (config.provider === 'gist') {
    const gistId = parseGistId(config.gist.gistId);
    return gistId ? `gist:${gistId}` : null;
  }
  return null;
}

function loadInitializedTargets(): Record<string, boolean> {
  const raw = localStorage.getItem(STORAGE_KEYS.syncInitialized);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function hasCompletedFirstSync(config: SyncConfig): boolean {
  const targetKey = getSyncTargetKey(config);
  if (!targetKey) return false;
  return loadInitializedTargets()[targetKey] === true;
}

export function markFirstSyncComplete(config: SyncConfig): void {
  const targetKey = getSyncTargetKey(config);
  if (!targetKey) return;
  const targets = loadInitializedTargets();
  targets[targetKey] = true;
  localStorage.setItem(STORAGE_KEYS.syncInitialized, JSON.stringify(targets));
}

export function loadLocalWikiState(): WikiState {
  let categories: Category[] = INITIAL_CATEGORIES;
  let pages: TopicPage[] = INITIAL_PAGES;
  let completedPages: string[] = [];
  let notes: Record<string, string> = {};
  let language: Language = 'en';

  const savedLang = localStorage.getItem(STORAGE_KEYS.language);
  if (savedLang === 'en' || savedLang === 'ar') {
    language = savedLang;
  }

  const savedCategories = localStorage.getItem(STORAGE_KEYS.categories);
  if (savedCategories) {
    try {
      categories = JSON.parse(savedCategories);
    } catch {
      categories = INITIAL_CATEGORIES;
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(INITIAL_CATEGORIES));
  }

  const savedPages = localStorage.getItem(STORAGE_KEYS.pages);
  if (savedPages) {
    try {
      pages = normalizePages(JSON.parse(savedPages));
    } catch {
      pages = INITIAL_PAGES;
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.pages, JSON.stringify(INITIAL_PAGES));
  }

  const savedCompleted = localStorage.getItem(STORAGE_KEYS.completed);
  if (savedCompleted) {
    try {
      completedPages = JSON.parse(savedCompleted);
    } catch {
      completedPages = [];
    }
  }

  const savedNotes = localStorage.getItem(STORAGE_KEYS.notes);
  if (savedNotes) {
    try {
      notes = JSON.parse(savedNotes);
    } catch {
      notes = {};
    }
  }

  if (!getLocalUpdatedAt()) {
    setLocalUpdatedAt(new Date().toISOString());
  }

  return { categories, pages, completedPages, notes, language };
}

export function buildSyncPayload(state: WikiState, updatedAt?: string): WikiSyncPayload {
  return {
    version: 1,
    updatedAt: updatedAt ?? new Date().toISOString(),
    categories: state.categories,
    pages: state.pages,
    completedPages: state.completedPages,
    notes: state.notes,
    language: state.language,
  };
}

export function buildPayloadFromStorage(): WikiSyncPayload {
  const state = loadLocalWikiState();
  const existingUpdatedAt = getLocalUpdatedAt();
  return buildSyncPayload(state, existingUpdatedAt || new Date().toISOString());
}

export function applySyncPayload(payload: WikiSyncPayload): WikiState {
  const pages = normalizePages(payload.pages as LegacyTopicPage[]);
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(payload.categories));
  localStorage.setItem(STORAGE_KEYS.pages, JSON.stringify(pages));
  localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(payload.completedPages));
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(payload.notes));
  localStorage.setItem(STORAGE_KEYS.language, payload.language);
  setLocalUpdatedAt(payload.updatedAt);

  return {
    categories: payload.categories,
    pages,
    completedPages: payload.completedPages,
    notes: payload.notes,
    language: payload.language,
  };
}

export function persistWikiState(
  state: WikiState,
  options?: { bumpTimestamp?: boolean }
): WikiSyncPayload {
  const bumpTimestamp = options?.bumpTimestamp !== false;
  const updatedAt = bumpTimestamp ? new Date().toISOString() : (getLocalUpdatedAt() || new Date().toISOString());

  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
  localStorage.setItem(STORAGE_KEYS.pages, JSON.stringify(state.pages));
  localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(state.completedPages));
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notes));
  localStorage.setItem(STORAGE_KEYS.language, state.language);
  setLocalUpdatedAt(updatedAt);

  return buildSyncPayload(state, updatedAt);
}

export function isValidSyncPayload(data: unknown): data is WikiSyncPayload {
  if (!data || typeof data !== 'object') return false;
  const payload = data as Partial<WikiSyncPayload>;
  return (
    payload.version === 1 &&
    typeof payload.updatedAt === 'string' &&
    Array.isArray(payload.categories) &&
    Array.isArray(payload.pages) &&
    Array.isArray(payload.completedPages) &&
    typeof payload.notes === 'object' &&
    payload.notes !== null &&
    (payload.language === 'en' || payload.language === 'ar')
  );
}
