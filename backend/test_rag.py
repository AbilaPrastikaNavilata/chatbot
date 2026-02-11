
import os
import asyncio
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import motor.motor_asyncio
from pymongo.server_api import ServerApi
import certifi

# Load environment variables
load_dotenv()

# Setup similar to app.py
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("❌ MONGODB_URI not found!")
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

async def generate_embedding(text: str):
    """Generate embedding untuk teks menggunakan SentenceTransformer"""
    embedding = model.encode(text)
    return embedding.tolist()

def cosine_similarity(vec1, vec2):
    """Hitung cosine similarity antara dua vektor"""
    # Convert to numpy arrays if they aren't already
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    # Calculate dot product and magnitudes
    dot_product = np.dot(vec1, vec2)
    magnitude1 = np.linalg.norm(vec1)
    magnitude2 = np.linalg.norm(vec2)
    
    # Prevent division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    
    # Calculate cosine similarity
    similarity = dot_product / (magnitude1 * magnitude2)
    return float(similarity)

async def search_similar_documents(query: str, limit: int = 5):
    print(f"Searching for: {query}")
    try:
        query_embedding = await generate_embedding(query)
        print(f"Generated embedding of length: {len(query_embedding)}")
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return []

    # Fetch all documents
    documents = []
    try:
        async for doc in knowledge_collection.find({}): 
            documents.append(doc)
        print(f"Fetched {len(documents)} documents from MongoDB")
    except Exception as e:
        print(f"❌ Error fetching documents: {e}")
        return []
    
    # Calculate cosine similarity
    results_with_scores = []
    for i, doc in enumerate(documents):
        # Skip documents without embeddings
        if "embedding" not in doc or not doc["embedding"]:
            print(f"⚠️ Document {doc.get('_id')} has no embedding. Skipping.")
            continue
            
        # Calculate cosine similarity
        doc_embedding = doc["embedding"]
        try:
            similarity = cosine_similarity(query_embedding, doc_embedding)
            # print(f"Doc {i} similarity: {similarity}") 
        except Exception as e:
            print(f"❌ Error calculating similarity for doc {doc.get('_id')}: {e}")
            continue
        
        # Add document with similarity score
        doc_with_score = {
            "_id": doc["_id"],
            "title": doc["title"],
            "score": similarity
        }
        results_with_scores.append(doc_with_score)
    
    # Sort by similarity score (highest first) and limit results
    results_with_scores.sort(key=lambda x: x["score"], reverse=True)
    top_results = results_with_scores[:limit]
    
    print(f"✅ Found {len(top_results)} similar documents")
    for res in top_results:
        print(f" - {res['title']} ({res['score']:.4f})")
    
    return top_results

async def main():
    await search_similar_documents("ACETYLCYTEINE 200MG SMP")

if __name__ == "__main__":
    asyncio.run(main())
