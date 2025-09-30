from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import bcrypt
import os
from ibmcloudant.cloudant_v1 import CloudantV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from datetime import datetime
import random
import string
import time

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-2024')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600

CORS(app, supports_credentials=True)

# Temporary in-memory database for demo
temp_users_db = []

# Database Configuration
def get_db_client():
    max_retries = 3
    for attempt in range(max_retries):
        try:
            api_key = os.environ.get("CLOUDANT_APIKEY")
            service_url = os.environ.get("CLOUDANT_URL")
            
            if not api_key or not service_url:
                print("❌ Missing Cloudant environment variables")
                return None
            
            authenticator = IAMAuthenticator(api_key)
            client = CloudantV1(authenticator=authenticator)
            client.set_service_url(service_url)
            
            # Test connection
            client.get_server_information().get_result()
            print("✅ Connected to IBM Cloudant successfully")
            return client
        except Exception as e:
            print(f"❌ Cloudant connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            else:
                print("❌ All connection attempts failed - using temporary database")
                return None

client = None

def ensure_db_exists(db_name):
    global client
    if not client:
        client = get_db_client()
    
    if client:
        try:
            client.get_database_information(db=db_name).get_result()
            print(f"✅ Database '{db_name}' ready")
            return True
        except Exception as e:
            try:
                client.put_database(db=db_name).get_result()
                print(f"✅ Created database '{db_name}'")
                return True
            except Exception as create_error:
                print(f"❌ Failed to create database '{db_name}': {create_error}")
                return False
    return False

# Initialize databases
def initialize_databases():
    global client
    client = get_db_client()
    if client:
        databases = ['users', 'patients', 'predictions']
        for db in databases:
            ensure_db_exists(db)
        print("✅ Database initialization completed")
    else:
        print("⚠️ Database initialization failed - using temporary in-memory storage")

# Initialize on app start
initialize_databases()

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    db_status = "connected" if client else "disconnected (using temp storage)"
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat(),
        'database': db_status,
        'message': 'Application is running - some features may use temporary storage'
    }), 200

@app.route('/api/health', methods=['GET'])
def api_health():
    return health_check()

@app.route('/api/debug')
def debug_info():
    return jsonify({
        'database_connected': client is not None,
        'environment_variables_set': {
            'SECRET_KEY': bool(os.environ.get('SECRET_KEY')),
            'CLOUDANT_APIKEY': bool(os.environ.get('CLOUDANT_APIKEY')),
            'CLOUDANT_URL': bool(os.environ.get('CLOUDANT_URL'))
        },
        'current_config': {
            'secret_key_length': len(app.secret_key) if app.secret_key else 0,
            'cloudant_configured': client is not None,
            'temp_users_count': len(temp_users_db)
        },
        'message': 'Using temporary in-memory storage for demo purposes'
    })

@app.route('/api/register', methods=['POST'])
def register():
    # Try Cloudant first, fallback to temporary storage
    if client:
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            print(f"📝 Registration attempt for role: {data.get('role', 'unknown')}")
            
            username = data.get('username')
            password = data.get('password')
            role = data.get('role')
            
            if not all([username, password, role]):
                return jsonify({'success': False, 'error': 'Missing required fields'}), 400
            
            # Check if username exists
            selector = {'username': username}
            existing = client.post_find(db='users', selector=selector).get_result()
            if existing.get('docs'):
                return jsonify({'success': False, 'error': 'Username already exists'}), 400
            
            # Hash password
            hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user_doc = {
                'type': 'user',
                'username': username,
                'password': hashed_pw,
                'role': role,
                'status': 'active',
                'created_at': datetime.now().isoformat()
            }
            
            # Add role-specific data
            if role == 'asha':
                user_doc.update({
                    'full_name': data.get('name'),
                    'phone': data.get('mobile'),
                    'email': data.get('email'),
                    'asha_id': data.get('ashaId'),
                    'district': data.get('district'),
                    'date_of_birth': data.get('dateOfBirth')
                })
            elif role == 'volunteer':
                user_doc.update({
                    'full_name': data.get('name'),
                    'phone': data.get('mobile'),
                    'email': data.get('email'),
                    'emergency_contact_name': data.get('emergencyName'),
                    'emergency_contact_number': data.get('emergencyNumber'),
                    'address': data.get('address'),
                    'city': data.get('city'),
                    'state': data.get('state'),
                    'pincode': data.get('pincode'),
                    'aadhaar': data.get('aadhaar'),
                    'skills': data.get('skills'),
                    'availability': data.get('availability'),
                    'date_of_birth': data.get('dateOfBirth')
                })
            elif role == 'admin':
                user_doc.update({
                    'full_name': data.get('name'),
                    'employee_id': data.get('employeeId'),
                    'job_role': data.get('role'),
                    'department': data.get('department'),
                    'work_email': data.get('workEmail'),
                    'work_phone': data.get('workPhone')
                })
            elif role == 'hospital':
                user_doc.update({
                    'hospital_name': data.get('hospitalName'),
                    'contact_person': data.get('contactPerson'),
                    'phone': data.get('phone'),
                    'email': data.get('email'),
                    'address': data.get('address')
                })
            
            result = client.post_document(db='users', document=user_doc).get_result()
            
            return jsonify({
                'success': True,
                'message': 'Registration successful!',
                'user_id': result['id']
            }), 201
            
        except Exception as e:
            print(f"❌ Cloudant registration error: {e}")
            # Fall through to temporary storage
    
    # Fallback: Temporary in-memory storage
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        
        if not all([username, password, role]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Check if username exists in temp storage
        if any(user['username'] == username for user in temp_users_db):
            return jsonify({'success': False, 'error': 'Username already exists'}), 400
        
        # Hash password
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user_data = {
            'id': len(temp_users_db) + 1,
            'username': username,
            'password': hashed_pw,
            'role': role,
            'status': 'active',
            'created_at': datetime.now().isoformat(),
            'full_name': data.get('name', ''),
            'email': data.get('email', ''),
            'phone': data.get('mobile', '')
        }
        
        temp_users_db.append(user_data)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful! (Temporary storage)',
            'user_id': user_data['id'],
            'note': 'Data stored in temporary memory for demo'
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'success': False, 'error': 'Registration failed. Please try again.'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400
    
    # Try Cloudant first
    if client:
        try:
            selector = {'username': username}
            result = client.post_find(db='users', selector=selector).get_result()
            users = result.get('docs', [])
            
            if users:
                user = users[0]
                if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                    user_data = {k: v for k, v in user.items() if k != 'password'}
                    session.permanent = True
                    session['user_id'] = user['_id']
                    session['username'] = user['username']
                    session['role'] = user['role']
                    
                    return jsonify({
                        'success': True,
                        'message': 'Login successful!',
                        'user': user_data
                    }), 200
        except Exception as e:
            print(f"❌ Cloudant login error: {e}")
            # Fall through to temporary storage
    
    # Fallback: Check temporary storage
    user = next((u for u in temp_users_db if u['username'] == username), None)
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        user_data = {k: v for k, v in user.items() if k != 'password'}
        session.permanent = True
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        
        return jsonify({
            'success': True,
            'message': 'Login successful! (Temporary storage)',
            'user': user_data,
            'note': 'Using temporary demo storage'
        }), 200
    
    return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True, 
            'role': session.get('role'),
            'username': session.get('username')
        }), 200
    return jsonify({'authenticated': False}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory('.', path)
    except Exception as e:
        print(f"Static file error: {e}")
        return jsonify({'error': 'File not found'}), 404

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# This part is important for Gunicorn
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
