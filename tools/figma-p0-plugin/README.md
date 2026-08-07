# Waha KUN — P0 Hygiene plugin

Does the mechanical half of the design-file cleanup in one pass — the repoints,
renames and locks that would otherwise be a few thousand manual clicks.

**It never deletes anything.** No style, component, variant, layer or page is
removed. Deletion is deferred to the end of the project, because "unused today"
isn't "unneeded" while screens are still being reworked.

## What it does

1. **Resolves the text-style collisions.** Five style names each exist twice —
   one resolving to Noto Sans Arabic, one to Inter — with nothing in Figma's UI
   telling them apart. Every layer on a Latin one is repointed to its native
   twin. `WF Body/Body Medium` (wireframe leftover) goes to `Body/16px/Regular`.
   The emptied Inter styles are left in place for you to delete later.
2. **Repoints raw Latin text** — the ~368 Inter and ~75 Futura PT layers carrying
   no style at all. Off by default (tick the box) because it's the one step with
   judgement in it. Sizes with no equivalent in the scale are reported, never
   guessed.
3. **Renames** — strips the invisible U+0650 kasra off `ِAdmin Report Card`,
   trims `OTP Input `, fixes `Crirtical` → `Critical`, `Expert-Overriden` →
   `Expert-Overridden`, `CIrcle` → `Circle`, `Progress Bar Base` →
   `_Progress Bar Base`, and renames `Frame 52`.
4. **Freezes the non-canonical pages** — locks every top-level frame on
   `⚡ Prototype` and `UI Screens - draft` and prefixes them `🔒`, so rework can
   only land on the Hi-Fi pages and the three copies stop drifting apart.

### What it deliberately won't touch

`listt` (35 uses) and `list` (18 uses) are two different icons; renaming one
collides with the other. Same for `bar chart` against the existing `bar-chart`.
Merging `Nav` with `Navigation Bar`, and the two `Input Field` sets, needs you to
pick which is canonical. Those stay in the worklist as manual items.

## Running it

Needs the Figma **desktop app** — importing a development manifest doesn't work
in the browser.

1. **Duplicate the file first.** Version history will undo this, but have a copy.
2. Figma → menu → **Plugins → Development → Import plugin from manifest…**
3. Pick `tools/figma-p0-plugin/manifest.json`.
4. Open the Waha KUN file, run **Plugins → Development → Waha KUN — P0 Hygiene**.
5. Press **Dry run**. Read the report — nothing is written yet.
6. If it looks right, press **Apply**.

On a file this size (57k nodes) expect the traversal to take a few seconds.

## Config

Top of `code.js`:

- `FRAME_52_NEW_NAME` — what `Frame 52` becomes. Set `null` to leave it.
- `FREEZE_PAGES` / `FREEZE_PREFIX` — which pages get locked.
- `REPOINT_RAW_LATIN` — default for the checkbox.

## After it runs

The Inter styles will still be listed in the type panel with zero usages. That's
intended — they're the escape hatch. Delete them in the end-of-project cleanup
pass once nothing needs them.
