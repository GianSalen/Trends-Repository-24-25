/**
 * Consolidated Modal Handler
 * This script combines functionality from:
 * - modal-interactions.js
 * - modal-scroll-fix.js
 * - modal-touch-enhancements.js
 * - modal-presentation-fix.js
 * 
 * It manages all modal behaviors and presentation in the create-timetable page
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    enhanceModals();
    fixModalScrolling();
    enhanceTouchInteractions();
});

/**
 * Initialize modal structure and behavior
 */
function initializeModals() {
    // Ensure modals have proper inner content structure
    ensureModalContent();
    
    // Override show/hide methods to ensure proper behavior
    overrideModalMethods();
    
    // Add event listeners for closing modals
    addModalEventListeners();
    
    // Fix for the editCellDialog positioning
    const editCellDialog = document.getElementById('editCellDialog');
    if (editCellDialog) {
        // Move to body if not already there
        if (editCellDialog.parentElement !== document.body) {
            document.body.appendChild(editCellDialog);
        }
        
        // Ensure proper display styling when shown
        const originalOpenEditDialog = window.openEditDialog;
        if (typeof originalOpenEditDialog === 'function') {
            window.openEditDialog = function(cell) {
                // Call original function if it exists
                if (typeof originalOpenEditDialog === 'function') {
                    originalOpenEditDialog(cell);
                }
                
                // Set proper display properties for centering
                editCellDialog.style.display = 'flex';
                editCellDialog.style.alignItems = 'center';
                editCellDialog.style.justifyContent = 'center';
            };
        }
    }
}

/**
 * Enhanced modal UI and interactions
 */
function enhanceModals() {
    // Enhance dialog modal
    const editCellDialog = document.getElementById('editCellDialog');
    if (editCellDialog) {
        // Prevent clicks inside modal content from closing it
        const modalContent = editCellDialog.querySelector('.schedule-modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }

    // Enhance custom alert
    const customAlert = document.getElementById('customAlert');
    if (customAlert) {
        const alertContent = customAlert.querySelector('.alert-content');
        if (alertContent) {
            alertContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }

    // Enhance time slot dialog
    const timeSlotDialog = document.getElementById('timeSlotDialog');
    if (timeSlotDialog) {
        const dialogContent = timeSlotDialog.querySelector('.dialog-content');
        if (dialogContent) {
            dialogContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
}

/**
 * Fix scrolling issues with modals
 */
function fixModalScrolling() {
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
    
    // Handle modal close events
    document.addEventListener('modalShow', function() {
        document.body.classList.add('modal-open');
        if (document.body.scrollHeight > document.body.clientHeight) {
            document.body.style.paddingRight = scrollbarWidth + 'px';
        }
    });

    document.addEventListener('modalHide', function() {
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
    });
}

/**
 * Enhance touch interactions for modals
 */
function enhanceTouchInteractions() {
    const modals = document.querySelectorAll('.schedule-modal, .custom-alert, .edit-dialog');
    
    modals.forEach(modal => {
        // Add touch-specific behavior
        modal.addEventListener('touchmove', function(e) {
            // Get the modal content
            const content = modal.querySelector('.schedule-modal-content, .alert-content, .dialog-content');
            
            // If the touch is outside the content, prevent scrolling
            if (e.target === modal) {
                e.preventDefault();
            }
        }, { passive: false });
    });
}

/**
 * Override modal show/hide methods to ensure proper behavior
 */
function overrideModalMethods() {
    // Edit Cell Dialog
    if (typeof window.openEditDialog === 'function') {
        const originalOpen = window.openEditDialog;
        window.openEditDialog = function(cell) {
            if (typeof originalOpen === 'function') {
                originalOpen(cell);
            }
            
            const dialog = document.getElementById('editCellDialog');
            if (dialog) {
                // Ensure in body
                if (dialog.parentElement !== document.body) {
                    document.body.appendChild(dialog);
                }
                
                // Show dialog - styles handled by CSS
                dialog.classList.add('show');
                
                // Apply modal-open class to body to prevent background scroll
                document.body.classList.add('modal-open');
                
                // Set scrollbar width compensation
                const scrollbarWidth = calcScrollbarWidth();
                if (document.body.scrollHeight > document.body.clientHeight) {
                    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
                }
                
                // Dispatch modal show event
                const showEvent = new CustomEvent('modalShow');
                document.dispatchEvent(showEvent);
            }
        };
    }
    
    if (typeof window.closeEditDialog === 'function') {
        const originalClose = window.closeEditDialog;
        window.closeEditDialog = function() {
            const dialog = document.getElementById('editCellDialog');
            if (dialog) {
                dialog.classList.remove('show');
                
                // Remove modal-open class from body
                document.body.classList.remove('modal-open');
                
                // Reset scrollbar width compensation
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
                
                // Dispatch modal hide event
                const hideEvent = new CustomEvent('modalHide');
                document.dispatchEvent(hideEvent);
            }
            
            if (typeof originalClose === 'function') {
                setTimeout(originalClose, 300);
            }
        };
    }
    
    // Custom Alert
    if (typeof window.showCustomAlert === 'function') {
        const originalShow = window.showCustomAlert;
        window.showCustomAlert = function(message) {
            if (typeof originalShow === 'function') {
                originalShow(message);
            }
            
            const alert = document.getElementById('customAlert');
            if (alert) {
                // Ensure in body
                if (alert.parentElement !== document.body) {
                    document.body.appendChild(alert);
                }
                
                // Show alert - styles handled by CSS
                alert.classList.add('show');
                
                // Apply modal-open class to body to prevent background scroll
                document.body.classList.add('modal-open');
                
                // Set scrollbar width compensation
                const scrollbarWidth = calcScrollbarWidth();
                if (document.body.scrollHeight > document.body.clientHeight) {
                    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
                }
                
                // Dispatch modal show event
                const showEvent = new CustomEvent('modalShow');
                document.dispatchEvent(showEvent);
            }
        };
    }
    
    if (typeof window.closeCustomAlert === 'function') {
        const originalClose = window.closeCustomAlert;
        window.closeCustomAlert = function() {
            const alert = document.getElementById('customAlert');
            if (alert) {
                alert.classList.remove('show');
                
                // Remove modal-open class from body
                document.body.classList.remove('modal-open');
                
                // Reset scrollbar width compensation
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
                
                // Dispatch modal hide event
                const hideEvent = new CustomEvent('modalHide');
                document.dispatchEvent(hideEvent);
            }
            
            if (typeof originalClose === 'function') {
                setTimeout(originalClose, 300);
            }
        };
    }
    
    // Time Slot Dialog
    if (typeof window.editTimeSlot === 'function') {
        const originalEdit = window.editTimeSlot;
        window.editTimeSlot = function(timeSlotId, sectionId) {
            if (typeof originalEdit === 'function') {
                originalEdit(timeSlotId, sectionId);
            }
            
            const dialog = document.getElementById('timeSlotDialog');
            if (dialog) {
                // Ensure in body
                if (dialog.parentElement !== document.body) {
                    document.body.appendChild(dialog);
                }
                
                // Show dialog - styles handled by CSS
                dialog.classList.add('show');
                
                // Apply modal-open class to body to prevent background scroll
                document.body.classList.add('modal-open');
                
                // Set scrollbar width compensation
                const scrollbarWidth = calcScrollbarWidth();
                if (document.body.scrollHeight > document.body.clientHeight) {
                    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
                }
                
                // Dispatch modal show event
                const showEvent = new CustomEvent('modalShow');
                document.dispatchEvent(showEvent);
            }
        };
    }
    
    if (typeof window.closeTimeSlotDialog === 'function') {
        const originalClose = window.closeTimeSlotDialog;
        window.closeTimeSlotDialog = function() {
            const dialog = document.getElementById('timeSlotDialog');
            if (dialog) {
                dialog.classList.remove('show');
                
                // Remove modal-open class from body
                document.body.classList.remove('modal-open');
                
                // Reset scrollbar width compensation
                document.documentElement.style.setProperty('--scrollbar-width', '0px');
                
                // Dispatch modal hide event
                const hideEvent = new CustomEvent('modalHide');
                document.dispatchEvent(hideEvent);
            }
            
            if (typeof originalClose === 'function') {
                setTimeout(originalClose, 300);
            }
        };
    }
}

/**
 * Add event listeners for closing modals
 */
function addModalEventListeners() {
    // Close modal when clicking outside content
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('schedule-modal') || 
            event.target.classList.contains('custom-alert') || 
            event.target.classList.contains('edit-dialog')) {
            closeModal(event.target);
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const visibleModal = document.querySelector('.schedule-modal.show, .custom-alert.show, .edit-dialog.show');
            if (visibleModal) {
                closeModal(visibleModal);
            }
        }
    });
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .close-alert, .close-dialog');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.schedule-modal, .custom-alert, .edit-dialog');
            if (modal) {
                closeModal(modal);
            }
        });
    });
}

/**
 * On load, check if any modals need inner content wrappers
 */
function ensureModalContent() {
    const modals = document.querySelectorAll('.schedule-modal, .custom-alert, .edit-dialog');
    
    modals.forEach(modal => {
        // Get the content container
        const content = modal.querySelector('.schedule-modal-content, .alert-content, .dialog-content');
        if (content) {
            // Create inner content area if not exists
            const innerContentExists = content.querySelector('.modal-inner-content');
            if (!innerContentExists) {
                // Find the header
                const header = content.querySelector('.schedule-modal-header, .alert-header, .dialog-header');
                const actionButtons = content.querySelector('.schedule-modal-actions, .dialog-buttons');
                
                // Find all elements that should go into inner content
                const nonHeaderElements = Array.from(content.children).filter(el => {
                    return el !== header && 
                        !el.classList.contains('modal-inner-content') &&
                        !el.classList.contains('schedule-modal-actions') && 
                        !el.classList.contains('dialog-buttons');
                });
                
                if (nonHeaderElements.length > 0) {
                    const innerContent = document.createElement('div');
                    innerContent.className = 'modal-inner-content';
                    
                    // Move elements into inner content
                    nonHeaderElements.forEach(el => {
                        innerContent.appendChild(el);
                    });
                    
                    // Add to content area
                    if (header) {
                        content.insertBefore(innerContent, header.nextSibling);
                    } else {
                        content.appendChild(innerContent);
                    }
                }
            }
        }
    });
}

/**
 * Helper function to close modals
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
    if (modal) {
        modal.classList.remove('show');
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        
        // Reset scrollbar width compensation
        document.documentElement.style.setProperty('--scrollbar-width', '0px');
        
        // Dispatch modal hide event
        const hideEvent = new CustomEvent('modalHide');
        document.dispatchEvent(hideEvent);
    }
}

/**
 * Calculates the width of the browser's scrollbar
 * @return {number} Width of the scrollbar in pixels
 */
function calcScrollbarWidth() {
    // Create a temporary div with scrollbar
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    
    // Create inner div
    const inner = document.createElement('div');
    outer.appendChild(inner);
    
    // Calculate width difference
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    
    // Clean up
    outer.parentNode.removeChild(outer);
    
    return scrollbarWidth;
}
