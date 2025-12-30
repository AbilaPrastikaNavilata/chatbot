import asyncio
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

async def test_smtp():
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_EMAIL = os.getenv("SMTP_EMAIL")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    
    print("="*50)
    print("SMTP Configuration Test")
    print("="*50)
    print(f"SMTP_HOST: {SMTP_HOST}")
    print(f"SMTP_PORT: {SMTP_PORT}")
    print(f"SMTP_EMAIL: {SMTP_EMAIL}")
    print(f"SMTP_PASSWORD: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NOT SET'}")
    print("="*50)
    
    # Test email ke diri sendiri
    to_email = SMTP_EMAIL  # Kirim ke email yang sama untuk test
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"Test <{SMTP_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = "Test Email SMTP - Knowledge Management System"
        
        html_body = "<h1>Test Email</h1><p>Jika Anda menerima email ini, SMTP sudah berfungsi!</p>"
        html_part = MIMEText(html_body, "html")
        message.attach(html_part)
        
        print(f"\nMengirim email test ke: {to_email}")
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_EMAIL,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        
        print("\n✅ EMAIL BERHASIL DIKIRIM!")
        print(f"Cek inbox {to_email}")
        
    except Exception as e:
        print(f"\n❌ GAGAL: {type(e).__name__}")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_smtp())
