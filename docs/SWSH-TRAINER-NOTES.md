# SwSh Wave-3 trainer pass — research notes

Companion to the `feat/swsh-trainers` PR (BACKLOG item 19). Sources per area:
Bulbapedia route/gym articles cross-checked against Serebii Pokéarth Galar.
Species+levels only; heldItem only where documented; partners and rematches
excluded. See the PR body for the judgment calls that shipped.

## Parked: Route 8 trainers (area not yet in swsh.json)

swsh.json has no `route-8` area — a known dataset gap (Route 8 sits between
Route 7 and Circhester, incl. Steamdrift Way). When the area lands with its
encounter table, attach these five researched trainer battles (sources:
https://bulbapedia.bulbagarden.net/wiki/Galar_Route_8 +
https://www.serebii.net/pokearth/galar/route8.shtml):

```json
[
  { "name": "Joanna", "class": "Doctor", "team": [{ "species": "roselia", "level": 36 }, { "species": "hattrem", "level": 36 }] },
  { "name": "Barbara", "class": "Backpacker", "team": [{ "species": "dreepy", "level": 36 }, { "species": "vullaby", "level": 37 }] },
  { "name": "Charles", "class": "Musician", "team": [{ "species": "togedemaru", "level": 37 }] },
  { "name": "Jordan & Alison", "class": "Colleagues", "team": [{ "species": "excadrill", "level": 36 }, { "species": "lucario", "level": 37 }, { "species": "hippowdon", "level": 36 }, { "species": "perrserker", "level": 37 }] },
  { "name": "Bobby", "class": "Police Officer", "team": [{ "species": "arcanine", "level": 37 }, { "species": "boltund", "level": 37 }] }
]
```

## Other gaps surfaced by this pass (not fixed here)

- **`victory-road-swsh` is likely an artifact**: SwSh has no Victory Road
  location (Route 10 leads straight from White Hill Station to Wyndon), and
  the area's cave encounter table doesn't match any base-game location.
  Tracked as its own follow-up task.
- **Galar Mine No. 2** (between Hulbury and Motostoke outskirts, ~4 trainers
  + a Team Yell/Hop multi) is not a dataset area either — same shape of gap
  as Route 8; trainers not researched yet.
- **Kabu's Motostoke gym mission has no trainer battles** (gym trainers are
  allies in the wild-catch challenge), so `motostoke` carries only the Budew
  Drop Inn Team Yell battles.
