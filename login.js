// === REDIRECT LOOP PREVENTION - ADD THIS FIRST ===
(function() {
    console.log('🚀 Page loading - checking for redirect loops...');
    
    // Check if we're in a redirect loop
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPrevention = urlParams.get('redirect');
    
    if (redirectPrevention === 'prevent') {
        console.log('🛑 Redirect prevention active');
        // Remove the parameter without reloading
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    // Check session storage for loop detection
    const lastLoadTime = sessionStorage.getItem('lastPageLoad');
    const currentTime = Date.now();
    
    if (lastLoadTime && currentTime - parseInt(lastLoadTime) < 2000) {
        console.error('🔄 RAPID RELOAD DETECTED - Possible redirect loop!');
        // Clear storage and stop
        sessionStorage.clear();
        localStorage.removeItem('currentUser');
        alert('Redirect loop detected. Please refresh the page.');
        return;
    }
    
    sessionStorage.setItem('lastPageLoad', currentTime.toString());
})();
// === END REDIRECT PREVENTION ===

// Configuration and Constants
const CONFIG = {
    theme: {
        darkMode: 'class',
        extend: {
            fontFamily: {
                'poppins': ['Poppins', 'sans-serif']
            }
        }
    },
    endpoints: {
        login: '/api/login',
        logout: '/api/logout',
        checkAuth: '/api/check-auth'
    }
};

// Global state with persistence
const APP_STATE = {
    isDarkMode: localStorage.getItem('theme') === 'dark',
    currentLanguage: localStorage.getItem('language') || 'en',
    currentRole: '',
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null
};

// Debug function - call this in browser console if issues persist
function debugAuth() {
    console.log('🔍 DEBUG INFO:');
    console.log('Current User:', APP_STATE.currentUser);
    console.log('LocalStorage User:', localStorage.getItem('currentUser'));
    console.log('Current Role:', APP_STATE.currentRole);
    console.log('Page URL:', window.location.href);
    console.log('Session Storage:', { ...sessionStorage });
    
    // Test backend connection
    fetch(CONFIG.endpoints.checkAuth)
        .then(r => console.log('Backend check:', r.status, r.url))
        .catch(e => console.error('Backend check failed:', e));
}

// Make it globally available
window.debugAuth = debugAuth;

// Safe icon creation with retry logic
function createIconsSafely(maxRetries = 3, delay = 500) {
    if (typeof lucide === 'undefined' || !lucide.createIcons) {
        if (maxRetries > 0) {
            console.warn(`Lucide not available, retrying in ${delay}ms...`);
            setTimeout(() => createIconsSafely(maxRetries - 1, delay), delay);
        } else {
            console.error('Failed to load Lucide icons after multiple attempts');
        }
        return;
    }

    try {
        lucide.createIcons();
    } catch (error) {
        console.warn('Error creating Lucide icons:', error);
        if (maxRetries > 0) {
            setTimeout(() => createIconsSafely(maxRetries - 1, delay), delay);
        }
    }
}

// Theme management
const ThemeManager = {
    init() {
        this.applyTheme(APP_STATE.isDarkMode);
    },

    applyTheme(isDark) {
        document.documentElement.classList.toggle('dark', isDark);
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
            createIconsSafely();
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    },

    toggle() {
        APP_STATE.isDarkMode = !APP_STATE.isDarkMode;
        this.applyTheme(APP_STATE.isDarkMode);
    }
};

// Language management
const LanguageManager = {
    async changeLanguage(lang) {
        if (!translations[lang]) {
            console.error(`Language ${lang} not supported`);
            return false;
        }

        APP_STATE.currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        this.updateUI();
        return true;
    },

    updateUI() {
        const t = translations[APP_STATE.currentLanguage];
        if (!t) return;

        // Helper function to safely update elements
        const updateElement = (selector, text, isHTML = false) => {
            const element = document.querySelector(selector);
            if (element) {
                if (isHTML) {
                    element.innerHTML = text;
                } else {
                    element.textContent = text;
                }
            }
        };

        try {
            // Update header
            updateElement('#header-title', t.headerTitle);
            updateElement('#header-subtitle', t.headerSubtitle);

            // Update main heading with gradient
            const mainHeading = document.getElementById('main-heading');
            if (mainHeading) {
                const titleString = t.title;
                const lastSpaceIndex = titleString.lastIndexOf(' ');
                const part1 = titleString.substring(0, lastSpaceIndex);
                const part2 = titleString.substring(lastSpaceIndex + 1);
                mainHeading.innerHTML = `${part1} <span class="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">${part2}</span>`;
            }

            // Update other text elements
            updateElement('#sub-heading', t.subtitle);
            updateElement('#tagline', t.tagline);
            updateElement('#choose-role-heading', t.chooseRole);
            updateElement('#role-description', t.roleDescription);

            // Update role cards
            ['asha', 'volunteer', 'admin', 'patient'].forEach(role => {
                updateElement(`[data-role-title="${role}"]`, t[role]);
                updateElement(`[data-role-desc="${role}"]`, t[`${role}_desc`]);
                updateElement(`[data-role-button="${role}"]`, t[`${role}_button`]);
                
                for (let i = 1; i <= 4; i++) {
                    updateElement(`[data-role-item="${role}-${i}"]`, t[`${role}_item${i}`]);
                }
            });

            // Update features
            updateElement('#features-title', t.featuresTitle);
            updateElement('#features-description', t.featuresDescription);
            
            for (let i = 1; i <= 6; i++) {
                updateElement(`[data-feature-title="${i}"]`, t[`feature${i}_title`]);
                updateElement(`[data-feature-desc="${i}"]`, t[`feature${i}_desc`]);
            }

            // Update language selector
            const langNames = { en: 'English', as: 'অসমীয়া', bn: 'বাংলা', hi: 'हिंदी' };
            updateElement('#current-language', langNames[APP_STATE.currentLanguage]);

        } catch (error) {
            console.error('Error updating UI content:', error);
        }
    }
};

// Authentication management
const AuthManager = {
    async login(credentials) {
        try {
            console.log('🔐 Attempting login for role:', credentials.role);
            
            const response = await fetch(CONFIG.endpoints.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                redirect: 'manual' // Important: handle redirects manually
            });

            console.log('📨 Login response status:', response.status);
            console.log('📨 Login response type:', response.type);

            // Handle redirect responses
            if (response.status >= 300 && response.status < 400) {
                const redirectUrl = response.headers.get('Location');
                console.warn('🔄 Server redirect detected to:', redirectUrl);
                
                if (redirectUrl && redirectUrl !== window.location.href) {
                    // Add prevention parameter to break loops
                    const separator = redirectUrl.includes('?') ? '&' : '?';
                    window.location.href = redirectUrl + separator + 'redirect=prevent';
                    return { success: true, redirect: true };
                } else {
                    throw new Error('Redirect loop detected');
                }
            }

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.warn('⚠️ Non-JSON response:', text.substring(0, 200));
                
                if (response.ok) {
                    // Assume success if response is OK but not JSON
                    const mockUser = {
                        id: credentials.username,
                        role: credentials.role,
                        name: credentials.role.charAt(0).toUpperCase() + credentials.role.slice(1) + ' User'
                    };
                    APP_STATE.currentUser = mockUser;
                    localStorage.setItem('currentUser', JSON.stringify(mockUser));
                    return { success: true, user: mockUser };
                } else {
                    throw new Error(`Server returned non-JSON response: ${response.status}`);
                }
            }

            const result = await response.json();
            
            if (result.success) {
                APP_STATE.currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                return { success: true, user: result.user };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.message || 'Network error. Please check your connection and try again.' 
            };
        }
    },

    async logout() {
        try {
            await fetch(CONFIG.endpoints.logout, { method: 'POST' });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            APP_STATE.currentUser = null;
            localStorage.removeItem('currentUser');
        }
    },

    isLoggedIn() {
        return APP_STATE.currentUser !== null;
    },

    getCurrentUser() {
        return APP_STATE.currentUser;
    }
};

// Modal management
const ModalManager = {
    showLoginModal(role) {
        APP_STATE.currentRole = role;
        const modal = document.getElementById('login-modal');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');
        
        const t = translations[APP_STATE.currentLanguage];
        const roleNames = {
            asha: t.asha,
            volunteer: t.volunteer,
            admin: t.admin,
            patient: t.patient
        };
        
        title.textContent = t.login_title.replace('{role}', roleNames[role]);
        content.innerHTML = this.generateLoginForm(role, t);
        
        modal.classList.remove('hidden');
        createIconsSafely();
    },

    generateLoginForm(role, translations) {
        return `
            <form class="space-y-4" onsubmit="handleLogin(event)">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ${translations.user_id_label}
                    </label>
                    <input type="text" required 
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                           placeholder="${translations.user_id_placeholder}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ${translations.password_label}
                    </label>
                    <input type="password" required 
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                           placeholder="${translations.password_placeholder}">
                </div>
                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" class="text-blue-600 rounded">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            ${translations.remember_me}
                        </span>
                    </label>
                    <button type="button" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        ${translations.forgot_password}
                    </button>
                </div>
                <div class="space-y-3 pt-4">
                    <button type="submit" class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium">
                        <i data-lucide="log-in" class="w-4 h-4 inline mr-2"></i>
                        ${translations.login_button}
                    </button>
                    <div class="text-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                            ${translations.no_account}
                        </span>
                        <button type="button" 
                                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" 
                                onclick="showRegistrationInfo('${role}')">
                            ${translations.request_access}
                        </button>
                    </div>
                </div>
            </form>
            
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                    ${translations.security_note}
                </p>
            </div>
        `;
    },

    closeModal() {
        document.getElementById('login-modal').classList.add('hidden');
    },

    showSuccessModal() {
        const modal = document.getElementById('success-modal');
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            this.closeSuccessModal();
            this.redirectToDashboard();
        }, 2000);
    },

    closeSuccessModal() {
        document.getElementById('success-modal').classList.add('hidden');
    },

    redirectToDashboard() {
        const redirectMap = {
            'patient': 'pd.html',
            'asha': 'ashaworker.html',
            'volunteer': 'cd.html',
            'admin': 'had.html'
        };
        
        const targetPage = redirectMap[APP_STATE.currentRole];
        if (targetPage) {
            console.log('🔄 Redirecting to:', targetPage);
            // Use replace to avoid adding to history stack
            window.location.replace(targetPage + '?redirect=prevent');
        } else {
            console.error('❌ No redirect mapping for role:', APP_STATE.currentRole);
        }
    }
};

// Event Handlers
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const loginData = {
        username: form.querySelector('input[type="text"]').value,
        password: form.querySelector('input[type="password"]').value,
        role: APP_STATE.currentRole
    };
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing in...</span>';
    
    try {
        const result = await AuthManager.login(loginData);
        
        if (result.success) {
            if (result.redirect) {
                // Redirect is already happening, just close modal
                ModalManager.closeModal();
                console.log('✅ Login successful, redirecting...');
            } else {
                ModalManager.closeModal();
                ModalManager.showSuccessModal();
                
                setTimeout(() => {
                    ModalManager.closeSuccessModal();
                    ModalManager.redirectToDashboard();
                }, 2000);
            }
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Login process error:', error);
        showErrorAlert(error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function showErrorAlert(message) {
    // You can replace this with a more sophisticated alert system
    alert(`Login failed: ${message}`);
}

function showRegistrationInfo(role) {
    ModalManager.closeModal();
    const registrationPages = {
        'volunteer': 'cv.html',
        'admin': 'uy1ha.html',  
        'asha': 'uy.html',
        'hospital': 'hospital-registration.html'
    };
    
    const page = registrationPages[role];
    if (page) {
        window.location.href = page;
    } else {
        const t = translations[APP_STATE.currentLanguage];
        alert(`To request access as a ${t[role]}, please contact your local health administrator.`);
    }
}

function toggleLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown');
    dropdown.classList.toggle('show');
}

// Initialize the application
function initializeApp() {
    console.log('🚀 Initializing application...');
    
    // Initialize Tailwind
    if (typeof tailwind !== 'undefined') {
        tailwind.config = CONFIG.theme;
    }

    // Set up event listeners
    document.getElementById('theme-toggle')?.addEventListener('click', () => ThemeManager.toggle());
    document.getElementById('close-modal')?.addEventListener('click', () => ModalManager.closeModal());
    document.getElementById('language-btn')?.addEventListener('click', toggleLanguageDropdown);
    
    // Language selection
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', () => {
            LanguageManager.changeLanguage(option.dataset.lang);
        });
    });
    
    // Close language dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const languageSelector = document.querySelector('.language-selector');
        if (languageSelector && !languageSelector.contains(e.target)) {
            document.getElementById('language-dropdown')?.classList.remove('show');
        }
    });
    
    // Help button
    document.getElementById('help-btn')?.addEventListener('click', () => {
        alert('🆘 Help & Support:\n\n📞 Technical Support: +91-XXXX-XXXXXX\n📧 Email: support@healthmonitor.gov.in\n\n💡 Quick Tips:\n• Choose your role to access tools.\n• Contact your supervisor for login credentials.');
    });
    
    // Modal backdrop click
    document.getElementById('login-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            ModalManager.closeModal();
        }
    });

    // Awareness button
    document.getElementById('awareness-btn')?.addEventListener('click', function() {
        window.open('awareness.html', '_blank');
    });

    // Initialize components
    ThemeManager.init();
    createIconsSafely();
    
    // Load language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
        LanguageManager.changeLanguage(savedLanguage);
    } else {
        LanguageManager.updateUI();
    }
    
    console.log('✅ Application initialized successfully');
}

// Backend connection check (optional)
async function checkBackendConnection() {
    try {
        const response = await fetch(CONFIG.endpoints.checkAuth);
        console.log('✅ Backend connection successful');
        return true;
    } catch (error) {
        console.warn('❌ Backend connection failed:', error);
        return false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Utility function for external use
function logoutUser() {
    AuthManager.logout();
    window.location.href = 'index.html';
}

// Add global error handler to catch any unhandled errors
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
