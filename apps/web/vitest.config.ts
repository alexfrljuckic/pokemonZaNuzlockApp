import { defineConfig, configDefaults } from 'vitest/config';

// Standalone test config — deliberately NOT reusing vite.config.ts, whose
// plugins (react fast-refresh, PWA service-worker generation) have no place in
// a node test run. Tests cover the pure lib modules; the default environment
// is node, and DOM-touching test files opt into happy-dom via the
// `// @vitest-environment happy-dom` pragma.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // never pick up test copies inside throwaway agent worktrees (a positional
    // path filter would otherwise match .claude/worktrees/*/apps/web/src)
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
});
