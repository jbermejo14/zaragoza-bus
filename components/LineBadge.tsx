interface LineBadgeProps {
  line: string;
  /** "large" para la lista de llegadas; "small" para las mini-insignias de los resultados. */
  size?: 'small' | 'large';
}

const SIZE_CLASSES = {
  small: 'min-w-7 px-1.5 py-0.5 text-xs',
  large: 'min-w-12 px-2 py-1 text-lg',
} as const;

/** Insignia roja con el número o código de una línea. */
export default function LineBadge({ line, size = 'small' }: LineBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md bg-accent font-bold text-white ${SIZE_CLASSES[size]}`}
    >
      {line}
    </span>
  );
}
