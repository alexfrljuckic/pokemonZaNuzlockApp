export function TitleScreen({
  hasRuns,
  onNewGame,
  onContinue,
}: {
  hasRuns: boolean;
  onNewGame: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="title-screen">
      <div className="pokeball" aria-hidden="true" />
      <p className="title-logo">Nuzlocke Tracker</p>
      <p className="title-tagline">One chance. Every route. No revives.</p>
      {hasRuns && <button onClick={onContinue}>Continue</button>}
      <button className={hasRuns ? 'secondary' : ''} onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
