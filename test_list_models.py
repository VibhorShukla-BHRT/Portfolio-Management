import os
import requests
from dotenv import load_dotenv

load_dotenv()

def list_models():
    if os.getenv("LLM_BASE_URL"):
        base_url = os.getenv("LLM_BASE_URL")
        api_key = os.getenv("LLM_API_KEY", "ollama")
    elif os.getenv("OPENROUTER_API_KEY"):
        base_url = "https://openrouter.ai/api/v1"
        api_key = os.getenv("OPENROUTER_API_KEY")
    else:
        print("ERROR: Neither LLM_BASE_URL nor OPENROUTER_API_KEY is configured in .env.")
        print("Please copy .env.example to .env and configure your backend.")
        return

    endpoint = f"{base_url.rstrip('/')}/models"
    print(f"Querying models endpoint: {endpoint}")
    try:
        response = requests.get(
            endpoint,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=5
        )
        response.raise_for_status()
        
        models = response.json().get("data", [])
        print(f"Discovered {len(models)} model(s):")
        for model in models:
            print(" -", model.get("id"))
    except requests.exceptions.Timeout:
        print("Request timed out. Please check if the Kaggle Tailscale node is currently active.")
    except Exception as e:
        print("Error fetching models:", e)

if __name__ == "__main__":
    list_models()
