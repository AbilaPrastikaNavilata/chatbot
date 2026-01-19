# 📚 SinBot Chatbot - Knowledge Management System

**SinBot** adalah chatbot berbasis **RAG (Retrieval-Augmented Generation)** untuk PT. Sintesa Inti Nusa (distributor obat). Chatbot ini dirancang untuk menjawab pertanyaan berdasarkan basis pengetahuan (knowledge base) yang dikelola oleh admin.

## 🎯 Fitur Utama

- **Chatbot AI Pintar**: Menjawab pertanyaan secara relevan menggunakan model LLaMA 3.3.
- **RAG (Retrieval-Augmented Generation)**: Chatbot hanya menjawab berdasarkan data yang diunggah, meminimalkan "halusinasi" AI.
- **Manajemen Pengetahuan**: Upload file PDF atau TXT untuk menambah wawasan chatbot.
- **Integrasi WhatsApp**: Bisa diakses langsung melalui WhatsApp (via WAHA & n8n).
- **Dashboard Admin**: Kelola user, knowledge, dan pantau history chat.

---

## 🏗️ Arsitektur Sistem

Chatbot ini terdiri dari tiga komponen utama:
1.  **Frontend (React + Vite)**: Antarmuka web untuk admin dan user chat.
2.  **Backend (FastAPI + Python)**: Otak sistem yang memproses teks, membuat embedding, dan berkomunikasi dengan AI.
3.  **Database (MongoDB)**: Tempat menyimpan data user dan basis pengetahuan beserta vektornya.

---

## 🧠 Proses Embedding (Cara Kerja Chatbot)

**Embedding** adalah proses mengubah teks manusia menjadi kumpulan angka (vektor). Ini dilakukan agar komputer bisa "memahami" kemiripan makna antara pertanyaan user dan dokumen yang ada.

### Di mana kodenya?
Semua logika ini ada di file `backend/app.py`:

- **Inisialisasi Model** (Baris ~92): `model = SentenceTransformer('all-MiniLM-L6-v2')`
- **Membuat Vektor** (Baris ~155): Fungsi `generate_embedding(text)`
- **Menyimpan Data** (Baris ~160): Fungsi `add_knowledge` (teks diubah jadi angka lalu simpan ke MongoDB)
- **Mencari Jawaban** (Baris ~173): Fungsi `search_similar_documents` (pertanyaan user diubah jadi angka, lalu dicari yang paling mirip di database)

---

## 🚀 Cara Menjalankan Project (Lokal)

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # atau venv\Scripts\activate di Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 7860
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment ke VPS

Dokumentasi lengkap mengenai arsitektur, integrasi WhatsApp, dan cara deployment ke VPS dapat dilihat di file panduan berikut:
- [Panduan Presentasi Lengkap](walkthrough.md.resolved)

---

## 🛡️ Lisensi
Project ini dikembangkan untuk keperluan Skripsi.
SinBot © 2026.
