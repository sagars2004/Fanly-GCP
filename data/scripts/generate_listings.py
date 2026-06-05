import json
import random
from datetime import datetime, timedelta

def main():
    print("--- Generating 50 Rich World Cup Host Listings ---")
    
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

    listings = []
    
    # 1. Keep the first 10 original listings to preserve current visual data
    # (We will load them or reconstruct them if they matches the seed data)
    # Actually, we can generate all 50 programmatically, making the first 10 resemble the originals.
    
    for i in range(1, 51):
        city = random.choice(list(cities_config.keys()))
        cfg = cities_config[city]
        
        # Add random offsets to coordinates to make them unique
        lat_offset = random.uniform(-0.015, 0.015)
        lon_offset = random.uniform(-0.015, 0.015)
        lat = cfg["lat"] + lat_offset
        lon = cfg["lon"] + lon_offset
        
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
            "photos": [f"/images/generic_room.jpg"],
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
