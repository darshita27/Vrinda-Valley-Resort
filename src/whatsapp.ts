import { CONTACT } from "./data";

export type Lead = {
  name?: string;
  contact?: string;
  purpose?: string;
  dates?: string;
  guests?: string;
  message?: string;
  source?: string;
};

/** Builds a clean, readable WhatsApp message from a captured lead. */
export function buildLeadMessage(lead: Lead): string {
  const lines = [
    "*New Booking Enquiry* 🌸",
    "_via Vrinda Valley Resort website_",
    "",
    lead.name ? `*Name:* ${lead.name}` : "",
    lead.contact ? `*Contact:* ${lead.contact}` : "",
    lead.purpose ? `*Occasion:* ${lead.purpose}` : "",
    lead.dates ? `*Dates:* ${lead.dates}` : "",
    lead.guests ? `*Guests:* ${lead.guests}` : "",
    lead.message ? `*Message:* ${lead.message}` : "",
    "",
    `_Sent from ${lead.source ?? "website"} · ${new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })}_`,
  ];
  return lines.filter((l) => l !== "").join("\n");
}

/** Returns a wa.me deep link that opens WhatsApp with the message pre-filled. */
export function whatsappLink(lead: Lead, number: string = CONTACT.whatsapp): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(buildLeadMessage(lead))}`;
}

/** Opens WhatsApp in a new tab/app with the enquiry ready to send. */
export function sendToWhatsApp(lead: Lead, number?: string) {
  window.open(whatsappLink(lead, number), "_blank", "noopener,noreferrer");
}

/** Simple chat starter (no lead data). */
export function whatsappChat(text = "Hello! I'd like to know more about Vrinda Valley Resort.") {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}
