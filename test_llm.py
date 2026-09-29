from crewai import LLM
import os
from dotenv import load_dotenv

load_dotenv()

def test_llm():
    try:
        llm = LLM(model="openrouter/free", temperature=0.2)
        response = llm.call(messages=[{"role": "user", "content": "Hello"}])
        print("Response:", response)
        print("Success!")
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_llm()
