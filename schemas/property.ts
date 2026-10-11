import { defineField, defineType } from "sanity";
import { GalleryArrayInput } from "../components/GalleryArrayInput";
import { GalleryImageItem } from "../components/GalleryImageItem";

/**
 * A property. Publishing it syncs the operational fields to Postgres through
 * the website webhook (/api/webhooks/sanity) and makes it live; unpublishing
 * hides it. Availability and bookings live in Postgres only.
 */
export const property = defineType({
  name: "property",
  title: "Imóvel",
  type: "document",
  fieldsets: [
    {
      name: "ops",
      title: "Dados operacionais (Publicar torna o imóvel visível no site)",
      options: { collapsible: true, collapsed: false },
    },
  ],
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
      name: "city",
      title: "Cidade",
      type: "string",
      options: { list: ["Lisboa", "Porto"], layout: "radio" },
      validation: (r) => r.required(),
      fieldset: "ops",
    }),
    defineField({ name: "neighborhood", title: "Bairro", type: "string", fieldset: "ops" }),
    defineField({ name: "bedrooms", title: "Quartos", type: "number", validation: (r) => r.integer().min(0), fieldset: "ops" }),
    defineField({ name: "bathrooms", title: "Casas de banho", type: "number", validation: (r) => r.integer().min(0), fieldset: "ops" }),
    defineField({ name: "maxGuests", title: "Hóspedes (máx.)", type: "number", validation: (r) => r.integer().min(1), fieldset: "ops" }),
    defineField({
      name: "monthlyRate",
      title: "Renda mensal base (€)",
      type: "number",
      validation: (r) => r.required().min(1),
      fieldset: "ops",
    }),
    defineField({ name: "minMonths", title: "Mínimo de meses", type: "number", initialValue: 1, validation: (r) => r.integer().min(1), fieldset: "ops" }),
    defineField({ name: "maxMonths", title: "Máximo de meses", type: "number", initialValue: 12, validation: (r) => r.integer().min(1), fieldset: "ops" }),
    defineField({ name: "lat", title: "Latitude", type: "number", fieldset: "ops" }),
    defineField({ name: "lng", title: "Longitude", type: "number", fieldset: "ops" }),
    defineField({ name: "airbnbIcalUrl", title: "Airbnb iCal URL", type: "url", fieldset: "ops" }),
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
