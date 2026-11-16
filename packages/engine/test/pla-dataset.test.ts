import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { GameDataset } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, "../../datasets/games/pla.json"), "utf8"),
) as GameDataset;

describe("PLA dataset", () => {
  it("has the expected shape (no abilities/held items, sequential milestone orders)", () => {
    expect(dataset.gameId).toBe("pla");
    expect(dataset.mechanics.heldItems).toBe(false);
    const orders = dataset.milestones.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  // Story Pokémon fights (and the one disputed Melli battle) whose movesets no
  // source documents. They keep species + level so the cap is right, and the
  // app shows its "expected moves" fallback. Shrink this list as sources turn up.
  const UNDOCUMENTED_MOVES = new Set([
    "alpha-kricketune/kricketune",
    "ursaluna-sludge-mound/ursaluna",
    "braviary-snowpoint-temple/braviary-hisui",
    "origin-dialga-palkia/palkia-origin",
  ]);

  it("gives every milestone roster movesets, no abilities, and ace == max level", () => {
    for (const m of dataset.milestones) {
      expect(m.roster, `milestone "${m.id}" should have a roster`).toBeTruthy();
      const maxLevel = Math.max(...m.roster!.map((p) => p.level));
      expect(maxLevel, `milestone "${m.id}" ace mismatch`).toBe(m.aceLevel);
      for (const p of m.roster!) {
        if (!UNDOCUMENTED_MOVES.has(`${m.id}/${p.species}`))
          expect(
            p.moves?.length,
            `${m.id}/${p.species} should have moves`,
          ).toBeGreaterThan(0);
        // PLA has no ability mechanic — roster entries must not carry one
        expect((p as { ability?: string }).ability).toBeUndefined();
      }
    }
  });

  it("splits the five wild zones into named sub-locations (backlog 24)", () => {
    // jubilife stays the hub; everything else is a named location in a zone
    expect(dataset.areas.length).toBeGreaterThanOrEqual(80);
    const hub = dataset.areas.find((a) => a.id === "jubilife-village")!;
    expect(hub.tags).toContain("hub");
    const zones = new Set<string>();
    for (const a of dataset.areas) {
      if (a.id === "jubilife-village") continue;
      const zone = a.tags.find((t) => t.startsWith("zone:"));
      expect(zone, `${a.id} must belong to a zone`).toBeTruthy();
      zones.add(zone!);
    }
    expect([...zones].sort()).toEqual([
      "zone:alabaster-icelands",
      "zone:cobalt-coastlands",
      "zone:coronet-highlands",
      "zone:crimson-mirelands",
      "zone:obsidian-fieldlands",
    ]);
    // the old monolithic zone areas are gone
    for (const old of [
      "obsidian-fieldlands",
      "crimson-mirelands",
      "cobalt-coastlands",
      "coronet-highlands",
      "alabaster-icelands",
    ]) {
      expect(
        dataset.areas.some((a) => a.id === old),
        `${old} should be split away`,
      ).toBe(false);
    }
    // specials re-anchored onto real sub-locations
    const areaIds = new Set(dataset.areas.map((a) => a.id));
    for (const s of dataset.specials)
      expect(areaIds.has(s.area), `${s.id} area ${s.area}`).toBe(true);
    expect(dataset.specials.find((s) => s.id === "static-uxie")!.area).toBe(
      "lake-acuity",
    );
  });

  it("flags guaranteed alphas with the alpha method (alphas-count rule keys off it)", () => {
    const alphaSlots = dataset.areas.flatMap((a) =>
      a.encounters.filter((e) => e.methods.includes("alpha")),
    );
    expect(alphaSlots.length).toBeGreaterThanOrEqual(60); // ~83 documented fixed alphas
    // a known one: Horseshoe Plains' Alpha Rapidash
    const horseshoe = dataset.areas.find((a) => a.id === "horseshoe-plains")!;
    expect(
      horseshoe.encounters.some(
        (e) => e.species === "rapidash" && e.methods.includes("alpha"),
      ),
    ).toBe(true);
  });

  it("keeps the significant fights as bosses, in mission order, ending at Arceus", () => {
    const sorted = [...dataset.milestones]
      .sort((a, b) => a.order - b.order)
      .map((m) => m.id);
    expect(sorted).toEqual([
      "alpha-kricketune",
      "noble-kleavor",
      "ursaluna-sludge-mound",
      "noble-lilligant",
      "noble-arcanine",
      "warden-ingo-wayward-cave",
      "noble-electrode",
      "warden-sabi",
      "braviary-snowpoint-temple",
      "noble-avalugg",
      "kamado",
      "origin-dialga-palkia",
      "kamado-prelude-beach",
      "volo-temple-of-sinnoh",
      "giratina",
      "arceus",
    ]);
  });

  it("puts the other story trainer battles on the map where they happen", () => {
    const where = (name: string) =>
      dataset.areas
        .filter((a) => a.trainers?.some((t) => t.name.startsWith(name)))
        .map((a) => a.id);
    expect(where("Mai")).toEqual(["aspiration-hill"]);
    expect(where("Melli").sort()).toEqual(["ancient-quarry", "moonview-arena"]);
    expect(where("Volo")).toEqual(["solaceon-ruins"]);
    expect(where("Beni")).toEqual(["temple-of-sinnoh"]);
    const trainers = dataset.areas.flatMap((a) => a.trainers ?? []);
    expect(trainers).toHaveLength(18);
    for (const t of trainers)
      for (const p of t.team)
        if (!t.name.startsWith("Melli (outside"))
          expect(
            p.moves?.length,
            `${t.name}/${p.species} should have moves`,
          ).toBeGreaterThan(0);
  });

  it("includes the Kamado story battle before the Volo finale (regular Golem, not Hisuian)", () => {
    const kamado = dataset.milestones.find((m) => m.id === "kamado");
    expect(kamado, "kamado milestone should exist").toBeTruthy();
    expect(kamado!.countsForLevelCap).toBe(true);
    expect(kamado!.aceLevel).toBe(62);
    const species = kamado!.roster!.map((p) => p.species);
    expect(species).toContain("golem"); // the backlog's "Hisuian Golem" was wrong — no such form
    expect(species).not.toContain("golem-hisui");
    expect(species).toContain("braviary-hisui");
    // Kamado's Mount Coronet battle slots in before Volo's Temple of Sinnoh finale
    const volo = dataset.milestones.find(
      (m) => m.id === "volo-temple-of-sinnoh",
    )!;
    expect(kamado!.order).toBeLessThan(volo.order);
  });
});
