/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useLayoutEffect, useRef, useCallback } from 'react';

function fitTextareaHeight(element: HTMLTextAreaElement, minHeightPx = 48): void {
  element.style.height = '0px';
  element.style.height = `${Math.max(element.scrollHeight, minHeightPx)}px`;
}

interface AutoResizeTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'rows'
> {
  value: string;
  minHeightPx?: number;
  /** Re-run height fit when visibility toggles (e.g. EN/AR language switch). */
  visible?: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}

export default function AutoResizeTextarea({
  value,
  minHeightPx = 48,
  visible = true,
  textareaRef,
  onChange,
  className = '',
  ...rest
}: AutoResizeTextareaProps) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = useCallback(
    (element: HTMLTextAreaElement | null) => {
      innerRef.current = element;
      if (typeof textareaRef === 'function') {
        textareaRef(element);
      } else if (textareaRef && 'current' in textareaRef) {
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
      }
      if (element && visible) {
        fitTextareaHeight(element, minHeightPx);
      }
    },
    [textareaRef, visible, minHeightPx]
  );

  useLayoutEffect(() => {
    if (innerRef.current && visible) {
      fitTextareaHeight(innerRef.current, minHeightPx);
    }
  }, [value, visible, minHeightPx]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    fitTextareaHeight(event.target, minHeightPx);
    onChange?.(event);
  };

  return (
    <textarea
      {...rest}
      ref={setRef}
      value={value}
      onChange={handleChange}
      rows={1}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}
