import { SEO, SEO_KEYWORDS, CONTACT, MAP, type Review, type Story } from "./data";

/* ---------- head helpers ---------- */

function meta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function link(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function jsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/* ---------- main ---------- */

export type SeoSettings = {
  title: string;
  description: string;
  keywords: string[];
};

export const defaultSeo = (): SeoSettings => ({
  title: SEO.title,
  description: SEO.description,
  keywords: [...SEO_KEYWORDS],
});

export function applySeo(s: SeoSettings, reviews: Review[], stories: Story[]) {
  document.title = s.title;
  document.documentElement.lang = "en-IN";

  meta("name", "description", s.description);
  meta("name", "keywords", s.keywords.join(", "));
  meta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1");
  meta("name", "author", "Vrinda Valley Resort");
  meta("name", "geo.region", "IN-RJ");
  meta("name", "geo.placename", "Jaipur, Rajasthan");
  meta("name", "geo.position", `${MAP.lat};${MAP.lng}`);
  meta("name", "ICBM", `${MAP.lat}, ${MAP.lng}`);
  meta("name", "theme-color", "#052e21");

  // Open Graph
  meta("property", "og:type", "business.business");
  meta("property", "og:site_name", "Vrinda Valley Resort");
  meta("property", "og:title", s.title);
  meta("property", "og:description", s.description);
  meta("property", "og:url", SEO.url);
  meta("property", "og:locale", "en_IN");
  meta("property", "og:image", "https://raw.githubusercontent.com/darshita27/Vrinda-Valley-Resort/main/client/assets/header_img.png");

  // Twitter
  meta("name", "twitter:card", "summary_large_image");
  meta("name", "twitter:title", s.title);
  meta("name", "twitter:description", s.description);

  link("canonical", SEO.url);

  /* ----- structured data ----- */
  const approved = reviews.filter((r) => r.approved);
  const avg =
    approved.length > 0
      ? (approved.reduce((a, r) => a + r.rating, 0) / approved.length).toFixed(1)
      : "5.0";

  jsonLd("ld-resort", {
    "@context": "https://schema.org",
    "@type": "Resort",
    "@id": `${SEO.url}#resort`,
    name: "Vrinda Valley Resort",
    description: s.description,
    url: SEO.url,
    telephone: [CONTACT.phoneRaw, CONTACT.phone2Raw],
    email: CONTACT.email,
    sameAs: [CONTACT.instagramUrl, `https://wa.me/${CONTACT.whatsapp}`],
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Net Banking",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Vrinda Valley, Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "303904",
      addressCountry: "IN",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    geo: { "@type": "GeoCoordinates", latitude: MAP.lat, longitude: MAP.lng },
    hasMap: MAP.search,
    numberOfRooms: 16,
    checkinTime: "14:00",
    checkoutTime: "11:00",
    amenityFeature: [
      "Banquet Hall",
      "Swimming Pool",
      "Landscaped Gardens",
      "Gourmet Kitchen",
      "Air Conditioning",
      "Free Parking",
      "24x7 Reception",
    ].map((n) => ({ "@type": "LocationFeatureSpecification", name: n, value: true })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg,
      reviewCount: Math.max(approved.length, 1),
      bestRating: 5,
    },
    review: approved.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
  });

  jsonLd("ld-faq", {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ["How many rooms does Vrinda Valley Resort have?", "Vrinda Valley Resort has 16 elegantly crafted rooms, all air-conditioned with geysers and modern comforts."],
      ["Is Vrinda Valley Resort good for a destination wedding in Jaipur?", "Yes. The resort offers a grand banquet hall, landscaped gardens, poolside venues and 16 on-site rooms, making it a complete destination wedding venue in Jaipur, Rajasthan."],
      ["Does the resort have a swimming pool?", "Yes, there is a swimming pool with lounge seating, vibrant lighting and live music options for pool parties."],
      ["Where is Vrinda Valley Resort located?", "Vrinda Valley Resort is located at Diggi Malpura Road, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904 — with convenient access to Jaipur while surrounded by natural beauty."],
      ["How do I book Vrinda Valley Resort?", "You can book by calling +91 95304 29585 or +91 95711 98339, messaging us on WhatsApp, emailing vrindavalleyjaipur@gmail.com, or using the AI concierge on our website which sends your enquiry directly to our team on WhatsApp."],
      ["What are the check-in and check-out timings?", "Check-in is at 2:00 PM and check-out is at 11:00 AM. Reception is open 24x7."],
      ["Is parking available at the resort?", "Yes, ample on-site parking is available, including arrangements for baraat convoys and large group arrivals."],
    ].map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  });

  const published = stories.filter((st) => st.published);
  if (published.length) {
    jsonLd("ld-blog", {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Vrinda Valley Resort Stories",
      blogPost: published.map((st) => ({
        "@type": "BlogPosting",
        headline: st.title,
        description: st.excerpt,
        datePublished: st.date,
        author: { "@type": "Organization", name: st.author },
        keywords: st.keywords.join(", "),
        image: st.cover,
      })),
    });
  }

  jsonLd("ld-breadcrumb", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      ["Home", "#home"],
      ["Accommodations", "#accommodations"],
      ["Events & Weddings", "#events"],
      ["Reviews", "#reviews"],
      ["Location", "#location"],
      ["Contact", "#contact"],
    ].map(([name, href], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${SEO.url}/${href}`,
    })),
  });
}
