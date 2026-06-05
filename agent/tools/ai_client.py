import os
from google import genai

def get_genai_client() -> genai.Client:
    """
    Initialize and return the unified Google GenAI client.
    Configures Vertex AI mode if GOOGLE_GENAI_USE_VERTEXAI is true.
    """
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("true", "1", "yes")
    
    if use_vertex:
        project = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        print(f"[AIClient] Initializing Vertex AI Client (Project: {project}, Location: {location})")
        return genai.Client(vertexai=True, project=project, location=location)
    else:
        api_key = os.getenv("GEMINI_API_KEY")
        # If no GEMINI_API_KEY is supplied, standard SDK looks for GEMINI_API_KEY env.
        # We explicitly print if key is missing or loaded.
        if api_key:
            print("[AIClient] Initializing Gemini Developer API Client (API Key Loaded)")
        else:
            print("[AIClient] Initializing Gemini Developer API Client (No API Key in Env)")
        return genai.Client(api_key=api_key)
