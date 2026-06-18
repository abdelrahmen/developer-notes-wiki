/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentBlock, TopicPage } from '../types';

export type LegacyContentBlock = {
  id: string;
  type: string;
  contentEn?: string;
  contentAr?: string;
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

export type LegacyTopicPage = TopicPage & {
  personalClarificationEn?: string;
  personalClarificationAr?: string;
};

function newMarkdownId(): string {
  return `md-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function legacyPartToMarkdown(block: LegacyContentBlock): { en: string; ar: string } | null {
  switch (block.type) {
    case 'markdown':
      return {
        en: block.contentEn ?? block.textEn ?? '',
        ar: block.contentAr ?? block.textAr ?? '',
      };
    case 'heading':
      return {
        en: `## ${block.titleEn ?? ''}`.trim(),
        ar: `## ${block.titleAr ?? ''}`.trim(),
      };
    case 'paragraph':
      return { en: block.textEn ?? '', ar: block.textAr ?? '' };
    case 'callout': {
      const en = block.textEn?.trim() ?? '';
      const ar = block.textAr?.trim() ?? '';
      return {
        en: en.startsWith('> [!') ? en : `> [!TIP]\n${en}`,
        ar: ar.startsWith('> [!') ? ar : `> [!TIP]\n${ar}`,
      };
    }
    case 'definition': {
      const titleEn = block.titleEn?.trim();
      const titleAr = block.titleAr?.trim();
      const textEn = block.textEn?.trim() ?? '';
      const textAr = block.textAr?.trim() ?? '';
      return {
        en: titleEn ? `**${titleEn}**\n\n${textEn}` : textEn,
        ar: titleAr ? `**${titleAr}**\n\n${textAr}` : textAr,
      };
    }
    case 'image':
      return {
        en: `![${block.captionEn ?? ''}](${block.imageUrl ?? ''})`,
        ar: `![${block.captionAr ?? ''}](${block.imageUrl ?? ''})`,
      };
    default:
      return null;
  }
}

function flushMarkdownBuffer(
  enParts: string[],
  arParts: string[],
  result: ContentBlock[],
  blockId?: string
): void {
  const contentEn = enParts.filter(Boolean).join('\n\n').trim();
  const contentAr = arParts.filter(Boolean).join('\n\n').trim();
  if (!contentEn && !contentAr) {
    return;
  }
  result.push({
    id: blockId ?? newMarkdownId(),
    type: 'markdown',
    contentEn,
    contentAr,
  });
}

export function migrateBlocks(blocks: LegacyContentBlock[]): ContentBlock[] {
  const result: ContentBlock[] = [];
  let enParts: string[] = [];
  let arParts: string[] = [];
  let pendingMarkdownId: string | undefined;

  const flush = () => {
    flushMarkdownBuffer(enParts, arParts, result, pendingMarkdownId);
    enParts = [];
    arParts = [];
    pendingMarkdownId = undefined;
  };

  for (const block of blocks) {
    if (block.type === 'code') {
      flush();
      result.push({
        id: block.id,
        type: 'code',
        language: block.language ?? 'typescript',
        code: block.code ?? '',
      });
      continue;
    }

    if (block.type === 'links') {
      flush();
      result.push({
        id: block.id,
        type: 'links',
        links: block.links ?? [],
      });
      continue;
    }

    const part = legacyPartToMarkdown(block);
    if (part) {
      if (block.type === 'markdown') {
        flush();
        pendingMarkdownId = block.id;
      }
      if (part.en) enParts.push(part.en);
      if (part.ar) arParts.push(part.ar);
    }
  }

  flush();
  return result;
}

export function normalizePage(page: LegacyTopicPage): TopicPage {
  const {
    personalClarificationEn,
    personalClarificationAr,
    blocks: legacyBlocks,
    ...rest
  } = page;

  let blocks = migrateBlocks(legacyBlocks ?? []);

  const clarEn = personalClarificationEn?.trim();
  const clarAr = personalClarificationAr?.trim();
  if (clarEn || clarAr) {
    const prefixEn = clarEn ? `> [!NOTE]\n${clarEn}\n\n` : '';
    const prefixAr = clarAr ? `> [!NOTE]\n${clarAr}\n\n` : '';
    const firstMarkdownIndex = blocks.findIndex((b) => b.type === 'markdown');
    if (firstMarkdownIndex >= 0) {
      const existing = blocks[firstMarkdownIndex];
      blocks = [...blocks];
      blocks[firstMarkdownIndex] = {
        ...existing,
        contentEn: prefixEn + (existing.contentEn ?? ''),
        contentAr: prefixAr + (existing.contentAr ?? ''),
      };
    } else {
      blocks.unshift({
        id: newMarkdownId(),
        type: 'markdown',
        contentEn: prefixEn.trim(),
        contentAr: prefixAr.trim(),
      });
    }
  }

  if (blocks.length === 0) {
    blocks = [
      {
        id: newMarkdownId(),
        type: 'markdown',
        contentEn: '',
        contentAr: '',
      },
    ];
  }

  return { ...rest, blocks };
}

export function normalizePages(pages: LegacyTopicPage[]): TopicPage[] {
  return pages.map(normalizePage);
}
