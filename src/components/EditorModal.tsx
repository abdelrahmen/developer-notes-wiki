/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Category, TopicPage, ContentBlock, ResourceLink, Language } from '../types';
import { X, Plus, Trash2, Code, FileText, Link as LinkIcon, GripVertical } from 'lucide-react';
import MarkdownEditorField from './MarkdownEditorField';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'add-category' | 'editing-category' | 'add-page' | 'edit-page';
  categories: Category[];
  initialPageData?: TopicPage;
  initialCategoryData?: Category;
  onSaveCategory: (category: Category) => void;
  onSavePage: (page: TopicPage) => void;
  language: Language;
}

export default function EditorModal({
  isOpen,
  onClose,
  type,
  categories,
  initialPageData,
  initialCategoryData,
  onSaveCategory,
  onSavePage,
  language
}: EditorModalProps) {
  const [catId, setCatId] = useState('');
  const [catTitleEn, setCatTitleEn] = useState('');
  const [catTitleAr, setCatTitleAr] = useState('');
  const [catIcon, setCatIcon] = useState('📁');
  const [catParentId, setCatParentId] = useState('');

  const [pageId, setPageId] = useState('');
  const [pageCategoryId, setPageCategoryId] = useState('');
  const [pageTitleEn, setPageTitleEn] = useState('');
  const [pageTitleAr, setPageTitleAr] = useState('');
  const [pageIcon, setPageIcon] = useState('📄');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'meta' | 'content'>('meta');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('meta');
      if (type === 'add-category') {
        const generatedId = 'cat-' + Date.now();
        setCatId(generatedId);
        setCatTitleEn('');
        setCatTitleAr('');
        setCatIcon('📁');
        setCatParentId('');
      } else if (type === 'editing-category' && initialCategoryData) {
        setCatId(initialCategoryData.id);
        setCatTitleEn(initialCategoryData.titleEn);
        setCatTitleAr(initialCategoryData.titleAr);
        setCatIcon(initialCategoryData.icon);
        setCatParentId(initialCategoryData.parentId || '');
      } else if (type === 'add-page') {
        const generatedId = 'page-' + Date.now();
        setPageId(generatedId);
        setPageCategoryId(categories[0]?.id || '');
        setPageTitleEn('');
        setPageTitleAr('');
        setPageIcon('🚀');
        setBlocks([
          {
            id: 'block-md-' + Date.now(),
            type: 'markdown',
            contentEn: '## Section\n\nWrite your article content here.',
            contentAr: '## عنوان القسم\n\nاكتب محتوى المقالة هنا.',
          },
        ]);
      } else if (type === 'edit-page' && initialPageData) {
        setPageId(initialPageData.id);
        setPageCategoryId(initialPageData.categoryId);
        setPageTitleEn(initialPageData.titleEn);
        setPageTitleAr(initialPageData.titleAr);
        setPageIcon(initialPageData.icon);
        setBlocks(initialPageData.blocks || []);
      }
    }
  }, [isOpen, type, initialCategoryData, initialPageData, categories]);

  if (!isOpen) return null;

  const isAr = language === 'ar';

  const addBlock = (blockType: 'markdown' | 'code' | 'links') => {
    const id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 100);
    let newBlock: ContentBlock;

    switch (blockType) {
      case 'markdown':
        newBlock = {
          id,
          type: 'markdown',
          contentEn: '',
          contentAr: '',
        };
        break;
      case 'code':
        newBlock = { id, type: 'code', language: 'typescript', code: '// Enter script here' };
        break;
      case 'links':
        newBlock = {
          id,
          type: 'links',
          links: [
            {
              id: 'link-' + Date.now(),
              labelEn: 'Official Website',
              labelAr: 'الموقع الرسمي للتوثيق',
              url: 'https://',
              type: 'docs',
            },
          ],
        };
        break;
    }

    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, updatedFields: Partial<ContentBlock>) => {
    const nextBlocks = [...blocks];
    nextBlocks[index] = { ...nextBlocks[index], ...updatedFields };
    setBlocks(nextBlocks);
  };

  const handleReorderBlocks = (draggedIndex: number, targetIndex: number) => {
    if (draggedIndex === targetIndex) return;
    const nextBlocks = [...blocks];
    const [draggedBlock] = nextBlocks.splice(draggedIndex, 1);
    nextBlocks.splice(targetIndex, 0, draggedBlock);
    setBlocks(nextBlocks);
  };

  const handleLinkUpdate = (blockIndex: number, linkIndex: number, updatedLinkFields: Partial<ResourceLink>) => {
    const block = blocks[blockIndex];
    if (block.type === 'links' && block.links) {
      const nextLinks = [...block.links];
      nextLinks[linkIndex] = { ...nextLinks[linkIndex], ...updatedLinkFields };
      updateBlock(blockIndex, { links: nextLinks });
    }
  };

  const handleAddLinkToBlock = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (block.type === 'links') {
      const currentLinks = block.links || [];
      const newLink: ResourceLink = {
        id: 'link-' + Date.now() + '-' + Math.floor(Math.random() * 10),
        labelEn: 'New Documentation',
        labelAr: 'توثيق مرجعي جديد',
        url: 'https://',
        type: 'docs',
      };
      updateBlock(blockIndex, { links: [...currentLinks, newLink] });
    }
  };

  const handleRemoveLinkFromBlock = (blockIndex: number, linkIndex: number) => {
    const block = blocks[blockIndex];
    if (block.type === 'links' && block.links) {
      const nextLinks = block.links.filter((_, i) => i !== linkIndex);
      updateBlock(blockIndex, { links: nextLinks });
    }
  };

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

  const submitPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitleEn.trim() || !pageTitleAr.trim()) {
      alert(isAr ? 'عنوان الصفحة مطلوب باللغتين' : 'Page title is required in both English and Arabic');
      return;
    }
    if (!pageCategoryId) {
      alert(isAr ? 'الرجاء اختيار قسم رئيسي' : 'Please select a parent category');
      return;
    }
    onSavePage({
      id: pageId,
      categoryId: pageCategoryId,
      titleEn: pageTitleEn.trim(),
      titleAr: pageTitleAr.trim(),
      icon: pageIcon.trim() || '📄',
      lastUpdated: new Date().toISOString().split('T')[0],
      blocks,
    });
    onClose();
  };

  const isCategory = type === 'add-category' || type === 'editing-category';

  const blockLabel = (block: ContentBlock): string => {
    switch (block.type) {
      case 'markdown':
        return 'Markdown';
      case 'code':
        return isAr ? 'كود' : 'Code';
      case 'links':
        return isAr ? 'روابط' : 'Links';
      default: {
        const _exhaustive: never = block.type;
        return _exhaustive;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className={`w-full max-w-3xl bg-[#202020] border border-[#2F2F2F] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isAr ? 'font-cairo' : 'font-sans'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2F2F2F] bg-[#202020]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isCategory
                ? type === 'add-category'
                  ? isAr ? 'إضافة قسم جديد' : 'New Developer Category'
                  : isAr ? 'تعديل بيانات القسم' : 'Edit Developer Category'
                : type === 'add-page'
                  ? isAr ? 'إضافة صفحة موضوع جديدة' : 'Add New Wiki Page'
                  : isAr ? 'تعديل محتوى الصفحة' : 'Modify Wiki Page'}
            </h2>
            <p className="text-xs text-[#9B9B9B] mt-1">
              {isAr ? 'يتم حفظ كافة البيانات محلياً في المتصفح' : 'All modifications are persisted securely in local memory'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2F2F2F] rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isCategory ? (
          <form onSubmit={submitCategory} className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs text-[#9B9B9B] font-semibold mb-1">
                  {isAr ? 'أيقونة إيموجي' : 'Category Emoji'}
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-center text-xl hover:bg-[#282828] transition-colors"
                  placeholder="📁"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">
                  ID (Unique URL identifier)
                </label>
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
              <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">
                Category Title (English)
              </label>
              <input
                type="text"
                value={catTitleEn}
                onChange={(e) => setCatTitleEn(e.target.value)}
                className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
                placeholder="e.g. Frontend Architecture"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">
                عنوان القسم باللغة العربية
              </label>
              <input
                type="text"
                value={catTitleAr}
                onChange={(e) => setCatTitleAr(e.target.value)}
                className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm text-right"
                placeholder="مثال: هندسة واجهات المستخدم"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">
                {isAr ? 'القسم الرئيسي الحاضن (اختياري لبناء قوائم منسدلة متداخلة)' : 'Parent Category (Optional - for nested folders)'}
              </label>
              <select
                value={catParentId}
                onChange={(e) => setCatParentId(e.target.value)}
                className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
              >
                <option value="">{isAr ? 'بدون (قسم رئيسي في القمة)' : 'None (Top-Level Category)'}</option>
                {categories.filter(c => c.id !== catId).map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? `${c.icon} ${c.titleAr}` : `${c.icon} ${c.titleEn}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-[#2F2F2F]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#2F2F2F] hover:bg-[#373737] text-[#E3E3E3] rounded text-sm transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#3E7B5D] hover:bg-[#468969] text-white rounded text-sm font-semibold transition-colors cursor-pointer"
              >
                {isAr ? 'حفظ القسم' : 'Save Category'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitPage} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex bg-[#202020] px-6 border-b border-[#2F2F2F]">
              <button
                type="button"
                onClick={() => setActiveTab('meta')}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'meta'
                    ? 'border-[#E3E3E3] text-white'
                    : 'border-transparent text-[#9B9B9B] hover:text-[#E3E3E3]'
                }`}
              >
                {isAr ? 'معلومات الصفحة' : '1. Page Metadata'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'content'
                    ? 'border-[#E3E3E3] text-white'
                    : 'border-transparent text-[#9B9B9B] hover:text-[#E3E3E3]'
                }`}
              >
                {isAr ? `المحتوى (${blocks.length})` : `2. Content (${blocks.length})`}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'meta' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs text-[#9B9B9B] font-semibold mb-1">
                        {isAr ? 'إيموجي' : 'Emoji'}
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={pageIcon}
                        onChange={(e) => setPageIcon(e.target.value)}
                        className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-center text-xl"
                        placeholder="📄"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-[#9B9B9B] font-semibold mb-1">
                        {isAr ? 'القسم الحاضن' : 'Parent Category'}
                      </label>
                      <select
                        value={pageCategoryId}
                        onChange={(e) => setPageCategoryId(e.target.value)}
                        className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {isAr ? `${c.icon} ${c.titleAr}` : `${c.icon} ${c.titleEn}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#9B9B9B] mb-1">
                        Page Title (English)
                      </label>
                      <input
                        type="text"
                        value={pageTitleEn}
                        onChange={(e) => setPageTitleEn(e.target.value)}
                        className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm"
                        placeholder="e.g., Redux Toolkit State Flow"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#9B9B9B] mb-1 text-right">
                        عنوان موضوع المقالة (العربية)
                      </label>
                      <input
                        type="text"
                        value={pageTitleAr}
                        onChange={(e) => setPageTitleAr(e.target.value)}
                        className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-3 py-2 text-white text-sm text-right"
                        placeholder="مثال: التحكم بالشفرة في Redux Toolkit"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 p-3 bg-[#202020] border border-[#2F2F2F] rounded items-center">
                    <span className="text-xs text-[#9B9B9B] self-center mr-1">
                      {isAr ? 'إضافة كتلة:' : 'Add block:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => addBlock('markdown')}
                      className="flex items-center space-x-1 border border-[#2F2F2F] bg-[#252525] hover:bg-[#2F2F2F] text-xs px-2.5 py-1 rounded text-gray-300 cursor-pointer transition-colors"
                    >
                      <FileText size={13} />
                      <span>Markdown</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('code')}
                      className="flex items-center space-x-1 border border-[#2F2F2F] bg-[#252525] hover:bg-[#2F2F2F] text-xs px-2.5 py-1 rounded text-gray-300 cursor-pointer transition-colors"
                    >
                      <Code size={13} />
                      <span>{isAr ? 'كود' : 'Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('links')}
                      className="flex items-center space-x-1 border border-[#2F2F2F] bg-[#252525] hover:bg-[#2F2F2F] text-xs px-2.5 py-1 rounded text-gray-300 cursor-pointer transition-colors"
                    >
                      <LinkIcon size={13} />
                      <span>{isAr ? 'روابط' : 'Resource Links'}</span>
                    </button>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="text-center py-8 bg-[#252525] rounded border border-dashed border-[#2F2F2F]">
                      <p className="text-sm text-[#9B9B9B]">
                        {isAr
                          ? 'ابدأ بإضافة كتلة Markdown أو كود أو روابط.'
                          : 'Start by adding a Markdown, Code, or Resource Links block.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blocks.map((block, bIdx) => (
                        <div
                          key={block.id}
                          className={`p-4 bg-[#202020] border rounded relative space-y-3 group/block select-none transition-all ${
                            draggedBlockIndex === bIdx
                              ? 'opacity-30 border-dashed border-[#2F2F2F]'
                              : 'border-[#2F2F2F] hover:bg-[#202020]/85'
                          } ${
                            dragOverBlockIndex === bIdx
                              ? 'border-t-2 border-emerald-500 bg-[#2A3F33]/20'
                              : ''
                          }`}
                          draggable
                          onDragStart={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('input, textarea, select, button')) {
                              e.preventDefault();
                              return;
                            }
                            e.stopPropagation();
                            setDraggedBlockIndex(bIdx);
                            e.dataTransfer.setData('text/plain', block.id);
                          }}
                          onDragEnd={() => {
                            setDraggedBlockIndex(null);
                            setDragOverBlockIndex(null);
                          }}
                          onDragOver={(e) => {
                            if (draggedBlockIndex !== null) {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedBlockIndex !== bIdx) {
                                setDragOverBlockIndex(bIdx);
                              }
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverBlockIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverBlockIndex(null);
                            if (draggedBlockIndex !== null && draggedBlockIndex !== bIdx) {
                              handleReorderBlocks(draggedBlockIndex, bIdx);
                            }
                            setDraggedBlockIndex(null);
                          }}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-[#2F2F2F]">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E3E3E3] flex items-center gap-1.5">
                              <div className="cursor-grab active:cursor-grabbing text-[#9B9B9B] hover:text-[#E3E3E3] p-1 rounded hover:bg-[#2F2F2F]/40 shrink-0 transition-colors">
                                <GripVertical size={13} strokeWidth={2.5} />
                              </div>
                              {block.type === 'markdown' && <FileText size={12} />}
                              {block.type === 'code' && <Code size={12} />}
                              {block.type === 'links' && <LinkIcon size={12} />}
                              {blockLabel(block)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeBlock(bIdx)}
                              className="text-gray-500 hover:text-red-400 p-1 hover:bg-[#252525] rounded transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {block.type === 'markdown' && (
                            <MarkdownEditorField
                              contentEn={block.contentEn ?? ''}
                              contentAr={block.contentAr ?? ''}
                              onChangeEn={(value) => updateBlock(bIdx, { contentEn: value })}
                              onChangeAr={(value) => updateBlock(bIdx, { contentAr: value })}
                              language={language}
                            />
                          )}

                          {block.type === 'code' && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-[#252525] p-1.5 rounded border border-[#2F2F2F]">
                                <span className="text-xs text-[#9B9B9B] font-mono pl-1">Language:</span>
                                <select
                                  value={block.language || 'typescript'}
                                  onChange={(e) => updateBlock(bIdx, { language: e.target.value })}
                                  className="bg-[#191919] text-xs text-white border border-[#2F2F2F] rounded px-1.5 py-0.5 pointer-events-auto"
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
                              <textarea
                                value={block.code || ''}
                                onChange={(e) => updateBlock(bIdx, { code: e.target.value })}
                                placeholder="Enter code snippet here..."
                                className="w-full bg-[#191919] font-mono text-xs border border-[#2F2F2F] hover:bg-[#1C1C1C] rounded p-3 text-[#CBD5E1]"
                                rows={6}
                              />
                            </div>
                          )}

                          {block.type === 'links' && (
                            <div className="space-y-3">
                              <p className="text-xs text-[#9B9B9B] font-semibold">
                                {isAr ? 'إدراج روابط ومراجع:' : 'Resource references:'}
                              </p>
                              <div className="space-y-3 pl-2 border-l-2 border-[#3E7B5D]/40">
                                {block.links?.map((lnk, lIdx) => (
                                  <div key={lnk.id} className="p-3 bg-[#252525] border border-[#2F2F2F] rounded space-y-2 relative group-links">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-semibold text-gray-300">Link #{lIdx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLinkFromBlock(bIdx, lIdx)}
                                        className="text-gray-500 hover:text-red-400 p-0.5 rounded"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={lnk.labelEn}
                                        onChange={(e) => handleLinkUpdate(bIdx, lIdx, { labelEn: e.target.value })}
                                        placeholder="Label (EN)"
                                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1.5 text-white"
                                      />
                                      <input
                                        type="text"
                                        value={lnk.labelAr}
                                        onChange={(e) => handleLinkUpdate(bIdx, lIdx, { labelAr: e.target.value })}
                                        placeholder="الاسم التوضيحي للرابط (AR)"
                                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1.5 text-white text-right"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <input
                                        type="text"
                                        value={lnk.url}
                                        onChange={(e) => handleLinkUpdate(bIdx, lIdx, { url: e.target.value })}
                                        placeholder="https://..."
                                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1.5 text-white col-span-2 font-mono"
                                      />
                                      <select
                                        value={lnk.type}
                                        onChange={(e) => handleLinkUpdate(bIdx, lIdx, { type: e.target.value as ResourceLink['type'] })}
                                        className="bg-[#191919] border border-[#2F2F2F] rounded text-xs p-1 text-white"
                                      >
                                        <option value="docs">Docs</option>
                                        <option value="project">Project</option>
                                        <option value="github">GitHub</option>
                                        <option value="link">Other Link</option>
                                      </select>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddLinkToBlock(bIdx)}
                                  className="w-full py-1.5 border border-dashed border-[#2F2F2F] hover:border-[#3E7B5D] text-xs text-[#3E7B5D] rounded transition-all flex items-center justify-center gap-1.5 bg-[#252525]/50 hover:bg-[#252525] cursor-pointer font-bold"
                                >
                                  <Plus size={12} />
                                  <span>{isAr ? 'إضافة رابط' : 'Add another link'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#2F2F2F] bg-[#202020] flex items-center justify-between">
              {activeTab === 'meta' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className="px-4 py-2 bg-[#3E7B5D] hover:bg-[#468969] text-white rounded text-sm font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <span>{isAr ? 'التقدم للمحتوى ➔' : 'Proceed to content ➔'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('meta')}
                  className="px-4 py-2 border border-[#2F2F2F] text-[#9B9B9B] hover:text-white rounded text-sm cursor-pointer transition-colors"
                >
                  <span>{isAr ? '➔ العودة للمعلومات الأساسية' : '➔ Return to metadata'}</span>
                </button>
              )}

              <div className="flex space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#2F2F2F] hover:bg-[#373737] text-[#E3E3E3] rounded text-sm cursor-pointer transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3E7B5D] hover:bg-[#468969] text-white rounded text-sm font-semibold cursor-pointer transition-colors"
                >
                  {isAr ? 'حفظ الصفحة' : 'Save Page'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
