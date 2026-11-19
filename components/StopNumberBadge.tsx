interface StopNumberBadgeProps {
  number: string;
  size?: 'normal' | 'large';
}

const SIZE_CLASSES = {
  normal: 'min-w-12 px-2 py-1 text-sm',
  large: 'min-w-16 px-3 py-1.5 text-2xl',
} as const;

/** Insignia roja con el número rotulado en el poste. */
export default function StopNumberBadge({ number, size = 'normal' }: StopNumberBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-accent font-bold tabular-nums text-white ${SIZE_CLASSES[size]}`}
    >
      {number}
    </span>
  );
}
