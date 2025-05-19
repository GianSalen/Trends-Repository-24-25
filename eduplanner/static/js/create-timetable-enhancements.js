/**
 * This script provides additional enhancements to the create-timetable functionality
 * to ensure consistent behavior with base table management modals.
 */

// Wait for document to be ready
document.addEventListener('DOMContentLoaded', function() {
    const editCellDialog = document.getElementById('editCellDialog');
    
    if (editCellDialog) {
        // Ensure smooth transitions for the modal
        editCellDialog.addEventListener('transitionend', function(e) {
            if (!editCellDialog.classList.contains('show') && e.propertyName === 'opacity') {
                editCellDialog.style.display = 'none';
            }
        });
    }
    
    // Make cells more responsive
    const scheduleCells = document.querySelectorAll('.schedule-cell');
    scheduleCells.forEach(cell => {
        cell.addEventListener('click', function() {
            this.classList.add('cell-clicked');
            setTimeout(() => {
                this.classList.remove('cell-clicked');
            }, 300);
        });
    });
    
    // Mark a schedule-cell as 'focused' when clicked
    document.addEventListener('click', function(e) {
        const allCells = document.querySelectorAll('.schedule-cell');
        allCells.forEach(cell => cell.classList.remove('cell-focused'));
        
        // If a schedule cell was clicked, mark it as focused
        if (e.target.closest('.schedule-cell')) {
            e.target.closest('.schedule-cell').classList.add('cell-focused');
        }
    });
});
