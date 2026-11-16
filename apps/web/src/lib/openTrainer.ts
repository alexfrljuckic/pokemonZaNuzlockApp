import { createContext, useContext } from 'react';

/** Stable key for one area trainer — the same `${areaId}#${index}` shape the
 * engine uses for trainersBattled. */
export const trainerKey = (areaId: string, index: number) => `${areaId}#${index}`;

/** Set by the owner run view: lets a trainer row in Routes jump to that
 * trainer in the Trainers tab. Absent (spectator, tests) → rows just expand. */
export const OpenTrainerContext = createContext<((key: string) => void) | null>(null);

export const useOpenTrainer = () => useContext(OpenTrainerContext);
