// Simple localStorage-based authentication for demo purposes

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
}

function findUser(email) {
    return getUsers().find(u => u.email === email);
}

function setLoggedInUser(email) {
    localStorage.setItem('loggedInUser', email);
}

function getLoggedInUser() {
    return localStorage.getItem('loggedInUser');
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}
window.logout = logout;

function isValidEmail(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Signup logic
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;
        const errorDiv = document.getElementById('signupError');
        errorDiv.textContent = '';

        if (!name || !email || !password || !confirm) {
            errorDiv.textContent = 'Please fill in all fields.';
            return;
        }
        if (!isValidEmail(email)) {
            errorDiv.textContent = 'Please enter a valid email address.';
            return;
        }
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters.';
            return;
        }
        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match.';
            return;
        }
        if (findUser(email)) {
            errorDiv.textContent = 'Email is already registered.';
            return;
        }
        saveUser({ name, email, password });
        setLoggedInUser(email);
        window.location.href = 'index.html';
    });
}

// Login logic
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = '';
        if (!isValidEmail(email)) {
            errorDiv.textContent = 'Please enter a valid email address.';
            return;
        }
        const user = findUser(email);
        if (!user || user.password !== password) {
            errorDiv.textContent = 'Invalid email or password.';
            return;
        }
        setLoggedInUser(email);
        window.location.href = 'index.html';
    });
}

// Protect index.html (main app) if not logged in
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
    if (!getLoggedInUser()) {
        window.location.href = 'login.html';
    }
} 