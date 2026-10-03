import { useCallback, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, Text, useToast } from "@sanity/ui";
import { TrashIcon, SelectIcon, UploadIcon } from "@sanity/icons";
import { PatchEvent, set, unset, useClient } from "sanity";
import type { ArrayOfObjectsInputProps } from "sanity";
import { GallerySelectionContext } from "./gallerySelection";

const API_VERSION = "2024-10-01";
// Cap parallel uploads so a big batch of large photos doesn't saturate the
// browser's connection pool and stall — files upload in waves of this size.
const UPLOAD_CONCURRENCY = 3;

/**
 * Runs `worker` over `items` with at most `limit` in flight at once,
 * preserving each result's position (and never rejecting as a whole —
 * one failed file shouldn't sink the rest).
 */
async function uploadWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        const value = await worker(items[index]);
        results[index] = { status: "fulfilled", value };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/**
 * Custom input for the `gallery` array field. Adds a "select multiple"
 * mode with a toolbar to bulk-delete chosen images, on top of Sanity's
 * default array/upload behaviour (drag-drop, multi-file upload, reorder).
 */
export function GalleryArrayInput(props: ArrayOfObjectsInputProps) {
  const { renderDefault, onChange, value } = props;
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const client = useClient({ apiVersion: API_VERSION });
  const toast = useToast();

  const itemCount = value?.length ?? 0;

  const handleFilesSelected = useCallback(
    async (fileList: FileList | null) => {
      const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));
      if (files.length === 0) return;

      setIsUploading(true);
      try {
        const results = await uploadWithConcurrency(files, UPLOAD_CONCURRENCY, (file) =>
          client.assets.upload("image", file, { filename: file.name }),
        );

        const items = results.flatMap((result) =>
          result.status === "fulfilled"
            ? [
                {
                  _key: crypto.randomUUID(),
                  _type: "image",
                  asset: { _type: "reference" as const, _ref: result.value._id },
                  alt: "",
                },
              ]
            : [],
        );

        const failedCount = results.length - items.length;
        if (failedCount > 0) {
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              // eslint-disable-next-line no-console
              console.error("Falha ao carregar imagem:", files[index]?.name, result.reason);
            }
          });
        }

        if (items.length > 0) {
          // Append via a full `set` of the array rather than an `insert`
          // relative patch — insert-after-last-item fails outright when the
          // gallery is currently empty (no "last item" to insert after),
          // which silently dropped every upload even though the assets had
          // already made it to Sanity's asset store.
          onChange(PatchEvent.from([set([...(value ?? []), ...items])]));
          toast.push({
            status: "success",
            title:
              items.length === 1
                ? "1 imagem carregada"
                : `${items.length} imagens carregadas`,
          });
        }
        if (failedCount > 0) {
          const firstError = results.find((r) => r.status === "rejected") as
            | PromiseRejectedResult
            | undefined;
          const detail =
            firstError?.reason instanceof Error ? firstError.reason.message : undefined;
          toast.push({
            status: "error",
            title:
              failedCount === 1
                ? "1 imagem falhou o carregamento"
                : `${failedCount} imagens falharam o carregamento`,
            description: detail,
          });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [client, onChange, toast, value],
  );

  const toggleKey = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedKeys(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const allKeys = (value ?? [])
      .map((item) => (item as { _key?: string })._key)
      .filter((k): k is string => Boolean(k));
    setSelectedKeys(new Set(allKeys));
  }, [value]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedKeys.size === 0) return;
    const count = selectedKeys.size;
    const confirmed = window.confirm(
      count === 1
        ? "Eliminar a imagem selecionada? Esta ação não pode ser desfeita."
        : `Eliminar as ${count} imagens selecionadas? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const patches = Array.from(selectedKeys).map((key) => unset([{ _key: key }]));
    onChange(PatchEvent.from(patches));
    exitSelectMode();
  }, [selectedKeys, onChange, exitSelectMode]);

  const contextValue = useMemo(
    () => ({ selectMode, selectedKeys, toggleKey }),
    [selectMode, selectedKeys, toggleKey],
  );

  return (
    <GallerySelectionContext.Provider value={contextValue}>
      <Box>
        <Flex justify="flex-end" align="center" gap={2} paddingBottom={2}>
          {selectMode ? (
            <>
              <Text size={1} muted>
                {selectedKeys.size} de {itemCount} selecionada(s)
              </Text>
              <Button text="Selecionar todas" mode="bleed" fontSize={1} onClick={selectAll} />
              <Button
                icon={TrashIcon}
                text="Eliminar selecionadas"
                tone="critical"
                mode="ghost"
                fontSize={1}
                disabled={selectedKeys.size === 0}
                onClick={handleDeleteSelected}
              />
              <Button text="Cancelar" mode="bleed" fontSize={1} onClick={exitSelectMode} />
            </>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(event) => {
                  handleFilesSelected(event.target.files);
                  event.target.value = "";
                }}
              />
              <Button
                icon={UploadIcon}
                text={isUploading ? "A carregar..." : "Carregar do computador"}
                mode="bleed"
                fontSize={1}
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              />
              {itemCount > 0 && (
                <Button
                  icon={SelectIcon}
                  text="Selecionar imagens"
                  mode="bleed"
                  fontSize={1}
                  onClick={() => setSelectMode(true)}
                />
              )}
            </>
          )}
        </Flex>
        {renderDefault(props)}
      </Box>
    </GallerySelectionContext.Provider>
  );
}
