/**
 * ===============================================================================================
 * SCHOOL SCHEDULING DETAILS JS
 * ===============================================================================================
 * 
 * OVERVIEW:
 * This file handles the management of school scheduling data in the EduPlanner application.
 * It provides functionality for creating, reading, updating, and deleting (CRUD) operations
 * for teachers, sections, subjects, advisers, and timeslots.
 * 
 * KEY FEATURES:
 * - Management of teachers with specializations
 * - Management of sections by grade level
 * - Management of subjects with grade level and semester information
 * - Assignment of advisers to sections
 * - Creation and management of timeslots for scheduling
 * - Filtering of data by grade level or day
 * - School year management
 * 
 * DATA STRUCTURE:
 * - Teachers: ID, name, specialization
 * - Sections: ID, name, grade level
 * - Subjects: ID, name, grade level, semester (for senior high)
 * - Advisers: Section-Teacher mappings with school year
 * - Timeslots: ID, day, start time, end time
 * 
 * USAGE:
 * This script is loaded on the School Scheduling Details page and initializes when the DOM
 * is fully loaded. It fetches data from the backend APIs and populates the UI tables.
 * 
 * DEPENDENCIES:
 * - Requires backend API endpoints for data operations
 * - Uses Material Icons for UI elements
 * 
 * AUTHOR:
 * EduPlanner Development Team
 * 
 * LAST UPDATED:
 * May 5, 2025
 * 
 * ===============================================================================================
 */

// Global state variables
let currentEditingId = null;
let currentGrade = 'all';
let currentSchoolYear = '2023-2024';

// Data arrays (will be loaded from database)
let sections = [];
let subjects = [];
let teachers = [];
let advisers = [];
let timeslots = [];

/**
 * Initialize the page when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Set initial state
    currentGrade = 100;
    
    // Load data from backend
    await loadCurrentSchoolYear();
      // Load all data explicitly
    await Promise.all([
        loadTeachers(),
        loadSections(),
        loadSubjects(),
        loadTimeslots()
    ]);  
    await loadAdvisers();
    
    // Set 'All Days' button as active for timeslots
    if (document.querySelector('#timeslotsView .day-filter-tabs .tab-button')) {
        document.querySelector('#timeslotsView .day-filter-tabs .tab-button').classList.add('active');
    }
    
    // Set up modal close when clicking outside
    setupModalCloseHandlers();
    
    // Add event delegation for timeslots tab click
    document.querySelectorAll('.management-tabs .tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const view = this.textContent.toLowerCase().trim();
            if (view === 'timeslots') {
                loadTimeslots();
            }
        });
    });
});


function toggleMenu() { // Toggle sidebar menu visibility
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Prevent body scrolling when sidebar is open
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

// Close sidebar when pressing Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('sidebar').classList.contains('active')) {
        toggleMenu();
    }
});

// Set up handlers to close modals when clicking outside
function setupModalCloseHandlers() {
    window.onclick = function(event) {
        const modals = [
            document.getElementById('teacherModal'),
            document.getElementById('sectionModal'),
            document.getElementById('subjectModal'),
            document.getElementById('adviserModal'),
            document.getElementById('timeslotModal')
        ];
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
}

/**
 * Switch between management views (teachers, sections, subjects)
 * @param {string} view - The view to switch to
 */
function switchManagementView(view) {
    // Update tab button styling
    document.querySelectorAll('.management-tabs .tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update view visibility
    document.querySelectorAll('.management-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${view}View`).classList.add('active');
}

/**
 * Generic function to filter items by grade level or day
 * @param {number|string} value - The value to filter by (grade or day)
 * @param {string} viewType - The type of view ('sections', 'subjects', 'advisers', or 'timeslots')
 */
function filterByValue(value, viewType) {
    console.log(`Filtering ${viewType} by value:`, value);
    
    // Only handle timeslots filtering, ignore grade filtering for sections and subjects
    if (viewType === 'timeslots') {
        currentDay = value;
        
        // Update active states
        const selector = `#${viewType}View .day-filter-tabs .tab-button`;
        
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.remove('active');
        });
        
        // If the event target is inside a dropdown, highlight the parent dropdown button
        if (event.target.closest('.dropdown')) {
            event.target.closest('.dropdown').querySelector('.tab-button').classList.add('active');
        } else {
            event.target.classList.add('active');
        }
        
        // Close all dropdowns
        document.querySelectorAll('.dropdown-content').forEach(d => {
            d.classList.remove('show');
        });
        
        // Update timeslots table
        updateTimeslotsTable();
    } else if (viewType === 'sections') {
        // Always show all sections regardless of grade level
        updateSectionsTable();
    } else if (viewType === 'subjects') {
        // Always show all subjects regardless of grade level
        updateSubjectsTable();
    } else if (viewType === 'advisers') {
        // No filtering for advisers
        updateAdvisersTable();
    }
}

// Update the end year when the start year changes
function updateEndYear() {
    const startYear = parseInt(document.getElementById('startYear').value);
    const endYear = startYear + 1;
    document.getElementById('endYear').value = endYear;
}
// Load school year from backend
async function loadCurrentSchoolYear() {
    try {
        // First, ensure default school year exists by attempting to save it
        const defaultYear = '2023-2024';
        await fetch('/api/school-year/save/', {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ year_range: defaultYear })
        });
        
        // Then get the current school year
        const response = await fetch('/api/school-year/current/');
        if (!response.ok) throw new Error('Failed to load school year');
        const data = await response.json();
        currentSchoolYear = data.year_range;
        
        // Update UI
        const [startYear] = currentSchoolYear.split('-');
        document.getElementById('startYear').value = startYear;
        updateEndYear();
        
        // Load all data for current school year
        await Promise.all([
            loadTeachers(),
            loadSections(),
            loadSubjects(),
            loadTimeslots()
        ]);  
        await loadAdvisers();

    } catch (error) {
        showCustomAlert('Error loading school year: ' + error.message);
    }
}

// Save the current school year and load data for it
async function saveSchoolYear() {
    const startYear = document.getElementById('startYear').value;
    const endYear = document.getElementById('endYear').value;
    const schoolYear = `${startYear}-${endYear}`;
    
    if (currentSchoolYear === schoolYear) return;
    
    if (confirm('Changing school year will load different data. Continue?')) {
        try {
            const response = await fetch('/api/school-year/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ year_range: schoolYear })
            });
            
            if (!response.ok) throw new Error('Failed to save school year');
            
            const result = await response.json();
            if (result.success) {
                currentSchoolYear = schoolYear;
                
                // Reload all data for the new school year
                await loadCurrentSchoolYear();
                
                showCustomAlert('School year changed successfully!');
            }
        } catch (error) {
            showCustomAlert('Error: ' + error.message);
        }
    }
}

/**
 * Show a custom alert message to the user
 * @param {string} message - The message to display
 */
function showCustomAlert(message) {
    // Check if alert container already exists
    let alertContainer = document.getElementById('customAlertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'customAlertContainer';
        alertContainer.className = 'custom-alert-container';
        document.body.appendChild(alertContainer);
    }
    
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.innerHTML = `
        <div class="alert-content">
            <span class="material-icons">info</span>
            <p>${message}</p>
        </div>
    `;
    
    alertContainer.appendChild(alertBox);
    
    // Remove alert after timeout
    setTimeout(() => {
        alertBox.classList.add('fade-out');
        setTimeout(() => {
            alertContainer.removeChild(alertBox);
        }, 300);
    }, 3000);
}

// TEACHER MANAGEMENT FUNCTIONS
// Open the teacher form modal for adding a new teacher
function openTeacherForm() {
    openEntityForm('teacher');
    setTimeout(() => checkModalScrollable('teacherModal'), 100);
}
// Close the teacher form modal
function closeTeacherForm() {
    closeEntityForm('teacher');
}

/**
 * Save teacher data (create new or update existing)
 * @param {Event} event - The form submission event
 */
async function saveTeacher(event) { //create new or update existing teacher
    event.preventDefault();
    
    const teacherId = document.getElementById('teacherId').value;
    const teacherName = document.getElementById('teacherName').value;
    const specialization = Array.from(document.getElementById('specialization').selectedOptions)
        .map(option => option.value);
    
    // Validate required fields
    if (!teacherId || !teacherName || specialization.length === 0) {
        showCustomAlert('Please fill in all required fields');
        return;
    }
    
    const teacherData = {
        id: teacherId,
        name: teacherName,
        specialization: specialization,
        teaching_load: 6
    };
    
    try {
        const response = await fetch('/api/teachers/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(teacherData)
        });
        
        if (!response.ok) throw new Error('Failed to save teacher');
        
        const result = await response.json();
        if (result.success) {
            await loadTeachers();  // Reload the data
            closeTeacherForm();
            showCustomAlert(result.created ? 'Teacher added successfully!' : 'Teacher updated successfully!');
        } else {
            showCustomAlert('Error saving teacher');
        }
    } catch (error) {
        showCustomAlert('Error: ' + error.message);
    }
}

/**
 * Load teacher data into the form for editing
 * @param {string} teacherId - The ID of the teacher to edit
 */
function editTeacher(teacherId) { 
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    currentEditingId = teacherId;
    
    // Populate form with teacher data
    document.getElementById('teacherId').value = teacher.id;
    document.getElementById('teacherId').readOnly = true; // Prevent ID editing
    document.getElementById('teacherName').value = teacher.name;
    
    // Set specializations
    const specializationSelect = document.getElementById('specialization');
    Array.from(specializationSelect.options).forEach(option => {
        option.selected = teacher.specialization.includes(option.value);
    });
    
    // Change modal title and open
    document.querySelector('#teacherModal h2').textContent = 'Edit Teacher';
    document.getElementById('teacherModal').style.display = 'block';
}

/**
 * Delete a teacher after confirmation
 * @param {string} teacherId - The ID of the teacher to delete
 */
async function deleteTeacher(teacherId) { //delete teacher from database
    const teacher = teachers.find(t => t.id === teacherId);
    
    if (confirm(`Are you sure you want to delete teacher ${teacher.name}?`)) {
        try {
            const response = await fetch(`/api/teachers/delete/${teacherId}/`, { //connect to backend API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete teacher');
            
            const result = await response.json();
            if (result.success) {
                await loadTeachers();  // Reload the data
                
                // Check if this teacher is an adviser in the advisory table
                try {
                    const adviserResponse = await fetch(`/api/advisers/?year=${currentSchoolYear}&teacher=${teacherId}`);
                    if (adviserResponse.ok) {
                        const adviserData = await adviserResponse.json();
                        if (adviserData && adviserData.length > 0) {
                            showCustomAlert(`Note: Teacher was an adviser for ${adviserData.length} section(s). These adviser assignments should be updated.`);
                        }
                    }
                } catch (err) {
                    console.error('Error checking adviser status:', err);
                }
                
                showCustomAlert(`Teacher ${teacher.name} has been deleted successfully.`);
            } else {
                showCustomAlert('Error deleting teacher: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showCustomAlert('Error: ' + error.message);
        }
    }
}

function updateTeachersTable() { //update teachers table with current data
    const tbody = document.querySelector('#teachersTable tbody');
    const table = document.querySelector('#teachersTable');
    
    // Ensure table has headers
    if (!table.querySelector('thead')) {
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Teacher ID</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Actions</th>
            </tr>
        `;
        table.insertBefore(thead, tbody || table.firstChild);
    }
    
    // Ensure tbody exists
    if (!tbody) {
        const newTbody = document.createElement('tbody');
        table.appendChild(newTbody);
    }
    
    // Save current search value if any
    const searchInput = document.querySelector('.search-input[data-table-id="teachersTable"]');
    const searchText = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if (!teachers || teachers.length === 0) {
        table.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    No teachers found. Please add a teacher.
                </td>
            </tr>
        `;
        return;
    }
    
    table.querySelector('tbody').innerHTML = teachers.map(teacher => `
        <tr>
            <td>${teacher.id}</td>
            <td>${teacher.name}</td>
            <td>${Array.isArray(teacher.specialization) ? teacher.specialization.join(', ') : teacher.specialization || ''}</td>
            <td class="action-buttons">
                <button onclick="editTeacher('${teacher.id}')" class="edit-button">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteTeacher('${teacher.id}')" class="delete-button">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

// SECTION MANAGEMENT FUNCTIONS
// Open the section form modal for adding a new section
function openSectionForm() {
    openEntityForm('section');
    setTimeout(() => checkModalScrollable('sectionModal'), 100);
}
// Close the section form modal
function closeSectionForm() {
    closeEntityForm('section');
}

/**
 * Save section data (create new or update existing)
 * @param {Event} event - The form submission event
 */
async function saveSection(event) { //create new or update existing section
    event.preventDefault();
    
    const sectionId = document.getElementById('sectionId').value;
    const sectionName = document.getElementById('sectionName').value;
    const gradeLevel = document.getElementById('gradeLevel').value;
    
    if (!sectionId || !sectionName || !gradeLevel) {
        showCustomAlert('Please fill in all required fields');
        return;
    }

    const sectionData = {
        id: sectionId,
        name: sectionName,
        gradeLevel: parseInt(gradeLevel)
        
    };
    
    try {
        const response = await fetch('/api/sections/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sectionData)
        });
        
        if (!response.ok) throw new Error('Failed to save section');
        
        const result = await response.json();
        if (result.success) {
            await loadSections();  // Reload the data
            closeSectionForm();
            showCustomAlert(result.created ? 'Section added successfully!' : 'Section updated successfully!');
        } else {
            showCustomAlert('Error saving section');
        }
    } catch (error) {
        showCustomAlert('Error: ' + error.message);
    }
}

/**
 * Load section data into the form for editing
 * @param {string} sectionId - The ID of the section to edit
 */
function editSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    currentEditingId = sectionId;
    
    // Populate form with section data
    document.getElementById('sectionId').value = section.id;
    document.getElementById('sectionId').readOnly = true;
    document.getElementById('sectionName').value = section.name;
    document.getElementById('gradeLevel').value = section.gradeLevel;
    
    // Change modal title and open
    document.querySelector('#sectionModal h2').textContent = 'Edit Section';
    document.getElementById('sectionModal').style.display = 'block';
}

/**
 * Delete a section after confirmation
 * @param {string} sectionId - The ID of the section to delete
 */
async function deleteSection(sectionId) { //delete section from database
    const section = sections.find(s => s.id === sectionId);
    
    if (confirm(`Are you sure you want to delete section ${section.name}?`)) {
        try {
            const response = await fetch(`/api/sections/delete/${sectionId}/`, { //connect to backend API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete section');
            
            const result = await response.json();
            if (result.success) {
                await loadSections();  // Reload the data
                showCustomAlert(`Section ${section.name} has been deleted successfully.`);
            } else {
                showCustomAlert('Error deleting section: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showCustomAlert('Error: ' + error.message);
        }
    }
}

// Update the sections table with current data and apply filtering
function updateSectionsTable() {
    const tbody = document.querySelector('#sectionsTable tbody');
    
    // No filtering - use all sections
    const filteredSections = sections;
    
    // Sort sections by grade level and then by name
    filteredSections.sort((a, b) => {
        if (parseInt(a.gradeLevel) === parseInt(b.gradeLevel)) {
            return a.name.localeCompare(b.name);
        }
        return parseInt(a.gradeLevel) - parseInt(b.gradeLevel);
    });
    
    if (filteredSections.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    No sections found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredSections.map(section => `
        <tr>
            <td>${section.id}</td>
            <td>${section.name}</td>
            <td>Grade ${section.gradeLevel}</td>
            <td class="action-buttons">
                <button onclick="editSection('${section.id}')" class="edit-button" title="Edit Section">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteSection('${section.id}')" class="delete-button" title="Delete Section">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

// SUBJECT MANAGEMENT FUNCTIONS
// Open the subject form modal for adding a new subject
function openSubjectForm() {
    openEntityForm('subject');
    setTimeout(() => checkModalScrollable('subjectModal'), 100);
}
// Close the subject form modal
function closeSubjectForm() {
    closeEntityForm('subject');
}
/**
 * Save subject data (create new or update existing)
 * @param {Event} event - The form submission event
 */
async function saveSubject(event) {
    event.preventDefault();
    
    const subjectId = document.getElementById('subjectId').value;
    const subjectName = document.getElementById('subjectName').value;
    
    if (!subjectId || !subjectName) {
        showCustomAlert('Please fill in all required fields');
        return;
    }
    
    const subjectData = {
        id: subjectId,
        name: subjectName
    };
    
    try {
        const response = await fetch('/api/subjects/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subjectData)
        });
        
        if (!response.ok) throw new Error('Failed to save subject');
        
        const result = await response.json();
        if (result.success) {
            await loadSubjects();  // Reload the data
            closeSubjectForm();
            showCustomAlert(result.created ? 'Subject added successfully!' : 'Subject updated successfully!');
        } else {
            showCustomAlert('Error saving subject');
        }
    } catch (error) {
        showCustomAlert('Error: ' + error.message);
    }
}

/**
 * Load subject data into the form for editing
 * @param {string} subjectId - The ID of the subject to edit
 */
function editSubject(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    currentEditingId = subjectId;
    
    // Populate form with subject data
    document.getElementById('subjectId').value = subject.id;
    document.getElementById('subjectId').readOnly = true;
    document.getElementById('subjectName').value = subject.name;
    
    // Change modal title and open
    document.querySelector('#subjectModal h2').textContent = 'Edit Subject';
    document.getElementById('subjectModal').style.display = 'block';
}

/**
 * Delete a subject after confirmation
 * @param {string} subjectId - The ID of the subject to delete
 */
async function deleteSubject(subjectId) {//delete subject from database
    const subject = subjects.find(s => s.id === subjectId);
    
    if (confirm(`Are you sure you want to delete subject ${subject.name}?`)) {
        try {
            const response = await fetch(`/api/subjects/delete/${subjectId}/`, { //connect to backend API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete subject');
            
            const result = await response.json();
            if (result.success) {
                await loadSubjects();  // Reload the data
                showCustomAlert(`Subject ${subject.name} has been deleted successfully.`);
            } else {
                showCustomAlert('Error deleting subject: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showCustomAlert('Error: ' + error.message);
        }
    }
}
// Update the subjects table with current data and apply filtering
function updateSubjectsTable() {
    const table = document.querySelector('#subjectsTable');
    
    // No filtering - use all subjects
    const filteredSubjects = subjects || [];
    
    // Sort subjects by name if possible
    if (Array.isArray(filteredSubjects)) {
        filteredSubjects.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Ensure tbody exists
    if (!table.querySelector('tbody')) {
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }
    
    const tbody = table.querySelector('tbody');
    
    if (!filteredSubjects || filteredSubjects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-state">
                    No subjects found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredSubjects.map(subject => `
        <tr>
            <td>${subject.id}</td>
            <td>${subject.name}</td>
            <td class="action-buttons">
                <button onclick="editSubject('${subject.id}')" class="edit-button" title="Edit Subject">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteSubject('${subject.id}')" class="delete-button" title="Delete Subject">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

// ADVISER MANAGEMENT FUNCTIONS
// Open the adviser form modal for assigning an adviser
function openAdviserForm() {
    openEntityForm('adviser');
    setTimeout(() => checkModalScrollable('adviserModal'), 100);
}
// Close the adviser form modal
function closeAdviserForm() {
    closeEntityForm('adviser');
}
// Update the grade level field when a section is selected
function updateGradeLevel() {
    const sectionSelect = document.getElementById('adviserSection');
    const selectedOption = sectionSelect.options[sectionSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const gradeLevel = selectedOption.getAttribute('data-grade');
        document.getElementById('adviserGradeLevel').value = `Grade ${gradeLevel}`;
    } else {
        document.getElementById('adviserGradeLevel').value = '';
    }
}

/**
 * Save adviser assignment
 * @param {Event} event - The form submission event
 */
async function saveAdviser(event) {
    event.preventDefault();
    
    const sectionId = document.getElementById('adviserSection').value;
    const teacherId = document.getElementById('adviserTeacher').value;
    
    if (!sectionId) {
        showCustomAlert('Please select a section');
        return;
    }
    
    // Find the selected section and teacher objects
    const section = sections.find(s => s.id === sectionId);
    const teacher = teacherId ? teachers.find(t => t.id === teacherId) : null;// Teacher is now optional
    
    if (!section) {
        showCustomAlert('Invalid section selection');
        return;
    }

    if (teacherId && !teacher) { // If teacher is provided, validate it exists
        showCustomAlert('Invalid teacher selection');
        return;
    }
    
    const adviserData = {
        section_id: sectionId,
        teacher_id: teacherId || null, // Allow null for teacher_id
        school_year: currentSchoolYear
    };
    
    try {
        const response = await fetch('/api/advisers/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adviserData)
        });
        
        if (!response.ok) throw new Error('Failed to save adviser assignment');
        
        const result = await response.json();
        if (result.success) {
            // Update both adviser list and sections list since they're related
            await Promise.all([
                loadAdvisers(),
                loadSections()
            ]);
            closeAdviserForm();
            showCustomAlert(teacherId ? 'Adviser assigned successfully!' : 'Section registered without an adviser');
        } else {
            showCustomAlert('Error saving adviser assignment');
        }
    } catch (error) {
        showCustomAlert('Error: ' + error.message);
    }
}
// Load advisers for the current school year
async function loadAdvisers() {
    try {
        // Fetch sections with advisers for the current school year only
        const response = await fetch(`/api/advisers/?year=${currentSchoolYear}`);
        if (!response.ok) throw new Error('Failed to load advisers');
    
        const sections = await response.json(); // Get the data from the response
        
        // Transform sections data into adviser records
        advisers = sections.map(section => ({
            sectionId: section.sectionId,
            sectionName: section.sectionName,
            gradeLevel: section.gradeLevel,
            adviserId: section.adviserId,
            adviserName: section.adviserName,
            schoolYear: section.schoolYear
        }));
        
        updateAdvisersTable(); // Update the advisers table
    } catch (error) {
        showCustomAlert('Error loading advisers: ' + error.message);
    }
}

/**
 * Remove an adviser from a section
 * @param {string} sectionId - The ID of the section to remove the adviser from
 */
async function removeAdviser(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    
    if (confirm(`Are you sure you want to remove the adviser from section ${section.name}?`)) {
        try {
            const response = await fetch('/api/advisers/remove/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section_id: sectionId,
                    school_year: currentSchoolYear
                })
            });
            
            if (!response.ok) throw new Error('Failed to remove adviser');
            
            const result = await response.json();
            if (result.success) {
                await Promise.all([ // Update both adviser list and sections list
                    loadAdvisers(),
                    loadSections()
                ]);
                showCustomAlert('Adviser removed successfully');
            } else {
                showCustomAlert('Error removing adviser: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showCustomAlert('Error: ' + error.message);
        }
    }
}
// Update the advisers table with current data
function updateAdvisersTable() {
    const tbody = document.querySelector('#advisersTable tbody');
    
    if (advisers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No adviser assignments found. Please assign advisers to sections.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = advisers.map(adviser => `
        <tr>
            <td>${adviser.sectionName}</td>
            <td>Grade ${adviser.gradeLevel}</td>
            <td>${adviser.adviserName || 'None'}</td>
            <td>${adviser.schoolYear}</td>
            <td class="action-buttons">
                ${adviser.adviserId ? 
                    `<button onclick="removeAdviser('${adviser.sectionId}')" class="delete-button">
                        <span class="material-icons">person_remove</span>
                    </button>` : 
                    `<button onclick="assignAdviser('${adviser.sectionId}')" class="edit-button">
                        <span class="material-icons">person_add</span>
                    </button>`
                }
            </td>
        </tr>
    `).join('');
}
/**
 * Open the adviser form modal with a specific section pre-selected
 * @param {string} sectionId - The ID of the section to assign an adviser to
 */
function assignAdviser(sectionId) {
    openAdviserForm();
    
    setTimeout(() => {
        const sectionSelect = document.getElementById('adviserSection');
        sectionSelect.value = sectionId;
        updateGradeLevel();
    }, 100);
}
let currentDay = 'all';
function openTimeslotForm() { // Open the timeslot form modal for adding a new timeslot
    openEntityForm('timeslot');
    setTimeout(() => checkModalScrollable('timeslotModal'), 100);
}

function closeTimeslotForm() { // Close the timeslot form modal
    closeEntityForm('timeslot'); 
}

/**
 * Save timeslot data (create new or update existing)
 * @param {Event} event - The form submission event
 */
async function saveTimeslot(event) {
    event.preventDefault();
    
    const timeslotId = document.getElementById('timeslotId').value;
    const day = document.getElementById('timeslotDay').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const timeslotType = document.getElementById('timeslotType').value;
    
    // Validate required fields
    if (!timeslotId || !day || !startTime || !endTime) {
        showCustomAlert('Please fill in all required fields');
        return;
    }
    
    // Validate times (end time should be after start time)
    if (startTime >= endTime) {
        showCustomAlert('End time must be after start time');
        return;
    }
    
    // Calculate duration in minutes
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMinutes = Math.floor((end - start) / 60000);
    
    // Validate minimum duration for academic periods
    if (timeslotType === 'academic' && durationMinutes < 45) {
        const proceed = confirm('Warning: Academic periods should be at least 45 minutes. Do you want to continue anyway?');
        if (!proceed) return;
    }
    
    // Check for conflicts
    const conflicts = checkTimeConflicts(day, startTime, endTime, currentEditingId === timeslotId ? timeslotId : null);
    
    if (conflicts.length > 0) {
        // Show conflict warning and pass a callback for proceeding
        showConflictWarning(conflicts, () => {
            // This will run if the user chooses to save anyway
            submitTimeslotForm(timeslotId, day, startTime, endTime, timeslotType);
        });
        return;
    }
    
    // No conflicts, proceed with save
    await submitTimeslotForm(timeslotId, day, startTime, endTime, timeslotType);
}

/**
 * Submit the timeslot form data to the API
 */
async function submitTimeslotForm(timeslotId, day, startTime, endTime, timeslotType) {
    // Format data for API
    const timeslotData = {
        id: timeslotId,
        day: day,
        start_time: startTime,
        end_time: endTime,
        type: timeslotType
    };
    
    try {
        const response = await fetch('/api/timeslots/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(timeslotData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save timeslot');
        }
        
        const result = await response.json();
        if (result.success) {
            await loadTimeslots();  // Reload the data
            closeTimeslotForm();
            showCustomAlert(result.created ? 'Timeslot added successfully!' : 'Timeslot updated successfully!');
        } else {
            showCustomAlert('Error saving timeslot: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving timeslot:', error);
        showCustomAlert('Error: ' + error.message);
    }
}

/**
 * Load timeslot data into the form for editing
 * @param {string} timeslotId - The ID of the timeslot to edit
 */
function editTimeslot(timeslotId) {
    const timeslot = timeslots.find(t => t.id === timeslotId);
    if (!timeslot) return;

    currentEditingId = timeslotId;
    
    // Populate form with timeslot data
    document.getElementById('timeslotId').value = timeslot.id;
    document.getElementById('timeslotId').readOnly = true; // Prevent ID editing
    document.getElementById('timeslotDay').value = timeslot.day;
    document.getElementById('startTime').value = timeslot.start_time;
    document.getElementById('endTime').value = timeslot.end_time;
    
    // Change modal title and open
    document.querySelector('#timeslotModal h2').textContent = 'Edit Timeslot';
    document.getElementById('timeslotModal').style.display = 'block';
}

/**
 * Delete a timeslot after confirmation
 * @param {string} timeslotId - The ID of the timeslot to delete
 */
async function deleteTimeslot(timeslotId) {
    const timeslot = timeslots.find(t => t.id === timeslotId);
    
    if (confirm(`Are you sure you want to delete timeslot ${timeslot.id}?`)) {
        try {
            const response = await fetch(`/api/timeslots/delete/${timeslotId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete timeslot');
            
            const result = await response.json();
            if (result.success) {
                await loadTimeslots();  // Reload the data
                showCustomAlert(`Timeslot ${timeslot.id} has been deleted successfully.`);
            } else {
                showCustomAlert('Error deleting timeslot: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showCustomAlert('Error: ' + error.message);
        }
    }
}

/**
 * Filter timeslots by day
 * @param {string} day - The day to filter by ('all', 'Monday', 'Tuesday', etc.)
 */
function filterTimeslotsByDay(day) {
    currentDay = day;
    
    // Update active states
    document.querySelectorAll('#timeslotsView .day-filter-tabs .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateTimeslotsTable();
}
// Update the timeslots table with current data and apply filtering
function updateTimeslotsTable() {
    const tbody = document.querySelector('#timeslotsTable tbody');
    
    const filteredTimeslots = timeslots.filter(timeslot => {
        if (currentDay === 'all') return true;
        return timeslot.day === currentDay;
    });
    
    // Sort timeslots by day and then by start time
    filteredTimeslots.sort((a, b) => {
        if (a.day === b.day) {
            return a.start_time.localeCompare(b.start_time);
        }
        const dayOrder = {
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5
        };
        return dayOrder[a.day] - dayOrder[b.day];
    });
    
    if (filteredTimeslots.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No timeslots found for the selected day.
                </td>
            </tr>
        `;
        return;
    }
    // Format time display (12-hour format with AM/PM)
    const formatTime = (timeString) => {
        // Extract hours and minutes from the string (format: HH:MM:SS)
        const [hours, minutes] = timeString.substring(0, 5).split(':');
        
        // Convert hours to 12-hour format
        let hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        
        // Return formatted time
        return `${hour}:${minutes} ${ampm}`;
    };
    
    tbody.innerHTML = filteredTimeslots.map(timeslot => `
        <tr>
            <td>${timeslot.id}</td>
            <td>${timeslot.day}</td>
            <td>${formatTime(timeslot.start_time)}</td>
            <td>${formatTime(timeslot.end_time)}</td>
            <td class="action-buttons">
                <button onclick="editTimeslot('${timeslot.id}')" class="edit-button">
                    <span class="material-icons">edit</span>
                </button>
                <button onclick="deleteTimeslot('${timeslot.id}')" class="delete-button">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load timeslots from backend
async function loadTimeslots() {
    try {
        const response = await fetch('/api/timeslots/');
        
        if (!response.ok) {
            throw new Error(`Failed to load timeslots: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        timeslots = data;
        updateTimeslotsTable();
    } catch (error) {
        showCustomAlert('Error loading timeslots: ' + error.message);
    }
}

// Load teachers from backend
async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers/');
        const data = await handleApiResponse(response, 'api/teachers/');
        teachers = data;
        console.log('Loaded teachers:', teachers); // Debug log
        updateTeachersTable();
    } catch (error) {
        console.error('Error loading teachers:', error);
        showCustomAlert('Error loading teachers: ' + error.message);
    }
}

// Load sections from backend
async function loadSections() {
    try {
        const response = await fetch('/api/sections/');
        if (!response.ok) throw new Error('Failed to load sections');
        sections = await response.json();
        updateSectionsTable();
    } catch (error) {
        showCustomAlert('Error loading sections: ' + error.message);
    }
}

// Load subjects from backend
async function loadSubjects() {
    try {
        const response = await fetch('/api/subjects/');
        const data = await handleApiResponse(response, 'api/subjects/');
        subjects = data;
        console.log('Loaded subjects:', subjects); // Debug log
        updateSubjectsTable();
    } catch (error) {
        console.error('Error loading subjects:', error);
        showCustomAlert('Error loading subjects: ' + error.message);
    }
}

// GENERIC MODAL FUNCTIONS
/**
 * Generic function to open a form modal
 * @param {string} entityType - The type of entity ('teacher', 'section', 'subject', 'adviser', 'timeslot')
 */
function openEntityForm(entityType) {
    const modal = document.getElementById(`${entityType}Modal`);
    const form = document.getElementById(`${entityType}Form`);
    
    modal.style.display = 'block';
    form.reset();
    
    // Handle specific entity type requirements
    if (entityType !== 'adviser') {
        document.getElementById(`${entityType}Id`).readOnly = false;
    }
    
    currentEditingId = null;
    document.querySelector(`#${entityType}Modal h2`).textContent = `Add New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
    
    // Special handling for specific entity types
    if (entityType === 'subject') {
        setupSubjectFormEvents();
    } else if (entityType === 'adviser') {
        populateAdviserFormDropdowns();
    }
}

/**
 * Generic function to close a form modal
 * @param {string} entityType - The type of entity ('teacher', 'section', 'subject', 'adviser', 'timeslot')
 */
function closeEntityForm(entityType) {
    document.getElementById(`${entityType}Modal`).style.display = 'none';
    document.getElementById(`${entityType}Form`).reset();
    currentEditingId = null;
}

// Special setup for the subject form
function setupSubjectFormEvents() {
    // No special setup needed anymore since grade level and semester fields were removed
}

// Special setup for the adviser form
function populateAdviserFormDropdowns() {
    const sectionSelect = document.getElementById('adviserSection');
    const teacherSelect = document.getElementById('adviserTeacher');
    
    // Populate section dropdown
    sectionSelect.innerHTML = '<option value="">Select Section</option>' +
        sections.map(section => 
            `<option value="${section.id}" data-grade="${section.gradeLevel}">${section.name} (Grade ${section.gradeLevel})</option>`
        ).join('');
    
    // Populate teacher dropdown
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>' +
        teachers.map(teacher => 
            `<option value="${teacher.id}">${teacher.name}</option>`
        ).join('');
    
    // Reset grade level field
    document.getElementById('adviserGradeLevel').value = '';
}

/**
 * Update the duration display when start or end time changes
 */
function updateDurationDisplay() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const durationDisplay = document.getElementById('durationDisplay');
    const timeslotType = document.getElementById('timeslotType').value;
    const errorMessage = document.getElementById('durationErrorMessage');
    const errorText = document.getElementById('errorText');
    
    // Hide error message by default
    errorMessage.style.display = 'none';
    
    if (!startTime || !endTime) {
        durationDisplay.textContent = '--';
        durationDisplay.className = 'duration-display';
        return;
    }
    
    // Calculate duration in minutes
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Handle cases where endTime is earlier than startTime (next day)
    if (end < start) {
        durationDisplay.textContent = 'End time must be after start time';
        durationDisplay.className = 'duration-display error';
        
        // Show error message
        errorText.textContent = 'End time must be after start time.';
        errorMessage.style.display = 'flex';
        return;
    }
    
    const durationMs = end - start;
    const durationMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    // Format the duration display
    let durationText = '';
    if (hours > 0) {
        durationText += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    if (minutes > 0 || hours === 0) {
        durationText += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    durationDisplay.textContent = durationText;
    
    // Apply styling based on duration and slot type
    if (timeslotType === 'academic' && durationMinutes < 45) {
        durationDisplay.className = 'duration-display error';
        document.getElementById('timeslotTypeHint').textContent = 
            'Warning: Academic periods must be at least 45 minutes';
        
        // Show error message
        errorText.textContent = 'Error: Academic periods must be at least 45 minutes long to ensure sufficient learning time.';
        errorMessage.style.display = 'flex';
    } else if ((timeslotType === 'lunch' || timeslotType === 'recess') && durationMinutes > 60) {
        durationDisplay.className = 'duration-display warning';
        document.getElementById('timeslotTypeHint').textContent = 
            `${timeslotType === 'lunch' ? 'Lunch breaks' : 'Recess periods'} are usually shorter than 60 minutes`;
    } else {
        durationDisplay.className = 'duration-display valid';
        document.getElementById('timeslotTypeHint').textContent = 
            timeslotType === 'academic' ? 'Academic periods should be at least 45 minutes' : '';
    }
}

/**
 * Handle timeslot type change
 */
function handleTimeslotTypeChange() {
    const timeslotType = document.getElementById('timeslotType').value;
    const hint = document.getElementById('timeslotTypeHint');
    const activityNameGroup = document.getElementById('activityNameGroup');
    
    // Show/hide activity name field based on type
    if (timeslotType === 'other') {
        activityNameGroup.style.display = 'block';
        document.getElementById('activityName').required = true;
    } else {
        activityNameGroup.style.display = 'none';
        document.getElementById('activityName').required = false;
    }
    
    switch(timeslotType) {
        case 'academic':
            hint.textContent = 'Academic periods should be at least 45 minutes';
            break;
        case 'lunch':
            hint.textContent = 'Lunch breaks are typically 30-60 minutes';
            break;
        case 'recess':
            hint.textContent = 'Recess periods are typically 15-30 minutes';
            break;
        case 'other':
            hint.textContent = 'Please specify the duration appropriate for this activity';
            break;
    }
    
    // Update duration display with new type
    updateDurationDisplay();
}

/**
 * Check for time conflicts with existing timeslots
 * @param {string} day - The day to check
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {string} excludeId - Optional ID to exclude from comparison (for editing)
 * @returns {Array} - Array of conflicting timeslots
 */
function checkTimeConflicts(day, startTime, endTime, excludeId = null) {
    // Convert input times to Date objects for comparison
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Filter timeslots for the same day
    const sameDay = timeslots.filter(slot => 
        slot.day === day && (excludeId === null || slot.id !== excludeId)
    );
    
    // Find conflicts
    return sameDay.filter(slot => {
        const slotStart = new Date(`2000-01-01T${slot.start_time.substring(0, 5)}`);
        const slotEnd = new Date(`2000-01-01T${slot.end_time.substring(0, 5)}`);
        
        // Check for overlap: 
        // (start <= slotEnd) && (end >= slotStart)
        return (start <= slotEnd && end >= slotStart);
    });
}

/**
 * Show conflict warning for overlapping timeslots
 * @param {Array} conflicts - Array of conflicting timeslots
 * @param {Function} onProceed - Callback for when user chooses to proceed
 */
function showConflictWarning(conflicts, onProceed) {
    // Create the warning element
    const warningEl = document.createElement('div');
    warningEl.className = 'conflict-warning';
    
    // Format time for display
    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.substring(0, 5).split(':');
        const hour = parseInt(hours, 10) % 12 || 12;
        const ampm = parseInt(hours, 10) >= 12 ? 'PM' : 'AM';
        return `${hour}:${minutes} ${ampm}`;
    };
    
    // Create the content
    warningEl.innerHTML = `
        <span class="material-icons">warning</span>
        <div class="conflict-content">
            <h4>Time Conflict Detected</h4>
            <p>The timeslot you're trying to save overlaps with existing timeslots:</p>
            <div class="conflict-details">
                <ul class="conflict-list">
                    ${conflicts.map(slot => `
                        <li>ID: ${slot.id} (${slot.day}, ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)})</li>
                    `).join('')}
                </ul>
            </div>
            <div class="conflict-buttons">
                <button class="resolve-button">Edit to Resolve</button>
                <button class="ignore-button">Save Anyway</button>
            </div>
        </div>
    `;
    
    // Add to form
    const form = document.getElementById('timeslotForm');
    
    // Remove any existing warning
    const existingWarning = form.querySelector('.conflict-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // Insert before the form actions
    form.querySelector('.form-actions').before(warningEl);
    
    // Add event listeners
    warningEl.querySelector('.resolve-button').addEventListener('click', () => {
        warningEl.remove();
    });
    
    warningEl.querySelector('.ignore-button').addEventListener('click', () => {
        warningEl.remove();
        onProceed();
    });
}

/**
 * Check if modal content is scrollable and add visual indicator if needed
 * @param {string} modalId - The ID of the modal to check
 */
function checkModalScrollable(modalId) {
    const modalContent = document.querySelector(`#${modalId} .modal-content`);
    if (!modalContent) return;
    
    // Check if content is scrollable (content height > visible height)
    const isScrollable = modalContent.scrollHeight > modalContent.clientHeight;
    
    // If scrollable, add a visual indicator
    if (isScrollable && !modalContent.querySelector('.scroll-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = '<span class="material-icons">expand_more</span>';
        modalContent.appendChild(indicator);
        
        // Remove the indicator after user starts scrolling
        modalContent.addEventListener('scroll', function() {
            const scrollIndicator = this.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (scrollIndicator.parentNode === this) {
                        this.removeChild(scrollIndicator);
                    }
                }, 300);
            }
        }, { once: true });
    }
}

// Update modal open functions to check for scrollable content
function openTeacherForm() {
    openEntityForm('teacher');
    setTimeout(() => checkModalScrollable('teacherModal'), 100);
}

function openSectionForm() {
    openEntityForm('section');
    setTimeout(() => checkModalScrollable('sectionModal'), 100);
}

function openSubjectForm() {
    openEntityForm('subject');
    setTimeout(() => checkModalScrollable('subjectModal'), 100);
}

function openAdviserForm() {
    openEntityForm('adviser');
    setTimeout(() => checkModalScrollable('adviserModal'), 100);
}

function openTimeslotForm() {
    openEntityForm('timeslot');
    setTimeout(() => checkModalScrollable('timeslotModal'), 100);
}

// Add this to the document ready event handler
document.addEventListener('DOMContentLoaded', async () => {
    // Set initial state
    currentGrade = 100;
    
    // Load data from backend
    await loadCurrentSchoolYear();
      // Load all data explicitly
    await Promise.all([
        loadTeachers(),
        loadSections(),
        loadSubjects(),
        loadTimeslots()
    ]);  
    await loadAdvisers();
    
    // Set 'All Days' button as active for timeslots
    if (document.querySelector('#timeslotsView .day-filter-tabs .tab-button')) {
        document.querySelector('#timeslotsView .day-filter-tabs .tab-button').classList.add('active');
    }
    
    // Set up modal close when clicking outside
    setupModalCloseHandlers();
    
    // Add event delegation for timeslots tab click
    document.querySelectorAll('.management-tabs .tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const view = this.textContent.toLowerCase().trim();
            if (view === 'timeslots') {
                loadTimeslots();
            }
        });
    });
});

/**
 * Helper function to debug fetch responses
 * @param {Response} response - The fetch response object
 * @param {string} endpoint - The API endpoint being called
 * @returns {Promise} - JSON data if response is ok, otherwise throws an error with details
 */
async function handleApiResponse(response, endpoint) {
    if (!response.ok) {
        try {
            // Try to get error details from the response if possible
            const errorData = await response.json();
            throw new Error(`API error (${response.status}) from ${endpoint}: ${errorData.error || errorData.detail || JSON.stringify(errorData)}`);
        } catch (jsonError) {
            // If we can't parse the error as JSON, use the status text
            throw new Error(`API error (${response.status}) from ${endpoint}: ${response.statusText}`);
        }
    }
    
    return response.json();
}