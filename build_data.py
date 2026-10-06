"""scores/*.scores.json (Ausgabe von bench_eval.py) + manifest.json -> data/results.json. Fehlende Systeme erscheinen als 'läuft'.

python3 build_data.py
Neues Ergebnis eintragen: Datei nach scores/<id>.scores.json legen, erneut ausführen, committen.
"""
import json
import os

SYSTEMS = [  # id, Anzeigename, Farbe-Schlüssel
    ("horst-stufe1", "Horst · Stufe 1", "s1"),
    ("horst-stufe2", "Horst · Stufe 2", "s2"),
    ("languagetool", "LanguageTool 6.6", "lt"),
]
KATEGORIEN = ["gross_klein", "komma_schwer", "getrennt_zusammen", "homophon", "grammatik", "tippfehler_dicht",
              "lautschrift", "mix_extrem", "lange_texte", "kontrolle", "lerner_echt", "wiki_echt"]
LABEL = {"gross_klein": "Groß & klein", "komma_schwer": "Komma, schwer", "getrennt_zusammen": "Getrennt / zusammen",
         "homophon": "Homophone", "grammatik": "Grammatik", "tippfehler_dicht": "Tippfehler, dicht", "lautschrift": "Lautschrift",
         "mix_extrem": "Mix, extrem", "lange_texte": "Lange Texte", "kontrolle": "Kontrolle", "lerner_echt": "Lernerfehler, echt",
         "wiki_echt": "Wikipedia-Edits, echt"}
here = os.path.dirname(os.path.abspath(__file__))
man = json.load(open(f"{here}/manifest.json", encoding="utf-8"))
systems = []
for sid, name, color in SYSTEMS:
    p = f"{here}/scores/{sid}.scores.json"
    sc = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else None
    cats = {k: {m: round(v, 4) for m, v in sc[k].items() if m != "n"} for k in KATEGORIEN if sc and k in sc}
    systems.append({"id": sid, "name": name, "color": color, "status": "fertig" if sc else "läuft", "kategorien": cats,
                    "makro": round(sc["_gesamt"]["makro_F05_korrektur"], 4) if sc else None})
out = {"benchmark": {"name": man["name"], "gesamt": man["gesamt"], "seed": man["seed"],
                     "kategorien": [{"id": k, "label": LABEL[k], "n": man["kategorien"][k]["n"], "beschreibung": man["beschreibung"][k],
                                     "fehler": man["kategorien"][k]["mittel_fehler"], "woerter": man["kategorien"][k]["mittel_woerter"]}
                                    for k in KATEGORIEN],
                     "ueberschneidung": man["ueberschneidung_trainingskorpus"]},
       "systems": systems}
json.dump(out, open(f"{here}/data/results.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print({s["id"]: s["status"] for s in systems})
