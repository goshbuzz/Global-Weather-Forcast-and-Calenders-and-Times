/* ==========================================================================
   Vercel serverless function — lightweight analytics endpoint
   POST /api/analytics
   Body: { page, referrer, timestamp, screen, lang }
   ========================================================================== */

export default async function handler(req, res) {
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
    const event = {
      receivedAt: new Date().toISOString(),
      page: req.body && req.body.page ? String(req.body.page) : "",
      referrer: req.body && req.body.referrer ? String(req.body.referrer) : "",
      timestamp: req.body && req.body.timestamp ? String(req.body.timestamp) : "",
      screen: req.body && req.body.screen ? String(req.body.screen) : "",
      lang: req.body && req.body.lang ? String(req.body.lang) : "",
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      ua: req.headers["user-agent"],
    };

    // Log to Vercel function logs (visible in the Vercel dashboard Analytics tab).
    // No personal data beyond IP/UA is stored — keep it privacy-friendly.
    // eslint-disable-next-line no-console
    console.log("PAGEVIEW", JSON.stringify(event));

    res.status(200).json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("ANALYTICS_ERROR", err);
    res.status(500).json({ ok: false, error: "Something went wrong" });
  }
}
