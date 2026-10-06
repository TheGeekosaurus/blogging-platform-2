# Spinning the 3D N in the Capital header

## Context

Denis wants the gold 3D N in the Nanotom Capital logo to rotate slowly and
seamlessly, forever, in the header. He asked what media is needed to do it.

The short answer: **a pre-rendered frame sequence of a quarter turn, assembled
into a WebP sprite sheet, stepped by CSS.** The long answer is that we cannot
produce those frames from anything currently in the repo, and one of the routes
Denis suggested — AI video — will not work for this particular subject.

Scope confirmed with him: **header only**, and **nothing ships until real frames
exist** (no placeholder).

---

## What we have, measured

- `apps/blog/public/marketing/nanotom-capital-logo.png` — 1200x352 RGBA. The
  lockup: mark plus wordmark.
- `apps/blog/public/marketing/nanotom-capital-logo-dark.png` — same geometry,
  ink wordmark.
- `apps/blog/public/brand/nanotom-mark.png` — 192x192, the mark alone. Used as
  the favicon for both sites (`apps/blog/app/layout.tsx:114-115`).

Three measurements that shape the plan:

1. **The lockup splits cleanly.** In both PNGs the mark occupies x 12–311 and
   the wordmark starts at x 332 — a 21px fully transparent gutter, no overlap.
   Cutting the mark out of the lockup is free and lossless. This is a
   prerequisite either way: the wordmark must not spin.

2. **The header mark is one tone; the favicon mark is two.** Of the header
   mark's opaque pixels, 0.3% are near-grey (median saturation 0.56) — it is
   uniformly gold. The favicon mark is 32.9% near-grey: a gold/silver
   alternating render, and a different piece of artwork.

3. **Therefore the loop is 90 degrees, not 360.** The geometry is four extruded
   N forms interlocking at 90 degrees about a vertical axis. With a fixed camera
   and fixed lights, a quarter turn puts the object back in exactly the same set
   of points in space, so the render is pixel-identical to frame zero. That only
   holds because the arms are the same colour — it is why the uniform-gold
   header mark is the right source and the two-tone favicon mark is not.

   **Quarter of the frames, and a loop that is seamless by construction rather
   than by a crossfade.** Confirm the four arms really are identical in the
   model before committing to 90; if they are not, the loop is 360 and the
   frame budget quadruples.

---

## Why AI video will not do this

Denis suggested Higgsfield or similar. It is the wrong tool for a logo, for
three reasons that are all fatal rather than cosmetic:

- **No alpha channel.** Generative video returns opaque frames. The mark has to
  sit on white in the light header and on navy elsewhere; keying gold against a
  background will chew the bevel edges, which is where all the character is.
- **It will not return to the start pose.** A seamless loop needs frame N+1 to
  be pixel-identical to frame 0. Nothing in an image-to-video model targets
  that, so the loop will jump.
- **It will warp the geometry.** This interlock is intricate and self-occluding.
  Diffusion models drift on exactly this kind of structure — the arms will
  change thickness and count between frames. On a photograph nobody notices; on
  a logo, where the shape is the brand, it reads as broken.

Useful for a mood reference. Not for the final frames.

Photoshop's 3D features are also out — Adobe removed them from recent versions.

---

## The pipeline

### Step 1 — rebuild the mark in 3D (the gating step)

The geometry is parametric and simple: one "N" profile, extruded, four instances
at 90 degrees about the vertical axis. Blender is free and scriptable.

**I can write the Blender script** rather than hand this to a 3D contractor: a
`.py` that builds the mesh from the profile, applies a gold material, and sets
camera and key light to match the existing render's angle. Denis runs it, tweaks
the material to taste, and renders. That is the fastest route from where we are.

The angle and the gold need to match the current artwork closely enough that a
paused frame is indistinguishable from today's logo — otherwise the header
changes appearance even for visitors who never see it move.

### Step 2 — render the frames

- **Rotation:** 90 degrees, ending one step *before* 90 (frame 0 is the 90-degree
  pose, so rendering it again would double it and stutter).
- **Count:** 36 frames. At a 24-second full revolution that is a 6-second
  quarter turn at 6fps — slow enough that the step rate is invisible on a mark
  this size. Start here; it is one number to change.
- **Size:** the mark renders at roughly 48 CSS px in the header, so 96x96 for
  2x displays. Render at 192x192 and downsample — cheap, and it leaves room if
  the mark is ever used larger.
- **Format:** PNG with straight alpha, numbered `mark-000.png`…

### Step 3 — assemble the sprite sheet

I do this in-repo with Pillow, which is already how the footer tile and CTA
artwork were produced: 36 frames into a 6x6 grid at 96x96 each = 576x576, saved
as lossless WebP with alpha. Expect well under 100KB for a mark this small
against a transparent ground.

Committed to `apps/blog/public/marketing/` alongside the other brand artwork.

### Step 4 — the web side

A `.dl-mark-spin` block in `apps/blog/app/globals.css`, following the idiom the
header's opening sequence and the press marquee already use: pure CSS, no
JavaScript, the whole thing inside `@media (prefers-reduced-motion:
no-preference)` so it is additive.

```
background-image: url('/marketing/nanotom-mark-spin.webp');
background-size: 600% 600%;            /* 6x6 grid */
animation: dl-mark-spin 6s steps(36) infinite;
```

`steps(36)` over a 6x6 grid needs the sheet walked row by row — either one
animation over `background-position` with 36 keyframe stops, or the standard
two-axis trick (a fast `steps(6)` on X nested against a slow `steps(6)` on Y).
The second is fewer lines and the one to reach for.

**Reduced motion gets a static frame**, which is the current logo — the rule
simply does not apply, exactly as the opening sequence works today.

`prefers-reduced-motion` aside, this also wants `animation-play-state: paused`
when the tab is hidden if the CPU cost shows up; a stepped background-position
is cheap, so measure before adding it.

---

## Files

- `apps/blog/public/marketing/nanotom-mark-spin.webp` — new, the sprite sheet.
- `apps/blog/public/marketing/nanotom-capital-wordmark.png` — new, the lockup
  with the mark cut off, so the header can place the two independently.
- `apps/blog/components/marketing/daylight/site-header.tsx` — the Wordmark
  block currently renders one `next/image` of the whole lockup. It becomes the
  spinning mark element plus the wordmark image, in a flex row that reproduces
  the lockup's spacing. Keep `dl-headmark` on the link — the opening sequence
  relies on it.
- `apps/blog/app/globals.css` — the `.dl-mark-spin` block, next to the header
  sequence it belongs with.
- `apps/blog/components/marketing/brand.ts` — a `LOCAL_IMAGES` entry for each
  new asset, with the provenance note the others carry.

The dark site's header (`components/marketing/site-header.tsx`) is deliberately
untouched, per the standing rule in this project. Say the word and it is the
same change.

---

## Verification

1. **The loop is seamless**: screenshot the mark at t=0 and t=6000ms with
   Playwright and diff the two images. They must be pixel-identical. This is the
   one test that matters and it is objective — if the render's symmetry is off,
   this catches it before Denis has to squint at it.
2. **The step rate reads as smooth**: capture frames across one loop and check
   the rotation is monotonic with no repeated or skipped pose.
3. **Paused state matches today's logo**: screenshot the header under
   `reducedMotion: 'reduce'` and compare against the current header screenshot.
   The mark should sit at the same size and angle as the static lockup does now.
4. **The opening sequence still works**: re-run the existing frame-by-frame
   check — the bar must stay one height, and the mark must not move within it.
5. `pnpm test`, `pnpm typecheck`, a Capital build, and the contrast sweep.

---

## One thing to flag

The mark's geometry is the Nintendo 64 logo — four extruded Ns interlocking at
90 degrees is that mark's exact construction. It is already the Nanotom brand
and it is already on the live site, so nothing here creates a new situation.

But this plan does two things that raise its prominence: it models that geometry
from scratch, and it makes it the moving centrepiece of the header. If that has
not been run past a trademark lawyer, this is the moment to do it, before the
modelling work is paid for. I am not the right source for that opinion; I am
flagging it because the timing is good, not because I think it is necessarily a
problem.

---

## Not doing

- No placeholder spin. Denis asked to wait for real frames, so nothing ships
  until they exist.
- Not touching the footer, the favicon, or the Labs header.
- Not using alpha video (two codecs — VP9-alpha for Chrome/Firefox, HEVC-alpha
  for Safari — plus autoplay policy and a decoder, for a 48px mark) or
  three.js/model-viewer (a WebGL runtime in the root layout, on every route
  including the blog). Both are defensible if the mark ever becomes a hero
  element. Neither is defensible as header chrome.
