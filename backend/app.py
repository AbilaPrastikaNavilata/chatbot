# =============================================================================
# 📌 SINBOT - RAG CHATBOT BACKEND
# =============================================================================
# File ini adalah file utama backend untuk SinBot Chatbot.
# Menggunakan FastAPI sebagai web framework dan Groq (LLaMA 3.3) untuk AI.
# 
# TEKNOLOGI YANG DIGUNAKAN:
# - FastAPI: Framework web Python untuk membuat REST API
# - MongoDB: Database NoSQL untuk menyimpan knowledge dan user
# - Sentence Transformers: Model AI untuk membuat embedding teks
# - Groq: API untuk mengakses model LLaMA 3.3 (chatbot AI)
# - SMTP: Untuk mengirim email (reset password)
# =============================================================================

# =============================================================================
# BAGIAN 1: IMPORT LIBRARY
# =============================================================================
# Import semua library yang dibutuhkan oleh aplikasi
from fastapi import FastAPI, HTTPException, File, UploadFile
import hashlib
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets

import PyPDF2
from pathlib import Path
import io
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json

from groq import Groq
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
import motor.motor_asyncio
from dotenv import load_dotenv
import numpy as np
from sentence_transformers import SentenceTransformer
import uvicorn
import io
import asyncio

# =============================================================================
# BAGIAN 2: KONFIGURASI APLIKASI
# =============================================================================
# Memuat environment variables dari file .env
load_dotenv()

# Inisialisasi aplikasi FastAPI dengan judul "RAG Chatbot API"
app = FastAPI(title="RAG Chatbot API")

# CORS Middleware - Mengizinkan frontend mengakses backend dari domain berbeda
# allow_origins=["*"] artinya semua domain diizinkan (untuk development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Di production, ganti dengan domain spesifik
    allow_credentials=True,
    allow_methods=["*"],  # Izinkan semua method (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Izinkan semua header
)

# =============================================================================
# BAGIAN 3: KONEKSI DATABASE MONGODB
# =============================================================================
# Mengambil URI MongoDB dari environment variable
# URI ini berisi alamat server, username, dan password database
MONGODB_URI = os.getenv("MONGODB_URI")

# Try multiple SSL configurations
import ssl

try:
    import certifi
    # First try with certifi
    client = motor.motor_asyncio.AsyncIOMotorClient(
        MONGODB_URI, 
        server_api=ServerApi('1'),
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True
    )
except:
    try:
        # Fallback: Create custom SSL context with no verification
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URI,
            server_api=ServerApi('1'),
            tls=True,
            tlsAllowInvalidCertificates=True,
            tlsAllowInvalidHostnames=True
        )
    except:
        # Last resort: simple connection
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI, server_api=ServerApi('1'))

db = client.get_database("chatbot_cs")
knowledge_collection = db.get_collection("rag_data_knowledge")
users_collection = db.get_collection("users")
conversations_collection = db.get_collection("whatsapp_conversations")

# =============================================================================
# BAGIAN 4: INISIALISASI MODEL AI
# =============================================================================
# Model embedding untuk mengubah teks menjadi vektor angka
# all-MiniLM-L6-v2 adalah model yang ringan tapi akurat
model = SentenceTransformer('all-MiniLM-L6-v2')

# Inisialisasi Groq Client untuk mengakses LLaMA 3.3
# GROQ_API_KEY diambil dari file .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_SENDER_NAME = os.getenv("SMTP_SENDER_NAME", "Knowledge Management System")

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# =============================================================================
# BAGIAN 5: PYDANTIC MODELS (STRUKTUR DATA)
# =============================================================================
# Pydantic digunakan untuk validasi data yang masuk ke API
# Setiap class mendefinisikan struktur data yang diharapkan
# Pydantic models
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict[str, Any]]] = []

class KnowledgeItem(BaseModel):
    title: str
    content: str
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class UpdateKnowledgeItem(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class WhatsAppChatRequest(BaseModel):
    phone_number: str  # Format: 628xxx@c.us
    message: str
    message_id: Optional[str] = None

class WhatsAppChatResponse(BaseModel):
    response: str
    phone_number: str
    sources: Optional[List[Dict[str, Any]]] = []

# =============================================================================
# BAGIAN 6: HELPER FUNCTIONS (FUNGSI PEMBANTU)
# =============================================================================

# Fungsi untuk menghasilkan embedding (vektor) dari teks
# Embedding digunakan untuk mencari dokumen yang mirip
async def generate_embedding(text: str):
    """Generate embedding untuk teks menggunakan SentenceTransformer"""
    embedding = model.encode(text)
    return embedding.tolist()
# Fungsi untuk menambah knowledge ke database
# Otomatis membuat embedding dari konten sebelum disimpan
async def add_knowledge(knowledge: KnowledgeItem):
    """Tambah knowledge ke database beserta embedding-nya"""
    embedding = await generate_embedding(knowledge.content)
    document = {
        "title": knowledge.title,
        "content": knowledge.content,
        "source": knowledge.source,
        "metadata": knowledge.metadata,
        "embedding": embedding
    }
    result = await knowledge_collection.insert_one(document)
    return result.inserted_id
# Fungsi untuk mencari dokumen yang mirip dengan query
# Menggunakan cosine similarity untuk mengukur kemiripan
async def search_similar_documents(query: str, limit: int = 5):
    """Cari dokumen yang mirip berdasarkan cosine similarity"""
    query_embedding = await generate_embedding(query)
    
    # Fetch all documents (consider pagination for large collections)
    documents = []
    async for doc in knowledge_collection.find({}): 
        documents.append(doc)
    
    # Calculate cosine similarity for each document
    results_with_scores = []
    for doc in documents:
        # Skip documents without embeddings
        if "embedding" not in doc or not doc["embedding"]:
            continue
            
        # Calculate cosine similarity
        doc_embedding = doc["embedding"]
        similarity = cosine_similarity(query_embedding, doc_embedding)
        
        # Add document with similarity score
        doc_with_score = {
            "_id": doc["_id"],
            "title": doc["title"],
            "content": doc["content"],
            "source": doc.get("source"),
            "metadata": doc.get("metadata", {}),
            "score": similarity
        }
        results_with_scores.append(doc_with_score)
    
    # Sort by similarity score (highest first) and limit results
    results_with_scores.sort(key=lambda x: x["score"], reverse=True)
    top_results = results_with_scores[:limit]
    
    return top_results
# Fungsi untuk menghitung cosine similarity antara 2 vektor
# Nilai 1 = sangat mirip, 0 = tidak mirip sama sekali
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

# =============================================================================
# BAGIAN 7: FUNGSI RAG (RETRIEVAL-AUGMENTED GENERATION)
# =============================================================================
# Ini adalah fungsi utama chatbot!
# Langkah-langkah:
# 1. Cari dokumen yang relevan dengan pertanyaan user
# 2. Gabungkan dokumen relevan sebagai konteks
# 3. Kirim ke Groq/LLaMA untuk menghasilkan jawaban
async def process_chat(message: str, history: List[Dict[str, str]]):
    """Proses chat dengan pendekatan RAG menggunakan Groq"""
    # Search for relevant context
    relevant_docs = await search_similar_documents(message)
    
    # Format context for the model
    context = "\n\n".join([f"Title: {doc['title']}\nContent: {doc['content']}" for doc in relevant_docs])
    
    # Format conversation history for Groq (OpenAI format)
    messages = []
    
    # System message
    system_prompt = f"""Kamu adalah SinBot, asisten virtual yang ramah dan helpful dari PT. Sintesa Inti Nusa, perusahaan distributor obat.

SAPAAN:
- Selalu awali dengan sapaan ramah: "Halo! 👋 Saya SinBot, asisten virtual dari PT. Sintesa Inti Nusa yang siap membantu menjawab pertanyaan kamu. Ada yang bisa SinBot bantu hari ini?"

ATURAN PENTING:
1. Kamu HANYA boleh menjawab berdasarkan informasi yang ada di "Konteks Knowledge Base" di bawah ini.
2. Jika pertanyaan user TIDAK ADA atau TIDAK RELEVAN dengan konteks knowledge base, jawab dengan ramah:
   "Mohon maaf, pertanyaan ini di luar konteks yang bisa SinBot bantu. Silakan hubungi tim customer service kami untuk bantuan lebih lanjut, atau ajukan pertanyaan lain yang berkaitan dengan layanan kami 😊"
3. JANGAN pernah menjawab menggunakan pengetahuan umum di luar knowledge base.
4. JANGAN mengarang atau berasumsi informasi yang tidak ada di konteks.

GAYA KOMUNIKASI:
- Ramah, sopan, dan hangat seperti teman yang membantu
- Gunakan bahasa yang natural dan tidak kaku
- Boleh menggunakan emoji secukupnya untuk kesan friendly
- Jawab dengan ringkas tapi informatif
- Gunakan bahasa Indonesia, kecuali user bertanya dalam bahasa Inggris maka jawab dalam bahasa Inggris

Konteks Knowledge Base:
{context}

INFORMASI PEMESANAN:
- Jika user ingin memesan atau tertarik untuk order, arahkan untuk menghubungi nomor: 0877700292014
- Contoh: "Untuk pemesanan, silakan hubungi kami di nomor 0877700292014 ya! Tim kami siap membantu 😊"

Ingat: Jika tidak ada informasi yang relevan di konteks di atas, tolak dengan sopan dan arahkan ke customer service."""
    
    messages.append({"role": "system", "content": system_prompt})
    
    # Add conversation history
    for entry in history:
        if 'user' in entry and entry['user']:
            messages.append({"role": "user", "content": entry['user']})
        if 'assistant' in entry and entry['assistant']:
            messages.append({"role": "assistant", "content": entry['assistant']})
    
    # Add current message
    messages.append({"role": "user", "content": message})
    
    # Call Groq API
    response = await asyncio.to_thread(
        lambda: groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
    )
    
    return {
        "response": response.choices[0].message.content,
        "sources": [{
            "_id": str(doc["_id"]),
            "title": doc["title"], 
            "content": doc["content"], 
            "source": doc["source"],
            "similarity_score": round(doc["score"], 4)
        } for doc in relevant_docs]
    }
# Fungsi untuk hash password menggunakan SHA-256
# Password TIDAK disimpan dalam bentuk plain text untuk keamanan
def hash_password(password: str) -> str:
    """Hash password menggunakan algoritma SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

# Helper function untuk generate reset token
def generate_reset_token() -> str:
    """Generate random token untuk reset password"""
    return secrets.token_urlsafe(32)

# Helper function untuk kirim email
async def send_email(to_email: str, subject: str, body: str):
    """Kirim email menggunakan SMTP"""
    try:
        print(f"[SMTP DEBUG] Attempting to send email to: {to_email}")
        print(f"[SMTP DEBUG] Using SMTP_HOST: {SMTP_HOST}, PORT: {SMTP_PORT}")
        print(f"[SMTP DEBUG] From email: {SMTP_EMAIL}")
        
        # Buat pesan email
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_SENDER_NAME} <{SMTP_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Tambahkan body HTML
        html_part = MIMEText(body, "html")
        message.attach(html_part)
        
        # Kirim email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_EMAIL,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        print(f"[SMTP DEBUG] Email sent successfully!")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
# =============================================================================
# BAGIAN 8: ENDPOINT AUTENTIKASI
# =============================================================================

# Endpoint untuk registrasi user baru
@app.post("/register")
async def register_user(user: UserRegister):
    """Register user baru"""
    try:
        # Cek apakah username sudah ada
        existing_user = await users_collection.find_one({"username": user.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username sudah digunakan")
        
        # Cek apakah email sudah ada
        existing_email = await users_collection.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email sudah terdaftar")
        
        # Hash password
        hashed_password = hash_password(user.password)
        
        # Simpan user ke database
        user_doc = {
            "username": user.username,
            "email": user.email,
            "password": hashed_password
        }
        
        result = await users_collection.insert_one(user_doc)
        
        return {
            "message": "Registrasi berhasil",
            "username": user.username
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# Endpoint untuk login user
@app.post("/login")
async def login_user(user: UserLogin):
    """Login user"""
    try:
        # Hash password yang diinput
        hashed_password = hash_password(user.password)
        
        # Cari user di database
        user_doc = await users_collection.find_one({
            "username": user.username,
            "password": hashed_password
        })
        
        if not user_doc:
            raise HTTPException(status_code=401, detail="Username atau password salah")
        
        return {
            "message": "Login berhasil",
            "username": user_doc["username"],
            "email": user_doc.get("email")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Endpoint untuk lupa password - kirim email reset password"""
    try:
        # Cek apakah email ada di database
        user = await users_collection.find_one({"email": request.email})
        
        if not user:
            raise HTTPException(status_code=404, detail="Email tidak ditemukan")
        
        # Generate reset token
        reset_token = generate_reset_token()
        
        # Simpan token ke database dengan expiry time (1 jam)
        from datetime import datetime, timedelta
        expiry_time = datetime.utcnow() + timedelta(hours=1)
        
        await users_collection.update_one(
            {"email": request.email},
            {
                "$set": {
                    "reset_token": reset_token,
                    "reset_token_expiry": expiry_time
                }
            }
        )
        
        # Buat link reset password (sesuaikan dengan URL frontend Anda)
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        # Buat email body
        email_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Password</h1>
                </div>
                <div class="content">
                    <p>Halo,</p>
                    <p>Kami menerima permintaan untuk reset password akun Anda di <strong>Knowledge Management System</strong>.</p>
                    <p>Klik tombol di bawah ini untuk reset password Anda:</p>
                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </p>
                    <p>Atau copy dan paste link berikut ke browser Anda:</p>
                    <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 3px;">
                        {reset_link}
                    </p>
                    <p><strong>Link ini akan kadaluarsa dalam 1 jam.</strong></p>
                    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                    <p>Terima kasih,<br>Tim Knowledge Management System</p>
                </div>
                <div class="footer">
                    <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Kirim email
        email_sent = await send_email(
            to_email=request.email,
            subject="Reset Password - Knowledge Management System",
            body=email_body
        )
        
        if not email_sent:
            raise HTTPException(status_code=500, detail="Gagal mengirim email. Silakan coba lagi.")
        
        return {
            "message": "Link reset password telah dikirim ke email Anda",
            "email": request.email
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password menggunakan token dari email"""
    try:
        from datetime import datetime
        
        # Cari user dengan token yang valid
        user = await users_collection.find_one({
            "reset_token": request.token,
            "reset_token_expiry": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(status_code=400, detail="Token tidak valid atau sudah kadaluarsa")
        
        # Hash password baru
        hashed_password = hash_password(request.new_password)
        
        # Update password dan hapus token
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hashed_password},
                "$unset": {"reset_token": "", "reset_token_expiry": ""}
            }
        )
        
        return {"message": "Password berhasil direset. Silakan login dengan password baru."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verifikasi apakah reset token masih valid"""
    try:
        from datetime import datetime
        
        user = await users_collection.find_one({
            "reset_token": token,
            "reset_token_expiry": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(status_code=400, detail="Token tidak valid atau sudah kadaluarsa")
        
        return {"valid": True, "email": user.get("email")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# =============================================================================
# BAGIAN 9: ENDPOINT CHAT
# =============================================================================

# Endpoint utama untuk chat dari frontend web
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint for frontend integration"""
    try:
        result = await process_chat(request.message, request.history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# Endpoint khusus untuk WhatsApp (dipanggil oleh n8n)
# Menyimpan history percakapan per nomor telepon
@app.post("/whatsapp-chat", response_model=WhatsAppChatResponse)
async def whatsapp_chat_endpoint(request: WhatsAppChatRequest):
    """WhatsApp chat endpoint with conversation history"""
    try:
        phone_number = request.phone_number
        
        # Get conversation history for this phone number
        conversation = await conversations_collection.find_one({"phone_number": phone_number})
        
        if conversation:
            history = conversation.get("messages", [])[-10:]  # Keep last 10 messages for context
        else:
            history = []
        
        # Format history for process_chat
        formatted_history = []
        for msg in history:
            formatted_history.append({
                "user": msg.get("user", ""),
                "assistant": msg.get("assistant", "")
            })
        
        # Process chat with RAG
        result = await process_chat(request.message, formatted_history)
        ai_response = result["response"]
        
        # Save new message to conversation history
        new_message = {
            "user": request.message,
            "assistant": ai_response,
            "timestamp": asyncio.get_event_loop().time(),
            "message_id": request.message_id
        }
        
        if conversation:
            # Update existing conversation
            await conversations_collection.update_one(
                {"phone_number": phone_number},
                {"$push": {"messages": new_message}}
            )
        else:
            # Create new conversation
            await conversations_collection.insert_one({
                "phone_number": phone_number,
                "messages": [new_message],
                "created_at": asyncio.get_event_loop().time()
            })
        
        return WhatsAppChatResponse(
            response=ai_response,
            phone_number=phone_number,
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# =============================================================================
# BAGIAN 10: ENDPOINT KNOWLEDGE MANAGEMENT
# =============================================================================

# Model untuk pagination
class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 15
    sort_order: str = "newest"  # newest or oldest

class PaginatedResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool

@app.get("/knowledge", response_model=PaginatedResponse)
async def list_knowledge(
    page: int = 1,
    limit: int = 15,
    sort_order: str = "newest"
):
    """List knowledge items with pagination"""
    # Validate parameters
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:  # Max 100 items per page
        limit = 15
    
    # Calculate skip value
    skip = (page - 1) * limit
    
    # Determine sort direction
    sort_direction = -1 if sort_order == "newest" else 1
    
    # Get total count
    total = await knowledge_collection.count_documents({})
    
    # Get paginated items
    items = []
    cursor = knowledge_collection.find(
        {}, 
        {"embedding": 0}
    ).sort("_id", sort_direction).skip(skip).limit(limit)
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit  # Ceiling division
    has_next = page < total_pages
    has_prev = page > 1
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )

# Keep the old endpoint for backward compatibility (optional)
@app.get("/knowledge/all", response_model=List[Dict[str, Any]])
async def list_all_knowledge():
    """List all knowledge items (for backward compatibility)"""
    items = []
    async for doc in knowledge_collection.find({}, {"embedding": 0}):
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items

@app.post("/add-knowledge")
async def create_knowledge(knowledge: KnowledgeItem):
    """Add a new knowledge item"""
    result = await add_knowledge(knowledge)
    return {"id": str(result), "message": "Knowledge added successfully"}

@app.get("/knowledge/{knowledge_id}")
async def get_knowledge_by_id(knowledge_id: str):
    """Get a specific knowledge item by ID"""
    try:
        doc = await knowledge_collection.find_one({"_id": ObjectId(knowledge_id)}, {"embedding": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Knowledge not found")
        
        doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID format: {str(e)}")

@app.put("/knowledge/{knowledge_id}")
async def update_knowledge(knowledge_id: str, knowledge: UpdateKnowledgeItem):
    """Update a knowledge item"""
    try:
        # Prepare update data
        update_data = {}
        if knowledge.title is not None:
            update_data["title"] = knowledge.title
        if knowledge.content is not None:
            update_data["content"] = knowledge.content
            # Regenerate embedding if content is updated
            update_data["embedding"] = await generate_embedding(knowledge.content)
        if knowledge.source is not None:
            update_data["source"] = knowledge.source
        if knowledge.metadata is not None:
            update_data["metadata"] = knowledge.metadata
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = await knowledge_collection.update_one(
            {"_id": ObjectId(knowledge_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Knowledge not found")
        
        return {"message": "Knowledge updated successfully"}
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/knowledge/{knowledge_id}")
async def delete_knowledge(knowledge_id: str):
    """Delete a knowledge item"""
    try:
        result = await knowledge_collection.delete_one({"_id": ObjectId(knowledge_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Knowledge not found")
        
        return {"message": "Knowledge deleted successfully"}
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/knowledge")
async def delete_all_knowledge():
    """Delete all knowledge items"""
    try:
        result = await knowledge_collection.delete_many({})
        return {
            "message": f"All knowledge deleted successfully. {result.deleted_count} items removed.",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions untuk file processing
async def extract_text_from_pdf(file_content: bytes) -> tuple[str, str]:
    """Extract text from PDF and get title if available"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        # Try to get title from metadata
        title = None
        if pdf_reader.metadata:
            title = pdf_reader.metadata.get('/Title')
        
        return text.strip(), title
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

# =============================================================================
# BAGIAN 11: ENDPOINT UPLOAD FILE
# =============================================================================
# Endpoint untuk upload file PDF/TXT ke knowledge base

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process various file types (PDF, TXT, XLSX, CSV)"""
    try:
        # Read file content
        file_content = await file.read()
        filename = file.filename
        file_extension = Path(filename).suffix.lower()
        
        results = []
        
        if file_extension == '.pdf':
            # Process PDF
            text, pdf_title = await extract_text_from_pdf(file_content)
            title = pdf_title if pdf_title else Path(filename).stem
            
            knowledge = KnowledgeItem(
                title=title,
                content=text,
                source=filename,
                metadata={
                    "file_type": "pdf",
                    "filename": filename,
                    "has_metadata_title": bool(pdf_title)
                }
            )
            
            result = await add_knowledge(knowledge)
            results.append(str(result))
            
            return {
                "message": "PDF file processed successfully",
                "ids": results,
                "items_created": 1
            }
        
        elif file_extension == '.txt':
            # Process TXT
            text = file_content.decode('utf-8')
            title = Path(filename).stem
            
            knowledge = KnowledgeItem(
                title=title,
                content=text,
                source=filename,
                metadata={
                    "file_type": "txt",
                    "filename": filename
                }
            )
            
            result = await add_knowledge(knowledge)
            results.append(str(result))
            
            return {
                "message": "TXT file processed successfully",
                "ids": results,
                "items_created": 1
            }
        
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_extension}. Supported types: .pdf, .txt"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run the app
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=True)