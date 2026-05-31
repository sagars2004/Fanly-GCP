import os
import json
from pathlib import Path
from datetime import datetime

ELASTIC_URL = os.getenv("ELASTIC_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")

def get_matches_local(date_range=None, stadium=None):
    project_root = Path(__file__).resolve().parents[2]
    matches_file = project_root / "data" / "seed" / "match_schedule.json"
    
    try:
        with open(matches_file, "r") as f:
            matches = json.load(f)
    except Exception as e:
        print(f"Error loading local match schedule: {e}")
        return []

    filtered = []
    
    # Parse dates
    start_date = None
    end_date = None
    if date_range:
        # Check if date range is string formatted like "2026-06-18 to 2026-06-22"
        if isinstance(date_range, str):
            if " to " in date_range:
                parts = date_range.split(" to ")
                start_date = parts[0].strip()
                end_date = parts[1].strip()
            else:
                start_date = date_range.strip()
                end_date = date_range.strip()
        elif isinstance(date_range, list):
            if len(date_range) > 0:
                start_date = date_range[0]
                end_date = date_range[-1]

    for match in matches:
        # Filter by stadium if provided
        if stadium and stadium.lower() not in match["stadium"].lower():
            continue
            
        # Filter by date range if provided
        if start_date and end_date:
            m_date = match["date"]
            if not (start_date <= m_date <= end_date):
                continue
        elif start_date:
            if match["date"] != start_date:
                continue

        filtered.append(match)
        
    return filtered

def check_match_schedule(date_range=None, stadium=None):
    """
    Check the match schedule for the given date range or stadium.
    """
    if not ELASTIC_URL or not ELASTIC_API_KEY:
        return get_matches_local(date_range, stadium)
        
    try:
        from elasticsearch import Elasticsearch
        es = Elasticsearch(ELASTIC_URL, api_key=ELASTIC_API_KEY)
        
        filter_clauses = []
        if stadium:
            filter_clauses.append({
                "match": { "stadium": stadium }
            })
            
        if date_range:
            start_date = None
            end_date = None
            if isinstance(date_range, str) and " to " in date_range:
                parts = date_range.split(" to ")
                start_date = parts[0].strip()
                end_date = parts[1].strip()
            elif isinstance(date_range, str):
                start_date = date_range
                end_date = date_range
                
            if start_date and end_date:
                filter_clauses.append({
                    "range": {
                        "date": {
                            "gte": start_date,
                            "lte": end_date
                        }
                    }
                })
        
        body = {
            "query": {
                "bool": {
                    "filter": filter_clauses
                }
            },
            "size": 10
        }
        
        res = es.search(index="fanly_matches", body=body)
        results = []
        for hit in res["hits"]["hits"]:
            results.append(hit["_source"])
        return results
        
    except Exception as e:
        print(f"Elasticsearch match schedule query error: {e}. Falling back to local data.")
        return get_matches_local(date_range, stadium)
