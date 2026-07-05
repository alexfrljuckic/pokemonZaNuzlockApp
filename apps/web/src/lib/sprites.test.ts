import { describe, expect, it } from 'vitest';
import { spriteFallbackUrl, spriteUrl, trainerKeyFromClass, trainerKeyFromMilestone } from './sprites';

// Locks the Showdown sprite-key derivations: class names squash to a bare
// lowercase key (diacritics stripped), milestone ids keep their alias table,
// and PokeAPI slugs without a Showdown sprite remap through the alias table.

describe('spriteUrl species alias', () => {
  it('remaps darmanitan-galar-standard to the Showdown key', () => {
    expect(spriteUrl('darmanitan-galar-standard')).toContain('/darmanitan-galar.png');
    expect(spriteFallbackUrl('darmanitan-galar-standard')).toContain('/darmanitangalar.png');
  });

  it('remaps PokeAPI default-variety suffixes to bare Showdown keys', () => {
    expect(spriteUrl('frillish-male')).toContain('/frillish.png');
    expect(spriteUrl('morpeko-full-belly')).toContain('/morpeko.png');
    expect(spriteUrl('mimikyu-disguised')).toContain('/mimikyu.png');
    expect(spriteUrl('tauros-paldea-blaze-breed')).toContain('/tauros-paldeablaze.png');
    expect(spriteUrl('indeedee-female')).toContain('/indeedee-f.png');
  });

  it('passes unaliased slugs through unchanged', () => {
    expect(spriteUrl('stunfisk-galar')).toContain('/stunfisk-galar.png');
    expect(spriteUrl('pikachu', true)).toContain('gen5-shiny/pikachu.png');
  });
});

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
