/** The nickname / level / shiny field cluster shared by every "a Pokémon
 * joins the run" form (route encounters, special claims). Controlled — the
 * parent owns the state; pass the wrapper class the parent's CSS expects. */
export function CatchFields({
  species,
  nickname,
  onNickname,
  level,
  onLevel,
  shiny,
  onShiny,
  className,
}: {
  species: string;
  nickname: string;
  onNickname: (v: string) => void;
  level: string;
  onLevel: (v: string) => void;
  shiny: boolean;
  onShiny: (v: boolean) => void;
  className: string;
}) {
  return (
    <div className={className}>
      <label>
        Nickname
        <input type="text" value={nickname} onChange={(e) => onNickname(e.target.value)} placeholder={species} />
      </label>
      <label>
        Level
        <input type="text" inputMode="numeric" value={level} onChange={(e) => onLevel(e.target.value)} />
      </label>
      <label className="shiny-toggle">
        <input type="checkbox" checked={shiny} onChange={(e) => onShiny(e.target.checked)} />
        Shiny ✦
      </label>
    </div>
  );
}
