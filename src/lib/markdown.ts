/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const CALLOUT_LINE = /^>\s*\[!(\w+)\]\s*$/;

function renderCalloutBody(body: string): string {
  return marked.parse(body.trim()) as string;
}

/** Converts GitHub-style alert syntax into styled HTML asides before marked runs. */
export function preprocessCallouts(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const calloutMatch = lines[i].match(CALLOUT_LINE);
    if (calloutMatch) {
      const kind = calloutMatch[1].toLowerCase();
      i += 1;
      const bodyLines: string[] = [];

      while (i < lines.length) {
        const line = lines[i];
        if (line.trim() === '') {
          if (bodyLines.length > 0) {
            i += 1;
            break;
          }
          i += 1;
          continue;
        }
        if (line.startsWith('>')) {
          bodyLines.push(line.replace(/^>\s?/, ''));
          i += 1;
        } else if (bodyLines.length === 0) {
          bodyLines.push(line);
          i += 1;
        } else {
          break;
        }
      }

      const bodyHtml = renderCalloutBody(bodyLines.join('\n'));
      result.push(
        `<aside class="wiki-callout wiki-callout-${kind}">` +
          `<div class="wiki-callout-label">${kind}</div>` +
          `<div class="wiki-callout-body">${bodyHtml}</div>` +
        `</aside>`
      );
    } else {
      result.push(lines[i]);
      i += 1;
    }
  }

  return result.join('\n');
}

export function renderMarkdown(markdown: string): string {
  if (!markdown.trim()) {
    return '';
  }
  const preprocessed = preprocessCallouts(markdown);
  return marked.parse(preprocessed) as string;
}

export type MarkdownSnippetId =
  | 'h1'
  | 'h2'
  | 'bold'
  | 'italic'
  | 'list'
  | 'link'
  | 'note'
  | 'warning'
  | 'tip'
  | 'table'
  | 'codeFence';

export const MARKDOWN_SNIPPETS: Record<MarkdownSnippetId, string> = {
  h1: '# Heading\n\n',
  h2: '## Heading\n\n',
  bold: '**bold text**',
  italic: '*italic text*',
  list: '- List item\n',
  link: '[link label](https://example.com)',
  note: '> [!NOTE]\nNote content\n\n',
  warning: '> [!WARNING]\nWarning content\n\n',
  tip: '> [!TIP]\nHelpful tip\n\n',
  table: '| Column A | Column B |\n| --- | --- |\n| Value | Value |\n\n',
  codeFence: '```typescript\n\n```\n\n',
};

export function insertSnippet(
  value: string,
  snippet: string,
  selectionStart: number,
  selectionEnd: number
): { nextValue: string; cursor: number } {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const nextValue = before + snippet + after;
  const cursor = selectionStart + snippet.length;
  return { nextValue, cursor };
}
