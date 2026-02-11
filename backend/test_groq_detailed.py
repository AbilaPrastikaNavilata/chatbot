
import os
from dotenv import load_dotenv
from groq import Groq, RateLimitError
import json

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

system_prompt = "You are a helpful assistant."
# Simulating a context of similar size to what's in the app (~8000 chars)
context = "A" * 8000 
message = "halo"

messages = [
    {"role": "system", "content": f"{system_prompt}\nContext: {context}"},
    {"role": "user", "content": message}
]

print(f"Testing with API Key starting with: {api_key[:10]}...")
print(f"Model: llama-3.3-70b-versatile")
print(f"Approximate Prompt size: {len(json.dumps(messages))//4} tokens")

try:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=100
    )
    print("✅ Success!")
    print("Response:", response.choices[0].message.content)
except RateLimitError as e:
    print("❌ Rate Limit Hit!")
    print(f"Error Message: {e}")
    # Try to access headers if possible through the response attribute of the error
    if hasattr(e, 'response'):
        print("Headers:", e.response.headers)
except Exception as e:
    print(f"❌ Other Error: {e}")
