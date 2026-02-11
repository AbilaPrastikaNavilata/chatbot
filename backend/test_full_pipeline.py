
import os
import asyncio
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import motor.motor_asyncio
from pymongo.server_api import ServerApi
import certifi
from groq import Groq

# Load environment variables
load_dotenv()

# Setup similar to app.py
MONGODB_URI = os.getenv("MONGODB_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not MONGODB_URI:
    print("❌ MONGODB_URI not found!")
    exit(1)
if not GROQ_API_KEY:
    print("❌ GROQ_API_KEY not found!")
    exit(1)

# Connect to MongoDB
try:
    client = motor.motor_asyncio.AsyncIOMotorClient(
        MONGODB_URI, 
        server_api=ServerApi('1'),
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True
    )
    db = client.get_database("chatbot_cs")
    knowledge_collection = db.get_collection("rag_data_knowledge")
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    exit(1)

# Load Model
print("Loading SentenceTransformer model...")
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Model loaded")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    exit(1)

# Initialize Groq
groq_client = Groq(api_key=GROQ_API_KEY)

async def generate_embedding(text: str):
    """Generate embedding untuk teks menggunakan SentenceTransformer"""
    embedding = model.encode(text)
    return embedding.tolist()

def cosine_similarity(vec1, vec2):
    """Hitung cosine similarity antara dua vektor"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    dot_product = np.dot(vec1, vec2)
    magnitude1 = np.linalg.norm(vec1)
    magnitude2 = np.linalg.norm(vec2)
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    similarity = dot_product / (magnitude1 * magnitude2)
    return float(similarity)

async def search_similar_documents(query: str, limit: int = 3):
    print(f"Searching for: {query}")
    query_embedding = await generate_embedding(query)
    
    documents = []
    async for doc in knowledge_collection.find({}): 
        documents.append(doc)
    
    results_with_scores = []
    for doc in documents:
        if "embedding" not in doc or not doc["embedding"]:
            continue
        doc_embedding = doc["embedding"]
        similarity = cosine_similarity(query_embedding, doc_embedding)
        doc_with_score = {
            "_id": doc["_id"],
            "title": doc["title"],
            "content": doc["content"],
            "source": doc.get("source"),
            "score": similarity
        }
        results_with_scores.append(doc_with_score)
    
    results_with_scores.sort(key=lambda x: x["score"], reverse=True)
    return results_with_scores[:limit]

async def process_chat(message: str, history: list):
    print(f"\nProcessing chat message: {message}")
    
    # 1. Search relevant docs
    try:
        relevant_docs = await search_similar_documents(message)
        print(f"Found {len(relevant_docs)} documents.")
    except Exception as e:
        print(f"❌ Error in RAG search: {e}")
        raise

    # 2. Format Context
    context = "\n\n".join([f"Title: {doc['title']}\nContent: {doc['content']}" for doc in relevant_docs])
    print(f"Context length: {len(context)} chars")

    # 3. Prepare Messages
    messages = []
    system_prompt = f"""Kamu adalah SinBot... (truncated for brevity)
    Konteks Knowledge Base:
    {context}
    """
    messages.append({"role": "system", "content": system_prompt})
    
    for entry in history:
        if 'user' in entry and entry['user']:
            messages.append({"role": "user", "content": entry['user']})
        if 'assistant' in entry and entry['assistant']:
            messages.append({"role": "assistant", "content": entry['assistant']})
    
    messages.append({"role": "user", "content": message})
    
    print(f"Sending request to Groq with {len(messages)} messages...")
    
    # 4. Call Groq
    try:
        response = await asyncio.to_thread(
            lambda: groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )
        )
        print("✅ Groq response received!")
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ Error calling Groq: {e}")
        # Print more details if available
        if hasattr(e, 'response'):
             print(f"Response: {e.response}")
        raise

async def main():
    message = "ACETYLCYTEINE 200MG SMP"
    history = [] # Empty history for now
    
    try:
        response = await process_chat(message, history)
        print("\n--- RESPONSE ---")
        print(response)
    except Exception as e:
        print(f"\n❌ FINAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
