import { X } from 'lucide-react';
import { compareChipLines } from '../lib/stop-search';

interface LineFilterProps {
  lines: readonly string[];
  activeLine: string | null;
  onChange: (line: string | null) => void;
}

/** Fila de chips de línea desplazable en horizontal. Pulsar activa; pulsar el activo (con su «✕») lo quita. */
export default function LineFilter({ lines, activeLine, onChange }: LineFilterProps) {
  if (lines.length === 0) {
    return null;
  }
  return (
    <div role="group" aria-label="Filtrar por línea" className="scrollbar-hidden flex gap-2 overflow-x-auto px-4 pb-3">
      {[...lines].sort(compareChipLines).map((line) => {
        const isActive = line === activeLine;
        return (
          <button
            key={line}
            type="button"
            aria-pressed={isActive}
            aria-label={isActive ? `Quitar la línea ${line}` : undefined}
            onClick={() => onChange(isActive ? null : line)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${
              isActive
                ? 'border-accent bg-accent text-white hover:bg-accent-hover'
                : 'border-line bg-card text-ink hover:border-accent hover:text-accent-text'
            }`}
          >
            {line}
            {isActive ? <X size={14} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}
