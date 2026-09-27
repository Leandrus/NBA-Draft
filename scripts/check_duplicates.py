import json
import urllib.request
import ssl

with open("data/players.json", "r", encoding="utf-8") as f:
    db = json.load(f)

with open("nba_players_map.json", "r", encoding="utf-8") as f:
    nba_map = json.load(f)

id2name = {int(k): v for k, v in nba_map["id_to_name"].items()}

# Let's check duplicates
ids_seen = {}
for pos, plist in db.items():
    for p in plist:
        pid = p["id"]
        if pid in ids_seen:
            print(f"DUPLICATE ID {pid}: {p['n']} ({pos}) vs {ids_seen[pid]['n']} ({ids_seen[pid]['pos']})")
        else:
            ids_seen[pid] = {"n": p["n"], "pos": pos}

print(f"Unique IDs in DB: {len(ids_seen)}")
