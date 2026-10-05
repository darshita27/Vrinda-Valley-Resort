/**
 * Knowledge base for the Vrinda Valley Resort AI Concierge.
 * Each intent carries keyword weights, synonyms and a rich answer.
 */

export type Intent = {
  id: string;
  /** high-signal phrases (weight 3) */
  phrases?: string[];
  /** single keywords (weight 2) */
  keywords: string[];
  /** weak/contextual hints (weight 1) */
  hints?: string[];
  answer: string | ((ctx: Record<string, string>) => string);
  chips?: string[];
};

export const RESORT = {
  name: "Vrinda Valley Resort",
  city: "Jaipur, Rajasthan",
  rooms: 16,
  phone: "+91 95304 29585",
  whatsapp: "+91 95304 29585",
  email: "vrindavalleyjaipur@gmail.com",
  instagram: "@vrindavalleyresort",
  address:
    "Vrinda Valley, Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904",
  checkIn: "2:00 PM",
  checkOut: "11:00 AM",
};

export const INTENTS: Intent[] = [
  {
    id: "greeting",
    phrases: ["good morning", "good evening", "good afternoon"],
    keywords: ["hi", "hello", "hey", "namaste", "namaskar", "hola", "yo", "salaam"],
    answer:
      "Namaste! 🙏 I'm **Vrinda**, your personal AI concierge at Vrinda Valley Resort, Jaipur.\n\nI can help you with rooms, wedding & banquet enquiries, pool parties, dining, directions and bookings. What would you like to know?",
    chips: ["Room options", "Wedding venue", "Check prices", "Book a stay"],
  },
  {
    id: "about",
    phrases: ["tell me about", "about the resort", "what is vrinda", "who are you guys"],
    keywords: ["about", "resort", "overview", "introduction", "story"],
    answer:
      "**Vrinda Valley Resort** is a luxury destination in **Jaipur, Rajasthan** — built for weddings, events and serene getaways. ✨\n\nWhat we offer:\n• **16** elegantly crafted rooms\n• A **magnificent banquet hall**\n• A refreshing **swimming pool**\n• A spacious **gourmet kitchen**\n• Beautifully **landscaped gardens**\n\nWhether you want a quiet escape or a grand celebration, every detail here is designed for comfort, elegance and lasting memories.",
    chips: ["See rooms", "Banquet hall", "Location", "Book now"],
  },
  {
    id: "rooms",
    phrases: ["how many rooms", "room options", "types of rooms", "accommodation details", "do you have rooms"],
    keywords: ["room", "rooms", "accommodation", "stay", "suite", "bedroom", "lodging", "ac"],
    hints: ["available", "night", "sleep"],
    answer:
      "We have **16 elegantly crafted rooms**, each designed for a restful, premium stay. 🛏️\n\nEvery room includes:\n• Full **air-conditioning**\n• **Geyser / 24×7 hot water**\n• Premium linen & hygienic housekeeping\n• Modern comforts and peaceful valley-side views\n\nRooms can be booked individually or blocked entirely for weddings and large family functions.",
    chips: ["Room prices", "Check availability", "Amenities", "Book a room"],
  },
  {
    id: "pricing",
    phrases: ["how much", "what is the price", "room rate", "per night cost", "tariff", "charges kya", "kitna hai"],
    keywords: ["price", "pricing", "cost", "rate", "rates", "tariff", "budget", "expensive", "cheap", "fees"],
    hints: ["night", "package", "quote"],
    answer:
      "Our tariffs vary by **season, duration and event type**, so we prefer giving you an accurate quote rather than a generic number. 💬\n\nIndicative guidance:\n• **Room stays** — packaged per night, with discounts on multi-night & bulk bookings\n• **Banquet / wedding** — priced per event based on guest count, catering and decor\n• **Pool parties** — custom packages with food, music and lighting\n\nShare your **dates and guest count** and I'll raise a priority quote request for you. You can also call us directly at **" +
      RESORT.phone +
      "**.",
    chips: ["Get a quote", "Wedding package", "Call the resort"],
  },
  {
    id: "banquet",
    phrases: ["banquet hall", "wedding venue", "marriage hall", "shaadi", "destination wedding", "host a wedding", "reception venue"],
    keywords: ["banquet", "wedding", "marriage", "shaadi", "reception", "venue", "hall", "sangeet", "mehndi", "haldi", "baraat"],
    hints: ["celebration", "function", "ceremony"],
    answer:
      "Our **grand banquet hall** is the heart of celebrations at Vrinda Valley. 💍\n\n• Elegant interiors with **professional stage & lighting**\n• **Flexible seating** — intimate gatherings to grand receptions\n• Dedicated **event coordination** team\n• In-house **gourmet kitchen** for custom catering\n• Adjoining **gardens & poolside** for mehndi, haldi and sangeet\n• On-site **16 rooms** so your guests stay where they celebrate\n\nWe host weddings, receptions, corporate events, birthdays and anniversaries.",
    chips: ["Wedding quote", "See gallery", "Guest capacity", "Book a visit"],
  },
  {
    id: "capacity",
    phrases: ["how many guests", "how many people", "seating capacity", "max capacity", "accommodate how many"],
    keywords: ["capacity", "guests", "people", "pax", "crowd", "gathering", "seat", "seating"],
    answer:
      "Capacity depends on the space and layout you choose: 👥\n\n• **Banquet hall** — comfortably scales from intimate functions to large receptions\n• **Landscaped gardens** — open-air setting for bigger baraat, mehndi and sangeet gatherings\n• **Poolside** — relaxed parties and cocktail-style events\n• **Stay** — 16 rooms on site for your closest guests\n\nTell me your **expected guest count** and I'll recommend the best layout and share exact numbers.",
    chips: ["200 guests", "500 guests", "Talk to events team"],
  },
  {
    id: "pool",
    phrases: ["swimming pool", "pool party", "pool timings", "can we swim"],
    keywords: ["pool", "swim", "swimming", "poolside", "water"],
    hints: ["party", "dj", "music"],
    answer:
      "Our **swimming pool** is one of the most loved parts of the resort. 🏊\n\nPoolside experience includes:\n• **Live music** and DJ nights\n• Refreshing drinks & comfy **lounge seating**\n• Exciting **water activities**\n• **Vibrant lighting** for evening parties\n• A **safe, well-maintained** environment\n\nIt's perfect for both quiet morning swims and full-scale pool party celebrations.",
    chips: ["Pool party package", "Book a party", "Other amenities"],
  },
  {
    id: "food",
    phrases: ["food menu", "what food", "catering options", "is food available", "veg or non veg", "khana"],
    keywords: ["food", "kitchen", "dining", "menu", "catering", "cuisine", "meal", "breakfast", "lunch", "dinner", "khana", "restaurant"],
    hints: ["veg", "jain", "buffet"],
    answer:
      "We have a **spacious gourmet kitchen** run by an experienced culinary team. 🍽️\n\n• **Multi-cuisine** menus — Indian, Rajasthani specialities and continental\n• Fully **customisable menus** for events\n• **Bulk catering** capability for weddings and large functions\n• Pure-veg, Jain and special dietary menus available on request\n• Freshly prepared, hygienic and served hot\n\nFor events, our chef can design a tasting menu with you in advance.",
    chips: ["Wedding catering", "Veg menu", "Get a quote"],
  },
  {
    id: "garden",
    phrases: ["garden area", "lawn space", "outdoor area", "open air"],
    keywords: ["garden", "gardens", "lawn", "lawns", "outdoor", "greenery", "landscape"],
    answer:
      "Our **beautifully landscaped gardens** offer an open-air setting that guests adore. 🌿\n\n• Manicured **open lawns** for large gatherings\n• Lush **floral landscaping** throughout\n• Gorgeous **evening lighting** for sunset ceremonies\n• Ideal for **mehndi, haldi, sangeet** and daytime functions\n• Perfect photo backdrops for your wedding album\n\nThe gardens pair beautifully with the banquet hall for multi-day celebrations.",
    chips: ["Wedding setup", "See gallery", "Book a visit"],
  },
  {
    id: "location",
    phrases: ["where is the resort", "how to reach", "how far from jaipur", "what is the address", "give me directions", "nearest airport"],
    keywords: ["location", "where", "address", "reach", "directions", "map", "far", "distance", "airport", "station", "route"],
    answer:
      `We're on **Diggi–Malpura Road**, just south of Jaipur. 📍\n\n**Full address:**\n${RESORT.address}\n\nThat location gives you:\n• Easy connectivity to Jaipur city, airport and railway station\n• A peaceful, green setting away from traffic and noise\n• Ample parking for cars, buses and baraat convoys\n\nScroll to the **Location** section for a live Google Map with one-tap directions — or call **${RESORT.phone}**.`,
    chips: ["Open map", "Parking", "📲 WhatsApp us", "Book a stay"],
  },
  {
    id: "whatsapp",
    phrases: ["whatsapp number", "message on whatsapp", "whatsapp par", "send on whatsapp", "chat on whatsapp"],
    keywords: ["whatsapp", "wa", "chat", "message", "msg"],
    answer:
      `Of course! You can reach our team on WhatsApp at **${RESORT.whatsapp}**. 📲\n\nEven better — tell me your **name, dates and occasion** and I'll package the whole enquiry and send it to WhatsApp for you, so you don't have to type it twice.\n\nShall we start?`,
    chips: ["Yes, start booking", "📲 WhatsApp us", "Call instead"],
  },
  {
    id: "instagram",
    phrases: ["instagram handle", "social media", "follow you"],
    keywords: ["instagram", "insta", "social", "facebook", "follow"],
    answer:
      `Follow us on Instagram at **${RESORT.instagram}** 📷 — we post real weddings, poolside evenings and behind-the-scenes from the resort.\n\nIt's the quickest way to see how the banquet hall, gardens and pool actually look when they're all lit up.`,
    chips: ["See gallery", "Book now", "📲 WhatsApp us"],
  },
  {
    id: "contact",
    phrases: ["contact number", "phone number", "how to contact", "email address", "talk to someone", "customer care"],
    keywords: ["contact", "phone", "call", "number", "email", "mail", "whatsapp", "reach"],
    answer:
      `Here's how to reach us directly: 📞\n\n• **Phone:** ${RESORT.phone}\n• **WhatsApp:** ${RESORT.whatsapp}\n• **Email:** ${RESORT.email}\n• **Instagram:** ${RESORT.instagram}\n• **Address:** ${RESORT.address}\n• **Reception:** Open **24 × 7**\n\nTell me your requirement and I can send the enquiry straight to our team on WhatsApp.`,
    chips: ["📲 WhatsApp us", "Book now", "Location"],
  },
  {
    id: "checkin",
    phrases: ["check in time", "check out time", "early check in", "late checkout"],
    keywords: ["checkin", "check-in", "checkout", "check-out", "timing", "timings", "arrival", "departure"],
    answer:
      `Standard timings at the resort: 🕐\n\n• **Check-in:** ${RESORT.checkIn}\n• **Check-out:** ${RESORT.checkOut}\n• **Reception:** staffed **24 × 7**\n\nEarly check-in and late check-out can usually be arranged subject to availability — just mention it when booking and we'll do our best.`,
    chips: ["Book a room", "Amenities", "Call resort"],
  },
  {
    id: "amenities",
    phrases: ["what facilities", "what amenities", "what do you offer", "features of resort"],
    keywords: ["amenities", "facilities", "features", "services", "wifi", "ac", "geyser", "housekeeping", "laundry"],
    answer:
      "Everything you need for a premium, effortless stay: ✨\n\n• **Comfort Stay** — AC rooms, geysers, hygienic modern comforts\n• **Peace & Privacy** — a private retreat with calm surroundings\n• **Best Location** — close to Jaipur, wrapped in nature\n• **Pool Parties** — music, lighting, lounge seating, water activities\n• **Payment Options** — multiple convenient payment modes\n• **Special Offers** — curated packages for getaways & business trips\n\nPlus a banquet hall, gourmet kitchen, landscaped gardens and 24×7 reception.",
    chips: ["Room details", "Pool", "Special offers"],
  },
  {
    id: "offers",
    phrases: ["any offers", "any discount", "special offer", "deal available", "package deal"],
    keywords: ["offer", "offers", "discount", "deal", "deals", "package", "promo", "coupon"],
    answer:
      "Yes — we run **curated special offers** through the year. 🎁\n\n• Romantic **getaway packages** for couples\n• **Business trip** rates with flexible terms\n• **Multi-night** and bulk room-block discounts\n• Bundled **wedding packages** (hall + rooms + catering)\n• Seasonal **pool party** packages\n\nShare your dates and occasion and I'll have the team send across the best applicable offer.",
    chips: ["Get best offer", "Wedding package", "Book now"],
  },
  {
    id: "payment",
    phrases: ["payment options", "how to pay", "do you accept upi", "card payment", "advance payment"],
    keywords: ["payment", "pay", "upi", "card", "cash", "online", "advance", "deposit", "refund"],
    answer:
      "We offer a range of **convenient payment options** to suit your preference. 💳\n\n• UPI, debit & credit cards\n• Net banking and bank transfer\n• Cash at reception\n• Staged payments for large events (advance + balance)\n\nFor weddings and banquet bookings, a confirmation advance secures your date. Our team will share the exact schedule in writing.",
    chips: ["Booking process", "Cancellation", "Call resort"],
  },
  {
    id: "cancellation",
    phrases: ["cancellation policy", "can i cancel", "refund policy", "reschedule booking"],
    keywords: ["cancel", "cancellation", "refund", "reschedule", "postpone", "policy"],
    answer:
      "We try to keep our policy flexible and fair. 📋\n\n• **Room bookings** — cancellations made well in advance are eligible for a refund or free date change\n• **Event bookings** — terms depend on how close the cancellation is to the event date\n• **Rescheduling** is usually accommodated subject to availability\n\nExact terms are confirmed in writing at the time of booking. For a specific case, please call **" +
      RESORT.phone +
      "**.",
    chips: ["Call resort", "Book now"],
  },
  {
    id: "parking",
    phrases: ["parking available", "car parking", "is parking free"],
    keywords: ["parking", "park", "car", "vehicle", "bus", "valet"],
    answer:
      "Yes — we have **ample on-site parking**. 🚗\n\n• Spacious parking for cars and larger vehicles\n• Dedicated arrangements for **baraat and event convoys**\n• Bus/tempo traveller parking for group arrivals\n• Secure and well-lit in the evenings\n\nFor large weddings, our team plans traffic flow and parking in advance so arrivals stay smooth.",
    chips: ["Wedding logistics", "Location", "Book now"],
  },
  {
    id: "events",
    phrases: ["what events", "corporate event", "birthday party", "anniversary celebration", "conference hall"],
    keywords: ["event", "events", "party", "birthday", "anniversary", "corporate", "conference", "meeting", "celebration", "function"],
    answer:
      "We host a wide range of occasions 🎉:\n\n• **Weddings & Receptions** — hall, gardens and poolside combined\n• **Corporate Events** — conferences, offsites and team gatherings\n• **Birthday Parties** — themed setups with custom catering\n• **Anniversaries & Family Functions**\n• **Pool Parties** — music, lighting and lounge seating\n\nEach event gets a dedicated coordinator, custom decor and menus crafted by our in-house kitchen.",
    chips: ["Wedding details", "Corporate enquiry", "Get a quote"],
  },
  {
    id: "gallery",
    phrases: ["show me photos", "see pictures", "image gallery", "how does it look"],
    keywords: ["photo", "photos", "picture", "pictures", "gallery", "images", "look", "video"],
    answer:
      "Absolutely! 📸 Scroll to the **Resort Gallery** section on this page to see our rooms, banquet hall, pool, kitchen and gardens.\n\nWant a closer look? We also offer:\n• A **guided site visit** at the resort\n• A **video walkthrough** sent over WhatsApp\n\nShall I arrange one for you?",
    chips: ["Arrange site visit", "Send on WhatsApp", "Book now"],
  },
  {
    id: "pets",
    phrases: ["are pets allowed", "pet friendly", "can i bring my dog"],
    keywords: ["pet", "pets", "dog", "cat", "animal"],
    answer:
      "Pet policies depend on the room category and whether an event is running on-site. 🐾\n\nWe do our best to accommodate well-behaved pets with prior notice. Please mention it at the time of booking so we can assign a suitable room and inform housekeeping.\n\nCall **" +
      RESORT.phone +
      "** to confirm for your dates.",
    chips: ["Call resort", "Book a room"],
  },
  {
    id: "reviews",
    phrases: ["any reviews", "customer review", "guest feedback", "what do guests say", "is it good", "rating of resort", "write a review"],
    keywords: ["review", "reviews", "rating", "ratings", "feedback", "testimonial", "experience"],
    answer:
      "Our guests rate us **5★** and most of them are from Jaipur, Jodhpur, Udaipur and across Rajasthan. ⭐\n\nRecent highlights:\n• *\"Nothing came close to Vrinda Valley\"* — Ananya & Rohan, wedding\n• *\"Rajasthani hospitality ka asli example\"* — Mahendra Singh, Jodhpur\n• *\"Pool lighting was gorgeous\"* — Priya, birthday pool party\n\nScroll to the **Reviews & Moments** section to read them all — and if you've stayed with us, please do share your own review and photo there. We'd love that! 🌸",
    chips: ["See reviews", "Share my review", "Book now"],
  },
  {
    id: "directions",
    phrases: ["show me on map", "google map", "map location", "share location"],
    keywords: ["map", "maps", "gps", "pin", "navigate", "navigation"],
    answer:
      "You'll find us on the **Location & Directions** section of this page — there's a live Google Map with a one-tap **Get Directions** button. 🗺️\n\nWe're in **Jaipur, Rajasthan**, easily reachable from:\n• Jaipur International Airport\n• Jaipur Junction Railway Station\n• NH-48 Delhi–Jaipur Highway\n\nAmple parking is available on site, including for baraat convoys.",
    chips: ["Open map", "Parking", "Call resort"],
  },
  {
    id: "thanks",
    phrases: ["thank you", "thanks a lot", "shukriya", "dhanyavad", "great help"],
    keywords: ["thanks", "thank", "thx", "shukriya", "dhanyavad", "awesome", "perfect", "helpful"],
    answer:
      "It's my pleasure! 🙏 I'm always here if anything else comes up.\n\nWe'd love to host you at Vrinda Valley Resort — whether it's a quiet weekend or the biggest day of your life. ✨",
    chips: ["Book now", "Call resort"],
  },
  {
    id: "bye",
    phrases: ["bye bye", "see you", "talk later", "good night"],
    keywords: ["bye", "goodbye", "alvida", "later", "exit", "close"],
    answer:
      "Goodbye, and thank you for visiting! 🌸\n\nWhenever you're ready, I'm right here. You can also reach our team anytime at **" +
      RESORT.phone +
      "**. Safe travels!",
    chips: ["Book now"],
  },
];

/** Word-level synonym normalisation applied before matching. */
export const SYNONYMS: Record<string, string> = {
  kamra: "room", kamre: "room", kamara: "room",
  shadi: "wedding", shaadi: "wedding", vivah: "wedding", byah: "wedding",
  keemat: "price", daam: "price", kitna: "price", kitne: "price", paisa: "price", rupee: "price", rs: "price",
  khana: "food", bhojan: "food", nashta: "food",
  jagah: "location", kaha: "location", kahan: "location", pata: "location",
  booking: "book", reserve: "book", reservation: "book",
  hall: "banquet", marriage: "wedding",
  swimmingpool: "pool",
  avail: "available", availability: "available",
  info: "about", details: "about", detail: "about",
  ph: "phone", mob: "phone", mobile: "phone", contactno: "phone",
};
