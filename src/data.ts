import { asset } from "./settings";

/** Relative asset paths inside the resort's photo archive. */
export const PATHS = {
  logo: "logo.png",
  logoAlt: "Loogo.png",
  logoMark: "logoo.png",
  hero: "header_img.png",
  about1: "about_01.jpeg",
  about2: "about_1.jpeg",
  about3: "about_3rd.png",
  banquetSetup: "banquet/hall-ceremony-setup.jpg",
  banquetStage: "banquet/hall-ceremony-stage.png",
  banquetSeating: "banquet/hall-empty-seating.jpg",
  kitchen1: "kitchen/kitchen-1.jpg",
  kitchen2: "kitchen/kitchen-2.jpg",
  garden: "Garden/IMG_0547.PNG",
  poolHero: "pool/pool-hero.png",
  poolNight1: "pool/pool-night-1.jpg",
  poolNight2: "pool/pool-night-2.jpg",
  poolNight3: "pool/pool-night-3.jpg",
  poolNight5: "pool/pool-night-5.jpg",
  poolNight7: "pool/pool-night-7.jpg",
} as const;

type Key = keyof typeof PATHS;

/** Primary (CDN) URL for each photo. */
export const IMG = Object.fromEntries(
  (Object.keys(PATHS) as Key[]).map((k) => [k, asset(PATHS[k]).src])
) as Record<Key, string>;

/** Full resilient source chain for each photo (CDN → raw → local). */
export const IMG_CHAIN = Object.fromEntries(
  (Object.keys(PATHS) as Key[]).map((k) => [k, asset(PATHS[k]).fallback])
) as Record<Key, string[]>;

/** Graceful fallbacks if a repo asset is unavailable */
export const FALLBACK = {
  hero: "https://images.pexels.com/photos/19521867/pexels-photo-19521867.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1920",
  room: "https://images.pexels.com/photos/2725675/pexels-photo-2725675.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400",
  banquet:
    "https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400",
  pool: "https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400",
  kitchen:
    "https://images.pexels.com/photos/29101361/pexels-photo-29101361.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400",
  garden:
    "https://images.pexels.com/photos/12387874/pexels-photo-12387874.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400",
};

export const NAV = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Accommodations", href: "#accommodations" },
  { label: "Events", href: "#events" },
  { label: "Reviews", href: "#reviews" },
  { label: "Stories", href: "#stories" },
  { label: "Location", href: "#location" },
  { label: "Contact", href: "#contact" },
];

export const FEATURES = [
  {
    icon: "🛏️",
    title: "Comfort Stay",
    desc: "Luxurious, hygienic rooms with air-conditioning, geysers, and modern comforts for a relaxing stay.",
  },
  {
    icon: "🤫",
    title: "Peace & Privacy",
    desc: "Escape into a private retreat where comfort, silence, and beautiful surroundings create an unforgettable hospitality experience.",
  },
  {
    icon: "📍",
    title: "Best Location",
    desc: "Ideally located with convenient access to Jaipur while surrounded by natural beauty, making Vrinda Valley Resort the perfect destination.",
  },
  {
    icon: "🎉",
    title: "Pool Parties",
    desc: "Live music, refreshing drinks, comfy lounge seating, water activities and vibrant lighting — perfect for relaxing and celebrating.",
  },
  {
    icon: "💳",
    title: "Payment Options",
    desc: "Vrinda Valley Resort offers a range of convenient payment options to suit your preferences.",
  },
  {
    icon: "🎁",
    title: "Special Offers",
    desc: "Whether you're planning a romantic getaway or a business trip, our curated special offers cater to all your needs.",
  },
];

export const EVENTS = [
  {
    img: IMG.banquetSetup,
    fallback: FALLBACK.banquet,
    kicker: "Perfect Destination for Grand Celebrations",
    title: "Luxury Celebration Venue",
    desc: "Host unforgettable weddings and celebrations at Vrinda Valley Resort, where elegant spaces and beautiful lighting create the perfect atmosphere.",
  },
  {
    img: IMG.banquetSeating,
    fallback: FALLBACK.banquet,
    kicker: "Celebrate Your Special Moments in Style",
    title: "Elegant Wedding & Event Setup",
    desc: "Celebrate your special moments in a stylish setting designed for comfort, elegance, and memorable gatherings.",
  },
  {
    img: IMG.banquetStage,
    fallback: FALLBACK.banquet,
    kicker: "Experience the Charm of Nights",
    title: "Magical Evening Ambience",
    desc: "Experience magical evenings with stunning lights, peaceful surroundings, and a relaxing atmosphere at Vrinda Valley Resort. ✨",
  },
];

export const SPACES = [
  {
    img: IMG.about1,
    fallback: FALLBACK.room,
    tag: "16 Rooms",
    title: "Elegant Luxury Rooms",
    desc: "Sixteen elegantly crafted rooms with air-conditioning, geysers, premium linen and modern comforts for a restful stay.",
    points: ["Air-Conditioned", "24×7 Hot Water", "Daily Housekeeping"],
  },
  {
    img: IMG.banquetSetup,
    fallback: FALLBACK.banquet,
    tag: "Grand Venue",
    title: "Magnificent Banquet Hall",
    desc: "A spacious, beautifully lit banquet hall designed for weddings, receptions, corporate events and grand family gatherings.",
    points: ["Stage & Lighting", "Flexible Seating", "Event Coordination"],
  },
  {
    img: IMG.poolHero,
    fallback: FALLBACK.pool,
    tag: "Poolside",
    title: "Swimming Pool & Parties",
    desc: "A refreshing pool with lounge seating, vibrant lighting and live music — the heart of our poolside celebrations.",
    points: ["Lounge Seating", "Live Music Nights", "Safe & Maintained"],
  },
  {
    img: IMG.kitchen1,
    fallback: FALLBACK.kitchen,
    tag: "Dining",
    title: "Spacious Gourmet Kitchen",
    desc: "A professional-grade kitchen serving freshly prepared multi-cuisine menus, from intimate dinners to large event catering.",
    points: ["Multi-Cuisine", "Custom Menus", "Bulk Catering"],
  },
  {
    img: IMG.garden,
    fallback: FALLBACK.garden,
    tag: "Outdoors",
    title: "Landscaped Gardens",
    desc: "Beautifully landscaped lawns and gardens — an open-air setting for mehndi, haldi, sangeet and sunset ceremonies.",
    points: ["Open Lawns", "Floral Landscaping", "Evening Lighting"],
  },
  {
    img: IMG.about2,
    fallback: FALLBACK.room,
    tag: "Hospitality",
    title: "Strong, Dedicated Team",
    desc: "Unlocking hospitality excellence — our warm, attentive team ensures every detail of your perfect stay is taken care of.",
    points: ["24×7 Front Desk", "Event Support", "Concierge"],
  },
];

export const CONTACT = {
  phone: "+91 95304 29585",
  phoneRaw: "+919530429585",
  phone2: "+91 95711 98339",
  phone2Raw: "+919571198339",
  /** WhatsApp business number (digits only, with country code) */
  whatsapp: "919530429585",
  email: "vrindavalleyjaipur@gmail.com",
  instagram: "vrindavalleyresortjaipur",
  instagramUrl: "https://instagram.com/vrindavalleyresortjaipur",
  address:
    "Vrinda Valley, Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904",
  addressShort: "Diggi Malpura Rd, Balawala, Jaipur, Rajasthan 303904",
  hours: "Reception open 24 × 7",
};

/* ---------------- Google Maps ---------------- */
const MAP_Q = encodeURIComponent(
  "Vrinda Valley, Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904"
);

export const MAP = {
  query: "Vrinda Valley Resort, Diggi Malpura Road, Rajasthan 303904",
  share: "https://share.google/gDT8e3YPzKnWHBnep",
  embed: `https://www.google.com/maps?q=${MAP_Q}&output=embed&z=14`,
  directions: `https://www.google.com/maps/dir/?api=1&destination=${MAP_Q}`,
  search: `https://www.google.com/maps/search/?api=1&query=${MAP_Q}`,
  // Diggi–Malpura Road belt (PIN 303904), south of Jaipur
  lat: 26.6184,
  lng: 75.6421,
};

/* ---------------- SEO ---------------- */
/** High-intent keywords customers actually search for. */
export const SEO_KEYWORDS = [
  "resort in Jaipur",
  "best resort in Jaipur",
  "destination wedding venue Jaipur",
  "wedding resort Jaipur",
  "banquet hall in Jaipur",
  "marriage garden Jaipur",
  "resort near Jaipur for wedding",
  "luxury resort Jaipur",
  "resorts in Jaipur with swimming pool",
  "pool party resort Jaipur",
  "weekend getaway near Jaipur",
  "corporate offsite venue Jaipur",
  "pre wedding shoot location Jaipur",
  "birthday party venue Jaipur",
  "resort for family function Jaipur",
  "destination wedding Rajasthan",
  "Jaipur resort with rooms and banquet",
  "day outing resort Jaipur",
  "reception venue Jaipur",
  "Vrinda Valley Resort",
];

export const SEO = {
  title:
    "Vrinda Valley Resort Jaipur | Best Wedding Resort & Banquet Hall in Jaipur",
  description:
    "Vrinda Valley Resort is a luxury resort in Jaipur, Rajasthan with 16 elegant rooms, a grand banquet hall, swimming pool, gourmet kitchen & landscaped gardens. Perfect for destination weddings, receptions, corporate events, pool parties and weekend getaways near Jaipur. Book now.",
  url: "https://vrinda-valley-resort.vercel.app",
};

/* ---------------- Resort moments (gallery of real celebrations) ---------------- */
/** Only used for neutral guest avatars — all resort photography is from the repo. */
const PX = "https://images.pexels.com/photos";

/** Real resort moments — all photos from the Vrinda Valley Resort archive */
export const MOMENTS = [
  { src: IMG.banquetSetup, caption: "Ceremony setup in the banquet hall", tag: "Wedding" },
  { src: IMG.poolNight3, caption: "Poolside lit up for an evening party", tag: "Pool Party" },
  { src: IMG.garden, caption: "Landscaped gardens in full bloom", tag: "Gardens" },
  { src: IMG.banquetSeating, caption: "Banquet hall ready for guests", tag: "Banquet" },
  { src: IMG.poolHero, caption: "The swimming pool at golden hour", tag: "Poolside" },
  { src: IMG.kitchen2, caption: "Fresh preparations in our gourmet kitchen", tag: "Kitchen" },
  { src: IMG.poolNight2, caption: "Vibrant lighting around the pool deck", tag: "Night" },
  { src: IMG.about3, caption: "Resort grounds and open spaces", tag: "Resort" },
];

/* ---------------- Seeded guest reviews (Jaipur / Rajasthan) ---------------- */
export type Review = {
  id: string;
  name: string;
  city: string;
  rating: number;
  occasion: string;
  text: string;
  photo?: string;
  avatar?: string;
  date: string;
  approved: boolean;
};

const AV = (id: string) => `${PX}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=200&w=200`;

export const SEED_REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Ananya & Rohan Sharma",
    city: "Jaipur, Rajasthan",
    rating: 5,
    occasion: "Destination Wedding",
    date: "Dec 2025",
    approved: true,
    avatar: AV("38624436"),
    photo: IMG.banquetSetup,
    text:
      "We booked Vrinda Valley for our wedding after seeing three other venues in Jaipur — and honestly nothing came close. The banquet hall decor, the lighting, the garden setup for mehndi… everything was flawless. All 16 rooms were given to our family so nobody had to travel. Best decision we made.",
  },
  {
    id: "r2",
    name: "Mahendra Singh Rathore",
    city: "Jodhpur, Rajasthan",
    rating: 5,
    occasion: "Family Function",
    date: "Nov 2025",
    approved: true,
    avatar: AV("38624435"),
    photo: IMG.banquetSeating,
    text:
      "Humne apne bete ki shaadi yahan ki. Staff ka behaviour bahut hi acha tha, khana lajawab, aur parking ki bhi koi dikkat nahi hui. Baraat ke liye entrance bilkul perfect hai. Rajasthani hospitality ka asli example hai ye resort.",
  },
  {
    id: "r3",
    name: "Priya Agarwal",
    city: "Jaipur, Rajasthan",
    rating: 5,
    occasion: "Pool Party",
    date: "Oct 2025",
    approved: true,
    avatar: AV("38624440"),
    photo: IMG.poolNight3,
    text:
      "Had my birthday pool party here with 40 friends. The lighting around the pool in the evening was gorgeous, music setup was handled by their team, and the food kept coming. Super clean pool and the staff were genuinely attentive all night.",
  },
  {
    id: "r4",
    name: "Vikram & Neha Mehta",
    city: "Udaipur, Rajasthan",
    rating: 5,
    occasion: "Anniversary Getaway",
    date: "Sep 2025",
    approved: true,
    avatar: AV("3890576"),
    photo: IMG.garden,
    text:
      "Came for a quiet weekend away from the city. The rooms are spacious, AC and hot water worked perfectly, and the gardens in the morning are so peaceful. Close enough to Jaipur that we drove into the city for a day and came back by evening.",
  },
  {
    id: "r5",
    name: "Sunita Choudhary",
    city: "Ajmer, Rajasthan",
    rating: 4,
    occasion: "Corporate Offsite",
    date: "Aug 2025",
    approved: true,
    avatar: AV("16933979"),
    text:
      "Organised our company's annual offsite for 60 people. The banquet hall worked well as a conference space during the day and they converted it for dinner in the evening. Food variety was excellent. Would have liked slightly faster Wi-Fi, otherwise a great experience.",
  },
  {
    id: "r6",
    name: "Rajat Khandelwal",
    city: "Jaipur, Rajasthan",
    rating: 5,
    occasion: "Reception",
    date: "Jul 2025",
    approved: true,
    avatar: AV("21642977"),
    photo: IMG.banquetStage,
    text:
      "Looking for a wedding resort in Jaipur that doesn't cost a fortune but still feels premium? This is it. We hosted a 400-guest reception. The event coordinator was on top of everything and the kitchen handled our custom Marwari menu beautifully.",
  },
];

/* ---------------- Seeded SEO stories / blog ---------------- */
export type Story = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  keywords: string[];
  cover: string;
  author: string;
  date: string;
  published: boolean;
};

export const SEED_STORIES: Story[] = [
  {
    id: "s1",
    title: "Why Jaipur Is India's Favourite Destination Wedding City",
    slug: "destination-wedding-jaipur",
    excerpt:
      "From royal architecture to perfect winter weather, here's why couples across India choose Jaipur for their destination wedding — and what to look for in a venue.",
    body:
      "Jaipur has quietly become the number one choice for destination weddings in India, and it isn't hard to see why. The city blends royal Rajasthani heritage with modern connectivity — a direct flight from almost every metro, a well-connected railway network, and highways that make the drive from Delhi comfortable.\n\nWhen couples search for a destination wedding venue in Jaipur, three things matter most: guest accommodation on site, a banquet hall that can be styled to any theme, and outdoor space for daytime functions like mehndi and haldi.\n\nAt Vrinda Valley Resort we built exactly around those three needs. Sixteen rooms mean your closest family stays where they celebrate. Our grand banquet hall handles everything from an intimate engagement to a full reception. And our landscaped gardens give you the open-air Rajasthani setting that photographs beautifully in winter light.\n\nThe best season runs from October through March. Book six to nine months ahead for peak dates.",
    keywords: ["destination wedding Jaipur", "wedding venue Jaipur", "Rajasthan wedding"],
    cover: IMG.banquetSetup,
    author: "Vrinda Valley Team",
    date: "2026-01-12",
    published: true,
  },
  {
    id: "s2",
    title: "Planning a Pool Party in Jaipur: A Complete Checklist",
    slug: "pool-party-jaipur-checklist",
    excerpt:
      "Music, lighting, food and safety — everything you need to plan a memorable poolside celebration at a resort in Jaipur.",
    body:
      "Pool parties have become the go-to format for birthdays, bachelorettes and casual corporate celebrations in Jaipur. They're relaxed, photogenic, and work brilliantly in Rajasthan's climate for most of the year.\n\nHere's what actually matters when planning one.\n\n**Timing.** Late afternoon into evening is ideal — you get golden hour for photos and cooler air for dancing. Avoid peak May afternoons.\n\n**Lighting.** This is the single biggest upgrade. Warm string lights around the pool perimeter plus a few colour washes completely transform the space after sunset.\n\n**Food flow.** Live counters work far better than a fixed buffet at a pool party. Guests graze rather than sit.\n\n**Safety.** Make sure your venue maintains proper water treatment and has staff on duty. At Vrinda Valley, our pool is maintained daily and our team stays present through the event.\n\n**Sound.** Check whether your venue has in-house sound or whether you need to bring a DJ. We handle both.",
    keywords: ["pool party Jaipur", "resort with swimming pool Jaipur", "birthday venue Jaipur"],
    cover: IMG.poolNight3,
    author: "Vrinda Valley Team",
    date: "2026-01-04",
    published: true,
  },
  {
    id: "s3",
    title: "Weekend Getaways Near Jaipur: Escaping the City Without the Drive",
    slug: "weekend-getaway-near-jaipur",
    excerpt:
      "You don't need to drive four hours to feel far away. Here's how to plan a restful two-night escape just outside Jaipur.",
    body:
      "The best weekend getaway near Jaipur isn't necessarily the furthest one. Spending five hours in a car on a two-day trip defeats the point.\n\nWhat you actually want is somewhere green, quiet and close enough that you arrive relaxed. A resort with a pool, proper air-conditioned rooms, gardens to walk in, and a kitchen that serves fresh food on request.\n\nA good two-night itinerary looks like this. Arrive Friday evening, have dinner outdoors, sleep in. Spend Saturday entirely at the resort — pool in the morning, long lunch, gardens in the evening. Drive into Jaipur on Sunday morning for Amer Fort or the markets, then head home.\n\nThat rhythm gives you genuine rest plus a taste of the city, without the exhaustion of a long highway drive.",
    keywords: ["weekend getaway near Jaipur", "resort near Jaipur", "day outing Jaipur"],
    cover: IMG.garden,
    author: "Vrinda Valley Team",
    date: "2025-12-20",
    published: true,
  },
];

