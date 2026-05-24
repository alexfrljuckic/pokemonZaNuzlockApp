export const POKE_ALL = ["Abra","Absol","Abomasnow","Aerodactyl","Aggron","Altaria","Ampharos","Arbok","Aromatisse","Ariados","Audino","Aurorus","Baxcalibur","Banette","Barbaracle","Bellsprout","Bergmite","Binacle","Blissey","Bunnelby","Budew","Buneary","Camerupt","Carbink","Carvanha","Chatot","Chespin","Clauncher","Clawitzer","Clefable","Clefairy","Corviknight","Croagunk","Deilbird","Deino","Dedenne","Diancie","Diggersby","Ditto","Dralak","Drampa","Dragonair","Dragonite","Drilbur","Druddigon","Dugtrio","Duskull","Eelektross","Ekans","Electabuzz","Electrode","Electrike","Emboar","Empoleon","Entei","Espurr","Excadrill","Feraligatr","Fennekin","Flabebe","Flaaffy","Fletchinder","Fletchling","Floette","Florges","Froakie","Froslass","Furfrou","Gabite","Garchomp","Gastly","Gastrodon","Gengar","Gible","Giratina","Glalie","Golem","Goodra","Goodra","Goomy","Gogoat","Grapploct","Greninja","Groudon","Grovyle","Gyarados","Haunter","Hawlucha","Helioptile","Heliolisk","Heracross","Hippopotas","Honchkrow","Honedge","Houndoom","Houndour","Inkay","Infernape","Ivysaur","Jolteon","Jynx","Kadabra","Kakuna","Kangaskhan","Kirlia","Krokorok","Lampent","Latias","Latios","Leavanny","Lilligant","Litleo","Ludicolo","Lucario","Luxray","Machamp","Machoke","Machop","Magikarp","Magmar","Malamar","Mandibuzz","Manectric","Maractus","Mareep","Mawile","Medicham","Meditite","Meowstic","Mewtwo","Milotic","Miltank","Misdreavus","Mismagius","Morpeko","Murkrow","Noibat","Noivern","Numel","Pangoro","Pancham","Patrat","Pelipper","Pichu","Pikachu","Pinsir","Pumpkaboo","Pyroar","Raichu","Ralts","Roselia","Roserade","Rotom","Sableye","Salamence","Sandile","Scatterbug","Scraggy","Scrafty","Scyther","Shelgon","Shuppet","Simisage","Simipour","Simisear","Skiddo","Skuntank","Slowbro","Slowking","Slowpoke","Slurpuff","Snorlax","Snorunt","Snover","Spewpa","Spinarak","Spritzee","Staraptor","Staryu","Starmie","Steelix","Stunfisk","Swablu","Swanna","Swirlix","Sylveon","Talonflame","Tatsugiri","Tauros","Tepig","Totodile","Trubbish","Tynamo","Tyranitar","Vanillite","Venipede","Venusaur","Victreebel","Vivillon","Vullaby","Watchog","Weepinbell","Wigglytuff","Weedle","Xerneas","Yvetal","Zygarde","Absol","Aegislash","Bergmite","Breloom","Chandelure","Cinccino","Cleffa","Corsola","Crabominable","Crobat","Cryogonal","Decidueye","Dhelmise","Doublade","Drifblim","Drilbur","Dunsparce","Eevee","Espeon","Ferroseed","Flareon","Frostlass","Glalie","Golbat","Gorebyss","Grapploct","Hariyama","Hatenna","Hatterene","Hippowdon","Hitmonlee","Hitmonchan","Hitmontop","Hydreigon","Inteleon","Jolteon","Joltik","Kabutops","Kommo-o","Leafeon","Lopunny","Lucario","Luxio","Luxray","Lycanroc","Machamp","Mimikyu","Morgrem","Murkrow","Necrozma","Ninetales","Noivern","Obstagoon","Omastar","Oranguru","Pawniard","Perrserker","Pincurchin","Piloswine","Porygon-Z","Primarina","Raichu","Rillaboom","Riolu","Sandaconda","Sandslash","Shiftry","Silvally","Skuntank","Sliggoo","Steelix","Sudowoodo","Sylveon","Talonflame","Togekiss","Togetic","Torracat","Toxicroak","Tsareena","Tyranitar","Umbreon","Vaporeon","Victini","Vikavolt","Weavile","Wishiwashi","Wooloo","Zarude","Zapdos","Zeraora"];

export const POKE_DEDUP = [...new Set(POKE_ALL)].sort();

export const ZD = [
  {id:1,n:"Wild Zone 1",lv:5,u:"Start",cat:"main",p:["Weedle","Pichu","Scatterbug","Fletchling","Pidgey","Mareep","Bunnelby"],a:"Alpha Pidgey Lv.26"},
  {id:2,n:"Wild Zone 2",lv:6,u:"Start",cat:"main",p:["Kakuna","Patrat","Binacle","Staryu","Magikarp","Budew"],a:"Alpha Magikarp Lv.19"},
  {id:3,n:"Wild Zone 3",lv:8,u:"Start",cat:"main",p:["Skiddo","Pancham","Litleo","Espurr","Flabebe","Pikachu"],a:"Alpha Litleo Lv.23"},
  {id:4,n:"Wild Zone 4",lv:9,u:"Start",cat:"main",p:["Patrat","Gastly","Honedge","Spewpa","Ekans","Spinarak"],a:"Alpha Spinarak/Spewpa Lv.20"},
  {id:5,n:"Wild Zone 5",lv:13,u:"Mission 6",cat:"main",p:["Pidgeotto","Venipede","Electrike","Bellsprout","Abra","Pidgey","Bunnelby"],a:"Alpha Whirlipede Lv.28"},
  {id:6,n:"Wild Zone 6",lv:15,u:"Mission 6",cat:"main",p:["Binacle","Meditite","Buneary","Magikarp","Houndour","Swablu","Flaaffy"],a:"Alpha Houndoom Lv.33"},
  {id:7,n:"Wild Zone 7",lv:18,u:"Mission 9",cat:"main",p:["Hippopotas","Audino","Vanillite","Kakuna","Floette","Roselia","Shuppet"],a:"Alpha Fletchinder Lv.33"},
  {id:8,n:"Wild Zone 8",lv:21,u:"Mission 9",cat:"main",p:["Sandile","Krokorok","Gible","Drilbur","Machop","Numel"],a:"Alpha Camerupt/Krokorok"},
  {id:9,n:"Wild Zone 9",lv:25,u:"Mission 9",cat:"main",p:["Carbink","Espurr","Fletchinder","Kadabra","Sableye","Mawile"],a:"Alpha Meowstic/Manectric Lv.40"},
  {id:10,n:"Wild Zone 10",lv:29,u:"Mission 9",cat:"main",p:["Slowpoke","Arbok","Watchog","Bellsprout","Carvanha","Staryu","Tynamo"],a:"Alpha Sharpedo Lv.42"},
  {id:11,n:"Wild Zone 11",lv:32,u:"Mission 14",cat:"main",p:["Gyarados","Clauncher","Furfrou","Inkay","Slowpoke","Stunfisk"],a:"Alpha Clawitzer/Slowbro Lv.43"},
  {id:12,n:"Wild Zone 12",lv:34,u:"Mission 14",cat:"main",p:["Delibird","Machop","Snover","Bergmite","Vanillite","Gogoat","Snorunt","Machoke"],a:"Alpha Abomasnow/Avalugg Lv.44"},
  {id:13,n:"Wild Zone 13",lv:36,u:"Mission 14",cat:"main",p:["Phantump","Vivillon","Heracross","Pinsir","Weepinbell","Scyther"],a:"Alpha Pinsir/Weepinbell Lv.47"},
  {id:14,n:"Wild Zone 14",lv:38,u:"Mission 19",cat:"main",p:["Electabuzz","Magmar","Electrode","Jolteon","Flareon","Rotom"],a:"Alpha Rotom/Electrode"},
  {id:15,n:"Wild Zone 15",lv:40,u:"Mission 19",cat:"main",p:["Misdreavus","Lampent","Duskull","Haunter","Gengar","Pumpkaboo"],a:"Alpha Gengar/Mismagius"},
  {id:16,n:"Wild Zone 16",lv:44,u:"Mission 24",cat:"main",p:["Noibat","Gabite","Goodra","Druddigon","Deino","Shelgon"],a:"Alpha Garchomp/Dragonair"},
  {id:17,n:"Wild Zone 17",lv:46,u:"Mission 24",cat:"main",p:["Pyroar","Pangoro","Gogoat","Slurpuff","Aromatisse","Sylveon"],a:"Alpha Pyroar/Goodra Lv.52"},
  {id:18,n:"Wild Zone 18",lv:50,u:"Mission 30",cat:"main",p:["Vullaby","Mandibuzz","Chatot","Murkrow","Pelipper","Swanna"],a:"Alpha Mandibuzz/Talonflame"},
  {id:19,n:"Wild Zone 19",lv:52,u:"Mission 30",cat:"main",p:["Snorlax","Tauros","Kangaskhan","Miltank","Blissey","Wigglytuff","Drampa"],a:"Alpha Snorlax/Blissey Lv.57"},
  {id:20,n:"Wild Zone 20",lv:64,u:"Post-game",cat:"main",p:["Starter Pokemon","Various Alphas (fully evolved, random)"],a:"Randomized Alphas Lv.64"},
  {id:"s0",n:"Starter Pokemon",lv:5,u:"Start of game",cat:"special",p:["Chikorita","Tepig","Totodile"],a:"Choose one — the other two join your rival",note:"Your nuzlocke starter. Pick one and it joins your team automatically."},
  {id:"s1",n:"Gift: Chespin",lv:5,u:"Side Mission 7",cat:"special",p:["Chespin"],a:"Female Chespin — given after 3 battles",note:"One-time gift. Count as your Chespin encounter for the run."},
  {id:"s2",n:"Gift: Fennekin",lv:5,u:"Side Mission 8",cat:"special",p:["Fennekin"],a:"Female Fennekin — feed Revitalizing Twig",note:"One-time gift. Count as your Fennekin encounter."},
  {id:"s3",n:"Gift: Froakie",lv:5,u:"Side Mission 9",cat:"special",p:["Froakie"],a:"Male Froakie — beat scaffolding times",note:"One-time gift. Count as your Froakie encounter."},
  {id:"s4",n:"Shiny Mareep (side quest)",lv:10,u:"Side Mission 17",cat:"special",p:["Shiny Mareep"],a:"Guaranteed shiny Mareep",note:"Shiny clause applies — this can be your Mareep encounter regardless of Zone 1."},
  {id:"s5",n:"Galarian Stunfisk (mission)",lv:32,u:"Story Mission ~11",cat:"special",p:["Galarian Stunfisk"],a:"Found in Wild Zone 11 for mission",note:"Can be kept — counts as a Zone 11 encounter if you choose."},
  {id:"s6",n:"AZ's Lucario (post-game gift)",lv:50,u:"Post-game",cat:"special",p:["Lucario"],a:"Left in your room by AZ after credits",note:"Post-game only. Counts as a free encounter for your run."},
  {id:"s7",n:"Eternal Flower Floette",lv:60,u:"Post-game (Infinite Royale win 15)",cat:"special",p:["Floette (Eternal)"],a:"Given by Urbain/Taunie after 15 Royale wins",note:"Post-game gift. Unique form — counts as your Floette encounter."},
  {id:"s8",n:"Diancie (Mystery Gift)",lv:50,u:"Post-game (Side Mission EX1)",cat:"special",p:["Diancie"],a:"Magenta Sector 8 battle",note:"Must redeem Mystery Gift first. One-time encounter."},
  {id:"s9",n:"Mewtwo (Mystery Gift)",lv:70,u:"Post-game (Side Mission EX2)",cat:"special",p:["Mewtwo"],a:"Lysandre Labs battle",note:"Must redeem Mystery Gift first. One-time encounter."},
  {id:"s10",n:"Zygarde (post-game catch)",lv:70,u:"Post-game Mission 42",cat:"special",p:["Zygarde"],a:"Wild Zone 20 — capturable in post-game",note:"Unlike the story appearances, this one can be caught."},
  {id:"h1",n:"Hyperspace Zone: Absol",lv:100,u:"DLC: Hyperspace Survey 1",cat:"hyper",p:["Absol"],a:"Hyperspace Disaster Arena — Rogue Mega battle + catch"},
  {id:"h2",n:"Hyperspace Zone: Staraptor",lv:100,u:"DLC: Hyperspace Survey 2",cat:"hyper",p:["Staraptor"],a:"Hyperspace Hunting Grounds — Rogue Mega battle + catch"},
  {id:"h3",n:"Hyperspace Zone: Tatsugiri",lv:100,u:"DLC: Hyperspace Survey 3",cat:"hyper",p:["Tatsugiri"],a:"Hyperspace Sushi Paradise — Rogue Mega battle + catch"},
  {id:"h4",n:"Hyperspace Zone: Meowstic",lv:100,u:"DLC: Hyperspace Survey 4",cat:"hyper",p:["Meowstic"],a:"Hyperspace Second-Sight Arena — Rogue Mega battle + catch"},
  {id:"h5",n:"Hyperspace Zone: Zeraora",lv:110,u:"DLC: Side Mission EX3",cat:"hyper",p:["Zeraora"],a:"Hyperspace arena — Rogue Mega Zeraora"},
  {id:"h6",n:"Hyperspace Wild Zones (1-star)",lv:100,u:"DLC: After Survey 2",cat:"hyper",p:["Various (Blissey","Clefable","Gardevoir","Meditite","Snubbull","Togetic","Sylveon","Breloom","Hariyama","Makuhita","Pangoro","Greedent","Munchlax","Snorlax","Slakoth","Vigoroth","Slaking","Audino","Chansey","etc.)"],a:"Random DLC wild zones — 1-star difficulty",note:"Randomized each session. Treat each session as a fresh encounter. Nuzlocke: first catch per session."},
  {id:"h7",n:"Hyperspace Wild Zones (2-star)",lv:110,u:"DLC: After Survey 2",cat:"hyper",p:["Various (Mimikyu","Hatterene","Toxtricity","Obstagoon","Grimmsnarl","Cursola","Coalossal","Centiskorch","Dragapult","etc.)"],a:"Random DLC wild zones — 2-star difficulty",note:"Randomized each session. First catch per session counts."},
  {id:"h8",n:"Hyperspace Wild Zones (3-star)",lv:120,u:"DLC: After Survey 4",cat:"hyper",p:["Various (Garchomp","Kommo-o","Tyranitar","Goodra","Dragalge","Hydreigon","etc.)"],a:"Random DLC wild zones — 3-star difficulty",note:"Randomized each session."},
  {id:"h9",n:"Hyperspace Wild Zones (4-star)",lv:170,u:"DLC: After Survey 6",cat:"hyper",p:["Various (Baxcalibur","Rotom forms","Fossil Pokemon","rare encounters)"],a:"Random DLC wild zones — 4-star difficulty",note:"Includes Fossil Pokemon and very rare spawns. First catch per session."},
  {id:"h10",n:"Hyperspace Wild Zones (5-star / Special Scan)",lv:200,u:"DLC: Post-game after Rayquaza",cat:"hyper",p:["Legendary encounters (Virizion","Terrakion","Cobalion","Keldeo","Landorus","Thundurus","Tornadus","Enamorus","etc.)"],a:"Special scan legendaries — highest difficulty",note:"Post-game only. Legendary encounters via Philippe's Special Scan. One per scan."}
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
