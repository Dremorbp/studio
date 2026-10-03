import { Box, Card, Checkbox } from "@sanity/ui";
import type { ObjectItemProps } from "sanity";
import { useGallerySelection } from "./gallerySelection";

/**
 * Custom rendering for each image inside the `gallery` array. Adds a
 * checkbox overlay when selection mode is active (toggled from the array
 * toolbar in GalleryArrayInput). Falls back to Sanity's default item UI
 * otherwise.
 */
export function GalleryImageItem(props: ObjectItemProps) {
  const { selectMode, selectedKeys, toggleKey } = useGallerySelection();
  const itemKey = (props.value as { _key?: string })?._key;
  const checked = Boolean(itemKey && selectedKeys.has(itemKey));

  if (!selectMode || !itemKey) {
    return props.renderDefault(props);
  }

  return (
    <Box style={{ position: "relative" }}>
      <Box style={{ opacity: 0.85, pointerEvents: "none" }}>
        {props.renderDefault(props)}
      </Box>
      {/* Full-cover click target so tapping the thumbnail toggles selection
          instead of opening the image editor while in selection mode. */}
      <div
        role="button"
        aria-pressed={checked}
        onClick={() => toggleKey(itemKey)}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "pointer",
          zIndex: 5,
        }}
      />
      <Card
        radius={6}
        shadow={2}
        padding={1}
        tone={checked ? "primary" : "default"}
        style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}
      >
        <Checkbox
          checked={checked}
          readOnly
          style={{ pointerEvents: "none" }}
        />
      </Card>
    </Box>
  );
}
