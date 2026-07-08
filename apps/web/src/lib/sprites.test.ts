import { describe, expect, it } from 'vitest';
import {
  spriteFallbackUrl,
  spriteUrl,
  trainerKeyFromClass,
  trainerKeyFromMilestone,
  trainerSpriteKeyFor,
} from './sprites';

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
    expect(trainerKeyFromClass('Bug Catcher')).toBe('bugcatcher');
  });

  it('strips diacritics (Pokéfan → pokefan)', () => {
    expect(trainerKeyFromClass('Pokéfan')).toBe('pokefan');
    expect(trainerKeyFromClass('Pokémon Ranger')).toBe('pokemonranger');
  });

  it('passes simple classes through lowercased', () => {
    expect(trainerKeyFromClass('Youngster')).toBe('youngster');
    expect(trainerKeyFromClass('Lass')).toBe('lass');
  });

  it('remaps classes whose squashed name has no Showdown sprite to a real key', () => {
    // Every target below returns 200 on the Showdown trainers CDN.
    expect(trainerKeyFromClass('Coach Trainer')).toBe('acetrainer');
    expect(trainerKeyFromClass('Gym Trainer')).toBe('acetrainer');
    expect(trainerKeyFromClass('Student')).toBe('schoolkid');
    expect(trainerKeyFromClass('Fisher')).toBe('fisherman');
    expect(trainerKeyFromClass('Rocker')).toBe('guitarist');
    expect(trainerKeyFromClass('Police Officer')).toBe('policeman');
    expect(trainerKeyFromClass('Daring Couple')).toBe('youngcouple');
    expect(trainerKeyFromClass('Medical Team')).toBe('doctor');
  });

  it('strips the dataset "Team" prefix from grunt classes', () => {
    expect(trainerKeyFromClass('Team Galactic Grunt')).toBe('galacticgrunt');
    expect(trainerKeyFromClass('Team Rocket Grunt')).toBe('rocketgrunt');
    expect(trainerKeyFromClass('Team Yell Grunt')).toBe('yellgrunt');
    expect(trainerKeyFromClass('Team Yell Grunts')).toBe('yellgrunt');
  });

  it('leaves classes with no reasonable match to squash (→ generic fallback)', () => {
    // These have no Showdown sprite; TrainerSprite renders the generic
    // silhouette for them rather than pointing at a guessed 404 URL.
    expect(trainerKeyFromClass('Commander')).toBe('commander');
    expect(trainerKeyFromClass('Engineer')).toBe('engineer');
    expect(trainerKeyFromClass('Gamer')).toBe('gamer');
  });
});

describe('trainerSpriteKeyFor', () => {
  it('gives named Team Galactic bosses their character sprite (not the generic class)', () => {
    // mars/jupiter/saturn/cyrus.png all return 200 on the Showdown CDN; their
    // classes (Commander / Galactic Boss) do not.
    expect(trainerSpriteKeyFor({ name: 'Mars', class: 'Commander' })).toBe('mars');
    expect(trainerSpriteKeyFor({ name: 'Jupiter', class: 'Commander' })).toBe('jupiter');
    expect(trainerSpriteKeyFor({ name: 'Saturn', class: 'Commander' })).toBe('saturn');
    expect(trainerSpriteKeyFor({ name: 'Cyrus', class: 'Galactic Boss' })).toBe('cyrus');
  });

  it('drops the "(w/ Barry)" parenthetical when matching a character name', () => {
    expect(trainerSpriteKeyFor({ name: 'Mars (w/ Barry)', class: 'Commander' })).toBe('mars');
    expect(trainerSpriteKeyFor({ name: 'Jupiter (w/ Barry)', class: 'Commander' })).toBe('jupiter');
  });

  it('falls back to the class sprite for ordinary trainers', () => {
    expect(trainerSpriteKeyFor({ name: 'Tristan', class: 'Youngster' })).toBe('youngster');
    expect(trainerSpriteKeyFor({ name: 'Grunt', class: 'Team Galactic Grunt' })).toBe('galacticgrunt');
    expect(trainerSpriteKeyFor({ class: 'Ace Trainer' })).toBe('acetrainer');
    expect(trainerSpriteKeyFor({ name: 'Nobody' })).toBeUndefined();
  });
});

describe('trainerKeyFromMilestone', () => {
  it('takes the id tail and applies aliases', () => {
    expect(trainerKeyFromMilestone('gym-1-roark')).toBe('roark');
    expect(trainerKeyFromMilestone('gym-4-wake')).toBe('crasherwake');
  });

  it('remaps Radical Red Kanto E4 / Lt. Surge ids to their Showdown keys', () => {
    // bare "surge"/"lorelei"/"agatha" 404 on the CDN; these variants return 200.
    expect(trainerKeyFromMilestone('gym-3-surge')).toBe('ltsurge');
    expect(trainerKeyFromMilestone('e4-lorelei')).toBe('lorelei-gen1');
    expect(trainerKeyFromMilestone('e4-agatha')).toBe('agatha-gen1');
  });
});
