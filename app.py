from flask import Flask, request, jsonify, session, send_from_directory, abort
from flask_cors import CORS
import bcrypt
import os
from ibmcloudant.cloudant_v1 import CloudantV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from datetime import datetime
import time

# -----------------------------
# App Initialization
# -----------------------------
app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-2024')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600

# CORS configuration
CORS(app, supports_credentials=True, origins=["https://waterbornedisease-production.up.railway.app"])

# -----------------------------
# Cloudant Database Client
# -----------------------------
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
            else:
                print("❌ All connection attempts failed")
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
        except:
            try:
                client.put_database(db=db_name).get_result()
                print(f"✅ Created database '{db_name}'")
                return True
            except Exception as e:
                print(f"❌ Failed to create database '{db_name}': {e}")
    return False

def initialize_databases():
    global client
    client = get_db_client()
    if client:
        for db_name in ['users', 'patients', 'predictions']:
            ensure_db_exists(db_name)
        print("✅ Database initialization completed")
    else:
        print("⚠️ Database initialization failed")

initialize_databases()

# -----------------------------
# Utility Functions
# -----------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# -----------------------------
# API Routes
# -----------------------------
@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected' if client else 'disconnected'
    })

@app.route('/api/debug', methods=['GET'])
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
            'cloudant_configured': client is not None
        }
    })

@app.route('/api/register', methods=['POST'])
def register():
    if not client:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    if not all([username, password, role]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    try:
        # Check existing username
        existing = client.post_find(db='users', selector={'username': username}).get_result()
        if existing.get('docs'):
            return jsonify({'success': False, 'error': 'Username already exists'}), 400

        user_doc = {
            'type': 'user',
            'username': username,
            'password': hash_password(password),
            'role': role,
            'status': 'active',
            'created_at': datetime.now().isoformat()
        }

        # Role-specific fields
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
        return jsonify({'success': True, 'message': 'Registration successful', 'user_id': result['id']}), 201
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'success': False, 'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    if not client:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400
    try:
        users = client.post_find(db='users', selector={'username': username}).get_result().get('docs', [])
        if not users:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

        user = users[0]
        if verify_password(password, user['password']):
            session.permanent = True
            session['user_id'] = user['_id']
            session['username'] = user['username']
            session['role'] = user['role']
            user_data = {k: v for k, v in user.items() if k != 'password'}
            return jsonify({'success': True, 'message': 'Login successful', 'user': user_data}), 200
        else:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'success': False, 'error': 'Login failed'}), 500

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

# -----------------------------
# Static File Routes
# -----------------------------
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    else:
        return abort(404)

# -----------------------------
# Error Handlers
# -----------------------------
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# -----------------------------
# Run App
# -----------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
