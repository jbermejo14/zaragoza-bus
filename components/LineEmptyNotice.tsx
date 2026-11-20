interface LineEmptyNoticeProps {
  line: string;
  /** Quita el filtro de línea para ver todas las llegadas del poste. */
  onClearFilter: () => void;
}

/** Aviso de la marquesina cuando el filtro de línea deja el poste sin llegadas. */
export default function LineEmptyNotice({ line, onClearFilter }: LineEmptyNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-card px-4 py-6 text-center">
      <p className="text-muted">La línea {line} no tiene llegadas previstas en este poste</p>
      <button
        type="button"
        onClick={onClearFilter}
        className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Ver todas las líneas
      </button>
    </div>
  );
}
