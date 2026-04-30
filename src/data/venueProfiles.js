/**
 * Mock multi-source venue profiles — 16-dimensional signal vectors.
 *
 * Each venue has a vector built from signals that would come from:
 *   Google Places (rating, price, hours, noise), aggregated reviews,
 *   Resident Advisor / Dice listings, and structured observable facts.
 *
 * Dimensions (all 0–1):
 *  [0]  music_curation  — quality / curatorial reputation of programming
 *  [1]  energy          — overall energy level
 *  [2]  dance           — dance-floor focus
 *  [3]  late_night      — how late it goes  (midnight=0, 6am+=1)
 *  [4]  underground     — underground / alternative  (mainstream=0)
 *  [5]  electronic      — techno / house / electronic affinity
 *  [6]  rnb_hiphop      — R&B / hip-hop affinity
 *  [7]  jazz_world      — jazz / world / experimental affinity
 *  [8]  live_music      — live bands vs DJ sets  (DJs=0, live=1)
 *  [9]  queer           — LGBTQ+ space / focus
 *  [10] intimate        — small & intimate  (large=0, intimate=1)
 *  [11] outdoor         — meaningful outdoor space
 *  [12] exclusive       — cover / strict door / dress code
 *  [13] chill           — relaxed vibe  (intense club=0, chill=1)
 *  [14] diverse         — inclusive / diverse crowd
 *  [15] local           — neighborhood local  (destination venue=0)
 *
 * Mock composite text represents what a real multi-source aggregation
 * would produce — used as the input for real embeddings when you're ready.
 */

export const VENUE_PROFILES = {
  v1: {
    composite: 'Nowadays Queens: Underground outdoor/indoor venue, legendary Funktion-One sound system. Techno, house, experimental. Closes 6am+. Cover $10-25. Google 4.4/5. Review themes: best sound in NYC, queer-friendly, beautiful outdoor space, dedicated music crowd, never feels like a regular club. RA: consistent underground bookings, residents + international guests. Capacity large. Dress code: none.',
    vec: [0.95, 0.85, 0.90, 1.00, 0.95, 0.85, 0.05, 0.10, 0.05, 0.70, 0.35, 0.85, 0.40, 0.20, 0.75, 0.20],
  },
  v2: {
    composite: 'Elsewhere Brooklyn: Three-stage (Hall, Loft, Roof). House, techno, indie dance. Closes 4am. Cover $15-30. Google 4.3/5. Review themes: rooftop is a vibe, great lineups, young Bushwick crowd, can get crowded, solid sound in Hall. RA: regular bookings across electronic spectrum. Capacity large. Dress code: none.',
    vec: [0.90, 0.85, 0.85, 0.90, 0.75, 0.75, 0.15, 0.05, 0.10, 0.50, 0.40, 0.50, 0.35, 0.25, 0.65, 0.20],
  },
  v3: {
    composite: 'Good Room Brooklyn: Intimate no-phone dance club, world-class sound system, dark focused atmosphere. House, disco, techno. Closes 6am. Cover $15-25. Google 4.5/5. Review themes: best dance floor in Brooklyn, strict no-phone rule, serious dancers only, incredible sound, intimate and intense. RA: curated disco and house bookings. Capacity small. Dress code: none.',
    vec: [0.95, 0.85, 0.95, 1.00, 0.90, 0.85, 0.05, 0.05, 0.05, 0.40, 0.95, 0.00, 0.45, 0.10, 0.60, 0.25],
  },
  v4: {
    composite: 'Superchief Gallery Bar LES: Art gallery meets dive bar. Indie, punk, hip-hop. Closes 2am. Cover $0-10. Google 4.1/5. Review themes: wild themed nights, friendly weird crowd, cheap drinks, great art on walls, anything goes. Live music frequent. Capacity small-medium. Very casual.',
    vec: [0.70, 0.80, 0.65, 0.60, 0.65, 0.10, 0.30, 0.10, 0.60, 0.30, 0.70, 0.00, 0.10, 0.55, 0.55, 0.60],
  },
  v5: {
    composite: 'Schimanski Williamsburg: High-end club, internationally booked DJs. Techno, house, bass. Closes 6am. Cover $20-40. Google 4.2/5. Review themes: insane sound system, great production, bottle service available, can feel mainstream, strong lineup. RA: regular international bookings. Capacity large. Smart casual dress.',
    vec: [0.85, 0.90, 0.90, 1.00, 0.70, 0.85, 0.05, 0.05, 0.05, 0.35, 0.20, 0.00, 0.65, 0.10, 0.55, 0.10],
  },
  v6: {
    composite: 'Jupiter Disco Bushwick: Queer-owned, cozy disco bar, underground DJs. Disco, house, funk. Closes 4am. Cover $5-15. Google 4.6/5. Review themes: most welcoming bar in Brooklyn, incredible disco sets, LGBTQ+ safe space, small and intimate, always good vibes. Capacity small. No dress code.',
    vec: [0.90, 0.80, 0.85, 0.90, 0.85, 0.70, 0.15, 0.10, 0.05, 0.90, 0.75, 0.10, 0.25, 0.30, 0.85, 0.40],
  },
  v7: {
    composite: "Baby's All Right Williamsburg: Bar + live music venue, eclectic bookings, good sound. Indie, pop, R&B, electronic. Closes 2am. Cover $10-20. Google 4.3/5. Review themes: great for live shows, nice bar area, solid sound, Williamsburg staple, intimate for live music. Capacity medium. Casual.",
    vec: [0.75, 0.70, 0.65, 0.50, 0.50, 0.20, 0.30, 0.10, 0.75, 0.30, 0.60, 0.00, 0.20, 0.55, 0.55, 0.55],
  },
  v8: {
    composite: 'Nublu East Village: NYC institution, jazz and global sounds since 2002. Jazz, Afrobeat, Latin, world music. Closes 2am. Cover $0-15. Google 4.5/5. Review themes: magical intimate atmosphere, best jazz bar in NYC, diverse international crowd, unpretentious, cultural gem. Live music nightly. Capacity small. Casual.',
    vec: [0.95, 0.70, 0.65, 0.50, 0.80, 0.05, 0.25, 0.90, 0.85, 0.40, 0.85, 0.00, 0.20, 0.45, 0.80, 0.45],
  },
  v9: {
    composite: 'The Sultan Room Bushwick: Rooftop bar + indoor venue. Indie, funk, hip-hop, electronic. Closes 2am. Cover $10-15. Google 4.2/5. Review themes: rooftop views are great, good discovery programming, neighborhood feel, mixed crowd, solid bookings. Live music and DJs. Capacity medium. Casual.',
    vec: [0.80, 0.70, 0.65, 0.50, 0.65, 0.25, 0.35, 0.15, 0.70, 0.35, 0.45, 0.70, 0.20, 0.55, 0.65, 0.45],
  },
  v10: {
    composite: 'Midnight Rider LES: Country bar in NYC, line dancing lessons, live country acts. Country, Americana, outlaw country. Closes 2am. Cover $0-10. Google 4.3/5. Review themes: surprisingly great dancing, welcoming to beginners, NYC transplant crowd, fun and campy, great whiskey. Capacity medium. Casual.',
    vec: [0.80, 0.80, 0.85, 0.50, 0.30, 0.00, 0.05, 0.05, 0.75, 0.25, 0.55, 0.00, 0.20, 0.35, 0.55, 0.35],
  },
  v11: {
    composite: 'Roulette Intermedium Boerum Hill: Premier experimental and avant-garde music venue. Experimental, classical, electronic, jazz. Evenings, varies. Cover $15-30. Google 4.7/5. Review themes: world-class experimental programming, serious music lovers only, stunning space, transformative experiences, not for casual listeners. Concert-format seating. Formal-casual.',
    vec: [0.99, 0.45, 0.25, 0.25, 0.90, 0.10, 0.05, 0.90, 0.95, 0.30, 0.80, 0.00, 0.15, 0.65, 0.65, 0.35],
  },
  v12: {
    composite: 'House of Yes Bushwick: Circus-themed immersive nightlife, aerialists, performers, themed nights. House, techno, pop. Closes 4am. Cover $20-40. Google 4.4/5. Review themes: unlike anywhere else, costume culture encouraged, queer-friendly, high energy performance, can feel touristy but fun. Capacity medium-large. Costume encouraged.',
    vec: [0.75, 0.95, 0.85, 0.90, 0.60, 0.65, 0.15, 0.05, 0.30, 0.75, 0.45, 0.00, 0.50, 0.20, 0.85, 0.20],
  },
  v13: {
    composite: 'Sundown Bar Crown Heights: Low-key neighborhood dive, killer jukebox, occasional DJ nights. Hip-hop, R&B, soul, funk. Closes 2am. Cover $0. Google 4.1/5. Review themes: real Crown Heights spot, cheap drinks, locals only feel, laid-back, no attitude. Capacity small. Very casual.',
    vec: [0.70, 0.65, 0.60, 0.40, 0.55, 0.05, 0.75, 0.15, 0.10, 0.25, 0.75, 0.00, 0.05, 0.75, 0.70, 0.85],
  },
  v14: {
    composite: 'Lovers Rock NYC Bed-Stuy: Reggae, dancehall and Caribbean sounds, one of Brooklyn\'s best dance floors. Reggae, dancehall, Afrobeats, soca. Closes 4am. Cover $10-20. Google 4.5/5. Review themes: best reggae spot in NYC, incredible dancing, Caribbean community hub, welcoming and joyful, authentic. Capacity medium. Casual.',
    vec: [0.90, 0.85, 0.95, 0.80, 0.80, 0.05, 0.30, 0.15, 0.40, 0.45, 0.55, 0.00, 0.15, 0.25, 0.85, 0.40],
  },
  v15: {
    composite: 'Berlin East Village: Tiny underground basement under 2A bar. Techno, house, minimal. Closes 6am+. Cover $0-10. Google 4.3/5. Review themes: sweaty underground gem, intense techno, serious crowd, no frills, legendary in underground circles, extremely small. RA: regular underground bookings. Capacity very small. Very casual.',
    vec: [0.85, 0.85, 0.90, 1.00, 0.95, 0.90, 0.05, 0.05, 0.05, 0.45, 0.99, 0.00, 0.35, 0.10, 0.55, 0.35],
  },
  v16: {
    composite: 'Peculier Pub Greenwich Village: 700+ beers on menu, casual pub, occasional acoustic sets. Folk, acoustic, indie. Closes 2am. No cover. Google 4.0/5. Review themes: amazing beer selection, tourist-friendly, relaxed atmosphere, good for groups, nothing special musically. Capacity medium. Very casual.',
    vec: [0.55, 0.45, 0.30, 0.40, 0.20, 0.05, 0.10, 0.20, 0.50, 0.20, 0.55, 0.15, 0.05, 0.90, 0.55, 0.60],
  },
  v17: {
    composite: 'The Django Tribeca: Upscale jazz supper club in a basement speakeasy-style space. Jazz, soul, blues. Closes 1am. Cover $20-35 or min spend. Google 4.6/5. Review themes: beautiful space, exceptional live jazz, great for dates or impressing clients, pricey but worth it, professional crowd. Live music nightly. Smart casual required.',
    vec: [0.90, 0.55, 0.40, 0.25, 0.40, 0.05, 0.10, 0.90, 0.95, 0.20, 0.75, 0.00, 0.60, 0.65, 0.55, 0.30],
  },
  v18: {
    composite: "C'mon Everybody Crown Heights: Intimate neighborhood venue, thoughtful indie/hip-hop bookings. Indie, hip-hop, experimental, R&B. Closes 2am. Cover $10-15. Google 4.4/5. Review themes: best small venue in Brooklyn, smart programming, neighborhood feel, great sound for the size, music-forward crowd. Capacity small. Casual.",
    vec: [0.85, 0.70, 0.65, 0.45, 0.80, 0.20, 0.45, 0.25, 0.65, 0.40, 0.80, 0.00, 0.20, 0.55, 0.70, 0.55],
  },
  v19: {
    composite: 'Mood Ring Bushwick: Colorful queer bar, DJs, dancing, vibrant community. Pop, house, R&B, hip-hop. Closes 2am. Cover $0-10. Google 4.4/5. Review themes: most inclusive bar in Brooklyn, amazing queer space, fun DJs, colorful and joyful, all ages welcome. Capacity medium. Very casual.',
    vec: [0.75, 0.80, 0.80, 0.45, 0.65, 0.30, 0.50, 0.05, 0.10, 0.90, 0.65, 0.15, 0.10, 0.40, 0.95, 0.55],
  },
  v20: {
    composite: 'Bossa Nova Civic Club Bushwick: Basement techno club, underground loyalists. Techno, industrial, noise, experimental. Closes 6am. Cover $10-20. Google 4.3/5. Review themes: most underground club in NYC, serious techno only, dark and sweaty, not for the faint-hearted, legendary basement. RA: heavy bookings. Capacity small. Very casual.',
    vec: [0.95, 0.80, 0.85, 1.00, 0.99, 0.95, 0.05, 0.10, 0.05, 0.50, 0.90, 0.00, 0.30, 0.15, 0.60, 0.20],
  },
  v21: {
    composite: 'Trophy Bar Bushwick: Classic dive bar, unexpectedly good DJ nights, pool table. Hip-hop, soul, R&B, indie. Closes 4am. No cover. Google 4.1/5. Review themes: no attitude, cheap drinks, great DJs on weekends, Bushwick staple, unpretentious mixed crowd. Capacity medium. Very casual.',
    vec: [0.65, 0.65, 0.55, 0.55, 0.55, 0.15, 0.50, 0.10, 0.15, 0.30, 0.70, 0.00, 0.05, 0.70, 0.55, 0.75],
  },
  v22: {
    composite: 'The Lot Radio Greenpoint: Outdoor container bar with live radio stream. Eclectic, house, jazz, ambient. Closes midnight. No cover. Google 4.5/5. Review themes: community radio gem, dog-friendly, great for afternoon sessions, diverse eclectic sets, neighborhood treasure, very low-key. Capacity small. Very casual.',
    vec: [0.85, 0.55, 0.50, 0.35, 0.80, 0.40, 0.15, 0.35, 0.20, 0.40, 0.55, 0.95, 0.05, 0.75, 0.75, 0.60],
  },
  v23: {
    composite: 'Luckydog Williamsburg: Super low-key Bedford Ave dive, pinball, darts, DJ on weekends. Indie, punk, classic rock. Closes 4am. No cover. Google 3.9/5. Review themes: true dive bar, cheap, no pretense, Bedford Ave institution, not a destination but a reliable local spot. Capacity small. Very casual.',
    vec: [0.55, 0.55, 0.45, 0.55, 0.45, 0.20, 0.20, 0.05, 0.10, 0.25, 0.75, 0.00, 0.05, 0.90, 0.60, 0.80],
  },
  v24: {
    composite: 'Syndicated BK Bushwick: Bar, restaurant and movie theater in one. Eclectic, indie, soul. Closes 2am. No cover (film tickets extra). Google 4.3/5. Review themes: perfect date night, great concept, decent food, film selection is good, not a nightlife destination. Capacity medium. Casual.',
    vec: [0.65, 0.55, 0.45, 0.35, 0.40, 0.10, 0.20, 0.20, 0.10, 0.30, 0.60, 0.00, 0.15, 0.75, 0.65, 0.55],
  },
  v25: {
    composite: 'Cobra Club Bushwick: Natural wine bar, legendary backyard, local DJs. House, soul, indie, eclectic. Closes 2am. No cover. Google 4.4/5. Review themes: best backyard in Bushwick, great natural wine list, relaxed but great music, creative class regulars, discovery programming. Capacity small-medium. Casual.',
    vec: [0.80, 0.65, 0.65, 0.35, 0.75, 0.35, 0.20, 0.15, 0.10, 0.40, 0.60, 0.70, 0.10, 0.65, 0.70, 0.60],
  },
};

/**
 * Seed artist signal vectors — same 16 dimensions.
 * Represents what kind of venue experience a fan of this artist tends to want.
 */
export const ARTIST_PROFILES = {
  'Peggy Gou':        [0.90, 0.85, 0.90, 1.00, 0.85, 0.85, 0.05, 0.05, 0.05, 0.70, 0.60, 0.00, 0.40, 0.20, 0.75, 0.00],
  'Four Tet':         [0.92, 0.65, 0.70, 0.80, 0.88, 0.70, 0.10, 0.30, 0.10, 0.40, 0.75, 0.00, 0.30, 0.45, 0.70, 0.00],
  'Kaytranada':       [0.90, 0.85, 0.90, 0.80, 0.70, 0.60, 0.55, 0.05, 0.05, 0.60, 0.60, 0.00, 0.30, 0.25, 0.80, 0.00],
  'Fred Again..':     [0.90, 0.80, 0.85, 0.90, 0.80, 0.80, 0.10, 0.15, 0.05, 0.50, 0.65, 0.00, 0.35, 0.30, 0.70, 0.00],
  'Mk.gee':           [0.85, 0.55, 0.50, 0.50, 0.75, 0.10, 0.45, 0.20, 0.70, 0.35, 0.80, 0.00, 0.20, 0.65, 0.65, 0.00],
  'SZA':              [0.80, 0.65, 0.65, 0.50, 0.40, 0.05, 0.80, 0.10, 0.40, 0.40, 0.60, 0.00, 0.20, 0.50, 0.75, 0.00],
  'Bad Bunny':        [0.80, 0.90, 0.90, 0.70, 0.40, 0.10, 0.50, 0.05, 0.30, 0.50, 0.60, 0.00, 0.30, 0.20, 0.80, 0.00],
  'Amaarae':          [0.85, 0.75, 0.75, 0.70, 0.70, 0.25, 0.65, 0.15, 0.25, 0.60, 0.60, 0.00, 0.25, 0.40, 0.85, 0.00],
  'Floating Points':  [0.95, 0.70, 0.75, 0.80, 0.90, 0.70, 0.05, 0.45, 0.15, 0.40, 0.70, 0.00, 0.35, 0.40, 0.65, 0.00],
  'Bonobo':           [0.90, 0.60, 0.65, 0.60, 0.75, 0.40, 0.10, 0.45, 0.30, 0.30, 0.70, 0.00, 0.25, 0.55, 0.65, 0.00],
  'Chris Lake':       [0.85, 0.90, 0.90, 1.00, 0.65, 0.90, 0.05, 0.05, 0.05, 0.40, 0.50, 0.00, 0.50, 0.15, 0.55, 0.00],
  'Daniel Avery':     [0.90, 0.80, 0.85, 1.00, 0.90, 0.90, 0.05, 0.10, 0.05, 0.40, 0.75, 0.00, 0.40, 0.20, 0.55, 0.00],
  'Sango':            [0.85, 0.75, 0.80, 0.70, 0.70, 0.30, 0.60, 0.15, 0.10, 0.50, 0.65, 0.00, 0.25, 0.40, 0.80, 0.00],
  'Jorja Smith':      [0.85, 0.60, 0.60, 0.50, 0.55, 0.05, 0.85, 0.10, 0.40, 0.35, 0.65, 0.00, 0.15, 0.65, 0.70, 0.00],
  'Kenny Beats':      [0.85, 0.80, 0.70, 0.60, 0.65, 0.20, 0.80, 0.05, 0.20, 0.35, 0.60, 0.00, 0.25, 0.40, 0.70, 0.00],
  'Sudan Archives':   [0.90, 0.70, 0.70, 0.60, 0.80, 0.20, 0.65, 0.25, 0.55, 0.55, 0.70, 0.00, 0.25, 0.45, 0.80, 0.00],
  'Kelela':           [0.90, 0.75, 0.80, 0.80, 0.80, 0.50, 0.70, 0.10, 0.10, 0.65, 0.65, 0.00, 0.35, 0.35, 0.80, 0.00],
  'Jamie xx':         [0.90, 0.75, 0.85, 0.80, 0.80, 0.75, 0.10, 0.15, 0.10, 0.45, 0.70, 0.00, 0.35, 0.30, 0.65, 0.00],
  'Yaeji':            [0.90, 0.70, 0.80, 0.80, 0.85, 0.70, 0.15, 0.15, 0.10, 0.65, 0.75, 0.00, 0.35, 0.35, 0.75, 0.00],
  'Arooj Aftab':      [0.95, 0.40, 0.35, 0.30, 0.85, 0.05, 0.10, 0.90, 0.85, 0.30, 0.90, 0.00, 0.20, 0.75, 0.70, 0.00],
  'Tyla':             [0.80, 0.85, 0.90, 0.70, 0.50, 0.20, 0.70, 0.10, 0.25, 0.45, 0.55, 0.00, 0.25, 0.25, 0.80, 0.00],
  'Octo Octa':        [0.90, 0.85, 0.90, 1.00, 0.90, 0.85, 0.05, 0.05, 0.05, 0.80, 0.65, 0.00, 0.35, 0.15, 0.80, 0.00],
  'Objekt':           [0.90, 0.80, 0.85, 1.00, 0.95, 0.90, 0.05, 0.15, 0.05, 0.45, 0.75, 0.00, 0.40, 0.20, 0.55, 0.00],
  'Jayda G':          [0.90, 0.80, 0.85, 0.90, 0.80, 0.75, 0.15, 0.10, 0.05, 0.75, 0.65, 0.00, 0.30, 0.25, 0.80, 0.00],
  'Aroha':            [0.85, 0.60, 0.60, 0.50, 0.60, 0.10, 0.70, 0.35, 0.45, 0.35, 0.70, 0.00, 0.15, 0.65, 0.70, 0.00],
};

export const VECTOR_DIMS = [
  'music_curation', 'energy', 'dance', 'late_night', 'underground',
  'electronic', 'rnb_hiphop', 'jazz_world', 'live_music', 'queer',
  'intimate', 'outdoor', 'exclusive', 'chill', 'diverse', 'local',
];
