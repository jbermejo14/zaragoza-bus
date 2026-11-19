import { Bus, List, Map as MapIcon } from 'lucide-react';
import type { DataSource } from '../lib/types';
import SourceBadge from './SourceBadge';

interface AppHeaderProps {
  source: DataSource | null;
  fallbackReason?: string;
  mapVisible: boolean;
  onToggleMap: () => void;
}

/** Cabecera: logotipo, botón Mapa/Lista (solo móvil) e indicador En vivo / Demo. */
export default function AppHeader({ source, fallbackReason, mapVisible, onToggleMap }: AppHeaderProps) {
  const ToggleIcon = mapVisible ? List : MapIcon;
  return (
    <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-accent text-white" aria-hidden="true">
          <Bus size={20} />
        </span>
        <span className="text-lg font-bold sm:text-xl tracking-tight">ZaraBus</span>
      </div>
      <div className="flex items-center gap-1.5">
        <SourceBadge source={source} fallbackReason={fallbackReason} />
        <button
          type="button"
          onClick={onToggleMap}
          aria-label={mapVisible ? 'Mostrar la lista' : 'Mostrar el mapa'}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent lg:hidden"
        >
          <ToggleIcon size={16} aria-hidden="true" />
          {mapVisible ? 'Lista' : 'Mapa'}
        </button>
      </div>
    </header>
  );
}
