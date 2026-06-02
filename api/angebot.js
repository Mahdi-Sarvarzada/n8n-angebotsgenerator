export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "WEBHOOK_URL nicht konfiguriert" });
  }

  const n8nRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });

  if (!n8nRes.ok) {
    return res.status(n8nRes.status).json({ error: `Webhook-Fehler: ${n8nRes.status}` });
  }

  const text = await n8nRes.text();

  try {
    const json = JSON.parse(text);
    const markdown = json.formattedQuote ?? json.output ?? json.text ?? text;
    return res.status(200).send(markdown);
  } catch {
    return res.status(200).send(text);
  }
}
