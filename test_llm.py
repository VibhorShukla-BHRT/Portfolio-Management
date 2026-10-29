from crewai import LLM
import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_llm():
    if os.getenv("LLM_BASE_URL"):
        model = os.getenv("LLM_MODEL", "ollama/ritu-27b:latest")
        base_url = os.getenv("LLM_BASE_URL")
        api_key = os.getenv("LLM_API_KEY", "ollama")
    elif os.getenv("OPENROUTER_API_KEY"):
        candidate_model = os.getenv("OPENROUTER_MODEL") or os.getenv("LLM_MODEL", "")
        if not candidate_model or candidate_model.startswith("ollama"):
            model = "openrouter/openrouter/free"
        else:
            model = candidate_model
        base_url = "https://openrouter.ai/api/v1"
        api_key = os.getenv("OPENROUTER_API_KEY")
    else:
        print("ERROR: Neither LLM_BASE_URL nor OPENROUTER_API_KEY is configured in .env.")
        print("Please copy .env.example to .env and configure your backend.")
        return

    print(f"Testing LLM connectivity...")
    print(f"Target Model: {model}")
    print(f"Base URL: {base_url}")
    
    # 1. Quick HTTP probe to verify network and endpoint reachability
    print("\n[Step 1/2] Probing endpoint health...")
    try:
        resp = requests.get(f"{base_url.rstrip('/')}/models", timeout=5, headers={"Authorization": f"Bearer {api_key}"})
        print(f"Endpoint probe status: {resp.status_code}")
        if resp.status_code == 200:
            print("Available models on server:", resp.json())
    except requests.exceptions.Timeout:
        print("Endpoint probe TIMED OUT. Ensure the Kaggle notebook and Tailscale node are active.")
    except Exception as e:
        print(f"Endpoint probe error: {e}")

    # 2. Test CrewAI LLM call
    print("\n[Step 2/2] Testing CrewAI LLM.call()...")
    try:
        llm = LLM(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=0.2,
            timeout=10
        )
        response = llm.call(messages=[{"role": "user", "content": "Respond with the single word: OK"}])
        print("Response from LLM:", response)
        print("LLM Test Succeeded!")
    except Exception as e:
        print("CrewAI LLM call failed:", str(e))
        print("Note: If using Tailscale with Kaggle, ensure the Kaggle kernel is currently running.")

if __name__ == "__main__":
    test_llm()
