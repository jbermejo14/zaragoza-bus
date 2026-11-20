'use client';

import { useState, type ReactNode, type RefObject } from 'react';
import { useBottomSheet } from './use-bottom-sheet';

interface AppPanelProps {
  /** Parte fija del panel (cabecera, buscador, chips): no se desplaza con el contenido. */
  top: ReactNode;
  /** Contenido con scroll propio. */
  children: ReactNode;
  /**
   * Clave que describe qué muestra el panel (poste abierto, búsqueda...). Cuando cambia y no es null,
   * la hoja móvil sube al menos a media altura para que el resultado no quede escondido.
   */
  revealKey: string | null;
  /** Contador de peticiones de recoger la hoja móvil: cada incremento la baja a su altura recogida. */
  collapseRequest: number;
  /** Referencia al elemento del panel; el mapa mide con ella el hueco que tapa. */
  panelRef: RefObject<HTMLElement | null>;
}

/**
 * Contenedor responsive: hoja inferior deslizable de tres alturas en móvil y tarjeta flotante a la
 * izquierda en escritorio (lg y más).
 */
export default function AppPanel({ top, children, revealKey, collapseRequest, panelRef }: AppPanelProps) {
  const { sheetRef, style, isDragging, revealAtLeast, collapse, handleProps } = useBottomSheet();
  const heightTransition = isDragging ? '' : 'transition-[height] duration-300 motion-reduce:transition-none';

  // Se decide durante el render (no en un efecto) para que el mapa, que encuadra en sus efectos,
  // ya vea la altura final de la hoja.
  const [lastRevealKey, setLastRevealKey] = useState(revealKey);
  if (revealKey !== lastRevealKey) {
    setLastRevealKey(revealKey);
    if (revealKey !== null) {
      revealAtLeast('half');
    }
  }

  // Va después del bloque anterior: si coinciden, manda recoger la hoja.
  const [lastCollapseRequest, setLastCollapseRequest] = useState(collapseRequest);
  if (collapseRequest !== lastCollapseRequest) {
    setLastCollapseRequest(collapseRequest);
    collapse();
  }

  return (
    <aside
      ref={(element) => {
        sheetRef.current = element;
        panelRef.current = element;
      }}
      style={style}
      aria-label="Panel de paradas y tiempos de paso"
      className={`absolute inset-x-0 bottom-0 z-20 flex h-[var(--sheet-height)] flex-col rounded-t-2xl border border-line bg-surface/95 text-ink shadow-2xl backdrop-blur lg:inset-x-auto lg:bottom-4 lg:left-4 lg:top-4 lg:h-auto lg:w-[420px] lg:rounded-2xl ${heightTransition}`}
    >
      <button
        type="button"
        aria-label="Subir o bajar el panel"
        className="flex h-6 w-full shrink-0 touch-none items-center justify-center lg:hidden"
        {...handleProps}
      >
        <span className="h-1.5 w-12 rounded-full bg-muted" aria-hidden="true" />
      </button>
      <div className="shrink-0">{top}</div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pt-2 pb-6">{children}</div>
    </aside>
  );
}
