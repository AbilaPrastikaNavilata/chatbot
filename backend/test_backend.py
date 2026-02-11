import os
import asyncio
from dotenv import load_dotenv
from groq import Groq
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import motor.motor_asyncio
import certifi

# Load environment variables
load_dotenv()

async def test_mongodb():
    print("\nTesting MongoDB Connection...")
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("❌ MONGODB_URI not found in .env")
        return False

    try:
        # Try connecting slightly differently to match app.py's logic effectively
        client = motor.motor_asyncio.AsyncIOMotorClient(
            uri,
            server_api=ServerApi('1'),
            tlsCAFile=certifi.where()
        )
        # Force a connection verification
        await client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB Connection Failed: {e}")
        return False

def test_groq():
    print("\nTesting Groq API...")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found in .env")
        return False
    
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Hello, explain 1+1 briefly.",
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        print(f"✅ Groq API Response: {chat_completion.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"❌ Groq API Failed: {e}")
        return False

async def main():
    print("Starting Backend Diagnostics...")
    mongo_status = await test_mongodb()
    groq_status = test_groq()
    
    if mongo_status and groq_status:
        print("\n✅ All systems go! The issue might be in the code logic or specific data.")
    else:
        print("\n❌ System checks failed.")

if __name__ == "__main__":
    asyncio.run(main())
