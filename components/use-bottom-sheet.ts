'use client';

import { useCallback, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import {
  SHEET_TAP_THRESHOLD_PX,
  clampSheetHeight,
  higherSheetAnchor,
  nearestSheetAnchor,
  nextSheetAnchor,
  sheetAnchorHeight,
  type SheetAnchor,
} from '../lib/bottom-sheet-math';

interface DragStart {
  pointerY: number;
  heightPx: number;
}

const INITIAL_ANCHOR: SheetAnchor = 'half';
const PERCENT = 100;

function anchorHeightCss(anchor: SheetAnchor): string {
  return `${sheetAnchorHeight(anchor, PERCENT)}dvh`;
}

/**
 * Estado de la hoja inferior móvil: tres alturas ancladas, arrastre con pointer events sobre el
 * asa y toque para subir a la siguiente. Devuelve el estilo (variable CSS --sheet-height), los
 * manejadores del asa y `revealAtLeast` para abrir la hoja sin cerrarla si ya está más arriba.
 */
export function useBottomSheet() {
  const sheetRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const [anchor, setAnchor] = useState<SheetAnchor>(INITIAL_ANCHOR);
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);

  const revealAtLeast = useCallback((minimum: SheetAnchor) => {
    setAnchor((current) => higherSheetAnchor(current, minimum));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const sheet = sheetRef.current;
    if (sheet === null) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { pointerY: event.clientY, heightPx: sheet.offsetHeight };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = dragStartRef.current;
    if (start === null) {
      return;
    }
    const moved = start.heightPx + (start.pointerY - event.clientY);
    setDragHeightPx(clampSheetHeight(moved, window.innerHeight));
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (start === null) {
      return;
    }
    const wasTap = Math.abs(start.pointerY - event.clientY) < SHEET_TAP_THRESHOLD_PX;
    if (wasTap) {
      setAnchor(nextSheetAnchor(anchor));
    } else {
      const releasedHeight = start.heightPx + (start.pointerY - event.clientY);
      setAnchor(nearestSheetAnchor(clampSheetHeight(releasedHeight, window.innerHeight), window.innerHeight));
    }
    setDragHeightPx(null);
  };

  // Un gesto cancelado por el sistema no es una decisión del usuario: solo se abandona el arrastre.
  const onPointerCancel = () => {
    dragStartRef.current = null;
    setDragHeightPx(null);
  };

  // Con teclado el clic llega sin puntero (detail 0): permite subir la hoja sin ratón ni dedo.
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (event.detail === 0) {
      setAnchor(nextSheetAnchor(anchor));
    }
  };

  const style = {
    '--sheet-height': dragHeightPx === null ? anchorHeightCss(anchor) : `${dragHeightPx}px`,
  } as CSSProperties;

  return {
    sheetRef,
    style,
    isDragging: dragHeightPx !== null,
    revealAtLeast,
    handleProps: { onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
