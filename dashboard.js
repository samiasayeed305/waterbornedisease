// Mock Data - In a real app, this would come from the server
const mockPatientData = [
    { id: 'P001', name: 'Anjali Das', age: 34, symptoms: 'Fever, Dehydration', status: 'Under Observation', statusColor: 'yellow' },
    { id: 'P002', name: 'Bikram Singh', age: 45, symptoms: 'Severe Diarrhea', status: 'Critical', statusColor: 'red' },
    { id: 'P003', name: 'Chandra Rai', age: 28, symptoms: 'Mild Stomach Cramps', status: 'Stable', statusColor: 'green' },
    { id: 'P004', name: 'Deepa Gurung', age: 52, symptoms: 'Vomiting, Weakness', status: 'Under Observation', statusColor: 'yellow' },
    { id: 'P005', name: 'Eshaan Chettri', age: 19, symptoms: 'Recovered', status: 'Discharged', statusColor: 'blue' }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Populate UI elements with data
    populatePatientRecords();
    
    // Setup event listeners for buttons and modals
    setupEventListeners();

    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// --- UI Population Functions ---
function populatePatientRecords() {
    const tableBody = document.getElementById('patient-records');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Clear existing rows
    mockPatientData.forEach(patient => {
        const statusColors = {
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
        };
        const row = `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-4 py-3">${patient.id}</td>
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">${patient.name}</td>
                <td class="px-4 py-3">${patient.age}</td>
                <td class="px-4 py-3">${patient.symptoms}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${statusColors[patient.statusColor]}">
                        ${patient.status}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <button class="p-1 text-gray-500 hover:text-blue-600"><i data-lucide="eye" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    const addPatientBtn = document.getElementById('add-patient-btn');
    const addPatientModal = document.getElementById('add-patient-modal');
    const closeAddPatientBtn = document.getElementById('close-add-patient');

    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', () => {
            if (addPatientModal) addPatientModal.classList.remove('hidden');
        });
    }

    if (closeAddPatientBtn) {
        closeAddPatientBtn.addEventListener('click', () => {
            if (addPatientModal) addPatientModal.classList.add('hidden');
        });
    }
    
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Redirect to the login page
            window.location.href = 'index.html';
        });
    }
}