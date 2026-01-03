#!/usr/bin/env python3
"""
Test script untuk memverifikasi Groq API key
Jalankan di VPS: python3 test_groq.py
"""
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

print("=" * 50)
print("GROQ API KEY TEST")
print("=" * 50)

if not GROQ_API_KEY:
    print("❌ ERROR: GROQ_API_KEY tidak ditemukan di environment!")
    print("Pastikan .env file ada dan berisi GROQ_API_KEY=gsk_...")
    exit(1)

# Show partial key for verification
print(f"✓ API Key ditemukan: {GROQ_API_KEY[:15]}...{GROQ_API_KEY[-10:]}")
print(f"  Panjang key: {len(GROQ_API_KEY)} karakter")

# Test API
print("\n📡 Testing Groq API...")
try:
    from groq import Groq
    
    client = Groq(api_key=GROQ_API_KEY)
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Say 'API key works!' in exactly 3 words"}],
        max_tokens=20
    )
    
    print("✅ SUCCESS! Groq API berfungsi!")
    print(f"   Response: {response.choices[0].message.content}")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}")
    print(f"   Detail: {str(e)}")
    
    if "leaked" in str(e).lower():
        print("\n⚠️  API key terdeteksi sebagai 'leaked' oleh Groq.")
        print("   Solusi:")
        print("   1. Buat API key BARU di https://console.groq.com/keys")
        print("   2. Update .env dengan key baru")
        print("   3. Jalankan test ini lagi")
