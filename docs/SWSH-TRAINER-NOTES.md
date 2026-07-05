# SwSh Wave-3 trainer pass — research notes

Companion to the `feat/swsh-trainers` PR (BACKLOG item 19). Sources per area:
Bulbapedia route/gym articles cross-checked against Serebii Pokéarth Galar.
Species+levels only; heldItem only where documented; partners and rematches
excluded. See the PR body for the judgment calls that shipped.

## Route 8 trainers — SHIPPED with the route-8 area (BACKLOG 21)

These five battles were parked here between the #75 trainer pass and the
route-8 area PR; they now live in swsh.json. Kept for provenance (sources:
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
- **Galar Mine No. 2**: SHIPPED alongside route-8 (BACKLOG 21) — encounters
  + 5 trainers (Workers Francis/Yvonne, 2 Team Yell grunts fought as a multi
  with Hop as your partner, Rail Staff Vincent; Bede excluded as a milestone
  rival).
- **Kabu's Motostoke gym mission has no trainer battles** (gym trainers are
  allies in the wild-catch challenge), so `motostoke` carries only the Budew
  Drop Inn Team Yell battles.
