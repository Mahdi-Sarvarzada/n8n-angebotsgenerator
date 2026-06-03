export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "WEBHOOK_URL nicht konfiguriert" });
  }

  // Read raw body from stream in case auto-parsing fails
  let body;
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    body = JSON.stringify(req.body);
  } else {
    body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => { data += chunk; });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  }

  console.log("Body gesendet an n8n:", body);

  const n8nRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!n8nRes.ok) {
    return res.status(n8nRes.status).json({ error: `Webhook-Fehler: ${n8nRes.status}` });
  }

  const text = await n8nRes.text();
  console.log("Antwort von n8n:", text);

  try {
    const json = JSON.parse(text);
    const markdown = json.formattedQuote ?? json.output ?? json.text ?? text;
    return res.status(200).send(markdown);
  } catch {
    return res.status(200).send(text);
  }
}
