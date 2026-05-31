import os
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Import tools
from agent.tools.search_listings import search_listings
from agent.tools.check_match_schedule import check_match_schedule
from agent.tools.generate_contract import generate_contract

app = FastAPI(title="Fanly API", description="World Cup AI P2P Housing Agent API")

# Enable CORS for Next.js frontend
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

# Seed initial listings into listings_db from the seed file
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    listings_file = os.path.join(project_root, "data", "seed", "listings.json")
    if os.path.exists(listings_file):
        with open(listings_file, "r") as f:
            listings_db = __import__("json").load(f)
except Exception as e:
    print(f"Error seeding local database: {e}")

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

class StatusUpdate(BaseModel):
    status: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = "en"

# Endpoints
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "Local Mock Mode" if not os.getenv("ELASTIC_URL") else "Elastic Cloud Mode"
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

@app.post("/api/listings")
def create_listing(listing: ListingCreate):
    new_id = f"list_{str(uuid.uuid4())[:8]}"
    availability = [{"date": dt, "available": True} for dt in listing.availability_dates]
    
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
      "photos": ["/images/generic_room.jpg"],
      "host_verified": True,
      "status": "active",
      "created_at": datetime.now().isoformat(),
      "updated_at": datetime.now().isoformat()
    }
    
    listings_db.append(new_listing)
    
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
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    bookings_db[booking_id] = new_booking
    return new_booking

@app.get("/api/bookings")
def get_bookings(user_id: str, role: str):
    user_bookings = []
    for bid, booking in bookings_db.items():
        if role == "host" and booking["host_id"] == user_id:
            user_bookings.append(booking)
        elif role == "fan" and booking["fan_id"] == user_id:
            user_bookings.append(booking)
    return user_bookings

@app.post("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: str, payload: StatusUpdate):
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
            
    return booking

@app.get("/api/contracts/{booking_id}")
def get_contract(booking_id: str):
    if booking_id not in contracts_db:
        raise HTTPException(status_code=404, detail="Contract not generated yet")
    return {"booking_id": booking_id, "contract_text": contracts_db[booking_id]}

# Matches endpoints
@app.get("/api/matches")
def get_matches(date_range: Optional[str] = None, stadium: Optional[str] = None):
    return check_match_schedule(date_range, stadium)

# AI Chat Matcher endpoint
@app.post("/api/chat")
def run_chat_agent(payload: ChatRequest):
    user_messages = payload.messages
    if not user_messages:
        raise HTTPException(status_code=400, detail="Empty messages")
        
    user_query = user_messages[-1].content
    user_query_lower = user_query.lower()
    
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
        
    # Call tools
    matches = check_match_schedule(date_range=dates, stadium="MetLife Stadium")
    listings = search_listings(
        query=user_query,
        dates=dates,
        max_price=max_price,
        languages=["Portuguese" if lang == "pt" else "Spanish" if lang == "es" else "Arabic" if lang == "ar" else "French" if lang == "fr" else "English"],
        team_preference=team
    )
    
    # Call Gemini to write the explanation if API key is present
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Format system prompt and tool outputs into the model context
            with open(os.path.join(project_root, "agent", "prompts", "system_prompt.txt"), "r") as f:
                system_prompt = f.read()
                
            prompt = f"""
            {system_prompt}
            
            TOOL INPUTS & OUTPUTS:
            - User Query: {user_query}
            - Detected Language: {lang}
            - Date range: {dates}
            - Matches Found: {matches}
            - Listings Found: {[{k: v for k, v in l.items() if k != 'description_embedding'} for l in listings]}
            
            Write your response back to the user in the language they used. Highlight why these listings are recommended, transit details for their match day, and invite them to select a room or ask any question.
            """
            response = model.generate_content(prompt)
            if response.text:
                return {
                    "role": "assistant",
                    "content": response.text.strip(),
                    "recommended_listings": listings,
                    "matched_matches": matches
                }
        except Exception as e:
            print(f"Gemini API Chat call failed: {e}. Falling back to rule-based template.")
            
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
{chr(10).join([f'- {m["home_team"]} vs {m["away_team"]} le {m["date"]} à {m["time"]} ({m["round"]})' for m in matches]) if matches else '- Aucun match officiel de haute affluence n\\'est prévu à ces dates.'}

Hébergements recommandés (hôtes francophones ou ouverts):
{chr(10).join([f'- **{l["title"]}** à {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/nuit). Distance: {l["stadium_distances"]["metlife_minutes"]} min ({l["stadium_distances"]["metlife_transit_mode"]}). Hôte: {l["host_name"]} (parle {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- Aucun logement ne correspond à ces critères. Essayez d\\'élargir vos dates ou votre budget.'}

**Info Transport:** Les jours de match à forte affluence, les routes autour du stade sont très encombrées. Nous vous conseillons d\\'utiliser les trains de la NJ Transit via Secaucus. Cliquez sur "Demander l\\'hébergement" pour générer votre accord de particulier à particulier!""",

        "ar": f"""مرحبًا! لقد عثرت على بعض خيارات الاستضافة الرائعة بالقرب من ملعب MetLife خلال التواريخ المطلوبة!

المباريات المؤكدة في هذا التاريخ:
{chr(10).join([f'- {m["home_team"]} ضد {m["away_team"]} في تاريخ {m["date"]} الساعة {m["time"]} ({m["round"]})' for m in matches]) if matches else '- لا توجد مباريات رسمية مجدولة في هذه التواريخ.'}

خيارات الاستضافة الموصى بها (مضيفون يتحدثون العربية أو يرحبون بمشجعيك):
{chr(10).join([f'- **{l["title"]}** في {l["location"]["city"]}, NJ (${l["pricing"]["price_per_night"]}/ليلة). المسافة: {l["stadium_distances"]["metlife_minutes"]} دقيقة ({l["stadium_distances"]["metlife_transit_mode"]}). المضيف: {l["host_name"]} (يتحدث {", ".join(l["languages_spoken"])}).' for l in listings]) if listings else '- لم يتم العثور على نتائج تطابق هذه الفلاتر. يرجى تجربة تواريخ أو ميزانية مختلفة.'}

**نصيحة الانتقال:** في أيام المباريات ذات الحضور الجماهيري المرتفع، ننصح بشدة باستخدام قطارات NJ Transit عبر محطة Secaucus لتجنب الازدحام. اضغط على "طلب إقامة" لبدء إنشاء العقد المبسط وتأكيد حجزك!"""
    }
    
    agent_message = responses.get(lang, responses["en"])
    return {
        "role": "assistant",
        "content": agent_message,
        "recommended_listings": listings,
        "matched_matches": matches
    }
