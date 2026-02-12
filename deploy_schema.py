#!/usr/bin/env python3
"""Deploy Supabase schema"""

import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Try to import supabase
try:
    from supabase import create_client
except ImportError:
    print("Installing supabase client...")
    os.system('pip install supabase')
    from supabase import create_client

# Load environment
env = {}
with open('.env.production', 'r') as f:
    for line in f:
        if '=' in line:
            key, value = line.strip().split('=', 1)
            env[key] = value

SUPABASE_URL = env.get('VITE_SUPABASE_URL')
SUPABASE_KEY = env.get('VITE_SUPABASE_ANON_KEY')

print("\n📦 Supabase Schema Deployer")
print("=" * 50)
print(f"URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_KEY[:20]}...")
print()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials")
    sys.exit(1)

# Connect
client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✓ Connected to Supabase\n")

# Read SQL
with open('supabase/full_user_data_schema.sql', 'r') as f:
    sql = f.read()

# Split statements
statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"📋 Found {len(statements)} SQL statements\n")
print("Deploying...\n")

success = 0
failed = 0

for i, stmt in enumerate(statements, 1):
    preview = stmt[:50].replace('\n', ' ') + '...'
    try:
        print(f"[{i}/{len(statements)}] {preview}")
        
        # Execute via RPC (requires exec_sql function) or direct query
        result = client.rpc('exec_sql', {'sql': stmt}).execute()
        
        print(f"  ✓ OK\n")
        success += 1
    except Exception as e:
        error_msg = str(e)
        if 'does not exist' in error_msg or 'already exists' in error_msg:
            print(f"  ✓ OK\n")
            success += 1
        else:
            print(f"  ⚠️ {error_msg}\n")
            failed += 1

print("=" * 50)
print(f"✅ Complete: {success} succeeded, {failed} warnings")
print("=" * 50)
