# NOIR CAFÉ — scroll-driven 3D café

React + Vite + React Three Fiber + Drei + GSAP ScrollTrigger + Lenis.

```bash
npm install
npm run check:path   # samples the camera spline against wall/furniture boxes
npm run dev
```

## Structure
- `src/scene/layout.js` — room extents, camera waypoints, furniture positions, collision boxes
- `src/scene/Rooms.jsx` — façade, all five rooms, lights
- `src/scene/Architecture.jsx` — walls with real arched openings, glass, partitions
- `src/scene/Furniture.jsx`, `Plants.jsx` — chairs, tables, sofas, counter, trees (all procedural)
- `src/scene/textures.js`, `materials.js` — procedural limestone / travertine / marble / walnut / fabric PBR maps
- `src/scene/CameraRig.jsx` — spline camera driven by scroll progress (damped)

## Upgrades
- Post-processing (AO + bloom + ACES) is now on by default on desktop; add `?nofx` to disable.
- Dust motes (`Atmosphere.jsx`), mouse parallax + breathing camera, film grain.
- Room nav rail (click) and ← → / PageUp / PageDown to jump between rooms (`ROOM_U` in `layout.js`).
- Loader progress bar and a Reserve CTA on the finale (change the `mailto:` in `App.jsx`).

- Per-room cinematic title reveal + 3D flip menu cards (`MENUS` in `layout.js`, click a card to flip).
- Scroll length doubled (7000vh desktop / 4600vh mobile); glossy clearcoat marble/walnut, god rays in the garden, steam at the coffee bar.

- **Smoothness:** adaptive quality (`PerformanceMonitor` in `Scene.jsx`: AO+bloom → bloom → plain, DPR auto-scales and recovers), no scrub lag, lighter CSS (no backdrop blur over WebGL), fewer lights.
- **Auto tour** (cinematic autoplay, any scroll/key stops it), synthesised ambient **sound** toggle, top progress bar.

- **Day / Night** toggle (`mood.js`, `Mood` in `Scene.jsx`): sky, fog, env light, lamps and emissive glow blend smoothly.
- **Real GLB models:** `public/models/chair.glb` (Khronos *SheenChair*, CC-BY 4.0 © Wayfair) is instanced for every chair. Add `public/models/plant.glb` and every tree/plant switches to it (scaled to the tree's height). Missing file = procedural fallback.
- **Reservation form** (`Reserve.jsx`): validation, reference code, saved to `localStorage`, add-to-calendar `.ics`. To go live, POST `booking` to your backend/WhatsApp/email service in `submit`.

- Every menu card has a **Reserve here** button that opens the booking form with that room pre-selected.
- **Plant models:** Poly Haven / Kenney / Quaternius (CC0), Sketchfab (check licence). Convert to one `.glb` (`npx @gltf-transform/cli optimize in.glb plant.glb`), keep it under ~5 MB, save as `public/models/plant.glb`.

- **Cinematic intro:** letterbox bars open, title reveals letter by letter, camera dollies in from far away on **Enter** (or *Enter with sound ♪*). Scroll is locked until then.
- Tools (bottom-right): ⚡ Lite mode, ⛶ fullscreen, ◻ hide UI for clean cinematic viewing. WhatsApp share on the booking confirmation.

- **Table-to-table tour:** the camera stops at every table (T1–T6 hall, T7 private, G1–G4 garden); `TABLES` + `WAYPOINTS` in `layout.js`.
- **Live table tags (3D):** each table shows Free / Reserved / Seated; up close it also shows guest name, seats used, time and the pre-ordered menu + total.
- **Reservation form** now picks a specific table (conflict-checked by date + time, seat limit) and supports menu pre-orders.
- **Owner dashboard** (🔑 bottom-right, demo PIN `1234` in `Owner.jsx`): see tables today, mark Seated, **Free table** (tag flips back to Free), delete. Seed demo bookings appear on first run.
- **Storage:** `bookings.js` uses localStorage and syncs live between tabs/windows of the same browser. For customers and owner on different devices, replace its read/save with calls to your backend.
- **4DX menu:** props (cups, glasses, plates, cakes, chai pots) spring out beside each flipped menu card with steam; hover a menu line to enlarge/spin that dish (desktop only).

## Tuning
- Scroll length: `.scroll-track` height in `styles.css`.
- Pacing: waypoint spacing in `layout.js` (closer = slower).
- Quality: `quality.js` (leaf count, texture size, post-processing, light count on mobile).

## Owner Studio upgrade
- Open the key icon in the bottom-right controls to access the Owner Studio (demo PIN `1234`).
- **Menu manager:** select any of the five room menus, add items, edit item names/descriptions/prices, remove items, or restore the original menus.
- Menu changes are stored in this browser's `localStorage` and update the visible 3D menu cards and reservation pre-order options immediately. They do not sync across different devices or browsers without a backend.
- **All seats:** inventory view includes every bookable table and its capacity; overview shows today's status.
- **Reservations:** mark guests seated, free a table, or delete a booking.
- The demo PIN is client-side only and is not secure authentication. Before accepting real customer bookings, use a backend/database and server-side owner authentication.
