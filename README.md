# HORST – Ergebnisseite

Statische Seite (kein Build, keine externen Anfragen, keine Tracker) mit allen Benchmark-Ergebnissen des deutschen Korrekturmodells Horst-AI.

- Modell: https://huggingface.co/Bayernator/horst-ai · Demo: https://huggingface.co/spaces/Bayernator/HORST
- Benchmark: HORST-Hard, 2.400 Aufgaben, 12 Kategorien, Metrik F0,5 auf Wortebene

## Ergebnis eintragen
1. `bench_eval.py`-Ausgabe (`*.scores.json`) nach `scores/<id>.scores.json` legen. IDs: `horst-stufe1`, `horst-stufe2`, `languagetool` (weitere in `build_data.py` unter `SYSTEMS`).
2. `python3 build_data.py` → schreibt `data/results.json` (Systeme ohne Datei erscheinen als „Messung läuft“).
3. `node app.js` (Selbsttest), committen.

## Lokal ansehen
`python3 -m http.server` und http://localhost:8000 öffnen.

## Stand
Gemessen: Horst Stufe 1, Horst Stufe 2 (beide ohne lange Texte) und LanguageTool 6.6. Offen: lange Texte für Horst, Phase-3-Modell.

## Veröffentlichung
GitHub Pages, Branch `main`, Ordner `/` (`.nojekyll` liegt bei). Lizenz: noch nicht entschieden (Trainingsquellen teils CC-BY-SA).
