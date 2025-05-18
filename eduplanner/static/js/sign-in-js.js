/**
 * Sign-in JavaScript
 * Handles user registration functionality including form validation,
 * terms and conditions modals, and account creation.
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners for modals
    setupModalListeners();
    setupFormValidation();
    setupFormSubmission();
    setupEmailValidation(); // New function for email validation
});

// Set up event listeners for terms and privacy modals
function setupModalListeners() {
    // Get modal elements
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Set up terms link
    const termsLink = document.getElementById('termsLink');
    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.style.display = 'flex';
            setTimeout(() => {
                termsModal.classList.add('show');
            }, 10);
        });
    }
    
    // Set up privacy link
    const privacyLink = document.getElementById('privacyLink');
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.style.display = 'flex';
            setTimeout(() => {
                privacyModal.classList.add('show');
            }, 10);
        });
    }
    
    // Set up close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Match this with the CSS transition time
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            setTimeout(() => {
                e.target.style.display = 'none';
            }, 300);
        }
    });
}

// Set up form validation for the sign-in form
function setupFormValidation() {
    const nameInput = document.getElementById('name');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (nameInput) {
        nameInput.addEventListener('blur', validateName);
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('blur', validateUsername);
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', validatePassword);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    }
}

// Set up form submission with validation
function setupFormSubmission() {
    const form = document.getElementById('signInForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log("Submit button clicked");
            
            // Log validation results
            const isNameValid = validateName();
            const isUsernameValid = validateUsername();
            const isEmailValid = validateEmail();
            const isPasswordValid = validatePassword();
            const isConfirmPasswordValid = validateConfirmPassword();
            
            console.log({
                isNameValid,
                isUsernameValid, 
                isEmailValid,
                isPasswordValid,
                isConfirmPasswordValid
            });
            
            if (!isNameValid || !isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
                console.log("Validation failed - Form not submitting");
                return;
            }
            
            console.log("All validation passed - Attempting AJAX submission");
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Processing...';
            submitButton.disabled = true;
            
            // Continued AJAX code...
        });
    }
}

// New function to set up email validation
function setupEmailValidation() {
    const emailField = document.getElementById('email');
    const emailErrorSpan = document.createElement('span');
    emailErrorSpan.className = 'error-message';
    emailErrorSpan.style.display = 'none';
    
    // Insert error message span after the email field
    if (emailField) {
        emailField.parentNode.insertBefore(emailErrorSpan, emailField.nextSibling);
        
        // Debounce function to prevent too many requests
        let debounceTimeout;
        
        // Add event listener for email field
        emailField.addEventListener('input', function() {
            const email = this.value.trim();
            
            // Clear previous timeout
            clearTimeout(debounceTimeout);
            
            // Reset field styling
            emailField.style.borderColor = '';
            emailErrorSpan.style.display = 'none';
            
            // Check email after typing stops for 500ms
            debounceTimeout = setTimeout(() => {
                // Basic email validation
                if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    // Check if email exists in the database
                    checkEmailExists(email);
                }
            }, 500);
        });
    }
    
    // Function to check if email already exists
    function checkEmailExists(email) {
        // Create a request to your backend endpoint
        fetch('/check-email-exists/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCsrfToken()
            },
            body: `email=${encodeURIComponent(email)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                // Email already exists
                emailField.style.borderColor = '#ef4444';
                emailErrorSpan.textContent = 'This email is already registered.';
                emailErrorSpan.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error checking email:', error);
        });
    }
    
    // Function to get CSRF token
    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
}

// Helper functions to show messages
function showSuccessMessage(message) {
    // Remove any existing messages
    removeMessages();
    
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message-container';
    successDiv.textContent = message;
    
    // Insert at the top of the form
    const form = document.getElementById('signInForm');
    form.parentNode.insertBefore(successDiv, form);
}

function showErrorMessage(message) {
    // Remove any existing messages
    removeMessages();
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message-container';
    errorDiv.textContent = message;
    
    // Insert at the top of the form
    const form = document.getElementById('signInForm');
    form.parentNode.insertBefore(errorDiv, form);
}

function removeMessages() {
    const messages = document.querySelectorAll('.success-message-container, .error-message-container');
    messages.forEach(msg => msg.remove());
}

/**
 * Validate the name field
 * @returns {boolean} True if valid, false otherwise
 */
function validateName() {
    const nameInput = document.getElementById('name');
    if (!nameInput) return true;
    
    const name = nameInput.value.trim();
    
    if (name.length < 2) {
        showError(nameInput, 'Name must be at least 2 characters');
        return false;
    }
    
    removeError(nameInput);
    return true;
}

/**
 * Validate the username field
 * @returns {boolean} True if valid, false otherwise
 */
function validateUsername() {
    const usernameInput = document.getElementById('username');
    if (!usernameInput) return true;
    
    const username = usernameInput.value.trim();
    
    if (username.length < 4) {
        showError(usernameInput, 'Username must be at least 4 characters');
        return false;
    }
    
    // Only allow alphanumeric characters and underscore
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        showError(usernameInput, 'Username can only contain letters, numbers, and underscores');
        return false;
    }
    
    removeError(usernameInput);
    return true;
}

/**
 * Validate the email field
 * @returns {boolean} True if valid, false otherwise
 */
function validateEmail() {
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

/**
 * Validate the password field
 * @returns {boolean} True if valid, false otherwise
 */
function validatePassword() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return true;
    
    const password = passwordInput.value;
    
    if (password.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters');
        return false;
    }
    
    // Check password strength
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!(hasLower && hasUpper && hasNumber)) {
        showError(passwordInput, 'Password must contain uppercase, lowercase, and number');
        return false;
    }
    
    removeError(passwordInput);
    return true;
}

/**
 * Validate the confirm password field
 * @returns {boolean} True if valid, false otherwise
 */
function validateConfirmPassword() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (!confirmPasswordInput || !passwordInput) return true;
    
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (password !== confirmPassword) {
        showError(confirmPasswordInput, 'Passwords do not match');
        return false;
    }
    
    removeError(confirmPasswordInput);
    return true;
}

/**
 * Show an error message for an input field
 * @param {HTMLElement} input - The input element
 * @param {string} message - The error message
 */
function showError(input, message) {
    const formGroup = input.parentElement;
    const errorMessage = formGroup.querySelector('.error-message') || document.createElement('span');
    
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    if (!formGroup.querySelector('.error-message')) {
        formGroup.appendChild(errorMessage);
    }
    
    formGroup.classList.add('error');
    input.classList.add('error-input');
}

/**
 * Remove error styling and message from an input field
 * @param {HTMLElement} input - The input element
 */
function removeError(input) {
    const formGroup = input.parentElement;
    const errorMessage = formGroup.querySelector('.error-message');
    
    if (errorMessage) {
        formGroup.removeChild(errorMessage);
    }
    
    formGroup.classList.remove('error');
    input.classList.remove('error-input');
}


