import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
print(f"MONGODB_URI: {MONGODB_URI[:50]}..." if MONGODB_URI else "MONGODB_URI not set!")

if not MONGODB_URI:
    print("ERROR: MONGODB_URI is not set in .env file")
    exit(1)

try:
    print("\nConnecting to MongoDB...")
    client = MongoClient(MONGODB_URI, server_api=ServerApi('1'))
    
    # Test connection
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB!")
    
    # List databases
    print("\nDatabases available:")
    for db_name in client.list_database_names():
        print(f"  - {db_name}")
    
    # Check users collection
    db = client.get_database("chatbot_cs")
    users = db.get_collection("users")
    user_count = users.count_documents({})
    print(f"\nUsers in database: {user_count}")
    
    if user_count > 0:
        print("\nExisting users:")
        for user in users.find({}, {"username": 1, "email": 1, "_id": 0}):
            print(f"  - {user}")
    else:
        print("\n⚠️ No users found. You need to REGISTER first before login!")
        
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
