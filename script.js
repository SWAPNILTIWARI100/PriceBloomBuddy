// ========================================
// PRICEBLOOMBUDDY - Shared Authentication & Navigation
// ========================================

let currentUser = null;


// ---------- Auth State Management ----------
function loadSession() {
  const saved = localStorage.getItem('pricebloom_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateUIForLoggedInUser();
    } catch (e) {
      console.error('Failed to parse user session', e);
    }
  } else {
    updateUIForLoggedOutUser();
  }
}

function saveSession(user) {
  if (user) {
    localStorage.setItem('pricebloom_user', JSON.stringify(user));
    currentUser = user;
    updateUIForLoggedInUser();
  } else {
    localStorage.removeItem('pricebloom_user');
    currentUser = null;
    updateUIForLoggedOutUser();
  }
}

function logout() {
  saveSession(null);
  showToast('You have been signed out', 'info');
  redirectTo('index.html');
}

// ---------- Toast Notifications ----------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-error' : (type === 'success' ? 'bg-primary' : 'bg-surface-container-high');
  const textColor = type === 'error' ? 'text-on-error' : (type === 'success' ? 'text-on-primary' : 'text-on-background');
  
  toast.className = `toast-notification ${bgColor} ${textColor} rounded-xl shadow-lg p-4 flex items-start gap-3 max-w-sm border border-outline-variant/20`;
  toast.innerHTML = `
    <span class="material-symbols-outlined flex-shrink-0">${type === 'error' ? 'error' : (type === 'success' ? 'check_circle' : 'info')}</span>
    <div class="flex-1 text-sm font-medium">${message}</div>
    <button class="toast-close text-current opacity-70 hover:opacity-100">&times;</button>
  `;
  
  container.appendChild(toast);
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// ---------- Navigation ----------
function redirectTo(page) {
  window.location.href = page;
}

function requireAuth(redirectPage = 'createaccount.html') {
  if (!currentUser) {
    showToast('Please sign in to access this page', 'error');
    setTimeout(() => {
      redirectTo(redirectPage);
    }, 500);
  }
}

// ---------- UI Updates ----------
function updateUIForLoggedInUser() {
  // Update navbar auth button
  const authNavBtn = document.getElementById('auth-nav-btn');
  const authNavText = document.getElementById('auth-nav-text');
  
  if (authNavBtn && authNavText) {
    authNavText.textContent = 'My Profile';
    authNavBtn.onclick = (e) => {
      e.preventDefault();
      redirectTo('profile.html');
    };
  }

  // Update dashboard user name
  if (currentUser && document.getElementById('dashboard-user-name')) {
    document.getElementById('dashboard-user-name').textContent = currentUser.name || currentUser.email.split('@')[0];
  }

  // Update profile page
  if (currentUser && document.getElementById('profile-name')) {
    document.getElementById('profile-name').textContent = currentUser.name || 'User';
    document.getElementById('profile-email').textContent = currentUser.email;
  }

  // Hide login/signup buttons in navbar
  const loggedOutView = document.getElementById('dropdown-loggedout-view');
  const loggedInView = document.getElementById('dropdown-loggedin-view');
  if (loggedOutView) loggedOutView.classList.add('hidden');
  if (loggedInView) loggedInView.classList.remove('hidden');

  // Update dropdown email
  const userEmailSpan = document.getElementById('dropdown-user-email');
  if (userEmailSpan) userEmailSpan.textContent = currentUser.email;
}

function updateUIForLoggedOutUser() {
  // Update navbar auth button
  const authNavBtn = document.getElementById('auth-nav-btn');
  const authNavText = document.getElementById('auth-nav-text');
  
  if (authNavBtn && authNavText) {
    authNavText.textContent = 'Sign In';
    authNavBtn.onclick = (e) => {
      e.preventDefault();
      redirectTo('createaccount.html');
    };
  }

  // Hide profile info
  const loggedOutView = document.getElementById('dropdown-loggedout-view');
  const loggedInView = document.getElementById('dropdown-loggedin-view');
  if (loggedOutView) loggedOutView.classList.remove('hidden');
  if (loggedInView) loggedInView.classList.add('hidden');
}

// ---------- Mock Auth Functions ----------
function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password && password.length >= 3) {
        const user = {
          email: email,
          name: email.split('@')[0],
          id: 'user_' + Date.now()
        };
        resolve(user);
      } else {
        reject(new Error('Invalid email or password (min 3 chars)'));
      }
    }, 300);
  });
}

function signupUser(name, email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (name && email && password && password.length >= 3) {
        const user = {
          email: email,
          name: name,
          id: 'user_' + Date.now()
        };
        resolve(user);
      } else {
        reject(new Error('Please fill all fields correctly (password min 3 chars)'));
      }
    }, 300);
  });
}

// ---------- Navigation Setup ----------
function setupNavigation() {
  // Home nav
  document.getElementById('nav-home')?.addEventListener('click', () => redirectTo('index.html'));
  document.getElementById('footer-home')?.addEventListener('click', () => redirectTo('index.html'));

  // Dashboard nav (Protected)
  document.getElementById('nav-dashboard')?.addEventListener('click', () => {
    if (currentUser) redirectTo('dashboard.html');
    else requireAuth();
  });
  document.getElementById('footer-dashboard')?.addEventListener('click', () => {
    if (currentUser) redirectTo('dashboard.html');
    else requireAuth();
  });

  // Trackers nav (Protected)
  document.getElementById('nav-trackers')?.addEventListener('click', () => {
    if (currentUser) redirectTo('mytracker.html');
    else requireAuth();
  });
  document.getElementById('footer-trackers')?.addEventListener('click', () => {
    if (currentUser) redirectTo('mytracker.html');
    else requireAuth();
  });

  // Pricing nav
  document.getElementById('nav-pricing')?.addEventListener('click', () => redirectTo('subscription.html'));
  document.getElementById('footer-pricing')?.addEventListener('click', () => redirectTo('subscription.html'));

  // Add Link (Protected)
  document.getElementById('add-link-btn')?.addEventListener('click', () => {
    if (currentUser) redirectTo('addtracker.html');
    else requireAuth();
  });

  // Notifications (Protected)
  document.getElementById('notifications-btn')?.addEventListener('click', () => {
    if (currentUser) showToast('No new notifications', 'info');
    else requireAuth();
  });

  // Auth buttons in dropdown
  document.getElementById('login-dropdown-btn')?.addEventListener('click', () => redirectTo('createaccount.html'));
  document.getElementById('signup-dropdown-btn')?.addEventListener('click', () => redirectTo('createaccount.html'));
  document.getElementById('myprofile-dropdown-btn')?.addEventListener('click', () => {
    if (currentUser) redirectTo('profile.html');
    else requireAuth();
  });
  document.getElementById('logout-dropdown-btn')?.addEventListener('click', logout);

  // Get Started buttons
  document.querySelectorAll('.get-started-btn').forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentUser) redirectTo('dashboard.html');
      else redirectTo('createaccount.html');
    });
  });

  // How it works
  document.getElementById('how-it-works-btn')?.addEventListener('click', () => {
    showToast('Set target price → We monitor 24/7 → Get alerts when price drops!', 'info');
  });

  // Dropdown toggle
  const dropdownBtn = document.getElementById('account-menu-btn');
  const dropdown = document.getElementById('account-dropdown');
  
  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }
}

// ---------- Initialize on Page Load ----------
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  setupNavigation();
  
  // Show welcome message if logged in
  if (currentUser) {
    setTimeout(() => {
      showToast(`Welcome back, ${currentUser.name}!`, 'success');
    }, 300);
  }
});