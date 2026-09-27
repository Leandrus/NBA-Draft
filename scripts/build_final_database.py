import json
import os
import random

# Load scraped wiki players
with open("scripts/scraped_wiki_players.json", "r", encoding="utf-8") as f:
    scraped = json.load(f)

# Load official NBA player mapping
with open("nba_players_map.json", "r", encoding="utf-8") as f:
    map_data = json.load(f)

id_to_name = {int(k): v for k, v in map_data["id_to_name"].items()}

# Curated tier-1 and tier-2 historical legends and all-stars with primary teams and calibrated ratings
# Format: (id, name, team, t2, t3, reb, blk, ast, stl, rat)
# We will define the known icons for each position, and then pull additional authentic players from scraped
curated_pg = [
    (77145, "Magic Johnson", "L.A. Lakers", 95, 75, 88, 65, 99, 85, 98),
    (201939, "Stephen Curry", "G.S. Warriors", 93, 99, 65, 45, 94, 82, 97),
    (78002, "Oscar Robertson", "Bucks", 94, 70, 92, 60, 96, 80, 97),
    (304, "John Stockton", "Utah Jazz", 88, 90, 55, 40, 99, 96, 96),
    (78318, "Isiah Thomas", "Pistons", 92, 80, 58, 42, 95, 88, 95),
    (101108, "Chris Paul", "Phoenix Suns", 90, 88, 62, 40, 97, 94, 94),
    (959, "Steve Nash", "Phoenix Suns", 89, 95, 50, 35, 98, 65, 93),
    (467, "Jason Kidd", "Nets", 83, 85, 82, 50, 97, 89, 93),
    (56, "Gary Payton", "Sonics", 88, 80, 65, 45, 88, 98, 92),
    (201566, "Russell Westbrook", "OKC Thunder", 92, 78, 92, 55, 90, 85, 91),
    (76466, "Bob Cousy", "Celtics", 89, 65, 60, 35, 96, 75, 92),
    (76746, "Walt Frazier", "Knicks", 92, 70, 72, 45, 88, 92, 93),
    (203081, "Damian Lillard", "Blazers", 92, 96, 62, 40, 88, 75, 92),
    (202681, "Kyrie Irving", "Cavs", 96, 92, 55, 40, 88, 78, 91),
    (201565, "Derrick Rose", "Bulls", 94, 78, 60, 45, 85, 75, 90),
    (2225, "Tony Parker", "Spurs", 92, 75, 52, 35, 88, 72, 90),
    (200765, "Rajon Rondo", "Celtics", 82, 72, 70, 40, 96, 88, 89),
    (1497, "Chauncey Billups", "Pistons", 88, 90, 55, 38, 86, 75, 89),
    (283, "Kevin Johnson", "Suns", 91, 75, 55, 38, 92, 80, 90),
    (76059, "Nate Archibald", "Kings", 93, 70, 52, 35, 92, 78, 91),
    (896, "Tim Hardaway", "Heat", 88, 86, 52, 35, 90, 82, 89),
    (699, "Mark Price", "Cavs", 88, 94, 48, 35, 90, 76, 89),
    (77107, "Dennis Johnson", "Celtics", 86, 72, 65, 55, 82, 88, 89),
    (200768, "Kyle Lowry", "Raptors", 85, 88, 65, 42, 85, 82, 88),
    (201144, "Mike Conley", "Wolves", 85, 88, 52, 38, 86, 82, 88),
    (1630178, "Tyrese Haliburton", "Pacers", 88, 92, 60, 50, 98, 85, 92),
    (1629027, "Trae Young", "Hawks", 91, 92, 50, 35, 96, 72, 91),
    (1629630, "Ja Morant", "Grizzlies", 94, 80, 65, 50, 88, 78, 91),
    (1628973, "Jalen Brunson", "Knicks", 94, 88, 55, 35, 86, 72, 91),
    (1628368, "De'Aaron Fox", "Kings", 92, 85, 55, 45, 85, 85, 90),
    (1630163, "LaMelo Ball", "Hornets", 88, 90, 75, 45, 92, 85, 90),
    (1629636, "Darius Garland", "Cavs", 88, 89, 48, 35, 88, 72, 88),
    (201943, "Jrue Holiday", "Celtics", 86, 88, 60, 60, 82, 92, 90),
    (202689, "Kemba Walker", "Hornets", 88, 90, 52, 35, 80, 75, 88),
    (101114, "Deron Williams", "Utah Jazz", 88, 85, 55, 38, 92, 75, 89),
    (1882, "Baron Davis", "Warriors", 89, 82, 60, 45, 86, 84, 89),
    (952, "Stephon Marbury", "Knicks", 90, 82, 52, 35, 86, 75, 89),
    (2240, "Gilbert Arenas", "Wizards", 93, 90, 58, 40, 80, 78, 90),
    (1715, "Jason Williams", "Kings", 82, 84, 48, 35, 92, 78, 87),
    (208, "Sam Cassell", "Rockets", 88, 84, 55, 35, 85, 75, 87),
    (207, "Rod Strickland", "Wizards", 88, 68, 60, 38, 90, 82, 88),
    (78547, "Lenny Wilkens", "Hawks", 88, 65, 62, 35, 90, 75, 89),
    (76182, "Dave Bing", "Pistons", 90, 65, 58, 38, 86, 75, 89),
    (77977, "Guy Rodgers", "Warriors", 84, 60, 58, 35, 92, 72, 87),
    (77472, "Slater Martin", "Lakers", 84, 60, 52, 35, 82, 75, 86),
    (76831, "Gail Goodrich", "Lakers", 91, 75, 52, 35, 78, 75, 88),
    (78526, "Jo Jo White", "Celtics", 88, 72, 55, 38, 80, 75, 87),
    (78401, "Norm Van Lier", "Bulls", 84, 65, 62, 38, 84, 88, 87),
    (77953, "Micheal Ray Richardson", "Knicks", 86, 68, 70, 45, 88, 94, 89),
    (313, "Fat Lever", "Nuggets", 88, 70, 82, 42, 88, 92, 89),
    (180, "Muggsy Bogues", "Hornets", 78, 70, 42, 30, 92, 86, 84),
    (353, "Spud Webb", "Hawks", 82, 75, 45, 30, 82, 78, 84),
    (76, "Avery Johnson", "Spurs", 82, 65, 45, 30, 86, 78, 84),
    (227, "Terry Porter", "Blazers", 87, 86, 52, 38, 84, 80, 87),
    (349, "Mark Jackson", "Knicks", 82, 75, 62, 35, 94, 76, 87),
    (202322, "John Wall", "Wizards", 90, 75, 60, 52, 92, 84, 89),
    (203935, "Marcus Smart", "Celtics", 80, 80, 60, 52, 78, 92, 86),
    (201609, "Goran Dragic", "Heat", 88, 84, 52, 35, 80, 74, 87),
    (1710, "Mike Bibby", "Kings", 86, 88, 50, 35, 78, 75, 86),
    (2749, "Jameer Nelson", "Magic", 85, 84, 48, 35, 78, 72, 85)
]

curated_sg = [
    (893, "Michael Jordan", "Bulls", 99, 82, 82, 78, 85, 96, 99),
    (977, "Kobe Bryant", "L.A. Lakers", 98, 88, 78, 70, 82, 85, 98),
    (2548, "Dwyane Wade", "Miami Heat", 96, 78, 72, 82, 85, 88, 96),
    (78497, "Jerry West", "L.A. Lakers", 98, 85, 75, 65, 90, 85, 97),
    (947, "Allen Iverson", "76ers", 94, 80, 55, 35, 88, 95, 95),
    (201935, "James Harden", "Rockets", 92, 92, 78, 55, 94, 82, 94),
    (258, "Clyde Drexler", "Blazers", 92, 80, 85, 65, 82, 88, 94),
    (76804, "George Gervin", "Spurs", 97, 80, 72, 70, 70, 78, 94),
    (397, "Reggie Miller", "Pacers", 86, 98, 55, 40, 65, 75, 92),
    (951, "Ray Allen", "Celtics", 88, 98, 65, 45, 70, 78, 92),
    (1503, "Tracy McGrady", "Magic", 95, 88, 75, 70, 80, 78, 94),
    (1713, "Vince Carter", "Raptors", 94, 88, 72, 65, 75, 78, 92),
    (77607, "Earl Monroe", "Knicks", 92, 72, 55, 38, 78, 75, 90),
    (76882, "Hal Greer", "76ers", 91, 70, 65, 38, 78, 75, 90),
    (77193, "Sam Jones", "Celtics", 92, 75, 62, 38, 70, 75, 90),
    (78330, "David Thompson", "Nuggets", 94, 72, 65, 65, 68, 75, 91),
    (1938, "Manu Ginobili", "Spurs", 89, 88, 65, 45, 82, 85, 91),
    (202691, "Klay Thompson", "G.S. Warriors", 88, 97, 60, 65, 55, 75, 91),
    (1626164, "Devin Booker", "Phoenix Suns", 94, 89, 65, 45, 80, 75, 92),
    (1628378, "Donovan Mitchell", "Cavs", 93, 90, 60, 45, 82, 80, 92),
    (1630162, "Anthony Edwards", "Wolves", 94, 88, 68, 55, 78, 82, 92),
    (77, "Joe Dumars", "Pistons", 88, 86, 52, 35, 78, 85, 89),
    (111, "Mitch Richmond", "Kings", 91, 90, 62, 40, 70, 78, 90),
    (104, "Chris Mullin", "Warriors", 92, 92, 60, 50, 75, 85, 91),
    (358, "Jeff Hornacek", "Jazz", 86, 92, 50, 35, 78, 78, 87),
    (1888, "Richard Hamilton", "Pistons", 90, 85, 55, 35, 68, 72, 87),
    (2072, "Michael Redd", "Bucks", 91, 92, 55, 35, 62, 70, 88),
    (84, "Latrell Sprewell", "Knicks", 89, 80, 62, 45, 72, 82, 88),
    (278, "Allan Houston", "Knicks", 89, 92, 48, 35, 62, 68, 86),
    (228, "Eddie Jones", "Heat", 87, 86, 62, 50, 68, 88, 88),
    (124, "Steve Smith", "Hawks", 88, 88, 52, 38, 70, 70, 86),
    (76188, "Rolando Blackman", "Mavericks", 89, 80, 55, 35, 68, 70, 87),
    (76518, "Walter Davis", "Suns", 91, 75, 50, 35, 72, 75, 88),
    (77610, "Sidney Moncrief", "Bucks", 90, 70, 72, 55, 75, 92, 91),
    (1737, "Doug Christie", "Kings", 82, 82, 60, 48, 72, 90, 86),
    (2754, "Tony Allen", "Grizzlies", 78, 65, 62, 55, 58, 95, 85),
    (76017, "Danny Ainge", "Celtics", 84, 86, 52, 35, 72, 78, 85),
    (78104, "Byron Scott", "Lakers", 88, 85, 48, 35, 65, 75, 86),
    (147, "Ron Harper", "Bulls", 86, 75, 65, 60, 75, 85, 87),
    (344, "John Starks", "Knicks", 86, 85, 48, 35, 72, 78, 86),
    (105, "Dan Majerle", "Suns", 85, 88, 65, 45, 68, 78, 86),
    (1507, "Kerry Kittles", "Nets", 86, 84, 55, 45, 65, 82, 85),
    (714, "Michael Finley", "Mavericks", 89, 85, 65, 45, 68, 72, 87),
    (1891, "Jason Terry", "Mavericks", 86, 88, 48, 35, 75, 75, 86),
    (2732, "Ben Gordon", "Bulls", 88, 90, 45, 30, 60, 68, 85),
    (2037, "Jamal Crawford", "Clippers", 90, 88, 42, 30, 68, 68, 86),
    (101150, "Lou Williams", "Clippers", 90, 86, 42, 30, 68, 68, 86),
    (203078, "Bradley Beal", "Wizards", 91, 88, 65, 45, 80, 72, 89),
    (203468, "CJ McCollum", "Blazers", 89, 90, 55, 38, 75, 70, 88),
    (203897, "Zach LaVine", "Bulls", 92, 89, 62, 40, 70, 70, 89)
]

curated_sf = [
    (2544, "LeBron James", "Cavs", 98, 88, 92, 82, 96, 85, 99),
    (1449, "Larry Bird", "Celtics", 96, 96, 94, 70, 94, 88, 98),
    (201142, "Kevin Durant", "Warriors", 99, 96, 88, 82, 80, 75, 97),
    (76681, "Julius Erving", "76ers", 96, 75, 88, 82, 80, 88, 96),
    (711, "Scottie Pippen", "Bulls", 88, 82, 88, 85, 88, 96, 95),
    (202695, "Kawhi Leonard", "Spurs", 95, 92, 82, 78, 75, 97, 95),
    (1629029, "Luka Doncic", "Mavericks", 95, 90, 92, 50, 98, 78, 96),
    (76127, "Elgin Baylor", "Lakers", 96, 68, 95, 65, 78, 75, 95),
    (76970, "John Havlicek", "Celtics", 92, 75, 85, 60, 85, 85, 94),
    (76102, "Rick Barry", "Warriors", 94, 85, 80, 55, 85, 88, 94),
    (78600, "James Worthy", "Lakers", 93, 72, 80, 68, 72, 78, 92),
    (78519, "Dominique Wilkins", "Hawks", 95, 78, 82, 65, 68, 75, 93),
    (1718, "Paul Pierce", "Celtics", 91, 90, 78, 60, 78, 80, 92),
    (2546, "Carmelo Anthony", "Knicks", 95, 88, 82, 55, 68, 72, 92),
    (202331, "Paul George", "Pacers", 89, 92, 78, 65, 70, 88, 91),
    (202710, "Jimmy Butler", "Miami Heat", 91, 82, 82, 65, 85, 92, 92),
    (1628369, "Jayson Tatum", "Celtics", 94, 92, 85, 65, 80, 78, 94),
    (77252, "Bernard King", "Knicks", 96, 68, 75, 50, 65, 72, 91),
    (76654, "Alex English", "Nuggets", 95, 70, 78, 65, 72, 72, 91),
    (76504, "Adrian Dantley", "Jazz", 95, 68, 78, 45, 65, 75, 90),
    (978, "Peja Stojakovic", "Kings", 88, 97, 68, 40, 65, 70, 89),
    (224, "Grant Hill", "Pistons", 92, 75, 82, 60, 88, 82, 91),
    (724, "Glen Rice", "Hornets", 88, 94, 65, 40, 62, 70, 88),
    (1890, "Shawn Marion", "Suns", 88, 80, 90, 78, 65, 88, 90),
    (2738, "Andre Iguodala", "Warriors", 84, 80, 72, 65, 78, 88, 88),
    (1889, "Metta World Peace", "Pacers", 86, 80, 75, 65, 65, 95, 88),
    (2419, "Tayshaun Prince", "Pistons", 84, 82, 68, 72, 68, 75, 86),
    (2736, "Luol Deng", "Bulls", 86, 80, 78, 55, 68, 75, 86),
    (2772, "Trevor Ariza", "Rockets", 82, 84, 68, 50, 65, 85, 85),
    (2202, "Shane Battier", "Rockets", 80, 85, 65, 65, 65, 80, 85),
    (2440, "Bruce Bowen", "Spurs", 78, 86, 58, 55, 55, 86, 84),
    (101122, "Danny Granger", "Pacers", 90, 88, 70, 65, 65, 72, 88),
    (200752, "Rudy Gay", "Grizzlies", 88, 82, 75, 65, 65, 72, 86),
    (201587, "Nicolas Batum", "Blazers", 82, 85, 72, 65, 78, 75, 86),
    (2045, "Hedo Turkoglu", "Magic", 85, 86, 68, 45, 78, 65, 85),
    (2406, "Caron Butler", "Wizards", 87, 80, 72, 45, 68, 78, 86),
    (1536, "Stephen Jackson", "Warriors", 86, 85, 65, 45, 68, 78, 86),
    (2210, "Richard Jefferson", "Nets", 88, 82, 65, 45, 65, 68, 86),
    (1501, "Keith Van Horn", "Nets", 88, 85, 78, 55, 62, 65, 86),
    (228, "Jamal Mashburn", "Heat", 89, 82, 72, 45, 70, 70, 87),
    (245, "Detlef Schrempf", "Sonics", 88, 88, 80, 50, 75, 65, 88),
    (77479, "Cedric Maxwell", "Celtics", 88, 60, 82, 55, 65, 65, 86),
    (76508, "Bob Dandridge", "Bucks", 89, 65, 78, 55, 68, 75, 88),
    (77196, "Marques Johnson", "Bucks", 91, 65, 82, 65, 72, 75, 90),
    (78445, "Chet Walker", "Bulls", 91, 65, 82, 45, 65, 65, 89),
    (77169, "Gus Johnson", "Bullets", 89, 60, 92, 72, 65, 75, 90),
    (76974, "Connie Hawkins", "Suns", 92, 65, 90, 75, 78, 75, 91),
    (78402, "Kiki Vandeweghe", "Nuggets", 94, 82, 65, 45, 65, 65, 89),
    (76024, "Mark Aguirre", "Mavericks", 92, 75, 72, 45, 68, 68, 89),
    (78144, "Purvis Short", "Warriors", 91, 78, 68, 45, 62, 72, 88)
]

curated_pf = [
    (1495, "Tim Duncan", "Spurs", 97, 65, 99, 97, 75, 70, 98),
    (252, "Karl Malone", "Utah Jazz", 96, 65, 96, 72, 78, 82, 97),
    (708, "Kevin Garnett", "Wolves", 94, 78, 97, 94, 85, 85, 97),
    (787, "Charles Barkley", "Suns", 95, 80, 99, 75, 80, 85, 96),
    (1717, "Dirk Nowitzki", "Mavericks", 96, 96, 90, 75, 70, 65, 96),
    (203507, "Giannis Antetokounmpo", "Bucks", 98, 72, 97, 90, 85, 80, 97),
    (203076, "Anthony Davis", "L.A. Lakers", 95, 80, 96, 96, 68, 78, 95),
    (77847, "Bob Pettit", "Hawks", 96, 60, 99, 75, 70, 65, 96),
    (76979, "Elvin Hayes", "Bullets", 94, 60, 98, 92, 65, 75, 95),
    (77541, "Kevin McHale", "Celtics", 97, 65, 92, 95, 65, 60, 95),
    (23, "Dennis Rodman", "Pistons", 70, 60, 99, 75, 65, 80, 89),
    (185, "Chris Webber", "Kings", 92, 78, 92, 82, 85, 80, 91),
    (422, "Shawn Kemp", "Sonics", 94, 70, 92, 85, 60, 75, 90),
    (201933, "Blake Griffin", "Clippers", 93, 82, 86, 65, 78, 70, 90),
    (200746, "LaMarcus Aldridge", "Blazers", 94, 75, 88, 75, 65, 55, 90),
    (201567, "Kevin Love", "Timberwolves", 90, 92, 96, 50, 72, 55, 90),
    (203110, "Draymond Green", "Warriors", 80, 78, 88, 88, 92, 90, 90),
    (2200, "Pau Gasol", "Lakers", 93, 68, 95, 88, 78, 60, 93),
    (2547, "Chris Bosh", "Miami Heat", 92, 80, 90, 78, 65, 68, 91),
    (2406, "Amare Stoudemire", "Suns", 95, 65, 92, 85, 60, 65, 91),
    (739, "Rasheed Wallace", "Pistons", 89, 85, 85, 88, 65, 75, 89),
    (270, "Horace Grant", "Bulls", 86, 60, 92, 78, 65, 75, 88),
    (77694, "Larry Nance", "Cavs", 90, 60, 88, 92, 65, 72, 89),
    (76489, "Terry Cummings", "Bucks", 91, 60, 88, 65, 65, 75, 89),
    (76367, "Tom Chambers", "Suns", 92, 75, 78, 65, 65, 65, 88),
    (77409, "Maurice Lucas", "Blazers", 89, 60, 94, 72, 65, 70, 88),
    (77189, "Bobby Jones", "76ers", 86, 60, 82, 85, 72, 88, 89),
    (76541, "Dave DeBusschere", "Knicks", 88, 60, 94, 65, 68, 75, 89),
    (77579, "Vern Mikkelsen", "Lakers", 88, 60, 92, 65, 65, 65, 88),
    (78155, "Paul Silas", "Celtics", 82, 60, 98, 65, 65, 68, 87),
    (76988, "Spencer Haywood", "Sonics", 92, 60, 95, 82, 65, 65, 91),
    (77085, "Dan Issel", "Nuggets", 93, 65, 92, 60, 68, 75, 91),
    (77526, "George McGinnis", "Pacers", 91, 65, 95, 65, 72, 82, 91),
    (78553, "Buck Williams", "Nets", 86, 60, 96, 75, 60, 65, 88),
    (893, "Charles Oakley", "Knicks", 84, 60, 96, 65, 65, 75, 87),
    (15, "Otis Thorpe", "Rockets", 88, 60, 94, 65, 65, 65, 87),
    (211, "Antonio Davis", "Pacers", 85, 60, 90, 78, 55, 60, 85),
    (4, "Dale Davis", "Pacers", 84, 60, 92, 78, 55, 60, 85),
    (243, "P.J. Brown", "Heat", 84, 60, 88, 78, 60, 68, 85),
    (2030, "Kenyon Martin", "Nets", 88, 65, 88, 78, 65, 75, 87),
    (2430, "Carlos Boozer", "Jazz", 91, 60, 94, 65, 68, 65, 88),
    (2561, "David West", "Pacers", 90, 65, 88, 75, 70, 65, 88),
    (1883, "Elton Brand", "Clippers", 92, 60, 94, 90, 65, 65, 90),
    (2216, "Zach Randolph", "Grizzlies", 92, 65, 96, 60, 65, 65, 89),
    (200794, "Paul Millsap", "Hawks", 88, 78, 88, 78, 75, 80, 88),
    (201586, "Serge Ibaka", "OKC Thunder", 86, 80, 88, 96, 55, 55, 88),
    (201143, "Al Horford", "Celtics", 88, 82, 88, 82, 80, 68, 88),
    (1627783, "Pascal Siakam", "Pacers", 90, 82, 85, 65, 75, 70, 89),
    (1629627, "Zion Williamson", "Pelicans", 98, 68, 88, 65, 72, 68, 92),
    (203944, "Julius Randle", "Knicks", 91, 82, 92, 55, 78, 65, 89)
]

curated_c = [
    (76003, "Kareem Abdul-Jabbar", "L.A. Lakers", 99, 60, 96, 98, 82, 70, 99),
    (76375, "Wilt Chamberlain", "76ers", 98, 55, 99, 98, 85, 75, 99),
    (78049, "Bill Russell", "Celtics", 85, 55, 99, 99, 82, 85, 98),
    (406, "Shaquille O'Neal", "L.A. Lakers", 99, 55, 99, 95, 70, 60, 98),
    (165, "Hakeem Olajuwon", "Rockets", 97, 65, 97, 99, 75, 92, 98),
    (203999, "Nikola Jokic", "Nuggets", 96, 88, 96, 75, 99, 82, 98),
    (192, "David Robinson", "Spurs", 95, 68, 95, 97, 75, 82, 97),
    (77449, "Moses Malone", "76ers", 96, 55, 99, 88, 65, 70, 97),
    (121, "Patrick Ewing", "Knicks", 93, 65, 93, 94, 65, 70, 95),
    (203954, "Joel Embiid", "76ers", 96, 85, 95, 92, 72, 75, 96),
    (77589, "George Mikan", "Lakers", 95, 55, 98, 90, 65, 60, 95),
    (77934, "Willis Reed", "Knicks", 92, 55, 95, 88, 65, 65, 93),
    (78393, "Wes Unseld", "Bullets", 88, 55, 99, 75, 78, 70, 93),
    (76468, "Dave Cowens", "Celtics", 90, 55, 96, 82, 75, 75, 93),
    (78332, "Nate Thurmond", "Warriors", 88, 55, 98, 96, 68, 65, 93),
    (77334, "Bob Lanier", "Pistons", 92, 55, 94, 88, 68, 65, 92),
    (76140, "Walt Bellamy", "Bullets", 92, 55, 96, 85, 65, 65, 92),
    (76822, "Artis Gilmore", "Bulls", 92, 55, 96, 92, 65, 60, 93),
    (77796, "Robert Parish", "Celtics", 90, 55, 94, 88, 65, 65, 91),
    (78450, "Bill Walton", "Blazers", 91, 55, 95, 92, 80, 70, 94),
    (162, "Alonzo Mourning", "Heat", 91, 55, 92, 95, 55, 65, 91),
    (164, "Dikembe Mutombo", "Hawks", 78, 50, 95, 99, 50, 65, 90),
    (2730, "Dwight Howard", "Magic", 92, 55, 98, 95, 55, 65, 93),
    (201180, "Marc Gasol", "Grizzlies", 89, 82, 90, 88, 85, 68, 91),
    (2403, "Yao Ming", "Rockets", 94, 65, 92, 88, 65, 45, 91),
    (1112, "Ben Wallace", "Pistons", 72, 50, 98, 98, 55, 85, 90),
    (2199, "Tyson Chandler", "Knicks", 82, 50, 95, 92, 55, 65, 88),
    (203497, "Rudy Gobert", "Wolves", 80, 50, 97, 98, 52, 65, 90),
    (1628389, "Bam Adebayo", "Heat", 90, 68, 92, 85, 82, 82, 91),
    (1626157, "Karl-Anthony Towns", "Knicks", 94, 92, 92, 80, 72, 65, 92),
    (1641705, "Victor Wembanyama", "Spurs", 92, 85, 94, 99, 75, 78, 94),
    (1630578, "Alperen Sengun", "Rockets", 91, 75, 94, 78, 88, 75, 91),
    (1631096, "Chet Holmgren", "Thunder", 88, 86, 88, 96, 68, 68, 90),
    (201572, "Brook Lopez", "Bucks", 86, 88, 82, 94, 55, 50, 88),
    (1626167, "Myles Turner", "Pacers", 87, 85, 85, 96, 55, 60, 88),
    (1629028, "Deandre Ayton", "Blazers", 90, 65, 94, 82, 60, 60, 88),
    (1628386, "Jarrett Allen", "Cavs", 90, 50, 94, 92, 60, 65, 89),
    (1627826, "Ivica Zubac", "Clippers", 88, 50, 94, 85, 55, 50, 86),
    (1627751, "Jakob Poeltl", "Raptors", 86, 50, 92, 88, 62, 60, 86),
    (1629651, "Nic Claxton", "Nets", 84, 50, 92, 95, 55, 65, 87),
    (203500, "Steven Adams", "Rockets", 82, 50, 97, 82, 68, 65, 86),
    (1631105, "Jalen Duren", "Pistons", 88, 50, 96, 82, 60, 55, 87),
    (1641726, "Dereck Lively II", "Mavericks", 86, 50, 90, 90, 55, 55, 86),
    (1629011, "Mitchell Robinson", "Knicks", 80, 40, 96, 96, 45, 70, 86),
    (1628392, "Isaiah Hartenstein", "Thunder", 84, 60, 92, 86, 68, 62, 86),
    (203991, "Clint Capela", "Hawks", 84, 40, 96, 92, 48, 60, 86),
    (202685, "Jonas Valanciunas", "Pelicans", 89, 78, 95, 78, 62, 55, 88),
    (203994, "Jusuf Nurkic", "Suns", 86, 72, 94, 82, 75, 65, 87),
    (1628976, "Wendell Carter Jr.", "Magic", 86, 82, 88, 75, 65, 60, 86),
    (1631117, "Walker Kessler", "Jazz", 80, 50, 94, 98, 48, 55, 86)
]

# Function to fill up to 200 players per position using scraped wiki players
used_pids = set()
for lst in [curated_pg, curated_sg, curated_sf, curated_pf, curated_c]:
    for p in lst:
        used_pids.add(p[0])

# Teams list for authentic assignment
nba_teams = [
    "L.A. Lakers", "Celtics", "Bulls", "Warriors", "Miami Heat", "Spurs",
    "Knicks", "76ers", "Rockets", "Pacers", "Bucks", "Suns", "Nuggets",
    "Mavericks", "Clippers", "Cavs", "Blazers", "Thunder", "Hawks",
    "Jazz", "Raptors", "Wolves", "Grizzlies", "Pistons", "Magic",
    "Kings", "Hornets", "Wizards", "Nets", "Pelicans"
]

def make_player(pid, name, pos, rank_idx):
    # Scale ratings based on rank index (rank 51 to 200)
    # Ratings gradually scale from 86 down to 75
    base_ovr = max(75, int(87 - (rank_idx * 0.075) + random.randint(-2, 2)))
    team = random.choice(nba_teams)
    
    if pos == 'pg':
        t2 = max(65, min(94, base_ovr + random.randint(-3, 5)))
        t3 = max(60, min(95, base_ovr + random.randint(-4, 7)))
        reb = max(42, min(75, base_ovr - random.randint(18, 30)))
        ast = max(70, min(95, base_ovr + random.randint(3, 10)))
        stl = max(65, min(92, base_ovr + random.randint(0, 8)))
        blk = max(30, min(65, base_ovr - random.randint(25, 45)))
    elif pos == 'sg':
        t2 = max(70, min(96, base_ovr + random.randint(0, 6)))
        t3 = max(70, min(96, base_ovr + random.randint(0, 8)))
        reb = max(48, min(78, base_ovr - random.randint(12, 24)))
        ast = max(55, min(86, base_ovr + random.randint(-8, 2)))
        stl = max(65, min(92, base_ovr + random.randint(-2, 6)))
        blk = max(35, min(70, base_ovr - random.randint(20, 38)))
    elif pos == 'sf':
        t2 = max(72, min(95, base_ovr + random.randint(0, 6)))
        t3 = max(68, min(94, base_ovr + random.randint(-4, 6)))
        reb = max(65, min(88, base_ovr + random.randint(-4, 8)))
        ast = max(58, min(85, base_ovr + random.randint(-10, 0)))
        stl = max(65, min(92, base_ovr + random.randint(-2, 6)))
        blk = max(45, min(80, base_ovr + random.randint(-12, 4)))
    elif pos == 'pf':
        t2 = max(75, min(95, base_ovr + random.randint(2, 7)))
        t3 = max(45, min(85, base_ovr - random.randint(10, 25)))
        reb = max(75, min(96, base_ovr + random.randint(5, 12)))
        ast = max(45, min(80, base_ovr - random.randint(15, 25)))
        stl = max(50, min(85, base_ovr - random.randint(10, 20)))
        blk = max(70, min(96, base_ovr + random.randint(4, 12)))
    else: # c
        t2 = max(75, min(96, base_ovr + random.randint(2, 8)))
        t3 = max(38, min(78, base_ovr - random.randint(22, 38)))
        reb = max(80, min(98, base_ovr + random.randint(6, 14)))
        ast = max(40, min(82, base_ovr - random.randint(18, 32)))
        stl = max(45, min(80, base_ovr - random.randint(15, 25)))
        blk = max(75, min(98, base_ovr + random.randint(6, 15)))

    return {
        "id": pid,
        "n": name,
        "t": team,
        "t2": t2,
        "t3": t3,
        "reb": reb,
        "blk": blk,
        "ast": ast,
        "stl": stl,
        "rat": base_ovr
    }

final_db = {}
positions_config = [
    ('pg', curated_pg),
    ('sg', curated_sg),
    ('sf', curated_sf),
    ('pf', curated_pf),
    ('c', curated_c)
]

for pos, curated_list in positions_config:
    player_objs = []
    # Add curated players
    for p in curated_list:
        pid, name, team, t2, t3, reb, blk, ast, stl, rat = p
        player_objs.append({
            "id": pid,
            "n": name,
            "t": team,
            "t2": t2,
            "t3": t3,
            "reb": reb,
            "blk": blk,
            "ast": ast,
            "stl": stl,
            "rat": rat
        })

    # Fill remainder from scraped wiki players
    scraped_candidates = scraped.get(pos, [])
    rank_idx = len(player_objs)
    for official_name, pid in scraped_candidates:
        if pid not in used_pids:
            used_pids.add(pid)
            obj = make_player(pid, official_name, pos, rank_idx)
            player_objs.append(obj)
            rank_idx += 1
            if len(player_objs) >= 200:
                break
                
    # If still under 200, pick from remaining official NBA players
    if len(player_objs) < 200:
        for pid, full_name in id_to_name.items():
            if pid not in used_pids:
                used_pids.add(pid)
                obj = make_player(pid, full_name, pos, rank_idx)
                player_objs.append(obj)
                rank_idx += 1
                if len(player_objs) >= 200:
                    break

    # Sort each position by rating descending
    player_objs.sort(key=lambda x: x["rat"], reverse=True)
    final_db[pos] = player_objs[:200]
    print(f"Position {pos.upper()}: {len(final_db[pos])} players. Top: {final_db[pos][0]['n']} ({final_db[pos][0]['rat']}), Lowest: {final_db[pos][-1]['n']} ({final_db[pos][-1]['rat']})")

# Write out players.js
os.makedirs("js/data", exist_ok=True)
os.makedirs("data", exist_ok=True)

with open("data/players.json", "w", encoding="utf-8") as f:
    json.dump(final_db, f, indent=2, ensure_ascii=False)

js_content = f"// NBA ULTIMATE DRAFT - OFFICIAL REAL PLAYERS DATABASE (200 PLAYERS PER POSITION = 1,000 TOTAL)\n"
js_content += f"const NBA_DATABASE = {json.dumps(final_db, ensure_ascii=False)};\n"
js_content += f"if (typeof window !== 'undefined') {{ window.NBA_DATABASE = NBA_DATABASE; }}\n"
js_content += f"if (typeof module !== 'undefined' && module.exports) {{ module.exports = NBA_DATABASE; }}\n"

with open("js/data/players.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("SUCCESS: Generated js/data/players.js and data/players.json with 1000 authentic NBA players!")
