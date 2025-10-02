# app.py
from flask import Flask, request, jsonify, session, send_from_directory, abort
from flask_cors import CORS
import bcrypt
import os
from ibmcloudant.cloudant_v1 import CloudantV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from datetime import datetime
import time
import logging

# -----------------------------
# Configuration
# -----------------------------
DATABASES = ['users', 'patients', 'predictions']
ALLOWED_ORIGINS = ["https://waterbornedisease-production.up.railway.app"]
SESSION_LIFETIME = 3600  # seconds

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

# -----------------------------
# Flask App Initialization
# -----------------------------
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-2024')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = SESSION_LIFETIME
CORS(app, supports_credentials=True, origins=ALLOWED_ORIGINS)

# -----------------------------
# Cloudant Client Singleton
# -----------------------------
client = None

def get_db_client():
    global client
    if client:
        return client

    max_retries = 3
    for attempt in range(max_retries):
        try:
            api_key = os.environ.get("FIAt087x47tQFkRVZfg0qbwOGAUeyLcil0AUeScVtbXNY")
            service_url = os.environ.get("https://b1dab01f-53d0-4f7b-8f1a-7968e4d80a5d-bluemix.cloudantnosqldb.appdomain.cloud")
            if not api_key or not service_url:
                logging.error("Missing Cloudant environment variables")
                return None

            authenticator = IAMAuthenticator(api_key)
            client = CloudantV1(authenticator=authenticator)
            client.set_service_url(service_url)
            client.get_server_information().get_result()  # Test connection
            logging.info("Connected to IBM Cloudant successfully")
            return client
        except Exception as e:
            logging.error(f"Cloudant connection attempt {attempt + 1} failed: {e}")
            time.sleep(2)
    logging.error("All Cloudant connection attempts failed")
    return None

# -----------------------------
# Database Initialization
# -----------------------------
def ensure_db_exists(db_name):
    db_client = get_db_client()
    if not db_client:
        return False
    try:
        db_client.get_database_information(db=db_name).get_result()
        logging.info(f"Database '{db_name}' ready")
        return True
    except:
        try:
            db_client.put_database(db=db_name).get_result()
            logging.info(f"Created database '{db_name}'")
            return True
        except Exception as e:
            logging.error(f"Failed to create database '{db_name}': {e}")
            return False

def initialize_databases():
    db_client = get_db_client()
    if not db_client:
        logging.warning("Database initialization failed - running in limited mode")
        return
    for db in DATABASES:
        ensure_db_exists(db)
    logging.info("Database initialization completed")

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
        'database': 'connected' if get_db_client() else 'disconnected'
    })

@app.route('/api/debug', methods=['GET'])
def debug_info():
    return jsonify({
        'database_connected': get_db_client() is not None,
        'environment_variables_set': {
            'SECRET_KEY': bool(os.environ.get('SECRET_KEY')),
            'CLOUDANT_APIKEY': bool(os.environ.get('CLOUDANT_APIKEY')),
            'CLOUDANT_URL': bool(os.environ.get('CLOUDANT_URL'))
        },
        'current_config': {
            'secret_key_length': len(app.secret_key) if app.secret_key else 0,
            'cloudant_configured': get_db_client() is not None
        }
    })

@app.route('/api/register', methods=['POST'])
def register():
    db_client = get_db_client()
    if not db_client:
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
        # Check if username exists
        existing = db_client.post_find(db='users', selector={'username': username}).get_result()
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
        role_fields = {
            'asha': ['name', 'mobile', 'email', 'ashaId', 'district', 'dateOfBirth'],
            'volunteer': ['name','mobile','email','emergencyName','emergencyNumber','address','city','state','pincode','aadhaar','skills','availability','dateOfBirth'],
            'admin': ['name','employeeId','role','department','workEmail','workPhone'],
            'hospital': ['hospitalName','contactPerson','phone','email','address']
        }
        for field in role_fields.get(role, []):
            user_doc[field] = data.get(field)

        result = db_client.post_document(db='users', document=user_doc).get_result()
        logging.info(f"User registered: {username} ({role})")
        return jsonify({'success': True, 'message': 'Registration successful', 'user_id': result['id']}), 201
    except Exception as e:
        logging.error(f"Registration error: {e}")
        return jsonify({'success': False, 'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    db_client = get_db_client()
    if not db_client:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400

    try:
        users = db_client.post_find(db='users', selector={'username': username}).get_result().get('docs', [])
        if not users:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

        user = users[0]
        if verify_password(password, user['password']):
            session.permanent = True
            session['user_id'] = user['_id']
            session['username'] = user['username']
            session['role'] = user['role']
            user_data = {k: v for k, v in user.items() if k != 'password'}
            logging.info(f"Login successful: {username}")
            return jsonify({'success': True, 'message': 'Login successful', 'user': user_data}), 200
        else:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
    except Exception as e:
        logging.error(f"Login error: {e}")
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
    full_path = os.path.join('static', path)
    if os.path.exists(full_path):
        return send_from_directory('static', path)
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
