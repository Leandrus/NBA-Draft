import urllib.request
import ssl
import json

ctx = ssl._create_unverified_context()
url = 'https://raw.githubusercontent.com/swar/nba_api/master/src/nba_api/stats/library/data.py'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
    code = resp.read().decode('utf-8')
    local_vars = {}
    exec(code, {}, local_vars)
    players = local_vars.get('players', [])
    print(f"Total players fetched: {len(players)}")
    
    # Save mapping of name to id
    name_to_id = {}
    id_to_name = {}
    for p in players:
        # [id, last, first, full, is_active]
        pid, last, first, full, active = p[0], p[1], p[2], p[3], p[4]
        name_to_id[full.lower()] = pid
        name_to_id[f"{first} {last}".lower()] = pid
        id_to_name[pid] = full

    with open("nba_players_map.json", "w", encoding="utf-8") as f:
        json.dump({"name_to_id": name_to_id, "id_to_name": id_to_name}, f)
    print("Saved nba_players_map.json")
