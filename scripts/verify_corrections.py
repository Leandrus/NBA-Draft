import json
import unicodedata
import re

with open("data/players.json", "r", encoding="utf-8") as f:
    db = json.load(f)

with open("nba_players_map.json", "r", encoding="utf-8") as f:
    nba_map = json.load(f)

id2name = {int(k): v for k, v in nba_map["id_to_name"].items()}

def clean(s):
    nfkd = unicodedata.normalize('NFKD', s)
    ascii_str = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    c = ascii_str.lower().replace('.', '').replace("'", '').replace('-', ' ').strip()
    c = re.sub(r'\s+(jr|sr|ii|iii|iv|v)$', '', c)
    return ' '.join(c.split())

clean_to_nba = {}
for pid, full in id2name.items():
    c = clean(full)
    if c not in clean_to_nba:
        clean_to_nba[c] = []
    clean_to_nba[c].append((pid, full))

# Known manual corrections / nicknames if needed
aliases = {
    clean("Fat Lever"): 77376,       # Lafayette "Fat" Lever
    clean("Jo Jo White"): 78510,     # Jojo White
    clean("Steve Smith"): 120,       # Steven Smith
    clean("Amare Stoudemire"): 2405, # Amar'e Stoudemire
    clean("Metta World Peace"): 1897,# Metta World Peace (Ron Artest)
    clean("Ron Harper"): 166,        # Ron Harper (Cavs/Bulls)
    clean("Glen Rice"): 779,         # Glen Rice (Heat/Hornets)
    clean("Larry Nance"): 77685,     # Larry Nance (Cavs/Suns)
    clean("Bobby Jones"): 77193,     # Bobby Jones (76ers)
    clean("Dan Majerle"): 105,       # Dan Majerle (Suns)
}

verified_corrections = {}

for pos in ['pg', 'sg', 'sf', 'pf', 'c']:
    for p in db[pos]:
        curr_id = p['id']
        name = p['n']
        c_name = clean(name)
        curr_nba_name = id2name.get(curr_id)
        
        # Check if already correct
        if curr_nba_name and clean(curr_nba_name) == c_name:
            continue
            
        # Needs correction
        correct_id = None
        if c_name in aliases:
            correct_id = aliases[c_name]
        elif c_name in clean_to_nba:
            candidates = clean_to_nba[c_name]
            if len(candidates) == 1:
                correct_id = candidates[0][0]
            else:
                print(f"Ambiguous: {name} -> {candidates}")
        else:
            print(f"NOT FOUND: {name}")
            
        if correct_id:
            verified_corrections[(pos, name, curr_id)] = (correct_id, id2name.get(correct_id), curr_nba_name)

print(f"Total corrections found: {len(verified_corrections)}")
for (pos, name, curr_id), (new_id, new_name, old_nba_name) in verified_corrections.items():
    print(f"[{pos.upper()}] '{name}': current id {curr_id} (NBA: '{old_nba_name}') -> NEW ID {new_id} (NBA: '{new_name}')")
