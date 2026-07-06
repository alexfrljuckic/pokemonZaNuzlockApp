import type { Session } from '@supabase/supabase-js';
import { FollowFeed } from '../components/FollowFeed';
import { TrainerSearch } from '../components/TrainerSearch';
import { SYNC_ENABLED } from '../lib/env';

/** The "Find Trainers" screen reached from the title button. Keeps social
 * discovery off the landing page (which stays a short, scroll-free hero) while
 * giving the search + feed room to breathe. Signed-out / sync-off users get a
 * prompt instead of the empty search that TrainerSearch/FollowFeed render. */
export function TrainersScreen({ session }: { session: Session | null }) {
  const available = SYNC_ENABLED && session;
  return (
    <section className="trainers-screen">
      <h2>Find trainers</h2>
      {available ? (
        <>
          <TrainerSearch session={session} />
          <FollowFeed session={session} />
        </>
      ) : (
        <p className="muted">
          Sign in {SYNC_ENABLED ? '' : 'and enable sync '}to find other trainers and follow their
          runs.
        </p>
      )}
    </section>
  );
}
