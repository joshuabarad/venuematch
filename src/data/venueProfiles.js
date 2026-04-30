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
  v26: {
    composite: 'Pyramid Club East Village: NYC nightlife institution since 1979, birthplace of downtown queer culture. New wave, punk, 80s, electronic. Closes 4am. Cover $10-20. Google 4.2/5. Review themes: historic and irreplaceable, drag legends, queer safe space, campy fun, downtown authenticity. Capacity small-medium. No dress code.',
    vec: [0.75, 0.85, 0.80, 0.85, 0.80, 0.30, 0.10, 0.05, 0.20, 0.90, 0.65, 0.00, 0.25, 0.30, 0.80, 0.40],
  },
  v27: {
    composite: 'Webster Hall East Village: Gilded Age dance palace, five floors, EDM and hip-hop. Closes 5am. Cover $20-40. Google 4.0/5. Review themes: iconic building, touristy but fun, great production, crowded on weekends, mainstream crowd. RA: occasional underground bookings. Capacity very large. Smart casual.',
    vec: [0.60, 0.90, 0.85, 0.95, 0.25, 0.70, 0.35, 0.05, 0.10, 0.40, 0.10, 0.00, 0.60, 0.15, 0.60, 0.10],
  },
  v58: {
    composite: "Therapy NYC Hell's Kitchen: Long-running gay lounge, cozy basement feel, weekly themed events. Pop, house, R&B. Closes 4am. No cover most nights. Google 4.1/5. Review themes: friendly neighborhood vibe, great for a first night out, affordable drinks, welcoming staff, Hell's Kitchen institution. Capacity small-medium. Casual.",
    vec: [0.55, 0.55, 0.45, 0.40, 0.65, 0.15, 0.05, 0.30, 0.70, 0.80, 0.45, 0.00, 0.15, 0.30, 0.65, 0.50],
  },
  v28: {
    composite: 'Niagara Bar East Village: Classic East Village dive, rock and metal jukebox, pool table. Rock, metal, punk. Closes 4am. No cover. Google 3.9/5. Review themes: classic dive, cheap, no attitude, East Village lifers, jukebox is great. Capacity small. Very casual.',
    vec: [0.55, 0.65, 0.45, 0.55, 0.50, 0.10, 0.10, 0.05, 0.10, 0.25, 0.75, 0.00, 0.05, 0.80, 0.55, 0.75],
  },
  v29: {
    composite: 'Zum Schneider East Village: Authentic Bavarian beer hall, German brews, live oompah weekends. Folk, oompah, polka. Closes 1am. No cover. Google 4.2/5. Review themes: feels like Munich, incredible German beer selection, festive and loud, great for groups, liter steins. Capacity medium. Casual.',
    vec: [0.60, 0.70, 0.55, 0.25, 0.15, 0.00, 0.05, 0.30, 0.60, 0.15, 0.55, 0.00, 0.20, 0.55, 0.60, 0.40],
  },
  v30: {
    composite: 'Rue B East Village: Intimate neighborhood jazz bar, live music nightly, no cover. Jazz, blues, soul. Closes 2am. No cover. Google 4.4/5. Review themes: hidden gem, romantic atmosphere, amazing jazz, Avenue B institution, feels like a private party. Live music every night. Capacity very small. Casual.',
    vec: [0.85, 0.60, 0.50, 0.35, 0.70, 0.05, 0.10, 0.85, 0.90, 0.25, 0.95, 0.00, 0.10, 0.65, 0.60, 0.55],
  },
  v31: {
    composite: "Angel's Share East Village: Hidden Japanese whisky speakeasy above a restaurant, no standing, intimate. Jazz, ambient. Closes 2am. No cover. Google 4.6/5. Review themes: best cocktails in NYC, incredibly intimate, strict rules add to charm, Japan-in-NYC, special occasion spot. Capacity very small. Smart casual.",
    vec: [0.80, 0.30, 0.15, 0.30, 0.70, 0.00, 0.05, 0.40, 0.05, 0.15, 0.99, 0.00, 0.45, 0.85, 0.55, 0.25],
  },
  v32: {
    composite: 'Pianos LES: Two-stage Ludlow St institution, two decades of emerging artists. Indie, rock, pop, alternative. Closes 4am. Cover $0-15. Google 4.2/5. Review themes: great for discovering new acts, Ludlow St anchor, long bar, upstairs gets sweaty, LES staple. Live music nightly. Capacity medium. Casual.',
    vec: [0.80, 0.75, 0.65, 0.55, 0.65, 0.20, 0.20, 0.10, 0.80, 0.30, 0.60, 0.00, 0.15, 0.45, 0.60, 0.50],
  },
  v33: {
    composite: 'Mercury Lounge LES: Legendary 250-cap rock venue on Houston, serious music crowd. Indie rock, alternative, punk. Closes 2am. Cover $12-20. Google 4.5/5. Review themes: perfect room for live music, incredible sightlines, serious sound, bands that go on to fill bigger rooms, LES institution. Capacity small. Casual.',
    vec: [0.88, 0.75, 0.60, 0.40, 0.70, 0.15, 0.15, 0.10, 0.95, 0.30, 0.80, 0.00, 0.20, 0.40, 0.60, 0.45],
  },
  v34: {
    composite: "Arlene's Grocery LES: Rock club known for Monday Rock and Roll Karaoke, raw and beloved. Rock, punk, indie, metal. Closes 4am. Cover $5-15. Google 4.1/5. Review themes: Rock Karaoke is legendary, great for live bands, feels unfiltered, LES classic, sweat and rock. Capacity small. Very casual.",
    vec: [0.70, 0.80, 0.65, 0.55, 0.65, 0.10, 0.15, 0.05, 0.85, 0.25, 0.70, 0.00, 0.10, 0.45, 0.60, 0.45],
  },
  v35: {
    composite: 'Rockwood Music Hall LES: Three-stage venue, no-cover Stage 1, emerging folk/indie/jazz artists nightly. Folk, Americana, indie, jazz. Closes 2am. Cover $0-15. Google 4.6/5. Review themes: best discovery venue in NYC, Stage 1 is a gift, singer-songwriters at their rawest, LES gem, intimate and genuine. Capacity small to medium. Casual.',
    vec: [0.88, 0.60, 0.50, 0.35, 0.70, 0.10, 0.15, 0.40, 0.95, 0.25, 0.85, 0.00, 0.10, 0.60, 0.65, 0.40],
  },
  v36: {
    composite: "Mehanata Bulgarian Bar LES: NYC's only Bulgarian bar, Balkan music and dancing, vodka coffin. Balkan, folk, electronic, world. Closes 4am. Cover $5-10. Google 4.3/5. Review themes: most fun weird bar in NYC, Eastern European crowd, incredible dancing, nobody is too cool, absolute blast. Capacity small-medium. Very casual.",
    vec: [0.75, 0.85, 0.80, 0.80, 0.55, 0.25, 0.10, 0.40, 0.50, 0.35, 0.60, 0.00, 0.15, 0.30, 0.85, 0.30],
  },
  v37: {
    composite: 'Brooklyn Bowl Williamsburg: 16 bowling lanes, top-tier music bookings, Blue Ribbon fried chicken. Hip-hop, indie, electronic, soul. Closes 2am. Cover $15-30 (shows). Google 4.3/5. Review themes: great for groups, impressive lineups, food is surprisingly good, unique NYC experience, can get pricey. Capacity large. Casual.',
    vec: [0.75, 0.80, 0.70, 0.50, 0.40, 0.20, 0.40, 0.10, 0.70, 0.35, 0.35, 0.00, 0.30, 0.40, 0.65, 0.30],
  },
  v38: {
    composite: 'Union Pool Williamsburg: Converted pool supply store, outdoor taco truck, fire pit. Indie, country, folk, punk. Closes 4am. No cover. Google 4.1/5. Review themes: best outdoor space in Williamsburg, taco truck is essential, relaxed vibe, dive bar soul, Williamsburg anchor. Capacity medium-large. Very casual.',
    vec: [0.70, 0.65, 0.55, 0.55, 0.55, 0.10, 0.15, 0.10, 0.50, 0.35, 0.50, 0.80, 0.05, 0.65, 0.65, 0.60],
  },
  v39: {
    composite: 'Rough Trade NYC Williamsburg: London record shop with 250-cap live venue. Indie, electronic, post-punk, experimental. Closes 11pm. Cover $10-25. Google 4.5/5. Review themes: vinyl selection is world-class, intimate shows, music-obsessive staff, in-stores are special, Williamsburg destination. Live music and in-store events. Casual.',
    vec: [0.92, 0.60, 0.55, 0.20, 0.80, 0.35, 0.10, 0.15, 0.85, 0.35, 0.70, 0.00, 0.25, 0.55, 0.65, 0.30],
  },
  v40: {
    composite: "Pete's Candy Store Williamsburg: Converted candy store, tiny back performance room, free shows. Folk, indie, acoustic, Americana. Closes 2am. No cover. Google 4.5/5. Review themes: most charming bar in Williamsburg, spelling bees and bingo are perfect, free shows unbeatable, true neighborhood gem, intimate and warm. Capacity very small. Very casual.",
    vec: [0.78, 0.45, 0.35, 0.30, 0.65, 0.05, 0.10, 0.25, 0.80, 0.30, 0.95, 0.00, 0.00, 0.85, 0.65, 0.70],
  },
  v41: {
    composite: 'Maison Premiere Williamsburg: New Orleans oyster bar, absinthe service, lush garden, James Beard Award bar. Jazz, blues, ambient. Closes 2am. No cover. Google 4.5/5. Review themes: most beautiful bar in Brooklyn, absinthe selection unrivaled, garden is magical, French Quarter teleportation, expensive but worth it. Capacity medium. Smart casual.',
    vec: [0.75, 0.50, 0.35, 0.30, 0.45, 0.05, 0.05, 0.55, 0.20, 0.25, 0.65, 0.60, 0.45, 0.75, 0.55, 0.30],
  },
  v42: {
    composite: 'Diamond Greenpoint: Dark cocktail bar, rotating underground DJs, excellent back bar. House, disco, soul, indie. Closes 4am. No cover. Google 4.3/5. Review themes: best cocktails in Greenpoint, DJ programming is great, dark and sexy atmosphere, neighborhood regulars and visitors mix well, late nights done right. Capacity small. Casual.',
    vec: [0.78, 0.70, 0.65, 0.55, 0.70, 0.40, 0.20, 0.10, 0.10, 0.35, 0.65, 0.00, 0.15, 0.55, 0.65, 0.55],
  },
  v43: {
    composite: 'Black Rabbit Greenpoint: Classic neighborhood pub, solid beer selection, pool table, Polish community. Indie, rock, folk. Closes 2am. No cover. Google 4.1/5. Review themes: true local bar, unpretentious, Polish regulars alongside the new Greenpoint crowd, comfortable and honest. Capacity small. Very casual.',
    vec: [0.45, 0.50, 0.35, 0.35, 0.30, 0.05, 0.10, 0.10, 0.10, 0.20, 0.70, 0.00, 0.05, 0.90, 0.65, 0.80],
  },
  v44: {
    composite: 'Archestratus Books+Films Greenpoint: Food bookshop with cinema and intimate event space. Folk, acoustic, classical, ambient. Evenings, varies. Cover varies. Google 4.7/5. Review themes: most special small venue in Brooklyn, screenings are beautifully curated, community feel, literary and cinematic, a true cultural gem. Capacity very small. Casual.',
    vec: [0.80, 0.30, 0.20, 0.20, 0.75, 0.05, 0.05, 0.40, 0.70, 0.25, 0.99, 0.00, 0.15, 0.85, 0.70, 0.60],
  },
  v45: {
    composite: 'Café Erzulie Crown Heights: Haitian-inspired Caribbean cultural hub, live music and DJ sets. Afrobeats, soca, reggae, world. Closes 2am. Cover varies. Google 4.5/5. Review themes: Crown Heights community heart, beautiful space, Caribbean culture celebrated, welcoming and joyful, events always thoughtful. Capacity small-medium. Casual.',
    vec: [0.82, 0.70, 0.70, 0.40, 0.70, 0.10, 0.40, 0.30, 0.60, 0.40, 0.65, 0.20, 0.15, 0.50, 0.90, 0.65],
  },
  v46: {
    composite: 'Mixtape Crown Heights: Intimate hip-hop and R&B bar, expertly curated DJ programming. Hip-hop, R&B, soul, funk. Closes 3am. Cover $0-10. Google 4.4/5. Review themes: best hip-hop bar in Brooklyn, feels like a private party, DJs actually know music, Crown Heights hidden gem, inclusive and joyful. Capacity small. Casual.',
    vec: [0.85, 0.75, 0.78, 0.60, 0.75, 0.05, 0.85, 0.10, 0.10, 0.35, 0.80, 0.00, 0.10, 0.40, 0.85, 0.65],
  },
  v47: {
    composite: 'Friends and Lovers Crown Heights: Multi-room venue, eclectic indie/hip-hop/electronic bookings. Indie, hip-hop, electronic, soul. Closes 3am. Cover $5-15. Google 4.3/5. Review themes: genuinely eclectic programming, diverse crowd, neighborhood pride, great sound system, one of the best in Crown Heights. Capacity medium. Casual.',
    vec: [0.82, 0.72, 0.70, 0.60, 0.72, 0.25, 0.50, 0.15, 0.45, 0.40, 0.55, 0.00, 0.20, 0.45, 0.85, 0.55],
  },
  v48: {
    composite: 'Do or Dive Bed-Stuy: Legendary Bedford Ave dive, cheap drinks, block party energy. Hip-hop, R&B, funk, dancehall. Closes 4am. No cover. Google 4.1/5. Review themes: Bed-Stuy institution, cheap as it gets, always a scene, locals only feel, no attitude whatsoever. Capacity medium. Very casual.',
    vec: [0.60, 0.72, 0.65, 0.55, 0.60, 0.05, 0.70, 0.10, 0.10, 0.30, 0.65, 0.00, 0.05, 0.65, 0.80, 0.85],
  },
  v49: {
    composite: 'Bar Lunatico Bed-Stuy: Restaurant-bar with nightly adventurous live jazz and world music, chef-driven small plates. Jazz, world, experimental, soul. Closes midnight. Cover $10-20. Google 4.7/5. Review themes: best live jazz in Bed-Stuy, food is outstanding, intimate and genuine, music programming rivals Manhattan venues, community treasure. Capacity small. Casual-smart.',
    vec: [0.92, 0.60, 0.45, 0.20, 0.78, 0.10, 0.10, 0.85, 0.90, 0.25, 0.90, 0.00, 0.20, 0.60, 0.70, 0.50],
  },
  v50: {
    composite: 'Hot Bird Bed-Stuy: Outdoor beer garden on Vanderbilt, string lights, DJ nights. Hip-hop, soul, indie, eclectic. Closes 2am. No cover. Google 4.2/5. Review themes: Vanderbilt Ave anchor, great in warm weather, neighborhood social hub, relaxed dancing, outdoor gem. Capacity medium. Very casual.',
    vec: [0.65, 0.65, 0.60, 0.35, 0.55, 0.10, 0.55, 0.10, 0.10, 0.35, 0.55, 0.90, 0.05, 0.70, 0.75, 0.70],
  },
  v51: {
    composite: 'Soda Bar Bed-Stuy: Friendly Vanderbilt Ave neighborhood bar, great jukebox, weekend DJs. Indie, soul, hip-hop, rock. Closes 2am. No cover. Google 4.0/5. Review themes: quintessential Brooklyn neighborhood bar, dog-friendly, jukebox is excellent, relaxed crowd, always comfortable. Capacity small-medium. Very casual.',
    vec: [0.62, 0.58, 0.50, 0.30, 0.50, 0.10, 0.45, 0.10, 0.10, 0.25, 0.70, 0.10, 0.05, 0.82, 0.70, 0.80],
  },
  v52: {
    composite: "Shrine Harlem: Harlem's premier live music venue, jazz and Afrobeat and soul, nightly programming. Jazz, Afrobeats, soul, funk. Closes 2am. Cover $0-15. Google 4.5/5. Review themes: Harlem cultural landmark, incredible live music, African diaspora hub, welcoming to all, honors the neighborhood's legacy. Live music every night. Casual.",
    vec: [0.88, 0.72, 0.68, 0.40, 0.70, 0.05, 0.40, 0.70, 0.90, 0.25, 0.65, 0.00, 0.15, 0.45, 0.90, 0.55],
  },
  v53: {
    composite: "Ginny's Supper Club Harlem: Stunning basement supper club beneath Red Rooster, live jazz and R&B. Jazz, soul, R&B, gospel. Closes 1am. Cover $20-35. Google 4.5/5. Review themes: most beautiful room in Harlem, Marcus Samuelsson's vision realized, incredible live music, honors Harlem Renaissance spirit, special occasion essential. Smart casual.",
    vec: [0.90, 0.60, 0.50, 0.20, 0.50, 0.05, 0.35, 0.80, 0.85, 0.25, 0.75, 0.00, 0.55, 0.60, 0.80, 0.35],
  },
  v54: {
    composite: "Paris Blues Harlem: Harlem institution since the 1970s, live jazz nightly, unpretentious dive. Jazz, blues, soul. Closes 2am. No cover. Google 4.3/5. Review themes: authentic old Harlem, cheap drinks, real neighborhood crowd, live jazz without the attitude or price tag, irreplaceable. Capacity small. Very casual.",
    vec: [0.85, 0.55, 0.45, 0.35, 0.75, 0.00, 0.15, 0.90, 0.90, 0.20, 0.80, 0.00, 0.05, 0.65, 0.75, 0.75],
  },
  v55: {
    composite: 'Harlem Public: Upper Manhattan gastropub, communal tables, local beers, weekend scene. Hip-hop, soul, indie, eclectic. Closes 2am. No cover. Google 4.3/5. Review themes: great neighborhood bar, Columbia student and locals mix, good food, comfortable and welcoming, solid beer selection. Capacity medium. Casual.',
    vec: [0.55, 0.58, 0.40, 0.30, 0.30, 0.10, 0.45, 0.10, 0.05, 0.25, 0.55, 0.10, 0.10, 0.80, 0.75, 0.75],
  },
  v56: {
    composite: "Don't Tell Mama Hell's Kitchen: Piano bar and cabaret since 1982, Broadway talent nightly, queer-friendly. Show tunes, cabaret, pop, jazz. Closes 4am. Cover $0-10 + drink min. Google 4.2/5. Review themes: campy and wonderful, off-Broadway performers, LGBTQ+ institution, late-night theater crowd, genuine NYC nightlife experience. Capacity small-medium. Casual.",
    vec: [0.78, 0.68, 0.50, 0.55, 0.40, 0.05, 0.10, 0.40, 0.85, 0.75, 0.65, 0.00, 0.20, 0.45, 0.75, 0.50],
  },
  v57: {
    composite: "Industry Bar Hell's Kitchen: Large two-floor gay bar, go-go dancers, drag shows, themed nights. Pop, house, hip-hop, dance. Closes 4am. No cover. Google 4.1/5. Review themes: best gay bar in Hell's Kitchen, always packed, go-go dancers are a vibe, friendly crowd, tourist-friendly but not touristy. Capacity large. Casual.",
    vec: [0.60, 0.88, 0.82, 0.55, 0.30, 0.35, 0.30, 0.05, 0.30, 0.90, 0.30, 0.00, 0.20, 0.25, 0.85, 0.50],
  },
  v59: {
    composite: 'White Horse Tavern West Village: Dylan Thomas literary dive since 1880. Folk, acoustic, indie. Low-key neighborhood bar. Cover: none. Google 4.3/5. Review themes: historic atmosphere, great whiskey, literary legend, unpretentious, longtime regulars.',
    vec: [0.50, 0.35, 0.20, 0.30, 0.45, 0.05, 0.10, 0.25, 0.30, 0.25, 0.70, 0.15, 0.30, 0.80, 0.60, 0.75],
  },
  v60: {
    composite: 'Employees Only West Village: Prohibition-era speakeasy cocktail bar with nightly jazz. Late night food. Closes 4am. No cover. Google 4.5/5. Review themes: best cocktails in NYC, intimate atmosphere, jazz adds magic, beautiful staff, romantic.',
    vec: [0.80, 0.55, 0.30, 0.70, 0.50, 0.05, 0.05, 0.65, 0.50, 0.20, 0.75, 0.00, 0.85, 0.55, 0.50, 0.40],
  },
  v61: {
    composite: '55 Bar West Village: Underground jazz and blues since 1919. Tiny basement room, serious musicians. Closes 2am. No cover (2-drink minimum). Google 4.4/5. Review themes: authentic jazz, incredible musicians, cramped but magical, neighborhood institution.',
    vec: [0.90, 0.55, 0.25, 0.45, 0.70, 0.00, 0.10, 0.90, 0.90, 0.25, 0.90, 0.00, 0.30, 0.65, 0.55, 0.70],
  },
  v62: {
    composite: 'Barbès Park Slope Brooklyn: World music and jazz stronghold on 9th St. Intimate back room venue, global bookings. Cover $10-15. Google 4.7/5. Review themes: best world music in NYC, intimate and warm, adventurous bookings, true music lovers, neighborhood gem.',
    vec: [0.95, 0.55, 0.35, 0.50, 0.75, 0.05, 0.10, 0.90, 0.85, 0.35, 0.85, 0.00, 0.25, 0.60, 0.80, 0.80],
  },
  v63: {
    composite: 'Union Hall Park Slope Brooklyn: Indie bar with bocce, books, live music downstairs. Closes 4am. Cover $8-15. Google 4.2/5. Review themes: cozy upstairs bar, great indie shows, bocce is fun, young neighborhood crowd, reliable.',
    vec: [0.65, 0.55, 0.40, 0.55, 0.55, 0.15, 0.15, 0.30, 0.70, 0.25, 0.65, 0.00, 0.25, 0.55, 0.60, 0.70],
  },
  v64: {
    composite: 'Buttermilk Bar Park Slope Brooklyn: Low-key neighborhood cocktail bar, rotating DJs. No cover. Google 4.1/5. Review themes: friendly bartenders, good drinks, locals only energy, low-key fun, Park Slope staple.',
    vec: [0.55, 0.45, 0.40, 0.50, 0.40, 0.20, 0.30, 0.15, 0.10, 0.30, 0.70, 0.10, 0.20, 0.70, 0.65, 0.80],
  },
  v65: {
    composite: 'Franks Cocktail Lounge Fort Greene Brooklyn: Classic Black jazz lounge on Fulton St since 1974. Soul, jazz, R&B. No cover. Google 4.4/5. Review themes: authentic Fort Greene institution, warm and soulful, jazz greats have played here, community spot.',
    vec: [0.80, 0.55, 0.45, 0.50, 0.65, 0.00, 0.55, 0.80, 0.60, 0.30, 0.75, 0.00, 0.25, 0.65, 0.80, 0.85],
  },
  v66: {
    composite: 'Rope Fort Greene Brooklyn: Craft cocktail bar with DJs and intimate garden. No cover. Google 4.0/5. Review themes: nice garden, good cocktails, Fort Greene neighborhood bar, rotating DJs, laid-back.',
    vec: [0.60, 0.50, 0.40, 0.50, 0.45, 0.20, 0.25, 0.20, 0.10, 0.35, 0.70, 0.40, 0.35, 0.65, 0.65, 0.80],
  },
  v67: {
    composite: 'Bohemian Hall & Beer Garden Astoria Queens: Largest outdoor beer garden in NYC, Czech beer, folk and polka. Closes midnight-2am. No cover. Google 4.4/5. Review themes: best outdoor bar in NYC, massive space, communal tables, great for groups, summer institution.',
    vec: [0.50, 0.60, 0.35, 0.25, 0.40, 0.00, 0.05, 0.30, 0.35, 0.25, 0.20, 0.95, 0.15, 0.70, 0.75, 0.80],
  },
  v68: {
    composite: 'The Quays Astoria Queens: Irish pub with live music on Ditmars. Folk, rock, traditional Irish sessions. Closes 2am. No cover. Google 4.2/5. Review themes: authentic Irish pub, great live sessions, friendly locals, Astoria institution, good Guinness.',
    vec: [0.60, 0.55, 0.30, 0.30, 0.40, 0.05, 0.05, 0.35, 0.70, 0.15, 0.65, 0.15, 0.20, 0.70, 0.60, 0.80],
  },
  v69: {
    composite: 'Sweet Afton Astoria Queens: Craft beer bar and music venue on 34th St. Indie, folk, acoustic. Closes 2am. No cover. Google 4.3/5. Review themes: great beer selection, cozy atmosphere, good local shows, Astoria neighborhood spot.',
    vec: [0.65, 0.45, 0.25, 0.35, 0.55, 0.10, 0.10, 0.25, 0.60, 0.25, 0.75, 0.20, 0.25, 0.70, 0.60, 0.80],
  },
  v70: {
    composite: 'Trans-Pecos Ridgewood Queens: DIY all-ages experimental music venue. Noise, avant-garde, underground. Closes 2am. Cover $10-15. Google 4.5/5. Review themes: best experimental venue in NYC, raw and authentic, incredible sound, true underground, community focused.',
    vec: [0.95, 0.65, 0.30, 0.55, 0.98, 0.35, 0.00, 0.55, 0.90, 0.55, 0.85, 0.10, 0.10, 0.25, 0.75, 0.55],
  },
  v71: {
    composite: 'The Keep Ridgewood Queens: Metal and punk bar, pool table, tattooed regulars. Rock, metal, punk DJs. Closes 4am. No cover. Google 4.1/5. Review themes: proper dive bar, metal heads welcome, cheap drinks, no-frills, Ridgewood locals.',
    vec: [0.60, 0.70, 0.35, 0.75, 0.75, 0.10, 0.00, 0.05, 0.20, 0.30, 0.75, 0.15, 0.10, 0.30, 0.55, 0.80],
  },
  v72: {
    composite: 'Fort Defiance Red Hook Brooklyn: Classic cocktail bar, nautical vibes, weekend DJs. Closes midnight-2am. No cover. Google 4.4/5. Review themes: best cocktails in Red Hook, neighborhood gem, relaxed atmosphere, worth the trek, great food too.',
    vec: [0.70, 0.45, 0.30, 0.35, 0.50, 0.10, 0.15, 0.25, 0.15, 0.25, 0.75, 0.20, 0.55, 0.70, 0.55, 0.80],
  },
  v73: {
    composite: 'Red Hook Tavern Red Hook Brooklyn: Old-school neighborhood tavern, no frills, cash only. Jukebox, pool table. Closes 4am. No cover. Google 4.0/5. Review themes: real dive bar, cheap drinks, locals only, Red Hook institution, unpretentious.',
    vec: [0.40, 0.40, 0.20, 0.55, 0.55, 0.05, 0.20, 0.10, 0.05, 0.20, 0.80, 0.05, 0.10, 0.75, 0.60, 0.90],
  },
  v74: {
    composite: 'Irving Plaza Flatiron Manhattan: Historic mid-size concert venue, 1000 capacity. Indie, rock, hip-hop, pop. Cover $20-45. Google 4.4/5. Review themes: great sightlines, good sound, excellent booking, quintessential NYC venue, gets sweaty in the best way.',
    vec: [0.85, 0.75, 0.60, 0.55, 0.55, 0.15, 0.25, 0.20, 0.90, 0.20, 0.40, 0.00, 0.30, 0.40, 0.65, 0.35],
  },
  v75: {
    composite: 'Le Poisson Rouge West Village Manhattan: Multi-genre arts and nightlife venue. Classical, indie, electronic, hip-hop. Cover $15-30. Google 4.5/5. Review themes: adventurous programming, great sound, art crowd, one of NYC best venues, genuine discovery space.',
    vec: [0.95, 0.65, 0.50, 0.55, 0.65, 0.30, 0.20, 0.45, 0.70, 0.30, 0.55, 0.00, 0.40, 0.40, 0.75, 0.40],
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
