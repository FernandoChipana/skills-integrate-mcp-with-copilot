document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const teacherMenuButton = document.getElementById("teacher-menu-button");
  const teacherMenu = document.getElementById("teacher-menu");
  const teacherStatus = document.getElementById("teacher-status");
  const teacherLoginButton = document.getElementById("teacher-login-button");
  const teacherLogoutButton = document.getElementById("teacher-logout-button");
  const loginModal = document.getElementById("login-modal");
  const closeLoginModal = document.getElementById("close-login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const signupHelper = document.getElementById("signup-helper");

  let teacherSession = null;

  function authHeader() {
    if (!teacherSession?.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${teacherSession.token}`,
    };
  }

  function authHeaderForToken(token) {
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  function clearMessage(target) {
    target.textContent = "";
    target.className = "hidden";
  }

  function showMessage(target, text, type) {
    target.textContent = text;
    target.className = type;
    target.classList.remove("hidden");
  }

  function saveTeacherSession(session) {
    teacherSession = session;
    localStorage.setItem("teacherSession", JSON.stringify(session));
  }

  function clearTeacherSession() {
    teacherSession = null;
    localStorage.removeItem("teacherSession");
  }

  function updateTeacherUi() {
    const isLoggedIn = Boolean(teacherSession?.token);
    teacherStatus.textContent = isLoggedIn
      ? `Logged in as ${teacherSession.teacher.display_name}`
      : "Viewing as student";
    teacherLoginButton.classList.toggle("hidden", isLoggedIn);
    teacherLogoutButton.classList.toggle("hidden", !isLoggedIn);
    signupForm.classList.toggle("hidden", !isLoggedIn);
    signupHelper.textContent = isLoggedIn
      ? "Teachers can register or remove students from activities."
      : "Teacher login required to register or remove students.";
  }

  async function restoreTeacherSession() {
    const rawSession = localStorage.getItem("teacherSession");
    if (!rawSession) {
      updateTeacherUi();
      return;
    }

    try {
      const session = JSON.parse(rawSession);
      const response = await fetch("/auth/session", {
        headers: authHeaderForToken(session.token),
      });

      if (!response.ok) {
        clearTeacherSession();
        updateTeacherUi();
        return;
      }

      const result = await response.json();
      teacherSession = {
        token: session.token,
        teacher: result.teacher,
      };
      localStorage.setItem("teacherSession", JSON.stringify(teacherSession));
    } catch (error) {
      clearTeacherSession();
    }

    updateTeacherUi();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${teacherSession?.token ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">Remove</button>` : ""}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!teacherSession?.token) {
      showMessage(messageDiv, "Teacher login required.", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: authHeader(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!teacherSession?.token) {
      showMessage(messageDiv, "Teacher login required.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: authHeader(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  teacherMenuButton.addEventListener("click", () => {
    teacherMenu.classList.toggle("hidden");
  });

  teacherLoginButton.addEventListener("click", () => {
    clearMessage(loginMessage);
    teacherMenu.classList.add("hidden");
    loginModal.classList.remove("hidden");
  });

  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
    clearMessage(loginMessage);
  });

  teacherLogoutButton.addEventListener("click", async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: authHeader(),
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    clearTeacherSession();
    updateTeacherUi();
    teacherMenu.classList.add("hidden");
    showMessage(messageDiv, "Logged out successfully.", "success");
    fetchActivities();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(loginMessage, result.detail || "Login failed.", "error");
        return;
      }

      saveTeacherSession(result);
      updateTeacherUi();
      loginModal.classList.add("hidden");
      loginForm.reset();
      clearMessage(loginMessage);
      showMessage(messageDiv, `Welcome, ${result.teacher.display_name}.`, "success");
      fetchActivities();
    } catch (error) {
      showMessage(loginMessage, "Failed to sign in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  document.addEventListener("click", (event) => {
    if (!teacherMenu.contains(event.target) && event.target !== teacherMenuButton) {
      teacherMenu.classList.add("hidden");
    }

    if (event.target === loginModal) {
      loginModal.classList.add("hidden");
      loginForm.reset();
      clearMessage(loginMessage);
    }
  });

  // Initialize app
  restoreTeacherSession().then(fetchActivities);
});
