// profile-settings.js - Shared functionality for profile settings pages

document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile settings form validation
    initializeFormValidation();
    
    // Add event listeners for form submissions
    setupFormSubmissions();
    
    // Set up password security
    setupPasswordSecurity();
    
    // Add animation classes to elements
    document.querySelectorAll('.profile-settings-container').forEach((container, index) => {
        container.style.animationDelay = `${index * 0.2}s`;
    });
});

// Setup password security - hide password fields by default
function setupPasswordSecurity() {
    // Create secure password section with locked state
    const passwordSection = document.querySelector('.password-section');
    if (!passwordSection) return;
    
    // Hide password fields initially and show unlock button
    const passwordFields = passwordSection.querySelectorAll('.form-group:not(:first-child)');
    passwordFields.forEach(field => {
        field.style.display = 'none';
    });
    
    // Create unlock button
    const unlockBtn = document.createElement('button');
    unlockBtn.type = 'button';
    unlockBtn.className = 'btn unlock-btn';
    unlockBtn.innerHTML = '<span class="material-icons">lock</span> Change Password';
    
    // Insert button after the first form group (current password)
    const firstFormGroup = passwordSection.querySelector('.form-group');
    if (firstFormGroup) {
        firstFormGroup.style.display = 'none'; // Hide current password field too
        firstFormGroup.after(unlockBtn);
    } else {
        passwordSection.appendChild(unlockBtn);
    }
    
    // Add event listener to unlock button
    unlockBtn.addEventListener('click', function() {
        showPasswordConfirmationDialog();
    });
}

// Show password confirmation dialog
function showPasswordConfirmationDialog() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-backdrop';
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Modal content
    modalContainer.innerHTML = `
        <div class="modal-header">
            <h3>Confirm Your Password</h3>
            <button type="button" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
            <p>For security reasons, please enter your current password to make changes.</p>
            <div class="form-group">
                <label for="security-password">Current Password</label>
                <div class="password-input-container">
                    <input type="password" id="security-password" class="form-input" placeholder="Enter your current password">
                    <button type="button" class="toggle-password" data-target="security-password">
                        <span class="material-icons">visibility</span>
                    </button>
                </div>
                <div class="error-message"></div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn secondary cancel-btn">Cancel</button>
            <button type="button" class="btn primary confirm-btn">Confirm</button>
        </div>
    `;
    
    // Append modal to body
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Show modal with animation
    setTimeout(() => {
        modalOverlay.classList.add('show');
    }, 10);
    
    // Close button event
    const closeButton = modalContainer.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        closePasswordDialog(modalOverlay);
    });
    
    // Cancel button event
    const cancelButton = modalContainer.querySelector('.cancel-btn');
    cancelButton.addEventListener('click', () => {
        closePasswordDialog(modalOverlay);
    });
    
    // Toggle password visibility
    const toggleButton = modalContainer.querySelector('.toggle-password');
    toggleButton.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = this.querySelector('span');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.textContent = 'visibility_off';
        } else {
            passwordInput.type = 'password';
            icon.textContent = 'visibility';
        }
    });
    
    // Click outside to close
    modalOverlay.addEventListener('click', function(event) {
        if (event.target === modalOverlay) {
            closePasswordDialog(modalOverlay);
        }
    });
    
    // Confirm button event
    const confirmButton = modalContainer.querySelector('.confirm-btn');
    confirmButton.addEventListener('click', () => {
        const passwordInput = document.getElementById('security-password');
        const password = passwordInput.value;
        
        if (!password) {
            const errorMessage = modalContainer.querySelector('.error-message');
            errorMessage.textContent = 'Please enter your current password';
            return;
        }
        
        // In a real implementation, you would verify this password with the server
        // Here we're simulating a successful password verification
        verifyCurrentPassword(password)
            .then(isValid => {
                if (isValid) {
                    // Password correct - show password fields
                    showPasswordFields();
                    closePasswordDialog(modalOverlay);
                } else {
                    // Password incorrect - show error
                    const errorMessage = modalContainer.querySelector('.error-message');
                    errorMessage.textContent = 'Incorrect password. Please try again.';
                }
            })
            .catch(error => {
                console.error('Error verifying password:', error);
                showNotification('Error verifying password. Please try again.', 'error');
            });
    });
    
    // Focus on password input
    setTimeout(() => {
        document.getElementById('security-password').focus();
    }, 300);
}

// Simulate password verification with server
function verifyCurrentPassword(password) {
    // In a real app, this would make an API call to verify the password
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            // For demo purposes, accept any password over 4 characters
            // In production, this should call your API
            resolve(password.length >= 4);
        }, 800);
    });
}

// Show password fields after successful verification
function showPasswordFields() {
    const passwordSection = document.querySelector('.password-section');
    if (!passwordSection) return;
    
    // Show all password fields
    const passwordFields = passwordSection.querySelectorAll('.form-group');
    passwordFields.forEach(field => {
        field.style.display = 'block';
    });
    
    // Remove the unlock button
    const unlockBtn = passwordSection.querySelector('.unlock-btn');
    if (unlockBtn) {
        unlockBtn.remove();
    }
    
    // Add a "cancel password change" button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn text-btn cancel-password-btn';
    cancelBtn.innerHTML = 'Cancel password change';
    passwordSection.appendChild(cancelBtn);
    
    // Add event listener to cancel button
    cancelBtn.addEventListener('click', function() {
        // Reset password fields
        const inputs = passwordSection.querySelectorAll('input[type="password"]');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Hide password fields again
        setupPasswordSecurity();
        
        // Remove this button
        this.remove();
    });
    
    // Focus on current password field
    const currentPasswordField = passwordSection.querySelector('input[type="password"]');
    if (currentPasswordField) {
        currentPasswordField.focus();
    }
}

// Close password confirmation dialog
function closePasswordDialog(modalOverlay) {
    modalOverlay.classList.remove('show');
    setTimeout(() => {
        modalOverlay.remove();
    }, 300);
}

// Form validation
function initializeFormValidation() {
    // Password validation
    const newPasswordField = document.getElementById('new-password');
    const confirmPasswordField = document.getElementById('confirm-password');
    
    if (newPasswordField && confirmPasswordField) {
        confirmPasswordField.addEventListener('blur', function() {
            if (this.value && this.value !== newPasswordField.value) {
                showFormError(this, 'Passwords do not match');
            } else {
                clearFormError(this);
            }
        });
        
        newPasswordField.addEventListener('input', function() {
            if (confirmPasswordField.value) {
                if (this.value !== confirmPasswordField.value) {
                    showFormError(confirmPasswordField, 'Passwords do not match');
                } else {
                    clearFormError(confirmPasswordField);
                }
            }
        });
    }
    
    // Email validation
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                showFormError(this, 'Please enter a valid email address');
            } else {
                clearFormError(this);
            }
        });
    }
    
    // Phone number validation
    const phoneField = document.getElementById('contactNumber');
    if (phoneField) {
        phoneField.addEventListener('blur', function() {
            const phoneRegex = /^[0-9\-\+\s\(\)]{7,20}$/;
            if (this.value && !phoneRegex.test(this.value)) {
                showFormError(this, 'Please enter a valid phone number');
            } else {
                clearFormError(this);
            }
        });
    }
}

// Form submission handling
function setupFormSubmissions() {
    document.querySelectorAll('.settings-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check for any validation errors
            const hasErrors = form.querySelectorAll('.form-group.error').length > 0;
            if (hasErrors) {
                showNotification('Please fix the errors before submitting', 'error');
                return;
            }
            
            // Simulate form submission
            const submitButton = form.querySelector('.save-btn');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;
            
            // In a real implementation, you would send the form data to the server using fetch or XMLHttpRequest
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                // Highlight fields to indicate they were saved
                form.querySelectorAll('input, select').forEach(field => {
                    field.classList.add('field-saved');
                    setTimeout(() => {
                        field.classList.remove('field-saved');
                    }, 2000);
                });
                
                showNotification('Changes saved successfully', 'success');
            }, 1000);
        });
    });
    
    // Cancel button handling
    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', function() {
            // In a real implementation, you would reset the form to its original values
            button.closest('form').reset();
            showNotification('Changes discarded', 'info');
        });
    });
    
    // Profile form submission
    document.getElementById('profile-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Password validation if change is enabled
      if (passwordChangeEnabled) {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword && newPassword !== confirmPassword) {
          showNotification('New passwords do not match!', 'error');
          return;
        }
      }
      
      // Get CSRF token
      const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
      
      // Create form data
      const formData = new FormData(this);
      
      // Handle full name - split into first and last name for the server
      const fullName = document.getElementById('full-name').value.trim();
      const nameParts = fullName.split(' ');
      
      if (nameParts.length >= 2) {
        // Extract first and last names
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        // Replace the full_name field with first_name and last_name
        formData.delete('full_name');
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
      } else {
        // If only one word, use it as first name and leave last name blank
        formData.delete('full_name');
        formData.append('first_name', fullName);
        formData.append('last_name', '');
      }
      
      // Add password change flag
      formData.append('password_change_enabled', passwordChangeEnabled);
      
      // Add the file if selected
      const fileInput = document.getElementById('photo-upload');
      if (fileInput.files.length > 0) {
        formData.append('photo-upload', fileInput.files[0]);
      }
      
      // Send data to server
      fetch('/update-profile/', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': csrftoken
        },
        credentials: 'same-origin'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          showNotification('Profile updated successfully!', 'success');
          
          // Reset password fields if they were changed
          if (passwordChangeEnabled) {
            passwordGroups.forEach(group => {
              const input = group.querySelector('input');
              if (input) input.value = '';
              group.style.display = 'none';
            });
            passwordChangeEnabled = false;
            changePasswordBtn.style.display = 'block';
          }
        } else {
          showNotification(data.message || 'Error updating profile', 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating profile. Please try again.', 'error');
      });
    });
}

// Utility functions
function showFormError(element, message) {
    const formGroup = element.closest('.form-group');
    formGroup.classList.add('error');
    
    let errorMessage = formGroup.querySelector('.error-message');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        formGroup.appendChild(errorMessage);
    }
    
    errorMessage.textContent = message;
}

function clearFormError(element) {
    const formGroup = element.closest('.form-group');
    formGroup.classList.remove('error');
    
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.textContent = '';
    }
}

function showNotification(message, type = 'info') {
    // Check if a notification container exists, create one if not
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('span');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        notification.classList.add('fadeOut');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    notification.appendChild(closeButton);
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fadeOut');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}
