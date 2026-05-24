export const POKE_ALL = ["Abra","Absol","Abomasnow","Aerodactyl","Aggron","Altaria","Ampharos","Arbok","Aromatisse","Ariados","Audino","Aurorus","Baxcalibur","Banette","Barbaracle","Bellsprout","Bergmite","Binacle","Blissey","Bunnelby","Budew","Buneary","Camerupt","Carbink","Carvanha","Chatot","Chespin","Clauncher","Clawitzer","Clefable","Clefairy","Corviknight","Croagunk","Deilbird","Deino","Dedenne","Diancie","Diggersby","Ditto","Dralak","Drampa","Dragonair","Dragonite","Drilbur","Druddigon","Dugtrio","Duskull","Eelektross","Ekans","Electabuzz","Electrode","Electrike","Emboar","Empoleon","Entei","Espurr","Excadrill","Feraligatr","Fennekin","Flabebe","Flaaffy","Fletchinder","Fletchling","Floette","Florges","Froakie","Froslass","Furfrou","Gabite","Garchomp","Gastly","Gastrodon","Gengar","Gible","Giratina","Glalie","Golem","Goodra","Goodra","Goomy","Gogoat","Grapploct","Greninja","Groudon","Grovyle","Gyarados","Haunter","Hawlucha","Helioptile","Heliolisk","Heracross","Hippopotas","Honchkrow","Honedge","Houndoom","Houndour","Inkay","Infernape","Ivysaur","Jolteon","Jynx","Kadabra","Kakuna","Kangaskhan","Kirlia","Krokorok","Lampent","Latias","Latios","Leavanny","Lilligant","Litleo","Ludicolo","Lucario","Luxray","Machamp","Machoke","Machop","Magikarp","Magmar","Malamar","Mandibuzz","Manectric","Maractus","Mareep","Mawile","Medicham","Meditite","Meowstic","Mewtwo","Milotic","Miltank","Misdreavus","Mismagius","Morpeko","Murkrow","Noibat","Noivern","Numel","Pangoro","Pancham","Patrat","Pelipper","Pichu","Pikachu","Pinsir","Pumpkaboo","Pyroar","Raichu","Ralts","Roselia","Roserade","Rotom","Sableye","Salamence","Sandile","Scatterbug","Scraggy","Scrafty","Scyther","Shelgon","Shuppet","Simisage","Simipour","Simisear","Skiddo","Skuntank","Slowbro","Slowking","Slowpoke","Slurpuff","Snorlax","Snorunt","Snover","Spewpa","Spinarak","Spritzee","Staraptor","Staryu","Starmie","Steelix","Stunfisk","Swablu","Swanna","Swirlix","Sylveon","Talonflame","Tatsugiri","Tauros","Tepig","Totodile","Trubbish","Tynamo","Tyranitar","Vanillite","Venipede","Venusaur","Victreebel","Vivillon","Vullaby","Watchog","Weepinbell","Wigglytuff","Weedle","Xerneas","Yvetal","Zygarde","Absol","Aegislash","Bergmite","Breloom","Chandelure","Cinccino","Cleffa","Corsola","Crabominable","Crobat","Cryogonal","Decidueye","Dhelmise","Doublade","Drifblim","Drilbur","Dunsparce","Eevee","Espeon","Ferroseed","Flareon","Frostlass","Glalie","Golbat","Gorebyss","Grapploct","Hariyama","Hatenna","Hatterene","Hippowdon","Hitmonlee","Hitmonchan","Hitmontop","Hydreigon","Inteleon","Jolteon","Joltik","Kabutops","Kommo-o","Leafeon","Lopunny","Lucario","Luxio","Luxray","Lycanroc","Machamp","Mimikyu","Morgrem","Murkrow","Necrozma","Ninetales","Noivern","Obstagoon","Omastar","Oranguru","Pawniard","Perrserker","Pincurchin","Piloswine","Porygon-Z","Primarina","Raichu","Rillaboom","Riolu","Sandaconda","Sandslash","Shiftry","Silvally","Skuntank","Sliggoo","Steelix","Sudowoodo","Sylveon","Talonflame","Togekiss","Togetic","Torracat","Toxicroak","Tsareena","Tyranitar","Umbreon","Vaporeon","Victini","Vikavolt","Weavile","Wishiwashi","Wooloo","Zarude","Zapdos","Zeraora"];

export const POKE_DEDUP = [...new Set(POKE_ALL)].sort();

// Spawn data sourced from Serebii (https://www.serebii.net/pokearth/lumiosecity/)
// p[]      = regular wild spawns ({n: species, lv: "min-max"})
// alphas[] = GUARANTEED (100%) Alpha encounters at fixed spawn points
// All regular spawns also have a ~5% chance to appear as an Alpha (~10 levels higher).
export const ZD = [
  {id:1,n:"Wild Zone 1",lv:5,u:"Start",cat:"main",
    p:[{n:"Bunnelby",lv:"3-4"},{n:"Fletchling",lv:"3-4"},{n:"Mareep",lv:"3-5"},{n:"Pidgey",lv:"3-5"},{n:"Scatterbug",lv:"3-4"},{n:"Weedle",lv:"3-4"},{n:"Pichu",lv:"4-5"}],
    alphas:[{n:"Pidgey",lv:"24-26"}]},
  {id:2,n:"Wild Zone 2",lv:6,u:"Start",cat:"main",
    p:[{n:"Budew",lv:"5-6"},{n:"Magikarp",lv:"5-7"},{n:"Patrat",lv:"5-7"},{n:"Binacle",lv:"5-8"},{n:"Staryu",lv:"5-7"},{n:"Kakuna",lv:"7-8"}],
    alphas:[{n:"Patrat",lv:"17-19"},{n:"Staryu",lv:"17-19"}]},
  {id:3,n:"Wild Zone 3",lv:8,u:"Start",cat:"main",
    p:[{n:"Pikachu",lv:"6-8"},{n:"Litleo",lv:"6-8"},{n:"Flabebe",lv:"5-7"},{n:"Skiddo",lv:"6-8"},{n:"Pancham",lv:"7-8"},{n:"Espurr",lv:"7-8"}],
    alphas:[{n:"Litleo",lv:"18-20"}]},
  {id:4,n:"Wild Zone 4",lv:9,u:"Start",cat:"main",
    p:[{n:"Ekans",lv:"8-10"},{n:"Gastly",lv:"9-10"},{n:"Spinarak",lv:"7-8"},{n:"Patrat",lv:"8-9"},{n:"Spewpa",lv:"9-10"},{n:"Honedge",lv:"10-11"}],
    alphas:[{n:"Spinarak",lv:"20-21"}]},
  {id:5,n:"Wild Zone 5",lv:13,u:"Mission 6",cat:"main",
    p:[{n:"Pidgey",lv:"11-13"},{n:"Pidgeotto",lv:"18-20"},{n:"Abra",lv:"12-14"},{n:"Bellsprout",lv:"11-13"},{n:"Electrike",lv:"16-19"},{n:"Patrat",lv:"11-13"},{n:"Venipede",lv:"14-15"},{n:"Bunnelby",lv:"11-13"},{n:"Fletchling",lv:"11-13"},{n:"Fletchinder",lv:"18-20"},{n:"Binacle",lv:"13-14"}],
    alphas:[{n:"Bellsprout",lv:"30-32"},{n:"Whirlipede",lv:"27-28"}]},
  {id:6,n:"Wild Zone 6",lv:15,u:"Mission 6",cat:"main",
    p:[{n:"Magikarp",lv:"17-20"},{n:"Flaaffy",lv:"19-20"},{n:"Houndour",lv:"17-18"},{n:"Meditite",lv:"19-20"},{n:"Swablu",lv:"17-19"},{n:"Buneary",lv:"17-18"},{n:"Binacle",lv:"19-20"}],
    alphas:[{n:"Pikachu",lv:"40-42"},{n:"Houndoom",lv:"32-33"},{n:"Binacle",lv:"32-34"}]},
  {id:7,n:"Wild Zone 7",lv:18,u:"Mission 9",cat:"main",
    p:[{n:"Kakuna",lv:"19-20"},{n:"Gastly",lv:"19-21"},{n:"Roselia",lv:"20-22"},{n:"Shuppet",lv:"20-22"},{n:"Hippopotas",lv:"20-22"},{n:"Audino",lv:"20-22"},{n:"Vanillite",lv:"19-21"},{n:"Fletchinder",lv:"20-21"},{n:"Floette",lv:"20-22"}],
    alphas:[{n:"Fletchinder",lv:"32-33"}]},
  {id:8,n:"Wild Zone 8",lv:21,u:"Mission 9",cat:"main",
    p:[{n:"Machop",lv:"24-26"},{n:"Numel",lv:"23-24"},{n:"Camerupt",lv:"39-40"},{n:"Gible",lv:"24-25"},{n:"Drilbur",lv:"23-25"},{n:"Sandile",lv:"23-24"},{n:"Krokorok",lv:"29-30"}],
    alphas:[{n:"Camerupt",lv:"?"},{n:"Krokorok",lv:"40-41"}]},
  {id:9,n:"Wild Zone 9",lv:25,u:"Mission 9",cat:"main",
    p:[{n:"Kadabra",lv:"28-30"},{n:"Sableye",lv:"28-30"},{n:"Mawile",lv:"27-29"},{n:"Fletchinder",lv:"27-30"},{n:"Espurr",lv:"27-29"},{n:"Manectric",lv:"40-41"}],
    alphas:[{n:"Meowstic",lv:"41-42"},{n:"Manectric",lv:"40-41"}]},
  {id:10,n:"Wild Zone 10",lv:29,u:"Mission 9",cat:"main",
    p:[{n:"Slowpoke",lv:"30-32"},{n:"Staryu",lv:"31-33"},{n:"Carvanha",lv:"30-31"},{n:"Tynamo",lv:"31-32"},{n:"Bellsprout",lv:"29-31"},{n:"Sharpedo",lv:"30-32"},{n:"Watchog",lv:"30-32"},{n:"Arbok",lv:"31-33"}],
    alphas:[{n:"Sharpedo",lv:"41-43"},{n:"Watchog",lv:"41-43"},{n:"Arbok",lv:"50-52"}]},
  {id:11,n:"Wild Zone 11",lv:32,u:"Mission 14",cat:"main",
    p:[{n:"Slowpoke",lv:"30-31"},{n:"Gyarados",lv:"31-32"},{n:"Stunfisk",lv:"31-32"},{n:"Furfrou",lv:"30-32"},{n:"Inkay",lv:"31-33"},{n:"Clauncher",lv:"30-31"}],
    alphas:[{n:"Slowbro",lv:"42-44"},{n:"Clawitzer",lv:"42-44"}]},
  {id:12,n:"Wild Zone 12",lv:34,u:"Mission 14",cat:"main",
    p:[{n:"Delibird",lv:"32-35"},{n:"Snorunt",lv:"32-34"},{n:"Snover",lv:"32-33"},{n:"Vanillite",lv:"35-36"},{n:"Gogoat",lv:"32-34"},{n:"Bergmite",lv:"32-33"},{n:"Avalugg",lv:"34-35"},{n:"Machop",lv:"32-33"},{n:"Machoke",lv:"34-35"}],
    alphas:[{n:"Avalugg",lv:"54-56"}]},
  {id:13,n:"Wild Zone 13",lv:36,u:"Mission 14",cat:"main",
    p:[{n:"Scyther",lv:"37-39"},{n:"Pinsir",lv:"36-38"},{n:"Heracross",lv:"36-38"},{n:"Phantump",lv:"36-37"},{n:"Weepinbell",lv:"36-37"},{n:"Vivillon",lv:"36-37"}],
    alphas:[{n:"Weepinbell",lv:"46-47"},{n:"Trevenant",lv:"47-48"}]},
  {id:14,n:"Wild Zone 14",lv:38,u:"Mission 19",cat:"main",
    p:[{n:"Onix",lv:"37-39"},{n:"Aron",lv:"28-37"},{n:"Lairon",lv:"38-39"},{n:"Drilbur",lv:"28-37"},{n:"Excadrill",lv:"38-39"},{n:"Emolga",lv:"36-37"},{n:"Helioptile",lv:"37-38"}],
    alphas:[{n:"Excadrill",lv:"48-49"}]},
  {id:15,n:"Wild Zone 15",lv:40,u:"Mission 19",cat:"main",
    p:[{n:"Beedrill",lv:"41-42"},{n:"Larvitar",lv:"51-52"},{n:"Whirlipede",lv:"40-43"},{n:"Scolipede",lv:"40-41"},{n:"Haunter",lv:"40-41"},{n:"Pumpkaboo",lv:"42-43"},{n:"Shuppet",lv:"40-41"},{n:"Banette",lv:"42-43"},{n:"Trevenant",lv:"40-41"},{n:"Noibat",lv:"41-43"}],
    alphas:[{n:"Beedrill",lv:"51-52"},{n:"Gourgeist",lv:"52-53"},{n:"Banette",lv:"52-53"}]},
  {id:16,n:"Wild Zone 16",lv:44,u:"Mission 24",cat:"main",
    p:[{n:"Flaaffy",lv:"40-41"},{n:"Ampharos",lv:"42-53"},{n:"Medicham",lv:"40-42"},{n:"Florges",lv:"42-43"},{n:"Starmie",lv:"41-43"},{n:"Barbaracle",lv:"41-43"},{n:"Froakie",lv:"20-25"},{n:"Falinks",lv:"41-42"}],
    alphas:[{n:"Florges",lv:"52-53"}]},
  {id:17,n:"Wild Zone 17",lv:46,u:"Mission 24",cat:"main",
    p:[{n:"Chespin",lv:"20-25"},{n:"Diggersby",lv:"44-46"},{n:"Pyroar",lv:"44-47"},{n:"Mawile",lv:"44-47"},{n:"Skarmory",lv:"45-46"},{n:"Lampent",lv:"45-46"},{n:"Klefki",lv:"44-46"}],
    alphas:[{n:"Pyroar",lv:"54-57"}]},
  {id:18,n:"Wild Zone 18",lv:50,u:"Mission 30",cat:"main",
    p:[{n:"Swablu",lv:"44-45"},{n:"Altaria",lv:"46-47"},{n:"Bagon",lv:"44-45"},{n:"Salamence",lv:"61-62"},{n:"Lopunny",lv:"55-56"},{n:"Fennekin",lv:"20-25"},{n:"Noibat",lv:"44-45"},{n:"Noivern",lv:"48-49"}],
    alphas:[{n:"Lopunny",lv:"54-55"},{n:"Salamence",lv:"56-57"}]},
  {id:19,n:"Wild Zone 19",lv:52,u:"Mission 30",cat:"main",
    p:[{n:"Clefairy",lv:"48-50"},{n:"Kangaskhan",lv:"50-51"},{n:"Eevee",lv:"48-49"},{n:"Cleffa",lv:"49-50"},{n:"Audino",lv:"50-51"},{n:"Furfrou",lv:"48-51"},{n:"Drampa",lv:"49-51"}],
    alphas:[{n:"Kangaskhan",lv:"60-61"}]},
  {id:20,n:"Wild Zone 20",lv:64,u:"Post-game",cat:"main",
    p:[{n:"Aggron",lv:"54-55"},{n:"Scrafty",lv:"54-56"},{n:"Garbodor",lv:"53-55"},{n:"Bulbasaur",lv:"53-54"},{n:"Chikorita",lv:"54-55"},{n:"Roserade",lv:"53-54"},{n:"Gardevoir",lv:"53-54"},{n:"Charmander",lv:"53-54"},{n:"Tepig",lv:"54-55"},{n:"Hippowdon",lv:"54-55"},{n:"Lucario",lv:"54-55"},{n:"Squirtle",lv:"53-54"},{n:"Totodile",lv:"54-55"},{n:"Malamar",lv:"54-55"},{n:"Dragalge",lv:"53-54"}],
    alphas:[{n:"Raichu",lv:"63-64"},{n:"Clefable",lv:"63-64"},{n:"Alakazam",lv:"64-65"},{n:"Machamp",lv:"64-65"},{n:"Victreebel",lv:"63-64"},{n:"Gengar",lv:"63-64"},{n:"Kangaskhan",lv:"64-65"},{n:"Starmie",lv:"63-64"},{n:"Pinsir",lv:"63-64"},{n:"Gyarados",lv:"64-65"},{n:"Vaporeon",lv:"63-64"},{n:"Jolteon",lv:"63-64"},{n:"Flareon",lv:"63-64"},{n:"Dragonite",lv:"64-65"},{n:"Ariados",lv:"63-64"},{n:"Heracross",lv:"63-64"},{n:"Delibird",lv:"63-64"},{n:"Skarmory",lv:"63-64"},{n:"Tyranitar",lv:"64-65"},{n:"Gardevoir",lv:"64-65"},{n:"Sableye",lv:"63-64"},{n:"Aggron",lv:"64-65"},{n:"Medicham",lv:"63-64"},{n:"Altaria",lv:"64-65"},{n:"Absol",lv:"64-65"},{n:"Metagross",lv:"63-64"},{n:"Roserade",lv:"63-64"},{n:"Garchomp",lv:"64-65"},{n:"Lucario",lv:"64-65"},{n:"Hippowdon",lv:"63-64"},{n:"Leafeon",lv:"63-64"},{n:"Glaceon",lv:"63-64"},{n:"Gallade",lv:"64-65"},{n:"Froslass",lv:"63-64"},{n:"Simisage",lv:"63-64"},{n:"Simisear",lv:"63-64"},{n:"Simipour",lv:"63-64"},{n:"Scolipede",lv:"63-64"},{n:"Krookodile",lv:"63-64"},{n:"Scrafty",lv:"63-64"},{n:"Garbodor",lv:"64-65"},{n:"Vanilluxe",lv:"63-64"},{n:"Eelektross",lv:"64-65"},{n:"Chandelure",lv:"64-65"},{n:"Stunfisk",lv:"63-64"},{n:"Diggersby",lv:"63-64"},{n:"Talonflame",lv:"63-64"},{n:"Vivillon",lv:"63-64"},{n:"Florges",lv:"64-65"},{n:"Gogoat",lv:"63-64"},{n:"Pangoro",lv:"64-65"},{n:"Furfrou",lv:"63-64"},{n:"Aegislash",lv:"64-65"},{n:"Malamar",lv:"64-65"},{n:"Barbaracle",lv:"64-65"},{n:"Dragalge",lv:"64-65"},{n:"Heliolisk",lv:"64-65"},{n:"Sylveon",lv:"63-64"},{n:"Hawlucha",lv:"63-64"},{n:"Dedenne",lv:"63-64"},{n:"Carbink",lv:"63-64"},{n:"Goodra",lv:"64-65"},{n:"Klefki",lv:"63-64"},{n:"Gourgeist",lv:"63-64"},{n:"Noivern",lv:"63-64"},{n:"Drampa",lv:"64-65"},{n:"Falinks",lv:"64-65"}]},

  // Special / gift encounters — p[] uses {n} only (no level range; described in 'a' text)
  {id:"s0",n:"Starter Pokemon",lv:5,u:"Start of game",cat:"special",p:[{n:"Chikorita"},{n:"Tepig"},{n:"Totodile"}],a:"Choose one — the other two join your rival",note:"Your nuzlocke starter. Pick one and it joins your team automatically."},
  {id:"s1",n:"Gift: Chespin",lv:5,u:"Side Mission 7",cat:"special",p:[{n:"Chespin"}],a:"Female Chespin — given after 3 battles",note:"One-time gift. Count as your Chespin encounter for the run."},
  {id:"s2",n:"Gift: Fennekin",lv:5,u:"Side Mission 8",cat:"special",p:[{n:"Fennekin"}],a:"Female Fennekin — feed Revitalizing Twig",note:"One-time gift. Count as your Fennekin encounter."},
  {id:"s3",n:"Gift: Froakie",lv:5,u:"Side Mission 9",cat:"special",p:[{n:"Froakie"}],a:"Male Froakie — beat scaffolding times",note:"One-time gift. Count as your Froakie encounter."},
  {id:"s4",n:"Shiny Mareep (side quest)",lv:10,u:"Side Mission 17",cat:"special",p:[{n:"Shiny Mareep"}],a:"Guaranteed shiny Mareep",note:"Shiny clause applies — this can be your Mareep encounter regardless of Zone 1."},
  {id:"s5",n:"Galarian Stunfisk (mission)",lv:32,u:"Story Mission ~11",cat:"special",p:[{n:"Galarian Stunfisk"}],a:"Found in Wild Zone 11 for mission",note:"Can be kept — counts as a Zone 11 encounter if you choose."},
  {id:"s6",n:"AZ's Lucario (post-game gift)",lv:50,u:"Post-game",cat:"special",p:[{n:"Lucario"}],a:"Left in your room by AZ after credits",note:"Post-game only. Counts as a free encounter for your run."},
  {id:"s7",n:"Eternal Flower Floette",lv:60,u:"Post-game (Infinite Royale win 15)",cat:"special",p:[{n:"Floette (Eternal)"}],a:"Given by Urbain/Taunie after 15 Royale wins",note:"Post-game gift. Unique form — counts as your Floette encounter."},
  {id:"s8",n:"Diancie (Mystery Gift)",lv:50,u:"Post-game (Side Mission EX1)",cat:"special",p:[{n:"Diancie"}],a:"Magenta Sector 8 battle",note:"Must redeem Mystery Gift first. One-time encounter."},
  {id:"s9",n:"Mewtwo (Mystery Gift)",lv:70,u:"Post-game (Side Mission EX2)",cat:"special",p:[{n:"Mewtwo"}],a:"Lysandre Labs battle",note:"Must redeem Mystery Gift first. One-time encounter."},
  {id:"s10",n:"Zygarde (post-game catch)",lv:70,u:"Post-game Mission 42",cat:"special",p:[{n:"Zygarde"}],a:"Wild Zone 20 — capturable in post-game",note:"Unlike the story appearances, this one can be caught."},

  // Hyperspace (DLC) zones
  {id:"h1",n:"Hyperspace Zone: Absol",lv:100,u:"DLC: Hyperspace Survey 1",cat:"hyper",p:[{n:"Absol"}],a:"Hyperspace Disaster Arena — Rogue Mega battle + catch"},
  {id:"h2",n:"Hyperspace Zone: Staraptor",lv:100,u:"DLC: Hyperspace Survey 2",cat:"hyper",p:[{n:"Staraptor"}],a:"Hyperspace Hunting Grounds — Rogue Mega battle + catch"},
  {id:"h3",n:"Hyperspace Zone: Tatsugiri",lv:100,u:"DLC: Hyperspace Survey 3",cat:"hyper",p:[{n:"Tatsugiri"}],a:"Hyperspace Sushi Paradise — Rogue Mega battle + catch"},
  {id:"h4",n:"Hyperspace Zone: Meowstic",lv:100,u:"DLC: Hyperspace Survey 4",cat:"hyper",p:[{n:"Meowstic"}],a:"Hyperspace Second-Sight Arena — Rogue Mega battle + catch"},
  {id:"h5",n:"Hyperspace Zone: Zeraora",lv:110,u:"DLC: Side Mission EX3",cat:"hyper",p:[{n:"Zeraora"}],a:"Hyperspace arena — Rogue Mega Zeraora"},
  {id:"h6",n:"Hyperspace Wild Zones (1-star)",lv:100,u:"DLC: After Survey 2",cat:"hyper",p:[{n:"Various (Blissey"},{n:"Clefable"},{n:"Gardevoir"},{n:"Meditite"},{n:"Snubbull"},{n:"Togetic"},{n:"Sylveon"},{n:"Breloom"},{n:"Hariyama"},{n:"Makuhita"},{n:"Pangoro"},{n:"Greedent"},{n:"Munchlax"},{n:"Snorlax"},{n:"Slakoth"},{n:"Vigoroth"},{n:"Slaking"},{n:"Audino"},{n:"Chansey"},{n:"etc.)"}],a:"Random DLC wild zones — 1-star difficulty",note:"Randomized each session. Treat each session as a fresh encounter. Nuzlocke: first catch per session."},
  {id:"h7",n:"Hyperspace Wild Zones (2-star)",lv:110,u:"DLC: After Survey 2",cat:"hyper",p:[{n:"Various (Mimikyu"},{n:"Hatterene"},{n:"Toxtricity"},{n:"Obstagoon"},{n:"Grimmsnarl"},{n:"Cursola"},{n:"Coalossal"},{n:"Centiskorch"},{n:"Dragapult"},{n:"etc.)"}],a:"Random DLC wild zones — 2-star difficulty",note:"Randomized each session. First catch per session counts."},
  {id:"h8",n:"Hyperspace Wild Zones (3-star)",lv:120,u:"DLC: After Survey 4",cat:"hyper",p:[{n:"Various (Garchomp"},{n:"Kommo-o"},{n:"Tyranitar"},{n:"Goodra"},{n:"Dragalge"},{n:"Hydreigon"},{n:"etc.)"}],a:"Random DLC wild zones — 3-star difficulty",note:"Randomized each session."},
  {id:"h9",n:"Hyperspace Wild Zones (4-star)",lv:170,u:"DLC: After Survey 6",cat:"hyper",p:[{n:"Various (Baxcalibur"},{n:"Rotom forms"},{n:"Fossil Pokemon"},{n:"rare encounters)"}],a:"Random DLC wild zones — 4-star difficulty",note:"Includes Fossil Pokemon and very rare spawns. First catch per session."},
  {id:"h10",n:"Hyperspace Wild Zones (5-star / Special Scan)",lv:200,u:"DLC: Post-game after Rayquaza",cat:"hyper",p:[{n:"Legendary encounters (Virizion"},{n:"Terrakion"},{n:"Cobalion"},{n:"Keldeo"},{n:"Landorus"},{n:"Thundurus"},{n:"Tornadus"},{n:"Enamorus"},{n:"etc.)"}],a:"Special scan legendaries — highest difficulty",note:"Post-game only. Legendary encounters via Philippe's Special Scan. One per scan."}
];

export const BD = [
  {id:"zach",ms:4,rk:"Z to Y",n:"Zach",ace:9,team:"Slowpoke L8, Pidgey L8, Pikachu L9",type:"Mixed",cat:"Promotion Matches",rkc:""},
  {id:"yvon",ms:6,rk:"Y to X",n:"Yvon",ace:16,team:"Spritzee L15, Swirlix L15, Vivillon L16",type:"Fairy/Bug",cat:"Promotion Matches",rkc:""},
  {id:"naveen1",ms:7,rk:"Rival",n:"Naveen (early)",ace:17,team:"Spinarak L16, Sableye L16, Scraggy L17",type:"Bug/Ghost/Dark",cat:"Rival Battles",rkc:"rv",note:"Must beat before Yvon info unlocks"},
  {id:"xavi",ms:7,rk:"X to W",n:"Xavi",ace:21,team:"Venipede L20, Roselia L20, Kadabra L21, Furfrou L21",type:"Mixed",cat:"Promotion Matches",rkc:""},
  {id:"rintaro",ms:8,rk:"W to V",n:"Rintaro",ace:24,team:"Simisage L24, Simipour L24, Simisear L24",type:"Elemental Monkeys",cat:"Promotion Matches",rkc:""},
  {id:"rogue_absol",ms:10,rk:"Rogue",n:"Mega Absol",ace:30,team:"Mega Absol Lv.30",type:"Dark",mega:true,cat:"Rogue Mega Battles",rkc:"rg",note:"Intro fight — grants Absolite"},
  {id:"vinnie",ms:10,rk:"V to F",n:"Vinnie",ace:32,team:"Houndoom L30, Sharpedo L30, Buneary L30, Mega Drampa L32",type:"Mixed",mega:true,cat:"Promotion Matches",rkc:""},
  {id:"urbain1",ms:10,rk:"Rival",n:"Urbain / Taunie",ace:26,team:"2x starters Lv.25, Mega Manectric L26",type:"Mixed",mega:true,cat:"Rival Battles",rkc:"rv",note:"First rival Mega battle"},
  {id:"rogue_slowbro",ms:11,rk:"Rogue",n:"Mega Slowbro",ace:35,team:"Mega Slowbro Lv.35",type:"Water/Psychic",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_camerupt",ms:12,rk:"Rogue",n:"Mega Camerupt",ace:35,team:"Mega Camerupt Lv.35",type:"Fire/Ground",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_victreebel",ms:13,rk:"Rogue",n:"Mega Victreebel",ace:36,team:"Mega Victreebel Lv.36",type:"Grass/Poison",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"canari",ms:14,rk:"F to E",n:"Canari",ace:39,team:"Heliolisk L37, Stunfisk L38, Ampharos L38, Mega Eelektross L39",type:"Electric",mega:true,cat:"Promotion Matches",rkc:""},
  {id:"naveen2",ms:14,rk:"Rival",n:"Naveen (pre-Canari)",ace:33,team:"Ariados L33, Sableye L33, Scraggy L33",type:"Bug/Ghost/Dark",cat:"Rival Battles",rkc:"rv",note:"Must beat before Canari quiz"},
  {id:"rogue_beedrill",ms:16,rk:"Rogue",n:"Mega Beedrill",ace:40,team:"Mega Beedrill Lv.40",type:"Bug/Poison",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_hawlucha",ms:17,rk:"Rogue",n:"Mega Hawlucha",ace:41,team:"Mega Hawlucha Lv.41",type:"Fighting/Flying",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_banette",ms:18,rk:"Rogue",n:"Mega Banette",ace:42,team:"Mega Banette Lv.42",type:"Ghost",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"ivor",ms:19,rk:"E to D",n:"Ivor",ace:47,team:"Heracross L45, Medicham L46, Machamp L46, Mega Falinks L47",type:"Fighting",mega:true,cat:"Promotion Matches",rkc:""},
  {id:"rogue_mawile",ms:21,rk:"Rogue",n:"Mega Mawile",ace:46,team:"Mega Mawile Lv.46",type:"Steel/Fairy",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_barbaracle",ms:22,rk:"Rogue",n:"Mega Barbaracle",ace:47,team:"Mega Barbaracle Lv.47",type:"Rock/Water",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_ampharos",ms:23,rk:"Rogue",n:"Mega Ampharos",ace:48,team:"Mega Ampharos Lv.48",type:"Electric/Dragon",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"corbeau",ms:24,rk:"D to C",n:"Corbeau",ace:52,team:"Arbok L50, Roserade L51, Gyarados L51, Mega Scolipede L52",type:"Poison/Water",mega:true,cat:"Promotion Matches",rkc:""},
  {id:"naveen3",ms:25,rk:"Rival",n:"Naveen (Mega Scrafty)",ace:28,team:"Mega Scrafty L28",type:"Dark/Fighting",mega:true,cat:"Rival Battles",rkc:"rv",note:"Showdown on the Battle Court"},
  {id:"rogue_froslass",ms:27,rk:"Rogue",n:"Mega Froslass",ace:53,team:"Mega Froslass Lv.53",type:"Ice/Ghost",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_altaria",ms:28,rk:"Rogue",n:"Mega Altaria",ace:54,team:"Mega Altaria Lv.54",type:"Dragon/Fairy",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_venusaur",ms:29,rk:"Rogue",n:"Mega Venusaur",ace:56,team:"Mega Venusaur Lv.56",type:"Grass/Poison",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"jacinthe",ms:30,rk:"C to B",n:"Jacinthe",ace:59,team:"Carbink L57, Mawile L58, Gardevoir L58, Aurorus L58, Mega Clefable L59",type:"Fairy",mega:true,cat:"Promotion Matches",rkc:""},
  {id:"rogue_dragonite",ms:32,rk:"Rogue",n:"Mega Dragonite",ace:58,team:"Mega Dragonite Lv.58",type:"Dragon/Flying",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_tyranitar",ms:33,rk:"Rogue",n:"Mega Tyranitar",ace:60,team:"Mega Tyranitar Lv.60",type:"Rock/Dark",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"rogue_starmie",ms:34,rk:"Rogue",n:"Mega Starmie",ace:61,team:"Mega Starmie Lv.61",type:"Water/Psychic",mega:true,cat:"Rogue Mega Battles",rkc:"rg"},
  {id:"grisham",ms:35,rk:"B to A",n:"Grisham",ace:63,team:"Pangoro L61, Malamar L61, Pyroar L61, Tyranitar L62, Salamence L62, Mega Charizard X L63",type:"Dark/Fire",mega:true,cat:"Promotion Matches",rkc:""},
  {id:"urbain2",ms:35,rk:"Rival",n:"Urbain/Taunie (final)",ace:63,team:"2 unchosen starters + team, ~L63",type:"Mixed",mega:true,cat:"Rival Battles",rkc:"rv",note:"Final rival fight before Grisham"},
  {id:"zygarde1",ms:13,rk:"Story",n:"Zygarde 50% (first)",ace:30,team:"Zygarde Lv.30 — cannot be caught",type:"Dragon/Ground",cat:"Key Story",rkc:""},
  {id:"zygarde2",ms:30,rk:"Story",n:"Zygarde (tournament)",ace:57,team:"Zygarde Lv.57 — tournament fight",type:"Dragon/Ground",cat:"Key Story",rkc:"",note:"Part of Jacinthe's gauntlet"},
  {id:"gauntlet",ms:37,rk:"Final",n:"City Rogue Mega Gauntlet",ace:62,team:"Multiple Rogue Megas Lv.62",type:"Various",mega:true,cat:"Key Story",rkc:"fn",note:"Operation Protect Lumiose — street battles"},
  {id:"ange",ms:38,rk:"Final",n:"Hyperrogue Floette / Ange",ace:65,team:"Ange's Floette — true final boss",type:"Fairy",mega:true,cat:"Key Story",rkc:"fn",note:"Final story boss"}
];

export const CR_RULES = [
  "Any Pokemon that faints is permanently dead — release or permanently box it.",
  "Only the first Pokemon encountered in each zone may be caught. The randomizer assigns your legal target.",
  "All caught Pokemon must be nicknamed."
];

export const ZA_RULES = [
  "20 base Wild Zones + special encounters + DLC Hyperspace Zones. Roll the randomizer before entering each one.",
  "Duplicate clause is always active: the randomizer automatically excludes species you already own. If your whole zone pool is owned, it falls back to the full pool.",
  "Alpha Pokemon (red eyes) count as valid first encounters. If your rolled target only appears as an Alpha, you may take it.",
  "Rogue Mega Battles are one-time story encounters per the main game — each one is a static mission fight.",
  "If every party Pokemon faints, the run ends at the last Pokemon Center."
];

export const RV_RULES = [
  "Win a Promotion Match OR defeat a Rogue Mega -> earn 1 Revive Token. Check off the boss in the Bosses tab.",
  "Spend a token to revive one fallen Pokemon. They must not have been released.",
  "Revived Pokemon rejoin at their fainted level. Level cap still applies."
];

export const OPT = [
  {id:"shiny",t:"Shiny clause: a shiny may always be caught regardless of your assigned target.",d:true},
  {id:"cap",t:"Level cap: your Pokemon cannot exceed the next boss ace level (see Bosses).",d:true},
  {id:"set",t:"Set mode: no switching after an opponent's Pokemon faints.",d:true},
  {id:"heal",t:"No healing items in battle — Pokemon Centers only.",d:false},
  {id:"tm",t:"No TMs until Rank F (after Vinnie).",d:false},
  {id:"hyper",t:"DLC nuzlocke: first catch per Hyperspace Wild Zone session counts as your encounter — once per difficulty tier per session.",d:false}
];
