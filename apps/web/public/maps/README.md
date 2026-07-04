# Route map backdrops

Drop a map image here named exactly **`sinnoh.png`** (for BDSP) and the Routes
tab will render it as the backdrop under the interactive encounter nodes. If no
file is present, the app falls back to the hand-drawn schematic map — the build
never depends on this file existing.

- The image is stretched to the map's coordinate space (a 100×140 portrait
  box) with `preserveAspectRatio="xMidYMid slice"`. For the interactive nodes
  to sit in the right spots, node coordinates in
  `apps/web/src/lib/sinnohMap.ts` are calibrated to whatever backdrop is in
  place — after adding/replacing the image, the node positions need a
  calibration pass against it.
- Only add artwork you have the right to use. The default shipped map is our
  own schematic drawing precisely to avoid depending on third-party map art.
