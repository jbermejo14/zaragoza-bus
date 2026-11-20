import { Bus } from 'lucide-react';
import type { DataSource } from '../lib/types';
import { SECTION_NAME } from '../lib/site';
import SourceBadge from './SourceBadge';
import ThemeToggle from './ThemeToggle';

interface PanelHeaderProps {
  source: DataSource | null;
  fallbackReason?: string;
}

/** Cabecera del panel: icono de bus, nombre de la sección, indicador En vivo / Demo y botón de tema. */
export default function PanelHeader({ source, fallbackReason }: PanelHeaderProps) {
  return (
    <header className="flex items-start gap-3 px-4 pb-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white"
        aria-hidden="true"
      >
        <Bus size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg leading-tight font-bold">{SECTION_NAME}</h1>
        <p className="text-xs text-muted">Tiempos de paso en tiempo real</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <SourceBadge source={source} fallbackReason={fallbackReason} />
        <ThemeToggle />
      </div>
    </header>
  );
}
