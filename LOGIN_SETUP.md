# Setup Login System

## Fitur yang Ditambahkan

### Frontend
1. **Login Page** - Halaman login dengan username & password
2. **Register Page** - Halaman pendaftaran akun baru
3. **Forgot Password Page** - Halaman untuk reset password
4. **Auth Context** - Context untuk manajemen autentikasi
5. **Dashboard** - Halaman utama setelah login (dari App.tsx yang lama)

### Backend
1. **POST /register** - Endpoint untuk registrasi user baru
2. **POST /login** - Endpoint untuk login
3. **POST /forgot-password** - Endpoint untuk lupa password

## Cara Menggunakan

### 1. Jalankan Backend
```bash
cd backend
python app.py
```

### 2. Jalankan Frontend
```bash
cd frontend
npm run dev
```

### 3. Akses Aplikasi
- Buka browser dan akses `http://localhost:5173`
- Anda akan melihat halaman login
- Klik "Daftar akun baru" untuk membuat akun
- Setelah registrasi, login dengan username dan password
- Jika berhasil, akan masuk ke dashboard (halaman utama)

## Fitur Login

### Halaman Login
- Input username dan password
- Toggle show/hide password
- Link "Lupa password?"
- Link "Daftar akun baru"
- Pesan error jika login gagal

### Halaman Register
- Input username, email, password, dan konfirmasi password
- Validasi password minimal 6 karakter
- Validasi password harus cocok
- Cek username dan email duplikat
- Redirect otomatis ke login setelah berhasil

### Halaman Forgot Password
- Input email untuk reset password
- Simulasi pengiriman email (belum implementasi email sebenarnya)

### Dashboard
- Menampilkan nama user yang login
- Tombol logout di pojok kanan atas
- Semua fitur knowledge management seperti sebelumnya

## Keamanan
- Password di-hash menggunakan SHA-256 sebelum disimpan
- Session disimpan di localStorage browser
- User harus login untuk mengakses dashboard

## Database
Data user disimpan di MongoDB collection `users` dengan struktur:
```json
{
  "username": "string",
  "email": "string",
  "password": "hashed_password"
}
```
