document.addEventListener('DOMContentLoaded', function() {
    console.log('TaskFlow app started!');
});
    

    // Hamburger menu
    document.getElementById('hamburger-btn')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Dark mode
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const html = document.documentElement;
      html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    // New Task modal functionality
    const newTaskButton = document.getElementById('btn-new-task');
    const taskModal = document.getElementById('task-modal');
    const closeModalButton = document.getElementById('close-modal');

    newTaskButton?.addEventListener('click', () => {
      taskModal.showModal();
    });

    closeModalButton?.addEventListener('click', () => {
      taskModal.close();
    });

//Calendar
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    if(calendarEl) { // check that element exists
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            height: 400,
            events: [
                { title: 'Math Assignment', start: '2026-03-18' },
                { title: 'Project Meeting', start: '2026-03-20' }
            ]
        });
        calendar.render();
    }
});
    


 //Profile drop down
 const profileIcon = document.getElementById("profile-icon");
const dropdownMenu = document.getElementById("dropdown-menu");

profileIcon.addEventListener("click", () => {
  dropdownMenu.classList.toggle("show");
});

// close menu when clicking outside
window.addEventListener("click", (e) => {
  if (!profileIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.remove("show");
  }
});