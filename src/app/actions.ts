"use server";

import { puppies } from "@/lib/site";

export type EnquiryState = { ok: boolean; message?: string; errors?: Partial<Record<"name" | "phone" | "email" | "area" | "message" | "website", string>> };

const PHONE = /^\+?[0-9][0-9\s().-]{6,19}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Receives both the contact letter and the per-puppy enquiry form.
 * Validates on the server (the forms use noValidate), silently drops bots that
 * fill the hidden "website" field, and logs the lead. Hook up email / a CRM here.
 */
export async function sendEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const data = { name: get("name"), phone: get("phone"), email: get("email"), area: get("area"), message: get("message"), puppyId: get("puppyId"), website: get("website") };

  if (data.website) return { ok: true }; // honeypot: pretend it worked

  const errors: EnquiryState["errors"] = {};
  if (data.name.length < 2) errors.name = "Please tell us your name.";
  else if (data.name.length > 80) errors.name = "That name is a little long — 80 characters max.";
  if (!data.phone) errors.phone = "Please add a phone or WhatsApp number.";
  else if (!PHONE.test(data.phone)) errors.phone = "Please check the number, including the country code.";
  if (data.email && !EMAIL.test(data.email)) errors.email = "That email address doesn't look right.";
  if (data.area.length > 80) errors.area = "Please keep the area under 80 characters.";
  if (data.message.length > 2000) errors.message = "Please keep the message under 2,000 characters.";
  if (Object.keys(errors).length) return { ok: false, message: "Almost there — please check the highlighted details.", errors };

  const puppy = puppies.find((p) => p.id === data.puppyId);
  console.info("[enquiry]", { ...data, website: undefined, puppy: puppy ? `${puppy.displayName} (${puppy.slug})` : null, at: new Date().toISOString() });
  return { ok: true };
}
