#!/usr/bin/env python3
"""
Automated One-Click Deployment Script for Hugging Face Spaces
Deploys the MASS Multi-Agent Portfolio Management Engine with 16GB RAM (Free Tier).
"""

import os
import sys
from dotenv import load_dotenv
from huggingface_hub import HfApi, create_repo, upload_folder

load_dotenv()

TOKEN = os.getenv("HF_TOKEN")
USERNAME = os.getenv("HF_USERNAME", "red-tiger")
SPACE_NAME = os.getenv("HF_SPACE_NAME", "mass-portfolio-system")
REPO_ID = f"{USERNAME}/{SPACE_NAME}"

GROQ_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

def deploy():
    if not TOKEN:
        print("ERROR: HF_TOKEN is not configured in .env!")
        sys.exit(1)

    print("==================================================")
    print("MASS Hugging Face Space Automated Deployment")
    print("==================================================")
    print(f"Target Space: https://huggingface.co/spaces/{REPO_ID}")

    api = HfApi(token=TOKEN)

    # 1. Verify User Authentication
    try:
        user = api.whoami()
        print(f"[1/4] Authenticated as Hugging Face user: {user.get('name')}")
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)

    # 2. Create Space Repository if it doesn't exist
    print(f"[2/4] Ensuring Docker Space exists: {REPO_ID}...")
    try:
        create_repo(
            repo_id=REPO_ID,
            repo_type="space",
            space_sdk="docker",
            token=TOKEN,
            exist_ok=True,
            private=False
        )
        print(" -> Space initialized successfully!")
    except Exception as e:
        print(f" -> Notice on repo check: {e}")

    # 3. Configure Groq Secret on Space
    if GROQ_KEY:
        print("[3/4] Syncing GROQ_API_KEY secret to Space...")
        try:
            api.add_space_secret(repo_id=REPO_ID, key="GROQ_API_KEY", value=GROQ_KEY)
            api.add_space_secret(repo_id=REPO_ID, key="GROQ_MODEL", value=GROQ_MODEL)
            print(" -> Space secrets configured!")
        except Exception as e:
            print(f" -> Note on secret sync: {e}")

    # 4. Upload Project Directory
    print("[4/4] Uploading application files to Hugging Face Space...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Files to exclude from upload
    ignore_patterns = [
        "venv/**",
        ".venv/**",
        "*.pyc",
        "__pycache__/**",
        ".git/**",
        ".chroma_db/**",
        "frontend/node_modules/**",
        "*.pptx",
        ".env"
    ]

    try:
        upload_folder(
            folder_path=base_dir,
            repo_id=REPO_ID,
            repo_type="space",
            token=TOKEN,
            ignore_patterns=ignore_patterns,
            commit_message="Deploy MASS Institutional Multi-Agent System (v2.0)"
        )
        print("\n==================================================")
        print("DEPLOYMENT SUCCESSFUL!")
        print("==================================================")
        print(f"Space URL: https://huggingface.co/spaces/{REPO_ID}")
        print(f"Public API Endpoint: https://{USERNAME}-{SPACE_NAME}.hf.space")
        print("Your application is now building on 16GB RAM Free compute!")
    except Exception as e:
        print(f"Upload failed: {e}")

if __name__ == "__main__":
    deploy()
