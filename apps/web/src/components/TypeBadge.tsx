/** Small colored type pill (Pokémon type or move type). Styled by the
 * `type-<name>` classes in index.css. */
export function TypeBadge({ type, className }: { type: string; className?: string }) {
  return <span className={`type-badge type-${type} ${className ?? ''}`}>{type}</span>;
}

export function TypeBadges({ types }: { types: string[] }) {
  if (types.length === 0) return null;
  return (
    <span className="type-badges">
      {types.map((t) => (
        <TypeBadge key={t} type={t} />
      ))}
    </span>
  );
}

/** A small colored square (move type), for use inside a move chip. */
export function TypeDot({ type }: { type: string | null }) {
  if (!type) return null;
  return <span className={`type-dot type-${type}`} title={type} />;
}
