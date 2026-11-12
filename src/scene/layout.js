// Pure data (no DOM / three imports) so scripts/check-path.mjs can use it.
export const HALF = 10 // building spans x = -10..10, z = +0 .. -78

export const ROOMS = [
  { id: 'entrance', name: 'Entrance & Reception', z0: 0, z1: -10, h: 5.4, side: 'left', show: [0, 1],
    title: 'Step inside.', text: 'Cream limestone, tall arches and a warm glow at the door. The evening starts here.' },
  { id: 'hall', name: 'Main Dining Hall', z0: -10, z1: -30, h: 5.6, side: 'right', show: [0.12, 0.88],
    title: 'The Dining Hall', text: 'Six tables under rings of golden light, with indoor trees rising between rust-coloured chairs.' },
  { id: 'private', name: 'Private Dining Room', z0: -30, z1: -42, h: 4.6, side: 'left', show: [0.18, 0.88],
    title: 'The Private Room', text: 'Behind glass and walnut, one long marble table is set for conversations that run late.' },
  { id: 'coffee', name: 'Coffee Lounge', z0: -42, z1: -54, h: 5, side: 'right', show: [0.12, 0.9],
    title: 'The Coffee Bar', text: 'Travertine, brass and walnut. Every cup begins at this counter.' },
  { id: 'garden', name: 'Garden Lounge', z0: -54, z1: -78, h: 7, side: 'left', show: [0.08, 0.58],
    title: 'The Garden Lounge', text: 'Curved sofas beneath a glass roof, surrounded by olive and tropical green. Stay a while.' },
]
export const FINALE = { title: 'NOIR CAFÉ', text: 'Beyond Coffee. Into Experience.' }

// Camera route. p = camera position, t = look-at target. Spacing between waypoints = speed
// (close together = slow, lingering; far apart = quicker travel).
const stop = (px, pz, tx, tz) => ({ p: [px, 1.65, pz], t: [tx, 1.1, tz] }) // camera stands in the aisle, looks at the table
export const WAYPOINTS = [
  { p: [0, 3.4, 40], t: [0, 3.0, 0] },
  { p: [0, 2.9, 28], t: [0, 3.0, 0] },
  { p: [0, 2.3, 17], t: [0, 2.9, 0] },
  { p: [0, 1.8, 8], t: [0, 2.2, -6] },
  { p: [0, 1.65, 1.5], t: [0, 1.9, -10] },
  { p: [0, 1.65, -4.5], t: [0.5, 1.8, -14] },
  { p: [0, 1.65, -9.5], t: [-0.5, 1.7, -20] },
  // main hall: one stop per table (T1, T2, T4, T3, T5, T6)
  stop(-2.6, -14.4, -5.5, -15), stop(2.6, -14.4, 5.5, -15), stop(2.6, -19.4, 5.5, -20), stop(-2.6, -19.4, -5.5, -20), stop(-2.6, -24.4, -5.5, -25), stop(2.6, -24.4, 5.5, -25),
  { p: [-3, 1.65, -29], t: [-3, 1.6, -38] },
  { p: [-3, 1.65, -33], t: [2.8, 1.2, -36] },
  { p: [-3, 1.65, -37], t: [3.5, 1.3, -37] },
  { p: [-3, 1.65, -41], t: [-2.5, 1.6, -49] },
  { p: [-2.5, 1.65, -44.5], t: [6, 1.5, -48] },
  { p: [-1.5, 1.65, -47.5], t: [7.5, 1.4, -50] },
  { p: [-0.5, 1.65, -51], t: [2, 1.6, -57] },
  { p: [0, 1.65, -54.5], t: [0, 1.9, -62] },
  // garden: one stop per sofa group (G3, G1, G4, G2)
  stop(1.5, -57.5, 6, -58), stop(-1.5, -59.5, -6, -60), stop(1.5, -65.5, 6, -66), stop(-1.5, -68.5, -6, -69),
  { p: [0, 1.9, -71.5], t: [-2, 4.6, -76] },
]

export const HALL_TABLES = [[-5.5, -15], [5.5, -15], [-5.5, -20], [5.5, -20], [-5.5, -25], [5.5, -25]]
export const PRIVATE_TABLE = { c: [2.8, -36], len: 5.2, wid: 1.3 }
export const GARDEN_GROUPS = [
  { c: [-6, -60], rot: Math.PI }, { c: [-6, -69], rot: Math.PI },
  { c: [6, -58], rot: 0 }, { c: [6, -66], rot: 0 },
]

// AABBs [minX, maxX, minZ, maxZ, minY, maxY, label] used by `npm run check:path`
export const OBSTACLES = [
  [-10, -8.2, -0.3, 0.3, 0, 5.4, 'front pier L'], [-3.8, -2.5, -0.3, 0.3, 0, 5.4, 'front pier ML'],
  [2.5, 3.8, -0.3, 0.3, 0, 5.4, 'front pier MR'], [8.2, 10, -0.3, 0.3, 0, 5.4, 'front pier R'],
  [-2.5, -1.2, -0.1, 0.1, 0, 2.6, 'door sidelight L'], [1.2, 2.5, -0.1, 0.1, 0, 2.6, 'door sidelight R'],
  [-10, -3, -10.25, -9.75, 0, 5.6, 'divider 1 L'], [3, 10, -10.25, -9.75, 0, 5.6, 'divider 1 R'],
  [-10, -4.6, -30.25, -29.75, 0, 5.6, 'partition L'], [-1.4, 10, -30.25, -29.75, 0, 5.6, 'partition R'],
  [-10, -4.6, -42.25, -41.75, 0, 5, 'divider 3 L'], [-1.4, 10, -42.25, -41.75, 0, 5, 'divider 3 R'],
  [-10, -2, -54.25, -53.75, 0, 7, 'divider 4 L'], [2, 10, -54.25, -53.75, 0, 7, 'divider 4 R'],
  [-10.3, -9.7, -78, 0, 0, 7, 'wall W'], [9.7, 10.3, -78, 0, 0, 7, 'wall E'],
  [-7.2, -3.8, -8.4, -6.0, 0, 1.2, 'reception desk'],
  ...HALL_TABLES.map(([x, z], i) => [x - 1.5, x + 1.5, z - 1.5, z + 1.5, 0, 1, `hall table ${i + 1}`]),
  [1.3, 4.4, -39.2, -32.8, 0, 1, 'private table'],
  [5.6, 8.4, -53.5, -45.5, 0, 2, 'coffee counter + stools'],
  [-8.8, -3.2, -72, -57, 0, 2, 'garden left sofas'], [3.2, 8.8, -69, -55, 0, 2, 'garden right sofas'],
]

// Scroll progress at the start of each room (first waypoint inside it) — used by the nav rail + keyboard.
const ROOM_OFF = [1.5, 0.5, 1, 1, 1]
export const ROOM_U = ROOMS.map((r, i) => WAYPOINTS.findIndex((w) => w.p[2] <= r.z0 + ROOM_OFF[i]) / (WAYPOINTS.length - 1))

// Every bookable table. Booking status shows on a floating tag above it.
export const TABLES = [
  ...HALL_TABLES.map(([x, z], i) => ({ id: `T${i + 1}`, area: 'Main Dining Hall', p: [x, z], seats: 4 })),
  { id: 'T7', area: 'Private Dining Room', p: PRIVATE_TABLE.c, seats: 12 },
  ...GARDEN_GROUPS.map((g, i) => ({ id: `G${i + 1}`, area: 'Garden Lounge', p: g.c, seats: 5 })),
  { id: 'B1', area: 'Coffee Lounge', p: [7, -49.5], seats: 6 },
]

// 4DX food props shown beside each room's menu card: [shape, colour] per menu item (same order as MENUS items)
export const MENU_PROPS = [
  [['glass', '#e8b04a'], ['glass', '#e9a3b8'], ['glass', '#2a1a10']],
  [['plate', '#f2efe6'], ['plate', '#d8a070'], ['bowl', '#eadba8'], ['plate', '#7a3a22']],
  [['plate', '#7a2a3a'], ['plate', '#f3e8d8'], ['plate', '#6a3a2a'], ['cake', '#2a160d']],
  [['cup', '#2a1710'], ['cup', '#c99a6a'], ['cup', '#3a2014'], ['glass', '#eadcc0']],
  [['cake', '#d9b98a'], ['cake', '#c98a3a'], ['pot', '#8a5a3a'], ['pot', '#b9c98a']],
]

// One 3D flip-card menu per room (same order as ROOMS)
export const MENUS = [
  { kicker: 'On arrival', title: 'Welcome Drinks', note: 'Poured the moment you walk in.',
    items: [['Saffron Cardamom Cooler', 'Kashmiri saffron, green cardamom, soda', '₹280'], ['Rose Pistachio Lassi', 'Hung curd, rose petal, roasted pistachio', '₹260'], ['Nitro Cold Brew', 'Single-origin, velvet foam', '₹320']] },
  { kicker: 'Dinner', title: 'From the Hall', note: 'Wood-fired. Seasonal. Unhurried.',
    items: [['Burrata & Heirloom', 'Basil oil, aged balsamic', '₹680'], ['Wood-fired Sea Bass', 'Charred lemon, fennel, saffron beurre blanc', '₹1,450'], ['Wild Mushroom Risotto', 'Black truffle, parmesan crisp', '₹980'], ['Braised Lamb Shank', 'Slow-cooked 8 hours, jus, polenta', '₹1,650']] },
  { kicker: 'By reservation', title: "Chef's Tasting", note: 'Seven courses. One table. Up to twelve guests.',
    items: [['Smoked Beetroot', 'Whipped goat cheese, walnut', ''], ['Scallop Crudo', 'Yuzu, green apple', ''], ['Duck Breast', 'Cherry, star anise, celeriac', ''], ['Dark Chocolate Sphere', 'Warm salted caramel', '₹4,500 / guest']] },
  { kicker: 'Brewed to order', title: 'The Coffee Bar', note: 'Roasted in small batches, pulled by hand.',
    items: [['Espresso', 'Double shot, cocoa and orange peel', '₹220'], ['Flat White', 'Silky microfoam', '₹280'], ['Pour-over', 'Single-origin, rotating weekly', '₹380'], ['Affogato', 'Vanilla bean gelato, hot espresso', '₹340']] },
  { kicker: 'Slow afternoons', title: 'Garden Sweets & Tea', note: 'Best enjoyed under the glass roof.',
    items: [['Tiramisu', 'Mascarpone, espresso-soaked savoiardi', '₹420'], ['Basque Cheesecake', 'Burnt top, soft centre', '₹460'], ['Masala Chai Pot', 'Assam, ginger, cardamom', '₹260'], ['Jasmine Pearl Tea', 'Hand-rolled, steeped at table', '₹320']] },
]
