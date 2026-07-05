import { describe, expect, it } from 'vitest';
import { trainerKeyFromClass, trainerKeyFromMilestone } from './sprites';

// Locks the Showdown sprite-key derivations: class names squash to a bare
// lowercase key (diacritics stripped), milestone ids keep their alias table.

describe('trainerKeyFromClass', () => {
  it('squashes multi-word classes', () => {
    expect(trainerKeyFromClass('Ace Trainer')).toBe('acetrainer');
    expect(trainerKeyFromClass('Coach Trainer')).toBe('coachtrainer');
  });

  it('strips diacritics (Pokéfan → pokefan)', () => {
    expect(trainerKeyFromClass('Pokéfan')).toBe('pokefan');
    expect(trainerKeyFromClass('Pokémon Ranger')).toBe('pokemonranger');
  });

  it('passes simple classes through lowercased', () => {
    expect(trainerKeyFromClass('Youngster')).toBe('youngster');
    expect(trainerKeyFromClass('Lass')).toBe('lass');
  });
});

describe('trainerKeyFromMilestone', () => {
  it('takes the id tail and applies aliases', () => {
    expect(trainerKeyFromMilestone('gym-1-roark')).toBe('roark');
    expect(trainerKeyFromMilestone('gym-4-wake')).toBe('crasherwake');
  });
});
