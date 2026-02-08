import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

api_key = os.getenv('OPENAI_API_KEY')

if not api_key:
    print("ERROR: OPENAI_API_KEY not found in backend/.env")
    sys.exit(1)

print(f"API Key found: {api_key[:20]}...{api_key[-4:]}")
print(f"Key length: {len(api_key)} characters")

# Check format
if not api_key.startswith('sk-'):
    print("WARNING: API key doesn't start with 'sk-' - might be invalid format")
else:
    print("Format looks correct (starts with 'sk-')")

# Try to make a simple API call
try:
    import openai
    print("\nTesting API key with OpenAI...")
    
    client = openai.OpenAI(api_key=api_key)
    
    # Simple test call
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Say 'test successful'"}],
        max_tokens=10
    )
    
    print("✓ API key is VALID!")
    print(f"Response: {response.choices[0].message.content}")
    
except ImportError:
    print("\nWARNING: openai package not installed")
    print("Run: pip install openai")
except Exception as e:
    print(f"\n✗ API key test FAILED!")
    print(f"Error: {str(e)}")
    
    if "Incorrect API key" in str(e):
        print("\nThe API key is invalid or expired.")
        print("Get a new key from: https://platform.openai.com/api-keys")
    elif "rate_limit" in str(e).lower():
        print("\nRate limit exceeded. Wait a moment and try again.")
    elif "insufficient_quota" in str(e).lower():
        print("\nYour OpenAI account has no credits remaining.")
        print("Add credits at: https://platform.openai.com/account/billing")

