// Tailwind CSS configuration
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                'poppins': ['Poppins', 'sans-serif']
            }
        }
    }
};

// Global state
let isDarkMode = false;
let currentLanguage = 'en';
let currentRole = '';

// Language translations
const translations = {
    en: {
        title: "Smart Community Health Monitoring System",
        subtitle: "Early Warning System for Water-Borne Diseases in Rural Northeast India",
        tagline: "Protecting Communities • Preventing Disease • Promoting Health",
        chooseRole: "Choose Your Role",
        roleDescription: "Select your role to access the appropriate dashboard and tools",
        asha: "ASHA Worker",
        volunteer: "Community Volunteer",
        admin: "Health Administrator"
    },
    as: {
        title: "স্মাৰ্ট সম্প্ৰদায়িক স্বাস্থ্য নিৰীক্ষণ ব্যৱস্থা",
        subtitle: "গ্ৰাম্য উত্তৰ-পূৰ্ব ভাৰতত পানীবাহিত ৰোগৰ বাবে আগতীয়া সতৰ্কবাণী ব্যৱস্থা",
        tagline: "সম্প্ৰদায় সুৰক্ষা • ৰোগ প্ৰতিৰোধ • স্বাস্থ্য প্ৰসাৰ",
        chooseRole: "আপোনাৰ ভূমিকা বাছনি কৰক",
        roleDescription: "উপযুক্ত ডেছবৰ্ড আৰু সঁজুলি ব্যৱহাৰ কৰিবলৈ আপোনাৰ ভূমিকা নিৰ্বাচন কৰক",
        asha: "আশা কৰ্মী",
        volunteer: "সম্প্ৰদায়িক স্বেচ্ছাসেৱক",
        admin: "স্বাস্থ্য প্ৰশাসক"
    },
    bn: {
        title: "স্মার্ট কমিউনিটি স্বাস্থ্য পর্যবেক্ষণ সিস্টেম",
        subtitle: "গ্রামীণ উত্তর-পূর্ব ভারতে পানিবাহিত রোগের জন্য প্রাথমিক সতর্কতা সিস্টেম",
        tagline: "সম্প্রদায় সুরক্ষা • রোগ প্রতিরোধ • স্বাস্থ্য প্রচার",
        chooseRole: "আপনার ভূমিকা নির্বাচন করুন",
        roleDescription: "উপযুক্ত ড্যাশবোর্ড এবং সরঞ্জাম অ্যাক্সেস করতে আপনার ভূমিকা নির্বাচন করুন",
        asha: "আশা কর্মী",
        volunteer: "কমিউনিটি স্বেচ্ছাসেবক",
        admin: "স্বাস্থ্য প্রশাসক"
    },
    hi: {
        title: "स्मार्ट सामुदायिक स्वास्थ्य निगरानी प्रणाली",
        subtitle: "ग्रामीण उत्तर-पूर्व भारत में जल-जनित रोगों के लिए प्रारंभिक चेतावनी प्रणाली",
        tagline: "समुदाय सुरक्षा • रोग रोकथाम • स्वास्थ्य संवर्धन",
        chooseRole: "अपनी भूमिका चुनें",
        roleDescription: "उपयुक्त डैशबोर्ड और उपकरणों तक पहुंचने के लिए अपनी भूमिका का चयन करें",
        asha: "आशा कार्यकर्ता",
        volunteer: "सामुदायिक स्वयंसेवक",
        admin: "स्वास्थ्य प्रशासक"
    }
};

// Safe icon creation function
function createIconsSafely() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try {
            lucide.createIcons();
        } catch (error) {
            console.warn('Error creating Lucide icons:', error);
            setTimeout(() => {
                try {
                    lucide.createIcons();
                } catch (retryError) {
                    console.warn('Retry failed for Lucide icons:', retryError);
                }
            }, 1000);
        }
    } else {
        console.warn('Lucide not available, retrying...');
        setTimeout(createIconsSafely, 500);
    }
}

// Initialize the app
function initializeApp() {
    createIconsSafely();
    setupEventListeners();
    loadTheme();
    setupTypingAnimation();
}

// Toggle theme
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    const themeIcon = document.querySelector('#theme-toggle i');
    themeIcon.setAttribute('data-lucide', isDarkMode ? 'moon' : 'sun');
    createIconsSafely();
    
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Load theme preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.documentElement.classList.add('dark');
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', 'moon');
        }
    }
}

// Show login modal
function showLoginModal(role) {
    currentRole = role;
    const modal = document.getElementById('login-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    
    const roleNames = {
        asha: 'ASHA Worker',
        volunteer: 'Community Volunteer',
        admin: 'Health Administrator'
    };
    
    title.textContent = `Login as ${roleNames[role]}`;
    
    content.innerHTML = `
        <form class="space-y-4" onsubmit="handleLogin(event)">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User ID / Email</label>
                <input type="text" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter your user ID or email">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <input type="password" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter your password">
            </div>
            <div class="flex items-center justify-between">
                <label class="flex items-center gap-2">
                    <input type="checkbox" class="text-blue-600 rounded">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <button type="button" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    Forgot password?
                </button>
            </div>
            <div class="space-y-3 pt-4">
                <button type="submit" class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium">
                    <i data-lucide="log-in" class="w-4 h-4 inline mr-2"></i>
                    Login to Dashboard
                </button>
                <div class="text-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Don't have an account? </span>
                    <button type="button" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" onclick="showRegistrationInfo()">
                        Request Access
                    </button>
                </div>
            </div>
        </form>
        
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                For security, all access is managed by your district health administrator. 
                Contact your supervisor for login credentials.
            </p>
        </div>
    `;
    
    modal.classList.remove('hidden');
    createIconsSafely();
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('success-modal').classList.remove('hidden');
    
    setTimeout(() => {
        document.getElementById('success-modal').classList.add('hidden');
        
        // Redirect to the patient dashboard after successful login.
        window.location.href = 'ashaworker.html';

    }, 3000);
}

// **MODIFIED FUNCTION**
// This now redirects to the registration page (`uy.html`)
function showRegistrationInfo() {
    window.location.href = 'uy.html';
}

// Close modal
function closeModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

// Language functions
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown');
    dropdown.classList.toggle('show');
}

function changeLanguage(lang) {
    currentLanguage = lang;
    const langNames = {
        en: 'English',
        as: 'অসমীয়া',
        bn: 'বাংলা',
        hi: 'हिंदी'
    };
    
    document.getElementById('current-language').textContent = langNames[lang];
    document.getElementById('language-dropdown').classList.remove('show');
    
    updatePageContent();
    localStorage.setItem('language', lang);
}

function updatePageContent() {
    // This is a simplified example. In a real app, you'd translate all necessary text.
    console.log(`Language changed to ${currentLanguage}`);
}

function setupTypingAnimation() {
    // Simplified to prevent issues, you can restore the complex version if needed
    const element = document.querySelector('.typing-animation');
    if(element) {
        element.style.width = '100%';
    }
}

function setupEventListeners() {
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('language-btn')?.addEventListener('click', toggleLanguageDropdown);
    
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', () => {
            changeLanguage(option.dataset.lang);
        });
    });
    
    document.addEventListener('click', (e) => {
        const languageSelector = document.querySelector('.language-selector');
        if (languageSelector && !languageSelector.contains(e.target)) {
            document.getElementById('language-dropdown')?.classList.remove('show');
        }
    });
    
    document.getElementById('help-btn')?.addEventListener('click', () => {
        alert('🆘 Help & Support:\n\n📞 Technical Support: +91-XXXX-XXXXXX\n📧 Email: support@healthmonitor.gov.in\n\n💡 Quick Tips:\n• Choose your role to access tools.\n• Contact your supervisor for login credentials.');
    });
    
    document.getElementById('login-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });
}

function loadLanguagePreference() {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
        changeLanguage(savedLanguage);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadLanguagePreference();
});