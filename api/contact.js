const CONTACT_EMAIL = process.env.CONTACT_TO_EMAIL || "ai@kleros.io";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

module.exports = async function contactHandler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  let body = request.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: "Invalid request." });
    }
  }

  if (clean(body.website, 200)) return response.status(200).json({ ok: true });

  const name = clean(body.name, 80);
  const email = clean(body.email, 160).toLowerCase();
  const organization = clean(body.organization, 120);
  const interest = clean(body.interest, 120);
  const message = clean(body.message, 3000);

  if (!name || !EMAIL_PATTERN.test(email) || !interest || message.length < 20) {
    return response.status(400).json({ error: "Please complete every required field." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return response.status(503).json({
      error: "Email delivery is being configured. Please email ai@kleros.io directly.",
    });
  }

  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    organization: escapeHtml(organization || "Not provided"),
    interest: escapeHtml(interest),
    message: escapeHtml(message).replaceAll("\n", "<br />"),
  };

  let resendResponse;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `kleros-contact-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject: `Kleros AI inquiry — ${interest}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Company or project: ${organization || "Not provided"}`,
          `Interest: ${interest}`,
          "",
          message,
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#191325">
            <p style="font-size:12px;letter-spacing:.08em;color:#6f40ed">KLEROS AI WEBSITE</p>
            <h1 style="font-size:28px;margin:12px 0 24px">New agentic economy inquiry</h1>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#777">Name</td><td style="padding:10px;border-bottom:1px solid #eee">${safe.name}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#777">Email</td><td style="padding:10px;border-bottom:1px solid #eee">${safe.email}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#777">Project</td><td style="padding:10px;border-bottom:1px solid #eee">${safe.organization}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#777">Interest</td><td style="padding:10px;border-bottom:1px solid #eee">${safe.interest}</td></tr>
            </table>
            <div style="margin-top:24px;padding:20px;border-radius:12px;background:#f6f3ff;line-height:1.6">${safe.message}</div>
          </div>
        `,
      }),
    });
  } catch (error) {
    console.error("Resend contact form request failed", error);
    return response.status(502).json({ error: "Message could not be sent. Please email ai@kleros.io directly." });
  }

  const resendResult = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    console.error("Resend contact form error", resendResponse.status, resendResult);
    return response.status(502).json({ error: "Message could not be sent. Please email ai@kleros.io directly." });
  }

  return response.status(200).json({ ok: true });
};
