/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ar';

export interface Category {
  id: string;
  titleEn: string;
  titleAr: string;
  icon: string; // Emoji e.g., "💻"
  parentId?: string; // Links to parent Category ID for nested dropdown trees
}

export interface ResourceLink {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string;
  type: 'docs' | 'project' | 'link' | 'github';
}

export type BlockType = 'markdown' | 'code' | 'links';

export interface ContentBlock {
  id: string;
  type: BlockType;

  // Markdown block
  contentEn?: string;
  contentAr?: string;

  // Code block
  code?: string;
  language?: string;

  // Links block
  links?: ResourceLink[];
}

export interface TopicPage {
  id: string;
  categoryId: string;
  titleEn: string;
  titleAr: string;
  icon: string; // Emoji e.g., "🚀"
  lastUpdated: string;
  blocks: ContentBlock[];
}

export interface UserProgress {
  completedPages: string[]; // List of page IDs
  notes: Record<string, string>; // Page ID -> personal custom notes
}

export interface WikiSyncPayload {
  version: 1;
  updatedAt: string;
  categories: Category[];
  pages: TopicPage[];
  completedPages: string[];
  notes: Record<string, string>;
  language: Language;
}

export type SyncProvider = 'none' | 'jsonbin' | 'gist';

export interface SyncConfig {
  provider: SyncProvider;
  jsonbin: { apiKey: string; binId: string };
  gist: { token: string; gistId: string };
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface WikiState {
  categories: Category[];
  pages: TopicPage[];
  completedPages: string[];
  notes: Record<string, string>;
  language: Language;
}
