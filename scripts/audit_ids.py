import json
import unicodedata
import re

with open("data/players.json", "r", encoding="utf-8") as f:
    db = json.load(f)

with open("nba_players_map.json", "r", encoding="utf-8") as f:
    nba_map = json.load(f)

id2name = {int(k): v for k, v in nba_map["id_to_name"].items()}

def normalize(name):
    s = unicodedata.normalize('NFD', name)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower().replace('.', '').replace("'", '').replace('-', ' ')
    s = re.sub(r'\s+(jr|sr|ii|iii|iv|v)$', '', s)
    return ' '.join(s.split())

norm_to_ids = {}
for pid, full_name in id2name.items():
    n = normalize(full_name)
    if n not in norm_to_ids:
        norm_to_ids[n] = []
    norm_to_ids[n].append((pid, full_name))

all_db_players = []
for pos, plist in db.items():
    for p in plist:
        all_db_players.append((pos, p))

# Categorize each player
# 1. Exact ID and name match
# 2. Name matches NBA player, but current ID is wrong
# 3. ID matches an NBA player, but name is completely different (collision / wrong ID assigned)
# 4. Neither ID nor normalized name found in NBA map

exact_ok = []
wrong_id_found_correct = []
unmatched = []

for pos, p in all_db_players:
    pid = p["id"]
    name = p["n"]
    n_name = normalize(name)
    
    current_id_nba_name = id2name.get(pid)
    
    if current_id_nba_name and normalize(current_id_nba_name) == n_name:
        exact_ok.append((pos, p, current_id_nba_name))
    elif n_name in norm_to_ids:
        # We know the correct ID for this player!
        correct_candidates = norm_to_ids[n_name]
        wrong_id_found_correct.append((pos, p, current_id_nba_name, correct_candidates))
    else:
        unmatched.append((pos, p, current_id_nba_name))

print(f"Total DB players: {len(all_db_players)}")
print(f"Exact match (ID matches Name): {len(exact_ok)}")
print(f"Wrong ID, but Name found in NBA: {len(wrong_id_found_correct)}")
print(f"Unmatched (Name not directly normalized in NBA map): {len(unmatched)}")

with open("scripts/wrong_ids_report.txt", "w", encoding="utf-8") as out:
    out.write(f"WRONG IDS FOUND ({len(wrong_id_found_correct)}):\n")
    for pos, p, curr_nba, cands in wrong_id_found_correct:
        cand_str = ", ".join(f"{c_id} ({c_name})" for c_id, c_name in cands)
        out.write(f"[{pos.upper()}] DB ID: {p['id']}, Name: '{p['n']}' | Current ID belongs to: '{curr_nba}' | Correct NBA ID: {cand_str}\n")
    
    out.write(f"\nUNMATCHED PLAYERS ({len(unmatched)}):\n")
    for pos, p, curr_nba in unmatched:
        out.write(f"[{pos.upper()}] DB ID: {p['id']}, Name: '{p['n']}' | Current ID belongs to: '{curr_nba}'\n")

print("Report written to scripts/wrong_ids_report.txt")
