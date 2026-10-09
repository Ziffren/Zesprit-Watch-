import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendOrderNotification(params: {
  watchTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  message: string | null;
  orderId: string;
}) {
  if (!resend || !notificationEmail) {
    console.warn(
      "Resend isn't configured (RESEND_API_KEY / ORDER_NOTIFICATION_EMAIL) — skipping order notification email."
    );
    return;
  }

  const lines = [
    `New request to buy: ${params.watchTitle}`,
    "",
    `Name: ${params.customerName}`,
    `Email: ${params.customerEmail}`,
    params.customerPhone ? `Phone: ${params.customerPhone}` : null,
    params.message ? `\nMessage:\n${params.message}` : null,
    "",
    `View in admin: https://zesprit-watch.vercel.app/admin/orders/${params.orderId}`,
  ].filter((line): line is string => line !== null);

  try {
    await resend.emails.send({
      from: "Z’esprit Watch <no-reply@zespritwatch.com>",
      to: notificationEmail,
      subject: `New order request — ${params.watchTitle}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    // Never let an email failure block the order from being saved.
    console.error("Failed to send order notification email:", err);
  }
}

export async function sendMessageNotification(params: {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  messageId: string;
}) {
  if (!resend || !notificationEmail) {
    console.warn(
      "Resend isn't configured (RESEND_API_KEY / ORDER_NOTIFICATION_EMAIL) — skipping message notification email."
    );
    return;
  }

  const lines = [
    `New message from ${params.name}`,
    "",
    `Email: ${params.email}`,
    params.phone ? `Phone: ${params.phone}` : null,
    "",
    params.message,
    "",
    `View in admin: https://zesprit-watch.vercel.app/admin/messages/${params.messageId}`,
  ].filter((line): line is string => line !== null);

  try {
    await resend.emails.send({
      from: "Z’esprit Watch <no-reply@zespritwatch.com>",
      to: notificationEmail,
      subject: `New message — ${params.name}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    // Never let an email failure block the message from being saved.
    console.error("Failed to send message notification email:", err);
  }
}

export async function sendSourcingNotification(params: {
  id: string;
  brand: string;
  model: string | null;
  budget: string;
  condition: string;
  boxPapers: string;
  details: string | null;
  referenceLinks: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  contactMethod: string;
}) {
  if (!resend || !notificationEmail) {
    console.warn("Resend isn't configured — skipping sourcing notification email.");
    return;
  }

  const watch = [params.brand, params.model].filter(Boolean).join(" ");
  const lines = [
    `New sourcing request: ${watch}`,
    "",
    `Budget: ${params.budget}`,
    `Condition: ${params.condition}`,
    `Box & papers: ${params.boxPapers}`,
    params.details ? `\nDetails:\n${params.details}` : null,
    params.referenceLinks.length ? `\nReferences:\n${params.referenceLinks.join("\n")}` : null,
    "",
    `From: ${params.contactName} <${params.contactEmail}>`,
    params.contactPhone ? `Phone: ${params.contactPhone}` : null,
    `Prefers: ${params.contactMethod}`,
    "",
    `View in admin: https://zesprit-watch.vercel.app/admin/sourcing/${params.id}`,
  ].filter((line): line is string => line !== null);

  try {
    await resend.emails.send({
      from: "Z’esprit Watch <no-reply@zespritwatch.com>",
      to: notificationEmail,
      replyTo: params.contactEmail,
      subject: `Sourcing request — ${watch}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error("Failed to send sourcing notification email:", err);
  }
}
