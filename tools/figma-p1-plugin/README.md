# Waha KUN, P1 Variables plugin

Creates the variable layer in Figma and binds the existing paint styles to it.

**Never deletes anything**, and re-running is safe, every variable is matched by
name and updated in place rather than duplicated.

## The point of it

The variable table is **generated from `src/theme/colors.ts` and `layout.ts`**,
not transcribed from them. `scripts/gen-figma-tokens.js` imports the real theme
modules and emits `main.js`.

That matters because this file has already been bitten by exactly the drift it
prevents: a Figma style named `Body/Bold` resolving to Medium, `Label/12px` at
line-height 12 while the app used 18, and two whole type scales sharing one set
of names. Hand-copying hex values into Figma would have rebuilt the same problem
one layer down.

## What it does

1. **`Primitives` collection**, 37 colour + 16 number variables. Colour names
   match the existing paint styles exactly (`Primary/G500`, `Neutral/N650`,
   `Accent/Red/R700`), so the binding in step 3 is unambiguous. Numbers are the
   spacing ramp (`Space/0` … `Space/40`) and radii (`Radius/4` … `Radius/Pill`).
2. **`Semantic` collection**, 33 aliases pointing into Primitives:
   `text/muted`, `bg/surface`, `border/control`, `status/error-text`, and so on.
   Screens should only ever use these. This is the layer that makes the next
   contrast change a one-variable edit instead of a file-wide hunt, and it
   mirrors the `palette` → `colors` split already in `src/theme/colors.ts`.
3. **Binds paint styles to primitives.** The styles keep working; they just
   resolve through a variable now. Nothing on the canvas needs re-picking.
4. **Fixes `Label/12px/Regular`**, line-height 12 → 18. Every other style in the
   file holds a 1.5 ratio and the app already normalises this one to 18, so
   Figma is the side that is wrong.

Single-mode, deliberately. Multiple modes are the plan-gated feature; one mode
works on every Figma plan. The collection split means a light/dark or
English/LTR mode can be added later without restructuring.

## What it will not do

**Auto-layout coverage is not automatable.** The Design System page sits at 59%,
and applying auto-layout to a frame _reflows its children_, a plugin doing that
across ~1,000 frames would wreck layouts even though it deletes nothing. It needs
a human deciding direction, alignment and spacing per component. That stays
manual; it's the remaining P1 item after this runs.

**`Accent/Blue/B500` is left alone.** Two styles share that name with different
values (`#1E7ABF` and `#81B5E9`, which is a 300 stop wearing a 500 name). The
plugin binds the one matching the palette and reports the other, because
choosing between renaming it and changing its value is a judgement call.

## Running it

Needs the Figma **desktop app**.

1. **Duplicate the file first.**
2. Plugins → Development → Import plugin from manifest… → `manifest.json`
3. Run it, press **Dry run**, read the report.
4. If it looks right, press **Apply**.

## Changing it

Token values come from the app, so change them there:

```sh
# edit src/theme/colors.ts or layout.ts
npm run tokens:figma      # rebuilds tools/figma-p1-plugin/main.js
```

Plugin logic lives in `code.js`. `main.js` is generated, the token table
prepended to `code.js`, because a Figma manifest loads exactly one script.
Don't edit `main.js`.
