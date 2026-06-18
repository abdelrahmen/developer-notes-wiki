/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopicPage, Category, ContentBlock, Language, UserProgress } from '../types';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ExternalLink, 
  BookOpen, 
  Code, 
  Copy, 
  Check, 
  User, 
  Edit3, 
  FileText, 
  Trash2, 
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
  Plus
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

interface PageViewProps {
  page: TopicPage | null;
  category: Category | null;
  language: Language;
  onEditPage: (page: TopicPage) => void;
  isCompleted: boolean;
  onToggleComplete: (pageId: string) => void;
  notes: string;
  onSaveNotes: (pageId: string, notesContent: string) => void;
}

export default function PageView({
  page,
  category,
  language,
  onEditPage,
  isCompleted,
  onToggleComplete,
  notes,
  onSaveNotes
}: PageViewProps) {
  const isAr = language === 'ar';
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  
  // Local scratchpad notes
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

  // Sync state with changing pages
  useEffect(() => {
    setLocalNotes(notes);
    setIsSaved(false);
    setIsMainMenuOpen(false);
    setActiveSubMenu(null);
  }, [notes, page]);

  // Copy raw built markdown representation of page blocks
  const copyMarkdownAsText = () => {
    if (!page) return;
    let md = `# ${page.titleEn}\n\n`;
    if (page.personalClarificationEn) {
      md += `> ${page.personalClarificationEn}\n\n`;
    }
    if (page.blocks) {
      page.blocks.forEach(block => {
        if (block.type === 'heading') {
          md += `## ${block.titleEn || ''}\n\n`;
        } else if (block.type === 'paragraph') {
          md += `${block.textEn || ''}\n\n`;
        } else if (block.type === 'definition') {
          md += `**Definition - ${block.titleEn || ''}**\n${block.textEn || ''}\n\n`;
        } else if (block.type === 'code') {
          md += `\`\`\`${block.language || 'typescript'}\n${block.code || ''}\n\`\`\`\n\n`;
        } else if (block.type === 'callout') {
          md += `> **Tip:** ${block.textEn || ''}\n\n`;
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
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleNotesSave();
    }
  };

  // Modern procedural abstract gradient based on page ID to give a beautiful dark-notion header banner
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
            {page.icon}
          </div>
        )}

        {/* Action Header controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pb-4 border-b border-[#2F2F2F]">
          
          {/* Breadcrumbs pathway */}
          <div className="text-xs text-[#9B9B9B] flex items-center space-x-1.5 space-x-reverse">
            <span className="hover:text-[#E3E3E3] font-semibold mb-0.5">
              {category ? (isAr ? category.titleAr : category.titleEn) : 'Wiki'}
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

             {/* Edit page trigger button */}
            <button
              onClick={() => onEditPage(page)}
              className="flex items-center space-x-1.5 space-x-reverse px-4 py-2 bg-[#252525] border border-[#2F2F2F] hover:bg-[#2F2F2F] text-[#E3E3E3] hover:text-white rounded text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Edit3 size={13} className="text-[#9B9B9B]" />
              <span>{isAr ? 'تعديل الصفحة' : 'Modify Article'}</span>
            </button>

            {/* Vertical separator */}
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
          </div>
        </div>

        <div
          className="page-font-scaled"
          style={{ '--page-font-scale': fontScale } as React.CSSProperties}
        >
        {/* Core Page title definition */}
        <div className="mt-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            {isAr ? page.titleAr : page.titleEn}
          </h1>
          
          <div className="flex items-center space-x-3 space-x-reverse mt-2.5 text-xs text-[#9B9B9B]">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {isAr ? 'آخر تحديث: ' : 'Updated: '} {page.lastUpdated}
            </span>
            <span>•</span>
            <span className="bg-[#252525] text-white px-2 py-0.5 rounded text-[10px] uppercase font-semibold border border-[#2F2F2F]">
              {category ? (isAr ? category.titleAr : category.titleEn) : 'Knowledge Base'}
            </span>
          </div>
        </div>

        {/* 1. Personal Clarification Box (Italicized offset bordered card) */}
        {viewStyle !== 'zen' && ((isAr ? page.personalClarificationAr : page.personalClarificationEn)) && (
          <div className="mt-8 p-5 bg-[#252525] border-l-4 border-[#9B9B9B] rounded-r rounded-l-none shadow-inner space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse text-[#E3E3E3] font-bold text-xs uppercase tracking-wider">
              <div className="p-1 rounded bg-[#2F2F2F]">
                <User size={13} />
              </div>
              <span>{isAr ? 'توضيحات وملاحظات شخصية' : 'Personal Clarifications'}</span>
            </div>
            <p className="text-sm text-[#E3E3E3]/95 leading-relaxed italic pr-1 whitespace-pre-wrap">
              " {isAr ? page.personalClarificationAr : page.personalClarificationEn} "
            </p>
          </div>
        )}

        {/* 2. Structured Content blocks */}
        <div className={`mt-10 ${viewStyle === 'compact' ? 'space-y-4' : 'space-y-8'}`}>
          {page.blocks?.map((block) => {
            switch (block.type) {
              
              case 'heading':
                return (
                  <h3 
                    key={block.id} 
                    className={`font-bold text-white border-b border-[#2F2F2F] pb-1.5 hover:text-[#E3E3E3] transition-colors ${
                      viewStyle === 'compact' ? 'text-base mt-4' : 'text-xl mt-8'
                    }`}
                  >
                    {isAr ? block.titleAr : block.titleEn}
                  </h3>
                );

              case 'paragraph':
                return (
                  <p 
                    key={block.id} 
                    className={`leading-relaxed font-sans whitespace-pre-wrap ${
                      viewStyle === 'compact' ? 'text-xs text-[#CBD5E1]' : 'text-sm text-[#E3E3E3]/95'
                    }`}
                  >
                    {isAr ? block.textAr : block.textEn}
                  </p>
                );

              case 'definition':
                return (
                  <div 
                    key={block.id} 
                    className="p-4 bg-[#202020] border border-[#2F2F2F] rounded flex items-start space-x-3.5 space-x-reverse"
                  >
                    <div className="p-2 bg-[#252525] text-[#E3E3E3] rounded self-start">
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-[#E3E3E3] uppercase tracking-wide">
                        {isAr ? block.titleAr : block.titleEn}
                      </h4>
                      <p className="text-xs leading-relaxed text-[#9B9B9B] whitespace-pre-wrap">
                        {isAr ? block.textAr : block.textEn}
                      </p>
                    </div>
                  </div>
                );

              case 'code':
                return (
                  <div 
                    key={block.id} 
                    className="rounded bg-[#202020] border border-[#2F2F2F] overflow-hidden font-mono text-xs flex flex-col shadow-sm"
                  >
                    {/* Code block header */}
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
                        onClick={() => copyToClipboard(block.code || '', block.id)}
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
                    {/* Actual Script lines code layout */}
                    <pre className="p-4 bg-[#191919] text-[#CBD5E1] overflow-x-auto whitespace-pre leading-relaxed select-all">
                      <code>{block.code}</code>
                    </pre>
                  </div>
                );

              case 'callout':
                return (
                  <div 
                    key={block.id} 
                    className="p-4 bg-[#252525] border border-[#2F2F2F] rounded flex items-start space-x-3 space-x-reverse transition-all"
                  >
                    <div className="flex-1 text-sm text-[#E3E3E3]/95 leading-relaxed font-medium whitespace-pre-wrap">
                      {isAr ? block.textAr : block.textEn}
                    </div>
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

              default:
                return null;
            }
          })}
        </div>

        {/* 3. Fully Interactive Developer Scratchpad / Notepad (Custom user addition) */}
        {viewStyle !== 'zen' && (
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

      {/* Floating font size controls */}
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
