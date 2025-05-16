/**
 * Class Programs Script
 * This file handles the display and management of class programs/timetables
 * grouped by school year and grade level.
 */

// Global variables
let currentSchoolYear = '2023-2024';
let availableYears = [];
let currentDay = 'Monday';
let weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Initialize the page when DOM content is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchSchoolYearsFromBackend();
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Year select change
    const yearSelect = document.getElementById('schoolYearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', function() {
            currentSchoolYear = this.value;
            loadProgramsByYear(currentSchoolYear);
        });
    }
    
    // Modal tabs for days
    const weekdayTabs = document.querySelectorAll('.weekday-tab');
    weekdayTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            switchDay(day);
        });
    });
    
    // Close modal events
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('timetableModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterPrograms);
    }
}

/**
 * Toggle sidebar menu visibility
 */
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevent body scrolling when sidebar is open
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }
}

/**
 * Fetch school years from the Django backend
 */
function fetchSchoolYearsFromBackend() {
    // Show loading state in year select
    const yearSelect = document.getElementById('schoolYearSelect');
    if (yearSelect) {
        yearSelect.innerHTML = '<option value="">Loading...</option>';
        yearSelect.disabled = true;
    }
    
    // Make AJAX request to get school years from backend
    fetch('/api/school-years/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            availableYears = data.school_years || [];
            populateYearSelect();
            loadProgramsByYear(currentSchoolYear);
        })
        .catch(error => {
            console.error('Error fetching school years:', error);
            
            // Fallback to use dummy data
            availableYears = ['2023-2024', '2022-2023'];
            populateYearSelect();
            loadProgramsByYear(currentSchoolYear);
        })
        .finally(() => {
            // Enable year select 
            if (yearSelect) {
                yearSelect.disabled = false;
            }
        });
}

/**
 * Populate the school year select dropdown
 */
function populateYearSelect() {
    const yearSelect = document.getElementById('schoolYearSelect');
    
    if (!yearSelect) return;
    
    // If no years are available, display empty state
    if (availableYears.length === 0) {
        yearSelect.innerHTML = '<option value="">No School Years Available</option>';
        
        // Show empty state for programs container
        const container = document.getElementById('programsContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">event_busy</span>
                    <h3>No Class Programs Found</h3>
                    <p>There are no class programs created yet.</p>
                    <a href="{% url 'create_timetable' %}" class="create-button">
                        <span class="material-icons">add</span>
                        Create New Class Program
                    </a>
                </div>
            `;
        }
        return;
    }

    // Set current school year to first in list if not already set
    if (!availableYears.includes(currentSchoolYear) && availableYears.length > 0) {
        currentSchoolYear = availableYears[0];
    }

    // Populate dropdown with available years
    yearSelect.innerHTML = availableYears.map(year => 
        `<option value="${year}" ${year === currentSchoolYear ? 'selected' : ''}>
            School Year ${year}
        </option>`
    ).join('');
}

/**
 * Load and display programs for the selected school year from backend
 */
function loadProgramsByYear() {
    const selectedYear = document.getElementById('schoolYearSelect').value;
    currentSchoolYear = selectedYear;
    
    const container = document.getElementById('programsContainer');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading programs for School Year ${selectedYear}...</p>
        </div>
    `;
    
    // Fetch sections and timetables from the backend
    fetch(`/api/programs/?year=${selectedYear}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const sections = data.sections || [];
            const timetables = data.timetables || [];
            
            displayProgramsByGrade(container, sections, timetables, selectedYear);
        })
        .catch(error => {
            console.error('Error fetching programs:', error);
            
            // Fallback to localStorage data
            const sections = JSON.parse(localStorage.getItem(`sections_${selectedYear}`)) || [];
            const timetables = JSON.parse(localStorage.getItem(`timetables_${selectedYear}`)) || [];
            
            displayProgramsByGrade(container, sections, timetables, selectedYear);
        });
}

/**
 * Display programs grouped by grade level
 */
function displayProgramsByGrade(container, sections, timetables, selectedYear) {
    // Check if there are any sections
    if (sections.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">event_busy</span>
                <h3>No Sections Found</h3>
                <p>There are no sections created for School Year ${selectedYear}.</p>
                <a href="{% url 'school_scheduling_details' %}" class="create-button">
                    <span class="material-icons">add</span>
                    Create Sections
                </a>
            </div>
        `;
        return;
    }
    
    // Group sections by grade level
    const gradeGroups = sections.reduce((acc, section) => {
        const grade = section.gradeLevel;
        if (!acc[grade]) acc[grade] = [];
        acc[grade].push(section);
        return acc;
    }, {});

    // Generate HTML for all grade levels
    container.innerHTML = Object.entries(gradeGroups)
        .sort(([gradeA], [gradeB]) => parseInt(gradeA) - parseInt(gradeB))
        .map(([grade, gradeSections]) => {
            return `
                <div class="grade-group">
                    <h3 class="grade-header">Grade ${grade}</h3>
                    <div class="section-cards">
                        ${gradeSections.map(section => {
                            return `
                                <div class="section-card">
                                    <div class="section-header">
                                        <h4>${section.name}</h4>
                                        <span class="adviser">Adviser: ${section.adviserName || 'Not Assigned'}</span>
                                    </div>
                                    <div class="timetable-list">
                                        ${generateDayTimetableLinks(section, timetables, grade)}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
}

/**
 * Generate timetable links for each day of the week for a section
 */
function generateDayTimetableLinks(section, timetables, grade) {
    // For each weekday, check if there's a timetable
    const dayLinks = weekdays.map(day => {
        // Check if a timetable exists for this section and day
        const timetable = timetables.find(t => 
            t.sectionId === section.id && 
            t.day === day && 
            t.gradeLevel === parseInt(grade)
        );
        
        if (timetable) {
            return `
                <a href="#" class="timetable-item" 
                   onclick="viewTimetable('${timetable.id}', '${section.id}', '${day}')">
                    <span class="day">${day}</span>
                    <span class="material-icons">chevron_right</span>
                </a>
            `;
        } else {
            return `
                <a href="#" class="timetable-item empty" 
                   onclick="createTimetable('${section.id}', '${grade}', '${day}')">
                    <span class="day">${day}</span>
                    <span class="material-icons">add_circle_outline</span>
                </a>
            `;
        }
    }).join('');
    
    // If no days have timetables, show the no-timetables message
    if (!timetables.some(t => t.sectionId === section.id)) {
        return `
            <div class="no-timetables">
                <span class="material-icons">event_busy</span>
                <p>No timetables available for this section</p>
                <a href="{% url 'create_timetable' %}?section=${section.id}&grade=${grade}&year=${currentSchoolYear}" class="create-link">
                    <span class="material-icons">add</span>
                    Create Timetable
                </a>
            </div>
        `;
    }
    
    return dayLinks;
}

/**
 * View specific timetable for a section and day
 */
function viewTimetable(timetableId, sectionId, day) {
    // You could either:
    // 1. Open a modal to display the timetable
    openTimetableModal(timetableId, sectionId, day);
    
    // 2. Or navigate to the timetable editor with the timetable loaded
    // window.location.href = `{% url 'create_timetable' %}?timetable=${timetableId}&section=${sectionId}&day=${day}&year=${currentSchoolYear}`;
}

/**
 * Create a new timetable for a section and day
 */
function createTimetable(sectionId, grade, day) {
    window.location.href = `{% url 'create_timetable' %}?section=${sectionId}&grade=${grade}&day=${day}&year=${currentSchoolYear}`;
}

/**
 * Open modal to display a timetable
 */
function openTimetableModal(timetableId, sectionId, day) {
    // Set current day
    currentDay = day;
    
    // Get modal elements
    const modal = document.getElementById('timetableModal');
    if (!modal) return;
    
    // Show loading state in modal
    const modalContent = document.getElementById('modalTimetable'); // Changed to match HTML
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading timetable...</p>
            </div>
        `;
    }
    
    // Fetch section details
    fetch(`/api/sections/${sectionId}/`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch section');
            return response.json();
        })
        .then(sectionData => {
            // Update modal header
            const modalTitle = document.getElementById('modalTitle'); // Changed to match HTML
            if (modalTitle) {
                modalTitle.innerHTML = `
                    <div class="section-details">
                        <h3>${sectionData.name}</h3>
                        <div class="section-info">
                            <div class="info-item">
                                <span class="label">Grade:</span>
                                <span class="value">${sectionData.gradeLevel}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Adviser:</span>
                                <span class="value">${sectionData.adviserName || 'Not Assigned'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">School Year:</span>
                                <span class="value">${currentSchoolYear}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Set active day tab
            updateActiveDayTab(day);
            
            // Fetch timetable details
            return fetch(`/api/timetables/${timetableId}/?day=${day}`);
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch timetable');
            return response.json();
        })
        .then(timetableData => {
            // Render timetable in modal
            renderTimetableInModal(timetableData);
        })
        .catch(error => {
            console.error('Error fetching timetable details:', error);
            
            // Show error in modal
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="error-message">
                        <span class="material-icons">error</span>
                        <p>Failed to load timetable. Please try again.</p>
                    </div>
                `;
            }
        });
    
    // Display the modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

/**
 * Update the active day tab in the modal
 */
function updateActiveDayTab(day) {
    const tabs = document.querySelectorAll('.weekday-tab');
    
    tabs.forEach(tab => {
        if (tab.getAttribute('data-day') === day) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

/**
 * Render timetable data in the modal
 */
function renderTimetableInModal(timetableData) {
    const timetableContent = document.getElementById('modalTimetable'); // Changed to match HTML
    if (!timetableContent) return;
    
    const timeSlots = timetableData.timeSlots || [];
    
    // If no time slots, show empty message
    if (timeSlots.length === 0) {
        timetableContent.innerHTML = `
            <div class="empty-timetable">
                <span class="material-icons">event_busy</span>
                <p>No time slots found for this day.</p>
                <a href="{% url 'create_timetable' %}?timetable=${timetableData.id}&edit=true" class="edit-link">
                    <span class="material-icons">edit</span>
                    Edit Timetable
                </a>
            </div>
        `;
        return;
    }
    
    // Generate timetable HTML
    let html = `
        <table class="timetable-detail">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Room</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Sort time slots by start time
    timeSlots.sort((a, b) => {
        return new Date('1970/01/01 ' + a.startTime) - new Date('1970/01/01 ' + b.startTime);
    });
    
    // Generate rows for each time slot
    timeSlots.forEach(slot => {
        if (slot.isCustomActivity) {
            // Custom activity (like lunch or recess)
            html += `
                <tr class="break-period">
                    <td>${slot.startTime} - ${slot.endTime}</td>
                    <td colspan="3" class="break-cell">
                        <div class="break-tag">${slot.activityName}</div>
                    </td>
                </tr>
            `;
        } else {
            // Regular class period
            html += `
                <tr>
                    <td>${slot.startTime} - ${slot.endTime}</td>
                    <td>${slot.subjectName}</td>
                    <td>${slot.teacherName}</td>
                    <td>${slot.room || 'N/A'}</td>
                </tr>
            `;
        }
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    timetableContent.innerHTML = html;
}

/**
 * Print the current timetable
 */
function printTimetable(timetableId) {
    // Get section name and grade
    const sectionName = document.getElementById('modalSectionTitle').textContent;
    const gradeLevel = document.getElementById('modalGradeLevel').textContent;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Write the print HTML
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Timetable - ${sectionName}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                h1 {
                    margin: 0;
                    color: #333;
                }
                .section-info {
                    margin: 10px 0;
                    font-size: 16px;
                }
                .timetable-detail {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .timetable-detail th, .timetable-detail td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .timetable-detail th {
                    background-color: #f2f2f2;
                }
                .break-period td {
                    background-color: #f9f9f9;
                }
                .break-tag {
                    text-align: center;
                    font-weight: bold;
                }
                .school-info {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                }
                @media print {
                    body {
                        margin: 0.5cm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Class Timetable</h1>
                <div class="section-info">
                    <p><strong>${sectionName}</strong> | ${gradeLevel} | School Year ${currentSchoolYear}</p>
                    <p>Day: ${currentDay}</p>
                </div>
            </div>
            ${document.getElementById('timetableContent').innerHTML}
            <div class="school-info">
                <p>EduPlanner - School Timetabling System</p>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        </body>
        </html>
    `);
    
    // Trigger print and close
    printWindow.document.close();
    printWindow.focus();
    
    // Add a slight delay to ensure content is loaded
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

/**
 * Switch between days in the timetable modal
 */
function switchDay(day) {
    if (currentDay === day) return;
    
    currentDay = day;
    updateActiveDayTab(day);
    
    // Get section ID and timetable ID
    const modalTitle = document.getElementById('modalSectionTitle');
    if (!modalTitle) return;
    
    // In a real implementation, you would fetch the new timetable data for the selected day
    // For now, we'll show a loading message and simulate fetching
    const timetableContent = document.getElementById('timetableContent');
    if (timetableContent) {
        timetableContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading timetable for ${day}...</p>
            </div>
        `;
        
        // Simulate API call with timeout
        setTimeout(() => {
            fetch(`/api/timetables/section/${getSectionIdFromModal()}/?day=${day}&year=${currentSchoolYear}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch timetable');
                    return response.json();
                })
                .then(timetableData => {
                    renderTimetableInModal(timetableData);
                })
                .catch(error => {
                    console.error('Error fetching timetable:', error);
                    timetableContent.innerHTML = `
                        <div class="error-message">
                            <span class="material-icons">error</span>
                            <p>Failed to load timetable for ${day}. Please try again.</p>
                        </div>
                    `;
                });
        }, 500);
    }
}

/**
 * Get section ID from the modal title
 */
function getSectionIdFromModal() {
    // In a real implementation, you would store the section ID in a data attribute
    // For now, we'll return a dummy ID
    return 'current-section-id';
}

/**
 * Close the timetable modal
 */
function closeModal() {
    const modal = document.getElementById('timetableModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
}

/**
 * Filter section cards based on search input
 */
function filterPrograms() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const sectionCards = document.querySelectorAll('.section-card');
    
    // Keep track of visible sections per grade
    const visibleSectionsByGrade = {};
    
    sectionCards.forEach(card => {
        const sectionName = card.querySelector('h4').textContent.toLowerCase();
        const adviserName = card.querySelector('.adviser').textContent.toLowerCase();
        const gradeGroup = card.closest('.grade-group');
        const gradeHeader = gradeGroup.querySelector('.grade-header').textContent;
        
        // Check if card matches search
        if (sectionName.includes(searchText) || adviserName.includes(searchText)) {
            card.style.display = '';
            
            // Track visible section in this grade
            if (!visibleSectionsByGrade[gradeHeader]) {
                visibleSectionsByGrade[gradeHeader] = 1;
            } else {
                visibleSectionsByGrade[gradeHeader]++;
            }
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show/hide grade groups based on whether they have visible sections
    document.querySelectorAll('.grade-group').forEach(group => {
        const gradeHeader = group.querySelector('.grade-header').textContent;
        group.style.display = visibleSectionsByGrade[gradeHeader] ? '' : 'none';
    });
}

// Expose functions for HTML onclick attributes
window.toggleMenu = toggleMenu;
window.viewTimetable = viewTimetable;
window.createTimetable = createTimetable;
window.closeModal = closeModal;
window.switchDay = switchDay;
window.printTimetable = printTimetable;
window.filterPrograms = filterPrograms;