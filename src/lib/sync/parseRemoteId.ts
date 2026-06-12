/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function parseJsonBinId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const urlMatch = trimmed.match(/jsonbin\.io\/(?:v3\/)?b\/([a-f0-9]+)/i);
  if (urlMatch) return urlMatch[1];

  return trimmed.replace(/[^a-f0-9]/gi, '');
}

export function parseGistId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const urlMatch = trimmed.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]+)/i);
  if (urlMatch) return urlMatch[1];

  return trimmed.replace(/[^a-f0-9]/gi, '');
}
