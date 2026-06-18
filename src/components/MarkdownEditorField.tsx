/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Language } from '../types';
import { insertSnippet, MarkdownSnippetId, MARKDOWN_SNIPPETS } from '../lib/markdown';

interface MarkdownEditorFieldProps {
  contentEn: string;
  contentAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  language: Language;
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
  { id: 'codeFence', labelEn: 'Code', labelAr: 'كود' },
];

export default function MarkdownEditorField({
  contentEn,
  contentAr,
  onChangeEn,
  onChangeAr,
  language,
}: MarkdownEditorFieldProps) {
  const isAr = language === 'ar';
  const enRef = useRef<HTMLTextAreaElement>(null);
  const arRef = useRef<HTMLTextAreaElement>(null);
  const [activeField, setActiveField] = useState<ActiveField>('en');

  const applySnippet = (snippetId: MarkdownSnippetId) => {
    const snippet = MARKDOWN_SNIPPETS[snippetId];
    const ref = activeField === 'en' ? enRef : arRef;
    const textarea = ref.current;
    if (!textarea) return;

    const { nextValue, cursor } = insertSnippet(
      textarea.value,
      snippet,
      textarea.selectionStart,
      textarea.selectionEnd
    );

    if (activeField === 'en') {
      onChangeEn(nextValue);
    } else {
      onChangeAr(nextValue);
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 p-2 bg-[#252525] border border-[#2F2F2F] rounded">
        <span className="text-[10px] text-[#9B9B9B] self-center mr-1 uppercase tracking-wide">
          {isAr ? 'إدراج:' : 'Insert:'}
        </span>
        {TOOLBAR.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => applySnippet(item.id)}
            className="px-2 py-0.5 text-[11px] border border-[#2F2F2F] bg-[#202020] hover:bg-[#2F2F2F] text-gray-300 rounded cursor-pointer transition-colors"
          >
            {isAr ? item.labelAr : item.labelEn}
          </button>
        ))}
        <span className="text-[10px] text-[#9B9B9B] self-center ml-auto">
          {isAr
            ? `الحقل النشط: ${activeField === 'en' ? 'English' : 'العربية'}`
            : `Active: ${activeField === 'en' ? 'English' : 'Arabic'}`}
        </span>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[#9B9B9B] mb-1 uppercase tracking-wide">
          Markdown (English)
        </label>
        <textarea
          ref={enRef}
          value={contentEn}
          onFocus={() => setActiveField('en')}
          onChange={(e) => onChangeEn(e.target.value)}
          placeholder="## Section title&#10;&#10;Write content in Markdown..."
          className="w-full bg-[#191919] border border-[#2F2F2F] rounded p-3 text-sm text-white font-mono leading-relaxed min-h-[180px]"
          spellCheck={false}
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[#9B9B9B] mb-1 uppercase tracking-wide text-right">
          Markdown (العربية)
        </label>
        <textarea
          ref={arRef}
          value={contentAr}
          onFocus={() => setActiveField('ar')}
          onChange={(e) => onChangeAr(e.target.value)}
          placeholder="## عنوان القسم&#10;&#10;اكتب المحتوى بصيغة Markdown..."
          className="w-full bg-[#191919] border border-[#2F2F2F] rounded p-3 text-sm text-white font-mono leading-relaxed min-h-[180px] text-right"
          dir="rtl"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
