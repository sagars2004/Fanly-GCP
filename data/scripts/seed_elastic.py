import os
import json
import random
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to load any potential shared modules
sys.path.append(str(Path(__file__).resolve().parents[2]))

load_dotenv()

ELASTIC_URL = os.getenv("ELASTIC_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
USE_VERTEXAI = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("true", "1", "yes")
from agent.tools.ai_client import get_genai_client

def generate_mock_embedding(text):
    # Generates a pseudo-random normalized 768-dimensional vector for local/mock vector search
    # Seed by the text content to make it deterministic
    random.seed(hash(text))
    vec = [random.gauss(0, 1) for _ in range(768)]
    norm = sum(x**2 for x in vec)**0.5
    return [x/norm for x in vec]

def generate_gemini_embedding(text):
    if not GEMINI_API_KEY and not USE_VERTEXAI:
        return generate_mock_embedding(text)
    try:
        client = get_genai_client()
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f"Error calling Gemini Embedding API: {e}. Falling back to mock embedding.")
        return generate_mock_embedding(text)

def main():
    print("--- Running Fanly Elasticsearch Seeding Script ---")
    
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parents[1]
    
    # Load listings and matches
    try:
        with open(project_root / "data" / "seed" / "listings.json", "r") as f:
            listings = json.load(f)
        with open(project_root / "data" / "seed" / "match_schedule.json", "r") as f:
            matches = json.load(f)
        with open(project_root / "data" / "schemas" / "listings_mapping.json", "r") as f:
            listings_mapping = json.load(f)
        with open(project_root / "data" / "schemas" / "match_mapping.json", "r") as f:
            matches_mapping = json.load(f)
    except FileNotFoundError as e:
        print(f"Error loading seed/mapping files: {e}")
        return

    # Check if we have cached embeddings in listings_with_embeddings.json
    cached_path = project_root / "data" / "seed" / "listings_with_embeddings.json"
    cached_listings = []
    if cached_path.exists():
        try:
            with open(cached_path, "r") as f:
                cached_listings = json.load(f)
            # Verify if cached listings match our current listings length and contain embeddings
            if len(cached_listings) == len(listings) and all("description_embedding" in l for l in cached_listings):
                print("Found cached embeddings for listings. Loading from cache...")
                listings = cached_listings
        except Exception as cache_err:
            print(f"Error reading cached listings: {cache_err}. Will regenerate.")

    # Add embeddings to listings if not loaded from cache
    if not listings or "description_embedding" not in listings[0]:
        print("Generating embeddings for listing descriptions...")
        for idx, listing in enumerate(listings):
            text_to_embed = f"{listing['title']}. {listing['description']} Speaks {', '.join(listing['languages_spoken'])}. Rules: {listing['house_rules']}"
            listing["description_embedding"] = generate_gemini_embedding(text_to_embed)
            print(f"  Processed {idx + 1}/{len(listings)}: {listing['title']}")
        
        # Save to cache for faster consecutive runs
        try:
            with open(cached_path, "w") as f:
                json.dump(listings, f, indent=2)
            print(f"Saved generated embeddings to cache at {cached_path}")
        except Exception as cache_err:
            print(f"Failed to save embeddings cache: {cache_err}")

    # Check if we should connect to real Elasticsearch
    if not ELASTIC_URL or not ELASTIC_API_KEY:
        print("\n[Local Mock Mode Detect]")
        print("ELASTIC_URL and/or ELASTIC_API_KEY environment variables not found.")
        print("Local mock seed files are ready! Start the agent API and Next.js frontend to run locally.")
        return

    # Attempt indexing into Elasticsearch
    try:
        from elasticsearch import Elasticsearch
        from elasticsearch.helpers import bulk
        
        print(f"\nConnecting to Elasticsearch at {ELASTIC_URL}...")
        es = Elasticsearch(ELASTIC_URL, api_key=ELASTIC_API_KEY, request_timeout=60.0)
        
        info = es.info()
        print(f"Connected successfully! Cluster: {info['cluster_name']}, Version: {info['version']['number']}")
        
        # 1. Seed Listings Index
        listings_index = "fanly_listings"
        if es.indices.exists(index=listings_index):
            print(f"Index '{listings_index}' already exists. Deleting...")
            es.indices.delete(index=listings_index)
            
        print(f"Creating index '{listings_index}' with mapping...")
        es.indices.create(index=listings_index, body=listings_mapping)
        
        print(f"Indexing {len(listings)} listings via bulk helper...")
        listing_actions = [
            {
                "_index": listings_index,
                "_id": listing["listing_id"],
                "_source": listing
            }
            for listing in listings
        ]
        success_count, _ = bulk(es, listing_actions)
        print(f"Successfully indexed {success_count} listings!")
            
        # 2. Seed Match Schedule Index
        matches_index = "fanly_matches"
        if es.indices.exists(index=matches_index):
            print(f"Index '{matches_index}' already exists. Deleting...")
            es.indices.delete(index=matches_index)
            
        print(f"Creating index '{matches_index}' with mapping...")
        es.indices.create(index=matches_index, body=matches_mapping)
        
        print(f"Indexing {len(matches)} matches via bulk helper...")
        match_actions = [
            {
                "_index": matches_index,
                "_id": match["match_id"],
                "_source": match
            }
            for match in matches
        ]
        success_count, _ = bulk(es, match_actions)
        print(f"Successfully indexed {success_count} matches!")
            
        print("\nSeeding completed successfully on Elastic Cloud!")
        
    except ImportError:
        print("\nError: 'elasticsearch' Python package not installed.")
        print("Run 'pip install elasticsearch' if you want to seed a real Elasticsearch cluster.")
    except Exception as e:
        print(f"\nFailed to index to Elasticsearch: {e}")

if __name__ == "__main__":
    main()
