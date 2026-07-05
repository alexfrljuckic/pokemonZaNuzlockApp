// Per-game "where do I get this evolution item" one-liners, shown on the
// MonCard evolve panel (title tooltip + inline hint). Display-only flavor —
// missing entries degrade to no hint. Curated 2026-07-05 from:
// bdsp: https://game8.co/games/Pokemon-Brilliant-Diamond-Shining-Pearl/archives/348250 (high confidence)
// lgpe: https://www.rpgsite.net/feature/8004-pokemon-lets-go-moon-stone-fire-stone-ice-stone-leaf-stone-thunder-stone-location-list (high confidence)
// swsh: https://www.rpgsite.net/feature/9903-pokemon-sword-shield-evolution-stones-items-locations-evolve-list (high confidence)
// sv: https://game8.co/games/Pokemon-Scarlet-Violet/archives/391048 (medium confidence)
// pla: https://game8.co/games/Pokemon-Legends-Arceus/archives/354900 (high confidence)
// plza: https://game8.co/games/Pokemon-Legends-Z-A/archives/556940 (medium confidence)
// Notable: PLA needs NO trading (Linking Cord + trade items at the Jubilife
// Trading Post for Merit Points); Z-A has NO Linking Cord — real trades only.

const HINTS: Record<string, { items: Record<string, string>; trade: string }> = {
  "bdsp": {
    "items": {
      "fire-stone": "Grand Underground: dig spots in most caverns; also Fuego Ironworks",
      "water-stone": "Grand Underground dig spots; also Route 213",
      "thunder-stone": "Grand Underground dig spots; also Sunyshore City",
      "leaf-stone": "Grand Underground dig spots; also Floaroma Meadow",
      "moon-stone": "Grand Underground dig spots; 5% held by wild Clefairy/Cleffa",
      "sun-stone": "Grand Underground dig spots; also held by wild Solrock",
      "shiny-stone": "Not diggable: Route 228, Iron Island B3F, or Pickup ability",
      "dusk-stone": "Not diggable: Veilstone City, Victory Road (post-Dex), or Pickup ability",
      "dawn-stone": "Not diggable: Route 225, Mt. Coronet (Route 207 side), or Pickup ability",
      "oval-stone": "Lost Tower 2F (Route 209); also Grand Underground dig spots",
      "kings-rock": "Held by wild Poliwhirl (5%): Route 225 surf/fish or post-Dex hideaways",
      "metal-coat": "Gift from Byron on Iron Island (post-National Dex); 5% on wild Bronzor/Steelix",
      "dragon-scale": "Held (5%) by wild Horsea/Seadra/Dratini/Dragonair",
      "upgrade": "Gift from Professor Oak in Eterna City after getting the National Dex",
      "dubious-disc": "Route 225 north (Surf needed); also Battle Park shop (BP)",
      "electirizer": "Brilliant Diamond: 5% held by wild Elekid in Grand Underground hideaways",
      "magmarizer": "Shining Pearl: 5% held by wild Magby in Grand Underground hideaways",
      "protector": "Route 228 (pit past the Ace Trainer's house); also Battle Park shop (BP)",
      "reaper-cloth": "Route 229 (behind a Cut tree); also Battle Park shop (BP)",
      "razor-claw": "Victory Road 1F or Route 224; also Battle Park shop (BP)",
      "razor-fang": "Battle Park ground item or Route 224 southeast (Surf); also BP shop",
      "prism-scale": "Rare find in Grand Underground wall-dig sites"
    },
    "trade": "Real trades required: Union Room/link trade with a friend, then trade back"
  },
  "lgpe": {
    "items": {
      "fire-stone": "Celadon Dept. Store 4F for 5,000 (after the Pokemon Tower story)",
      "water-stone": "Celadon Dept. Store 4F for 5,000 (after the Pokemon Tower story)",
      "thunder-stone": "Celadon Dept. Store 4F for 5,000 (after the Pokemon Tower story)",
      "leaf-stone": "Celadon Dept. Store 4F for 5,000 (after the Pokemon Tower story)",
      "ice-stone": "Celadon Dept. Store 4F for 5,000 (after the Pokemon Tower story)",
      "moon-stone": "Hidden in Mt. Moon's deepest floor (respawns); one in Copycat's house, Saffron"
    },
    "trade": "Real trades required: link trade with a friend (local/online) and trade back"
  },
  "swsh": {
    "items": {
      "fire-stone": "Lake of Outrage stone circle (daily); Digging Duo; Motostoke Riverbank",
      "water-stone": "Lake of Outrage stone circle (daily); Digging Duo; Route 2",
      "thunder-stone": "Lake of Outrage stone circle (daily); Digging Duo; North Lake Miloch",
      "leaf-stone": "Lake of Outrage stone circle (daily); Digging Duo (Bridge Field)",
      "moon-stone": "Lake of Outrage stone circle (daily); Digging Duo; hidden in Turffield",
      "sun-stone": "Lake of Outrage stone circle (daily); Digging Duo (Bridge Field)",
      "shiny-stone": "Lake of Outrage stone circle (daily); Digging Duo (Bridge Field)",
      "dusk-stone": "Lake of Outrage circle; Digging Duo; hidden behind Stow-on-Side Poke Center",
      "dawn-stone": "Lake of Outrage stone circle (daily); Digging Duo (Bridge Field)",
      "ice-stone": "Lake of Outrage stone circle (daily); Digging Duo (Bridge Field)",
      "oval-stone": "Cram-o-Matic recipes (Isle of Armor DLC)",
      "kings-rock": "Hidden item on Route 8; also Cram-o-Matic (Isle of Armor)",
      "metal-coat": "Poke Ball on the Stow-on-Side rooftop (alley ladder); also Cram-o-Matic",
      "dragon-scale": "Isle of Armor DLC; craftable via Cram-o-Matic Dragon-type recipes",
      "upgrade": "Training Lowlands, Isle of Armor DLC",
      "dubious-disc": "Small island off the Isle of Armor (DLC)",
      "electirizer": "Motostoke Riverbank / Lake of Outrage pickups; Digging Duo",
      "magmarizer": "Wild Area pickups (Lake of Outrage); Digging Duo",
      "protector": "Route 9 small island; or Hammerlocke BP shop (10 BP)",
      "reaper-cloth": "Hammerlocke letter-delivery quest; or Hammerlocke BP shop (10 BP)",
      "razor-claw": "Dusty Bowl in the Wild Area; or Hammerlocke BP shop (10 BP)",
      "razor-fang": "Hammerlocke BP shop (10 BP); also Cram-o-Matic",
      "prism-scale": "Shining spots by the Route 2 lake near Professor Magnolia's house",
      "cracked-pot": "Poke Ball on a Stow-on-Side rooftop; sometimes the bargain stall",
      "chipped-pot": "Stow-on-Side bargain stall (rotating daily stock)",
      "sweet-apple": "Shield: give Applin to the NPC by Hammerlocke's west bridge",
      "tart-apple": "Sword: give Applin to the NPC by Hammerlocke's west bridge",
      "galarica-cuff": "Isle of Armor: trade 8 Galarica Twigs to the lady on the Workout Sea isle",
      "galarica-wreath": "Crown Tundra: trade 15 Galarica Twigs to the woman in Roaring-Sea Caves",
      "strawberry-sweet": "Random Battle Cafe reward (Motostoke/Hammerlocke/Wyndon, once daily)",
      "sachet": "Hammerlocke BP shop (10 BP)",
      "whipped-dream": "Hammerlocke BP shop (10 BP)"
    },
    "trade": "Real trades required: link trade (Y-Comm) with a friend and trade back"
  },
  "sv": {
    "items": {
      "fire-stone": "Delibird Presents shops for 3,000 (unlocks after 3 gym badges)",
      "water-stone": "Delibird Presents shops for 3,000 (unlocks after 3 gym badges)",
      "thunder-stone": "Delibird Presents shops for 3,000 (unlocks after 3 gym badges)",
      "leaf-stone": "Delibird Presents shops for 3,000 (after beating the Levincia Gym)",
      "sun-stone": "Riverside pickups in West Province Area One; Artazon gym trial reward",
      "moon-stone": "Overworld pickups; also turns up in Porto Marinada auctions",
      "shiny-stone": "Socarrat Trail pickups; static one in South Province Area Six near Alfornada",
      "dusk-stone": "Behind the Montenevera Gym building; Pokedex reward at 130 caught",
      "dawn-stone": "Pickup northeast of Levincia; another in the ruins northwest of Medali",
      "ice-stone": "Common overworld pickups around Glaseado Mountain",
      "oval-stone": "Ground pickups around the Casseroya Lake area",
      "kings-rock": "Delibird Presents shops; also Porto Marinada auctions",
      "metal-coat": "Delibird Presents shops; also Porto Marinada auctions",
      "razor-claw": "Delibird Presents shops; also Porto Marinada auctions",
      "razor-fang": "Teal Mask DLC: found in Kitakami",
      "prism-scale": "Teal Mask DLC: item pickups in Kitakami",
      "reaper-cloth": "Teal Mask DLC: found in Kitakami",
      "cracked-pot": "Win it at the Porto Marinada market auctions",
      "chipped-pot": "Win it at the Porto Marinada market auctions",
      "sweet-apple": "Delibird Presents (Cascarrafa/Levincia/Mesagoza) for 3,000",
      "tart-apple": "Delibird Presents (Cascarrafa/Levincia/Mesagoza) for 3,000",
      "syrupy-apple": "Teal Mask DLC: found at Mossfell Confluence (Kitakami)",
      "strawberry-sweet": "Indigo Disk DLC: Poke Ball east of Savanna Plaza; Item Printer rolls",
      "auspicious-armor": "Scarlet: trade 10 Bronzor Fragments to the NPC in Zapapico",
      "malicious-armor": "Violet: trade 10 Sinistea Chips to the NPC in Zapapico",
      "leaders-crest": "Held by Bisharp leading Pawniard packs near Fury Falls (North Province)",
      "metal-alloy": "Indigo Disk DLC: Chargestone Cavern pickup; School Store for 300 BP",
      "electirizer": "Indigo Disk DLC: League Club shop 250 BP; free pickup in a Canyon Biome cave",
      "magmarizer": "Indigo Disk DLC: League Club shop 250 BP; pickup west of Savanna Rest Area 2",
      "galarica-cuff": "Added in Indigo Disk DLC (Blueberry Academy)",
      "galarica-wreath": "Added in Indigo Disk DLC (Blueberry Academy)"
    },
    "trade": "Real trades required: link trade with a friend (link codes) and trade back"
  },
  "pla": {
    "items": {
      "fire-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "water-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "thunder-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "leaf-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "ice-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "moon-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "sun-stone": "Trading Post in Jubilife for 1,000 MP; also space-time distortions and ore",
      "shiny-stone": "Trading Post for 1,200 MP; also space-time distortions",
      "dusk-stone": "Trading Post for 1,200 MP; also space-time distortions",
      "dawn-stone": "Trading Post for 1,200 MP; also space-time distortions",
      "oval-stone": "Trading Post for 400 MP (Merit Points from returning lost satchels)",
      "linking-cord": "Trading Post for 1,000 MP; also space-time distortion drops",
      "metal-coat": "Trading Post for 1,400 MP; also space-time distortion drops",
      "razor-claw": "Trading Post for 1,400 MP; also space-time distortion drops",
      "razor-fang": "Trading Post for 1,400 MP; also space-time distortion drops",
      "electirizer": "Trading Post for 1,400 MP; also space-time distortion drops",
      "magmarizer": "Trading Post for 1,400 MP; also space-time distortion drops",
      "protector": "Trading Post for 1,400 MP; also space-time distortion drops",
      "reaper-cloth": "Trading Post for 1,400 MP; also space-time distortion drops",
      "upgrade": "Trading Post for 1,400 MP; also space-time distortion drops",
      "dubious-disc": "Trading Post for 1,400 MP; also space-time distortion drops",
      "black-augurite": "Dropped by wild Graveler; space-time distortions; Ginter sometimes sells one",
      "peat-block": "Dig with Ursaluna in the Crimson Mirelands; Ginter sometimes sells one"
    },
    "trade": "No trading needed: buy a Linking Cord (1,000 MP) and use it on trade evolvers"
  },
  "plza": {
    "items": {
      "fire-stone": "Stone Emporium (west of Hotel Z) for 3,000; also red Poke Ball pickups",
      "water-stone": "Stone Emporium (west of Hotel Z) for 3,000; also red Poke Ball pickups",
      "thunder-stone": "Stone Emporium (west of Hotel Z) for 3,000; also red Poke Ball pickups",
      "leaf-stone": "Stone Emporium (west of Hotel Z) for 3,000; also red Poke Ball pickups",
      "sun-stone": "Stone Emporium for 3,000 after Main Mission 39; also city Poke Ball pickups",
      "moon-stone": "Stone Emporium for 3,000 after Main Mission 39; also city Poke Ball pickups",
      "shiny-stone": "Stone Emporium for 3,000 after Main Mission 39; also city Poke Ball pickups",
      "dusk-stone": "Stone Emporium for 3,000 after Main Mission 39; also city Poke Ball pickups",
      "dawn-stone": "Stone Emporium for 3,000 after Main Mission 39; also city Poke Ball pickups",
      "ice-stone": "Stone Emporium for 3,000 after Main Mission 39; also city Poke Ball pickups",
      "kings-rock": "Side Mission 84 reward; buyable post-game for 4,980",
      "metal-coat": "Side Mission 101/114 rewards; buyable post-game for 4,980",
      "prism-scale": "Side Mission 160 reward",
      "whipped-dream": "Side Mission 14 reward",
      "sachet": "Side Mission 10 reward",
      "galarica-cuff": "Side Mission 75 reward",
      "galarica-wreath": "Side Mission 75 reward",
      "upgrade": "Found in Hyperspace Wild Zones",
      "dubious-disc": "Found in Hyperspace Wild Zones",
      "black-augurite": "Found in Hyperspace Wild Zones",
      "auspicious-armor": "Found in Hyperspace Wild Zones",
      "malicious-armor": "Found in Hyperspace Wild Zones"
    },
    "trade": "Real trades required: no Linking Cord in Z-A; trade-evo items must be held in a trade"
  }
};

/** Where to find an evolution item in this game, or null. */
export function evoItemHint(item: string | null, gameId: string): string | null {
  if (!item) return null;
  return HINTS[gameId]?.items[item] ?? null;
}

/** How trade evolutions work in this game, or null. */
export function tradeHint(gameId: string): string | null {
  return HINTS[gameId]?.trade ?? null;
}
