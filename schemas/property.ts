import { defineField, defineType } from "sanity";
import { GalleryArrayInput } from "../components/GalleryArrayInput";
import { GalleryImageItem } from "../components/GalleryImageItem";

/**
 * Editorial content for a property. Operational data (pricing, availability,
 * bookings) lives in Postgres; the two are linked by `slug`, which must match
 * the `slug` column in the properties table exactly.
 */
export const property = defineType({
  name: "property",
  title: "Imóvel",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título (interno)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (tem de coincidir com a base de dados)",
      type: "slug",
      options: { source: "title", maxLength: 200 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "gallery",
      title: "Galeria",
      description: "A primeira imagem é a imagem principal do anúncio.",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Texto alternativo (acessibilidade)",
              type: "string",
              validation: (r) => r.warning("Recomendado para acessibilidade"),
            }),
          ],
          components: { item: GalleryImageItem },
        },
      ],
      components: { input: GalleryArrayInput },
      validation: (r) => r.min(1),
    }),
    defineField({
      name: "descriptionPt",
      title: "Descrição (Português)",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "descriptionEn",
      title: "Descrição (Inglês)",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "highlights",
      title: "Destaques (ex.: Varanda, Vista rio, Elevador)",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
  preview: {
    select: { title: "title", media: "gallery.0" },
  },
});
