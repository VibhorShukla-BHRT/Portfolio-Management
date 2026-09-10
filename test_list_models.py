import os
from google.genai import Client
from dotenv import load_dotenv

load_dotenv()

def list_models():
    try:
        client = Client(api_key=os.getenv("GEMINI_API_KEY"))
        for model in client.models.list():
            print(model.name)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    list_models()
