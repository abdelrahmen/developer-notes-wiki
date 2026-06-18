/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { renderMarkdown } from '../lib/markdown';

interface MarkdownContentProps {
  content: string;
  compact?: boolean;
}

export default function MarkdownContent({ content, compact = false }: MarkdownContentProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  if (!html) {
    return null;
  }

  return (
    <div
      className={`markdown-body ${compact ? 'markdown-body-compact' : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
