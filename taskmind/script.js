document.addEventListener('DOMContentLoaded', function () {
  console.log('✅ TaskFlow app started!');

  const API_URL = "http://localhost:3000";

  function getCurrentUser() {
    const savedUser = localStorage.getItem("taskmind_user");
    return savedUser ? JSON.parse(savedUser) : null;
  }

  function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? user.id : null;
  }

  function requireLogin() {
    const protectedPages = [
      "dashboard.html",
      "myTasks.html",
      "calendar.html",
      "analytics.html"
    ];

    const currentPage = window.location.pathname.split("/").pop();

    if (protectedPages.includes(currentPage) && !getCurrentUser()) {
      alert("Please log in first.");
      window.location.href = "login.html";
    }
  }

  requireLogin();

  /* =========================
     PROFILE DROPDOWN
  ========================= */
  const profileIcon = document.getElementById("profile-icon");
  const dropdownMenu = document.getElementById("dropdown-menu");

  if (profileIcon && dropdownMenu) {
    profileIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    window.addEventListener("click", (e) => {
      if (!profileIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  }

  /* =========================
     LOGOUT
  ========================= */
  window.logoutUser = function () {
    localStorage.removeItem("taskmind_user");
    window.location.href = "login.html";
  };

  const logoutLinks = document.querySelectorAll('[data-logout="true"]');
  logoutLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      logoutUser();
    });
  });

  /* =========================
     HELPERS
  ========================= */
  function getStatusFromProgress(progress) {
    if (progress >= 100) return "completed";
    if (progress > 0) return "in-progress";
    return "pending";
  }

  function formatDate(dateValue) {
    if (!dateValue) return "";
    return String(dateValue).split("T")[0];
  }

  function renderTask(task) {
    return `
      <div class="task">
        <span class="task-name">${task.title}</span>
        <span class="due-date">Due: ${formatDate(task.due_date)}</span>
        <div class="progress-bar">
          <div class="progress" style="width: ${task.progress}%;"></div>
        </div>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <button onclick="increaseProgress(${task.id}, ${task.progress})">+10%</button>
          <button onclick="deleteTask(${task.id})">Delete</button>
        </div>
      </div>
    `;
  }

  /* =========================
     SIGNUP
  ========================= */
  const signupForm = document.getElementById("signup-form");

  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullname = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("password-confirm").value;

      if (!fullname || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: fullname,
          email: email,
          password: password
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.message === "Signup successful") {
            alert("Account created successfully. Please sign in.");
            window.location.href = "login.html";
          } else if (data.message === "Email already exists") {
            alert("That email is already registered.");
          } else {
            alert(data.message || "Signup failed.");
          }
        })
        .catch(err => {
          console.error("❌ Signup error:", err);
          alert("Something went wrong during signup.");
        });
    });
  }

  /* =========================
     LOGIN
  ========================= */
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.message === "Login successful" && data.user) {
            localStorage.setItem("taskmind_user", JSON.stringify(data.user));
            alert(`Welcome, ${data.user.name}!`);
            window.location.href = "dashboard.html";
          } else {
            alert(data.message || "Login failed.");
          }
        })
        .catch(err => {
          console.error("❌ Login error:", err);
          alert("Something went wrong during login.");
        });
    });
  }

  /* =========================
     MY TASKS
  ========================= */
  function loadTasks() {
    const columns = document.querySelectorAll(".task-content");
    const userId = getCurrentUserId();

    if (columns.length === 0 || !userId) return;

    fetch(`${API_URL}/tasks/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("📦 User tasks:", data);

        columns.forEach(col => col.innerHTML = "");

        data.forEach(task => {
          const taskHTML = renderTask(task);
          const category = (task.category || "").toLowerCase();

          if (category.includes("assignment")) {
            if (columns[0]) columns[0].innerHTML += taskHTML;
          } else if (category.includes("exam")) {
            if (columns[1]) columns[1].innerHTML += taskHTML;
          } else if (category.includes("test") || category.includes("quiz")) {
            if (columns[2]) columns[2].innerHTML += taskHTML;
          } else {
            if (columns[3]) columns[3].innerHTML += taskHTML;
          }
        });
      })
      .catch(err => console.error("❌ Error loading tasks:", err));
  }

  const addTaskBtn = document.getElementById("add-task-btn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      const userId = getCurrentUserId();
      if (!userId) {
        alert("Please log in first.");
        return;
      }

      const title = prompt("Enter task title:");
      if (!title) return;

      const category = prompt("Enter category: Assignments, Exams, Tests / Quizzes, or Extra-Curricular");
      if (!category) return;

      const due_date = prompt("Enter due date in this format: YYYY-MM-DD");
      if (!due_date) return;

      fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          category,
          due_date,
          progress: 0,
          status: "pending"
        })
      })
        .then(res => res.json())
        .then(() => {
          alert("Task added successfully");
          loadTasks();
          loadDashboard();
          loadCalendar();
          loadAnalytics();
        })
        .catch(err => {
          console.error("❌ Error adding task:", err);
          alert("Failed to add task");
        });
    });
  }

  window.increaseProgress = function (id, currentProgress) {
    let newProgress = currentProgress + 10;
    if (newProgress > 100) newProgress = 100;

    const newStatus = getStatusFromProgress(newProgress);

    fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        progress: newProgress,
        status: newStatus
      })
    })
      .then(res => res.json())
      .then(() => {
        loadTasks();
        loadDashboard();
        loadCalendar();
        loadAnalytics();
      })
      .catch(err => {
        console.error("❌ Error updating task:", err);
        alert("Failed to update task");
      });
  };

  window.deleteTask = function (id) {
    const confirmed = confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(() => {
        loadTasks();
        loadDashboard();
        loadCalendar();
        loadAnalytics();
      })
      .catch(err => {
        console.error("❌ Error deleting task:", err);
        alert("Failed to delete task");
      });
  };

  /* =========================
     DASHBOARD
  ========================= */
  function loadDashboard() {
    const userId = getCurrentUserId();

    const totalTasksEl = document.getElementById("totalTasks");
    const dueTodayEl = document.getElementById("dueToday");
    const highPriorityEl = document.getElementById("highPriority");
    const assignedToMeEl = document.getElementById("assignedToMe");
    const todoColumn = document.getElementById("todoColumn");
    const inProgressColumn = document.getElementById("inProgressColumn");
    const completedColumn = document.getElementById("completedColumn");

    if (
      !userId ||
      !totalTasksEl ||
      !dueTodayEl ||
      !highPriorityEl ||
      !assignedToMeEl ||
      !todoColumn ||
      !inProgressColumn ||
      !completedColumn
    ) {
      return;
    }

    fetch(`${API_URL}/dashboard-summary/${userId}`)
      .then(res => res.json())
      .then(data => {
        totalTasksEl.textContent = data.totalTasks;
        dueTodayEl.textContent = data.dueToday;
        highPriorityEl.textContent = data.highPriority;
        assignedToMeEl.textContent = data.assignedToMe;

        todoColumn.innerHTML = "";
        inProgressColumn.innerHTML = "";
        completedColumn.innerHTML = "";

        data.todo.forEach(task => {
          todoColumn.innerHTML += `<div class="task">${task.title}</div>`;
        });

        data.inProgress.forEach(task => {
          inProgressColumn.innerHTML += `<div class="task">${task.title}</div>`;
        });

        data.completed.forEach(task => {
          completedColumn.innerHTML += `<div class="task">${task.title}</div>`;
        });
      })
      .catch(err => console.error("❌ Dashboard error:", err));
  }

  /* =========================
     CALENDAR
  ========================= */
  function loadCalendar() {
    const userId = getCurrentUserId();
    const calendarEl = document.getElementById("calendar");
    const progressSummary = document.getElementById("progressSummary");

    if (!userId || !calendarEl || typeof FullCalendar === "undefined") return;

    fetch(`${API_URL}/tasks/user/${userId}`)
      .then(res => res.json())
      .then(tasks => {
        const events = tasks.map(task => ({
          title: task.title,
          start: formatDate(task.due_date)
        }));

        const completed = tasks.filter(task => task.status === "completed").length;

        if (progressSummary) {
          progressSummary.textContent = `${completed} / ${tasks.length} Tasks Done`;
        }

        if (calendarEl._calendarInstance) {
          calendarEl._calendarInstance.destroy();
        }

        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          height: 400,
          events: events
        });

        calendar.render();
        calendarEl._calendarInstance = calendar;
      })
      .catch(err => console.error("❌ Calendar error:", err));
  }

  /* =========================
     ANALYTICS
  ========================= */
  function loadAnalytics() {
    const userId = getCurrentUserId();

    const completedTasksEl = document.getElementById("completedTasks");
    const pendingTasksEl = document.getElementById("pendingTasks");
    const totalTasksEl = document.getElementById("totalTasks");
    const upcomingDeadlinesEl = document.getElementById("upcomingDeadlines");
    const categoryCanvas = document.getElementById("categoryChart");
    const progressCanvas = document.getElementById("progressChart");

    if (
      !userId ||
      !completedTasksEl ||
      !pendingTasksEl ||
      !totalTasksEl ||
      !upcomingDeadlinesEl ||
      !categoryCanvas ||
      !progressCanvas ||
      typeof Chart === "undefined"
    ) {
      return;
    }

    fetch(`${API_URL}/analytics-summary/${userId}`)
      .then(res => res.json())
      .then(data => {
        completedTasksEl.textContent = data.completedTasks;
        pendingTasksEl.textContent = data.pendingTasks;
        totalTasksEl.textContent = data.totalTasks;
        upcomingDeadlinesEl.textContent = data.upcomingDeadlines;

        if (window.categoryChartInstance) {
          window.categoryChartInstance.destroy();
        }

        if (window.progressChartInstance) {
          window.progressChartInstance.destroy();
        }

        const ctxCategory = categoryCanvas.getContext("2d");
        window.categoryChartInstance = new Chart(ctxCategory, {
          type: "doughnut",
          data: {
            labels: data.categoryLabels,
            datasets: [{
              label: "Tasks by Category",
              data: data.categoryData,
              backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#f43f5e']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "bottom" }
            }
          }
        });

        const ctxProgress = progressCanvas.getContext("2d");
        window.progressChartInstance = new Chart(ctxProgress, {
          type: "bar",
          data: {
            labels: data.progressLabels,
            datasets: [{
              label: "Progress %",
              data: data.progressData,
              backgroundColor: '#4f46e5'
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        });
      })
      .catch(err => console.error("❌ Analytics error:", err));
  }

  loadTasks();
  loadDashboard();
  loadCalendar();
  loadAnalytics();
});