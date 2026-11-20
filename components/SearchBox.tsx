import { Search, X } from 'lucide-react';
import type { FormEvent } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Se llama al pulsar Enter, con el texto escrito. */
  onSubmit: (value: string) => void;
}

/** Campo de búsqueda por número de poste, calle o línea. */
export default function SearchBox({ value, onChange, onSubmit }: SearchBoxProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} role="search" className="px-4 pb-2">
      <div className="relative">
        <Search
          size={20}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nº de poste, calle o línea"
          aria-label="Buscar parada por número de poste, calle o línea"
          className="w-full rounded-xl border border-line bg-card py-3 pr-11 pl-10 text-base placeholder:text-muted focus-visible:border-accent"
        />
        {value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Borrar búsqueda"
            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-accent-text"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
