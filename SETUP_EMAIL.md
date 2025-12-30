# Setup Email untuk Fitur Lupa Password

## Langkah 1: Dapatkan App Password Gmail

### 1. Buka Google Account Security
- Kunjungi: https://myaccount.google.com/security

### 2. Aktifkan 2-Step Verification
- Cari **2-Step Verification** atau **Verifikasi 2 Langkah**
- Klik dan ikuti petunjuk untuk mengaktifkannya
- Anda akan diminta verifikasi dengan nomor HP

### 3. Buat App Password
Setelah 2-Step Verification aktif:
- Kembali ke https://myaccount.google.com/security
- Cari **App passwords** atau **Sandi aplikasi**
- Jika tidak ketemu, search "app password" di search bar
- Klik **App passwords**

### 4. Generate Password
- Pilih app: **Mail**
- Pilih device: **Other (Custom name)**
- Ketik nama: `Knowledge Management System`
- Klik **Generate**
- Google akan tampilkan password 16 karakter seperti: `abcd efgh ijkl mnop`
- **COPY dan SIMPAN** password ini (tanpa spasi)

## Langkah 2: Konfigurasi Backend

### 1. Buka file `backend/.env`

### 2. Isi konfigurasi SMTP:
```env
# SMTP Configuration for Email (Untuk Fitur Lupa Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=emailanda@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_SENDER_NAME=Knowledge Management System
```

**Ganti:**
- `emailanda@gmail.com` → Email Gmail Anda
- `abcdefghijklmnop` → App Password yang sudah di-generate (16 karakter, tanpa spasi)

### 3. Contoh lengkap file .env:
```env
MONGODB_URI=mongodb://localhost:27017/db-chatbot
GOOGLE_API_KEY=AIzaSyBuKx_q0HtNb0JPhgA2Uir9kCpK3jcHUtI

# SMTP Configuration for Email (Untuk Fitur Lupa Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=johndoe@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_SENDER_NAME=Knowledge Management System
```

## Langkah 3: Install Dependencies Baru

Buka terminal di folder `backend` dan jalankan:
```bash
pip install aiosmtplib email-validator
```

Atau install semua dependencies:
```bash
pip install -r requirements.txt
```

## Langkah 4: Restart Backend

```bash
python app.py
```

## Langkah 5: Test Fitur Lupa Password

1. Buka aplikasi di browser
2. Klik **"Lupa password?"**
3. Masukkan email yang terdaftar
4. Cek inbox email Anda
5. Klik link reset password di email
6. (Catatan: Halaman reset password belum dibuat, link akan error dulu)

## Troubleshooting

### Error: "Authentication failed"
- Pastikan App Password sudah benar (16 karakter, tanpa spasi)
- Pastikan 2-Step Verification sudah aktif
- Coba generate App Password baru

### Error: "SMTP connection failed"
- Cek koneksi internet
- Pastikan SMTP_HOST dan SMTP_PORT benar
- Coba restart backend

### Email tidak masuk
- Cek folder Spam/Junk
- Pastikan email penerima benar
- Cek log backend untuk error message

### Error: "Module not found: aiosmtplib"
```bash
pip install aiosmtplib email-validator
```

## Keamanan

⚠️ **PENTING:**
- **JANGAN** commit file `.env` ke Git
- **JANGAN** share App Password ke orang lain
- App Password sama pentingnya dengan password Gmail Anda
- Jika App Password bocor, hapus dan generate yang baru

## Fitur Email yang Sudah Dibuat

✅ Kirim email reset password dengan link
✅ Link berlaku 1 jam
✅ Email template HTML yang bagus
✅ Token reset password disimpan di database

## Yang Belum Dibuat (Opsional)

❌ Halaman reset password di frontend (link akan error)
❌ Endpoint untuk verify token dan update password

Apakah Anda ingin saya buatkan halaman reset password juga?
