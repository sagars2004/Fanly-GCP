import json
import random
from datetime import datetime, timedelta

def main():
    print("--- Generating 20 Rich World Cup Host Listings ---")
    
    # Coordinates and locations configuration
    cities_config = {
        "Harrison": {
            "state": "NJ", "zip": "07029", "lat": 40.7455, "lon": -74.1568, 
            "transit_min": 10, "transit_mode": "drive"
        },
        "Hoboken": {
            "state": "NJ", "zip": "07030", "lat": 40.7453, "lon": -74.0277, 
            "transit_min": 20, "transit_mode": "transit"
        },
        "Union City": {
            "state": "NJ", "zip": "07087", "lat": 40.7795, "lon": -74.0215, 
            "transit_min": 15, "transit_mode": "drive"
        },
        "Newark": {
            "state": "NJ", "zip": "07105", "lat": 40.7357, "lon": -74.1724, 
            "transit_min": 18, "transit_mode": "transit"
        },
        "East Rutherford": {
            "state": "NJ", "zip": "07073", "lat": 40.8329, "lon": -74.0954, 
            "transit_min": 5, "transit_mode": "drive"
        },
        "Jersey City": {
            "state": "NJ", "zip": "07302", "lat": 40.7282, "lon": -74.0776, 
            "transit_min": 15, "transit_mode": "drive"
        },
        "New York": {
            "state": "NY", "zip": "10036", "lat": 40.7580, "lon": -73.9855, 
            "transit_min": 25, "transit_mode": "transit"
        },
        "Brooklyn": {
            "state": "NY", "zip": "11201", "lat": 40.6925, "lon": -73.9904, 
            "transit_min": 35, "transit_mode": "transit"
        },
        "Queens": {
            "state": "NY", "zip": "11101", "lat": 40.7447, "lon": -73.9485, 
            "transit_min": 40, "transit_mode": "transit"
        }
    }

    # Lists for synthetic generation
    first_names = [
        "Maria", "John", "Youssef", "Mateo", "Steve", "Luc", "Sandra", "Tarek", "Lucas", "Carlos",
        "Fatima", "Alejandro", "Emily", "Kenji", "Hans", "Sophie", "Andre", "Priya", "Elena", "Gabriel",
        "Clara", "Chloe", "Zoe", "Jack", "Mia", "Emma", "Ava", "Oliver", "Mason", "Sophia",
        "Isabella", "Charlotte", "Amelia", "Thomas", "Pierre", "Ali", "Sven", "Diego", "Ana", "Luis",
        "Juan", "Aiko", "Yuki", "Marco", "Anna", "Lisa", "Viktor", "Ravi", "Meera", "Camila"
    ]
    
    last_names = [
        "Silva", "Doe", "El-Mourabit", "Rossi", "Miller", "Dubois", "Mansour", "Santos", "Herrera", "Gomez",
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez",
        "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez",
        "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
        "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams"
    ]

    languages_pool = ["English", "Spanish", "Portuguese", "French", "Arabic", "Italian", "German", "Japanese", "Hindi", "Mandarin"]
    teams_pool = ["Brazil", "Argentina", "Spain", "Morocco", "USA", "England", "France", "Germany", "Mexico", "Italy", "Portugal", "Colombia", "Japan", "All"]
    amenities_list = ["WiFi", "Air Conditioning", "Kitchen", "Coffee Maker", "Towels", "Hangers", "Shared Bath", "Private Bath", "Gym", "Elevator", "Washing Machine", "TV", "Iron", "Backyard", "Parking"]
    
    descriptions_templates = [
        "Cozy and clean room in a nice neighborhood. Speaks {langs} and looking forward to welcoming {teams} supporters. Very close to transit hubs with fast access to MetLife Stadium.",
        "A spacious private couch in my modern apartment. Perfect for soccer fans! Speaks {langs}. I love soccer, active fan, happy to talk matches. Easy route to NYC and East Rutherford.",
        "Beautiful private room. Quiet, residential street. Clean bed, towels, and morning coffee provided. Speaks {langs}. Highly welcoming to {teams} fans.",
        "Entire 1-bedroom loft unit in a vibrant dining district. Modern kitchen, washing machine, secure entrance. Perfect base for World Cup matches. Speaks {langs}.",
        "Literally steps away from transit options to the stadium. Driveway parking available. Quiet hours after 10 PM. Speaks {langs}. All fans welcome!"
    ]
    
    house_rules_templates = [
        "No smoking inside. Quiet hours after 11 PM. Respect the neighbors. Game day celebrations are fine but keep it reasonable!",
        "No pets, no parties, shoes off inside. Please clean up after yourself in the kitchen.",
        "No alcohol inside. Quiet, respectful hosting. Feel free to cook in the kitchen.",
        "Please take off shoes. No loud noise after midnight. Treat the space with care and enjoy the neighborhood!",
        "Respectful of quiet hours. No loud music. Backyard access is okay during the day."
    ]

    # Pool of 42 completely unique room/apartment/house images
    unsplash_images = [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=500&h=375&q=80",
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&h=375&q=80"
    ]
    random.shuffle(unsplash_images)

    listings = []
    
    for i in range(1, 21):
        city = random.choice(list(cities_config.keys()))
        cfg = cities_config[city]
        
        # Add random offsets to coordinates to make them unique
        lat_offset = random.uniform(-0.015, 0.015)
        lon_offset = random.uniform(-0.015, 0.015)
        lat = cfg["lat"] + lat_offset
        lon = cfg["lon"] + lon_offset
        
        if i in (1, 2, 3):
            host_name = "Sagar Sahu"
            host_id = "host_sagarsahu"
        else:
            host_name = f"{first_names[i-1]} {last_names[i-1]}"
            host_id = f"host_{first_names[i-1].lower()}_{i}"
        
        # Pick 1-3 random languages
        langs = list(set(["English"] + random.sample(languages_pool, random.randint(0, 2))))
        # Pick 1-3 random team welcome preferences
        teams = list(set(random.sample(teams_pool, random.randint(1, 3))))
        if "All" in teams and len(teams) > 1:
            teams.remove("All")
        
        price = round(random.uniform(50, 220), 0)
        cleaning = round(random.uniform(0, 40), 0)
        
        desc = random.choice(descriptions_templates).format(
            langs=", ".join(langs), 
            teams=" & ".join(teams)
        )
        
        # Generate availability for June 15 to June 30, 2026
        availability = []
        base_date = datetime(2026, 6, 15)
        for d in range(16):
            curr_date = base_date + timedelta(days=d)
            # 85% chance date is available
            availability.append({
                "date": curr_date.strftime("%Y-%m-%d"),
                "available": random.random() < 0.85
            })
            
        amenities = random.sample(amenities_list, random.randint(4, 9))
        rules = random.choice(house_rules_templates)
        
        # Titles based on city
        titles = [
            f"Cozy {city} Room - Near MetLife Transit Hub",
            f"Lovely Private Space in {city} (World Cup Base)",
            f"{city} Soccer Fan Hub - Comfortable Spare Room",
            f"Vibrant {city} Loft - Easy Transit to Stadium",
            f"Modern Apartment in {city} - Welcoming Soccer Fans"
        ]
        title = random.choice(titles)
        
        listing = {
            "listing_id": f"list_{i:03d}",
            "host_id": host_id,
            "host_name": host_name,
            "title": title,
            "description": desc,
            "location": {
                "address": f"{random.randint(10, 999)} World Cup Way",
                "city": city,
                "state": cfg["state"],
                "zip": cfg["zip"],
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "geo_point": { "lat": round(lat, 5), "lon": round(lon, 5) }
            },
            "stadium_distances": {
                "metlife_minutes": max(3, cfg["transit_min"] + random.randint(-5, 5)),
                "metlife_transit_mode": cfg["transit_mode"]
            },
            "pricing": {
                "price_per_night": price,
                "cleaning_fee": cleaning,
                "currency": "USD"
            },
            "availability": availability,
            "amenities": list(set(amenities)),
            "house_rules": rules,
            "languages_spoken": langs,
            "team_welcome": teams,
            "max_guests": random.randint(1, 4),
            "photos": [unsplash_images[i - 1]],
            "host_verified": random.random() < 0.9,
            "status": "active"
        }
        listings.append(listing)
        
    # Write to data/seed/listings.json
    output_path = "/Users/sagarsahu/Desktop/Projects/Fanly-GCP/data/seed/listings.json"
    with open(output_path, "w") as f:
        json.dump(listings, f, indent=2)
        
    print(f"Successfully generated and wrote {len(listings)} listings to {output_path}!")

if __name__ == "__main__":
    main()
