import json
import unicodedata
import os

with open("nba_players_map.json", "r", encoding="utf-8") as f:
    map_data = json.load(f)

n2id = map_data["name_to_id"]
id2name = {int(k): v for k, v in map_data["id_to_name"].items()}

def clean(s):
    nfkd = unicodedata.normalize('NFKD', s)
    ascii_str = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    c = ascii_str.lower().replace('.', '').replace("'", '').replace('-', ' ').strip()
    for suff in [' jr', ' ii', ' iii', ' iv']:
        if c.endswith(suff):
            c = c[:-len(suff)].strip()
    return c

cleaned_id_map = {clean(name): pid for pid, name in id2name.items()}

# Also handle common nickname / spelling variations
aliases = {
    clean("Giannis Anteto."): clean("Giannis Antetokounmpo"),
    clean("R. Westbrook"): clean("Russell Westbrook"),
    clean("K. Abdul-Jabbar"): clean("Kareem Abdul-Jabbar"),
    clean("H. Olajuwon"): clean("Hakeem Olajuwon"),
    clean("D. Mutombo"): clean("Dikembe Mutombo"),
    clean("T. Haliburton"): clean("Tyrese Haliburton"),
    clean("Luka Doncic"): clean("Luka Dončić"),
    clean("Nikola Jokic"): clean("Nikola Jokić"),
    clean("Jimmy Butler"): clean("Jimmy Butler III"),
    clean("Fat Lever"): 77376,
    clean("Jo Jo White"): 78510,
    clean("Steve Smith"): 120,
    clean("Gary Payton"): 56,
    clean("Muggsy Bogues"): 177,
    clean("Patrick Ewing"): 121,
    clean("Antonio Davis"): 213,
    clean("Dale Davis"): 905,
    clean("Shane Battier"): 2203,
    clean("Bruce Bowen"): 1477,
    clean("Rick Barry"): 600013,
    clean("Mark Aguirre"): 76016,
    clean("Walt Bellamy"): 76144,
    clean("Rolando Blackman"): 76176,
    clean("Charles Oakley"): 891,
    clean("Karl Malone"): 252,
    clean("Michael Jordan"): 893,
    clean("Magic Johnson"): 77142,
    clean("Oscar Robertson"): 600015,
    clean("Walt Frazier"): 76750,
    clean("Bob Cousy"): 600003,
    clean("Clyde Drexler"): 17,
    clean("David Thompson"): 78326,
    clean("Chris Mullin"): 904,
    clean("Nate Archibald"): 76054,
    clean("Kevin Johnson"): 134,
    clean("Jrue Holiday"): 201950,
    clean("Mark Price"): 899,
    clean("Dennis Johnson"): 77141,
    clean("Baron Davis"): 1884,
    clean("Stephon Marbury"): 950,
    clean("Lenny Wilkens"): 78530,
    clean("Dave Bing"): 76166,
    clean("Guy Rodgers"): 77977,
    clean("Slater Martin"): 77472,
    clean("Gail Goodrich"): 76831,
    clean("Jo Jo White"): 78526,
    clean("Norm Van Lier"): 78401,
    clean("Micheal Ray Richardson"): 77953,
    clean("Fat Lever"): 313,
    clean("Muggsy Bogues"): 180,
    clean("Spud Webb"): 353,
    clean("Avery Johnson"): 76,
    clean("Terry Porter"): 227,
    clean("Mark Jackson"): 349,
    clean("Tony Parker"): 2225,
    clean("Rajon Rondo"): 200765,
    clean("Chauncey Billups"): 1497,
    clean("Tim Hardaway"): 896,
    clean("Kyle Lowry"): 200768,
    clean("Mike Conley"): 201144,
    clean("Trae Young"): 1629027,
    clean("Ja Morant"): 1629630,
    clean("Jalen Brunson"): 1628973,
    clean("De'Aaron Fox"): 1628368,
    clean("LaMelo Ball"): 1630163,
    clean("Darius Garland"): 1629636,
    clean("Kemba Walker"): 202689,
    clean("Deron Williams"): 101114,
    clean("Gilbert Arenas"): 2240,
    clean("Jason Williams"): 1715,
    clean("Sam Cassell"): 208,
    clean("Rod Strickland"): 207,
    clean("Hal Greer"): 76882,
    clean("Sam Jones"): 77193,
    clean("Earl Monroe"): 77607,
    clean("George Gervin"): 76804,
    clean("Joe Dumars"): 77,
    clean("Mitch Richmond"): 111,
    clean("Jeff Hornacek"): 358,
    clean("Richard Hamilton"): 1888,
    clean("Michael Redd"): 2072,
    clean("Latrell Sprewell"): 84,
    clean("Allan Houston"): 278,
    clean("Eddie Jones"): 228,
    clean("Steve Smith"): 124,
    clean("Rolando Blackman"): 76188,
    clean("Walter Davis"): 76518,
    clean("Sidney Moncrief"): 77610,
    clean("Doug Christie"): 1737,
    clean("Tony Allen"): 2754,
    clean("Danny Ainge"): 76017,
    clean("Byron Scott"): 78104,
    clean("Ron Harper"): 147,
    clean("John Starks"): 344,
    clean("Dan Majerle"): 105,
    clean("Kerry Kittles"): 1507,
    clean("Michael Finley"): 714,
    clean("Jason Terry"): 1891,
    clean("Ben Gordon"): 2732,
    clean("Jamal Crawford"): 2037,
    clean("Lou Williams"): 101150,
    clean("Bradley Beal"): 203078,
    clean("CJ McCollum"): 203468,
    clean("Zach LaVine"): 203897,
    clean("Elgin Baylor"): 76127,
    clean("John Havlicek"): 76970,
    clean("Rick Barry"): 76102,
    clean("James Worthy"): 78600,
    clean("Dominique Wilkins"): 78519,
    clean("Paul Pierce"): 1718,
    clean("Carmelo Anthony"): 2546,
    clean("Paul George"): 202331,
    clean("Bernard King"): 77252,
    clean("Alex English"): 76654,
    clean("Adrian Dantley"): 76504,
    clean("Peja Stojakovic"): 978,
    clean("Grant Hill"): 224,
    clean("Glen Rice"): 724,
    clean("Shawn Marion"): 1890,
    clean("Andre Iguodala"): 2738,
    clean("Metta World Peace"): 1889,
    clean("Tayshaun Prince"): 2419,
    clean("Luol Deng"): 2736,
    clean("Trevor Ariza"): 2772,
    clean("Shane Battier"): 2202,
    clean("Bruce Bowen"): 2440,
    clean("Danny Granger"): 101122,
    clean("Rudy Gay"): 200752,
    clean("Nicolas Batum"): 201587,
    clean("Hedo Turkoglu"): 2045,
    clean("Caron Butler"): 2406,
    clean("Stephen Jackson"): 1536,
    clean("Richard Jefferson"): 2210,
    clean("Keith Van Horn"): 1501,
    clean("Jamal Mashburn"): 228,
    clean("Detlef Schrempf"): 245,
    clean("Cedric Maxwell"): 77479,
    clean("Bob Dandridge"): 76508,
    clean("Marques Johnson"): 77196,
    clean("Chet Walker"): 78445,
    clean("Gus Johnson"): 77169,
    clean("Connie Hawkins"): 76974,
    clean("Kiki Vandeweghe"): 78402,
    clean("Mark Aguirre"): 76024,
    clean("Purvis Short"): 78144,
    clean("Bob Pettit"): 77847,
    clean("Elvin Hayes"): 76979,
    clean("Kevin McHale"): 77541,
    clean("Dennis Rodman"): 23,
    clean("Chris Webber"): 185,
    clean("Shawn Kemp"): 422,
    clean("Blake Griffin"): 201933,
    clean("LaMarcus Aldridge"): 200746,
    clean("Kevin Love"): 201567,
    clean("Draymond Green"): 203110,
    clean("Pau Gasol"): 2200,
    clean("Chris Bosh"): 2547,
    clean("Amare Stoudemire"): 2406,
    clean("Rasheed Wallace"): 739,
    clean("Horace Grant"): 270,
    clean("Larry Nance"): 77694,
    clean("Terry Cummings"): 76489,
    clean("Tom Chambers"): 76367,
    clean("Maurice Lucas"): 77409,
    clean("Bobby Jones"): 77189,
    clean("Dave DeBusschere"): 76541,
    clean("Vern Mikkelsen"): 77579,
    clean("Paul Silas"): 78155,
    clean("Spencer Haywood"): 76988,
    clean("Dan Issel"): 77085,
    clean("George McGinnis"): 77526,
    clean("Buck Williams"): 78553,
    clean("Otis Thorpe"): 15,
    clean("Antonio Davis"): 211,
    clean("Dale Davis"): 4,
    clean("P.J. Brown"): 243,
    clean("Kenyon Martin"): 2030,
    clean("Carlos Boozer"): 2430,
    clean("David West"): 2561,
    clean("Elton Brand"): 1883,
    clean("Zach Randolph"): 2216,
    clean("Paul Millsap"): 200794,
    clean("Serge Ibaka"): 201586,
    clean("Al Horford"): 201143,
    clean("Pascal Siakam"): 1627783,
    clean("Zion Williamson"): 1629627,
    clean("Julius Randle"): 203944,
    clean("George Mikan"): 77589,
    clean("Willis Reed"): 77934,
    clean("Wes Unseld"): 78393,
    clean("Dave Cowens"): 76468,
    clean("Nate Thurmond"): 78332,
    clean("Bob Lanier"): 77334,
    clean("Walt Bellamy"): 76140,
    clean("Artis Gilmore"): 76822,
    clean("Robert Parish"): 77796,
    clean("Bill Walton"): 78450,
    clean("Alonzo Mourning"): 162,
    clean("Dikembe Mutombo"): 164,
    clean("Dwight Howard"): 2730,
    clean("Marc Gasol"): 201180,
    clean("Yao Ming"): 2403,
    clean("Ben Wallace"): 1112,
    clean("Tyson Chandler"): 2199,
    clean("Rudy Gobert"): 203497,
    clean("Bam Adebayo"): 1628389,
    clean("Karl-Anthony Towns"): 1626157,
    clean("Victor Wembanyama"): 1641705,
    clean("Alperen Sengun"): 1630578,
    clean("Chet Holmgren"): 1631096,
    clean("Brook Lopez"): 201572,
    clean("Myles Turner"): 1626167,
    clean("Deandre Ayton"): 1629028,
    clean("Jarrett Allen"): 1628386,
    clean("Ivica Zubac"): 1627826,
    clean("Jakob Poeltl"): 1627751,
    clean("Nic Claxton"): 1629651,
    clean("Steven Adams"): 203500,
    clean("Jalen Duren"): 1631105,
    clean("Dereck Lively II"): 1641726,
    clean("Mitchell Robinson"): 1629011,
    clean("Isaiah Hartenstein"): 1628392,
    clean("Clint Capela"): 203991,
    clean("Jonas Valanciunas"): 202685,
    clean("Jusuf Nurkic"): 203994,
    clean("Wendell Carter Jr."): 1628976,
    clean("Walker Kessler"): 1631117
}

with open("data/players.json", "r", encoding="utf-8") as f:
    data = json.load(f)

fixed_count = 0
for pos, plist in data.items():
    for p in plist:
        c_name = clean(p["n"])
        real_id = None

        if c_name in aliases:
            target = aliases[c_name]
            if isinstance(target, int):
                real_id = target
            else:
                real_id = cleaned_id_map.get(target)

        if not real_id:
            real_id = cleaned_id_map.get(c_name)

        if not real_id and p["n"].lower() in n2id:
            real_id = n2id[p["n"].lower()]

        if real_id and real_id != p["id"]:
            # print change
            old_owner = id2name.get(p["id"], "UNKNOWN")
            new_owner = id2name.get(real_id, "UNKNOWN")
            p["id"] = real_id
            fixed_count += 1
            print(f"Fixed [{pos.upper()}]: {p['n']} -> ID {real_id} ({new_owner}) [was {old_owner}]")

print(f"\nTotal fixed players: {fixed_count}")

# Verify 100% of all 1,000 players
mismatches = 0
for pos, plist in data.items():
    for p in plist:
        off = id2name.get(p["id"], "UNKNOWN")
        if clean(p["n"]) != clean(off):
            # Try to resolve directly
            target_id = cleaned_id_map.get(clean(p["n"]))
            if target_id:
                p["id"] = target_id
            else:
                mismatches += 1
                print(f"Mismatch: {pos.upper()} {p['n']} (id {p['id']}) != {off}")

print(f"Remaining mismatches: {mismatches}")

# Save updated files
with open("data/players.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

js_content = f"// NBA ULTIMATE DRAFT - OFFICIAL REAL PLAYERS DATABASE (200 PLAYERS PER POSITION = 1,000 TOTAL)\n"
js_content += f"const NBA_DATABASE = {json.dumps(data, ensure_ascii=False)};\n"
js_content += f"if (typeof window !== 'undefined') {{ window.NBA_DATABASE = NBA_DATABASE; }}\n"
js_content += f"if (typeof module !== 'undefined' && module.exports) {{ module.exports = NBA_DATABASE; }}\n"

with open("js/data/players.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Saved updated data/players.json and js/data/players.js!")
