//Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navTop');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    //Add/remove scrolled class based on scroll position
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

//scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

//Observe elements with animation
document.querySelectorAll('.class-programs, .program-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    observer.observe(el);
});

function scrollToSection(sectionId) {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        event.currentTarget.classList.add('active');
        
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        if (window.innerWidth < 768) {
            toggleMenu();
        }
    }
}

function toggleMenu() {
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

// Initialize programs array from localStorage
let classPrograms = JSON.parse(localStorage.getItem('classPrograms')) || [];

function openNewProgramModal() {
    const modal = document.getElementById('newProgramModal');
    modal.style.display = 'block';
    
    // Set default year to current year
    const currentYear = new Date().getFullYear();
    document.getElementById('programStartYear').value = currentYear;
    updateProgramEndYear();
}

function closeNewProgramModal() {
    const modal = document.getElementById('newProgramModal');
    modal.style.display = 'none';
    document.getElementById('newProgramForm').reset();
}

function updateProgramEndYear() {
    const startYear = parseInt(document.getElementById('programStartYear').value);
    document.getElementById('programEndYear').value = startYear + 1;
}

function createNewProgram(event) {
    event.preventDefault();
    
    const startYear = document.getElementById('programStartYear').value;
    const endYear = document.getElementById('programEndYear').value;
    const schoolYear = `${startYear}-${endYear}`;
    
    // Check if program already exists
    if (classPrograms.some(program => program.schoolYear === schoolYear)) {
        alert('A program for this school year already exists!');
        return;
    }
    
    // Create new program
    const newProgram = {
        id: Date.now(),
        schoolYear: schoolYear,
        createdAt: new Date().toISOString(),
        schedules: []
    };
    
    classPrograms.push(newProgram);
    localStorage.setItem('classPrograms', JSON.stringify(classPrograms));

    addProgramCard(newProgram);

    closeNewProgramModal();
}

function addProgramCard(program) {
    const programList = document.querySelector('.program-list');
    const addProgramCard = document.querySelector('.add-program');
    
    const newCard = document.createElement('div');
    newCard.className = 'program-card';
    newCard.innerHTML = `
        <h3>SY ${program.schoolYear}</h3>
        <p>Manage and view your class schedules for this school year.</p>
        <div class="program-image">
            <img src="Browser Frame.svg" alt="Timetable Preview">
        </div>
        <div class="card-actions">
            <button class="view-button" onclick="window.location.href='{% url 'class_programs' %}?year=${program.schoolYear}'">
                View
            </button>
            <button class="delete-button" onclick="deleteProgram('${program.id}')">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `;
    
    // Insert new card after the add program card
    programList.insertBefore(newCard, addProgramCard.nextSibling);
}

function deleteProgram(programId) {
    if (confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
        classPrograms = classPrograms.filter(program => program.id !== parseInt(programId));
        localStorage.setItem('classPrograms', JSON.stringify(classPrograms));
        renderPrograms();
    }
}

function renderPrograms() {
    // Clear existing program cards (except add-program)
    const programList = document.querySelector('.program-list');
    const addProgramCard = document.querySelector('.add-program');
    while (programList.lastChild && !programList.lastChild.classList.contains('add-program')) {
        programList.removeChild(programList.lastChild);
    }
    // Sort programs by school year (newest first)
    classPrograms.sort((a, b) => {
        const yearA = parseInt(a.schoolYear.split('-')[0]);
        const yearB = parseInt(b.schoolYear.split('-')[0]);
        return yearB - yearA;
    });
    
    classPrograms.forEach(program => addProgramCard(program));
}
// Video Modal Functions
function openVideoModal() {
  const modal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modal-video');
  
  modal.style.display = 'flex';
 
  modalVideo.currentTime = 0;
  modalVideo.play();
  
  document.body.style.overflow = 'hidden';

  document.addEventListener('keydown', closeModalOnEscape);
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modal-video');
  
  modal.style.display = 'none';
  modalVideo.pause();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', closeModalOnEscape);
}

function closeModalOnEscape(e) {
  if (e.key === 'Escape') {
    closeVideoModal();
  }
}
// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderPrograms();
    
    window.onclick = function(event) {// Close modal if clicked outside
        const modal = document.getElementById('newProgramModal');
        if (event.target === modal) {
            closeNewProgramModal();
        }
    };
    
    // Set active menu item based on current section
    const setActiveMenuItem = () => {
        const currentSection = window.location.hash || '#classPrograms';
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === currentSection);
        });
    };
    
    setActiveMenuItem();
    window.addEventListener('hashchange', setActiveMenuItem);

    const videoModal = document.getElementById('videoModal');
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
});

let lastScrollTop = 0;
const nav = document.querySelector(".navTop");

window.addEventListener("scroll", () => {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop) {
        nav.style.top = "-100px";
    } else {
        nav.style.top = "0";
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});