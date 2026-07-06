export function TitleScreen({
  hasRuns,
  onNewGame,
  onContinue,
  onStats,
  onFindTrainers,
}: {
  hasRuns: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onStats: () => void;
  /** Only provided when social discovery is available (signed in + sync on).
   * Opens the Find Trainers screen — kept off the landing page so it stays a
   * short, scroll-free hero. */
  onFindTrainers?: () => void;
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
      {hasRuns && (
        <button className="secondary" onClick={onStats}>
          Your Stats
        </button>
      )}
      {onFindTrainers && (
        <button className="secondary" onClick={onFindTrainers}>
          Find Trainers
        </button>
      )}

      {/* the audit's onboarding gap: nothing in the app stated the two core
          rules. Native details/summary = collapsible with no JS. */}
      <details className="nuzlocke-explainer">
        <summary>New to nuzlockes?</summary>
        <p>
          A nuzlocke is a self-imposed challenge run with two core rules:
        </p>
        <ul>
          <li>
            <strong>One chance per route.</strong> You may only catch the <em>first</em> wild Pokémon
            you meet in each area. Miss it, faint it, or flee — that area is done.
          </li>
          <li>
            <strong>Faints are forever.</strong> A Pokémon that faints is considered dead. No revives —
            it goes to the graveyard and never battles again.
          </li>
        </ul>
        <p>
          Everything else — level caps, no duplicate species, item bans — is optional. This tracker
          enforces the rules it can check and keeps you honest about the rest.
        </p>
      </details>
    </div>
  );
}
