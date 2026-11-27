/* ==========================================================================
   Vercel serverless function — contact form endpoint
   POST /api/contact
   Body: { name, email, subject, message }
   ========================================================================== */

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
      res.status(400).json({ ok: false, error: "name, email and message are required" });
      return;
    }

    // Basic email sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ ok: false, error: "Invalid email address" });
      return;
    }

    const submission = {
      receivedAt: new Date().toISOString(),
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || "").trim(),
      message: String(message).trim(),
    };

    // In a production setup you'd forward this to an email service
    // (Resend, SendGrid, Mailgun, etc.) and/or write to a database/CRM.
    // Here we log it to the Vercel function logs so it's visible in the dashboard.
    // eslint-disable-next-line no-console
    console.log("CONTACT_SUBMISSION", JSON.stringify(submission));

    res.status(200).json({
      ok: true,
      message: "Thanks — your message has been received. We'll get back to you soon."
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("CONTACT_ERROR", err);
    res.status(500).json({ ok: false, error: "Something went wrong. Please try again later." });
  }
}
