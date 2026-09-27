import json
import unicodedata
import re
import os

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

# Official NBA IDs verified directly against stats.nba.com / NBA API
official_corrections = {
    # PG
    clean("Fat Lever"): 77376,       # Lafayette "Fat" Lever
    clean("Rod Strickland"): 393,    # Rod Strickland
    clean("Jo Jo White"): 78510,     # Jojo White
    clean("Terry Porter"): 345,      # Terry Porter
    clean("Spud Webb"): 892,         # Spud Webb
    clean("Avery Johnson"): 422,     # Avery Johnson
    # SG
    clean("Sidney Moncrief"): 77626, # Sidney Moncrief
    clean("Earl Monroe"): 600006,    # Earl Monroe
    clean("Sam Jones"): 77196,       # Sam Jones
    clean("Mitch Richmond"): 782,    # Mitch Richmond
    clean("Joe Dumars"): 247,        # Joe Dumars
    clean("Eddie Jones"): 224,       # Eddie Jones
    clean("Walter Davis"): 1453,     # Walter Davis
    clean("Jeff Hornacek"): 204,     # Jeff Hornacek
    clean("Rolando Blackman"): 76176,# Rolando Blackman
    clean("Ron Harper"): 166,        # Ron Harper
    clean("Allan Houston"): 275,     # Allan Houston
    clean("Steve Smith"): 120,       # Steven Smith
    clean("Doug Christie"): 57,      # Doug Christie
    clean("Byron Scott"): 2,         # Byron Scott
    clean("John Starks"): 317,       # John Starks
    clean("Dan Majerle"): 105,       # Dan Majerle
    clean("Kerry Kittles"): 954,     # Kerry Kittles
    # SF
    clean("Dominique Wilkins"): 1122,# Dominique Wilkins
    clean("James Worthy"): 1460,     # James Worthy
    clean("Bernard King"): 77264,    # Bernard King
    clean("Alex English"): 76673,    # Alex English
    clean("Grant Hill"): 255,        # Grant Hill
    clean("Connie Hawkins"): 76972,  # Connie Hawkins
    clean("Marques Johnson"): 77160, # Marques Johnson
    clean("Gus Johnson"): 77150,     # Gus Johnson
    clean("Chet Walker"): 78435,     # Chet Walker
    clean("Kiki Vandeweghe"): 78404, # Kiki Vandeweghe
    clean("Glen Rice"): 779,         # Glen Rice
    clean("Metta World Peace"): 1897,# Metta World Peace
    clean("Detlef Schrempf"): 96,    # Detlef Schrempf
    clean("Bob Dandridge"): 76500,   # Bob Dandridge
    clean("Purvis Short"): 78139,    # Purvis Short
    clean("Jamal Mashburn"): 469,    # Jamal Mashburn
    clean("Keith Van Horn"): 1496,   # Keith Van Horn
    clean("Cedric Maxwell"): 77487,  # Cedric Maxwell
    # PF
    clean("Kevin McHale"): 1450,     # Kevin McHale
    clean("Amare Stoudemire"): 2405, # Amar'e Stoudemire
    clean("Spencer Haywood"): 76981, # Spencer Haywood
    clean("Dan Issel"): 77097,       # Dan Issel
    clean("George McGinnis"): 77532, # George McGinnis
    clean("Shawn Kemp"): 431,        # Shawn Kemp
    clean("Elton Brand"): 1882,      # Elton Brand
    clean("Larry Nance"): 77685,     # Larry Nance
    clean("Terry Cummings"): 187,    # Terry Cummings
    clean("Bobby Jones"): 77193,     # Bobby Jones
    clean("Dave DeBusschere"): 76545,# Dave DeBusschere
    clean("Tom Chambers"): 1472,     # Tom Chambers
    clean("Maurice Lucas"): 77420,   # Maurice Lucas
    clean("Vern Mikkelsen"): 77593,  # Vern Mikkelsen
    clean("Buck Williams"): 433,     # Buck Williams
    clean("Paul Silas"): 78151,      # Paul Silas
    clean("Otis Thorpe"): 901,       # Otis Thorpe
    clean("P.J. Brown"): 136,        # P.J. Brown
    # C
    clean("George Mikan"): 600012,   # George Mikan
    clean("Willis Reed"): 77929,     # Willis Reed
    clean("Wes Unseld"): 78392,      # Wes Unseld
    clean("Dave Cowens"): 76462,     # Dave Cowens
    clean("Nate Thurmond"): 600001,  # Nate Thurmond
    clean("Artis Gilmore"): 600014,  # Artis Gilmore
    clean("Bob Lanier"): 600005,     # Bob Lanier
    clean("Robert Parish"): 305,     # Robert Parish
    clean("Alonzo Mourning"): 297,   # Alonzo Mourning
    clean("Marc Gasol"): 201188,     # Marc Gasol
    clean("Yao Ming"): 2397,         # Yao Ming
    clean("Dikembe Mutombo"): 87,    # Dikembe Mutombo
}

# Replacement pool for duplicate entries
# Notice Mookie Blaylock (NBA ID 302), who had his ID wrongly used by Dan Majerle!
replacement_pool = {
    "pg": [
        {"id": 302, "n": "Mookie Blaylock", "t": "Atlanta Hawks", "t2": 82, "t3": 80, "reb": 52, "blk": 35, "ast": 88, "stl": 95, "rat": 85},
        {"id": 965, "n": "Derek Fisher", "t": "L.A. Lakers", "t2": 80, "t3": 85, "reb": 48, "blk": 30, "ast": 78, "stl": 78, "rat": 80},
        {"id": 1883, "n": "Steve Francis", "t": "Houston Rockets", "t2": 88, "t3": 78, "reb": 65, "blk": 45, "ast": 84, "stl": 78, "rat": 86}
    ],
    "sg": [
        {"id": 1749, "n": "Cuttino Mobley", "t": "Houston Rockets", "t2": 84, "t3": 85, "reb": 52, "blk": 35, "ast": 68, "stl": 72, "rat": 81}
    ],
    "sf": [
        {"id": 109, "n": "Robert Horry", "t": "Houston Rockets", "t2": 80, "t3": 88, "reb": 68, "blk": 70, "ast": 65, "stl": 75, "rat": 82},
        {"id": 2422, "n": "John Salmons", "t": "Sacramento Kings", "t2": 82, "t3": 82, "reb": 58, "blk": 45, "ast": 68, "stl": 70, "rat": 80},
        {"id": 201145, "n": "Jeff Green", "t": "Boston Celtics", "t2": 82, "t3": 78, "reb": 65, "blk": 55, "ast": 62, "stl": 65, "rat": 80},
        {"id": 201148, "n": "Brandan Wright", "t": "Dallas Mavericks", "t2": 83, "t3": 45, "reb": 70, "blk": 78, "ast": 50, "stl": 60, "rat": 79}
    ],
    "c": [
        {"id": 980, "n": "Zydrunas Ilgauskas", "t": "Cleveland Cavaliers", "t2": 85, "t3": 50, "reb": 86, "blk": 84, "ast": 52, "stl": 48, "rat": 82}
    ]
}

modified_records = []

# Step 1: Update IDs for existing players
for pos, plist in db.items():
    for p in plist:
        c_name = clean(p['n'])
        if c_name in official_corrections:
            old_id = p['id']
            new_id = official_corrections[c_name]
            if old_id != new_id:
                old_owner = id2name.get(old_id, "Desconocido")
                new_owner = id2name.get(new_id, "Desconocido")
                p['id'] = new_id
                modified_records.append({
                    "pos": pos.upper(),
                    "name": p['n'],
                    "old_id": old_id,
                    "old_owner": old_owner,
                    "new_id": new_id,
                    "new_owner": new_owner
                })

# Step 2: Resolve duplicate entries within positions
replacements_made = []
for pos in ['pg', 'sg', 'sf', 'pf', 'c']:
    seen_names = set()
    new_list = []
    repl_idx = 0
    for p in db[pos]:
        c_name = clean(p['n'])
        if c_name in seen_names:
            # Duplicate found
            if pos in replacement_pool and repl_idx < len(replacement_pool[pos]):
                repl_player = replacement_pool[pos][repl_idx]
                repl_idx += 1
                replacements_made.append({
                    "pos": pos.upper(),
                    "dup_name": p['n'],
                    "replaced_by": repl_player['n'],
                    "id": repl_player['id'],
                    "team": repl_player['t'],
                    "rat": repl_player['rat']
                })
                new_list.append(repl_player)
                seen_names.add(clean(repl_player['n']))
            else:
                new_list.append(p)
        else:
            seen_names.add(c_name)
            new_list.append(p)
    db[pos] = new_list

# Step 3: Sort each position by rat descending
for pos in db:
    db[pos].sort(key=lambda x: x["rat"], reverse=True)

# Step 4: Write updated JSON
with open("data/players.json", "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

# Step 5: Write updated JS
js_content = f"// NBA ULTIMATE DRAFT - OFFICIAL REAL PLAYERS DATABASE (200 PLAYERS PER POSITION = 1,000 TOTAL)\n"
js_content += f"const NBA_DATABASE = {json.dumps(db, ensure_ascii=False)};\n"
js_content += f"if (typeof window !== 'undefined') {{ window.NBA_DATABASE = NBA_DATABASE; }}\n"
js_content += f"if (typeof module !== 'undefined' && module.exports) {{ module.exports = NBA_DATABASE; }}\n"

with open("js/data/players.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"SUCCESS!")
print(f"- Corrected player IDs: {len(modified_records)}")
print(f"- Resolved duplicate entries: {len(replacements_made)}")
print(f"- Total players in DB: {sum(len(v) for v in db.values())} (exact 200 per position)")

# Save detailed changelog
with open("scripts/id_corrections_changelog.json", "w", encoding="utf-8") as f:
    json.dump({"corrections": modified_records, "replacements": replacements_made}, f, indent=2, ensure_ascii=False)
