/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Category, TopicPage, Language, SyncConfig, SyncStatus, WikiState } from './types';
import Sidebar from './components/Sidebar';
import PageView from './components/PageView';
import CategoryEditorModal from './components/CategoryEditorModal';
import SyncSettingsModal from './components/SyncSettingsModal';
import { Menu, X, AlertCircle } from 'lucide-react';
import { collectCategoryDescendantIds } from './lib/categoryUtils';
import { loadLocalWikiState, loadSyncConfig, saveSyncConfig } from './lib/wikiStorage';
import { initSyncManager, notifyLocalChange, pullAndMerge } from './lib/sync/syncManager';

export default function App() {
  // --- CORE STATE ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages, setPages] = useState<TopicPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // --- SYNC STATE ---
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(loadSyncConfig);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | undefined>();
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const isInitialLoad = useRef(true);

  // --- MOBILE RESPONSIVENESS STATE ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- CATEGORY EDITOR MODAL STATE ---
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [categoryEditorType, setCategoryEditorType] = useState<'add-category' | 'editing-category'>('add-category');
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<Category | undefined>(undefined);
  const [autoEditPageId, setAutoEditPageId] = useState<string | null>(null);

  const applyWikiState = useCallback((state: WikiState) => {
    setCategories(state.categories);
    setPages(state.pages);
    setCompletedPages(state.completedPages);
    setNotes(state.notes);
    setLanguage(state.language);
    setActivePageId((currentId) => {
      if (currentId && state.pages.some((page) => page.id === currentId)) {
        return currentId;
      }
      return state.pages[0]?.id ?? null;
    });
  }, []);

  const persistState = useCallback((partial: Partial<WikiState>) => {
    const nextState: WikiState = {
      categories: partial.categories ?? categories,
      pages: partial.pages ?? pages,
      completedPages: partial.completedPages ?? completedPages,
      notes: partial.notes ?? notes,
      language: partial.language ?? language,
    };

    applyWikiState(nextState);
    notifyLocalChange(nextState);
  }, [categories, pages, completedPages, notes, language, applyWikiState]);

  // --- LOAD CORE STORAGE STATE ONCE ---
  useEffect(() => {
    const localState = loadLocalWikiState();
    applyWikiState(localState);
    setSyncConfig(loadSyncConfig());

    initSyncManager({
      onStatusChange: (status, errorMessage, syncedAt) => {
        setSyncStatus(status);
        setSyncError(errorMessage);
        if (syncedAt) setLastSyncedAt(syncedAt);
      },
      onStateApplied: (state) => {
        applyWikiState(state);
      },
    });

    void pullAndMerge().finally(() => {
      isInitialLoad.current = false;
    });
  }, [applyWikiState]);

  // --- PULL ON WINDOW FOCUS ---
  useEffect(() => {
    const handleFocus = () => {
      if (isInitialLoad.current) return;
      void pullAndMerge();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // --- CHANGE ORIENTATION ON LANGUAGE CHANGE ---
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isInitialLoad.current) return;
    persistState({ language });
  }, [language, persistState]);

  const saveCategoriesToStorage = (updatedList: Category[]) => {
    persistState({ categories: updatedList });
  };

  const savePagesToStorage = (updatedList: TopicPage[]) => {
    persistState({ pages: updatedList });
  };

  // --- BILINGUAL EVENT HANDLERS ---
  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleSaveSyncConfig = (config: SyncConfig) => {
    setSyncConfig(config);
    saveSyncConfig(config);
  };

  // --- CATEGORY MANIPULATION ---
  const handleTriggerAddCategory = () => {
    setCategoryEditorType('add-category');
    setSelectedCategoryToEdit(undefined);
    setIsCategoryEditorOpen(true);
  };

  // --- CUSTOM DIALOG CONFIRMATION STATE ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    showCancel?: boolean;
  } | null>(null);

  const handleTriggerEditCategory = (cat: Category) => {
    setCategoryEditorType('editing-category');
    setSelectedCategoryToEdit(cat);
    setIsCategoryEditorOpen(true);
  };

  const handleDeleteCategory = (catId: string) => {
    const isAr = language === 'ar';
    const title = isAr ? 'تأكيد حذف القسم بالكامل' : 'Confirm Entire Category Deletion';
    const confirmMessage = isAr
      ? 'هل أنت متأكد من رغبتك في حذف هذا القسم بالكامل؟ سيؤدي هذا الإجراء لحذف جميع الصفحات المرتبطة به بشكل نهائي!'
      : 'Are you absolutely sure you want to delete this category? Deleting it will permanently scrub all associated topic pages inside!';
    
    setConfirmDialog({
      isOpen: true,
      title,
      message: confirmMessage,
      type: 'danger',
      showCancel: true,
      onConfirm: () => {
        const idsToRemove = collectCategoryDescendantIds(catId, categories);
        const nextCategories = categories.filter(c => !idsToRemove.has(c.id));
        const nextPages = pages.filter(p => !idsToRemove.has(p.categoryId));

        persistState({ categories: nextCategories, pages: nextPages });

        const activePage = pages.find(p => p.id === activePageId);
        if (activePage && idsToRemove.has(activePage.categoryId)) {
          setActivePageId(nextPages[0]?.id || null);
        }
        setConfirmDialog(null);
      }
    });
  };

  const handleSaveCategory = (category: Category) => {
    const existingIndex = categories.findIndex(c => c.id === category.id);
    let nextCategories = [...categories];

    if (existingIndex > -1) {
      nextCategories[existingIndex] = category;
    } else {
      nextCategories.push(category);
    }
    saveCategoriesToStorage(nextCategories);
  };

  // --- PAGE MANIPULATION ---
  const handleTriggerAddPage = () => {
    const isAr = language === 'ar';
    if (categories.length === 0) {
      setConfirmDialog({
        isOpen: true,
        title: isAr ? 'لا يوجد أقسام مضافة' : 'No Categories Found',
        message: isAr ? 'الرجاء إضافة قسم أولاً لتتمكن من إنشاء صفحة مواضيع فيه.' : 'Please add a category first before creating wiki pages.',
        type: 'warning',
        showCancel: false,
        onConfirm: () => setConfirmDialog(null)
      });
      return;
    }
    const newPage: TopicPage = {
      id: 'page-' + Date.now(),
      categoryId: categories[0].id,
      titleEn: 'Untitled',
      titleAr: 'بدون عنوان',
      icon: '📄',
      lastUpdated: new Date().toISOString().split('T')[0],
      blocks: [
        {
          id: 'md-' + Date.now(),
          type: 'markdown',
          contentEn: '',
          contentAr: '',
        },
      ],
    };
    savePagesToStorage([...pages, newPage]);
    setActivePageId(newPage.id);
    setAutoEditPageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    const isAr = language === 'ar';
    const title = isAr ? 'تأكيد حذف الصفحة' : 'Confirm Page Deletion';
    const confirmMessage = isAr
      ? 'هل أنت متأكد من رغبتك في حذف هذه الصفحة البرمجية نهائياً؟'
      : 'Are you sure you want to permanently delete this developer wiki page?';

    setConfirmDialog({
      isOpen: true,
      title,
      message: confirmMessage,
      type: 'danger',
      showCancel: true,
      onConfirm: () => {
        const nextPages = pages.filter(p => p.id !== pageId);
        const nextCompleted = completedPages.filter(id => id !== pageId);

        persistState({ pages: nextPages, completedPages: nextCompleted });

        if (activePageId === pageId) {
          setActivePageId(nextPages[0]?.id || null);
        }

        setConfirmDialog(null);
      }
    });
  };

  const handleSavePage = (page: TopicPage) => {
    const existingIndex = pages.findIndex(p => p.id === page.id);
    let nextPages = [...pages];

    if (existingIndex > -1) {
      nextPages[existingIndex] = page;
    } else {
      nextPages.push(page);
    }
    savePagesToStorage(nextPages);
    setActivePageId(page.id);
  };

  // --- USER PROGRESS ACTIONS ---
  const handleToggleCompletePage = (pageId: string) => {
    let nextCompleted = [...completedPages];
    if (nextCompleted.includes(pageId)) {
      nextCompleted = nextCompleted.filter(id => id !== pageId);
    } else {
      nextCompleted.push(pageId);
    }
    persistState({ completedPages: nextCompleted });
  };

  const handleResetAllProgress = () => {
    const isAr = language === 'ar';
    const confirmMessage = isAr
      ? 'هل ترغب حقاً في تصفير جميع مؤشرات التقدم وإعادة تعيين الحالات كغير منتهية؟'
      : 'Would you like to clear all study progress metrics and reset everything to in-progress?';

    if (window.confirm(confirmMessage)) {
      persistState({ completedPages: [] });
    }
  };

  // --- MEMOREX SCRATCHPAD STORAGE ---
  const handleSaveNotes = (pageId: string, notesContent: string) => {
    const nextNotes = {
      ...notes,
      [pageId]: notesContent
    };
    persistState({ notes: nextNotes });
  };

  // --- DRAG AND DROP REORDERING MECHANISM ---
  const handleReorderCategories = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const draggedIdx = categories.findIndex(c => c.id === draggedId);
    const targetIdx = categories.findIndex(c => c.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const targetCategory = categories[targetIdx];
    const updatedCategories = [...categories];
    const [draggedCategory] = updatedCategories.splice(draggedIdx, 1);
    
    draggedCategory.parentId = targetCategory.parentId;

    const newTargetIdx = updatedCategories.findIndex(c => c.id === targetId);
    updatedCategories.splice(newTargetIdx, 0, draggedCategory);

    saveCategoriesToStorage(updatedCategories);
  };

  const handleMoveCategoryToRoot = (categoryId: string) => {
    const catIdx = categories.findIndex(c => c.id === categoryId);
    if (catIdx === -1) return;

    const updatedCategories = [...categories];
    updatedCategories[catIdx] = {
      ...updatedCategories[catIdx],
      parentId: undefined
    };

    saveCategoriesToStorage(updatedCategories);
  };

  const handleReorderPages = (draggedId: string, targetPageId: string) => {
    if (draggedId === targetPageId) return;
    const draggedIdx = pages.findIndex(p => p.id === draggedId);
    const targetIdx = pages.findIndex(p => p.id === targetPageId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const targetPage = pages[targetIdx];
    const updatedPages = [...pages];
    const [removedPage] = updatedPages.splice(draggedIdx, 1);

    removedPage.categoryId = targetPage.categoryId;

    const newTargetIdx = updatedPages.findIndex(p => p.id === targetPageId);
    updatedPages.splice(newTargetIdx, 0, removedPage);

    savePagesToStorage(updatedPages);
  };

  const handleMovePageToCategory = (pageId: string, targetCategoryId: string) => {
    const pageIdx = pages.findIndex(p => p.id === pageId);
    if (pageIdx === -1) return;

    const updatedPages = [...pages];
    updatedPages[pageIdx] = {
      ...updatedPages[pageIdx],
      categoryId: targetCategoryId
    };

    savePagesToStorage(updatedPages);
  };

  const activePage = pages.find(p => p.id === activePageId) || null;
  const activeCategory = activePage ? categories.find(c => c.id === activePage.categoryId) || null : null;
  const activeNotes = activePageId ? (notes[activePageId] || '') : '';

  const isAr = language === 'ar';

  const sidebarProps = {
    categories,
    pages,
    activePageId,
    language,
    onToggleLanguage: handleToggleLanguage,
    onAddCategory: handleTriggerAddCategory,
    onEditCategory: handleTriggerEditCategory,
    onDeleteCategory: handleDeleteCategory,
    onAddPage: handleTriggerAddPage,
    onDeletePage: handleDeletePage,
    completedPages,
    onResetProgress: handleResetAllProgress,
    onReorderCategories: handleReorderCategories,
    onMoveCategoryToRoot: handleMoveCategoryToRoot,
    onReorderPages: handleReorderPages,
    onMovePageToCategory: handleMovePageToCategory,
    onOpenSyncSettings: () => setIsSyncSettingsOpen(true),
    syncStatus,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#191919] text-[#E3E3E3]">
      
      <div className="hidden md:flex h-full select-none">
        <Sidebar
          {...sidebarProps}
          onSelectPage={(id) => setActivePageId(id)}
        />
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          
          <div className="relative flex flex-col max-w-xs w-full bg-[#202020] h-full shadow-2xl relative z-50">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 bg-[#2F2F2F] hover:bg-[#373737] text-gray-400 hover:text-white rounded-lg transition-colors border border-transparent"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden h-full">
              <Sidebar
                {...sidebarProps}
                onSelectPage={(id) => {
                  setActivePageId(id);
                  setIsMobileSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#202020] border-b border-[#2F2F2F] select-none text-gray-300">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 hover:bg-[#2F2F2F] rounded-lg text-white transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xl leading-none">🧠</span>
              <span className="text-xs font-bold font-mono tracking-wider text-gray-400">DEVWIKI</span>
            </div>
          </div>

          <div className="text-xs font-bold font-mono text-gray-400 truncate max-w-[150px]">
            {activePage ? (isAr ? activePage.titleAr : activePage.titleEn) : (isAr ? 'مدونة التوثيق' : 'Notes Wiki')}
          </div>
          
          <button
            onClick={handleToggleLanguage}
            className="px-2 py-1 bg-[#2F2F2F] border border-transparent hover:bg-[#373737] text-[10px] text-white font-bold rounded"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
        </div>

        <PageView
          page={activePage}
          category={activeCategory}
          categories={categories}
          language={language}
          onSavePage={handleSavePage}
          autoEditOnMount={activePageId !== null && activePageId === autoEditPageId}
          onAutoEditConsumed={() => setAutoEditPageId(null)}
          isCompleted={activePage ? completedPages.includes(activePage.id) : false}
          onToggleComplete={handleToggleCompletePage}
          notes={activeNotes}
          onSaveNotes={handleSaveNotes}
        />
      </div>

      <CategoryEditorModal
        isOpen={isCategoryEditorOpen}
        onClose={() => setIsCategoryEditorOpen(false)}
        type={categoryEditorType}
        categories={categories}
        initialCategoryData={selectedCategoryToEdit}
        onSaveCategory={handleSaveCategory}
        language={language}
      />

      <SyncSettingsModal
        isOpen={isSyncSettingsOpen}
        onClose={() => setIsSyncSettingsOpen(false)}
        language={language}
        syncStatus={syncStatus}
        syncError={syncError}
        lastSyncedAt={lastSyncedAt}
        initialConfig={syncConfig}
        onSaveConfig={handleSaveSyncConfig}
      />

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-all"
            onClick={() => setConfirmDialog(null)}
          />
          
          <div className="relative bg-[#202020] border border-[#2F2F2F] rounded-lg max-w-sm w-full p-5 shadow-2xl z-50">
            <div className="flex items-start space-x-3 space-x-reverse">
              <div className={`p-2 rounded-lg shrink-0 ${
                confirmDialog.type === 'danger' 
                  ? 'bg-rose-500/10 text-rose-500 animate-pulse' 
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                <AlertCircle size={20} />
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-[#9B9B9B] leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse mt-6">
              {confirmDialog.showCancel !== false && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3 py-1.5 bg-[#252525] hover:bg-[#2F2F2F] border border-[#2F2F2F] text-[#9B9B9B] hover:text-[#E3E3E3] rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-3 py-1.5 text-white rounded text-xs font-semibold cursor-pointer transition-all shadow ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10'
                    : 'bg-[#3E7B5D] hover:bg-[#468969] shadow-emerald-700/10'
                }`}
              >
                {isAr ? 'موافق' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
