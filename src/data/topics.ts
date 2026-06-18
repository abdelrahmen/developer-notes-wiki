/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, TopicPage } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'frontend',
    titleEn: 'Frontend Engineering',
    titleAr: 'هندسة الواجهات الأمامية',
    icon: '🎨'
  },
  {
    id: 'backend',
    titleEn: 'Backend Systems',
    titleAr: 'الأنظمة الخلفية وقواعد البيانات',
    icon: '⚙️'
  },
  {
    id: 'backend-databases',
    titleEn: 'Databases & Storage',
    titleAr: 'قواعد البيانات والتخزين',
    icon: '📂',
    parentId: 'backend'
  },
  {
    id: 'db-advanced',
    titleEn: 'NoSQL & Distributed Storage',
    titleAr: 'الحفظ العنقودي والأنظمة الموزعة',
    icon: '📦',
    parentId: 'backend-databases'
  },
  {
    id: 'backend-apis',
    titleEn: 'API Design & Gateways',
    titleAr: 'تصميم وبوابات الواجهات البرمجية',
    icon: '📡',
    parentId: 'backend'
  },
  {
    id: 'devops',
    titleEn: 'DevOps & Systems',
    titleAr: 'هندسة العمليات والأنظمة تزامناً',
    icon: '🚀'
  }
];

export const INITIAL_PAGES: TopicPage[] = [
  {
    id: 'click-dropdown-pattern',
    categoryId: 'frontend',
    titleEn: 'Click-Based Multilevel Dropdowns',
    titleAr: 'القوائم المنسدلة متعددة المستويات بالنقر',
    icon: '🖱️',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'cd-h1',
        type: 'heading',
        titleEn: 'Designing a Fluid Nested Dropdown',
        titleAr: 'تصميم هيكل منسدل متداخل وعالي المرونة'
      },
      {
        id: 'cd-p1',
        type: 'paragraph',
        textEn: 'A robust multilevel dropdown requires three key pieces: 1) Active parent toggle state to track menu display. 2) Active submenu state key to reveal corresponding nested flyouts. 3) Document mouse click listeners captured inside a React hook to remove the menu when coordinates land outside the container boundaries.',
        textAr: 'تحتاج القائمة المنسدلة المركبة لثلاثة عناصر رئيسية: ١) حالة مرجعية لتغطية ظهور القائمة الأم. ٢) حالة معرفة (Submenu ID) لمعرفة القائمة الفرعية التي يجب تحجيمها ومحاذاتها طائراً. ٣) مستمع حدث الضغط في شجرة الصفحة (document listener) لتسوية الحالات وإغلاقها جميعاً عند الضغط خارج إطار الأداة.'
      },
      {
        id: 'cd-def',
        type: 'callout',
        textEn: 'Outside Click Listener Pattern: An industry-standard technique in React utilizing useRef to link a container, adding DOM click listeners in a useEffect callback, and comparing if event.target lands inside container.current to trigger menu teardowns.',
        textAr: 'نمط تتبع النقرات الخارجية: تقنية تصميمية يتم فيها ربط الكائن الحاوي للأداة بـ useRef، وتعيين مستمع نقرات برأس الصفحة بالمتصفح، وموازنة ما إن كان الحدث واقعاً خارج أركان العنصر لتسريح الحالات وإغلاق الأزرار المنسدلة.'
      },
      {
        id: 'cd-code',
        type: 'code',
        language: 'typescript',
        code: `import React, { useState, useEffect, useRef } from 'react';

export function MultilevelDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'themes' | 'languages' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto close menu upon clicking outside container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => { setIsOpen(!isOpen); setActiveSubMenu(null); }}
        className="px-4 py-2 bg-neutral-800 text-white border border-neutral-700 rounded text-sm font-semibold flex items-center space-x-2"
      >
        <span>Toggle Menu</span>
        <span>▼</span>
      </button>

      {/* Main Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-md py-1.5 shadow-xl text-neutral-200 text-sm z-50">
          
          {/* Submenu Trigger: Themes */}
          <div className="relative">
            <button
              onClick={() => setActiveSubMenu(activeSubMenu === 'themes' ? null : 'themes')}
              className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between"
            >
              <span>View Settings</span>
              <span>➔</span>
            </button>

            {/* Nested Flyout */}
            {activeSubMenu === 'themes' && (
              <div className="absolute left-full top-0 ml-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md py-1 shadow-lg">
                <button className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs">Light Preset</button>
                <button className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs">Modern Dark Preset</button>
                <button className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs">Zen Slate Focus</button>
              </div>
            )}
          </div>
          
          {/* Normal Action Link */}
          <button className="w-full text-left px-3 py-2 hover:bg-neutral-800">
            Export Markdown Archive
          </button>
        </div>
      )}
    </div>
  );
}`
      },
      {
        id: 'cd-links',
        type: 'links',
        links: [
          {
            id: 'cdld1',
            labelEn: 'React Documentation: Referencing Values with Refs',
            labelAr: 'توثيق ريأكت: الإشارة للقيم باستخدام الكائن المرجعي Ref',
            url: 'https://react.dev/learn/referencing-values-with-refs',
            type: 'docs'
          },
          {
            id: 'cdld2',
            labelEn: 'MDN: Comparing Event Bubbling and Capturing',
            labelAr: 'مستندات MDN: مقارنة انتشار واحتواء الأحداث بصفحات الويب',
            url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture',
            type: 'docs'
          }
        ]
      }
    ]
  },
  {
    id: 'react-state',
    categoryId: 'frontend',
    titleEn: 'React Render & State Mechanics',
    titleAr: 'ميكانيكية التصيير والحالة في ريأكت',
    icon: '⚛️',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'rs-h1',
        type: 'heading',
        titleEn: 'Core Render Loop & Virtual DOM',
        titleAr: 'حلقة التصيير الأساسية وشجرة المستندات الافتراضية'
      },
      {
        id: 'rs-p1',
        type: 'paragraph',
        textEn: 'React builds and maintains a lightweight representation of the UI called the Virtual DOM. When state changes, a render pass is triggered. During the render phase, React calls the component function, computes the new Virtual DOM tree, and performs a diffing process (called Fiber reconciliation) against the previous tree. The ultimate layout engine details are then written to the actual browser DOM in the commit phase.',
        textAr: 'يقوم ريأكت بإنشاء وصيانة تمثيل خفيف لواجهة المستخدم يسمى "شجرة المستندات الافتراضية". عندما تتغير الحالة، يتم تشغيل عملية تصيير جديدة. خلال مرحلة التصيير، يستدعي ريأكت دالة المكون ويحسب الشجرة الافتراضية الجديدة، ثم يجري مقارنة (Diffing Process) مع الشجرة السابقة (مصالحة الألياف). في مرحلة الالتزام (Commit)، يتم كتابة التغييرات النهائية إلى شجرة DOM الحقيقية للمتصفح.'
      },
      {
        id: 'rs-def-reconcile',
        type: 'callout',
        textEn: 'Reconciliation (Fiber): The reconciliation algorithm is React\'s virtual diffing process that allows it to identify changed segments of the DOM. Fiber is the backend engine rewrite in React 16 that introduces incremental rendering, meaning React can split rendering work into chunks and spread it over multiple frames to prevent main-thread blockage.',
        textAr: 'المصالحة والتوفيق (المعمارية ليفية): خوارزمية المصالحة هي عملية المقارنة الافتراضية التي يتبعها ريأكت للتعرف على الأجزاء المتغيرة من شجرة DOM. معمارية فايبر (Fiber) هي إعادة بناء للمحرك الداخلي في ريأكت 16 تتيح عملية التصيير التراكمي والمجزأ، مما يسمح بتقسيم مهام التصيير على عدة إطارات دون حجب خيط العمل الرئيسي للمتصفح.'
      },
      {
        id: 'rs-code1',
        type: 'code',
        language: 'typescript',
        code: `import React, { useState, useEffect } from 'react';

export function Counter() {
  const [count, setCount] = useState<number>(0);

  const handleIncrement = () => {
    // ❌ WRONG: Attempting to read count immediately will show stale state
    setCount(count + 1);
    console.log("Stale state:", count); // will print count before increment

    // ✅ CORRECT: Use functional updates for consecutive state transitions
    setCount(prev => prev + 1);
  };

  return (
    <button 
      onClick={handleIncrement}
      className="px-4 py-2 bg-indigo-600 rounded"
    >
      Count: {count}
    </button>
  );
}`
      },
      {
        id: 'rs-callout',
        type: 'callout',
        textEn: '💡 Pro Tip: Leverage useEffect strictly for external synchronization and side-effects. Refrain from syncing local states inside useEffect as this precipitates extra render cycles.',
        textAr: '💡 نصيحة احترافية: استخدم useEffect حصرياً للمزامنة الخارجية والتأثيرات الجانبية. تجنب استخدامها لمزامنة الحالات المحلية، لأن ذلك يسبب دورات تصيير إضافية غير ضرورية في المتصفح.'
      },
      {
        id: 'rs-links',
        type: 'links',
        links: [
          {
            id: 'l1',
            labelEn: 'React Official: Render and Commit',
            labelAr: 'مستندات ريأكت: التصيير والالتزام بالرسم التوضيحي',
            url: 'https://react.dev/learn/render-and-commit',
            type: 'docs'
          },
          {
            id: 'l2',
            labelEn: 'React Fiber Architecture Breakdown',
            labelAr: 'شرح معماري كامل لـ React Fiber',
            url: 'https://github.com/acdlite/react-fiber-architecture',
            type: 'github'
          }
        ]
      }
    ]
  },
  {
    id: 'typescript-types',
    categoryId: 'frontend',
    titleEn: 'Advanced TypeScript Types & Utility Maps',
    titleAr: 'أنواع تايب سكريبت المتقدمة والخرائط المساعدة',
    icon: '🛡️',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'ts-h1',
        type: 'heading',
        titleEn: 'Conditional Types & Template Literal Types',
        titleAr: 'الأنواع الشرطية والأنواع النصية المعيارية шаблоны'
      },
      {
        id: 'ts-p1',
        type: 'paragraph',
        textEn: 'Conditional types follow the ternary operator syntax: `T extends U ? X : Y`. Combined with template literal types, we can construct hyper-precise validations, such as ensuring hex colors start with hashes or dynamically generating nested object key paths.',
        textAr: 'تتبع الأنواع الشرطية صياغة المعامل الثلاثي الشهير: `T extends U ? X : Y`. وبدمجها مع الأنواع النصية المعيارية، يمكننا هيكلة تحققات فائقة الدقة بداخل المحرر مباشرة، مثل التأكد من بدء الألوان برمز الهاش #، أو إنشاء مسارات مفاتيح متفرعة لكائنات البيانات بشكل تفاعلي.'
      },
      {
        id: 'ts-def-utility',
        type: 'callout',
        textEn: 'Mapped Types: Mapped types allow taking an existing model and transforming its keys to produce a new structure. Useful examples include converting all fields to read-only, prefixing field names dynamically, or stripping out specific properties via key remapping.',
        textAr: 'الأنواع المخططة (Mapped Types): تسمح الأنواع المخططة بتحويل مفاتيح نموذج موجود مسبقاً لإنشاء واجهة وهيكل جديد تماماً. تتضمن الأمثلة المفيدة تحويل كافة الحقول لتكون للقراءة فقط (Read-only)، أو إلحاق بادئة بأسماء الحقول ديناميكياً، أو استبعاد خصائص محددة تماماً.'
      },
      {
        id: 'ts-code1',
        type: 'code',
        language: 'typescript',
        code: `// Expressing a nested lookup utility type
type NestedPaths<T> = T extends object
  ? { [K in keyof T]: \`\${string & K}\` | \`\${string & K}.\${NestedPaths<T[K]>}\` }[keyof T]
  : never;

interface UserProfile {
  id: string;
  settings: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

// Resulting keys: "id" | "settings" | "settings.theme" | "settings.notifications" | "settings.notifications.email" | "settings.notifications.push"
type ProfilePaths = NestedPaths<UserProfile>;

// Asserting string values conform to specific prefixes
type HexColor = \`#\${string}\`;
const validColor: HexColor = "#f3f4f6";
// const invalidColor: HexColor = "rgb(12, 12, 12)"; // ❌ TypeScript compilation error!`
      },
      {
        id: 'ts-links',
        type: 'links',
        links: [
          {
            id: 'ts-l1',
            labelEn: 'TypeScript Documentation: Mapped Types',
            labelAr: 'مستندات تايب سكريبت الرسمية: الأنواع المخططة',
            url: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html',
            type: 'docs'
          },
          {
            id: 'ts-l2',
            labelEn: 'Advanced Type Challenges Platform',
            labelAr: 'تحديات تايب سكريبت البرمجية لحل المسائل الصعبة',
            url: 'https://github.com/type-challenges/type-challenges',
            type: 'github'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-vs-graphql',
    categoryId: 'backend-apis',
    titleEn: 'REST vs GraphQL Architecture Paradigm',
    titleAr: 'مقارنة معمارية واجهات REST مع خطوط GraphQL',
    icon: '🔌',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'api-h1',
        type: 'heading',
        titleEn: 'Over-fetching & Under-fetching Mechanics',
        titleAr: 'ميكانيكية تحصيل البيانات الزائدة والناقصة'
      },
      {
        id: 'api-p1',
        type: 'paragraph',
        textEn: 'In REST, resources are hardwired to specific URL endpoints. For instance, fetching a user from \`/api/users/1\` returns all profile properties, even if we only need the user\'s name (over-fetching). Conversely, if we need a list of user transactions, we have to perform additional HTTP hits to \`/api/users/1/transactions\` (under-fetching). GraphQL resolves this elegantly via a single endpoint using schema projections.',
        textAr: 'في واجهات REST، يتم ربط الموارد مسبقاً بعناوين URL مخصصة. على سبيل المثال، جلب ملف مستخدم من \`/api/users/1\` يعطيك كامل بياناته الشخصية، حتى وإن كنت بحاجة للاسم فقط (جلب زائد). وإذا كنت تحتاج لقائمة التعاملات المالية للمستخدم في نفس اللحظة، فستضطر لإجراء طلب إضافي إلى \`/api/users/1/transactions\` (جلب ناقص). يحل GraphQL هذه المشكلة تماماً باستعلام واحد عبر عنوان موحد.'
      },
      {
        id: 'api-def-gql',
        type: 'callout',
        textEn: 'GraphQL Schema Definition (SDL): The Schema Definition Language (SDL) operates as a strict contract between client and server. No query can be completed if it strays from the typed schemas, giving backend developers absolute clarity on system consumption of endpoints.',
        textAr: 'لغة تعريف المخططات في GraphQL: تعتبر لغة تعريف المخططات (SDL) عقداً صارماً لتمثيل جلب الكائنات بين العميل والخادم. لا يمكن معالجة أو إنهاء أي استعلام إذا انحرف عما تم تعريفه مسبقاً في هيكل البيانات، مما يعطي مطوري الأنظمة الخلفية تحكماً كاملاً بالبيانات المتداولة.'
      },
      {
        id: 'api-code1',
        type: 'code',
        language: 'javascript',
        code: `// --- REST Endpoint Example (Express) ---
app.get('/api/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);
  // Returns entire object whether the frontend needs it or not
  res.json(user);
});

// --- GraphQL Resolver Example (Apollo) ---
const typeDefs = \`
  type Query {
    user(id: ID!): User
  }
  type User {
    id: ID!
    username: String!
    email: String!
    bio: String
  }
\`;

const resolvers = {
  Query: {
    user: async (_, { id }) => db.getUser(id)
  }
};`
      },
      {
        id: 'api-links',
        type: 'links',
        links: [
          {
            id: 'api-l1',
            labelEn: 'Official GraphQL Specification',
            labelAr: 'المواصفات الفنية الرسمية لـ GraphQL',
            url: 'https://spec.graphql.org/',
            type: 'docs'
          },
          {
            id: 'api-l2',
            labelEn: 'Architectural Style APIs: RESTful Patterns',
            labelAr: 'أنماط وبنى RESTful وكيف تم كتابة الأطروحة الأصلية',
            url: 'https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm',
            type: 'docs'
          }
        ]
      }
    ]
  },
  {
    id: 'db-indexing',
    categoryId: 'backend-databases',
    titleEn: 'Database Indexing Mechanics & B-Trees',
    titleAr: 'ميكانيكا فهارس قواعد البيانات وهياكل B-Tree',
    icon: '🗄️',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'db-h1',
        type: 'heading',
        titleEn: 'The Anatomy of a B-Tree Query Scan',
        titleAr: 'تحليل البنية والمسح في استعلامات B-Tree'
      },
      {
        id: 'db-p1',
        type: 'paragraph',
        textEn: 'A B-Tree (Balanced Tree) is a self-balancing search index structure. Each node contains sorted keys and pointers to child nodes. When performing a select search, the engine navigates down the tree levels from the root, ruling out large arrays of data immediately. Writing new entries requires re-splitting nodes, which is why indexing every column indiscriminately slows down insert logs.',
        textAr: 'شجرة B-Tree (الشجرة المتوازنة) هي بنية ذاتية التنظيم والبحث. يحتوي كل عقدة فيها على مفاتيح مرتبة ومؤشرات لعقد فرعية أخرى. عند تشغيل استعلام البحث، ينتقل المحرك لأسفل مستويات الشجرة بداية من العقدة الجذرية مستبعداً صفحات ضخمة من البيانات في كل خطوة. تتطلب كتابة السجلات الجديدة إعادة تقسيم العقد، ولهذا السبب يؤدي فهرسة كل الأعمدة عشوائياً لإبطاء الإدخال وكتابة الملفات.'
      },
      {
        id: 'db-def-bt',
        type: 'callout',
        textEn: 'Clustered vs Non-Clustered Indexes: A Clustered Index dictates the physical order in which data rows are written, thus only one can exist per table (usually the Primary Key). A Non-Clustered index stores a separate sorted structure pointing back to the storage location of the rows.',
        textAr: 'الفهارس المتجمعة (Clustered) وغير المتجمعة: يحدد الفهرس المتجمع الترتيب الفيزيائي الفعلي لصفوف البيانات في القرص الصلب، لذا يمكن وجود فهرس متجمع واحد فقط للجدول (في العادة هو المفتاح الرئيسي). الفهرس غير المتجمع يخزن شجرة منفصلة تشير إلى موقع الصفوف الحقيقي في القرص.'
      },
      {
        id: 'db-code1',
        type: 'code',
        language: 'sql',
        code: `-- Creating a highly specific compound index in PostgreSQL
CREATE INDEX idx_user_orders_status_date_desc 
ON orders (user_id, status, created_at DESC);

-- Let's run an EXPLAIN ANALYZE to monitor plan execution
EXPLAIN ANALYZE
SELECT id, total_amount, created_at 
FROM orders 
WHERE user_id = 9482 
  AND status = 'COMPLETED' 
ORDER BY created_at DESC;

-- Output will show 'Index Scan using idx_user_orders_status_date_desc' 
-- rather than the dreaded 'Seq Scan' (Sequential Scan of the whole table).`
      },
      {
        id: 'db-links',
        type: 'links',
        links: [
          {
            id: 'db-l1',
            labelEn: 'PostgreSQL Manual: Indexes on Expressions',
            labelAr: 'كتيب بوستغرس: الفهرسة وبنى التعبيرات المحددة',
            url: 'https://www.postgresql.org/docs/current/indexes-expressional.html',
            type: 'docs'
          },
          {
            id: 'db-l2',
            labelEn: 'Use The Index, Luke: SQL Tuning Guide',
            labelAr: 'مدونة Use The Index, Luke: الدليل المرجعي لتهيئة فهارس SQL',
            url: 'https://use-the-index-luke.com/',
            type: 'link'
          }
        ]
      }
    ]
  },
  {
    id: 'docker-containers',
    categoryId: 'devops',
    titleEn: 'Docker Containerization Mechanics',
    titleAr: 'ميكانيكا وبنية الحاويات باستخدام دوكر',
    icon: '🐳',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'dk-h1',
        type: 'heading',
        titleEn: 'Namespaces & Control Groups (Cgroups)',
        titleAr: 'مساحات الأسماء ومجموعات التحكم (Cgroups)'
      },
      {
        id: 'dk-p1',
        type: 'paragraph',
        textEn: 'Namespaces isolate what processes can see (PID, Network, Mountpoints). Control groups (cgroups) restrict how much resource a process can consume (Memory, CPU limit, I/O rates). Because Docker shares the host kernel, booting containers is near instantaneous, taking milliseconds instead of several minutes like traditional hypervisors.',
        textAr: 'تقوم مساحات الأسماء (Namespaces) بعزل نطاق رؤية المعالجات (رقم المعالج، الشبكة، مسارات الملفات). بينما تقوم مجموعات التحكم (cgroups) بالتحكم في مقدار استهلاك الموارد المتاحة (الذاكرة المؤقتة، المعالجات، معدلات الدخل والخروج). ولمشاركة دوكر لنواة المضيف الفعلي، يستغرق تشغيل الحاويات أجزاء من الثانية بدلاً من دقائق.'
      },
      {
        id: 'dk-def-stages',
        type: 'callout',
        textEn: 'Multi-Stage Builds: A Dockerfile technique where multiple FROM statements are declared. Build dependencies are kept inside temporary compiler layers, while the final small container only receives compiled assets and runtime binaries.',
        textAr: 'البناء متعدد المراحل (Multi-Stage Builds): تقنية بملف Dockerfile يتم فيها استخدام أكثر من إعلان FROM. يتم عزل أدوات البناء وتجميع الحزم الضخمة بداخل بيئات مؤقتة، بينما تشحن البيئة النهائية الصغيرة بالملفات الناتجة فقط، مما يوفر مساحات شاسعة بالذاكرة.'
      },
      {
        id: 'dk-code1',
        type: 'code',
        language: 'dockerfile',
        code: `# --- STAGE 1: Compilation build environment ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- STAGE 2: Lightweight production final container ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]`
      },
      {
        id: 'dk-links',
        type: 'links',
        links: [
          {
            id: 'dk-l1',
            labelEn: 'Docker Reference: Best Practices for Writing Dockerfiles',
            labelAr: 'توثيق دوكر: أفضل الممارسات المعتمدة لكتابة ملفات Dockerfile',
            url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/',
            type: 'docs'
          },
          {
            id: 'dk-l2',
            labelEn: 'Distroless Minimal Runtime Images Repository',
            labelAr: 'مستودع بيئات Distroless الخالية من حزم أنظمة التشغيل التقليدية',
            url: 'https://github.com/GoogleContainerTools/distroless',
            type: 'github'
          }
        ]
      }
    ]
  },
  {
    id: 'cicd-automation',
    categoryId: 'devops',
    titleEn: 'CI/CD Build Automation Pipelines',
    titleAr: 'أتمتة خطوط التكامل والنشر المستمر (CI/CD)',
    icon: '🔄',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'ci-h1',
        type: 'heading',
        titleEn: 'Continuous Integration vs Continuous Delivery',
        titleAr: 'الفرق الوظيفي بين التكامل المستمر والتوصيل المستمر'
      },
      {
        id: 'ci-p1',
        type: 'paragraph',
        textEn: 'Continuous Integration (CI) is the practice of merging all developer code into a shared mainline branch multiple times a day, which runs automated test suites to find regression errors early. Continuous Delivery (CD) automates the release process so that the verified artifact can be easily deployed to staging or production systems with a simple approvals button or automatic script trigger.',
        textAr: 'التكامل المستمر (CI) هو عملية مواءمة ودمج دائم لشيفرات المطورين بداخل الفرع الرئيسي المشترك بصورة مستقرة يومياً، مستفيدين بعمليات اختبار مبرمجة سلفاً لاكتشاف أخطاء الانتكاس. أما التوصيل المستمر (CD) فهو أتمتة إطلاق الحزم للإنتاج بشكل مستقر وبنقرة واحدة.'
      },
      {
        id: 'ci-def-gates',
        type: 'callout',
        textEn: 'Build Security Gate (SAST): Static Application Security Testing processes check the source files before build compiling to detect leaked secrets, vulnerable dependencies, and outdated package definitions.',
        textAr: 'بوابات الفحص الأمني الساكن (SAST): عمليات الفحص الأمني الثابت للتطبيقات تقوم بتحليل الشيفرة المصدرية قبل بناء الملف النهائي للكشف عن أي مفاتيح تشفير مسربة، أو حزم برمجية ذات ثغرات معروفة.'
      },
      {
        id: 'ci-code1',
        type: 'code',
        language: 'yaml',
        code: `# GitHub Actions CI Workflow template
name: Deploy Production Service

on:
  push:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up NodeJS Environment
      uses: actions/setup-node@v4
      with:
        node-size: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run code linter
      run: npm run lint

    - name: Execute automated unit suite
      run: npm run test:unit`
      },
      {
        id: 'ci-links',
        type: 'links',
        links: [
          {
            id: 'ci-l1',
            labelEn: 'GitHub Actions Official Quickstart Guide',
            labelAr: 'الدليل السريع لبدء استخدام GitHub Actions',
            url: 'https://docs.github.com/en/actions/writing-workflows/quickstart',
            type: 'docs'
          }
        ]
      }
    ]
  },
  {
    id: 'nosql-sharding',
    categoryId: 'db-advanced',
    titleEn: 'Database Sharding & Replication',
    titleAr: 'تجزئة وتكرار قواعد البيانات الموزعة',
    icon: '💾',
    lastUpdated: '2026-05-31',
    blocks: [
      {
        id: 'shard-h1',
        type: 'heading',
        titleEn: 'Partitioning Architectures & Shard Keys',
        titleAr: 'معماريات التقسيم ومفاتيح التجزئة'
      },
      {
        id: 'shard-p1',
        type: 'paragraph',
        textEn: 'When any database outgrows a single machine’s hardware, horizontal scaling becomes necessary. Selecting a robust shard key is critical: a poor shard key choice (such as a monotonically increasing timestamp) leads to hot-spotting, where a single node handles almost all writes, defeating the purpose of the sharded system.',
        textAr: 'عندما يكبر حجم قواعد البيانات والتعاملات ليتجاوز سعة الجهاز الفردي، يصبح التوسع الأفقي إلزامياً. اختيار مفتاح تجزئة مستقر وموزع هو المطلب الحرج، حيث إن اختيار مفتاح سيء (مثل ختم زمني يتزايد تلقائياً) سيؤدي إلى تراكم الحمل وتوجيهه لخادم واحد دون البقية.'
      },
      {
        id: 'shard-code',
        type: 'code',
        language: 'javascript',
        code: `// --- Simplified Consistent Hashing Shard Client Router ---
function getDatabaseShardNode(userId, shardNodes) {
  // Compute standard hash of shard key (userId)
  const hash = md5(userId);
  const position = parseInt(hash.substring(0, 8), 16);
  
  // Choose the node based on position bounds
  const nodeIndex = position % shardNodes.length;
  return shardNodes[nodeIndex];
}

// Route insert client request
const targetNode = getDatabaseShardNode("usr_94a821f0", [
  "db-node-eu-1", 
  "db-node-us-1", 
  "db-node-asia-1"
]);
console.log(\`Routing client payload to: \${targetNode}\`);`
      }
    ]
  }
];
