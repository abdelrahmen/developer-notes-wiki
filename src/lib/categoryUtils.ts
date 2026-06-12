/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category } from '../types';

/** Returns the given category id and all descendant category ids. */
export function collectCategoryDescendantIds(
  rootId: string,
  allCategories: Category[]
): Set<string> {
  const ids = new Set<string>([rootId]);

  const visit = (parentId: string) => {
    for (const category of allCategories) {
      if (category.parentId === parentId && !ids.has(category.id)) {
        ids.add(category.id);
        visit(category.id);
      }
    }
  };

  visit(rootId);
  return ids;
}
