/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { ContentBlock } from '../types';

export interface EditDraftSnapshot {
  blocks: ContentBlock[];
  titleEn: string;
  titleAr: string;
  icon: string;
  categoryId: string;
}

const UNDO_DEBOUNCE_MS = 400;

function cloneSnapshot(snapshot: EditDraftSnapshot): EditDraftSnapshot {
  return {
    blocks: structuredClone(snapshot.blocks),
    titleEn: snapshot.titleEn,
    titleAr: snapshot.titleAr,
    icon: snapshot.icon,
    categoryId: snapshot.categoryId,
  };
}

export function useEditUndo(initial: EditDraftSnapshot) {
  const [snapshot, setSnapshot] = useState<EditDraftSnapshot>(() => cloneSnapshot(initial));
  const presentRef = useRef(snapshot);
  const pastRef = useRef<EditDraftSnapshot[]>([]);
  const skipRecordRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBeforeRef = useRef<EditDraftSnapshot | null>(null);

  const reset = useCallback((next: EditDraftSnapshot) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingBeforeRef.current = null;
    pastRef.current = [];
    const cloned = cloneSnapshot(next);
    presentRef.current = cloned;
    setSnapshot(cloned);
  }, []);

  const flushPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingBeforeRef.current) {
      pastRef.current.push(cloneSnapshot(pendingBeforeRef.current));
      pendingBeforeRef.current = null;
    }
  }, []);

  const scheduleHistoryPush = useCallback(() => {
    if (skipRecordRef.current) return;

    if (!pendingBeforeRef.current) {
      pendingBeforeRef.current = cloneSnapshot(presentRef.current);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (pendingBeforeRef.current) {
        pastRef.current.push(cloneSnapshot(pendingBeforeRef.current));
        pendingBeforeRef.current = null;
      }
      debounceTimerRef.current = null;
    }, UNDO_DEBOUNCE_MS);
  }, []);

  const update = useCallback(
    (next: EditDraftSnapshot | ((prev: EditDraftSnapshot) => EditDraftSnapshot)) => {
      if (skipRecordRef.current) {
        const resolved =
          typeof next === 'function' ? next(presentRef.current) : cloneSnapshot(next);
        presentRef.current = resolved;
        setSnapshot(resolved);
        return;
      }

      scheduleHistoryPush();

      const resolved =
        typeof next === 'function' ? next(presentRef.current) : cloneSnapshot(next);
      presentRef.current = resolved;
      setSnapshot(resolved);
    },
    [scheduleHistoryPush]
  );

  const undo = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (pendingBeforeRef.current) {
      const previous = cloneSnapshot(pendingBeforeRef.current);
      pendingBeforeRef.current = null;
      skipRecordRef.current = true;
      presentRef.current = previous;
      setSnapshot(previous);
      skipRecordRef.current = false;
      return true;
    }

    const previous = pastRef.current.pop();
    if (!previous) return false;

    skipRecordRef.current = true;
    presentRef.current = cloneSnapshot(previous);
    setSnapshot(presentRef.current);
    skipRecordRef.current = false;
    return true;
  }, []);

  const canUndo = useCallback(
    () => pastRef.current.length > 0 || pendingBeforeRef.current !== null,
    []
  );

  return {
    snapshot,
    update,
    undo,
    canUndo,
    reset,
    flushPending,
  };
}
