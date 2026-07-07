// Where the footer links point, both opening in a new tab. COFFEE_URL is the
// donation/tip link — set it to a paypal.me/<handle> (or other tip page) to
// show the "Buy me a coffee" link; leave it '' and the link stays hidden.
const GITHUB_URL = 'https://github.com/alexfrljuckic/pokemonZaNuzlockApp';
const COFFEE_URL = 'https://paypal.me/projectAF';

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
const CoffeeCup = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M3 8h15v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

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

      {/* Quiet footer: project source + optional tip jar, kept small and muted
          so it reads as a sign-off, not a call to action. */}
      <footer className="title-footer">
        <a className="title-footer-link" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
          <GitHubMark />
          <span>Source on GitHub</span>
        </a>
        {COFFEE_URL && (
          <a
            className="title-footer-link title-footer-coffee"
            href={COFFEE_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            <CoffeeCup />
            <span>Buy me a coffee</span>
          </a>
        )}
      </footer>
    </div>
  );
}
