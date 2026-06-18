/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentBlock, ResourceLink } from '../types';

export function updateBlockAt(
  blocks: ContentBlock[],
  index: number,
  patch: Partial<ContentBlock>
): ContentBlock[] {
  const next = [...blocks];
  next[index] = { ...next[index], ...patch };
  return next;
}

export function appendBlock(blocks: ContentBlock[], block: ContentBlock): ContentBlock[] {
  return [...blocks, block];
}

export function removeBlockAt(blocks: ContentBlock[], index: number): ContentBlock[] {
  return blocks.filter((_, i) => i !== index);
}

export function createMarkdownBlock(): ContentBlock {
  return {
    id: `md-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'markdown',
    contentEn: '',
    contentAr: '',
  };
}

export function createCodeBlock(): ContentBlock {
  return {
    id: `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'code',
    language: 'typescript',
    code: '',
  };
}

export function createLinksBlock(): ContentBlock {
  return {
    id: `links-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'links',
    links: [
      {
        id: `link-${Date.now()}`,
        labelEn: 'Documentation',
        labelAr: 'التوثيق',
        url: 'https://',
        type: 'docs',
      },
    ],
  };
}

export function updateLinkAt(
  blocks: ContentBlock[],
  blockIndex: number,
  linkIndex: number,
  patch: Partial<ResourceLink>
): ContentBlock[] {
  const block = blocks[blockIndex];
  if (block.type !== 'links' || !block.links) return blocks;
  const nextLinks = [...block.links];
  nextLinks[linkIndex] = { ...nextLinks[linkIndex], ...patch };
  return updateBlockAt(blocks, blockIndex, { links: nextLinks });
}

export function addLinkToBlock(blocks: ContentBlock[], blockIndex: number): ContentBlock[] {
  const block = blocks[blockIndex];
  if (block.type !== 'links') return blocks;
  const newLink: ResourceLink = {
    id: `link-${Date.now()}-${Math.floor(Math.random() * 10)}`,
    labelEn: 'New link',
    labelAr: 'رابط جديد',
    url: 'https://',
    type: 'docs',
  };
  return updateBlockAt(blocks, blockIndex, { links: [...(block.links ?? []), newLink] });
}

export function removeLinkFromBlock(
  blocks: ContentBlock[],
  blockIndex: number,
  linkIndex: number
): ContentBlock[] {
  const block = blocks[blockIndex];
  if (block.type !== 'links' || !block.links) return blocks;
  return updateBlockAt(blocks, blockIndex, {
    links: block.links.filter((_, i) => i !== linkIndex),
  });
}
