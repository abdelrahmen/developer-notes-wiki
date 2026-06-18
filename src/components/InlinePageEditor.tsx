/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ContentBlock, Language, ResourceLink } from '../types';
import { insertSnippet, MarkdownSnippetId, MARKDOWN_SNIPPETS } from '../lib/markdown';
import AutoResizeTextarea from './AutoResizeTextarea';
import {
  addLinkToBlock,
  appendBlock,
  createCodeBlock,
  createLinksBlock,
  removeBlockAt,
  removeLinkFromBlock,
  updateBlockAt,
  updateLinkAt,
} from '../lib/pageBlocks';
import { Code, Link as LinkIcon, Plus, Trash2, X } from 'lucide-react';

interface InlinePageEditorProps {
  blocks: ContentBlock[];
  language: Language;
  onChangeBlocks: (blocks: ContentBlock[]) => void;
}

type ActiveField = 'en' | 'ar';

const TOOLBAR: { id: MarkdownSnippetId; labelEn: string; labelAr: string }[] = [
  { id: 'h1', labelEn: 'H1', labelAr: 'H1' },
  { id: 'h2', labelEn: 'H2', labelAr: 'H2' },
  { id: 'bold', labelEn: 'Bold', labelAr: 'عريض' },
  { id: 'italic', labelEn: 'Italic', labelAr: 'مائل' },
  { id: 'list', labelEn: 'List', labelAr: 'قائمة' },
  { id: 'link', labelEn: 'Link', labelAr: 'رابط' },
  { id: 'note', labelEn: 'Note', labelAr: 'ملاحظة' },
  { id: 'warning', labelEn: 'Warning', labelAr: 'تحذير' },
  { id: 'tip', labelEn: 'Tip', labelAr: 'نصيحة' },
  { id: 'table', labelEn: 'Table', labelAr: 'جدول' },
];

export default function InlinePageEditor({
  blocks,
  language,
  onChangeBlocks,
}: InlinePageEditorProps) {
  const isAr = language === 'ar';
  const [activeField, setActiveField] = useState<ActiveField>(isAr ? 'ar' : 'en');
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const applySnippet = (snippetId: MarkdownSnippetId) => {
    if (focusedBlockIndex === null) return;
    const block = blocks[focusedBlockIndex];
    if (block.type !== 'markdown') return;

    const refKey = `${focusedBlockIndex}-${activeField}`;
    const textarea = textareaRefs.current[refKey];
    if (!textarea) return;

    const current = activeField === 'en' ? block.contentEn ?? '' : block.contentAr ?? '';
    const { nextValue, cursor } = insertSnippet(
      current,
      MARKDOWN_SNIPPETS[snippetId],
      textarea.selectionStart,
      textarea.selectionEnd
    );

    onChangeBlocks(
      updateBlockAt(blocks, focusedBlockIndex, {
        [activeField === 'en' ? 'contentEn' : 'contentAr']: nextValue,
      })
    );

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
      textarea.style.height = '0px';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  };

  return (
    <div className="space-y-1">
      <div className="sticky top-0 z-10 -mx-2 px-2 py-2 mb-4 bg-[#191919]/95 backdrop-blur-sm border border-[#2F2F2F] rounded-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[#9B9B9B] uppercase tracking-wide mr-1">
            {isAr ? 'إدراج:' : 'Insert:'}
          </span>
          {TOOLBAR.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applySnippet(item.id)}
              className="px-2 py-0.5 text-[11px] border border-[#2F2F2F] bg-[#252525] hover:bg-[#2F2F2F] text-gray-300 rounded cursor-pointer"
            >
              {isAr ? item.labelAr : item.labelEn}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto border border-[#2F2F2F] rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveField('en')}
              className={`px-2 py-0.5 text-[10px] font-semibold ${
                activeField === 'en' ? 'bg-[#3E7B5D] text-white' : 'bg-[#252525] text-[#9B9B9B]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setActiveField('ar')}
              className={`px-2 py-0.5 text-[10px] font-semibold ${
                activeField === 'ar' ? 'bg-[#3E7B5D] text-white' : 'bg-[#252525] text-[#9B9B9B]'
              }`}
            >
              AR
            </button>
          </div>
        </div>
      </div>

      {blocks.map((block, blockIndex) => {
        switch (block.type) {
          case 'markdown':
            return (
              <div key={block.id} className="group relative">
                <AutoResizeTextarea
                  textareaRef={(el) => {
                    textareaRefs.current[`${blockIndex}-en`] = el;
                  }}
                  value={block.contentEn ?? ''}
                  visible={activeField === 'en'}
                  onChange={(e) =>
                    onChangeBlocks(updateBlockAt(blocks, blockIndex, { contentEn: e.target.value }))
                  }
                  onFocus={() => {
                    setFocusedBlockIndex(blockIndex);
                    setActiveField('en');
                  }}
                  placeholder="Write in Markdown (English)..."
                  className={`w-full bg-transparent border-0 outline-none text-[#E3E3E3] font-mono text-sm leading-relaxed placeholder-[#555] ${
                    activeField === 'en' ? 'block' : 'hidden'
                  }`}
                  spellCheck={false}
                />
                <AutoResizeTextarea
                  textareaRef={(el) => {
                    textareaRefs.current[`${blockIndex}-ar`] = el;
                  }}
                  value={block.contentAr ?? ''}
                  visible={activeField === 'ar'}
                  onChange={(e) =>
                    onChangeBlocks(updateBlockAt(blocks, blockIndex, { contentAr: e.target.value }))
                  }
                  onFocus={() => {
                    setFocusedBlockIndex(blockIndex);
                    setActiveField('ar');
                  }}
                  placeholder="اكتب بصيغة Markdown (العربية)..."
                  dir="rtl"
                  className={`w-full bg-transparent border-0 outline-none text-[#E3E3E3] font-mono text-sm leading-relaxed placeholder-[#555] text-right ${
                    activeField === 'ar' ? 'block' : 'hidden'
                  }`}
                  spellCheck={false}
                />
              </div>
            );

          case 'code':
            return (
              <div
                key={block.id}
                className="my-6 rounded-lg border border-[#2F2F2F] bg-[#202020] overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-[#2F2F2F]">
                  <div className="flex items-center gap-2">
                    <Code size={13} className="text-[#9B9B9B]" />
                    <select
                      value={block.language || 'typescript'}
                      onChange={(e) =>
                        onChangeBlocks(updateBlockAt(blocks, blockIndex, { language: e.target.value }))
                      }
                      className="bg-[#191919] text-[11px] text-white border border-[#2F2F2F] rounded px-1.5 py-0.5"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="dockerfile">Dockerfile</option>
                      <option value="yaml">YAML</option>
                      <option value="sql">SQL</option>
                      <option value="python">Python</option>
                      <option value="bash">Bash</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeBlocks(removeBlockAt(blocks, blockIndex))}
                    className="p-1 text-[#9B9B9B] hover:text-red-400 rounded"
                    title={isAr ? 'حذف' : 'Remove'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <AutoResizeTextarea
                  value={block.code ?? ''}
                  minHeightPx={64}
                  onChange={(e) =>
                    onChangeBlocks(updateBlockAt(blocks, blockIndex, { code: e.target.value }))
                  }
                  className="w-full bg-[#191919] p-4 font-mono text-xs text-[#CBD5E1] border-0 outline-none"
                  spellCheck={false}
                />
              </div>
            );

          case 'links':
            return (
              <div
                key={block.id}
                className="my-6 p-4 rounded-lg border border-[#2F2F2F] bg-[#202020]/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B] flex items-center gap-1.5">
                    <LinkIcon size={12} />
                    {isAr ? 'روابط مرجعية' : 'Resource links'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeBlocks(removeBlockAt(blocks, blockIndex))}
                    className="p-1 text-[#9B9B9B] hover:text-red-400 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {block.links?.map((lnk, linkIndex) => (
                  <div key={lnk.id} className="p-3 bg-[#252525] rounded border border-[#2F2F2F] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#9B9B9B]">#{linkIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeBlocks(removeLinkFromBlock(blocks, blockIndex, linkIndex))
                        }
                        className="text-[#9B9B9B] hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={lnk.labelEn}
                        onChange={(e) =>
                          onChangeBlocks(
                            updateLinkAt(blocks, blockIndex, linkIndex, { labelEn: e.target.value })
                          )
                        }
                        placeholder="Label (EN)"
                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1.5 text-white"
                      />
                      <input
                        type="text"
                        value={lnk.labelAr}
                        onChange={(e) =>
                          onChangeBlocks(
                            updateLinkAt(blocks, blockIndex, linkIndex, { labelAr: e.target.value })
                          )
                        }
                        placeholder="Label (AR)"
                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1.5 text-white text-right"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={lnk.url}
                        onChange={(e) =>
                          onChangeBlocks(
                            updateLinkAt(blocks, blockIndex, linkIndex, { url: e.target.value })
                          )
                        }
                        placeholder="https://"
                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1.5 text-white col-span-2 font-mono"
                      />
                      <select
                        value={lnk.type}
                        onChange={(e) =>
                          onChangeBlocks(
                            updateLinkAt(blocks, blockIndex, linkIndex, {
                              type: e.target.value as ResourceLink['type'],
                            })
                          )
                        }
                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1 text-white"
                      >
                        <option value="docs">Docs</option>
                        <option value="project">Project</option>
                        <option value="github">GitHub</option>
                        <option value="link">Link</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onChangeBlocks(addLinkToBlock(blocks, blockIndex))}
                  className="w-full py-1.5 border border-dashed border-[#2F2F2F] text-[11px] text-[#3E7B5D] rounded flex items-center justify-center gap-1"
                >
                  <Plus size={12} />
                  {isAr ? 'رابط' : 'Add link'}
                </button>
              </div>
            );

          default: {
            const _exhaustive: never = block.type;
            return null;
          }
        }
      })}

      <div className="flex flex-wrap gap-2 pt-6 mt-4 border-t border-[#2F2F2F]/50">
        <button
          type="button"
          onClick={() => onChangeBlocks(appendBlock(blocks, createCodeBlock()))}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#2F2F2F] rounded hover:bg-[#252525] text-[#9B9B9B] hover:text-white"
        >
          <Code size={13} />
          {isAr ? 'إضافة كود' : 'Add code block'}
        </button>
        <button
          type="button"
          onClick={() => onChangeBlocks(appendBlock(blocks, createLinksBlock()))}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#2F2F2F] rounded hover:bg-[#252525] text-[#9B9B9B] hover:text-white"
        >
          <LinkIcon size={13} />
          {isAr ? 'إضافة روابط' : 'Add resource links'}
        </button>
      </div>
    </div>
  );
}
