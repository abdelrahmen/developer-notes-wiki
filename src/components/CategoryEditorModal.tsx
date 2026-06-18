/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Category, Language } from '../types';
import { X } from 'lucide-react';

interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'add-category' | 'editing-category';
  categories: Category[];
  initialCategoryData?: Category;
  onSaveCategory: (category: Category) => void;
  language: Language;
}

export default function CategoryEditorModal({
  isOpen,
  onClose,
  type,
  categories,
  initialCategoryData,
  onSaveCategory,
  language,
}: CategoryEditorModalProps) {
  const [catId, setCatId] = useState('');
  const [catTitleEn, setCatTitleEn] = useState('');
  const [catTitleAr, setCatTitleAr] = useState('');
  const [catIcon, setCatIcon] = useState('📁');
  const [catParentId, setCatParentId] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (type === 'add-category') {
      setCatId('cat-' + Date.now());
      setCatTitleEn('');
      setCatTitleAr('');
      setCatIcon('📁');
      setCatParentId('');
    } else if (initialCategoryData) {
      setCatId(initialCategoryData.id);
      setCatTitleEn(initialCategoryData.titleEn);
      setCatTitleAr(initialCategoryData.titleAr);
      setCatIcon(initialCategoryData.icon);
      setCatParentId(initialCategoryData.parentId || '');
    }
  }, [isOpen, type, initialCategoryData]);

  if (!isOpen) return null;

  const isAr = language === 'ar';

  const submitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitleEn.trim() || !catTitleAr.trim()) {
      alert(isAr ? 'يرجى ملء جميع الحقول الإنجليزية والعربية للقسم' : 'Please fill out both English and Arabic title fields');
      return;
    }
    onSaveCategory({
      id: catId,
      titleEn: catTitleEn.trim(),
      titleAr: catTitleAr.trim(),
      icon: catIcon.trim() || '📁',
      parentId: catParentId ? catParentId : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className={`w-full max-w-lg bg-[#202020] border border-[#2F2F2F] rounded-lg shadow-2xl overflow-hidden ${
          isAr ? 'font-cairo' : 'font-sans'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2F2F2F]">
          <h2 className="text-lg font-bold text-white">
            {type === 'add-category'
              ? isAr ? 'إضافة قسم جديد' : 'New Category'
              : isAr ? 'تعديل القسم' : 'Edit Category'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#2F2F2F] rounded text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submitCategory} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs text-[#9B9B9B] font-semibold mb-1">
                {isAr ? 'أيقونة' : 'Emoji'}
              </label>
              <input
                type="text"
                maxLength={5}
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-center text-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">ID</label>
              <input
                type="text"
                disabled={type === 'editing-category'}
                value={catId}
                onChange={(e) => setCatId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-gray-300 font-mono text-sm disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">Title (English)</label>
            <input
              type="text"
              value={catTitleEn}
              onChange={(e) => setCatTitleEn(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">العنوان (العربية)</label>
            <input
              type="text"
              value={catTitleAr}
              onChange={(e) => setCatTitleAr(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm text-right"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">
              {isAr ? 'القسم الرئيسي (اختياري)' : 'Parent category (optional)'}
            </label>
            <select
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
              className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
            >
              <option value="">{isAr ? 'بدون' : 'None'}</option>
              {categories.filter((c) => c.id !== catId).map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? `${c.icon} ${c.titleAr}` : `${c.icon} ${c.titleEn}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2F2F2F]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2F2F2F] hover:bg-[#373737] text-[#E3E3E3] rounded text-sm"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3E7B5D] hover:bg-[#468969] text-white rounded text-sm font-semibold"
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
