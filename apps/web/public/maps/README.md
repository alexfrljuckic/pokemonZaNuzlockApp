# Route map backdrops

Drop a map image here named `sinnoh.png` (BDSP) or `kanto.png` (LGPE) and the
Routes tab will render it as the backdrop under the interactive encounter
nodes for that game. If no file is present, the app falls back to a schematic
box-and-line rendering — the build never depends on either file existing.

- Each game's map lives in `apps/web/src/lib/maps/` (`sinnoh.ts`, `kanto.ts`,
  ...) as a `GameMap` (see `types.ts`): a `viewBox`, `backdropSrc`, node
  positions, and decorative connector edges. `RouteMap.tsx` is generic —
  it renders whichever `GameMap` `RoutesTab` looks up from the
  `GAME_MAPS` registry (`lib/maps/index.ts`) for the active `gameId`.
- The image is stretched to fill its own `viewBox` (native backdrop pixel
  dimensions, not a shared coordinate space) with
  `preserveAspectRatio="xMidYMid slice"`. For the interactive nodes to sit in
  the right spots, node coordinates are calibrated to whatever backdrop is in
  place — after adding/replacing an image, the node positions in that game's
  map file need a calibration pass against it.
- To add a new game's map: add an image here, add a `lib/maps/<game>.ts` file
  in the `GameMap` shape, register it in `GAME_MAPS`, and add the game's
  `gameId` there — no changes needed to `RouteMap.tsx` or `RoutesTab.tsx`.
- Only add artwork you have the right to use. The default shipped maps are
  either our own schematic drawings or community-standard fan-made assets,
  precisely to avoid depending on official box/game art.
