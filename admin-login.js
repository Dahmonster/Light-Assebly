const API_BASE = 'https://light-assembly.onrender.com/api';

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('loginMessage');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json(); // ✅ GET RESPONSE BODY

        if (response.ok && data.token) {

            // ✅ SAVE TOKEN (THIS FIXES EVERYTHING)
            localStorage.setItem('token', data.token);

            // optional
            localStorage.setItem('adminUser', username);

            // redirect
            window.location.href = 'dashboard.html';

        } else {
            messageEl.textContent = data.message || 'Invalid username or password';
            messageEl.className = 'error';
        }

    } catch (error) {
        console.error('Login error:', error);
        messageEl.textContent = 'Error connecting to server';
        messageEl.className = 'error';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});
