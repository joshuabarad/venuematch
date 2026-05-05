/**
 * 16-dimensional venue signal vectors.
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
 */

export interface VenueProfile {
  composite: string;
  vec: number[];
}

export const VENUE_PROFILES: Record<string, VenueProfile> = {
  v1:  { composite: 'Nowadays Queens: Underground outdoor/indoor venue, legendary Funktion-One sound system. Techno, house, experimental. Closes 6am+.', vec: [0.95, 0.85, 0.90, 1.00, 0.95, 0.85, 0.05, 0.10, 0.05, 0.70, 0.35, 0.85, 0.40, 0.20, 0.75, 0.20] },
  v2:  { composite: 'Elsewhere Brooklyn: Three-stage (Hall, Loft, Roof). House, techno, indie dance. Closes 4am.', vec: [0.90, 0.85, 0.85, 0.90, 0.75, 0.75, 0.15, 0.05, 0.10, 0.50, 0.40, 0.50, 0.35, 0.25, 0.65, 0.20] },
  v3:  { composite: 'Good Room Brooklyn: Intimate no-phone dance club, world-class sound system. House, disco, techno. Closes 6am.', vec: [0.95, 0.85, 0.95, 1.00, 0.90, 0.85, 0.05, 0.05, 0.05, 0.40, 0.95, 0.00, 0.45, 0.10, 0.60, 0.25] },
  v4:  { composite: 'Superchief Gallery Bar LES: Art gallery meets dive bar. Indie, punk, hip-hop. Live music frequent.', vec: [0.70, 0.80, 0.65, 0.60, 0.65, 0.10, 0.30, 0.10, 0.60, 0.30, 0.70, 0.00, 0.10, 0.55, 0.55, 0.60] },
  v5:  { composite: 'Schimanski Williamsburg: High-end club, internationally booked DJs. Techno, house, bass. Closes 6am.', vec: [0.85, 0.90, 0.90, 1.00, 0.70, 0.85, 0.05, 0.05, 0.05, 0.35, 0.20, 0.00, 0.65, 0.10, 0.55, 0.10] },
  v6:  { composite: 'Jupiter Disco Bushwick: Queer-owned, cozy disco bar, underground DJs. Disco, house, funk. Closes 4am.', vec: [0.90, 0.80, 0.85, 0.90, 0.85, 0.70, 0.15, 0.10, 0.05, 0.90, 0.75, 0.10, 0.25, 0.30, 0.85, 0.40] },
  v7:  { composite: "Baby's All Right Williamsburg: Bar + live music venue, eclectic bookings. Indie, pop, R&B. Closes 2am.", vec: [0.75, 0.70, 0.65, 0.50, 0.50, 0.20, 0.30, 0.10, 0.75, 0.30, 0.60, 0.00, 0.20, 0.55, 0.55, 0.55] },
  v8:  { composite: 'Nublu East Village: NYC institution, jazz and global sounds since 2002. Jazz, Afrobeat, Latin, world music.', vec: [0.95, 0.70, 0.65, 0.50, 0.80, 0.05, 0.25, 0.90, 0.85, 0.40, 0.85, 0.00, 0.20, 0.45, 0.80, 0.45] },
  v9:  { composite: 'The Sultan Room Bushwick: Rooftop bar + indoor venue. Indie, funk, hip-hop, electronic. Closes 2am.', vec: [0.80, 0.70, 0.65, 0.50, 0.65, 0.25, 0.35, 0.15, 0.70, 0.35, 0.45, 0.70, 0.20, 0.55, 0.65, 0.45] },
  v10: { composite: 'Midnight Rider LES: Country bar in NYC, line dancing, live acts. Country, Americana.', vec: [0.80, 0.80, 0.85, 0.50, 0.30, 0.00, 0.05, 0.05, 0.75, 0.25, 0.55, 0.00, 0.20, 0.35, 0.55, 0.35] },
  v11: { composite: 'Roulette Intermedium Boerum Hill: Premier experimental and avant-garde music venue. Experimental, classical, electronic.', vec: [0.99, 0.45, 0.25, 0.25, 0.90, 0.10, 0.05, 0.90, 0.95, 0.30, 0.80, 0.00, 0.15, 0.65, 0.65, 0.35] },
  v12: { composite: 'House of Yes Bushwick: Circus-themed immersive nightlife, aerialists, performers. House, techno, pop. Closes 4am.', vec: [0.75, 0.95, 0.85, 0.90, 0.60, 0.65, 0.15, 0.05, 0.30, 0.75, 0.45, 0.00, 0.50, 0.20, 0.85, 0.20] },
  v13: { composite: 'Sundown Bar Crown Heights: Low-key neighborhood dive, killer jukebox, DJ nights. Hip-hop, R&B, soul.', vec: [0.70, 0.65, 0.60, 0.40, 0.55, 0.05, 0.75, 0.15, 0.10, 0.25, 0.75, 0.00, 0.05, 0.75, 0.70, 0.85] },
  v14: { composite: "Lovers Rock NYC Bed-Stuy: Reggae, dancehall and Caribbean sounds. One of Brooklyn's best dance floors.", vec: [0.90, 0.85, 0.95, 0.80, 0.80, 0.05, 0.30, 0.15, 0.40, 0.45, 0.55, 0.00, 0.15, 0.25, 0.85, 0.40] },
  v15: { composite: 'Berlin East Village: Tiny underground basement. Techno, house, minimal. Closes 6am+.', vec: [0.85, 0.85, 0.90, 1.00, 0.95, 0.90, 0.05, 0.05, 0.05, 0.45, 0.99, 0.00, 0.35, 0.10, 0.55, 0.35] },
  v16: { composite: 'Peculier Pub Greenwich Village: 700+ beers, casual pub, occasional acoustic sets. Folk, acoustic, indie.', vec: [0.55, 0.45, 0.30, 0.40, 0.20, 0.05, 0.10, 0.20, 0.50, 0.20, 0.55, 0.15, 0.05, 0.90, 0.55, 0.60] },
  v17: { composite: 'The Django Tribeca: Upscale jazz supper club in a basement speakeasy. Jazz, soul, blues. Live music nightly.', vec: [0.90, 0.55, 0.40, 0.25, 0.40, 0.05, 0.10, 0.90, 0.95, 0.20, 0.75, 0.00, 0.60, 0.65, 0.55, 0.30] },
  v18: { composite: "C'mon Everybody Crown Heights: Intimate neighborhood venue, thoughtful indie/hip-hop bookings.", vec: [0.85, 0.70, 0.65, 0.45, 0.80, 0.20, 0.45, 0.25, 0.65, 0.40, 0.80, 0.00, 0.20, 0.55, 0.70, 0.55] },
  v19: { composite: 'Mood Ring Bushwick: Colorful queer bar, DJs, dancing, vibrant community. Pop, house, R&B.', vec: [0.75, 0.80, 0.80, 0.45, 0.65, 0.30, 0.50, 0.05, 0.10, 0.90, 0.65, 0.15, 0.10, 0.40, 0.95, 0.55] },
  v20: { composite: 'Bossa Nova Civic Club Bushwick: Basement techno club, underground loyalists. Techno, industrial. Closes 6am.', vec: [0.95, 0.80, 0.85, 1.00, 0.99, 0.95, 0.05, 0.10, 0.05, 0.50, 0.90, 0.00, 0.30, 0.15, 0.60, 0.20] },
  v21: { composite: 'Trophy Bar Bushwick: Classic dive bar, unexpectedly good DJ nights, pool table. Hip-hop, soul, R&B.', vec: [0.65, 0.65, 0.55, 0.55, 0.55, 0.15, 0.50, 0.10, 0.15, 0.30, 0.70, 0.00, 0.05, 0.70, 0.55, 0.75] },
  v22: { composite: 'The Lot Radio Greenpoint: Outdoor container bar with live radio stream. Eclectic, house, jazz, ambient.', vec: [0.85, 0.55, 0.50, 0.35, 0.80, 0.40, 0.15, 0.35, 0.20, 0.40, 0.55, 0.95, 0.05, 0.75, 0.75, 0.60] },
  v23: { composite: 'Luckydog Williamsburg: Super low-key Bedford Ave dive, pinball, darts. Indie, punk, classic rock.', vec: [0.55, 0.55, 0.45, 0.55, 0.45, 0.20, 0.20, 0.05, 0.10, 0.25, 0.75, 0.00, 0.05, 0.90, 0.60, 0.80] },
  v24: { composite: 'Syndicated BK Bushwick: Bar, restaurant and movie theater. Eclectic, indie, soul.', vec: [0.65, 0.55, 0.45, 0.35, 0.40, 0.10, 0.20, 0.20, 0.10, 0.30, 0.60, 0.00, 0.15, 0.75, 0.65, 0.55] },
  v25: { composite: 'Cobra Club Bushwick: Natural wine bar, legendary backyard, local DJs. House, soul, indie.', vec: [0.80, 0.65, 0.65, 0.35, 0.75, 0.35, 0.20, 0.15, 0.10, 0.40, 0.60, 0.70, 0.10, 0.65, 0.70, 0.60] },
  v26: { composite: 'Pyramid Club East Village: NYC nightlife institution since 1979, queer punk-drag mecca. New wave, punk, 80s.', vec: [0.75, 0.85, 0.80, 0.85, 0.80, 0.30, 0.10, 0.05, 0.20, 0.90, 0.65, 0.00, 0.25, 0.30, 0.80, 0.40] },
  v27: { composite: 'Webster Hall East Village: NYC most famous nightclub, five floors. EDM, hip-hop, pop. Closes 5am.', vec: [0.60, 0.90, 0.85, 0.95, 0.25, 0.70, 0.35, 0.05, 0.10, 0.40, 0.10, 0.00, 0.60, 0.15, 0.60, 0.10] },
  v28: { composite: 'Niagara Bar East Village: Classic East Village dive, rock and metal jukebox, pool table.', vec: [0.55, 0.65, 0.45, 0.55, 0.50, 0.10, 0.10, 0.05, 0.10, 0.25, 0.75, 0.00, 0.05, 0.80, 0.55, 0.75] },
  v29: { composite: 'Zum Schneider East Village: Authentic Bavarian beer hall, German brews, live oompah weekends.', vec: [0.60, 0.70, 0.55, 0.25, 0.15, 0.00, 0.05, 0.30, 0.60, 0.15, 0.55, 0.00, 0.20, 0.55, 0.60, 0.40] },
  v30: { composite: 'Rue B East Village: Intimate neighborhood jazz bar, live music every night, no cover.', vec: [0.85, 0.60, 0.50, 0.35, 0.70, 0.05, 0.10, 0.85, 0.90, 0.25, 0.95, 0.00, 0.10, 0.65, 0.60, 0.55] },
  v31: { composite: "Angel's Share East Village: Hidden Japanese whisky speakeasy, no standing, extraordinary cocktails. Jazz, ambient.", vec: [0.80, 0.30, 0.15, 0.30, 0.70, 0.00, 0.05, 0.40, 0.05, 0.15, 0.99, 0.00, 0.45, 0.85, 0.55, 0.25] },
  v32: { composite: 'Pianos LES: Two-stage Ludlow St institution. Indie, rock, pop, alternative. Closes 4am.', vec: [0.80, 0.75, 0.65, 0.55, 0.65, 0.20, 0.20, 0.10, 0.80, 0.30, 0.60, 0.00, 0.15, 0.45, 0.60, 0.50] },
  v33: { composite: 'Mercury Lounge LES: Legendary 250-cap rock venue on Houston. Indie rock, alternative, punk.', vec: [0.88, 0.75, 0.60, 0.40, 0.70, 0.15, 0.15, 0.10, 0.95, 0.30, 0.80, 0.00, 0.20, 0.40, 0.60, 0.45] },
  v34: { composite: "Arlene's Grocery LES: Rock club known for Monday Rock and Roll Karaoke. Rock, punk, indie.", vec: [0.70, 0.80, 0.65, 0.55, 0.65, 0.10, 0.15, 0.05, 0.85, 0.25, 0.70, 0.00, 0.10, 0.45, 0.60, 0.45] },
  v35: { composite: 'Rockwood Music Hall LES: Three-stage venue, no-cover Stage 1, emerging folk/indie/jazz artists nightly.', vec: [0.88, 0.60, 0.50, 0.35, 0.70, 0.10, 0.15, 0.40, 0.95, 0.25, 0.85, 0.00, 0.10, 0.60, 0.65, 0.40] },
  v36: { composite: "Mehanata Bulgarian Bar LES: NYC's only Bulgarian bar, Balkan music, vodka coffin. Closes 4am.", vec: [0.75, 0.85, 0.80, 0.80, 0.55, 0.25, 0.10, 0.40, 0.50, 0.35, 0.60, 0.00, 0.15, 0.30, 0.85, 0.30] },
  v37: { composite: 'Brooklyn Bowl Williamsburg: 16 bowling lanes, top-tier music bookings. Hip-hop, indie, electronic.', vec: [0.75, 0.80, 0.70, 0.50, 0.40, 0.20, 0.40, 0.10, 0.70, 0.35, 0.35, 0.00, 0.30, 0.40, 0.65, 0.30] },
  v38: { composite: 'Union Pool Williamsburg: Converted pool supply store, outdoor taco truck, fire pit. Indie, country, folk.', vec: [0.70, 0.65, 0.55, 0.55, 0.55, 0.10, 0.15, 0.10, 0.50, 0.35, 0.50, 0.80, 0.05, 0.65, 0.65, 0.60] },
  v39: { composite: 'Rough Trade NYC Williamsburg: London record shop with 250-cap live venue. Indie, electronic, post-punk.', vec: [0.92, 0.60, 0.55, 0.20, 0.80, 0.35, 0.10, 0.15, 0.85, 0.35, 0.70, 0.00, 0.25, 0.55, 0.65, 0.30] },
  v40: { composite: "Pete's Candy Store Williamsburg: Converted candy store, tiny back performance room, free shows. Folk, indie.", vec: [0.78, 0.45, 0.35, 0.30, 0.65, 0.05, 0.10, 0.25, 0.80, 0.30, 0.95, 0.00, 0.00, 0.85, 0.65, 0.70] },
  v41: { composite: 'Maison Premiere Williamsburg: New Orleans oyster bar, absinthe service, lush garden. Jazz, blues, ambient.', vec: [0.75, 0.50, 0.35, 0.30, 0.45, 0.05, 0.05, 0.55, 0.20, 0.25, 0.65, 0.60, 0.45, 0.75, 0.55, 0.30] },
  v42: { composite: 'Diamond Greenpoint: Dark cocktail bar, rotating underground DJs. House, disco, soul, indie. Closes 4am.', vec: [0.78, 0.70, 0.65, 0.55, 0.70, 0.40, 0.20, 0.10, 0.10, 0.35, 0.65, 0.00, 0.15, 0.55, 0.65, 0.55] },
  v43: { composite: 'Black Rabbit Greenpoint: Classic neighborhood pub, solid beer selection, pool table.', vec: [0.45, 0.50, 0.35, 0.35, 0.30, 0.05, 0.10, 0.10, 0.10, 0.20, 0.70, 0.00, 0.05, 0.90, 0.65, 0.80] },
  v44: { composite: 'Archestratus Books+Films Greenpoint: Food bookshop with cinema and intimate event space.', vec: [0.80, 0.30, 0.20, 0.20, 0.75, 0.05, 0.05, 0.40, 0.70, 0.25, 0.99, 0.00, 0.15, 0.85, 0.70, 0.60] },
  v45: { composite: 'Café Erzulie Crown Heights: Haitian-inspired Caribbean cultural hub, live music and DJ sets.', vec: [0.82, 0.70, 0.70, 0.40, 0.70, 0.10, 0.40, 0.30, 0.60, 0.40, 0.65, 0.20, 0.15, 0.50, 0.90, 0.65] },
  v46: { composite: 'Mixtape Crown Heights: Intimate hip-hop and R&B bar, expertly curated DJ programming.', vec: [0.85, 0.75, 0.78, 0.60, 0.75, 0.05, 0.85, 0.10, 0.10, 0.35, 0.80, 0.00, 0.10, 0.40, 0.85, 0.65] },
  v47: { composite: 'Friends and Lovers Crown Heights: Multi-room venue, eclectic indie/hip-hop/electronic bookings.', vec: [0.82, 0.72, 0.70, 0.60, 0.72, 0.25, 0.50, 0.15, 0.45, 0.40, 0.55, 0.00, 0.20, 0.45, 0.85, 0.55] },
  v48: { composite: 'Do or Dive Bed-Stuy: Legendary Bedford Ave dive, cheap drinks. Hip-hop, R&B, funk, dancehall. Closes 4am.', vec: [0.60, 0.72, 0.65, 0.55, 0.60, 0.05, 0.70, 0.10, 0.10, 0.30, 0.65, 0.00, 0.05, 0.65, 0.80, 0.85] },
  v49: { composite: 'Bar Lunatico Bed-Stuy: Restaurant-bar with nightly adventurous live jazz and world music.', vec: [0.92, 0.60, 0.45, 0.20, 0.78, 0.10, 0.10, 0.85, 0.90, 0.25, 0.90, 0.00, 0.20, 0.60, 0.70, 0.50] },
  v50: { composite: 'Hot Bird Bed-Stuy: Outdoor beer garden on Vanderbilt, string lights, DJ nights. Hip-hop, soul, indie.', vec: [0.65, 0.65, 0.60, 0.35, 0.55, 0.10, 0.55, 0.10, 0.10, 0.35, 0.55, 0.90, 0.05, 0.70, 0.75, 0.70] },
  v51: { composite: 'Soda Bar Bed-Stuy: Friendly Vanderbilt Ave neighborhood bar, great jukebox, weekend DJs.', vec: [0.62, 0.58, 0.50, 0.30, 0.50, 0.10, 0.45, 0.10, 0.10, 0.25, 0.70, 0.10, 0.05, 0.82, 0.70, 0.80] },
  v52: { composite: "Shrine Harlem: Harlem's premier live music venue, jazz and Afrobeat and soul, nightly programming.", vec: [0.88, 0.72, 0.68, 0.40, 0.70, 0.05, 0.40, 0.70, 0.90, 0.25, 0.65, 0.00, 0.15, 0.45, 0.90, 0.55] },
  v53: { composite: "Ginny's Supper Club Harlem: Stunning basement supper club beneath Red Rooster. Live jazz and R&B.", vec: [0.90, 0.60, 0.50, 0.20, 0.50, 0.05, 0.35, 0.80, 0.85, 0.25, 0.75, 0.00, 0.55, 0.60, 0.80, 0.35] },
  v54: { composite: 'Paris Blues Harlem: Harlem institution since the 1970s, live jazz nightly, unpretentious dive.', vec: [0.85, 0.55, 0.45, 0.35, 0.75, 0.00, 0.15, 0.90, 0.90, 0.20, 0.80, 0.00, 0.05, 0.65, 0.75, 0.75] },
  v55: { composite: 'Harlem Public: Upper Manhattan gastropub, communal tables, local beers, weekend scene.', vec: [0.55, 0.58, 0.40, 0.30, 0.30, 0.10, 0.45, 0.10, 0.05, 0.25, 0.55, 0.10, 0.10, 0.80, 0.75, 0.75] },
  v56: { composite: "Don't Tell Mama Hell's Kitchen: Piano bar and cabaret since 1982, Broadway talent nightly, queer-friendly.", vec: [0.78, 0.68, 0.50, 0.55, 0.40, 0.05, 0.10, 0.40, 0.85, 0.75, 0.65, 0.00, 0.20, 0.45, 0.75, 0.50] },
  v57: { composite: "Industry Bar Hell's Kitchen: Large two-floor gay bar, go-go dancers, drag shows, themed nights.", vec: [0.60, 0.88, 0.82, 0.55, 0.30, 0.35, 0.30, 0.05, 0.30, 0.90, 0.30, 0.00, 0.20, 0.25, 0.85, 0.50] },
  v58: { composite: "Therapy NYC Hell's Kitchen: Long-running gay lounge, cozy basement feel, weekly themed events.", vec: [0.55, 0.55, 0.45, 0.40, 0.65, 0.15, 0.05, 0.30, 0.70, 0.80, 0.45, 0.00, 0.15, 0.30, 0.65, 0.50] },
  v59: { composite: 'White Horse Tavern West Village: Dylan Thomas literary dive since 1880. Folk, acoustic, indie.', vec: [0.50, 0.35, 0.20, 0.30, 0.45, 0.05, 0.10, 0.25, 0.30, 0.25, 0.70, 0.15, 0.30, 0.80, 0.60, 0.75] },
  v60: { composite: 'Employees Only West Village: Prohibition-era speakeasy cocktail bar with nightly jazz. Closes 4am.', vec: [0.80, 0.55, 0.30, 0.70, 0.50, 0.05, 0.05, 0.65, 0.50, 0.20, 0.75, 0.00, 0.85, 0.55, 0.50, 0.40] },
  v61: { composite: '55 Bar West Village: Underground jazz and blues since 1919. Tiny basement room, serious musicians.', vec: [0.90, 0.55, 0.25, 0.45, 0.70, 0.00, 0.10, 0.90, 0.90, 0.25, 0.90, 0.00, 0.30, 0.65, 0.55, 0.70] },
  v62: { composite: 'Barbès Park Slope: World music and jazz stronghold on 9th St. Intimate back room, global bookings.', vec: [0.95, 0.55, 0.35, 0.50, 0.75, 0.05, 0.10, 0.90, 0.85, 0.35, 0.85, 0.00, 0.25, 0.60, 0.80, 0.80] },
  v63: { composite: 'Union Hall Park Slope: Indie bar with bocce, books, live music downstairs. Closes 4am.', vec: [0.65, 0.55, 0.40, 0.55, 0.55, 0.15, 0.15, 0.30, 0.70, 0.25, 0.65, 0.00, 0.25, 0.55, 0.60, 0.70] },
  v64: { composite: 'Buttermilk Bar Park Slope: Low-key neighborhood cocktail bar, rotating DJs.', vec: [0.55, 0.45, 0.40, 0.50, 0.40, 0.20, 0.30, 0.15, 0.10, 0.30, 0.70, 0.10, 0.20, 0.70, 0.65, 0.80] },
  v65: { composite: "Frank's Cocktail Lounge Fort Greene: Classic Black jazz lounge on Fulton St since 1974. Soul, jazz, R&B.", vec: [0.80, 0.55, 0.45, 0.50, 0.65, 0.00, 0.55, 0.80, 0.60, 0.30, 0.75, 0.00, 0.25, 0.65, 0.80, 0.85] },
  v66: { composite: 'Rope Fort Greene: Craft cocktail bar with DJs and intimate garden.', vec: [0.60, 0.50, 0.40, 0.50, 0.45, 0.20, 0.25, 0.20, 0.10, 0.35, 0.70, 0.40, 0.35, 0.65, 0.65, 0.80] },
  v67: { composite: 'Bohemian Hall & Beer Garden Astoria: Largest outdoor beer garden in NYC, Czech beer, folk and polka.', vec: [0.50, 0.60, 0.35, 0.25, 0.40, 0.00, 0.05, 0.30, 0.35, 0.25, 0.20, 0.95, 0.15, 0.70, 0.75, 0.80] },
  v68: { composite: 'The Quays Astoria: Irish pub with live music on Ditmars. Folk, rock, traditional Irish sessions.', vec: [0.60, 0.55, 0.30, 0.30, 0.40, 0.05, 0.05, 0.35, 0.70, 0.15, 0.65, 0.15, 0.20, 0.70, 0.60, 0.80] },
  v69: { composite: 'Sweet Afton Astoria: Craft beer bar and music venue on 34th St. Indie, folk, acoustic.', vec: [0.65, 0.45, 0.25, 0.35, 0.55, 0.10, 0.10, 0.25, 0.60, 0.25, 0.75, 0.20, 0.25, 0.70, 0.60, 0.80] },
  v70: { composite: 'Trans-Pecos Ridgewood: DIY all-ages experimental music venue. Noise, avant-garde, underground.', vec: [0.95, 0.65, 0.30, 0.55, 0.98, 0.35, 0.00, 0.55, 0.90, 0.55, 0.85, 0.10, 0.10, 0.25, 0.75, 0.55] },
  v71: { composite: 'The Keep Ridgewood: Intimate bar with craft beers. Folk, bluegrass, indie, americana.', vec: [0.60, 0.70, 0.35, 0.75, 0.75, 0.10, 0.00, 0.05, 0.20, 0.30, 0.75, 0.15, 0.10, 0.30, 0.55, 0.80] },
  v72: { composite: 'Fort Defiance Red Hook: Classic cocktail bar, nautical vibes, weekend DJs.', vec: [0.70, 0.45, 0.30, 0.35, 0.50, 0.10, 0.15, 0.25, 0.15, 0.25, 0.75, 0.20, 0.55, 0.70, 0.55, 0.80] },
  v73: { composite: 'Red Hook Tavern: Old-school neighborhood tavern, no frills, cash only. Jukebox, pool table.', vec: [0.40, 0.40, 0.20, 0.55, 0.55, 0.05, 0.20, 0.10, 0.05, 0.20, 0.80, 0.05, 0.10, 0.75, 0.60, 0.90] },
  v74: { composite: 'Irving Plaza Flatiron: Historic mid-size concert venue, 1000 capacity. Indie, rock, hip-hop, pop.', vec: [0.85, 0.75, 0.60, 0.55, 0.55, 0.15, 0.25, 0.20, 0.90, 0.20, 0.40, 0.00, 0.30, 0.40, 0.65, 0.35] },
  v75: { composite: 'Le Poisson Rouge West Village: Multi-genre arts and nightlife venue. Classical, indie, electronic, hip-hop.', vec: [0.95, 0.65, 0.50, 0.55, 0.65, 0.30, 0.20, 0.45, 0.70, 0.30, 0.55, 0.00, 0.40, 0.40, 0.75, 0.40] },
};

export const ARTIST_PROFILES: Record<string, number[]> = {
  'Peggy Gou':       [0.90, 0.85, 0.90, 1.00, 0.85, 0.85, 0.05, 0.05, 0.05, 0.70, 0.60, 0.00, 0.40, 0.20, 0.75, 0.00],
  'Four Tet':        [0.92, 0.65, 0.70, 0.80, 0.88, 0.70, 0.10, 0.30, 0.10, 0.40, 0.75, 0.00, 0.30, 0.45, 0.70, 0.00],
  'Kaytranada':      [0.90, 0.85, 0.90, 0.80, 0.70, 0.60, 0.55, 0.05, 0.05, 0.60, 0.60, 0.00, 0.30, 0.25, 0.80, 0.00],
  'Fred Again..':    [0.90, 0.80, 0.85, 0.90, 0.80, 0.80, 0.10, 0.15, 0.05, 0.50, 0.65, 0.00, 0.35, 0.30, 0.70, 0.00],
  'Mk.gee':          [0.85, 0.55, 0.50, 0.50, 0.75, 0.10, 0.45, 0.20, 0.70, 0.35, 0.80, 0.00, 0.20, 0.65, 0.65, 0.00],
  'SZA':             [0.80, 0.65, 0.65, 0.50, 0.40, 0.05, 0.80, 0.10, 0.40, 0.40, 0.60, 0.00, 0.20, 0.50, 0.75, 0.00],
  'Bad Bunny':       [0.80, 0.90, 0.90, 0.70, 0.40, 0.10, 0.50, 0.05, 0.30, 0.50, 0.60, 0.00, 0.30, 0.20, 0.80, 0.00],
  'Amaarae':         [0.85, 0.75, 0.75, 0.70, 0.70, 0.25, 0.65, 0.15, 0.25, 0.60, 0.60, 0.00, 0.25, 0.40, 0.85, 0.00],
  'Floating Points': [0.95, 0.70, 0.75, 0.80, 0.90, 0.70, 0.05, 0.45, 0.15, 0.40, 0.70, 0.00, 0.35, 0.40, 0.65, 0.00],
  'Bonobo':          [0.90, 0.60, 0.65, 0.60, 0.75, 0.40, 0.10, 0.45, 0.30, 0.30, 0.70, 0.00, 0.25, 0.55, 0.65, 0.00],
  'Chris Lake':      [0.85, 0.90, 0.90, 1.00, 0.65, 0.90, 0.05, 0.05, 0.05, 0.40, 0.50, 0.00, 0.50, 0.15, 0.55, 0.00],
  'Daniel Avery':    [0.90, 0.80, 0.85, 1.00, 0.90, 0.90, 0.05, 0.10, 0.05, 0.40, 0.75, 0.00, 0.40, 0.20, 0.55, 0.00],
  'Sango':           [0.85, 0.75, 0.80, 0.70, 0.70, 0.30, 0.60, 0.15, 0.10, 0.50, 0.65, 0.00, 0.25, 0.40, 0.80, 0.00],
  'Jorja Smith':     [0.85, 0.60, 0.60, 0.50, 0.55, 0.05, 0.85, 0.10, 0.40, 0.35, 0.65, 0.00, 0.15, 0.65, 0.70, 0.00],
  'Kenny Beats':     [0.85, 0.80, 0.70, 0.60, 0.65, 0.20, 0.80, 0.05, 0.20, 0.35, 0.60, 0.00, 0.25, 0.40, 0.70, 0.00],
  'Sudan Archives':  [0.90, 0.70, 0.70, 0.60, 0.80, 0.20, 0.65, 0.25, 0.55, 0.55, 0.70, 0.00, 0.25, 0.45, 0.80, 0.00],
  'Kelela':          [0.90, 0.75, 0.80, 0.80, 0.80, 0.50, 0.70, 0.10, 0.10, 0.65, 0.65, 0.00, 0.35, 0.35, 0.80, 0.00],
  'Jamie xx':        [0.90, 0.75, 0.85, 0.80, 0.80, 0.75, 0.10, 0.15, 0.10, 0.45, 0.70, 0.00, 0.35, 0.30, 0.65, 0.00],
  'Yaeji':           [0.90, 0.70, 0.80, 0.80, 0.85, 0.70, 0.15, 0.15, 0.10, 0.65, 0.75, 0.00, 0.35, 0.35, 0.75, 0.00],
  'Arooj Aftab':     [0.95, 0.40, 0.35, 0.30, 0.85, 0.05, 0.10, 0.90, 0.85, 0.30, 0.90, 0.00, 0.20, 0.75, 0.70, 0.00],
  'Tyla':            [0.80, 0.85, 0.90, 0.70, 0.50, 0.20, 0.70, 0.10, 0.25, 0.45, 0.55, 0.00, 0.25, 0.25, 0.80, 0.00],
  'Octo Octa':       [0.90, 0.85, 0.90, 1.00, 0.90, 0.85, 0.05, 0.05, 0.05, 0.80, 0.65, 0.00, 0.35, 0.15, 0.80, 0.00],
  'Objekt':          [0.90, 0.80, 0.85, 1.00, 0.95, 0.90, 0.05, 0.15, 0.05, 0.45, 0.75, 0.00, 0.40, 0.20, 0.55, 0.00],
  'Jayda G':         [0.90, 0.80, 0.85, 0.90, 0.80, 0.75, 0.15, 0.10, 0.05, 0.75, 0.65, 0.00, 0.30, 0.25, 0.80, 0.00],
  'Aroha':           [0.85, 0.60, 0.60, 0.50, 0.60, 0.10, 0.70, 0.35, 0.45, 0.35, 0.70, 0.00, 0.15, 0.65, 0.70, 0.00],
};

export const VECTOR_DIMS = [
  'music_curation', 'energy', 'dance', 'late_night', 'underground',
  'electronic', 'rnb_hiphop', 'jazz_world', 'live_music', 'queer',
  'intimate', 'outdoor', 'exclusive', 'chill', 'diverse', 'local',
] as const;

export type VectorDim = typeof VECTOR_DIMS[number];
