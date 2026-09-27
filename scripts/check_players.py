import json
import unicodedata

players_data = json.load(open('data/players.json', encoding='utf-8'))
map_data = json.load(open('nba_players_map.json', encoding='utf-8'))
id2name = {int(k): v for k, v in map_data['id_to_name'].items()}
name2id = map_data['name_to_id']

def clean(s):
    nfkd = unicodedata.normalize('NFKD', s)
    ascii_str = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    c = ascii_str.lower().replace('.', '').replace("'", '').replace('-', ' ').strip()
    for suff in [' jr', ' ii', ' iii', ' iv', ' sr']:
        if c.endswith(suff):
            c = c[:-len(suff)].strip()
    return c

clean_name_to_id = {}
for pid, full in id2name.items():
    clean_name_to_id[clean(full)] = pid

mismatches = []
not_in_map = []
perfect = []

for pos, plist in players_data.items():
    for p in plist:
        pid = p['id']
        name = p['n']
        nba_name = id2name.get(pid)
        c_name = clean(name)
        
        if nba_name:
            if clean(nba_name) == c_name:
                perfect.append((p, nba_name))
            else:
                suggested_id = clean_name_to_id.get(c_name) or name2id.get(name.lower())
                mismatches.append((p, nba_name, suggested_id))
        else:
            suggested_id = clean_name_to_id.get(c_name) or name2id.get(name.lower())
            not_in_map.append((p, suggested_id))

print(f"Total players in DB: {sum(len(v) for v in players_data.values())}")
print(f"Perfect match: {len(perfect)}")
print(f"Mismatches (PID exists in NBA, but name differs): {len(mismatches)}")
print(f"PID not in NBA map: {len(not_in_map)}")

print('\n--- SAMPLE MISMATCHES (PID belongs to another player) ---')
for p, nba_name, sugg_id in mismatches[:40]:
    print(f"DB ID {p['id']}: DB says '{p['n']}', but NBA ID {p['id']} is actually '{nba_name}'. Suggested correct ID for '{p['n']}': {sugg_id}")

print('\n--- SAMPLE PID NOT IN NBA MAP ---')
for p, sugg_id in not_in_map[:30]:
    print(f"DB ID {p['id']} not in NBA map! Player: '{p['n']}', Suggested ID: {sugg_id}")
