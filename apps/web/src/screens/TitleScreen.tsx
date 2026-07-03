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
      {hasRuns && <button onClick={onContinue}>Continue</button>}
      <button className={hasRuns ? 'secondary' : ''} onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
