# Developer Notes Wiki

A Notion-style bilingual software development wiki with categories, pages, code snippets, personal notes, and progress tracking.

---

## Running the app

**Prerequisites:** Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Other commands:

- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — TypeScript type check

---

## Cloud sync setup

Sync your wiki across machines automatically. Choose **one** provider in the app (GitHub Gist or JSONBin.io). Only the active provider is used.

**Recommended:** GitHub Gist — generous free limits and no per-request quota concerns for typical personal wiki use.

Open **Sidebar → Sync Settings** to configure.

### GitHub Gist (recommended)

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens**.
2. Create a token (classic or fine-grained) with **gist** scope.
3. Either:
   - Create a **private** gist at [gist.github.com](https://gist.github.com) with a file named `devnotes-wiki.json` containing `{}`, or
   - Leave Gist ID empty and click **Create Remote** in the app after entering your token.
4. Copy the gist URL (e.g. `https://gist.github.com/yourname/abc123def456`).
5. In the app: **Sync Settings → GitHub Gist**
6. Paste your **Personal Access Token** and **Gist URL or ID**.
7. Click **Test Connection**, then **Save**.

### JSONBin.io

> **Warning:** JSONBin free accounts are limited to **10,000 total API requests** (lifetime, not monthly). Background sync checks on app open and tab focus can consume this quota quickly. Prefer GitHub Gist unless you have a paid JSONBin plan or very light usage.

1. Go to [jsonbin.io](https://jsonbin.io) and create a free account.
2. Open your dashboard and go to **API Keys**.
3. Copy your **Master Key**.
4. Either:
   - Create a new bin in the dashboard and copy the **Bin ID**, or
   - Leave Bin ID empty and click **Create Remote** in the app after entering your Master Key.
5. In the app: **Sync Settings → JSONBin.io**
6. Paste your **Master Key** and **Bin ID** (or bin URL).
7. Click **Test Connection**, then **Save**.

### How sync works

- Edits save to your browser immediately, then upload in the background (~1.5 second delay).
- On app open and when you return to the tab, the remote copy is checked.
- **First sync on a new device:** if remote data already exists, it is downloaded automatically (replacing local seed data). If remote is empty, local data is uploaded.
- **After first sync:** the newer copy wins when local and remote differ.
- Only one provider is active at a time. Switching providers uses that provider's separate remote store.
- API keys are stored in your browser's localStorage. This is intended for personal use on your own machines.

---

## Developer Content Guide: Categories & Topics Reference

This Wiki database application stores and renders topics dynamically inside the workspace. Use this guide to manage existing developer topics, append new study categories, or expand content blocks.

On first visit, seed data from `src/data/topics.ts` is copied into the browser. After that, your edits (and cloud sync, if enabled) are the source of truth.

---

## File Locations & Data Architecture

All static documentation pages, Wiki blueprints, and category catalogs live inside a single modular source file:

*   **Data File:** `src/data/topics.ts`
*   **Types File:** `src/types.ts`

These files work together to enforce strong TypeScript compile-time checks, ensuring all nested blocks conform to our content schema.

---

## ⚙️ Content Blueprints & Schema Definitions (`src/types.ts`)

Understanding the underlying interface structures helps avoid syntax errors during expansion:

1.  **`Category`**: Parent organization tab.
    ```typescript
    export interface Category {
      id: string;        // Unique slug (e.g., 'frontend', 'backend')
      nameEn: string;    // Human-readable English title
      nameAr: string;    // Human-readable Arabic title
    }
    ```
2.  **`TopicPage`**: Individual wiki documentation page.
    ```typescript
    export interface TopicPage {
      id: string;                    // Unique URL slug 
      categoryId: string;            // Links directly to Category.id
      titleEn: string;               // Display title in English
      titleAr: string;               // Display title in Arabic
      icon: string;                  // Emoji glyph character
      lastUpdated: string;           // Date stamp (YYYY-MM-DD format)
      personalClarificationEn: string; // Brief conceptual offset summaries
      personalClarificationAr: string;
      blocks: ContentBlock[];        // Flexible array of narrative blocks
    }
    ```
3.  **`ContentBlock`**: Flexible layout components mimicking Notion blocks. Represents text paragraphs, definitions, code blocks, callouts, or external resource links.

---

## ✍️ How to Add or Edit Categories and Topics

### 1. Adding a New Parent Category
Open `src/data/topics.ts` and locate the `INITIAL_CATEGORIES` list. Append a new category block:

```typescript
export const INITIAL_CATEGORIES: Category[] = [
  // Existing categories...
  {
    id: 'cloud-platforms',
    nameEn: 'Cloud & DevOps',
    nameAr: 'الحوسبة السحابية وDevOps'
  }
];
```

### 2. Adding a New Wiki Documentation Page
Locate the `INITIAL_PAGES` array inside `src/data/topics.ts` and append a new `TopicPage` object linking to your custom `categoryId`:

```typescript
export const INITIAL_PAGES: TopicPage[] = [
  // Existing topic pages...
  {
    id: 'kubernetes-basics',
    categoryId: 'cloud-platforms', // Must match Category ID created above
    titleEn: 'Kubernetes Container Orchestration',
    titleAr: ' Kubernetes مفاهيم إدارة الحاويات بـ',
    icon: '☸️',
    lastUpdated: '2026-05-31',
    personalClarificationEn: 'A high-level review of how pods, services, and control planes interact inside clusters.',
    personalClarificationAr: 'مراجعة عامة لعناصر ومكونات العنقود البرمجي البرمجي بكوبرنيتس وكيفية ترابط خلايا العمل.',
    blocks: [
      {
        id: 'k8s-h1',
        type: 'heading',
        titleEn: '1. Core Pod Schematics',
        titleAr: '١. تفاصيل تشغيل خلايا العمل (Pods)'
      },
      {
        id: 'k8s-p1',
        type: 'paragraph',
        textEn: 'A Pod is the smallest deployable unit created and managed in Kubernetes. It contains one or more tightly-coupled containers.',
        textAr: 'تعتبر خلية العمل Pod أصغر وحدة تشغيلية داخل بيئة عمل كوبرنيتس، وهي تضم بداخلها حاوية برمجية واحدة أو أكثر.'
      },
      {
        id: 'k8s-code',
        type: 'code',
        language: 'yaml',
        code: `apiVersion: v1
kind: Pod
metadata:
  name: web-server-pod
spec:
  containers:
  - name: web-app
    image: nginx:alpine`
      }
    ]
  }
];
```

---

## 🚀 Key Content Block Components

Mix-and-match our structured `blocks` components within your document body to build readable and engaging material:

*   **`heading`**: Standard sub-headings to divide complex topics. (Requires `titleEn` and `titleAr`).
*   **`paragraph`**: General explanatory narrative copy. (Requires `textEn` and `textAr`).
*   **`definition`**: Styled callout box with key concepts highlighted. (Requires `titleEn`, `titleAr`, `textEn`, and `textAr`).
*   **`code`**: Elegant syntax-highlighted editor box. (Requires `language`, and `code` raw string content).
*   **`callout`**: Highlighted light green tips or warnings. (Requires `textEn` and `textAr`).
*   **`links`**: External reference links nested inside a documentation tray. (Requires list of `TopicLink` elements).
