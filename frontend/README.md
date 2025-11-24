# Knowledge Management System - Frontend

Sebuah aplikasi web modern untuk mengelola dan mengorganisir knowledge base aplikasi RAG tim Anda dengan fitur chat AI yang terintegrasi.

## 🚀 Fitur Utama

### 📚 Knowledge Management
- **View Knowledge**: Melihat dan mengelola semua knowledge dalam database
- **Add Knowledge**: Menambahkan knowledge baru secara manual
- **Upload File**: Upload file (PDF, TXT, CSV, Excel) untuk dikonversi menjadi knowledge base
- **Edit & Delete**: Mengedit dan menghapus knowledge yang sudah ada
- **Bulk Operations**: Operasi massal untuk mengelola multiple knowledge sekaligus

### 🤖 AI Chat
- **Intelligent Chat**: Chat dengan AI yang dapat mengakses knowledge base
- **Source References**: Melihat sumber knowledge yang digunakan AI dalam menjawab
- **Chat History**: Riwayat percakapan tersimpan di localStorage
- **Real-time Typing**: Indikator typing saat AI sedang memproses

### 🎨 User Interface
- **Modern Design**: UI yang clean dan modern menggunakan Tailwind CSS
- **Responsive**: Tampilan yang responsif untuk berbagai ukuran layar

## 🛠️ Tech Stack

### Core Technologies
- **React 19** - Library JavaScript untuk membangun UI
- **TypeScript** - Superset JavaScript dengan type safety
- **Vite** - Build tool yang cepat dan modern
- **Tailwind CSS 4** - Framework CSS utility-first

### UI Components
- **Radix UI** - Komponen UI primitif yang accessible
- **Lucide React** - Icon library yang modern
- **React Markdown** - Rendering markdown content
- **KaTeX** - Rendering mathematical expressions

### State Management
- **React Hooks** - useState, useEffect untuk state management
- **LocalStorage** - Penyimpanan chat history di browser

## 📁 Struktur Proyek

```
src/
├── components/           # Komponen React
│   ├── ui/              # Komponen UI dasar (Button, Card, dll)
│   ├── AddKnowledge.tsx # Form tambah knowledge
│   ├── Chat.tsx         # Komponen chat AI
│   ├── FileUpload.tsx   # Upload file component
│   ├── KnowledgeList.tsx # Daftar knowledge
│   ├── KnowledgeModal.tsx # Modal detail knowledge
│   └── SourceModal.tsx  # Modal sumber referensi
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions
├── assets/              # Static assets
├── App.tsx              # Main application component
└── main.tsx            # Entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js (versi 18 atau lebih baru)
- npm atau yarn

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd chatbot_cs/contoh
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Buka http://localhost:5173 di browser Anda

### Build untuk Production

```bash
# Build aplikasi
npm run build

# Preview build hasil
npm run preview
```

## 📋 Available Scripts

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run lint` - Menjalankan ESLint untuk code quality
- `npm run preview` - Preview hasil build

## 🔧 Konfigurasi

### Environment Variables
```
VITE_BACKEND_BASE_URL=http://localhost:7860
```

### API Integration
Frontend berkomunikasi dengan backend RAG API yang berjalan di:
- Development: `http://localhost:7860` ([FastAPI Backend](https://github.com/arifian853/rag-template-fastapi))
- Production: Sesuaikan dengan deployment backend
