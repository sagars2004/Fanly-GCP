import os
import uuid
import json
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

def get_model_name() -> str:
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("true", "1", "yes")
    default_model = "gemini-1.5-flash-002" if use_vertex else "gemini-1.5-flash"
    return os.getenv("GEMINI_MODEL") or default_model


from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Import tools
from agent.tools.search_listings import search_listings
from agent.tools.check_match_schedule import check_match_schedule
from agent.tools.generate_contract import generate_contract
from google.genai import types
from agent.tools.ai_client import get_genai_client
from agent.tools.elastic_mcp import ElasticMCPClient
from mcp.server.fastmcp import FastMCP

# Initialize Model Context Protocol (MCP) server
mcp_server = FastMCP("Elasticsearch-MCP")

# Expose search_listings tool via HTTP/SSE MCP for Vertex AI Agent Builder
@mcp_server.tool()
def search_listings_mcp(
    query: Optional[str] = None,
    dates: Optional[str] = None,
    max_price: Optional[float] = None,
    languages: Optional[List[str]] = None,
    team_preference: Optional[str] = None
) -> str:
    """Search for accommodations matching criteria during the World Cup.
    
    Args:
        query: General text search query (e.g. 'private bedroom').
        dates: Stay date range (e.g. '2026-06-18 to 2026-06-22').
        max_price: Maximum price per night in USD.
        languages: Languages spoken by host.
        team_preference: The national team the guest is rooting for.
    """
    from agent.tools.search_listings import search_listings as run_search
    # Call the search listings library
    results = run_search(
        query=query,
        dates=dates,
        max_price=max_price,
        languages=languages,
        team_preference=team_preference
    )
    # Strip unnecessary fields for token efficiency
    stripped = [{k: v for k, v in l.items() if k != 'description_embedding'} for l in results]
    return json.dumps(stripped)

# Expose check_match_schedule tool via HTTP/SSE MCP for Vertex AI Agent Builder
@mcp_server.tool()
def check_match_schedule_mcp(
    date_range: Optional[str] = None,
    stadium: Optional[str] = "MetLife Stadium"
) -> str:
    """Check the official FIFA World Cup match schedule for high-traffic days.
    
    Args:
        date_range: Date range to scan matches e.g. '2026-06-18 to 2026-06-22'.
        stadium: Stadium filter, default 'MetLife Stadium'.
    """
    from agent.tools.check_match_schedule import check_match_schedule as run_check
    res = run_check(date_range=date_range, stadium=stadium)
    return json.dumps(res)

app = FastAPI(title="Fanly API", description="World Cup AI P2P Housing Agent API")

# Mount the MCP server's SSE application
app.mount("/api/mcp", mcp_server.sse_app())

# Enable CORS for Next.js dev server and client applications (world cup theme)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all. In production, restrict.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory databases for local fallback
bookings_db: Dict[str, Dict[str, Any]] = {}
listings_db: List[Dict[str, Any]] = []
contracts_db: Dict[str, str] = {}
users_db: Dict[str, Dict[str, Any]] = {}

ELASTIC_URL = os.getenv("ELASTIC_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")

DEFAULT_USERS = [
    {
        "id": "host_sagarsahu",
        "name": os.getenv("NEXT_PUBLIC_DEMO_HOST_NAME") or "Sagar Sahu",
        "role": "host",
        "email": (os.getenv("NEXT_PUBLIC_DEMO_HOST_EMAIL") or "sahu.sagar@fanly.com").lower(),
        "password": os.getenv("NEXT_PUBLIC_DEMO_HOST_PASSWORD") or "Devpost2026?",
        "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": "fan_ronaldo",
        "name": os.getenv("NEXT_PUBLIC_DEMO_GUEST_NAME") or "Chris Ronaldo",
        "role": "fan",
        "email": (os.getenv("NEXT_PUBLIC_DEMO_GUEST_EMAIL") or "chrisronaldo@fanly.com").lower(),
        "password": os.getenv("NEXT_PUBLIC_DEMO_GUEST_PASSWORD") or "cr26fanly",
        "avatarUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&h=100&q=80",
        "created_at": datetime.now().isoformat()
    }
]

def get_es_client():
    if ELASTIC_URL and ELASTIC_API_KEY:
        try:
            from elasticsearch import Elasticsearch
            return Elasticsearch(ELASTIC_URL, api_key=ELASTIC_API_KEY)
        except Exception as e:
            print(f"Elasticsearch connection failed: {e}")
    return None

def init_es_indices():
    es = get_es_client()
    if es:
        try:
            if not es.indices.exists(index="fanly_bookings"):
                es.indices.create(index="fanly_bookings")
            if not es.indices.exists(index="fanly_contracts"):
                es.indices.create(index="fanly_contracts")
            if not es.indices.exists(index="fanly_listings"):
                es.indices.create(index="fanly_listings")
            if not es.indices.exists(index="fanly_users"):
                es.indices.create(index="fanly_users")
                
            # Seed default users if they don't exist in ES
            for u in DEFAULT_USERS:
                try:
                    if not es.exists(index="fanly_users", id=u["id"]):
                        es.index(index="fanly_users", id=u["id"], document=u)
                        print(f"Seeded user {u['email']} in ES")
                except Exception as seed_err:
                    print(f"Error seeding user {u['email']} in ES: {seed_err}")
        except Exception as e:
            print(f"Error initializing ES indices: {e}")

# Initialize indices
init_es_indices()

def get_user_by_email_es(email: str):
    es = get_es_client()
    if es:
        try:
            query = {
                "query": {
                    "term": {
                        "email.keyword": email.lower().strip()
                    }
                }
            }
            res = es.search(index="fanly_users", body=query)
            hits = res["hits"]["hits"]
            if hits:
                return hits[0]["_source"]
        except Exception as e:
            print(f"Error getting user by email from ES: {e}")
    return None

def get_user_by_id_es(user_id: str):
    es = get_es_client()
    if es:
        try:
            if es.exists(index="fanly_users", id=user_id):
                res = es.get(index="fanly_users", id=user_id)
                return res["_source"]
        except Exception as e:
            print(f"Error getting user by ID from ES: {e}")
    return None

def save_user_es(user: dict):
    es = get_es_client()
    if es:
        try:
            es.index(index="fanly_users", id=user["id"], document=user)
        except Exception as e:
            print(f"Error indexing user in ES: {e}")

def save_booking_es(booking_id: str, booking: dict):
    es = get_es_client()
    if es:
        try:
            es.index(index="fanly_bookings", id=booking_id, document=booking)
        except Exception as e:
            print(f"Error indexing booking in ES: {e}")

def get_bookings_es(user_id: str, role: str):
    es = get_es_client()
    if es:
        try:
            term_field = "host_id" if role == "host" else "fan_id"
            query = {
                "query": {
                    "term": {
                        f"{term_field}.keyword": user_id
                    }
                },
                "size": 100
            }
            res = es.search(index="fanly_bookings", body=query)
            return [hit["_source"] for hit in res["hits"]["hits"]]
        except Exception as e:
            print(f"Error searching bookings in ES: {e}")
    return []

def delete_booking_es(booking_id: str):
    es = get_es_client()
    if es:
        try:
            if es.exists(index="fanly_bookings", id=booking_id):
                es.delete(index="fanly_bookings", id=booking_id)
        except Exception as e:
            print(f"Error deleting booking in ES: {e}")

def save_contract_es(booking_id: str, contract_text: str):
    es = get_es_client()
    if es:
        try:
            es.index(index="fanly_contracts", id=booking_id, document={
                "booking_id": booking_id,
                "contract_text": contract_text
            })
        except Exception as e:
            print(f"Error indexing contract in ES: {e}")

def get_contract_es(booking_id: str):
    es = get_es_client()
    if es:
        try:
            if es.exists(index="fanly_contracts", id=booking_id):
                res = es.get(index="fanly_contracts", id=booking_id)
                return res["_source"]
        except Exception as e:
            print(f"Error fetching contract in ES: {e}")
    return None

# Seed initial listings into listings_db from the seed file
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    listings_file = os.path.join(project_root, "data", "seed", "listings.json")
    if os.path.exists(listings_file):
        with open(listings_file, "r") as f:
            listings_db = __import__("json").load(f)
except Exception as e:
    print(f"Error seeding local database: {e}")

# Seed initial bookings into bookings_db from the seed file
try:
    bookings_file = os.path.join(project_root, "data", "seed", "bookings.json")
    if os.path.exists(bookings_file):
        with open(bookings_file, "r") as f:
            bookings_db = __import__("json").load(f)
except Exception as e:
    print(f"Error seeding bookings database: {e}")

# Seed initial contracts into contracts_db from the seed file
try:
    contracts_file = os.path.join(project_root, "data", "seed", "contracts.json")
    if os.path.exists(contracts_file):
        with open(contracts_file, "r") as f:
            contracts_db = __import__("json").load(f)
except Exception as e:
    print(f"Error seeding contracts database: {e}")

# Seed initial users into users_db from the seed file or default users
try:
    users_file = os.path.join(project_root, "data", "seed", "users.json")
    if os.path.exists(users_file):
        with open(users_file, "r") as f:
            users_db = __import__("json").load(f)
    else:
        for u in DEFAULT_USERS:
            users_db[u["email"]] = u
        os.makedirs(os.path.dirname(users_file), exist_ok=True)
        with open(users_file, "w") as f:
            __import__("json").dump(users_db, f, indent=2)
except Exception as e:
    print(f"Error seeding users database: {e}")

# Models
class ListingCreate(BaseModel):
    host_id: str
    host_name: str
    title: str
    description: str
    address: str
    city: str
    state: str
    zip: str
    lat: float
    lon: float
    price_per_night: float
    cleaning_fee: float
    availability_dates: List[str]
    amenities: List[str]
    house_rules: str
    languages_spoken: List[str]
    team_welcome: List[str]
    max_guests: int

class BookingRequest(BaseModel):
    listing_id: str
    host_id: str
    fan_id: str
    fan_name: str
    check_in: str
    check_out: str
    guests: int
    total_price: float
    language: Optional[str] = "en"
    team_rooting_for: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = "en"

# User registration and login models
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: str
    code: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatarUrl: str

@app.post("/api/users/register", response_model=UserResponse)
def register_user(payload: UserRegister):
    email_clean = payload.email.strip().lower()
    
    # Check if duplicate in ES
    existing = get_user_by_email_es(email_clean)
    if not existing:
        # Check if duplicate in local db
        if email_clean in users_db:
            existing = users_db[email_clean]
            
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
        
    # Validation passcode length
    if len(payload.code.strip()) != 6:
        raise HTTPException(status_code=400, detail="Passcode must be exactly 6 characters.")
        
    new_id = f"fan_{str(uuid.uuid4())[:8]}"
    full_name = f"{payload.first_name.strip()} {payload.last_name.strip()}"
    avatar_url = f"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"
    
    new_user = {
        "id": new_id,
        "name": full_name,
        "role": "fan",
        "email": email_clean,
        "password": payload.code.strip(),
        "avatarUrl": avatar_url,
        "created_at": datetime.now().isoformat()
    }
    
    # Save to ES
    save_user_es(new_user)
    
    # Save to local db
    users_db[email_clean] = new_user
    try:
        users_file = os.path.join(project_root, "data", "seed", "users.json")
        with open(users_file, "w") as f:
            __import__("json").dump(users_db, f, indent=2)
    except Exception as e:
        print(f"Error saving registered user locally: {e}")
        
    return UserResponse(
        id=new_user["id"],
        name=new_user["name"],
        email=new_user["email"],
        role=new_user["role"],
        avatarUrl=new_user["avatarUrl"]
    )

@app.post("/api/users/login", response_model=UserResponse)
def login_user(payload: UserLogin):
    email_clean = payload.email.strip().lower()
    password_clean = payload.password.strip()
    
    # Look up in ES
    user = get_user_by_email_es(email_clean)
    if not user:
        # Look up in local db
        if email_clean in users_db:
            user = users_db[email_clean]
            
    if not user or user.get("password") != password_clean:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        avatarUrl=user["avatarUrl"]
    )

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    # Look up in ES
    user = get_user_by_id_es(user_id)
    if not user:
        # Look up in local db
        for u in users_db.values():
            if u["id"] == user_id:
                user = u
                break
                
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        avatarUrl=user["avatarUrl"]
    )

@app.get("/api/health")
def health():
    mcp_active = ElasticMCPClient().is_configured()
    
    # Verify Google Cloud Agent Builder library invocation at runtime
    agent_builder_status = "Available"
    try:
        from google.cloud import discoveryengine_v1beta as discoveryengine
        # Create client locally to confirm runtime invocation
        _ = discoveryengine.ConversationalSearchServiceClient()
        agent_builder_status = "Available (Successfully Invoked Client)"
    except Exception as e:
        agent_builder_status = f"Unavailable: {e}"
        
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "Elastic MCP Agent Mode" if mcp_active else "Local Mock Agent Mode",
        "agent_builder": agent_builder_status
    }

# Listings endpoints
@app.get("/api/listings")
def get_listings(
    query: Optional[str] = None,
    dates: Optional[str] = None,
    max_price: Optional[float] = None,
    languages: Optional[str] = None,
    team_preference: Optional[str] = None
):
    # Call the search listing tool
    results = search_listings(
        query=query,
        dates=dates,
        max_price=max_price,
        languages=languages,
        team_preference=team_preference
    )
    return results

@app.get("/api/listings/{listing_id}")
def get_listing_by_id(listing_id: str):
    # Search locally or in memory
    for item in listings_db:
        if item["listing_id"] == listing_id:
            return item
    raise HTTPException(status_code=404, detail="Listing not found")

UNSPLASH_ROOM_IMAGES = [
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

@app.post("/api/listings")
def create_listing(listing: ListingCreate):
    new_id = f"list_{str(uuid.uuid4())[:8]}"
    availability = [{"date": dt, "available": True} for dt in listing.availability_dates]
    
    # Select a unique room image that is not currently in use
    used_photos = set()
    for item in listings_db:
        if item.get("photos") and len(item["photos"]) > 0:
            used_photos.add(item["photos"][0])
            
    assigned_photo = None
    for img in UNSPLASH_ROOM_IMAGES:
        if img not in used_photos:
            assigned_photo = img
            break
            
    if not assigned_photo:
        import random
        assigned_photo = random.choice(UNSPLASH_ROOM_IMAGES)
        
    new_listing = {
      "listing_id": new_id,
      "host_id": listing.host_id,
      "host_name": listing.host_name,
      "title": listing.title,
      "description": listing.description,
      "location": {
        "address": listing.address,
        "city": listing.city,
        "state": listing.state,
        "zip": listing.zip,
        "lat": listing.lat,
        "lon": listing.lon,
        "geo_point": { "lat": listing.lat, "lon": listing.lon }
      },
      "stadium_distances": {
        "metlife_minutes": 15, # Mock geocoding logic distance
        "metlife_transit_mode": "drive"
      },
      "pricing": {
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "currency": "USD"
      },
      "availability": availability,
      "amenities": listing.amenities,
      "house_rules": listing.house_rules,
      "languages_spoken": listing.languages_spoken,
      "team_welcome": listing.team_welcome,
      "max_guests": listing.max_guests,
      "photos": [assigned_photo],
      "host_verified": True,
      "status": "active",
      "created_at": datetime.now().isoformat(),
      "updated_at": datetime.now().isoformat()
    }
    
    listings_db.append(new_listing)
    
    # Save to ES if active
    es = get_es_client()
    if es:
        try:
            es.index(index="fanly_listings", id=new_id, document=new_listing)
        except Exception as e:
            print(f"Error indexing new listing in ES: {e}")
            
    # Save back to JSON so it persists during local session
    try:
        listings_file = os.path.join(project_root, "data", "seed", "listings.json")
        with open(listings_file, "w") as f:
            __import__("json").dump(listings_db, f, indent=2)
    except Exception as e:
        print(f"Error saving new listing: {e}")
        
    return new_listing

# Bookings endpoints
@app.post("/api/bookings")
def create_booking(booking: BookingRequest):
    booking_id = f"book_{str(uuid.uuid4())[:8]}"
    new_booking = {
        "booking_id": booking_id,
        "listing_id": booking.listing_id,
        "host_id": booking.host_id,
        "fan_id": booking.fan_id,
        "fan_name": booking.fan_name,
        "dates": {
            "check_in": booking.check_in,
            "check_out": booking.check_out
        },
        "guests": booking.guests,
        "total_price": booking.total_price,
        "status": "requested",
        "contract_url": "",
        "match_reference": "",
        "team_rooting_for": booking.team_rooting_for or "",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    bookings_db[booking_id] = new_booking
    
    # Save to ES if active
    save_booking_es(booking_id, new_booking)

    # Save back to JSON so it persists
    try:
        bookings_file = os.path.join(project_root, "data", "seed", "bookings.json")
        os.makedirs(os.path.dirname(bookings_file), exist_ok=True)
        with open(bookings_file, "w") as f:
            __import__("json").dump(bookings_db, f, indent=2)
    except Exception as e:
        print(f"Error saving bookings: {e}")
        
    return new_booking

@app.get("/api/bookings")
def get_bookings(user_id: str, role: str):
    # Try fetching from Elasticsearch
    es_bookings = get_bookings_es(user_id, role)
    if es_bookings:
        # Sync to in-memory db
        for b in es_bookings:
            bookings_db[b["booking_id"]] = b
        return es_bookings

    # Fallback to local in-memory db
    user_bookings = []
    for bid, booking in bookings_db.items():
        if role == "host" and booking["host_id"] == user_id:
            user_bookings.append(booking)
        elif role == "fan" and booking["fan_id"] == user_id:
            user_bookings.append(booking)
    return user_bookings

@app.post("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: str, payload: StatusUpdate):
    # Fetch from ES if not in memory
    if booking_id not in bookings_db:
        es = get_es_client()
        if es and es.exists(index="fanly_bookings", id=booking_id):
            bookings_db[booking_id] = es.get(index="fanly_bookings", id=booking_id)["_source"]

    if booking_id not in bookings_db:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    booking = bookings_db[booking_id]
    new_status = payload.status.lower()
    booking["status"] = new_status
    booking["updated_at"] = datetime.now().isoformat()
    
    # Generate contract if request is ACCEPTED
    if new_status == "accepted":
        # Fetch listing details
        listing = None
        for item in listings_db:
            if item["listing_id"] == booking["listing_id"]:
                listing = item
                break
                
        if listing:
            # Generate the agreement
            contract_text = generate_contract(
                host_name=listing["host_name"],
                fan_name=booking.get("fan_name", "Fan Guest"),
                address=listing["location"]["address"],
                city=listing["location"]["city"],
                state=listing["location"]["state"],
                check_in=booking["dates"]["check_in"],
                check_out=booking["dates"]["check_out"],
                price_per_night=listing["pricing"]["price_per_night"],
                total_price=booking["total_price"],
                house_rules=listing["house_rules"],
                guests=booking["guests"],
                language="en"
            )
            contracts_db[booking_id] = contract_text
            booking["contract_url"] = f"/api/contracts/{booking_id}"
            
            # Save contract to ES
            save_contract_es(booking_id, contract_text)
            
            # Save contracts to JSON so they persist
            try:
                contracts_file = os.path.join(project_root, "data", "seed", "contracts.json")
                os.makedirs(os.path.dirname(contracts_file), exist_ok=True)
                with open(contracts_file, "w") as f:
                    __import__("json").dump(contracts_db, f, indent=2)
            except Exception as e:
                print(f"Error saving contracts: {e}")
            
    # Save to ES
    save_booking_es(booking_id, booking)

    # Save back to JSON so it persists
    try:
        bookings_file = os.path.join(project_root, "data", "seed", "bookings.json")
        os.makedirs(os.path.dirname(bookings_file), exist_ok=True)
        with open(bookings_file, "w") as f:
            __import__("json").dump(bookings_db, f, indent=2)
    except Exception as e:
        print(f"Error saving bookings status update: {e}")
            
    return booking

@app.delete("/api/bookings/{booking_id}")
def delete_booking(booking_id: str):
    # Fetch from ES if not in memory
    if booking_id not in bookings_db:
        es = get_es_client()
        if es and es.exists(index="fanly_bookings", id=booking_id):
            bookings_db[booking_id] = es.get(index="fanly_bookings", id=booking_id)["_source"]

    if booking_id not in bookings_db:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    del bookings_db[booking_id]
    
    # Delete from ES
    delete_booking_es(booking_id)
    
    # Save back to JSON so it persists
    try:
        bookings_file = os.path.join(project_root, "data", "seed", "bookings.json")
        with open(bookings_file, "w") as f:
            __import__("json").dump(bookings_db, f, indent=2)
    except Exception as e:
        print(f"Error saving deleted booking: {e}")
        
    return {"status": "deleted", "booking_id": booking_id}

@app.get("/api/contracts/{booking_id}")
def get_contract(booking_id: str):
    # Try fetching from ES
    es_contract = get_contract_es(booking_id)
    if es_contract:
        contracts_db[booking_id] = es_contract["contract_text"]
        return es_contract

    if booking_id in contracts_db:
        return {"booking_id": booking_id, "contract_text": contracts_db[booking_id]}
        
    # If not in memory/persisted db, try to generate it dynamically from the booking information
    if booking_id not in bookings_db:
        es = get_es_client()
        if es and es.exists(index="fanly_bookings", id=booking_id):
            bookings_db[booking_id] = es.get(index="fanly_bookings", id=booking_id)["_source"]

    if booking_id in bookings_db:
        booking = bookings_db[booking_id]
        if booking.get("status") in ("accepted", "confirmed"):
            listing = None
            for item in listings_db:
                if item["listing_id"] == booking["listing_id"]:
                    listing = item
                    break
            if listing:
                contract_text = generate_contract(
                    host_name=listing["host_name"],
                    fan_name=booking.get("fan_name", "Fan Guest"),
                    address=listing["location"]["address"],
                    city=listing["location"]["city"],
                    state=listing["location"]["state"],
                    check_in=booking["dates"]["check_in"],
                    check_out=booking["dates"]["check_out"],
                    price_per_night=listing["pricing"]["price_per_night"],
                    total_price=booking["total_price"],
                    house_rules=listing["house_rules"],
                    guests=booking["guests"],
                    language="en"
                )
                contracts_db[booking_id] = contract_text
                
                # Save contract to ES
                save_contract_es(booking_id, contract_text)

                # Save contracts to JSON so they persist
                try:
                    contracts_file = os.path.join(project_root, "data", "seed", "contracts.json")
                    os.makedirs(os.path.dirname(contracts_file), exist_ok=True)
                    with open(contracts_file, "w") as f:
                        __import__("json").dump(contracts_db, f, indent=2)
                except Exception as e:
                    print(f"Error saving dynamically generated contract: {e}")
                return {"booking_id": booking_id, "contract_text": contract_text}

    raise HTTPException(status_code=404, detail="Contract not generated yet or booking not found")

# Matches endpoints
@app.get("/api/matches")
def get_matches(date_range: Optional[str] = None, stadium: Optional[str] = None):
    return check_match_schedule(date_range, stadium)

def query_agent_builder(query_text: str, session_id: str = "default_session"):
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT") or "fanly-497515"
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    agent_builder_id = os.getenv("GOOGLE_CLOUD_AGENT_BUILDER_ID") or os.getenv("GC_AGENT_BUILDER_ID")
    
    if not agent_builder_id:
        print("[AgentBuilder] GOOGLE_CLOUD_AGENT_BUILDER_ID or GC_AGENT_BUILDER_ID env var not configured. Skipping runtime query.")
        return None
        
    try:
        from google.cloud import discoveryengine_v1beta as discoveryengine
        client = discoveryengine.ConversationalSearchServiceClient()
        session_path = client.session_path(
            project=project_id,
            location=location,
            data_store=agent_builder_id,
            session=session_id
        )
        request = discoveryengine.AnswerQueryRequest(
            session=session_path,
            query=discoveryengine.Query(text=query_text),
        )
        response = client.answer_query(request)
        print(f"[AgentBuilder] Successfully queried Agent Builder: {agent_builder_id}")
        return response.answer.answer_text
    except Exception as e:
        print(f"[AgentBuilder] Runtime Query Failed: {e}")
        return None

# Helper to check if a query is search-related or just conversational
def is_search_query(query_text: str) -> bool:
    query_lower = query_text.lower().strip()
    
    # If it's a very short query (like a greeting), it's not a search
    if len(query_lower.split()) < 3:
        search_terms = {"search", "find", "room", "loft", "stay", "hotel", "host"}
        if not any(w in search_terms for w in query_lower.split()):
            return False
            
    # Phrases suggesting general help or explanations
    general_help_phrases = [
        "what are you able to help me with",
        "what can you do",
        "what are you",
        "who are you",
        "how does this work",
        "how do i",
        "what is this",
        "help me",
        "help with",
    ]
    if any(phrase in query_lower for phrase in general_help_phrases):
        return False
        
    # Check for search indicator keywords
    search_indicators = [
        "find", "search", "look", "show", "recommend", "list", "book", "rent",
        "room", "loft", "apartment", "house", "space", "accommodation", "stay", "place",
        "stadium", "metlife", "match", "game", "vs", "versus", "ticket",
        "price", "budget", "under", "cheap", "affordable", "cost", "night", "usd",
        "speak", "language", "portuguese", "spanish", "arabic", "french", "english",
        "brazil", "argentina", "usa", "england", "spain", "morocco", "germany",
        "june", "2026", "date", "availab", "check-in", "check-out", "to"
    ]
    
    import re
    if "$" in query_lower or re.search(r'\b\d{1,4}\b', query_lower):
        if "how" not in query_lower:
            return True
            
    return any(indicator in query_lower for indicator in search_indicators)

# AI Chat Matcher endpoint
@app.post("/api/chat")
async def run_chat_agent(payload: ChatRequest):
    user_messages = payload.messages
    if not user_messages:
        raise HTTPException(status_code=400, detail="Empty messages")
        
    user_query = user_messages[-1].content
    user_query_lower = user_query.lower()
    
    # Try calling Google Cloud Agent Builder at runtime
    agent_builder_answer = query_agent_builder(user_query)
    if agent_builder_answer:
        print("[ChatAgent] Using answer from Google Cloud Agent Builder.")
        response_payload = {
            "role": "assistant",
            "content": agent_builder_answer
        }
        if is_search_query(user_query):
            # Integrate with Elasticsearch MCP matching to populate list suggestions
            dates = "2026-06-18 to 2026-06-22"
            listings = search_listings(query=user_query, dates=dates)
            matches = check_match_schedule(date_range=dates, stadium="MetLife Stadium")
            response_payload["recommended_listings"] = listings
            response_payload["matched_matches"] = matches
        return response_payload
    
    # Extract criteria details using smart heuristics
    # Language detection
    lang = "en"
    if any(word in user_query_lower for word in ["preciso", "quarto", "estádio", "jogo", "brasil", "onde", "olá"]):
        lang = "pt"
    elif any(word in user_query_lower for word in ["necesito", "habitación", "estadio", "partido", "hola", "dónde"]):
        lang = "es"
    elif any(word in user_query_lower for word in ["besoin", "chambre", "stade", "match", "bonjour", "brésil"]):
        lang = "fr"
    elif any(word in user_query_lower for word in ["أريد", "غرفة", "ملعب", "مباراة", "مرحبًا"]):
        lang = "ar"
        
    # Dates extraction (mock parsing for demo dates)
    dates = "2026-06-18 to 2026-06-22" # default World Cup window
    if "18" in user_query_lower:
        dates = "2026-06-18 to 2026-06-21"
    elif "20" in user_query_lower:
        dates = "2026-06-18 to 2026-06-22"
    elif "23" in user_query_lower:
        dates = "2026-06-22 to 2026-06-25"
    elif "26" in user_query_lower:
        dates = "2026-06-25 to 2026-06-28"
        
    # Team extraction
    team = None
    if "brazil" in user_query_lower or "brasil" in user_query_lower:
        team = "Brazil"
    elif "argentina" in user_query_lower:
        team = "Argentina"
    elif "morocco" in user_query_lower or "marrocos" in user_query_lower or "marruecos" in user_query_lower:
        team = "Morocco"
    elif "spain" in user_query_lower or "espanha" in user_query_lower or "españa" in user_query_lower:
        team = "Spain"
    elif "usa" in user_query_lower or "estados unidos" in user_query_lower:
        team = "USA"
    elif "england" in user_query_lower or "inglaterra" in user_query_lower:
        team = "England"
        
    # Budget extraction
    max_price = None
    import re
    prices = re.findall(r'\$?(\d+)', user_query_lower)
    if prices:
        # Get the first price-like number
        max_price = float(prices[0])
        
    # Call local tools as baseline / backup
    matches = check_match_schedule(date_range=dates, stadium="MetLife Stadium")
    listings = search_listings(
        query=user_query,
        dates=dates,
        max_price=max_price,
        languages=["Portuguese" if lang == "pt" else "Spanish" if lang == "es" else "Arabic" if lang == "ar" else "French" if lang == "fr" else "English"],
        team_preference=team
    )
    
    recommended_listings = []
    matched_matches = []
    
    # Try calling Google GenAI with MCP/Local functions
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("true", "1", "yes")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_key or use_vertex:
        try:
            client = get_genai_client()
            mcp_client = ElasticMCPClient()
            
            # Read system prompt
            system_instruction = "You are a helpful World Cup peer-to-peer housing assistant agent."
            system_prompt_path = os.path.join(project_root, "agent", "prompts", "system_prompt.txt")
            if os.path.exists(system_prompt_path):
                with open(system_prompt_path, "r") as f:
                    system_instruction = f.read()
                    
            # Build conversation history
            contents = []
            for msg in payload.messages:
                contents.append(
                    types.Content(
                        role="user" if msg.role == "user" else "model",
                        parts=[types.Part.from_text(text=msg.content)]
                    )
                )
                
            # Determine tools available
            if mcp_client.is_configured():
                print("[ChatAgent] Elastic MCP client is configured. Hooking up elastic search tools.")
                tools = [mcp_client.list_indices, mcp_client.get_mappings, mcp_client.search]
            else:
                print("[ChatAgent] Elastic MCP client is NOT configured. Hooking up local tools wrappers.")
                # Local wrapper tools
                def search_listings_tool(query: Optional[str] = None, dates: Optional[str] = None, max_price: Optional[float] = None, languages: Optional[List[str]] = None, team_preference: Optional[str] = None) -> str:
                    """Search local listings database.
                    
                    Args:
                        query: General text search term.
                        dates: Check-in/out date range.
                        max_price: Maximum price filter.
                        languages: Host languages spoken.
                        team_preference: Team preference matches.
                    """
                    res = search_listings(query=query, dates=dates, max_price=max_price, languages=languages, team_preference=team_preference)
                    stripped = [{k: v for k, v in l.items() if k != 'description_embedding'} for l in res]
                    return json.dumps(stripped)
                    
                def check_match_schedule_tool(date_range: Optional[str] = None, stadium: Optional[str] = None) -> str:
                    """Check the FIFA match schedule.
                    
                    Args:
                        date_range: Date range to check.
                        stadium: Stadium filter.
                    """
                    res = check_match_schedule(date_range=date_range, stadium=stadium)
                    return json.dumps(res)
                    
                tools = [search_listings_tool, check_match_schedule_tool]
                
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=tools,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
            )
            
            # Initial chat prediction
            response = client.models.generate_content(
                model=get_model_name(),
                contents=contents,
                config=config
            )
            
            # Function Calling Execution Loop
            loop_limit = 5
            loop_count = 0
            while response.function_calls and loop_count < loop_limit:
                loop_count += 1
                tool_responses = []
                for call in response.function_calls:
                    print(f"[ChatAgent] Model wants to call tool: {call.name} with args: {call.args}")
                    
                    if call.name == "list_indices":
                        result_str = await mcp_client.list_indices()
                    elif call.name == "get_mappings":
                        result_str = await mcp_client.get_mappings(index=call.args.get("index"))
                    elif call.name == "search":
                        idx = call.args.get("index")
                        body = call.args.get("body")
                        if isinstance(body, str):
                            try:
                                body = json.loads(body)
                            except:
                                pass
                        result_str = await mcp_client.search(index=idx, body=body)
                        
                        # Try parsing listings/matches found
                        try:
                            data = json.loads(result_str)
                            hits = []
                            if isinstance(data, list):
                                hits = data
                            elif isinstance(data, dict):
                                if "hits" in data and "hits" in data["hits"]:
                                    hits = [h["_source"] for h in data["hits"]["hits"]]
                                elif "hits" in data:
                                    hits = data["hits"]
                                    
                            if idx == "fanly_listings":
                                recommended_listings = hits
                            elif idx == "fanly_matches":
                                matched_matches = hits
                        except Exception as parse_ex:
                            print(f"[ChatAgent] Error parsing MCP search result: {parse_ex}")
                            
                    elif call.name == "search_listings_tool":
                        q = call.args.get("query")
                        d = call.args.get("dates")
                        p = call.args.get("max_price")
                        l = call.args.get("languages")
                        t = call.args.get("team_preference")
                        res = search_listings(query=q, dates=d, max_price=p, languages=l, team_preference=t)
                        recommended_listings = res
                        result_str = json.dumps([{k: v for k, v in item.items() if k != 'description_embedding'} for item in res])
                        
                    elif call.name == "check_match_schedule_tool":
                        dr = call.args.get("date_range")
                        st = call.args.get("stadium")
                        res = check_match_schedule(date_range=dr, stadium=st)
                        matched_matches = res
                        result_str = json.dumps(res)
                    else:
                        result_str = f"Error: Unknown tool: {call.name}"
                        
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=call.name,
                            response={"result": result_str}
                        )
                    )
                    
                # Append functions and results to contents history
                contents.append(
                    types.Content(
                        role="model",
                        parts=[types.Part.from_function_calls(function_calls=response.function_calls)]
                    )
                )
                contents.append(
                    types.Content(
                        role="user",
                        parts=tool_responses
                    )
                )
                
                # Fetch next content step
                response = client.models.generate_content(
                    model=get_model_name(),
                    contents=contents,
                    config=config
                )
                
            if response.text:
                response_payload = {
                    "role": "assistant",
                    "content": response.text.strip()
                }
                if is_search_query(user_query):
                    if not recommended_listings:
                        recommended_listings = listings
                    if not matched_matches:
                        matched_matches = matches
                    response_payload["recommended_listings"] = recommended_listings
                    response_payload["matched_matches"] = matched_matches
                return response_payload
        except Exception as e:
            print(f"[ChatAgent] Gemini SDK call failed: {e}. Falling back to rule-based template.")
            
    # Local fallback templates based on language
    responses = {
        "pt": f"""Olá! Encontrei ótimas opções perto do MetLife Stadium para o período solicitado!

Confirmado no nosso calendário da Copa do Mundo:
{chr(10).join([f'- {m["home_team"]} vs {m["away_team"]} no dia {m["date"]} às {m["time"]} ({m["round"]})' for m in matches]) if matches else '- Nenhum jogo oficial de alta lotação programado na data, mas haverá grande movimentação festiva.'}

Recomendo estas acomodações que falam português ou acolhem sua torcida:
{chr(10).join([f'- **{l["title"]}** em {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/noite). Distância: {l["stadium_distances"]["metlife_minutes"]} min ({l["stadium_distances"]["metlife_transit_mode"]}). Anfitrião: {l["host_name"]} (fala {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- Nenhuma acomodação correspondente no momento. Tente mudar o orçamento ou datas.'}

**Dica de Transporte:** Como o jogo tem expectativa de público alto, planeje chegar com pelo menos 3 horas de antecedência. Os trens PATH e NJ Transit para Secaucus/MetLife estarão cheios. Clique em "Solicitar Acomodação" no card abaixo para gerar seu contrato e confirmar o aluguel!""",

        "es": f"""¡Hola! He encontrado excelentes opciones de alojamiento cerca del MetLife Stadium para tus fechas.

Confirmado en nuestro calendario de partidos:
{chr(10).join([f'- {m["home_team"]} vs {m["away_team"]} el {m["date"]} a las {m["time"]} ({m["round"]})' for m in matches]) if matches else '- No hay partidos oficiales programados, pero habrá ambiente de festival en la zona.'}

Alojamiento recomendado (anfitriones de habla hispana o hinchas bienvenidos):
{chr(10).join([f'- **{l["title"]}** en {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/noche). Distancia: {l["stadium_distances"]["metlife_minutes"]} min ({l["stadium_distances"]["metlife_transit_mode"]}). Anfitrión: {l["host_name"]} (habla {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- No hay alojamientos disponibles con esos filtros. Intenta ampliar tus fechas o presupuesto.'}

**Consejo logístico:** En días de partido de alta asistencia, la policía cierra avenidas principales cerca del estadio. Te sugerimos tomar transporte público (PATH + NJ Transit) desde Harrison o Newark Penn Station. ¡Haz clic en "Solicitar Acomodação" para avanzar!""",

        "en": f"""Hello! I've found some excellent hosting options near MetLife Stadium matching your requests!

Confirmed matches on schedule:
{chr(10).join([f'- {m["home_team"]} vs {m["away_team"]} on {m["date"]} at {m["time"]} ({m["round"]})' for m in matches]) if matches else '- No official high-attendance matches scheduled on these exact dates.'}

Recommended host listings:
{chr(10).join([f'- **{l["title"]}** in {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/night). Distance: {l["stadium_distances"]["metlife_minutes"]} min ({l["stadium_distances"]["metlife_transit_mode"]}). Host: {l["host_name"]} (speaks {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- No listings match these filters. Try expanding your dates or budget.'}

**Transit Info:** For match days with high attendance, roads around East Rutherford get severely congested. We highly recommend using NJ Transit trains via Secaucus Junction or the direct bus from NYC Port Authority. Select a listing card below to request a stay and generate your micro-contract!""",

        "fr": f"""Bonjour! J'ai trouvé d'excellentes options d'hébergement près du MetLife Stadium pour les dates demandées.

Calendrier des matchs confirmés:
{chr(10).join([f'- {m["home_team"]} vs {m["away_team"]} le {m["date"]} à {m["time"]} ({m["round"]})' for m in matches]) if matches else '- Aucun match officiel de haute affluence n’est prévu à ces dates.'}

Hébergements recommandés (hôtes francophones ou ouverts):
{chr(10).join([f'- **{l["title"]}** à {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/nuit). Distance: {l["stadium_distances"]["metlife_minutes"]} min ({l["stadium_distances"]["metlife_transit_mode"]}). Hôte: {l["host_name"]} (parle {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- Aucun logement ne correspond à ces critères. Essayez d’élargir vos dates ou votre budget.'}

**Info Transport:** Les jours de match à forte affluence, les routes autour du stade sont très encombrées. Nous vous conseillons d'utiliser les trains de la NJ Transit via Secaucus. Cliquez sur "Demander l'hébergement" pour générer votre accord de particulier à particulier!""",

        "ar": f"""مرحبًا! لقد عثرت على بعض خيارات الاستضافة الرائعة بالقرب من ملعب MetLife خلال التواريخ المطلوبة!

المباريات المؤكدة في هذا التاريخ:
{chr(10).join([f'- {m["home_team"]} ضد {m["away_team"]} في تاريخ {m["date"]} الساعة {m["time"]} ({m["round"]})' for m in matches]) if matches else '- لا توجد مباريات رسمية مجدولة في هذه التواريخ.'}

خيارات الاستضافة الموصى بها (مضيفون يتحدثون العربية أو يرحبون بمشجعيك):
{chr(10).join([f'- **{l["title"]}** في {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/ليلة). المسافة: {l["stadium_distances"]["metlife_minutes"]} دقيقة ({l["stadium_distances"]["metlife_transit_mode"]}). المضيف: {l["host_name"]} (يتحدث {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- لم يتم العثور على نتائج تطابق هذه الفلاتر. يرجى تجربة تواريخ أو ميزانية مختلفة.'}

**نصيحة الانتقال:** في أيام المباريات ذات الحضور الجماهيري المرتفع، ننصح بشدة باستخدام قطارات NJ Transit عبر محطة Secaucus لتجنب الازدحام. اضغط على "طلب إقامة" لبدء إنشاء العقد المبسط وتأكيد حجزك!"""
    }
    
    if not is_search_query(user_query):
        general_responses = {
            "pt": "Olá! Sou o seu assistente de hospedagem P2P para a Copa do Mundo de 2026. Posso ajudar você a encontrar acomodações próximas ao estádio MetLife, alinhar seu time de preferência ou idioma com anfitriões locais e gerar micro-contratos legais para garantir sua estadia. Como posso ajudar você hoje?",
            "es": "¡Hola! Soy tu asistente de alojamiento P2P para la Copa del Mundo de 2026. Puedo ayudarte a buscar habitaciones cerca del estadio MetLife, filtrar por equipos e idiomas con anfitriones locales y generar micro-contratos de hospedaje. ¿En qué te puedo ayudar hoy?",
            "en": "Hello! I am your P2P housing assistant for the 2026 FIFA World Cup. I can help you search for verified accommodations near MetLife Stadium, match with local hosts based on language/team preference, and generate secure micro-contracts for your stay. How can I help you today?",
            "fr": "Bonjour! Je suis votre assistant d'hébergement P2P pour la Coupe du Monde de la FIFA 2026. Je peux vous aider à rechercher des logements près du stade MetLife, à trouver des hôtes selon vos préférences linguistiques ou d'équipe, et à générer des micro-contrats sécurisés. Comment puis-je vous aider aujourd'hui?",
            "ar": "مرحبًا! أنا مساعد السكن المشترك لكأس العالم 2026. يمكنني مساعدتك في البحث عن أماكن إقامة تم التحقق منها بالقرب من ملعب MetLife، ومطابقتها مع المضيفين المحليين بناءً على تفضيلات اللغة والفريق، وإنشاء عقود مبسطة آمنة لإقامتك. كيف يمكنني مساعدتك اليوم؟"
        }
        return {
            "role": "assistant",
            "content": general_responses.get(lang, general_responses["en"])
        }

    agent_message = responses.get(lang, responses["en"])
    return {
        "role": "assistant",
        "content": agent_message,
        "recommended_listings": listings,
        "matched_matches": matches
    }
