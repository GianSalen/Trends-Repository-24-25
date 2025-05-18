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

        });
    }
    
    // Helper function to show error
    function showError(message) {
        // Remove any existing error messages
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
});