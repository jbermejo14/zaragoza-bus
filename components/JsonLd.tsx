import React from 'react';

/** Escapa `<` para que un texto con "</script>" no cierre la etiqueta. */
function jsonLdSerialize(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Datos estructurados (JSON-LD) en una etiqueta script. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSerialize(data) }} />;
}
