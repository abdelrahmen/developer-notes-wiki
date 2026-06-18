/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Category, Language, TopicPage } from '../types';
import { X } from 'lucide-react';

interface PageMetadataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  page: TopicPage;
  categories: Category[];
  language: Language;
  titleEn: string;
  titleAr: string;
  icon: string;
  categoryId: string;
  onChangeTitleEn: (value: string) => void;
  onChangeTitleAr: (value: string) => void;
  onChangeIcon: (value: string) => void;
  onChangeCategoryId: (value: string) => void;
}

export default function PageMetadataPanel({
  isOpen,
  onClose,
  page,
  categories,
  language,
  titleEn,
  titleAr,
  icon,
  categoryId,
  onChangeTitleEn,
  onChangeTitleAr,
  onChangeIcon,
  onChangeCategoryId,
}: PageMetadataPanelProps) {
  const isAr = language === 'ar';

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        dir={isAr ? 'rtl' : 'ltr'}
        className={`fixed top-0 z-50 h-full w-full max-w-sm bg-[#202020] border-[#2F2F2F] shadow-2xl flex flex-col ${
          isAr ? 'left-0 border-r' : 'right-0 border-l'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2F2F2F]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {isAr ? 'إعدادات الصفحة' : 'Page Settings'}
            </h2>
            <p className="text-[10px] text-[#9B9B9B] font-mono mt-0.5">{page.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#2F2F2F] rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1.5">
              {isAr ? 'إيموجي الصفحة' : 'Page emoji'}
            </label>
            <input
              type="text"
              maxLength={5}
              value={icon}
              onChange={(e) => onChangeIcon(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-center text-2xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1.5">
              {isAr ? 'القسم' : 'Category'}
            </label>
            <select
              value={categoryId}
              onChange={(e) => onChangeCategoryId(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? `${c.icon} ${c.titleAr}` : `${c.icon} ${c.titleEn}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1.5">
              Title (English)
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => onChangeTitleEn(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
              placeholder="Page title in English"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1.5 text-right">
              العنوان (العربية)
            </label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => onChangeTitleAr(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm text-right"
              placeholder="عنوان الصفحة بالعربية"
              dir="rtl"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
