import { createContext, useContext } from 'react';

/** Set by the owner run view: lets a quest row in Routes jump to that quest
 * in the Quests tab. Absent (spectator, tests) → rows are plain text. */
export const OpenQuestContext = createContext<((questId: string) => void) | null>(null);
export const useOpenQuest = () => useContext(OpenQuestContext);
