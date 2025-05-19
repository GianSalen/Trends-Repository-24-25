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
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (nameInput) {
        nameInput.addEventListener('blur', validateName);
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
            
            // Only check first name, last name, email and password
            const isFirstNameValid = validateField('first-name', 'First name is required');
            const isLastNameValid = validateField('last-name', 'Last name is required');
            const isEmailValid = validateEmail();
            const isPasswordValid = validatePassword();
            const isConfirmPasswordValid = validateConfirmPassword();
            
            console.log({
                isFirstNameValid,
                isLastNameValid, 
                isEmailValid,
                isPasswordValid,
                isConfirmPasswordValid
            });
            
            if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
                console.log("Validation failed - Form not submitting");
                return;
            }
            
            console.log("All validation passed - Attempting AJAX submission");
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            
            // Get form data and create FormData object
            const formData = new FormData(form);
            
            // Get CSRF token
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            // Log the form data being sent for debugging
            for (const pair of formData.entries()) {
                console.log(`${pair[0]}: ${pair[1]}`);
            }
            
            // Send AJAX request to the correct Django URL
            fetch('/register/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                credentials: 'same-origin'
            })
            .then(response => {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json().then(data => {
                        if (!response.ok) {
                            throw new Error(data.message || `Server error: ${response.status}`);
                        }
                        return data;
                    });
                } else {
                    // If not JSON, handle as text
                    return response.text().then(text => {
                        if (!response.ok) {
                            throw new Error(`Server error: ${text || response.status}`);
                        }
                        // Try to parse as JSON anyway
                        try {
                            return JSON.parse(text);
                        } catch(e) {
                            console.log("Response is not JSON:", text);
                            // If it's not JSON and it's a 200 OK, it might be a redirect HTML
                            if(response.ok && text.includes('<html')) {
                                // Handle HTML response (likely a redirect page)
                                return { success: true, html_response: true };
                            }
                            return { success: true, message: "Registration successful!" };
                        }
                    });
                }
            })
            .then(data => {
                console.log('Registration successful:', data);
                
                // Show success message to user
                showSuccessMessage(data.message || 'Registration successful! Please check your email to verify your account.');
                
                // If server provided HTML, we might need to handle a redirect
                if (data.html_response) {
                    // Either redirect to login page or replace document with response
                    window.location.href = '/login/';
                    return;
                }
                
                // Optional: Redirect after successful registration
                if (data.redirect_url) {
                    setTimeout(() => {
                        window.location.href = data.redirect_url;
                    }, 2000);
                } else {
                    // Default redirect if none provided
                    setTimeout(() => {
                        window.location.href = '/login/';
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Registration error:', error);
                showErrorMessage(error.message || 'Registration failed. Please try again.');
            })
            .finally(() => {
                // Reset button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            });
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

document.addEventListener('DOMContentLoaded', function() {
  const signInForm = document.getElementById('signInForm');
  
  if (signInForm) {
    signInForm.addEventListener('submit', function(e) {
      const firstNameInput = document.getElementById('first-name');
      const lastNameInput = document.getElementById('last-name');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirm-password');
      
      // Form validation
      if (!firstNameInput.value.trim()) {
        e.preventDefault();
        alert('Please enter your first name');
        firstNameInput.focus();
        return;
      }
      
      if (!lastNameInput.value.trim()) {
        e.preventDefault();
        alert('Please enter your last name');
        lastNameInput.focus();
        return;
      }
      
      if (!emailInput.value.trim()) {
        e.preventDefault();
        alert('Please enter your email address');
        emailInput.focus();
        return;
      }
      
      // Check if passwords match
      if (passwordInput.value !== confirmPasswordInput.value) {
        e.preventDefault();
        alert('Passwords do not match');
        confirmPasswordInput.focus();
        return;
      }
    });
  }
});

// Helper function to validate a generic field
function validateField(fieldId, errorMessage) {
    const input = document.getElementById(fieldId);
    if (!input) return true;
    
    const value = input.value.trim();
    
    if (!value) {
        showError(input, errorMessage);
        return false;
    }
    
    removeError(input);
    return true;
}


