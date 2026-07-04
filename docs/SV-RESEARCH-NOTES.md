# Scarlet/Violet dataset — research notes (WIP, delete/condense when sv.json lands)

Compiled 2026-07-05 from three parallel research passes (Serebii + Bulbapedia +
Game8 + PokemonDB cross-checks). High confidence unless flagged. This is the
sourcing input for `packages/datasets/games/sv.json` (BACKLOG item 16). All
slugs are PokeAPI slugs. **Bar = the PLA dataset PR (#44):** validator green,
sources cited per area, low-confidence flagged, registered in games/sv.ts +
theme + mascots + (optional) map.

Meta:
- `pokeapiVersionGroups: ["scarlet-violet", "the-teal-mask", "the-indigo-disk"]` (confirmed).
- Starters (gift specials, mutually exclusive): `sprigatito` → meowscarada, `fuecoco` → skeledirge, `quaxly` → quaquaval.
- Version mascots (legendary specials, version-locked): `koraidon` (scarlet), `miraidon` (violet).
- Titans are also catchable statics after their battle (quaking-earth split: great-tusk scarlet / iron-treads violet). No fossils/other mandatory gifts.
- SV bosses Terastallize their ace — the roster schema has no `teraType` field today; either add one (schema change) or drop tera (note it in the PR). Tera types listed below per ace.

## Areas + encounters (base game Paldea; open-world, heavy overlap — trim to distinctive spawns, filter by version)

Source: serebii.net/pokearth/paldea/<area>.shtml per area. Version-exclusive master list at bottom.

- **los-platos** (order 1): fold into south-province-area-one (town, no distinct table) — or omit.
- **south-province-area-one** (order 1): lechonk, pawmi, tarountula, fidough, hoppip, sunkern, wooper-paldea, buizel, drifloon, starly, fletchling, skwovet, rookidee, ralts, scatterbug, maschiff, shroodle, flittle, wiglett, flamigo, dunsparce, marill, azurill, pichu, magikarp, psyduck, mankey, gastly. excl: bagon(V), drifloon/drifblim(S), misdreavus(V), dreepy(V).
- **south-province-area-two** (order 2): pikachu, jigglypuff, diglett, dugtrio, eevee, mareep, marill, phanpy, kricketot, bronzor, riolu, smoliv, tinkatink, nymble, lechonk, fidough, maschiff, shroodle, hatenna. excl: drifloon(S), misdreavus(V), gulpin(V).
- **south-province-area-three** (order 3): growlithe, shroomish, slakoth, vigoroth, makuhita, spoink, swablu, shinx, luxio, axew, nacli, charcadet, klawf, oinkologne, gumshoos, litleo, skiddo, toedscool. excl: zangoose(S)/seviper(V), gulpin(V), bagon(V), stunky(S), drifloon(S).
- **south-province-area-four** (order 4): pikachu, persian, primeape, arcanine, scyther, houndour, houndoom, phanpy, donphan, meditite, grumpig, riolu, petilil, lilligant, sawsbuck, hawlucha, salazzle, toxel, pineco, pachirisu. excl: misdreavus(V), drifloon(S), dreepy(V).
- **east-province-area-one** (order 3): tauros-paldea-combat-breed, venonat, teddiursa, shuppet, shellos, cyclizar, tandemaus, oinkologne, spidops, wattrel, steenee, komala, oricorio. excl: gulpin(V).
- **east-province-area-three** (order 5): meowth, growlithe, magnemite, voltorb, torkoal, sableye, hariyama, gothita, pawniard, rolycoly, carkol, silicobra, sinistea, cufant, varoom, orthworm, glimmet, bramblin, salandit. excl: larvitar(S), bagon(V), dreepy(V).
- **west-province-area-one** (order 4): mankey, primeape, hypno, numel, petilil, gible, crabrawler, rockruff, mudbray, falinks, bombirdier, cyclizar, capsakid, flittle, wiglett, sableye, nacli. excl: larvitar(S), drifloon(S).
- **west-province-area-two** (order 6): tauros-paldea-combat-breed, ditto, girafarig, donphan, hariyama, meditite, tropius, gible, gabite, croagunk, rotom, floatzel, sandygast, palossand, falinks, finizen, noibat, wugtrio. excl: bagon(V), stunky(S), dreepy(V).
- **asado-desert** (order 5): cacnea, cacturne, hippopotas, hippowdon, sandile, silicobra, sandaconda, larvesta, orthworm, bramblin, capsakid, rellor, espathra, lokix, donphan, phanpy, makuhita. excl: larvitar(S), stonjourner(S).
- **north-province-area-one** (order 7): primeape, ampharos, ursaring, riolu, lucario, gallade, axew, fraxure, noibat, noivern, hawlucha, pyroar, lurantis, salazzle, brambleghast, scovillain, espathra, indeedee, revavroom, houndstone.
- **north-province-area-two** (order 8): arcanine, heracross, ursaring, houndoom, slaking, camerupt, luxray, amoonguss, pawniard, bisharp, lucario, noivern, salazzle, mabosstiff, grafaiai, revavroom, kricketune. excl: shelgon(V), deino/zweilous(S), oranguru(S)/passimian(V).
- **north-province-area-three** (order 8): hypno, espeon, umbreon, blissey, lilligant, florges, dedenne, lurantis, salazzle, scovillain, dolliv, sunflora, hawlucha, gastrodon. excl: eiscue(V).
- **glaseado-mountain** (order 9): snorunt, glalie, snover, abomasnow, sneasel, weavile, delibird, cubchoo, beartic, snom, frosmoth, bergmite, avalugg, cryogonal, cetoddle, cetitan, frigibax, arctibax, glaceon, froslass, crabominable, vaporeon. excl: bagon(V), deino/zweilous(S), drifblim(S), mismagius(V), dreepy/drakloak(V).
- **casseroya-lake** (order 9): gyarados, dratini, dragonair, dragonite, scyther, chansey, tropius, gastrodon, toxicroak, hawlucha, sliggoo, tsareena, dondozo, tatsugiri, veluza, drednaw, kilowattrel, honchkrow, spiritomb, forretress. excl: swalot(V), skuntank(S), mismagius(V), drakloak(V).
- **tagtree-thicket** (order 8): venonat, venomoth, sunflora, pineco, zorua, foongus, fomantis, mimikyu, impidimp, morgrem, grafaiai, dolliv, spidops, greedent, komala, whiscash. excl: oranguru(S)/passimian(V), drifloon(S).
- **area-zero / great-crater** (order 10, endgame): base-game paradox habitat — great-tusk/scream-tail/brute-bonnet/flutter-mane/slither-wing/sandy-shocks/roaring-moon (S) OR iron-treads/iron-bundle/iron-hands/iron-jugulis/iron-moth/iron-thorns/iron-valiant (V). Filter by version.
- Additional named zones not per-fetched (medium confidence, overlap adjacent): south-province area-five/six, east-province-area-two, west-province-area-three, dalizapa-passage/zapapico (torkoal/rolycoly/salandit/nacli), alfornada/socarrat-trail (psychic/fire, near last gym), cabo-poco.

**Form-slug cautions (verify vs species-data after regen):** tauros-paldea-combat-breed / -blaze-breed (S) / -aqua-breed (V); wooper-paldea; oinkologne (may need -male/-female); oricorio/lycanroc/basculin/squawkabilly/maushold multi-form → default base.

**Version-exclusive master list:**
- Scarlet: vulpix-alola, ninetales-alola, tauros-paldea-blaze-breed, gligar, larvitar/pupitar/tyranitar, cranidos/rampardos, drifloon/drifblim, stunky/skuntank, gliscor, deino/zweilous/hydreigon, skrelp/dragalge, oranguru, cramorant, stonjourner, armarouge; paradoxes great-tusk/scream-tail/brute-bonnet/flutter-mane/slither-wing/sandy-shocks/roaring-moon; koraidon.
- Violet: sandshrew-alola, sandslash-alola, tauros-paldea-aqua-breed, aipom/ambipom, misdreavus/mismagius, gulpin/swalot, bagon/shelgon/salamence, shieldon/bastiodon, clauncher/clawitzer, passimian, morpeko, dreepy/drakloak/dragapult, eiscue, ceruledge; paradoxes iron-treads/iron-bundle/iron-hands/iron-jugulis/iron-moth/iron-thorns/iron-valiant; miraidon.
- DLC paradoxes (walking-wake, gouging-fire, raging-bolt / iron-leaves, iron-boulder, iron-crown) are NOT base-game wild — exclude.

## Milestones

### Gyms (type gym) — tera on ace
- gym-1-katy (ace 15, tera bug): nymble 14 (swarm; struggle-bug,double-kick), tarountula 14 (insomnia; bug-bite,assurance), teddiursa 15 (pickup; fury-cutter,fury-swipes).
- gym-2-brassius (ace 17, tera grass): petilil 16 (own-tempo; sleep-powder,mega-drain), smoliv 16 (early-bird; tackle,razor-leaf), sudowoodo 17 (sturdy; trailblaze,rock-throw).
- gym-3-iono (ace 24, tera electric): wattrel 23 (wind-power; pluck,quick-attack,spark), bellibolt 23 (electromorphosis; water-gun,spark), luxio 23 (intimidate; spark,bite), mismagius 24 (levitate; charge-beam,hex,confuse-ray).
- gym-4-kofu (ace 30, tera water): veluza 29 (mold-breaker; slash,pluck,aqua-cutter), wugtrio 29 (gooey; mud-slap,water-pulse,headbutt), crabominable 30 (iron-fist; crabhammer,rock-smash,slam).
- gym-5-larry (ace 36, tera normal): komala 35 (comatose; yawn,sucker-punch,slam), dudunsparce 35 (serene-grace; hyper-drill,drill-run,glare), staraptor 36 (intimidate; facade,aerial-ace).
- gym-6-ryme (ace 42, tera ghost; DOUBLE): banette 41 (insomnia; icy-wind,sucker-punch,shadow-sneak), mimikyu 41 (disguise; light-screen,shadow-sneak,slash), houndstone 41 (sand-rush; play-rough,crunch,phantom-force), toxtricity-low-key 42 (punk-rock; discharge,hex,hyper-voice).
- gym-7-tulip (ace 45, tera psychic): farigiraf 44 (armor-tail; crunch,zen-headbutt,reflect), gardevoir 44 (synchronize; psychic,dazzling-gleam,energy-ball), espathra 44 (opportunist; psychic,quick-attack,shadow-ball), florges 45 (flower-veil; psychic,moonblast,petal-blizzard).
- gym-8-grusha (ace 48, tera ice): frosmoth 47 (shield-dust; blizzard,bug-buzz,tailwind), beartic 47 (snow-cloak; aqua-jet,icicle-crash,earthquake), cetitan 47 (thick-fat; ice-spinner,liquidation,ice-shard), altaria 48 (natural-cure; ice-beam,dragon-pulse,moonblast,hurricane).
  - Gym movesets are genuinely short (2-3 moves) in-game — not missing data.

### Elite Four + Champion (type elite-four / champion) — tera on ace
- e4-rika (ace 58, tera ground): whiscash 57 (oblivious; muddy-water,earth-power,blizzard,future-sight), camerupt 57 (magma-armor; earth-power,fire-blast,flash-cannon,yawn), donphan 57 (sturdy; earthquake,stone-edge,iron-head,poison-jab), dugtrio 57 (sand-veil; earthquake,rock-slide,sucker-punch,sandstorm), clodsire 58 (water-absorb; earthquake,liquidation,toxic,protect).
- e4-poppy (ace 59, tera steel): copperajah 58 (sheer-force; high-horsepower,play-rough,heavy-slam,stealth-rock), magnezone 58 (sturdy; discharge,flash-cannon,light-screen,tri-attack), bronzong 58 (levitate; iron-head,zen-headbutt,rock-blast,earthquake), corviknight 58 (pressure; brave-bird,iron-head,body-press,iron-defense), tinkaton 59 (mold-breaker; play-rough,gigaton-hammer,brick-break,stone-edge).
- e4-larry (ace 60, tera flying): tropius 59 (chlorophyll; air-slash,solar-beam,dragon-pulse,sunny-day), oricorio-baile 59 (dancer; revelation-dance,air-slash,teeter-dance,icy-wind), altaria 59 (natural-cure; moonblast,flamethrower,ice-beam,dragon-pulse), staraptor 59 (intimidate; facade,brave-bird,close-combat,thief), flamigo 60 (scrappy; brave-bird,close-combat,throat-chop,liquidation).
- e4-hassel (ace 61, tera dragon): noivern 60 (infiltrator; air-slash,dragon-pulse,super-fang,hyper-voice), haxorus 60 (mold-breaker; dragon-claw,crunch,iron-head,rock-tomb), dragalge 60 (poison-point; sludge-bomb,dragon-pulse,hydro-pump,thunderbolt), flapple 60 (ripen; dragon-rush,seed-bomb,aerial-ace,leech-seed), baxcalibur 61 (thermal-exchange; icicle-crash,brick-break,glaive-rush) [4th move undocumented].
- champion-geeta (ace 62, tera rock): espathra 61 (opportunist; lumina-crash,dazzling-gleam,quick-attack,reflect), gogoat 61 (sap-sipper; horn-leech,zen-headbutt,play-rough,bulk-up), veluza 61 (mold-breaker; aqua-jet,liquidation,psycho-cut,ice-fang), avalugg 61 (own-tempo; avalanche,crunch,earthquake,body-press), kingambit 61 (supreme-overlord; iron-head,kowtow-cleave,zen-headbutt,stone-edge), glimmora 62 (toxic-debris; tera-blast,sludge-wave,earth-power,dazzling-gleam).

### Path of Legends — Titans (type: story or "titan"; Titans have NO tera)
- stony-cliff-titan (ace 16): klawf 16 (anger-shell; vise-grip,rock-smash,block).
- open-sky-titan (ace 20): bombirdier 20 (rocky-payload; rock-throw,wing-attack,pluck).
- lurking-steel-titan (ace 29): orthworm 29 (earth-eater; iron-tail,headbutt,wrap).
- quaking-earth-titan (ace 45) **version split**: great-tusk 45 (protosynthesis; rapid-spin,brick-break,knock-off) SCARLET / iron-treads 45 (quark-drive; rapid-spin,iron-head,knock-off) VIOLET.
- false-dragon-titan (ace 57): dondozo 56 (oblivious; aqua-tail,body-slam,knock-off), tatsugiri 57 (commander; muddy-water,icy-wind,taunt).

### Starfall Street — Team Star (type: story or "team-star"); each ends in a Starmobile revavroom (tera = crew type)
- star-boss-giacomo (ace 21, dark): pawniard 21 (defiant; metal-claw,fury-cutter,aerial-ace), revavroom 20 [Segin Starmobile] (intimidate; wicked-torque,snarl,metal-sound,swift) tera dark.
- star-boss-mela (ace 27, fire): torkoal 27 (drought; flame-wheel,clear-smog), revavroom 26 [Schedar] (speed-boost; overheat,blazing-torque,screech,swift) tera fire.
- star-boss-atticus (ace 33, poison): skuntank 32 (stench; sucker-punch,toxic,venoshock), muk 32 (stench; sludge-wave,mud-slap), revavroom 33 (overcoat; iron-head,sludge,assurance,bulldoze) [his true ace], revavroom 32 [Navi Starmobile] (toxic-debris; spin-out,noxious-torque,flame-charge,smog) tera poison.
- star-boss-ortega (ace 51, fairy): azumarill 50 (huge-power; aqua-tail,play-rough,bounce,charm), wigglytuff 50 (cute-charm; body-slam,play-rough,gyro-ball,charm), dachsbun 51 (well-baked-body; crunch,play-rough,baby-doll-eyes,mud-slap), revavroom 50 [Ruchbah] (misty-surge; steel-roller,magical-torque,confuse-ray,spin-out) tera fairy.
- star-boss-eri (ace 56, fighting): toxicroak 55 (anticipation; poison-jab,brick-break,sucker-punch), passimian 55 (receiver; close-combat,rock-tomb,seed-bomb), lucario 55 (steadfast; dragon-pulse,aura-sphere,dark-pulse), annihilape 56 (vital-spirit; rage-fist,close-combat,ice-punch,fire-punch), revavroom 56 [Caph] (stamina; combat-torque,spin-out,shift-gear,high-horsepower) tera fighting.
  - Note: multiple revavroom at different levels/roles within a boss — the ace==maxlevel rule still holds per milestone.

### Rivals / finale
- arven-final (ace 63): greedent 58 (cheek-pouch; bullet-seed,body-slam,psychic-fangs,earthquake), cloyster 59 (skill-link; rock-blast,icicle-spear,liquidation,light-screen), scovillain 60 (chlorophyll; fire-blast,energy-ball,zen-headbutt,crunch), toedscruel 61 (mycelium-might; power-whip,earth-power,spore,sludge-bomb), garganacl 62 (purifying-salt; stone-edge,earthquake,body-press,stealth-rock), mabosstiff 63 (intimidate; crunch,psychic-fangs,fire-fang,play-rough) tera dark.
- penny-final (ace 63): umbreon 62 (synchronize; dark-pulse,quick-attack,baby-doll-eyes,psychic), vaporeon 62 (water-absorb; hydro-pump,quick-attack,baby-doll-eyes,aurora-beam), jolteon 62 (quick-feet; thunder,quick-attack,baby-doll-eyes,pin-missile), flareon 62 (flash-fire; flare-blitz,quick-attack,baby-doll-eyes,fire-spin), leafeon 62 (leaf-guard; leaf-blade,quick-attack,baby-doll-eyes,x-scissor), sylveon 63 (cute-charm; moonblast,quick-attack,baby-doll-eyes,shadow-ball) tera fairy. **Six eeveelutions only — no Cinderace.**
- nemona-final (ace 66) — starter-conditional ace (rosterByStarter on chosen starter species sprigatito/fuecoco/quaxly): shared 5 = lycanroc 65 (sand-rush; accelerock,stone-edge,drill-run,stealth-rock), goodra 65 (sap-sipper; dragon-pulse,muddy-water,ice-beam,sludge-bomb), dudunsparce 65 (ability unconfirmed; coil,hyper-drill,drill-run,dragon-rush), orthworm 65 (earth-eater; body-press,iron-tail,earthquake,rock-blast), pawmot 65 (volt-absorb; close-combat,double-shock,ice-punch,quick-attack). Ace 66: chose sprigatito→quaquaval (torrent; brick-break,aqua-step,aerial-ace,ice-spinner) tera water; chose fuecoco→meowscarada (overgrow; shadow-claw,flower-trick,thunder-punch,play-rough) tera grass; chose quaxly→skeledirge (blaze; shadow-ball,torch-song,snarl,earth-power) tera fire.
- FINALE Area Zero (version split; ace = the professor's mascot Lv72):
  - professor-sada (SCARLET, ace 72): slither-wing 66 (protosynthesis; lunge,leech-life,low-sweep,zen-headbutt), scream-tail 66 (protosynthesis; play-rough,drain-punch,ice-punch,zen-headbutt), brute-bonnet 66 (protosynthesis; earth-power,giga-drain,payback,sucker-punch), flutter-mane 66 (protosynthesis; power-gem,mystical-fire,shadow-ball,thunderbolt), sandy-shocks 66 (protosynthesis; discharge,earth-power,flash-cannon,power-gem), roaring-moon 67 (protosynthesis; dragon-claw,night-slash,stone-edge,earthquake), koraidon 72 (orichalcum-pulse; giga-impact,bulk-up,taunt,flamethrower) tera fighting.
  - professor-turo (VIOLET, ace 72): iron-moth 66 (quark-drive; sludge-wave,fiery-dance,discharge,air-slash), iron-bundle 66 (quark-drive; drill-peck,water-pulse,freeze-dry,snowscape), iron-hands 66 (quark-drive; thunder-punch,drain-punch,iron-head,fake-out), iron-jugulis 66 (quark-drive; air-slash,dark-pulse,flamethrower,flash-cannon), iron-thorns 66 (quark-drive; thunder-punch,brick-break,stone-edge,earthquake), iron-valiant 67 (quark-drive; psycho-cut,brick-break,spirit-break,poison-jab), miraidon 72 (hadron-engine; hyper-beam,charge,taunt,power-gem) tera electric.
  - Model the version split via two milestones (conditions.version) or rosterByStarter-style; koraidon/miraidon at 72 sets aceLevel.

## Low-confidence / decisions flagged
- Nemona's dudunsparce ability (unconfirmed — likely serene-grace/rattled).
- Baxcalibur 4th move (Hassel) undocumented.
- Tera types: schema has no field yet — add `teraType` to roster schema, or drop and note.
- Area modeling: open-world overlap; dedupe shared common mons; gate loosely by `order`.
- Milestone types: `titan` / `team-star` aren't in existing type sets — reuse `story` or extend the schema's milestone `type` enum + sprite handling.
