const BASE_URL = 'http://127.0.0.1:6396/PriceBloomBuddy'; // Adjust if your API is on a different port/URL

// User data storage (temporary frontend storage)
let currentUser = null;
let allLoadedTriggers = []; // Store all fetched triggers for searching

// Enhanced logging function
function logMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [${level.toUpperCase()}] PriceBloom:`;

    if (data) {
        console.log(logPrefix, message, data);
    } else {
        console.log(logPrefix, message);
    }
}

window.addEventListener('load', function () {
    logMessage('info', 'Page loaded, checking for saved user data');
    const savedUserData = sessionStorage.getItem('currentUser');
    if (savedUserData) {
        try {
            currentUser = JSON.parse(savedUserData);
            logMessage('info', 'Restored user data from session storage', currentUser);
            updateUIForLoggedInUser();
            updateNavigationForLoggedInUser();
        } catch (error) {
            logMessage('error', 'Failed to parse saved user data', error);
            sessionStorage.removeItem('currentUser');
        }
    } else {
        logMessage('info', 'No saved user data found');
        updateNavigationForLoggedOutUser();
        window.location.href = 'index.html#login';
    }

    // Check if user should be on this page
    checkAuthenticationForPage();
});

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    initializeSearch();
    filterTriggers();
    initializeNotificationRadio();
});

function initializeEventListeners() {
    // Mobile menu functionality
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function () {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                navLinks.classList.toggle('active');
                logMessage('debug', 'Mobile menu toggled');
            }
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const targetId = this.getAttribute('href').substring(1);
                if ((targetId === 'add-trigger' || targetId === 'get-triggers') && !currentUser) {
                    logMessage('warn', `User tried to access ${targetId} without being logged in`);
                    showAlert('loginAlert', 'Please login first to access this feature.', 'error');
                    document.getElementById('login')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    return;
                }

                logMessage('debug', `Navigating to section: ${targetId}`);
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add Price Trigger Form Submission
    const addTriggerForm = document.getElementById('addTriggerForm');
    if (addTriggerForm) {
        addTriggerForm.addEventListener('submit', handleAddTrigger);
    }

    // Get Triggers button
    const getTriggersBtn = document.getElementById('getTriggersBtn');
    if (getTriggersBtn) {
        getTriggersBtn.addEventListener('click', getTriggers);
    }

    // Refresh triggers button
    const refreshTriggersBtn = document.getElementById('refreshTriggersBtn');
    if (refreshTriggersBtn) {
        refreshTriggersBtn.addEventListener('click', getTriggers);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function initializeNotificationRadio() {
    const radioInputs = document.querySelectorAll('input[name="notificationType"]');

    // Set default selection to email
    const defaultRadio = document.getElementById('notificationEmail');
    if (defaultRadio) {
        defaultRadio.checked = true;
    }

    // Add change event listeners (no need to show/hide fields since email and mobile are always present)
    radioInputs.forEach(radio => {
        radio.addEventListener('change', function () {
            logMessage('debug', `Notification type changed to: ${this.value}`);
        });
    });
}


// Utility function to show alerts
function showAlert(alertId, message, type) {
    logMessage('info', `Showing ${type} alert: ${message}`);
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.className = `alert-message show ${type}`;
        // Automatically hide after 5 seconds
        setTimeout(() => {
            hideAlert(alertId);
        }, 5000);
    }
}

// Utility function to hide alerts
function hideAlert(alertId) {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
        alertElement.className = 'alert-message';
        alertElement.textContent = '';
    }
}

// Login Form Handler
function handleLogin(e) {
    e.preventDefault();
    logMessage('info', 'Login form submitted');

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('.submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline';
    }

    // Clear previous alerts
    hideAlert('loginAlert');

    const notificationType = formData.get('notificationType');

    // Save user data temporarily in session storage
    currentUser = {
        userName: formData.get('userName'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        notificationType: notificationType,
        validity: '5' // Fixed validity
    };

    logMessage('info', 'Saving user data to session storage', currentUser);
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

    setTimeout(() => {
        updateUIForLoggedInUser();
        showAlert('loginAlert', 'User data saved successfully! You can now add price triggers.', 'success');

        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }

        // Reload page after success
        setTimeout(() => {
            location.reload();
        }, 1000);
    }, 1000);
}

// Update navigation for logged in user
// Update navigation for logged in user
function updateNavigationForLoggedInUser() {
    const loginNavBtn = document.getElementById('loginNavBtn');
    const addTriggerNav = document.getElementById('addTriggerNav');
    const getTriggersNav = document.getElementById('getTriggersNav');
    const userProfileNav = document.getElementById('userProfileNav');
    const logoutBtn = document.getElementById('logoutBtn');
    const navUserName = document.getElementById('navUserName');
    const loginSection = document.getElementById('login');

    if (loginNavBtn) loginNavBtn.style.display = 'none';
    if (addTriggerNav) addTriggerNav.style.display = 'inline-block';
    if (getTriggersNav) getTriggersNav.style.display = 'inline-block';
    if (userProfileNav) userProfileNav.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (loginSection) loginSection.style.display = 'none';

    if (currentUser) {
        if (navUserName) navUserName.textContent = currentUser.userName;
        updateUserProfileDropdown();
    }
}

// Update navigation for logged out user
function updateNavigationForLoggedOutUser() {
    const loginNavBtn = document.getElementById('loginNavBtn');
    const addTriggerNav = document.getElementById('addTriggerNav');
    const getTriggersNav = document.getElementById('getTriggersNav');
    const userProfileNav = document.getElementById('userProfileNav');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginSection = document.getElementById('login');

    if (loginNavBtn) loginNavBtn.style.display = 'inline-block';
    if (addTriggerNav) addTriggerNav.style.display = 'none';
    if (getTriggersNav) getTriggersNav.style.display = 'none';
    if (userProfileNav) userProfileNav.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginSection) loginSection.style.display = 'block';

}

function updateUserProfileDropdown() {
    const navUserEmail = document.getElementById('navUserEmail');
    const navUserMobile = document.getElementById('navUserMobile');
    const emailDetail = document.getElementById('emailDetail');
    const mobileDetail = document.getElementById('mobileDetail');

    if (currentUser) {
        // Show both email and mobile details
        if (emailDetail && navUserEmail) {
            emailDetail.style.display = 'block';
            navUserEmail.textContent = currentUser.email;
        }

        if (mobileDetail && navUserMobile) {
            mobileDetail.style.display = 'block';
            navUserMobile.textContent = currentUser.mobile;
        }

        // Hide token detail if it exists
        const tokenDetail = document.getElementById('tokenDetail');
        if (tokenDetail) tokenDetail.style.display = 'none';
    }
}

// Replace the updateUserInfoDisplay function
function updateUserInfoDisplay() {
    const userInfoDiv = document.getElementById('userInfoDisplay');
    if (userInfoDiv) {
        if (currentUser) {
            const notificationMethod = currentUser.notificationType === 'email' ? 'Email' : 'SMS/WhatsApp';
            const contactValue = currentUser.notificationType === 'email' ? currentUser.email : currentUser.mobile;

            userInfoDiv.innerHTML = `
                <h3>Logged in as: ${currentUser.userName}</h3>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Mobile:</strong> ${currentUser.mobile}</p>
                <p><strong>Preferred Notification:</strong> ${notificationMethod} (${contactValue})</p>
                <p><strong>Validity:</strong> ${currentUser.validity} days</p>
            `;
        } else {
            userInfoDiv.innerHTML = '<p>Please login to see your details.</p>';
        }
    }
}



// Check authentication and redirect if needed
function checkAuthenticationForPage() {
    const currentPage = window.location.pathname.split('/').pop();

    if ((currentPage === 'add.html' || currentPage === 'get.html') && !currentUser) {
        logMessage('warn', 'User not authenticated, redirecting to home');
        window.location.href = 'index.html#login';
        return false;
    }
    return true;
}

function updateUIForLoggedInUser() {
    logMessage('info', 'Updating UI for logged in user');

    // Update user info display if it exists (on add.html and get.html)
    updateUserInfoDisplay();

    // Pre-fill validity in add trigger form from saved user data
    const validityField = document.getElementById('validity');
    if (validityField && currentUser?.validity) {
        validityField.value = currentUser.validity;
    }
}

// FAQ Functionality - Add this to your script2.js file

document.addEventListener('DOMContentLoaded', function () {
    // FAQ Toggle Functionality
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const toggle = item.querySelector('.faq-toggle');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-toggle').textContent = '+';
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                toggle.textContent = '+';
            } else {
                item.classList.add('active');
                toggle.textContent = '−';
            }
        });
    });

    // Mobile Menu Toggle (if needed)
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }
});
// Update user info displ

// Logout function
function logout() {
    logMessage('info', 'User logging out');
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    allLoadedTriggers = []; // Clear stored triggers

    // Show alert and refresh page
    showAlert('loginAlert', 'Logged out successfully!', 'info');

    setTimeout(() => {
        location.reload();
    }, 1000);
}
// Add Price Trigger Form Handler
async function handleAddTrigger(e) {
    e.preventDefault();
    logMessage('info', 'Add trigger form submitted');

    if (!currentUser) {
        logMessage('error', 'User not logged in, cannot add trigger');
        showAlert('addTriggerAlert', 'Please login first to add price triggers.', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('.submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline';
    }

    hideAlert('addTriggerAlert');

    try {
        const params = new URLSearchParams({
            userName: currentUser.userName,
            Url: formData.get('url'),
            DreamPrice: formData.get('dreamPrice'),
            Validity: formData.get('validity'),
            MobileNumber: currentUser.mobile,
            Email: currentUser.email,
            token: currentUser.token,
            notificationEnable: formData.get('notificationEnable') ? 'true' : 'false'
        }).toString();

        const apiUrl = `${BASE_URL}/AddToken?${params}`;
        logMessage('info', 'Calling AddToken API', {
            url: apiUrl,
            params: Object.fromEntries(new URLSearchParams(params))
        });

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        logMessage('info', 'AddToken API response received', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            let errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                errorText = errorJson.message || errorText;
            } catch (jsonError) {
                // If it's not JSON, just use the raw text
            }
            logMessage('error', 'AddToken API HTTP Error', {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });
            throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText || 'Unknown error.'}`);
        }

        const data = await response.json();
        logMessage('success', 'AddToken API Success Response Data', data);

        showAlert('addTriggerAlert', `Price trigger added successfully! Request ID: ${data.RequestId || 'N/A'}`, 'success');
        e.target.reset(); // Clear the form

        const validityField = document.getElementById('validity');
        if (validityField && currentUser?.validity) {
            validityField.value = currentUser.validity; // Reset validity to default
        }
    } catch (error) {
        logMessage('error', 'Error adding price trigger:', error);
        showAlert('addTriggerAlert', `Failed to add price trigger: ${error.message}. Please try again.`, 'error');
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
}

// Get Triggers functionality
// Get Triggers functionality - FIXED field mapping and data extraction
async function getTriggers() {

    const triggersResultsDiv = document.getElementById('triggersTableBody');
    if (!triggersResultsDiv) {
        logMessage('error', 'triggersResults div not found');
        return;
    }

    triggersResultsDiv.innerHTML = '<div class="empty-state"><div class="btn-loader">Loading...</div><p>Loading your triggers...</p></div>';
    hideAlert('triggersAlert');

    const mobileNumber = currentUser.mobile;
    if (!mobileNumber) {
        logMessage('error', 'Mobile number is missing from currentUser object.');
        showAlert('triggersAlert', 'Mobile number is missing from user data. Please re-login.', 'error');
        triggersResultsDiv.innerHTML = '<div class="empty-state"><p class="error-message">Error: Mobile number not found. Please log in again.</p></div>';
        return;
    }

    try {
        // Step 1: Get all Request IDs for the mobile number
        const mobileTokensApiUrl = `${BASE_URL}/GetMobileNumberTokens?MobileNumber=${mobileNumber}`;
        logMessage('info', 'Calling GetMobileNumberTokens API', { url: mobileTokensApiUrl });

        const mobileTokensResponse = await fetch(mobileTokensApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!mobileTokensResponse.ok) {
            let errorText = await mobileTokensResponse.text();
            try {
                const errorJson = JSON.parse(errorText);
                errorText = errorJson.message || errorText;
            } catch (jsonError) { /* not JSON */ }
            throw new Error(`Failed to fetch tokens: ${mobileTokensResponse.status}. ${errorText}`);
        }

        let mobileTokensData = await mobileTokensResponse.json();

        // Handle double-stringified JSON
        if (typeof mobileTokensData === 'string') {
            try {
                mobileTokensData = JSON.parse(mobileTokensData);
            } catch (e) {
                logMessage('error', 'Failed to parse stringified JSON', { error: e, rawResponse: mobileTokensData });
                throw new Error('Invalid JSON response from tokens API');
            }
        }

        logMessage('success', 'GetMobileNumberTokens Response', mobileTokensData);

        // Extract tokens array with improved parsing
        let tokens = [];
        if (Array.isArray(mobileTokensData.Tokens)) {
            tokens = mobileTokensData.Tokens;
        } else if (typeof mobileTokensData.Tokens === 'string') {
            try {
                const parsed = JSON.parse(mobileTokensData.Tokens);
                if (Array.isArray(parsed)) {
                    tokens = parsed;
                } else if (parsed && Array.isArray(parsed.Tokens)) {
                    tokens = parsed.Tokens;
                } else {
                    logMessage('warn', 'Tokens string could not be parsed to array', mobileTokensData.Tokens);
                }
            } catch (parseError) {
                logMessage('warn', 'Failed to parse tokens string', { error: parseError, tokens: mobileTokensData.Tokens });
            }
        } else if (mobileTokensData.Tokens) {
            logMessage('warn', 'Unexpected tokens format', { type: typeof mobileTokensData.Tokens, value: mobileTokensData.Tokens });
        }

        if (tokens.length === 0) {
            logMessage('info', `No tokens found for mobile: ${mobileNumber}`);
            triggersResultsDiv.innerHTML = '<div class="empty-state"><p>No price triggers found for this mobile number.</p><p>Add a new one to get started!</p></div>';
            allLoadedTriggers = [];
            return;
        }

        logMessage('info', `Found ${tokens.length} tokens, fetching details...`);

        // Step 2: Fetch details for each token
        const fetchPromises = tokens.map(async (requestId) => {
            const requestStatusApiUrl = `${BASE_URL}/GetRequestIdStatus?RequestID=${requestId}`;

            try {
                const response = await fetch(requestStatusApiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    logMessage('warn', `Failed to fetch ${requestId}: ${response.status}`);
                    return null;
                }

                let data = await response.json();

                // Handle double-stringified JSON
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        logMessage('error', `Failed to parse response for ${requestId}`, e);
                        return null;
                    }
                }

                logMessage('info', `Raw API response for ${requestId}:`, data);

                // FIXED: Extract the actual trigger data from ResponseBody
                let triggerData = null;

                if (data && data.ResponseBody) {
                    if (data.ResponseBody === "Not Found") {
                        logMessage('warn', `Trigger ${requestId} not found`);
                        return null;
                    } else if (typeof data.ResponseBody === 'object') {
                        // ResponseBody is an object - use it directly
                        triggerData = data.ResponseBody;
                    } else if (typeof data.ResponseBody === 'string') {
                        try {
                            triggerData = JSON.parse(data.ResponseBody);
                        } catch (parseError) {
                            logMessage('error', `Failed to parse ResponseBody for ${requestId}`, parseError);
                            return null;
                        }
                    }
                } else if (data && data.RequestId) {
                    // Direct response format (fallback)
                    triggerData = data;
                }

                logMessage('debug', `Extracted trigger data for ${requestId}:`, triggerData);

                // Validate and normalize trigger data
                if (triggerData && (triggerData.RequestId || triggerData.RequestID)) {
                    // FIXED: Correct field mapping based on actual API response
                    const normalizedTrigger = {
                        RequestId: triggerData.RequestId || triggerData.RequestID,
                        ProductName: triggerData.ProductName || triggerData.ProductTitle || triggerData.Product || 'Unknown Product',
                        Url: triggerData.Url || triggerData.URL,
                        Price: triggerData.DreamPrice || triggerData.TargetPrice || triggerData.Price, // FIXED: Map DreamPrice to Price
                        CurrentPrice: triggerData.currentprice,
                        Email: triggerData.Email,
                        MobileNumber: triggerData.MobileNumber || triggerData.Mobile,
                        ValidityDays: triggerData.Validity || triggerData.ValidityDays,
                        CreatedAt: triggerData.CreatedDate || triggerData.CreateDate || triggerData.CreatedAt,
                        LastChecked: triggerData.LastChecked,
                        ExpiresAt: triggerData.ExpiryDate || triggerData.ExpireDate || triggerData.ExpiresAt,
                        Enable: triggerData.Enable !== undefined ? triggerData.Enable : true,
                        Status: triggerData.Status
                    };

                    logMessage('success', `Normalized trigger ${requestId}:`, normalizedTrigger);

                    // Enhanced field mapping debug log
                    logMessage('debug', `Field mapping check for ${requestId}:`, {
                        'API Response Keys': Object.keys(triggerData),
                        'Original DreamPrice': triggerData.DreamPrice,
                        'Mapped to Price': normalizedTrigger.Price,
                        'Original Validity': triggerData.Validity,
                        'Mapped to ValidityDays': normalizedTrigger.ValidityDays,
                        'Original Enable': triggerData.Enable,
                        'Mapped Enable': normalizedTrigger.Enable,
                        'Original Status': triggerData.Status,
                        'Mapped Status': normalizedTrigger.Status,
                        'All mapped fields': Object.keys(normalizedTrigger)
                    });

                    return normalizedTrigger;
                } else {
                    logMessage('warn', `Invalid trigger data for ${requestId} - no RequestId found:`, triggerData);
                    return null;
                }

            } catch (error) {
                logMessage('error', `Error fetching ${requestId}:`, error);
                return null;
            }
        });

        // Wait for all requests and filter out nulls
        const results = await Promise.all(fetchPromises);
        allLoadedTriggers = results.filter(trigger => trigger !== null);

        logMessage('success', `Successfully loaded ${allLoadedTriggers.length} triggers:`, allLoadedTriggers);

        // Enhanced debug logging for the final structure
        if (allLoadedTriggers.length > 0) {
            logMessage('debug', 'Final triggers array structure:', allLoadedTriggers);
            logMessage('debug', 'First trigger final structure:', allLoadedTriggers[0]);
            logMessage('debug', 'Sample trigger fields:', {
                'ProductName': allLoadedTriggers[0].ProductName,
                'Price': allLoadedTriggers[0].Price,
                'CurrentPrice': allLoadedTriggers[0].CurrentPrice,
                'Url': allLoadedTriggers[0].Url,
                'Status': allLoadedTriggers[0].Status,
                'Enable': allLoadedTriggers[0].Enable
            });
        }

        // Render the triggers
        if (allLoadedTriggers.length > 0) {
            renderTriggers(allLoadedTriggers);
            showAlert('triggersAlert', `Successfully loaded ${allLoadedTriggers.length} price triggers.`, 'success');

            // Auto-hide success message after 3 seconds
            setTimeout(() => hideAlert('triggersAlert'), 3000);
        } else {
            triggersResultsDiv.innerHTML = '<div class="empty-state"><p>No active price triggers to display.</p><p>Add a new one to get started!</p></div>';
            showAlert('triggersAlert', 'No active price triggers found.', 'info');
        }

    } catch (error) {
        logMessage('fatal', 'Error in getTriggers:', error);
        // triggersResultsDiv.innerHTML = `<div class="empty-state"><p class="error-message">Error loading triggers: ${error.message}</p><p>Please try again later.</p></div>`;
        // showAlert('triggersAlert', `Failed to load triggers: ${error.message}`, 'error');
        allLoadedTriggers = [];
    }
}

function initializeSearch() {
    const searchInput = document.querySelector('#searchTriggers');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            logMessage && logMessage('info', `Searching triggers with term: "${searchTerm}"`);

            // Call the existing filterTriggers function that works with the rendered table
            filterTriggers();
        });

        logMessage && logMessage('info', 'Search functionality initialized');
    } else {
        logMessage && logMessage('warn', 'Search input element not found');
    }
}

function filterTriggers() {
    const searchInput = document.getElementById('searchTriggers');
    const statusFilter = document.getElementById('statusFilter');
    const tableBody = document.getElementById('triggersTableBody');

    if (!searchInput || !tableBody) {
        logMessage && logMessage('warn', 'Search input or table body not found');
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusValue = statusFilter ? statusFilter.value.toLowerCase() : '';

    logMessage && logMessage('info', `Filtering triggers - Search: "${searchTerm}", Status: "${statusValue}"`);

    // Get all table rows
    const rows = tableBody.querySelectorAll('tr.trigger-row');
    let visibleCount = 0;

    rows.forEach(row => {
        let showRow = true;

        // Search filter - check multiple columns based on correct table structure
        // Column order: Request ID, Product, Status, Target Price, IsEnable, URL, Contact, Validity, Actions
        if (searchTerm) {
            const searchableText = [
                row.cells[0]?.textContent || '', // Request ID
                row.cells[1]?.textContent || '', // Product name
                row.cells[1]?.title || '',       // Full product name from title
                row.cells[5]?.textContent || '', // URL
                row.cells[6]?.textContent || '', // Contact info
                row.cells[6]?.title || ''        // Full contact info from title
            ].join(' ').toLowerCase();

            showRow = searchableText.includes(searchTerm);
        }

        // Status filter - check Status column only
        if (showRow && statusValue) {
            const statusCell = row.cells[2]; // Status column (index 2)
            
            // Get the displayed status text from the status-display span
            const statusDisplayElement = statusCell?.querySelector('.status-display');
            const statusText = statusDisplayElement?.textContent?.toLowerCase().trim() || '';

            logMessage && logMessage('debug', `Row status text: "${statusText}", Filter value: "${statusValue}"`);

            // Direct comparison with the status values
            const statusMatch = statusText === statusValue;

            showRow = statusMatch;
        }

        // Show/hide row
        if (showRow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show message if no results
    const existingMessage = tableBody.querySelector('.no-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    if (visibleCount === 0 && rows.length > 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.className = 'no-results-message';
        noResultsRow.innerHTML = `
            <td colspan="10" style="text-align: center; padding: 40px; color: #6b7280; font-style: italic;">
                No triggers found matching your search criteria.
                ${searchTerm ? `<br>Search term: "${searchTerm}"` : ''}
                ${statusValue ? `<br>Status filter: "${statusValue}"` : ''}
            </td>
        `;
        tableBody.appendChild(noResultsRow);
    }

    logMessage && logMessage('info', `Filter complete - ${visibleCount} triggers visible out of ${rows.length}`);
}
// Remove unused functions - keeping only what's needed
function initializeFilters() {
    // Initialize search only
    initializeSearch();
}




// Enhanced renderTriggers function with better data handling
// Enhanced renderTriggers function with better data handling and logging
function renderTriggers(triggersArray) {
    const triggersResultsDiv = document.getElementById('triggersTableBody');
    if (!triggersResultsDiv) {
        logMessage('error', 'triggersTableBody div not found');
        return;
    }

    // Store the triggers globally for filtering
    window.allLoadedTriggers = triggersArray;

    if (!Array.isArray(triggersArray) || triggersArray.length === 0) {
        triggersResultsDiv.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #6b7280;">
                    No triggers to display.
                </td>
            </tr>`;
        return;
    }

    // Render all triggers (filtering will be handled by filterTriggers)
    triggersResultsDiv.innerHTML = triggersArray.map(trigger => renderTriggerRow(trigger)).join('');

    logMessage('success', `Successfully rendered ${triggersArray.length} triggers`);

    // Apply current filters after rendering
    filterTriggers();
}

function renderTriggerRow(trigger) {
    // Status handling
    let EnableClass = 'status-inactive';
    let EnableStatus = trigger.Enable ? 'Active' : 'Inactive';
    EnableClass = trigger.Enable ? 'status-active' : 'status-inactive';

    // Status enum mapping
    const statusMap = {
        0: 'Pending',
        1: 'Active', 
        2: 'Hold',
        3: 'Complete',
        4: 'Expire',
        5: 'Blocked',
        6: 'Deleted',
        7: 'Updated'
    };

    const currentStatus = statusMap[trigger.Status] || 'Unknown';

    // Helper functions
    const formatPrice = (price) => {
        if (!price || price === 0) return 'N/A';
        const numPrice = parseFloat(price);
        return isNaN(numPrice) ? 'N/A' : `$${numPrice.toFixed(2)}`;
    };

    const safeValue = (value, maxLength = null) => {
        const val = value || 'N/A';
        if (maxLength && val.length > maxLength) {
            return val.substring(0, maxLength - 3) + '...';
        }
        return val;
    };

    const requestId = trigger.RequestId || 'N/A';
    const contactInfo = trigger.Email || trigger.MobileNumber || 'N/A';

    // --- Updated: Add Current Price column after Target Price ---
    // Use trigger.currentprice if present, else trigger.CurrentPrice
    const currentPriceValue = trigger.currentprice !== undefined && trigger.currentprice !== null
        ? trigger.currentprice
        : (trigger.CurrentPrice !== undefined ? trigger.CurrentPrice : '');

    return `
        <tr class="trigger-row" data-request-id="${requestId}">
            <td title="${requestId}">${safeValue(requestId, 15)}</td>
            <td title="${trigger.ProductName || 'N/A'}">${safeValue(trigger.ProductName, 25)}</td>
            <td class="status-cell">
                <span class="status-display">${currentStatus}</span>
                <select class="status-edit" style="display: none;">
                    <option value="0" ${trigger.Status == 0 ? 'selected' : ''}>Pending</option>
                    <option value="1" ${trigger.Status == 1 ? 'selected' : ''}>Active</option>
                    <option value="2" ${trigger.Status == 2 ? 'selected' : ''}>Hold</option>
                    <option value="3" ${trigger.Status == 3 ? 'selected' : ''}>Complete</option>
                    <option value="4" ${trigger.Status == 4 ? 'selected' : ''}>Expire</option>
                    <option value="5" ${trigger.Status == 5 ? 'selected' : ''}>Blocked</option>
                    <option value="6" ${trigger.Status == 6 ? 'selected' : ''}>Deleted</option>
                    <option value="7" ${trigger.Status == 7 ? 'selected' : ''}>Updated</option>
                </select>
            </td>
            <td>${formatPrice(trigger.Price)}</td>
            <td>${formatPrice(currentPriceValue)}</td>
            <td class="enable-cell">
                <span class="enable-display">
                    <span class="status-tag ${EnableClass}">${EnableStatus}</span>
                </span>
                <select class="enable-edit" style="display: none;">
                    <option value="true" ${trigger.Enable ? 'selected' : ''}>Enable</option>
                    <option value="false" ${!trigger.Enable ? 'selected' : ''}>Disable</option>
                </select>
            </td>
            <td title="${trigger.Url || 'N/A'}">${safeValue(trigger.Url, 30)}</td>
            <td title="${contactInfo}">${safeValue(contactInfo, 20)}</td>
            <td>${trigger.ValidityDays || 'N/A'}</td>
            <td class="action-cell">
                <button class="edit-btn" onclick="editRow('${requestId}')" style="display:inline-block;">Edit</button>
                <button class="save-btn" onclick="saveRow('${requestId}')" style="display: none;">Save</button>
                <button class="cancel-btn" onclick="cancelEdit('${requestId}')" style="display: none;">Cancel</button>
            </td>
        </tr>
    `;
}

// Edit functionality
function editRow(requestId) {
    const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
    if (!row) return;

    // Hide display elements and show edit elements
    const statusDisplay = row.querySelector('.status-display');
    const statusEdit = row.querySelector('.status-edit');
    const enableDisplay = row.querySelector('.enable-display');
    const enableEdit = row.querySelector('.enable-edit');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');

    statusDisplay.style.display = 'none';
    statusEdit.style.display = 'inline-block';
    enableDisplay.style.display = 'none';
    enableEdit.style.display = 'inline-block';
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
}

function cancelEdit(requestId) {
    const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
    if (!row) return;

    // Show display elements and hide edit elements
    const statusDisplay = row.querySelector('.status-display');
    const statusEdit = row.querySelector('.status-edit');
    const enableDisplay = row.querySelector('.enable-display');
    const enableEdit = row.querySelector('.enable-edit');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');

    statusDisplay.style.display = 'inline';
    statusEdit.style.display = 'none';
    enableDisplay.style.display = 'inline';
    enableEdit.style.display = 'none';
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

async function saveRow(requestId) {
    const row = document.querySelector(`tr[data-request-id="${requestId}"]`);
    if (!row) return;

    const statusSelect = row.querySelector('.status-edit');
    const enableSelect = row.querySelector('.enable-edit');
    
    const newStatus = statusSelect.value;
    const newEnable = enableSelect.value === 'true';

    // Here you would call your API
    // updateStatusAPI(requestId, newStatus, newEnable);
    console.log(`Calling API: UpdateStatus?RequestId=${requestId}&Status=${newStatus}&notificationEnable=${newEnable}`);

     
      
     const apiUrl = `${BASE_URL}/UpdateStatus?RequestId=${requestId}&Status=${newStatus}&notificationEnable=${newEnable}`;
       

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });


    // Exit edit mode
    cancelEdit(requestId);
    getTriggers();
    
}