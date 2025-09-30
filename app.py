from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import bcrypt
import os
from ibmcloudant.cloudant_v1 import CloudantV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from datetime import datetime
import random
import string

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'waterborne-disease-secret-key-2024')
CORS(app)

# Database Configuration
def get_db_client():
    api_key = os.environ.get("CLOUDANT_APIKEY", "tSpMMkxehpD7_4GsZq7rOra6Pu0pavcPWB72_O4ywgQ1")
    service_url = os.environ.get("CLOUDANT_URL", "https://b4cadce0-fd64-4d6c-b2da-fbcdc657bc10-bluemix.cloudantnosqldb.appdomain.cloud")
    
    try:
        authenticator = IAMAuthenticator(api_key)
        client = CloudantV1(authenticator=authenticator)
        client.set_service_url(service_url)
        print("✅ Connected to IBM Cloudant")
        return client
    except Exception as e:
        print(f"❌ Cloudant connection failed: {e}")
        return None

client = get_db_client()

def ensure_db_exists(db_name):
    if client:
        try:
            client.get_database_information(db=db_name).get_result()
            print(f"✅ Database '{db_name}' ready")
        except Exception:
            client.put_database(db=db_name).get_result()
            print(f"✅ Created database '{db_name}'")

# Ensure databases exist when app starts
if client:
    ensure_db_exists('users')
    ensure_db_exists('patients')
    ensure_db_exists('predictions')

@app.route('/api/register', methods=['POST'])
def register():
    if not client:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500
    
    try:
        data = request.get_json()
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
        print(f"❌ Registration error: {e}")
        return jsonify({'success': False, 'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    if not client:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500
    
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        print(f"🔐 Login attempt: {username}")
        
        # Find user by username
        selector = {'username': username}
        result = client.post_find(db='users', selector=selector).get_result()
        users = result.get('docs', [])
        
        if not users:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
        
        user = users[0]
        
        # Verify password
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            # Remove password from response
            user_data = {k: v for k, v in user.items() if k != 'password'}
            
            # Set session
            session['user_id'] = user['_id']
            session['username'] = user['username']
            session['role'] = user['role']
            
            print(f"✅ Login successful: {user['username']} ({user['role']})")
            
            return jsonify({
                'success': True,
                'message': 'Login successful!',
                'user': user_data
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'success': False, 'error': 'Login failed'}), 500

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({'authenticated': True, 'role': session.get('role')}), 200
    return jsonify({'authenticated': False}), 401

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
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)