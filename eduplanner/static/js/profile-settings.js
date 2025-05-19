// Toggle sidebar menu
function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

// Store a single instance of the modal
let passwordModal = null;
let passwordChangeEnabled = false;

document.addEventListener('DOMContentLoaded', function() {
  console.log("Profile settings JS loaded");
  
  // Get elements
  const passwordFields = document.querySelector('.password-fields');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const modalElement = document.getElementById('passwordVerificationModal');
  const confirmBtn = document.getElementById('confirmPasswordBtn');
  
  // Set up profile photo change preview
  const photoUpload = document.getElementById('photo-upload');
  const profileImage = document.getElementById('profile-image');
  
  if (photoUpload && profileImage) {
    photoUpload.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          profileImage.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // Setup toggle password visibility buttons
  setupPasswordVisibilityToggles();
  
  // Initialize modal with different backdrop setting
  if (modalElement) {
    // Dispose of any existing modal to prevent duplicates
    bootstrap.Modal.getOrCreateInstance(modalElement)?.dispose();
    
    // Create a new modal instance
    passwordModal = new bootstrap.Modal(modalElement, {
      backdrop: true, // Allow clicking outside to dismiss
      keyboard: true  // Allow ESC key to dismiss
    });
    
    // Handle modal hidden event to ensure cleanup
    modalElement.addEventListener('hidden.bs.modal', function() {
      console.log("Modal hidden event fired");
      // Clean up any leftover backdrops
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        if (backdrops.length > 0) {
          console.log(`Removing ${backdrops.length} leftover backdrop(s)`);
          backdrops.forEach(backdrop => backdrop.remove());
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }, 300);
    });
  }
  
  // Change password button click
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Change password button clicked");
      
      // Reset form before showing
      const passwordInput = document.getElementById('verify-password');
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.classList.remove('is-invalid');
      }
      
      const errorElement = document.getElementById('password-verification-error');
      if (errorElement) errorElement.textContent = '';
      
      // Show modal
      if (passwordModal) {
        passwordModal.show();
      } else {
        console.error("Modal not initialized");
      }
    });
  }
  
  // Confirm password button click
  if (confirmBtn) {
  confirmBtn.addEventListener('click', function() {
      const passwordInput = document.getElementById('verify-password');
      const password = passwordInput?.value;
      const errorElement = document.getElementById('password-verification-error');
      
      if (!password) {
        passwordInput.classList.add('is-invalid');
        if (errorElement) errorElement.textContent = 'Please enter your password';
        return;
      }
      
      // Verify the password with the server
      fetch('/verify-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ password: password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Show password fields
          if (passwordFields) passwordFields.style.display = 'block';
          passwordChangeEnabled = true;
          
          // Hide button and modal
          if (changePasswordBtn) changePasswordBtn.style.display = 'none';
          if (passwordModal) passwordModal.hide();
        } else {
          // Show error
          passwordInput.classList.add('is-invalid');
          if (errorElement) errorElement.textContent = 'Incorrect password';
        }
      })
      .catch(error => {
        console.error('Error verifying password:', error);
        if (errorElement) errorElement.textContent = 'Error verifying password';
      });
    });
  }
  
  // Setup form submission
  setupFormSubmission();
  
  setupPasswordValidation();
});

// Function to set up password visibility toggles
function setupPasswordVisibilityToggles() {
  // Use event delegation for password visibility toggling
  document.addEventListener('click', function(event) {
    // Find closest toggle-password element
    const toggleElement = event.target.closest('.toggle-password');
    if (!toggleElement) return;
    
    const targetId = toggleElement.getAttribute('data-target');
    const passwordInput = document.getElementById(targetId);
    const icon = toggleElement.querySelector('.material-icons');
    
    if (passwordInput && icon) {
      // Toggle the input type
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      
      // Update the icon
      icon.textContent = passwordInput.type === 'password' ? 'visibility' : 'visibility_off';
    }
  });
}

function setupPasswordValidation() {
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const currentPasswordInput = document.getElementById('current-password');
  
  if (newPasswordInput && confirmPasswordInput) {
    // Add input event listener to both password fields
    [newPasswordInput, confirmPasswordInput].forEach(input => {
      input.addEventListener('input', function() {
        validatePasswords();
      });
    });
    
    // Add blur event to current password for server-side validation
    if (currentPasswordInput) {
      currentPasswordInput.addEventListener('blur', function() {
        validateCurrentPassword();
      });
    }
  }
}

function validateCurrentPassword() {
  const currentPasswordInput = document.getElementById('current-password');
  if (!currentPasswordInput || !currentPasswordInput.value) return;
  
  // Example of how to check current password against server
  fetch('/api/verify-password/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken()
    },
    body: JSON.stringify({
      current_password: currentPasswordInput.value
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.valid) {
      currentPasswordInput.classList.remove('is-invalid');
      currentPasswordInput.classList.add('is-valid');
      
      // Clear any error messages
      const errorElement = currentPasswordInput.nextElementSibling;
      if (errorElement && errorElement.classList.contains('invalid-feedback')) {
        errorElement.style.display = 'none';
      }
    } else {
      currentPasswordInput.classList.remove('is-valid');
      currentPasswordInput.classList.add('is-invalid');
      
      // Show error message
      let errorElement = currentPasswordInput.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
        errorElement = document.createElement('div');
        errorElement.classList.add('invalid-feedback');
        currentPasswordInput.parentNode.appendChild(errorElement);
      }
      errorElement.textContent = 'Current password is incorrect';
      errorElement.style.display = 'block';
    }
  })
  .catch(error => {
    console.error('Error verifying password:', error);
  });
}

function validatePasswords() {
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const confirmInput = document.getElementById('confirm-password');
  const newPasswordInput = document.getElementById('new-password');
  
  // Reset validation state first
  [newPasswordInput, confirmInput].forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
    
    // Clear existing error messages
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('invalid-feedback')) {
      errorElement.style.display = 'none';
    }
  });
  
  // Only validate if both fields have values
  if (newPassword && confirmPassword) {
    if (newPassword !== confirmPassword) {
      confirmInput.classList.add('is-invalid');
      
      // Get or create error element
      let errorElement = confirmInput.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
        errorElement = document.createElement('div');
        errorElement.classList.add('invalid-feedback');
        confirmInput.parentNode.appendChild(errorElement);
      }
      
      errorElement.textContent = 'Passwords do not match';
      errorElement.style.display = 'block';
      return false;
    } else {
      // Passwords match
      confirmInput.classList.add('is-valid');
      newPasswordInput.classList.add('is-valid');
      return true;
    }
  }
  return true;
}

function getCSRFToken() {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return cookieValue;
}

// In your form submission handler:
function setupFormSubmission() {
  const profileForm = document.getElementById('profile-form');
  if (!profileForm) return;
  
  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // First validate passwords
    if (!validatePasswords()) {
      // Focus on the confirm password field
      document.getElementById('confirm-password').focus();
      return;
    }
    
    // Proceed with form submission
    //password validation check before submitting
    if (passwordChangeEnabled) {
      const newPasswordInput = document.getElementById('new-password');
      const confirmPasswordInput = document.getElementById('confirm-password');
      
      if (newPasswordInput.value || confirmPasswordInput.value) {
        if (!validatePasswords()) {
          showToast('Passwords do not match', 'danger');
          confirmPasswordInput.focus();
          return;
        }
        
        // Additional password strength check (optional)
        if (newPasswordInput.value.length < 8) {
          showToast('Password must be at least 8 characters long', 'danger');
          newPasswordInput.focus();
          return;
        }
      }
    }
    
    // Validate required fields
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    
    if (firstNameInput && !firstNameInput.value.trim()) {
      showToast('Please enter your first name', 'danger');
      firstNameInput.focus();
      return;
    }
    
    if (lastNameInput && !lastNameInput.value.trim()) {
      showToast('Please enter your last name', 'danger');
      lastNameInput.focus();
      return;
    }
    
    if (emailInput && !emailInput.value.trim()) {
      showToast('Please enter your email address', 'danger');
      emailInput.focus();
      return;
    }
    
    // Create form data
    const formData = new FormData(this);
    
    formData.append('password_change_enabled', passwordChangeEnabled);
    
    const fileInput = document.getElementById('photo-upload');
    if (fileInput && fileInput.files.length > 0) {
      formData.append('photo-upload', fileInput.files[0]);
    }
    
    // Get CSRF token
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (!csrftoken) {
      console.error('CSRF token not found');
      showToast('Form submission error: CSRF token missing', 'danger');
      return;
    }
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : 'Save Changes';
    if (submitButton) {
      submitButton.textContent = 'Saving...';
      submitButton.disabled = true;
    }
    
    // Send data
    fetch('/update-profile/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': csrftoken.value
      },
      credentials: 'same-origin'
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          try {
            // Try to parse as JSON
            const data = JSON.parse(text);
            throw new Error(data.message || `Server error: ${response.status}`);
          } catch (e) {
            // If it's not valid JSON, return the raw text
            throw new Error(`Server error: ${text || response.status}`);
          }
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Server response:", data);
      if (data.success) {
        showToast('Profile updated successfully!', 'success');
        
        // Update the displayed name in the UI
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Update all instances of the user's name in the UI
        document.querySelectorAll('.ProfileName').forEach(element => {
          element.textContent = fullName;
        });
        
        // Update the profile photo section name if it exists
        const profileNameElement = document.querySelector('.profile-photo-section h2');
        if (profileNameElement) {
          profileNameElement.textContent = fullName;
        }
        
        // Reset password fields if they were changed
        if (passwordChangeEnabled) {
          document.querySelectorAll('#current-password, #new-password, #confirm-password').forEach(input => {
            if (input) input.value = '';
          });
          
          const passwordFields = document.querySelector('.password-fields');
          if (passwordFields) passwordFields.style.display = 'none';
          
          passwordChangeEnabled = false;
          
          const changePasswordBtn = document.getElementById('changePasswordBtn');
          if (changePasswordBtn) changePasswordBtn.style.display = 'block';
        }
      } else {
        showToast(data.message || 'Error updating profile', 'danger');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('Error updating profile. Please try again.', 'danger');
    })
    .finally(() => {
      if (submitButton) {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  });
}

// Show Bootstrap toast notification
function showToast(message, type = 'info') {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    console.error('Toast container not found');
    alert(message); // Fallback to alert if toast container doesn't exist
    return;
  }
  
  const toastId = 'toast-' + Date.now();
  
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    delay: 5000
  });
  
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', function() {
    this.remove();
  });
}
