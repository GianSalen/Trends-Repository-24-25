/**
 * Login JavaScript
 * Handles login form validation and submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Basic validation
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                e.preventDefault();
                showError('Please enter both username and password');
                return;
            }

            // Validate email before submitting
            if (!validateEmailLogin()) {
                e.preventDefault();
            }
        });
    }
    
    // Helper function to show error
    function showError(message) {
        const existingError = document.querySelector('.error-message-container');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and show new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message-container';
        errorDiv.textContent = message;
        
        const formHeader = document.querySelector('.form-header');
        formHeader.insertAdjacentElement('afterend', errorDiv);
    }

    function validateEmailLogin() {
        const emailInput = document.getElementById('email');
        if (!emailInput) return true;
        
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            showError(emailInput, 'Please enter a valid email address');
            return false;
        }
        
        removeError(emailInput);
        return true;
    }

    // Toggle password visibility function (if you have one)
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.toggle-password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = 'visibility_off';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility';
        }
    }
});