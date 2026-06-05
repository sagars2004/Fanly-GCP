import os
import json
from pathlib import Path
from datetime import datetime
from agent.tools.ai_client import get_genai_client

ELASTIC_URL = os.getenv("ELASTIC_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")

def get_listings_local(query=None, dates=None, max_price=None, languages=None, team_preference=None):
    # Fallback mock search loading data locally
    project_root = Path(__file__).resolve().parents[2]
    listings_file = project_root / "data" / "seed" / "listings.json"
    
    # Try reading files
    try:
        with open(listings_file, "r") as f:
            listings = json.load(f)
    except Exception as e:
        print(f"Error loading local listings: {e}")
        return []

    filtered = []
    for item in listings:
        # 1. Price Filter
        if max_price is not None:
            if item["pricing"]["price_per_night"] > float(max_price):
                continue
                
        # 2. Date/Availability Filter
        if dates:
            # Check-in and check-out dates
            # Format could be "2026-06-18 to 2026-06-22" or an array or single date
            # We will search for overlap. To keep it simple, if dates contains dates,
            # we verify if listing is available for those dates.
            # Let's assume dates is a string of checkin/checkout or list
            available_dates = {d["date"]: d["available"] for d in item["availability"]}
            # If dates is e.g. "2026-06-18" or multiple days, we check availability
            req_dates = []
            if isinstance(dates, str):
                if " to " in dates:
                    start, end = dates.split(" to ")
                    # Parse ranges
                    try:
                        import dateutil.parser as dparser
                        from datetime import timedelta
                        s_dt = dparser.parse(start)
                        e_dt = dparser.parse(end)
                        curr = s_dt
                        while curr <= e_dt:
                            req_dates.append(curr.strftime("%Y-%m-%d"))
                            curr += timedelta(days=1)
                    except:
                        req_dates = [start, end]
                else:
                    req_dates = [dates]
            elif isinstance(dates, list):
                req_dates = dates
                
            not_available = False
            for r_date in req_dates:
                if r_date not in available_dates or not available_dates[r_date]:
                    not_available = True
                    break
            if not_available:
                continue

        # 3. Languages spoken filter
        if languages:
            if isinstance(languages, str):
                languages = [languages]
            # Match if host speaks at least one language
            host_langs = [l.lower() for l in item["languages_spoken"]]
            match_lang = any(l.lower() in host_langs for l in languages)
            if not match_lang:
                # Give a minor penalty or skip? Let's skip to ensure accuracy
                continue

        # 4. Team preference matching (Optional boosting/filtering)
        # We don't filter out strictly, but we mark it or sort by it.
        
        # 5. Simple Text Matching (Mock Vector Search)
        score = 100.0
        if query:
            query_words = set(query.lower().split())
            desc_words = set(item["description"].lower().split() + item["title"].lower().split())
            intersection = query_words.intersection(desc_words)
            # Add simple score boost for matching words
            score += len(intersection) * 10
            
            # Boost if team welcome matches query
            if team_preference:
                welcome_teams = [t.lower() for t in item["team_welcome"]]
                if team_preference.lower() in welcome_teams:
                    score += 50
                    
        item["_score"] = score
        filtered.append(item)
        
    # Sort by score descending
    filtered.sort(key=lambda x: x.get("_score", 0), reverse=True)
    return filtered[:5]

def search_listings(query=None, dates=None, max_price=None, languages=None, team_preference=None):
    """
    Search listings in Elasticsearch or locally using filter parameters.
    """
    if not ELASTIC_URL or not ELASTIC_API_KEY:
        return get_listings_local(query, dates, max_price, languages, team_preference)
        
    try:
        from elasticsearch import Elasticsearch
        es = Elasticsearch(ELASTIC_URL, api_key=ELASTIC_API_KEY)
        
        # Build query clauses
        must_clauses = []
        filter_clauses = [{"term": { "status": "active" }}]
        
        if max_price:
            filter_clauses.append({
                "range": {
                    "pricing.price_per_night": { "lte": float(max_price) }
                }
            })
            
        if dates:
            req_dates = []
            if isinstance(dates, str):
                if " to " in dates:
                    start, end = dates.split(" to ")
                    try:
                        from datetime import datetime as dt_class, timedelta
                        s_dt = dt_class.strptime(start.strip(), "%Y-%m-%d")
                        e_dt = dt_class.strptime(end.strip(), "%Y-%m-%d")
                        curr = s_dt
                        while curr <= e_dt:
                            req_dates.append(curr.strftime("%Y-%m-%d"))
                            curr += timedelta(days=1)
                    except Exception as parse_err:
                        print(f"Error parsing date range: {parse_err}")
                        req_dates = [start.strip(), end.strip()]
                else:
                    req_dates = [dates.strip()]
            elif isinstance(dates, list):
                req_dates = dates
                
            for r_date in req_dates:
                filter_clauses.append({
                    "nested": {
                        "path": "availability",
                        "query": {
                            "bool": {
                                "filter": [
                                    { "term": { "availability.date": r_date } },
                                    { "term": { "availability.available": True } }
                                ]
                            }
                        }
                    }
                })
            
        if languages:
            if isinstance(languages, str):
                languages = [languages]
            # Include original, lowercase, and capitalized versions for exact keyword matching
            lang_terms = []
            for l in languages:
                lang_terms.append(l)
                lang_terms.append(l.lower())
                lang_terms.append(l.capitalize())
            filter_clauses.append({
                "terms": { "languages_spoken": list(set(lang_terms)) }
            })
            
        # Standard Elasticsearch query
        body = {
            "query": {
                "bool": {
                    "must": must_clauses if must_clauses else {"match_all": {}},
                    "filter": filter_clauses
                }
            },
            "size": 5
        }
        
        if team_preference:
            body["query"]["bool"]["should"] = [
                {"term": { "team_welcome": team_preference }},
                {"term": { "team_welcome": team_preference.lower() }},
                {"term": { "team_welcome": team_preference.capitalize() }},
                {"term": { "team_welcome": "All" }},
                {"term": { "team_welcome": "all" }}
            ]
        
        # Add basic full text match
        query_vector = None
        if query:
            try:
                client = get_genai_client()
                # Use text-embedding-004 to fetch user query embeddings
                emb_res = client.models.embed_content(
                    model="text-embedding-004",
                    contents=query
                )
                query_vector = emb_res.embeddings[0].values
                print(f"[ElasticSearch] Successfully generated {len(query_vector)}-dim query vector.")
            except Exception as emb_err:
                print(f"[ElasticSearch] Semantic embedding query generation failed: {emb_err}. Falling back to keyword-only.")

            body["query"]["bool"]["must"] = {
                "multi_match": {
                    "query": query,
                    "fields": ["title^2", "description", "house_rules"]
                }
            }
            
        # Implement hybrid search if query vector is available
        if query_vector:
            body["knn"] = {
                "field": "description_embedding",
                "query_vector": query_vector,
                "k": 5,
                "num_candidates": 50,
                "filter": filter_clauses
            }
            
        res = es.search(index="fanly_listings", body=body)
        results = []
        for hit in res["hits"]["hits"]:
            item = hit["_source"]
            item["_score"] = hit["_score"]
            results.append(item)
        return results
        
    except Exception as e:
        print(f"Elasticsearch error: {e}. Falling back to local search.")
        return get_listings_local(query, dates, max_price, languages, team_preference)
