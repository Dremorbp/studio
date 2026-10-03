import { createContext, useContext } from "react";

/**
 * Shared selection state between the gallery's array-level input (toolbar +
 * bulk delete) and each image item (checkbox overlay). They're rendered by
 * separate parts of Sanity's default array UI, so a context is the simplest
 * way to keep them in sync.
 */
export type GallerySelectionState = {
  selectMode: boolean;
  selectedKeys: Set<string>;
  toggleKey: (key: string) => void;
};

export const GallerySelectionContext = createContext<GallerySelectionState>({
  selectMode: false,
  selectedKeys: new Set(),
  toggleKey: () => {},
});

export function useGallerySelection() {
  return useContext(GallerySelectionContext);
}
