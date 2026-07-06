import { useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SYNC_ENABLED } from '../lib/env';
import { searchProfiles, type ProfileSearchResult } from '../lib/profiles';

/** Find other trainers by handle/display-name prefix and open their public
 * profile. Renders nothing when sync is off or signed out — discovery is a
 * sync-tier feature. */
export function TrainerSearch({ session }: { session: Session | null }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  // Guards against out-of-order responses: a slow earlier request must not
  // overwrite the results of a later keystroke.
  const latest = useRef(0);

  if (!SYNC_ENABLED || !session) return null;

  async function run(next: string) {
    setQuery(next);
    const id = ++latest.current;
    if (next.trim().length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const rows = await searchProfiles(next);
    if (latest.current !== id) return; // superseded by a newer keystroke
    setResults(rows);
    setSearching(false);
  }

  const trimmed = query.trim();

  return (
    <div className="trainer-search">
      <h3 className="route-offmap-title">Find trainers</h3>
      <input
        type="search"
        className="trainer-search-input"
        value={query}
        onChange={(e) => run(e.target.value)}
        placeholder="search by @handle or name"
        aria-label="Search trainers by handle or display name"
      />
      {searching && <p className="muted">Searching…</p>}
      {!searching && results && results.length === 0 && trimmed.length >= 2 && (
        <p className="muted">No trainers match “{trimmed}”.</p>
      )}
      {results && results.length > 0 && (
        <ul className="trainer-search-results">
          {results.map((r) => (
            <li key={r.handle}>
              <a href={`#u/${r.handle}`}>
                {r.displayName && <span>{r.displayName} </span>}
                <span className="muted">@{r.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
