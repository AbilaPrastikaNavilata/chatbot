import asyncio, os
import motor.motor_asyncio
from pymongo.server_api import ServerApi
import certifi
from dotenv import load_dotenv

load_dotenv()

client = motor.motor_asyncio.AsyncIOMotorClient(
    os.getenv("MONGODB_URI"),
    server_api=ServerApi('1'),
    tlsCAFile=certifi.where(),
    tlsAllowInvalidCertificates=True
)
db = client.get_database("chatbot_cs")
col = db.get_collection("rag_data_knowledge")

async def main():
    doc = await col.find_one({}, {"embedding": 0})
    title = doc.get("title", "N/A")
    content = doc.get("content", "")
    print(f"Title: {title}")
    print(f"Content length: {len(content)} chars")
    print(f"Estimated tokens: ~{len(content)//4}")
    print(f"First 300 chars:\n{content[:300]}")

asyncio.run(main())
