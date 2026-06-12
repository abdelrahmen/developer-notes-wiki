/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Category, TopicPage, Language, SyncStatus } from '../types';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Settings, 
  BookOpen, 
  Trash2, 
  Edit, 
  Globe, 
  CheckCircle, 
  SlidersHorizontal,
  BookmarkCheck,
  RotateCcw,
  Server,
  Activity,
  Cpu,
  Database,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  pages: TopicPage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  language: Language;
  onToggleLanguage: () => void;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  completedPages: string[];
  onResetProgress: () => void;
  onReorderCategories: (draggedId: string, targetId: string) => void;
  onMoveCategoryToRoot: (categoryId: string) => void;
  onReorderPages: (draggedId: string, targetPageId: string) => void;
  onMovePageToCategory: (pageId: string, targetCategoryId: string) => void;
  onOpenSyncSettings: () => void;
  syncStatus: SyncStatus;
}

export default function Sidebar({
  categories,
  pages,
  activePageId,
  onSelectPage,
  language,
  onToggleLanguage,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddPage,
  onDeletePage,
  completedPages,
  onResetProgress,
  onReorderCategories,
  onMoveCategoryToRoot,
  onReorderPages,
  onMovePageToCategory,
  onOpenSyncSettings,
  syncStatus,
}: SidebarProps) {
  const isAr = language === 'ar';

  const syncDotClass =
    syncStatus === 'synced'
      ? 'bg-emerald-400'
      : syncStatus === 'syncing'
        ? 'bg-amber-400 animate-pulse'
        : syncStatus === 'error'
          ? 'bg-rose-400'
          : 'bg-[#6B6B6B]';
  
  // Collapse state for each category
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop local UI states
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'page'; id: string } | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [dragOverPage, setDragOverPage] = useState<string | null>(null);
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const topLevelCategories = categories.filter(cat => !cat.parentId);
  const hasNoCategories = categories.length === 0;

  const addCategoryButtonClass =
    'flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-md bg-[#252525] border border-[#2F2F2F] text-[#9B9B9B] cursor-pointer transition-all hover:bg-[#2F2F2F] hover:text-[#E3E3E3] hover:border-[#373737] hover:shadow-[0_0_10px_rgba(255,255,255,0.06)] active:scale-95';

  // Find all pages inside a category and its nested children sub-categories recursively
  const getCategoryPagesRecursive = (catId: string): TopicPage[] => {
    let results = pages.filter(p => p.categoryId === catId);
    const subCats = categories.filter(c => c.parentId === catId);
    subCats.forEach(sub => {
      results = [...results, ...getCategoryPagesRecursive(sub.id)];
    });
    return results;
  };

  // Determine recursively if a category has any pages matching the current search patterns
  const hasVisibleContent = (catId: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    // Direct matches in pages
    const directPagesMatch = filteredPages.some(p => p.categoryId === catId);
    if (directPagesMatch) return true;
    
    // Sub-category recursive matches
    const subCats = categories.filter(c => c.parentId === catId);
    return subCats.some(sub => hasVisibleContent(sub.id));
  };

  const filteredPages = pages.filter(page => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    
    // Search titles
    const titleMatch = page.titleEn.toLowerCase().includes(q) || page.titleAr.includes(q);
    
    // Search personal notes
    const noteMatch = page.personalClarificationEn.toLowerCase().includes(q) || page.personalClarificationAr.includes(q);
    
    // Search blocks (code snippets, titles, definitions)
    const blockMatch = page.blocks.some(block => {
      const bTextEn = block.textEn?.toLowerCase() || '';
      const bTextAr = block.textAr || '';
      const bTitleEn = block.titleEn?.toLowerCase() || '';
      const bTitleAr = block.titleAr || '';
      const bCode = block.code?.toLowerCase() || '';
      return bTextEn.includes(q) || bTextAr.includes(q) || bTitleEn.includes(q) || bTitleAr.includes(q) || bCode.includes(q);
    });

    return titleMatch || noteMatch || blockMatch;
  });

  const renderCategoryRecursive = (cat: Category, level: number = 0): React.ReactNode => {
    const isCollapsed = collapsedCategories[cat.id];
    
    // Check if category or descendants match the search queries
    if (!hasVisibleContent(cat.id)) return null;

    // Direct pages of this category
    const catPages = filteredPages.filter(p => p.categoryId === cat.id);
    
    // Sub-categories of this category
    const subCategories = categories.filter(c => c.parentId === cat.id);

    // Calculate progress recursively across this category and all its descendants
    const recursiveTopicPages = getCategoryPagesRecursive(cat.id);
    const completedRecursive = recursiveTopicPages.filter(p => completedPages.includes(p.id)).length;
    const recursiveProgressText = recursiveTopicPages.length > 0 ? `${completedRecursive}/${recursiveTopicPages.length}` : null;

    const isDragged = draggedItem && draggedItem.type === 'category' && draggedItem.id === cat.id;
    const isDragTarget = dragOverCategory === cat.id && draggedItem && draggedItem.id !== cat.id;

    return (
      <div key={cat.id} className="space-y-0.5" id={`category-node-${cat.id}`}>
        {/* Category Header Bar */}
        <div 
          className={`group/cat flex items-center justify-between px-2 py-1.5 rounded text-sm transition-all cursor-grab active:cursor-grabbing select-none ${
            isDragged ? 'opacity-30 border border-dashed border-[#2F2F2F]' : ''
          } ${
            isDragTarget
              ? draggedItem && draggedItem.type === 'category'
                ? 'border-t-2 border-emerald-500 bg-[#2A3F33]/30'
                : 'border border-dashed border-emerald-500/80 bg-[#2A3F33]/60'
              : 'hover:bg-[#2F2F2F]/60'
          }`}
          style={{
            paddingInlineStart: `${level * 12 + 8}px`
          }}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedItem({ type: 'category', id: cat.id });
            e.dataTransfer.setData('text/plain', cat.id);
          }}
          onDragEnd={() => {
            setDraggedItem(null);
            setDragOverCategory(null);
          }}
          onDragOver={(e) => {
            if (draggedItem) {
              e.preventDefault();
              e.stopPropagation();
              if (draggedItem.id !== cat.id) {
                setDragOverCategory(cat.id);
              }
            }
          }}
          onDragLeave={() => {
            setDragOverCategory(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverCategory(null);
            if (draggedItem) {
              if (draggedItem.type === 'category' && draggedItem.id !== cat.id) {
                onReorderCategories(draggedItem.id, cat.id);
              } else if (draggedItem.type === 'page') {
                onMovePageToCategory(draggedItem.id, cat.id);
              }
            }
            setDraggedItem(null);
          }}
        >
          <button
            onClick={() => toggleCategory(cat.id)}
            className="flex items-center space-x-1.5 space-x-reverse flex-1 text-left select-none cursor-pointer truncate"
          >
            <span className="text-[#9B9B9B] group-hover/cat:text-[#E3E3E3] transition-colors shrink-0">
              {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </span>
            <span className="text-base leading-none shrink-0">{cat.icon}</span>
            <span className="font-semibold text-gray-200 capitalize truncate">
              {isAr ? cat.titleAr : cat.titleEn}
            </span>
            {recursiveProgressText && (
              <span 
                className={`text-[9px] px-1 py-0.5 rounded font-mono shrink-0 ${
                  completedRecursive === recursiveTopicPages.length 
                    ? 'bg-[#3E7B5D]/20 text-[#3E7B5D]' 
                    : 'bg-[#2F2F2F] text-[#9B9B9B]'
                }`}
              >
                {recursiveProgressText}
              </span>
            )}
          </button>

          {/* Edit/Delete icons */}
          <div className="opacity-0 group-hover/cat:opacity-100 flex items-center space-x-1 space-x-reverse ml-1 shrink-0">
            <button
              onClick={() => onEditCategory(cat)}
              className="p-0.5 hover:bg-[#373737] hover:text-[#E3E3E3] text-[#9B9B9B] rounded cursor-pointer"
              title={isAr ? 'تعديل بيانات القسم' : 'Edit category'}
            >
              <Edit size={11} />
            </button>
            <button
              onClick={() => onDeleteCategory(cat.id)}
              className="p-0.5 hover:bg-[#373737] hover:text-rose-400 text-[#9B9B9B] rounded cursor-pointer"
              title={isAr ? 'حذف هذا القسم بالكامل' : 'Delete category'}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Content list (nested sub-folders and topic pages) */}
        {!isCollapsed && (
          <div 
            className={`${isAr ? 'mr-3 pr-1 border-r' : 'ml-4 pl-1 border-l'} border-[#2F2F2F]/60 pb-1 space-y-0.5`}
            style={{
              marginInlineStart: `${level * 12 + 10}px`
            }}
          >
            {/* 1. Recursively Render Child Sub-Categories */}
            {subCategories.map(subCat => renderCategoryRecursive(subCat, level + 1))}

            {/* 2. Render Page Links */}
            {catPages.length === 0 && subCategories.length === 0 ? (
              <p className="text-[11px] text-[#9B9B9B]/60 px-3 py-1 italic">
                {isAr ? 'الأرشيف فارغ' : 'Category empty'}
              </p>
            ) : (
              catPages.map((page) => {
                const isActive = activePageId === page.id;
                const isDone = completedPages.includes(page.id);
                const isPageDragged = draggedItem && draggedItem.type === 'page' && draggedItem.id === page.id;
                const isPageDragTarget = dragOverPage === page.id && draggedItem && draggedItem.type === 'page' && draggedItem.id !== page.id;

                return (
                  <div
                    key={page.id}
                    className={`group/page flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-all select-none ${
                      isActive
                        ? 'bg-[#2F2F2F] text-white font-semibold'
                        : 'text-[#9B9B9B] hover:text-[#E3E3E3]'
                    } ${
                      isPageDragged ? 'opacity-30 border border-dashed border-[#2F2F2F]' : ''
                    } ${
                      isPageDragTarget ? 'border-t-2 border-emerald-500 bg-emerald-500/10' : 'hover:bg-[#2F2F2F]/45'
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedItem({ type: 'page', id: page.id });
                      e.dataTransfer.setData('text/plain', page.id);
                    }}
                    onDragEnd={() => {
                      setDraggedItem(null);
                      setDragOverPage(null);
                    }}
                    onDragOver={(e) => {
                      if (draggedItem && draggedItem.type === 'page') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedItem.id !== page.id) {
                          setDragOverPage(page.id);
                        }
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverPage(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverPage(null);
                      if (draggedItem && draggedItem.type === 'page' && draggedItem.id !== page.id) {
                        onReorderPages(draggedItem.id, page.id);
                      }
                      setDraggedItem(null);
                    }}
                  >
                    <div
                      onClick={() => onSelectPage(page.id)}
                      className="flex items-center space-x-2 space-x-reverse flex-1 truncate"
                    >
                      <span className="text-sm shrink-0">{page.icon}</span>
                      <span className="truncate">
                        {isAr ? page.titleAr : page.titleEn}
                      </span>
                      {isDone && (
                        <CheckCircle size={10} className="text-[#3E7B5D] shrink-0" />
                      )}
                    </div>

                    <div className="opacity-0 group-hover/page:opacity-100 flex items-center ml-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        className="p-0.5 hover:bg-[#373737] hover:text-rose-400 text-[#9B9B9B] rounded cursor-pointer"
                        title={isAr ? 'حذف الصفحة' : 'Delete page'}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate overall learning statistics
  const totalTopicCount = pages.length;
  const completedTopicCount = completedPages.filter(id => pages.some(p => p.id === id)).length;
  const overallPercentage = totalTopicCount > 0 ? Math.round((completedTopicCount / totalTopicCount) * 100) : 0;

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-80 bg-[#202020] border-r border-[#2F2F2F] h-full flex flex-col text-[#E3E3E3] overflow-hidden shrink-0 select-none"
    >
      {/* Sidebar Header: Notion Workspace details */}
      <div className="p-4 border-b border-[#2F2F2F] flex flex-col space-y-3 bg-[#202020]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 rounded-lg bg-[#2F2F2F] flex items-center justify-center text-lg select-none">
              📚
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#E3E3E3] tracking-wide">
                {isAr ? 'مدونة المبرمج الذاتية' : 'Developer Notes Wiki'}
              </h1>
              <p className="text-[10px] text-[#9B9B9B] font-mono uppercase tracking-wider">
                Local Offline Database
              </p>
            </div>
          </div>
          
          {/* Language Toggle bar */}
          <button
            onClick={onToggleLanguage}
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            className="px-2 py-1 bg-[#2F2F2F] hover:bg-[#373737] hover:text-white rounded text-xs font-semibold text-[#E3E3E3] flex items-center gap-1 transition-all cursor-pointer"
          >
            <Globe size={13} className="text-[#9B9B9B]" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
        </div>

        {/* Global Learning Progress Widget */}
        <div className="p-2.5 bg-[#252525] rounded-lg border border-[#2F2F2F]">
          <div className="flex justify-between items-center text-xs mb-1.5 text-[#9B9B9B]">
            <span className="font-semibold flex items-center gap-1">
              <BookmarkCheck size={13} className="text-[#3E7B5D]" />
              {isAr ? 'معدل الإنجاز العام' : 'Overall Completion'}
            </span>
            <span className="font-mono text-[#3E7B5D] font-bold">{overallPercentage}%</span>
          </div>
          <div className="w-full bg-[#191919] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#3E7B5D] h-full transition-all duration-500" 
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10px] text-[#9B9B9B]">
            <span>{completedTopicCount} / {totalTopicCount} {isAr ? 'مواضيع منتهية' : 'Topics Done'}</span>
            {completedTopicCount > 0 && (
              <button 
                onClick={onResetProgress}
                className="hover:text-red-400 flex items-center gap-0.5 cursor-pointer"
                title={isAr ? 'إعادة ضبط التقدم' : 'Reset progress'}
              >
                <RotateCcw size={10} />
                <span>{isAr ? 'إعادة الإعداد' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notion Style Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في المصطلحات والمقالات...' : 'Quick find ...'}
            className="w-full bg-[#252525] border border-[#2F2F2F] rounded px-8 py-1.5 text-xs text-white placeholder-[#9B9B9B] hover:bg-[#282828] transition-colors focus:border-[#373737]"
          />
        </div>
      </div>

      {/* Accordion Categories List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
        <div 
          className={`flex justify-between items-center px-2 py-1.5 mb-1.5 rounded transition-all ${
            isDragOverRoot ? 'border border-dashed border-emerald-500 bg-emerald-500/10' : ''
          }`}
          onDragOver={(e) => {
            if (draggedItem && draggedItem.type === 'category') {
              e.preventDefault();
              setIsDragOverRoot(true);
            }
          }}
          onDragLeave={() => setIsDragOverRoot(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOverRoot(false);
            if (draggedItem && draggedItem.type === 'category') {
              onMoveCategoryToRoot(draggedItem.id);
            }
            setDraggedItem(null);
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B]">
            {isAr ? 'المقالات والأقسام' : 'Wiki Navigation'}
          </span>
          <button
            type="button"
            onClick={onAddCategory}
            className={addCategoryButtonClass}
            title={isAr ? 'إضافة قسم جديد' : 'Create Category'}
            aria-label={isAr ? 'إضافة قسم جديد' : 'Create Category'}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {hasNoCategories ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="w-12 h-12 rounded-lg bg-[#252525] border border-[#2F2F2F] flex items-center justify-center mb-3">
              <FolderOpen size={22} className="text-[#9B9B9B]" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-gray-200 mb-1">
              {isAr ? 'لا توجد أقسام بعد' : 'No categories yet'}
            </p>
            <p className="text-xs text-[#9B9B9B] mb-5 max-w-[220px] leading-relaxed">
              {isAr
                ? 'نظّم توثيقك بإنشاء قسمك الأول وتجميع المواضيع ذات الصلة.'
                : 'Organize your documentation by creating your first category.'}
            </p>
            <button
              type="button"
              onClick={onAddCategory}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#3E7B5D] hover:bg-[#468969] text-white text-xs font-semibold cursor-pointer transition-all hover:shadow-[0_0_14px_rgba(62,123,93,0.45)] active:scale-[0.98]"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{isAr ? 'إنشاء القسم الأول' : 'Create First Category'}</span>
            </button>
          </div>
        ) : (
          topLevelCategories.map((cat) => renderCategoryRecursive(cat))
        )}
      </div>

      {/* Sidebar Footer details */}
      <div className="p-4 border-t border-[#2F2F2F] bg-[#1C1C1C] space-y-2.5">
        <button
          onClick={onAddPage}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-[#2F2F2F] hover:border-[#373737] bg-[#252525] hover:bg-[#2F2F2F] text-[#E3E3E3] rounded text-xs font-semibold transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>{isAr ? 'إدراج موضوع جديد' : 'Add New Wiki Page'}</span>
        </button>

        <button
          onClick={onOpenSyncSettings}
          className="w-full flex items-center justify-between gap-2 py-1.5 px-2.5 border border-[#2F2F2F] hover:border-[#373737] bg-[#252525] hover:bg-[#2F2F2F] text-[#E3E3E3] rounded text-xs font-semibold transition-all cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Settings size={13} className="text-[#9B9B9B]" />
            <span>{isAr ? 'إعدادات المزامنة' : 'Sync Settings'}</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${syncDotClass}`} title={syncStatus} />
        </button>

        <div className="flex justify-between items-center text-[10px] text-[#9B9B9B] font-mono">
          <span>{isAr ? 'الإصدار المحلي:' : 'Local SDK build:'} v1.2</span>
          <span>Notion Style v4.0</span>
        </div>
      </div>
    </div>
  );
}
