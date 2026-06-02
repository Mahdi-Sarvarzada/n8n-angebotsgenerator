const WEBHOOK_URL = "https://n8n.srv1635149.hstgr.cloud/webhook/ee488a52-f293-48a9-af09-1fe3782fd789";

const form          = document.getElementById("angebotsform");
const submitBtn     = document.getElementById("submitBtn");
const fehlerEl      = document.getElementById("fehler");
const fehlerText    = document.getElementById("fehlerText");
const ergebnisEl    = document.getElementById("ergebnis");
const angebotsEl    = document.getElementById("angebotsinhalt");
const resultMetaEl  = document.getElementById("resultMeta");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  versteckeFehler();

  const daten = {
    projektbeschreibung: form.projektbeschreibung.value.trim(),
    stunden: Number(form.stunden.value),
    kundentyp: form.kundentyp.value,
  };

  const fehler = validiere(daten);
  if (fehler) { zeigeFehler(fehler); return; }

  setzeladezustand(true);
  ergebnisEl.classList.add("hidden");

  try {
    const markdown = await generiereAngebot(daten);
    zeigeErgebnis(markdown, daten);
  } catch (err) {
    zeigeFehler(`Fehler beim Generieren des Angebots: ${err.message}`);
  } finally {
    setzeladezustand(false);
  }
});

async function generiereAngebot(daten) {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(daten),
  });
  if (!res.ok) throw new Error(`Webhook antwortete mit Status ${res.status}`);
  return res.text();
}

function validiere(daten) {
  if (!daten.projektbeschreibung) return "Bitte eine Projektbeschreibung eingeben.";
  if (!daten.stunden || daten.stunden < 1) return "Bitte eine gültige Stundenanzahl (mindestens 1) eingeben.";
  if (!daten.kundentyp) return "Bitte einen Kundentyp auswählen.";
  return null;
}

function setzeladezustand(aktiv) {
  submitBtn.disabled = aktiv;
  submitBtn.classList.toggle("loading", aktiv);
}

function zeigeFehler(nachricht) {
  fehlerText.textContent = nachricht;
  fehlerEl.classList.remove("hidden");
}

function versteckeFehler() {
  fehlerEl.classList.add("hidden");
}

function zeigeErgebnis(markdown, daten) {
  const datum = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  resultMetaEl.textContent = `${daten.kundentyp} · ${daten.stunden} Std. · ${datum}`;
  angebotsEl.innerHTML = marked.parse(markdown);
  ergebnisEl.classList.remove("hidden");
  ergebnisEl.scrollIntoView({ behavior: "smooth", block: "start" });
}
