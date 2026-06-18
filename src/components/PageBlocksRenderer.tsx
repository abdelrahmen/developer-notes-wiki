/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ContentBlock, Language } from '../types';
import MarkdownContent from './MarkdownContent';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface PageBlocksRendererProps {
  blocks: ContentBlock[];
  language: Language;
  compact?: boolean;
  copiedBlockId: string | null;
  onCopyCode: (text: string, blockId: string) => void;
}

export default function PageBlocksRenderer({
  blocks,
  language,
  compact = false,
  copiedBlockId,
  onCopyCode,
}: PageBlocksRendererProps) {
  const isAr = language === 'ar';

  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'markdown':
            return (
              <div key={block.id}>
                <MarkdownContent
                  content={(isAr ? block.contentAr : block.contentEn) ?? ''}
                  compact={compact}
                />
              </div>
            );

          case 'code':
            return (
              <div
                key={block.id}
                className="rounded bg-[#202020] border border-[#2F2F2F] overflow-hidden font-mono text-xs flex flex-col shadow-sm"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-[#2F2F2F] text-[#9B9B9B] text-[11px] select-none">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="flex space-x-1 space-x-reverse">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#373737]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#454545]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#555555]" />
                    </div>
                    <span className="text-[#E3E3E3] font-semibold tracking-wider font-mono uppercase bg-[#191919] px-2 py-0.5 rounded border border-[#2F2F2F]">
                      {block.language || 'typescript'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCopyCode(block.code || '', block.id)}
                    className="flex items-center space-x-1.5 space-x-reverse px-2 py-1 bg-[#2F2F2F] border border-[#373737] rounded hover:bg-[#373737] hover:text-[#E3E3E3] transition-all active:scale-95 cursor-pointer text-[#E3E3E3]"
                  >
                    {copiedBlockId === block.id ? (
                      <>
                        <Check size={11} className="text-[#3E7B5D]" />
                        <span className="text-[#3E7B5D] font-semibold">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>{isAr ? 'نسخ الشفرة' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-[#191919] text-[#CBD5E1] overflow-x-auto whitespace-pre leading-relaxed select-all">
                  <code>{block.code}</code>
                </pre>
              </div>
            );

          case 'links':
            return (
              <div key={block.id} className="space-y-3 mt-4">
                <div className="flex items-center space-x-2 space-x-reverse text-[#9B9B9B] font-bold text-xs uppercase tracking-wider select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9B9B9B]" />
                  <span>{isAr ? 'المراجع ومصادر التعلم البرمجية' : 'Resource Documentation & Project Links'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {block.links?.map((lnk) => (
                    <a
                      key={lnk.id}
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 bg-[#202020] border border-[#2F2F2F] hover:bg-[#252525] hover:border-[#373737] rounded transition-all flex items-center justify-between group/link shadow-sm"
                    >
                      <div className="flex items-center space-x-2.5 space-x-reverse truncate pr-1">
                        <span className="text-sm bg-[#2F2F2F] text-white p-1.5 rounded font-bold">
                          {lnk.type === 'github' ? '📦' : lnk.type === 'docs' ? '📄' : '🔗'}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-[#E3E3E3] group-hover/link:text-white transition-colors truncate">
                            {isAr ? lnk.labelAr : lnk.labelEn}
                          </p>
                          <p className="text-[10px] text-[#9B9B9B] font-mono truncate">{lnk.url}</p>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-[#9B9B9B] group-hover/link:text-[#E3E3E3] transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            );

          default: {
            const _exhaustive: never = block.type;
            return null;
          }
        }
      })}
    </div>
  );
}
