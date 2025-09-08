from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import bcrypt
import os
from ibmcloudant.cloudant_v1 import CloudantV1
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
import json

# Initialize the Flask app to serve static files from the current directory
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# --- Database Connection Logic ---
def get_db_client():
    api_key = os.environ.get("tSpMMkxehpD7_4GsZq7rOra6Pu0pavcPWB72_O4ywgQ1")
    service_url = os.environ.get("https://b4cadce0-fd64-4d6c-b2da-fbcdc657bc10-bluemix.cloudantnosqldb.appdomain.cloud")
    if not api_key or not service_url:
        print("❌ Error: CLOUDANT_APIKEY and CLOUDANT_URL environment variables must be set.")
        return None
    try:
        authenticator = IAMAuthenticator(api_key)
        client = CloudantV1(authenticator=authenticator)
        client.set_service_url(service_url)
        print("✅ Successfully connected to IBM Cloudant.")
        return client
    except Exception as e:
        print(f"❌ Error connecting to IBM Cloudant: {e}")
        return None

client = get_db_client()

def ensure_db_exists(db_name):
    if client:
        try:
            client.get_database_information(db=db_name).get_result()
            print(f"✅ Database '{db_name}' is ready.")
        except Exception:
            print(f"Database '{db_name}' not found. Creating it...")
            client.put_database(db=db_name).get_result()
            print(f"✅ Database '{db_name}' created successfully.")

# Ensure our databases exist when the server starts
ensure_db_exists('users')
ensure_db_exists('patients')

# --- Routes to Serve Your Frontend Files ---
@app.route('/')
def serve_index():
    # This serves your main login page (index.html)
    return send_from_directory('.', 'index.html')

@app.route('/uy.html')
def serve_registration():
    # This serves your registration page
    return send_from_directory('.', 'uy.html')

@app.route('/ashaworker.html')
def serve_dashboard():
    # This serves your ASHA worker dashboard
    return send_from_directory('.', 'ashaworker.html')

# --- Your API Routes for Data ---
@app.route('/register', methods=['POST'])
def register():
    if not client: return jsonify({'error': 'Database connection unavailable'}), 500
    try:
        data = request.get_json()
        
        # We now get all the detailed fields from the form
        full_name = data.get('name')
        date_of_birth = data.get('dateOfBirth')
        phone = data.get('mobile')
        email = data.get('email')
        asha_id = data.get('ashaId')
        district = data.get('district')
        username = data.get('username')
        password = data.get('password').encode('utf-8')
        role = 'asha' 

        if not all([full_name, date_of_birth, phone, email, asha_id, district, username, password]):
            return jsonify({'error': 'Missing required fields'}), 400

        hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
        
        new_user = {
            'type': 'user',
            'fullName': full_name,
            'dateOfBirth': date_of_birth,
            'phone': phone,
            'email': email,
            'ashaId': asha_id,
            'district': district,
            'username': username,
            'password': hashed_password,
            'role': role
        }

        client.post_document(db='users', document=new_user).get_result()
        return jsonify({'message': 'Registration successful!'}), 201

    except Exception as e:
        print(f"Registration Error: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

@app.route('/login', methods=['POST'])
def login():
    if not client: return jsonify({'error': 'Database connection unavailable'}), 500
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password').encode('utf-8')
        
        selector = {'email': {'$eq': email}}
        query_result = client.post_find(db='users', selector=selector).get_result()
        
        users = query_result.get('docs')
        if users:
            user = users[0]
            if bcrypt.checkpw(password, user['password'].encode('utf-8')):
                return jsonify({'message': 'Login successful!', 'userId': user['_id'], 'role': user['role']}), 200

        return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

@app.route('/add_patient', methods=['POST'])
def add_patient():
    if not client: return jsonify({'error': 'Database connection unavailable'}), 500
    try:
        data = request.get_json()
        new_patient = {
            'type': 'patient',
            'name': data.get('name'),
            'age': data.get('age'),
            'symptoms': data.get('symptoms'),
            'status': 'Under Observation' # Default status
        }
        client.post_document(db='patients', document=new_patient).get_result()
        return jsonify({'message': 'Patient added successfully!', 'patient': new_patient}), 201
    except Exception as e:
        print(f"Add Patient Error: {e}")
        return jsonify({'error': 'Could not add patient'}), 500

@app.route('/patients', methods=['GET'])
def get_patients():
    if not client: return jsonify({'error': 'Database connection unavailable'}), 500
    try:
        all_docs_result = client.post_all_docs(db='patients', include_docs=True).get_result()
        patients = [row['doc'] for row in all_docs_result.get('rows', []) if 'doc' in row]
        return jsonify(patients), 200
    except Exception as e:
        print(f"Fetch Patients Error: {e}")
        return jsonify({'error': 'Could not fetch patient data'}), 500

if __name__ == 'main':
    app.run(debug=True, port=5000)