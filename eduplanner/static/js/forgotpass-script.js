/**
 * Forgot Password Script
 * Handles the password recovery functionality including email validation,
 * reset token generation, and password reset process.
 *
 * BACKEND IMPLEMENTATION NEEDED:
 * - Replace localStorage with secure database storage
 * - Implement proper email verification system
 * - Use secure token generation and validation
 * - Add proper password hashing
 */

// Storage for user data (replace with database in production)
let users = JSON.parse(localStorage.getItem('users')) || [];
let resetTokens = JSON.parse(localStorage.getItem('resetTokens')) || [];

/**
 * Initialize event listeners when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const resetForm = document.getElementById('resetPasswordForm');
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotSubmit);
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetSubmit);
    }
    
    // Check if this is a reset page with token
    checkResetToken();
});

document.addEventListener('DOMContentLoaded', function() {
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  
  window.handleForgotPassword = function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    
    // Show loading state on button
    const resetButton = document.querySelector('.reset-button');
    const originalButtonText = resetButton.textContent;
    resetButton.textContent = 'Processing...';
    resetButton.disabled = true;
    
    // Simulate API call for password reset
    setTimeout(() => {
      // Success message
      forgotPasswordForm.innerHTML = `
        <div class="success-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9747ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>Check Your Email</h2>
          <p>We've sent password reset instructions to <strong>${email}</strong></p>
          <p class="help-text">If you don't see the email in your inbox, please check your spam folder.</p>
          <a href="{% url 'login' %}" class="login-link">Return to Login</a>
        </div>
      `;
      
      // Add success styles
      const style = document.createElement('style');
      style.textContent = `
        .success-message {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fadeIn 0.5s ease-out;
        }
        .success-message svg {
          margin-bottom: 24px;
          animation: checkmark 0.5s ease-out 0.2s both;
        }
        .success-message h2 {
          color: #090914;
          font-size: 24px;
          margin-bottom: 16px;
        }
        .success-message p {
          color: #64748b;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .success-message .help-text {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 24px;
        }
        .login-link {
          display: inline-block;
          padding: 12px 24px;
          background-color: #9747ff;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .login-link:hover {
          background-color: #8033FF;
          transform: translateY(-2px);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes checkmark {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }, 1500);
  };
});

/**
 * Handle the forgot password form submission
 * BACKEND IMPLEMENTATION NEEDED: Generate reset token and send email
 * @param {Event} event - The form submission event
 */
function handleForgotSubmit(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    // Validate email format
    if (!validateEmail(email)) {
        showError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    // Check if user exists
    const user = users.find(user => user.email === email);
    if (!user) {
        showError(emailInput, 'No account found with this email');
        return;
    }
    
    // Generate reset token (in production, use a secure method)
    const token = generateToken();
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
    
    // Save token
    resetTokens = resetTokens.filter(rt => rt.email !== email); // Remove any existing tokens
    resetTokens.push({
        email,
        token,
        expiryTime
    });
    localStorage.setItem('resetTokens', JSON.stringify(resetTokens));
    
    // In production, send email with reset link
    // For demo, show reset link
    const resetLink = `forgotpass.html?token=${token}`;
    
    // Show success message
    document.querySelector('.form-container').innerHTML = `
        <div class="success-message">
            <h2>Password Reset Email Sent</h2>
            <p>We've sent a password reset link to <strong>${email}</strong>.</p>
            <p>Please check your email and follow the instructions to reset your password.</p>
            <p>(For demo purposes, use this link: <a href="${resetLink}">${resetLink}</a>)</p>
            <p><a href="log-in.html">Back to Login</a></p>
        </div>
    `;
}

/**
 * Check if the page was loaded with a reset token and show appropriate form
 * BACKEND IMPLEMENTATION NEEDED: Validate token from database
 */
function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        // No token, show forgot password form
        document.getElementById('forgotPasswordForm').style.display = 'block';
        document.getElementById('resetPasswordForm').style.display = 'none';
        return;
    }
    
    // Validate token
    const resetToken = resetTokens.find(rt => rt.token === token);
    if (!resetToken || resetToken.expiryTime < Date.now()) {
        // Invalid or expired token
        document.querySelector('.form-container').innerHTML = `
            <div class="error-message">
                <h2>Invalid or Expired Link</h2>
                <p>Your password reset link is invalid or has expired.</p>
                <p><a href="forgotpass.html">Request a new password reset link</a></p>
            </div>
        `;
        return;
    }
    
    // Valid token, show reset password form
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'block';
    
    // Store token in form for submission
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    document.getElementById('resetPasswordForm').appendChild(tokenInput);
}

/**
 * Handle the password reset form submission
 * BACKEND IMPLEMENTATION NEEDED: Update user password in database
 * @param {Event} event - The form submission event
 */
function handleResetSubmit(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const tokenInput = document.querySelector('input[name="token"]');
    const token = tokenInput.value;
    
    // Validate password
    if (password.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters');
        return;
    }
    
    // Check password strength
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!(hasLower && hasUpper && hasNumber)) {
        showError(passwordInput, 'Password must contain uppercase, lowercase, and number');
        return;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
        showError(confirmPasswordInput, 'Passwords do not match');
        return;
    }
    
    // Find token
    const resetToken = resetTokens.find(rt => rt.token === token);
    if (!resetToken || resetToken.expiryTime < Date.now()) {
        showError(passwordInput, 'Your reset link has expired');
        return;
    }
    
    // Update user password
    const userIndex = users.findIndex(user => user.email === resetToken.email);
    if (userIndex !== -1) {
        users[userIndex].password = password; // In production, hash this password
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Remove used token
    resetTokens = resetTokens.filter(rt => rt.token !== token);
    localStorage.setItem('resetTokens', JSON.stringify(resetTokens));
    
    // Show success message
    document.querySelector('.form-container').innerHTML = `
        <div class="success-message">
            <h2>Password Reset Successfully</h2>
            <p>Your password has been updated successfully.</p>
            <p><a href="log-in.html">Go to Login</a></p>
        </div>
    `;
}

/**
 * Generate a random token for password reset
 * BACKEND IMPLEMENTATION NEEDED: Use cryptographically secure method
 * @returns {string} A random token
 */
function generateToken() {
    // In production, use a cryptographically secure method
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
