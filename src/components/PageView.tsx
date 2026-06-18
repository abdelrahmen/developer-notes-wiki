/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopicPage, Category, Language } from '../types';
import InlinePageEditor from './InlinePageEditor';
import PageMetadataPanel from './PageMetadataPanel';
import PageBlocksRenderer from './PageBlocksRenderer';
import { createMarkdownBlock } from '../lib/pageBlocks';
import { EditDraftSnapshot, useEditUndo } from '../lib/useEditUndo';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Copy, 
  Check, 
  FileText, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  ChevronDown,
  Eye,
  Download,
  Search,
  Type,
  Minus,
  Plus,
  Settings,
  PenLine
} from 'lucide-react';

const FONT_SCALE_STORAGE_KEY = 'devnotes_font_scale_v1';
const FONT_SCALE_LEVELS = [0.85, 1, 1.15, 1.3, 1.45] as const;
const DEFAULT_FONT_SCALE_INDEX = 1;

function loadFontScaleIndex(): number {
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (raw === null) return DEFAULT_FONT_SCALE_INDEX;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < FONT_SCALE_LEVELS.length) {
      return parsed;
    }
  } catch {
    // ignore invalid storage
  }
  return DEFAULT_FONT_SCALE_INDEX;
}

const EMPTY_EDIT_DRAFT: EditDraftSnapshot = {
  blocks: [],
  titleEn: '',
  titleAr: '',
  icon: '📄',
  categoryId: '',
};

interface PageViewProps {
  page: TopicPage | null;
  category: Category | null;
  categories: Category[];
  language: Language;
  onSavePage: (page: TopicPage) => void;
  autoEditOnMount?: boolean;
  onAutoEditConsumed?: () => void;
  isCompleted: boolean;
  onToggleComplete: (pageId: string) => void;
  notes: string;
  onSaveNotes: (pageId: string, notesContent: string) => void;
}

export default function PageView({
  page,
  category,
  categories,
  language,
  onSavePage,
  autoEditOnMount = false,
  onAutoEditConsumed,
  isCompleted,
  onToggleComplete,
  notes,
  onSaveNotes
}: PageViewProps) {
  const isAr = language === 'ar';
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditPreview, setIsEditPreview] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const { snapshot: editDraft, update: updateEditDraft, undo: undoEditDraft, reset: resetEditDraft, flushPending: flushEditHistory } =
    useEditUndo(EMPTY_EDIT_DRAFT);

  const draftBlocks = editDraft.blocks;
  const draftTitleEn = editDraft.titleEn;
  const draftTitleAr = editDraft.titleAr;
  const draftIcon = editDraft.icon;
  const draftCategoryId = editDraft.categoryId;

  const [localNotes, setLocalNotes] = useState(notes);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for click-based nested dropdowns
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'view' | 'export' | 'docs' | null>(null);
  const [viewStyle, setViewStyle] = useState<'default' | 'compact' | 'zen'>('default');
  const [fontScaleIndex, setFontScaleIndex] = useState(loadFontScaleIndex);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fontScale = FONT_SCALE_LEVELS[fontScaleIndex];
  const fontScalePercent = Math.round(fontScale * 100);
  const canDecreaseFont = fontScaleIndex > 0;
  const canIncreaseFont = fontScaleIndex < FONT_SCALE_LEVELS.length - 1;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMainMenuOpen(false);
        setActiveSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(fontScaleIndex));
  }, [fontScaleIndex]);

  const startEditing = useCallback(() => {
    if (!page) return;
    resetEditDraft({
      blocks: page.blocks.length > 0 ? structuredClone(page.blocks) : [createMarkdownBlock()],
      titleEn: page.titleEn,
      titleAr: page.titleAr,
      icon: page.icon,
      categoryId: page.categoryId,
    });
    setIsEditPreview(false);
    setIsEditing(true);
  }, [page, resetEditDraft]);

  const saveEditing = useCallback(() => {
    if (!page) return;
    flushEditHistory();
    onSavePage({
      ...page,
      titleEn: editDraft.titleEn.trim() || page.titleEn,
      titleAr: editDraft.titleAr.trim() || page.titleAr,
      icon: editDraft.icon.trim() || '📄',
      categoryId: editDraft.categoryId || page.categoryId,
      lastUpdated: new Date().toISOString().split('T')[0],
      blocks: editDraft.blocks,
    });
    setIsEditing(false);
    setIsEditPreview(false);
    setToastMessage(isAr ? 'تم حفظ الصفحة!' : 'Page saved!');
    setTimeout(() => setToastMessage(null), 2500);
  }, [page, editDraft, flushEditHistory, onSavePage, isAr]);

  useEffect(() => {
    setLocalNotes(notes);
    setIsSaved(false);
    setIsMainMenuOpen(false);
    setActiveSubMenu(null);
    setIsEditing(false);
    setIsEditPreview(false);
    setIsMetadataOpen(false);
  }, [notes, page?.id]);

  useEffect(() => {
    if (autoEditOnMount && page) {
      startEditing();
      onAutoEditConsumed?.();
    }
  }, [autoEditOnMount, page, startEditing, onAutoEditConsumed]);

  useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveEditing();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoEditDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, saveEditing, undoEditDraft]);

  // Copy raw built markdown representation of page blocks
  const copyMarkdownAsText = () => {
    if (!page) return;
    let md = `# ${page.titleEn}\n\n`;
    if (page.blocks) {
      page.blocks.forEach(block => {
        if (block.type === 'markdown') {
          md += `${block.contentEn || ''}\n\n`;
        } else if (block.type === 'code') {
          md += `\`\`\`${block.language || 'typescript'}\n${block.code || ''}\n\`\`\`\n\n`;
        } else if (block.type === 'links' && block.links) {
          md += `### Resources\n`;
          block.links.forEach(link => {
            md += `- [${link.labelEn || ''}](${link.url || ''})\n`;
          });
          md += `\n`;
        }
      });
    }

    navigator.clipboard.writeText(md).then(() => {
      setToastMessage(isAr ? 'تم نسخ المقال بصيغة Markdown بنجاح! 📋' : 'Article copied as Markdown to clipboard! 📋');
      setTimeout(() => setToastMessage(null), 3000);
    }).catch(() => {
      setToastMessage(isAr ? 'تم نسخ المقال بنجاح!' : 'Article copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    });
  };

  // Download page representation blueprint as JSON
  const downloadPageJson = () => {
    if (!page) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(page, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wiki-page-${page.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!page) {
    return (
      <div 
        dir={isAr ? 'rtl' : 'ltr'}
        className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#191919] text-[#9B9B9B] select-none"
      >
        <div className="w-20 h-20 rounded-full bg-[#202020] border border-[#2F2F2F] flex items-center justify-center text-4xl mb-6 shadow-sm">
          🧠
        </div>
        <h2 className="text-xl font-bold text-[#E3E3E3] mb-2 font-sans">
          {isAr ? 'مرحباً بك في مدونة التوثيق البرمجي' : 'Welcome to the Developer Wiki'}
        </h2>
        <p className="text-sm text-[#9B9B9B] max-w-md">
          {isAr 
            ? 'الرجاء اختيار صفحة من شريط التصفح الجانبي أو تصفح الأقسام للبدء في القراءة والتعديل، أو أضف أقساماً ومواضيع جديدة بالكامل.' 
            : 'Please pick a documentation topic from the sidebar navigation or add customized categories and articles to expand your knowledge base locally.'}
        </p>
      </div>
    );
  }

  // Handle copying code snippet
  const copyToClipboard = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockId(blockId);
    setTimeout(() => {
      setCopiedBlockId(null);
    }, 2000);
  };

  const handleNotesSave = () => {
    onSaveNotes(page.id, localNotes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleNotesSave();
    }
  };

  const displayCategory = isEditing
    ? categories.find((c) => c.id === draftCategoryId) ?? category
    : category;

  const displayTitle = isEditing
    ? (isAr ? draftTitleAr : draftTitleEn)
    : (isAr ? page.titleAr : page.titleEn);

  const displayIcon = isEditing ? draftIcon : page.icon;

  const getBannerGradient = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-[#2F2F2F] via-[#252525] to-[#1C1C1C]',
      'from-[#343d38] via-[#252a27] to-[#1a1c1b]',
      'from-[#2c3340] via-[#20242d] to-[#17191f]',
      'from-[#372d3f] via-[#24202a] to-[#19171d]'
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'}
      className={`flex-1 overflow-y-auto bg-[#191919] flex flex-col relative h-full ${
        isAr ? 'font-cairo' : 'font-sans'
      }`}
    >
      {/* Notion style cover Banner */}
      {viewStyle !== 'zen' && (
        <div className={`h-48 w-full bg-gradient-to-r ${getBannerGradient(page.id)} relative border-b border-[#2F2F2F] shrink-0`}>
          <div className="absolute inset-0 bg-black/5" />
          
          {/* Decorative corner grid */}
          <div className="absolute right-4 bottom-4 text-[10px] font-mono text-[#9B9B9B]/55 select-none uppercase tracking-widest">
            {page.id.toUpperCase()} • {page.lastUpdated}
          </div>
        </div>
      )}

      {/* Content wrapper with float emoji overlapping cover */}
      <div className={`px-8 md:px-16 pb-20 relative flex-1 shrink-0 max-w-4xl w-full mx-auto ${viewStyle === 'zen' ? 'pt-16' : '-mt-12'}`}>
        
        {/* Floating Emoji bubble */}
        {viewStyle !== 'zen' && (
          <div className="w-24 h-24 rounded-2xl bg-[#191919] border border-[#2F2F2F] flex items-center justify-center text-5xl shadow-xl select-none relative z-10">
            {displayIcon}
          </div>
        )}

        {/* Action Header controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pb-4 border-b border-[#2F2F2F]">
          
          {/* Breadcrumbs pathway */}
          <div className="text-xs text-[#9B9B9B] flex items-center space-x-1.5 space-x-reverse">
            <span className="hover:text-[#E3E3E3] font-semibold mb-0.5">
              {displayCategory ? (isAr ? displayCategory.titleAr : displayCategory.titleEn) : 'Wiki'}
            </span>
            <span>{isAr ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}</span>
            <span className="text-gray-300 capitalize bg-[#252525] px-2 py-0.5 rounded border border-[#2F2F2F] font-mono">
              {page.id}
            </span>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Mark as read complete button */}
            <button
              onClick={() => onToggleComplete(page.id)}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded text-xs font-semibold border transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-[#3E7B5D]/20 border-[#3E7B5D]/50 text-[#3E7B5D] font-bold'
                  : 'bg-[#252525] border-[#2F2F2F] hover:border-[#373737] text-[#9B9B9B] hover:text-[#E3E3E3]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={14} className="text-[#3E7B5D]" />
                  <span>{isAr ? 'تمت الدراسة' : 'Study Complete'}</span>
                </>
              ) : (
                <>
                  <Circle size={14} />
                  <span>{isAr ? 'تحديد كمنتهي' : 'Mark Complete'}</span>
                </>
              )}
            </button>

             {/* Edit / Save toggle */}
            <button
              onClick={() => (isEditing ? saveEditing() : startEditing())}
              className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                isEditing
                  ? 'bg-[#3E7B5D] border-[#3E7B5D] text-white hover:bg-[#468969]'
                  : 'bg-[#252525] border-[#2F2F2F] hover:bg-[#2F2F2F] text-[#E3E3E3] hover:text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <Save size={13} />
                  <span>{isAr ? 'حفظ' : 'Save'}</span>
                </>
              ) : (
                <>
                  <FileText size={13} className="text-[#9B9B9B]" />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditPreview((preview) => !preview)}
                className={`flex items-center space-x-1.5 space-x-reverse px-3 py-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  isEditPreview
                    ? 'bg-[#2F2F2F] border-[#3E7B5D] text-white'
                    : 'bg-[#252525] border-[#2F2F2F] hover:bg-[#2F2F2F] text-[#9B9B9B] hover:text-white'
                }`}
              >
                {isEditPreview ? (
                  <>
                    <PenLine size={13} />
                    <span>{isAr ? 'متابعة التعديل' : 'Back to edit'}</span>
                  </>
                ) : (
                  <>
                    <Eye size={13} />
                    <span>{isAr ? 'معاينة' : 'Preview'}</span>
                  </>
                )}
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => setIsMetadataOpen(true)}
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 bg-[#252525] border border-[#2F2F2F] hover:bg-[#2F2F2F] text-[#9B9B9B] hover:text-white rounded text-xs font-semibold transition-all cursor-pointer"
                title={isAr ? 'إعدادات الصفحة' : 'Page settings'}
              >
                <Settings size={13} />
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditPreview(false);
                  setIsEditing(false);
                }}
                className="px-3 py-2 text-xs text-[#9B9B9B] hover:text-white transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )}

            {/* Vertical separator */}
            {!isEditing && (
              <>
            <div className="h-4 w-px bg-[#2F2F2F] self-center" />

            {/* Click-Based Multilevel Dropdown inside Dropdown */}
            <div className="relative" ref={dropdownRef} id="dropdown-wiki-options-context">
              <button
                type="button"
                onClick={() => {
                  setIsMainMenuOpen(!isMainMenuOpen);
                  setActiveSubMenu(null);
                }}
                className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  isMainMenuOpen
                    ? 'bg-[#2F2F2F] border-[#3E7B5D] text-white shadow-inner'
                    : 'bg-[#252525] border-[#2F2F2F] hover:border-[#373737] text-[#9B9B9B] hover:text-[#E3E3E3] shadow-sm'
                }`}
              >
                <MoreVertical size={13} />
                <span>{isAr ? 'خيارات إضافية' : 'Page Actions'}</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>

              {/* Main Category Dropdown Options Frame */}
              {isMainMenuOpen && (
                <div 
                  className={`absolute top-full mt-2 w-56 bg-[#202020] border border-[#2F2F2F] rounded shadow-2xl z-50 py-1.5 text-xs text-[#E3E3E3] ${
                    isAr ? 'left-0' : 'right-0'
                  }`}
                  style={{ minWidth: '220px' }}
                >
                  <div className="px-3 py-1.5 border-b border-[#2F2F2F]/60 text-[10px] font-mono font-bold uppercase tracking-wider text-[#9B9B9B] select-none">
                    {isAr ? 'أدوات ومميزات المقال' : 'Interactive Document Controls'}
                  </div>

                  {/* SUBMENU 1: VIEW OPTIONS */}
                  <div className="relative p-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubMenu(activeSubMenu === 'view' ? null : 'view');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left ${
                        isAr ? 'text-right flex-row-reverse' : 'text-left flex-row'
                      } hover:bg-[#252525] transition-all cursor-pointer ${
                        activeSubMenu === 'view' ? 'bg-[#2F2F2F] text-white font-semibold' : 'text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Eye size={13} className="text-[#9B9B9B]" />
                        <span>{isAr ? 'نمط عرض الصفحة' : 'View Settings'}</span>
                      </span>
                      <span className="text-[10px] bg-[#2F2F2F] text-[#9B9B9B] px-1.5 py-0.5 rounded capitalize">
                        {viewStyle}
                      </span>
                    </button>

                    {/* Submenu panels fly-out on clicking view settings button */}
                    {activeSubMenu === 'view' && (
                      <div 
                        className={`absolute top-0 w-48 bg-[#202020] border border-[#2F2F2F] rounded shadow-2xl py-1 z-50 ${
                          isAr ? 'right-full mr-2' : 'left-full ml-2'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setViewStyle('default');
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${
                            isAr ? 'text-right' : 'text-left'
                          } px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            viewStyle === 'default' ? 'text-[#3E7B5D] font-bold' : 'text-gray-300'
                          }`}
                        >
                          <span>{isAr ? 'افتراضي (نوشن)' : 'Default (Notion)'}</span>
                          {viewStyle === 'default' && <span className="text-xs">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setViewStyle('compact');
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${
                            isAr ? 'text-right' : 'text-left'
                          } px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            viewStyle === 'compact' ? 'text-[#3E7B5D] font-bold' : 'text-gray-300'
                          }`}
                        >
                          <span>{isAr ? 'مضغوط' : 'Compact Sizing'}</span>
                          {viewStyle === 'compact' && <span className="text-xs">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setViewStyle('zen');
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${
                            isAr ? 'text-right' : 'text-left'
                          } px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            viewStyle === 'zen' ? 'text-[#3E7B5D] font-bold' : 'text-gray-300'
                          }`}
                        >
                          <span>{isAr ? 'وضع التركيز (Zen)' : 'Zen Focus Mode'}</span>
                          {viewStyle === 'zen' && <span className="text-xs">✓</span>}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUBMENU 2: EXPORT OPTIONS */}
                  <div className="relative p-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubMenu(activeSubMenu === 'export' ? null : 'export');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left ${
                        isAr ? 'text-right flex-row-reverse' : 'text-left flex-row'
                      } hover:bg-[#252525] transition-all cursor-pointer ${
                        activeSubMenu === 'export' ? 'bg-[#2F2F2F] text-white font-semibold' : 'text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Download size={13} className="text-[#9B9B9B]" />
                        <span>{isAr ? 'تصدير المستند ➔' : 'Export Document ➔'}</span>
                      </span>
                    </button>

                    {/* Submenu panels fly-out on clicking export settings button */}
                    {activeSubMenu === 'export' && (
                      <div 
                        className={`absolute top-0 w-48 bg-[#202020] border border-[#2F2F2F] rounded shadow-2xl py-1 z-50 ${
                          isAr ? 'right-full mr-2' : 'left-full ml-2'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            copyMarkdownAsText();
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${
                            isAr ? 'text-right' : 'text-left'
                          } px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer text-xs transition-colors text-gray-300`}
                        >
                          {isAr ? 'نسخ كـ Markdown' : 'Copy as Markdown'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            downloadPageJson();
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${
                            isAr ? 'text-right' : 'text-left'
                          } px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer text-[#E3E3E3] hover:text-white transition-colors text-xs`}
                        >
                          {isAr ? 'تحميل كملف JSON' : 'Download JSON'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUBMENU 3: REFERENCE LINKS */}
                  <div className="relative p-1 border-t border-[#2F2F2F]/50 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubMenu(activeSubMenu === 'docs' ? null : 'docs');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left ${
                        isAr ? 'text-right flex-row-reverse' : 'text-left flex-row'
                      } hover:bg-[#252525] transition-all cursor-pointer ${
                        activeSubMenu === 'docs' ? 'bg-[#2F2F2F] text-white font-semibold' : 'text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Search size={13} className="text-[#9B9B9B]" />
                        <span>{isAr ? 'مراجع خارجية ➔' : 'External Lookups ➔'}</span>
                      </span>
                    </button>

                    {/* Submenu panels fly-out on clicking lookup options */}
                    {activeSubMenu === 'docs' && (
                      <div 
                        className={`absolute top-0 w-48 bg-[#202020] border border-[#2F2F2F] rounded shadow-2xl py-1 z-50 ${
                          isAr ? 'right-full mr-2' : 'left-full ml-2'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            window.open(`https://www.google.com/search?q=developer.mozilla.org+${encodeURIComponent(page.titleEn || '')}`, '_blank');
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${isAr ? 'text-right' : 'text-left'} px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer text-xs transition-colors text-gray-300`}
                        >
                          {isAr ? 'بحث في MDN Web Docs' : 'MDN Web Docs Search'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.open(`https://stackoverflow.com/questions/tagged/${encodeURIComponent(page.titleEn.split(' ')[0] || 'javascript')}`, '_blank');
                            setIsMainMenuOpen(false);
                            setActiveSubMenu(null);
                          }}
                          className={`w-full text-left ${isAr ? 'text-right' : 'text-left'} px-3 py-2 hover:bg-[#2F2F2F] cursor-pointer text-xs transition-colors text-gray-300`}
                        >
                          {isAr ? 'بحث في Stack Overflow' : 'Stack Overflow Tags'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>

        <div
          className="page-font-scaled"
          style={{ '--page-font-scale': fontScale } as React.CSSProperties}
        >
        {/* Core Page title definition */}
        <div className="mt-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            {displayTitle}
          </h1>
          
          <div className="flex items-center space-x-3 space-x-reverse mt-2.5 text-xs text-[#9B9B9B]">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {isAr ? 'آخر تحديث: ' : 'Updated: '} {page.lastUpdated}
            </span>
            <span>•</span>
            <span className="bg-[#252525] text-white px-2 py-0.5 rounded text-[10px] uppercase font-semibold border border-[#2F2F2F]">
              {displayCategory ? (isAr ? displayCategory.titleAr : displayCategory.titleEn) : 'Knowledge Base'}
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-10">
            {isEditPreview ? (
              <div className="rounded-lg border border-[#3E7B5D]/30 bg-[#202020]/40 p-1">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#3E7B5D] border-b border-[#2F2F2F]/60 mb-4">
                  {isAr ? 'معاينة — التغييرات غير محفوظة' : 'Preview — unsaved changes'}
                </p>
                <div className="px-2 pb-2">
                  <PageBlocksRenderer
                    blocks={draftBlocks}
                    language={language}
                    compact={viewStyle === 'compact'}
                    copiedBlockId={copiedBlockId}
                    onCopyCode={copyToClipboard}
                  />
                </div>
              </div>
            ) : (
              <InlinePageEditor
                blocks={draftBlocks}
                language={language}
                onChangeBlocks={(blocks) => updateEditDraft((draft) => ({ ...draft, blocks }))}
              />
            )}
          </div>
        ) : (
        <div className="mt-10">
          <PageBlocksRenderer
            blocks={page.blocks ?? []}
            language={language}
            compact={viewStyle === 'compact'}
            copiedBlockId={copiedBlockId}
            onCopyCode={copyToClipboard}
          />
        </div>
        )}

        {/* Personal Developer Scratchpad */}
        {!isEditing && viewStyle !== 'zen' && (
          <div className="mt-14 pt-8 border-t border-[#2F2F2F] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#E3E3E3] uppercase tracking-wider flex items-center gap-2">
                <FileText size={15} className="text-[#9B9B9B]" />
                <span>{isAr ? 'مفكرة الدرس السريعة' : 'Personal Developer Scratchpad'}</span>
              </h4>
              <div className="flex items-center space-x-2 space-x-reverse">
                {isSaved && (
                  <span className="text-xs text-[#3E7B5D] flex items-center gap-1 font-semibold">
                    <Check size={12} />
                    {isAr ? 'تم الحفظ محلياً!' : 'Autosaved Sync!'}
                  </span>
                )}
                <button
                  onClick={handleNotesSave}
                  className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 bg-[#3E7B5D] hover:bg-[#468969] text-white rounded text-xs transition-all cursor-pointer font-semibold shadow"
                >
                  <Save size={11} />
                  <span>{isAr ? 'حفظ' : 'Save Notes'}</span>
                </button>
              </div>
            </div>
            
            <p className="text-[11px] text-[#9B9B9B]">
              {isAr 
                ? 'مساحة مخصصة لكتابة توضيحاتك الذاتية، حلول برمجية مساعدة، أو مذكرات تذكيرية لهذا الدرس. اضغط على (Ctrl + S) للمزامنة اليدوية.' 
                : 'Write your custom code templates, study guides, or step-by-step tasks related specifically to this topic. Persisted locally in your browser workspace.'}
            </p>

            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onKeyDown={handleNotesKeyDown}
              placeholder={
                isAr 
                  ? 'أكتب مفكرتك الخاصة هنا...' 
                  : 'Brainstorm your own code ideas, architectural designs, command scripts, or reminders here...'
              }
              className="w-full h-32 bg-[#202020] border border-[#2F2F2F] hover:border-[#373737] rounded p-3 text-xs text-white font-mono leading-relaxed placeholder-[#9B9B9B]"
            />
          </div>
        )}
        </div>
      </div>

      {/* Page metadata side panel */}
      {page && (
        <PageMetadataPanel
          isOpen={isMetadataOpen}
          onClose={() => setIsMetadataOpen(false)}
          page={page}
          categories={categories}
          language={language}
          titleEn={draftTitleEn}
          titleAr={draftTitleAr}
          icon={draftIcon}
          categoryId={draftCategoryId}
          onChangeTitleEn={(titleEn) => updateEditDraft((draft) => ({ ...draft, titleEn }))}
          onChangeTitleAr={(titleAr) => updateEditDraft((draft) => ({ ...draft, titleAr }))}
          onChangeIcon={(icon) => updateEditDraft((draft) => ({ ...draft, icon }))}
          onChangeCategoryId={(categoryId) => updateEditDraft((draft) => ({ ...draft, categoryId }))}
        />
      )}

      {/* Floating font size controls */}
      {!isEditing && (
      <div
        className={`fixed bottom-6 z-40 flex items-center gap-1 px-2 py-1.5 bg-[#252525]/95 backdrop-blur-sm border border-[#2F2F2F] rounded-lg shadow-xl ${
          isAr ? 'left-6' : 'right-6'
        }`}
        role="toolbar"
        aria-label={isAr ? 'التحكم بحجم الخط' : 'Font size controls'}
      >
        <Type size={14} className="text-[#9B9B9B] shrink-0 mx-0.5" aria-hidden />
        <button
          type="button"
          onClick={() => setFontScaleIndex((i) => Math.max(0, i - 1))}
          disabled={!canDecreaseFont}
          className="p-1.5 rounded hover:bg-[#2F2F2F] text-[#E3E3E3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label={isAr ? 'تصغير الخط' : 'Decrease font size'}
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => setFontScaleIndex(DEFAULT_FONT_SCALE_INDEX)}
          className="min-w-[3rem] px-1 text-[11px] font-mono font-semibold text-[#9B9B9B] hover:text-[#E3E3E3] transition-colors cursor-pointer"
          aria-label={isAr ? 'إعادة ضبط حجم الخط' : 'Reset font size'}
          title={isAr ? 'إعادة الضبط' : 'Reset'}
        >
          {fontScalePercent}%
        </button>
        <button
          type="button"
          onClick={() => setFontScaleIndex((i) => Math.min(FONT_SCALE_LEVELS.length - 1, i + 1))}
          disabled={!canIncreaseFont}
          className="p-1.5 rounded hover:bg-[#2F2F2F] text-[#E3E3E3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label={isAr ? 'تكبير الخط' : 'Increase font size'}
        >
          <Plus size={14} />
        </button>
      </div>
      )}

      {/* Floating State Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#252525] border border-[#3E7B5D] text-[#E3E3E3] px-4.5 py-2.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-300">
          <span className="w-2 h-2 rounded-full bg-[#3E7B5D] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
