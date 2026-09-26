import urllib.request
import urllib.parse
import json
import ssl
import re
import unicodedata
import csv

ctx = ssl._create_unverified_context()

print("Loading official NBA players map...")
with open("nba_players_map.json", "r", encoding="utf-8") as f:
    map_data = json.load(f)

name_to_id = map_data["name_to_id"]
id_to_name = {int(k): v for k, v in map_data["id_to_name"].items()}

def normalize_name(s):
    nfkd = unicodedata.normalize('NFKD', s)
    ascii_str = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    clean = ascii_str.lower().replace('.', '').replace("'", "").replace("-", " ").strip()
    for suff in [" jr", " ii", " iii", " iv"]:
        if clean.endswith(suff):
            clean = clean[:-len(suff)].strip()
    return clean

normalized_nba_players = {}
for pid, full_name in id_to_name.items():
    norm = normalize_name(full_name)
    normalized_nba_players[norm] = (pid, full_name)

def match_nba_player(name):
    # Direct
    if name.lower() in name_to_id:
        pid = name_to_id[name.lower()]
        return pid, id_to_name[pid]
    norm = normalize_name(name)
    if norm in normalized_nba_players:
        return normalized_nba_players[norm]
    # Check partial
    for k, (pid, full) in normalized_nba_players.items():
        if k == norm or (len(norm) > 6 and (norm in k or k in norm)):
            return pid, full
    return None, None

def fetch_wiki_category(cat_name, max_pages=6):
    players = []
    cmcontinue = None
    headers = {'User-Agent': 'NBA-Draft-Database-Builder/1.0 (contact@nbadraft.local)'}
    
    for _ in range(max_pages):
        params = {
            'action': 'query',
            'list': 'categorymembers',
            'cmtitle': cat_name,
            'cmlimit': '500',
            'format': 'json'
        }
        if cmcontinue:
            params['cmcontinue'] = cmcontinue
            
        url = 'https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                members = data.get('query', {}).get('categorymembers', [])
                for m in members:
                    t = m['title']
                    if t.startswith('Category:') or t.startswith('Template:'):
                        continue
                    clean_t = re.sub(r'\(.*?\)', '', t).strip()
                    players.append(clean_t)
                
                cmcontinue = data.get('continue', {}).get('cmcontinue')
                if not cmcontinue:
                    break
        except Exception as e:
            print(f"Error fetching {cat_name}: {e}")
            break
            
    return players

print("Fetching Wikipedia category members for positions...")
wiki_categories = {
    'pg': 'Category:Point guards',
    'sg': 'Category:Shooting guards',
    'sf': 'Category:Small forwards',
    'pf': 'Category:Power forwards',
    'c': 'Category:Centers (basketball)'
}

wiki_players_by_pos = {}
for pos_key, cat in wiki_categories.items():
    raw_list = fetch_wiki_category(cat, max_pages=4)
    matched = []
    seen = set()
    for name in raw_list:
        pid, official_name = match_nba_player(name)
        if pid and pid not in seen:
            seen.add(pid)
            matched.append((official_name, pid))
    wiki_players_by_pos[pos_key] = matched
    print(f"Wiki {pos_key.upper()}: {len(raw_list)} scraped, {len(matched)} matched official NBA IDs")

with open("scripts/scraped_wiki_players.json", "w", encoding="utf-8") as f:
    json.dump(wiki_players_by_pos, f, indent=2)
print("Saved scripts/scraped_wiki_players.json")
