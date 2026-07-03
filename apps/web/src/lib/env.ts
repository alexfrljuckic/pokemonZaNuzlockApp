// There is no backend yet — sync must default to disabled so the app is fully
// usable offline from day one. See docs/COSTS.md.
export const SYNC_ENABLED = import.meta.env.VITE_SYNC_ENABLED === 'true';
