import os
import requests
from dotenv import load_dotenv

load_dotenv()

def list_models():
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            print("No OPENROUTER_API_KEY found.")
            return

        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        response.raise_for_status()
        
        models = response.json().get("data", [])
        for model in models:
            print(model.get("id"))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    list_models()
