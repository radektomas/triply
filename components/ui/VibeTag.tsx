interface VibeTagProps {
  label: string;
}

export function VibeTag({ label }: VibeTagProps) {
  return (
    <span className="inline-block bg-accent-light text-accent text-xs font-semibold px-3 py-1 rounded-full">
      {label}
    </span>
  );
}
