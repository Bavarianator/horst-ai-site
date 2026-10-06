// Rendert data/results.json. Reine Funktionen (testbar mit `node app.js`), DOM nur im Browser.
const METRICS = { F05: "F0,5", P: "Precision", R: "Recall", exakt: "Exakt richtig" };
const pct = (v) => (v == null ? "–" : (v * 100).toFixed(0) + "%");
const num = (v, d = 2) => (v == null ? "–" : v.toFixed(d).replace(".", ","));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Wert einer Kategorie: "kontrolle" zeigt immer den Anteil unveränderter Sätze (F0,5/P/R sind dort bedeutungslos).
function value(sys, cat, metric) {
  const k = sys.kategorien[cat];
  if (!k) return null;
  return cat === "kontrolle" ? k.unveraendert : k[metric];
}

function rowHTML(name, note, systems, getter, extra = "") {
  const bars = systems.map((s) => {
    const v = getter(s);
    const label = v == null ? (s.status === "läuft" ? "läuft" : "nicht gemessen") : num(v);
    const fill = v == null ? "" : `<div class="fill" style="--w:${Math.round(v * 100)}%"></div>`;
    return `<div class="bar${v == null ? " none" : ""}" style="--c:var(--${s.color})" title="${esc(s.name)}" role="img" aria-label="${esc(s.name)}: ${esc(label)}"><div class="track">${fill}</div><span class="val">${label}</span></div>`;
  }).join("");
  return `<div class="row ${extra}"><div class="name">${esc(name)}<small>${esc(note)}</small></div><div class="bars">${bars}</div></div>`;
}

function chartHTML(data, metric) {
  const sys = data.systems;
  const makro = metric === "F05" ? rowHTML("Makro-Schnitt", "F0,5, 10 Kategorien ohne Kontrolle und lange Texte", sys, (s) => s.makro, "makro") : "";
  const rows = data.benchmark.kategorien.map((c) =>
    rowHTML(c.label, c.id === "kontrolle" ? "Anteil unverändert, höher ist besser" : `n=${c.n} · ${c.fehler.toString().replace(".", ",")} Fehler/${c.id === "lange_texte" ? "Text, ca. " + Math.round(c.woerter) + " Wörter" : "Satz"}`,
            sys, (s) => value(s, c.id, metric)));
  return makro + rows.join("");
}

function tableHTML(data) {
  const sys = data.systems.filter((s) => s.status === "fertig");
  const head = `<tr><th>Kategorie</th>${sys.map((s) => ["F0,5", "P", "R", "exakt", "FP/100W"].map((m) => `<th>${esc(s.name)}<br>${m}</th>`).join("")).join("")}</tr>`;
  const body = data.benchmark.kategorien.map((c) =>
    `<tr><td>${esc(c.label)}</td>${sys.map((s) => {
      const k = s.kategorien[c.id], kon = c.id === "kontrolle";  // Kontrolle: F0,5/P/R sind bedeutungslos
      return k ? [kon ? "–" : num(k.F05), kon ? "–" : num(k.P), kon ? "–" : num(k.R), pct(k.exakt), num(k.fp_je_100_woerter, 1)].map((x) => `<td>${x}</td>`).join("") : '<td colspan="5">–</td>';
    }).join("")}</tr>`).join("");
  return head + body;
}

function legendHTML(data) {
  return data.systems.map((s) => `<span style="--c:var(--${s.color})"><i></i>${esc(s.name)}${s.status === "läuft" ? " <em>Messung läuft</em>" : ""}</span>`).join("");
}

const SPARK = [["Stufe 1", 0.40], ["Stufe 2", 0.62]]; // Falko-dev, greedy, 200 Sätze (Trainingslogs)
const sparkHTML = () => SPARK.map(([n, v]) => `<div><b>${num(v)}</b><i style="height:${Math.round(v * 100)}%"></i>${n}</div>`).join("");

if (typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);
  fetch("data/results.json").then((r) => r.json()).then((data) => {
    const b = data.benchmark;
    $("stat-items").textContent = b.gesamt.toLocaleString("de-DE");
    $("bench-sub").textContent = `${b.gesamt.toLocaleString("de-DE")} Aufgaben in 12 Kategorien, Seed ${b.seed}. Je Kategorie dieselbe Metrik für jedes System. Kategorien ohne Messwert sind gestrichelt.`;
    const o = b.ueberschneidung;
    $("overlap").textContent = `${o.pool_entfernt.toLocaleString("de-DE")} von ${o.pool_vorher.toLocaleString("de-DE")} Kandidatensätzen und ${o.echt_entfernt} von ${o.echt_vorher.toLocaleString("de-DE")} echten Paaren entfernt.`;
    $("legend").innerHTML = legendHTML(data);
    $("table").innerHTML = tableHTML(data);
    $("spark").innerHTML = sparkHTML();
    const draw = (metric) => {
      $("chart").innerHTML = chartHTML(data, metric);
      $("status").textContent = `Kennzahl: ${METRICS[metric]}`;
      void $("chart").offsetWidth;  // Reflow, damit die Balken-Transition startet
      requestAnimationFrame(() => document.querySelectorAll(".fill").forEach((f) => (f.style.width = f.style.getPropertyValue("--w"))));
    };
    document.querySelectorAll(".controls button").forEach((btn) => btn.addEventListener("click", () => {
      document.querySelectorAll(".controls button").forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
      draw(btn.dataset.metric);
    }));
    draw("F05");
  }).catch(() => { $("chart").textContent = "Daten konnten nicht geladen werden."; });
} else {
  // Selbsttest: node app.js
  const assert = require("assert");
  const data = JSON.parse(require("fs").readFileSync(__dirname + "/data/results.json", "utf8"));
  const html = chartHTML(data, "F05");
  assert.strictEqual(html.match(/class="row/g).length, 13, "Makro + 12 Kategorien");
  assert.strictEqual((chartHTML(data, "R").match(/class="row/g) || []).length, 12, "Makro nur bei F0,5");
  assert.ok(html.includes("nicht gemessen"), "lange Texte: nicht gemessen");
  assert.ok(html.includes("Anteil unverändert"), "Kontrolle beschriftet");
    assert.strictEqual(value(data.systems[0], "kontrolle", "F05"), 0.95, "Kontrolle = unverändert");
  assert.strictEqual(value(data.systems[0], "lange_texte", "F05"), null, "lange Texte nicht gemessen");
  assert.ok(!/NaN|undefined/.test(html + tableHTML(data)), "keine NaN/undefined");
  for (const m of Object.keys(METRICS)) assert.ok(chartHTML(data, m).length > 500, m);
  console.log("app.js Selbsttest OK");
}
