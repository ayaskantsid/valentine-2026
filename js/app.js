const app = document.getElementById("app");

// =====================================================
// TIMEZONE SAFE UTILITIES (IST)
// =====================================================

// Returns current UTC time
function getNowUTC() {
  return new Date();
}

// Returns a Date object representing 00:00 IST for a given day,
// but stored as UTC (safe for comparisons)
// Parameters: year (YYYY), month (0-indexed, 0=Jan), day (1-31)
function getISTMidnightAsUTC(year, month, day) {
  // IST = UTC +05:30, so IST midnight (00:00) = UTC 18:30 previous day
  const istMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0));
  return new Date(istMidnight.getTime() - (5.5 * 60 * 60 * 1000));
}

// Returns MM-DD key based on current IST date
function getTodayKeyInIST() {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");

  return `${month}-${day}`;
}

// Returns the CSS class for the current day's theme
function getDayThemeClass() {
  const key = getTodayKeyInIST();
  const dayMap = {
    "02-03": "rose-day",          // Rose Day
    "02-04": "propose-day",       // Propose Day
    "02-05": "chocolate-day",     // Chocolate Day
    "02-06": "teddy-day",         // Teddy Day
    "02-07": "promise-day",       // Promise Day
    "02-08": "hug-day",           // Hug Day
    "02-09": "kiss-day",          // Kiss Day
    "02-14": "valentines-day",    // Valentine's Day
  };
  return dayMap[key] || "";
}

// =====================================================
// DATE SETUP (IST-BASED)
// =====================================================

const nowUTC = getNowUTC();
const year = nowUTC.getUTCFullYear();

// 🔒 CHANGE THESE WHEN NEEDED
const startDate = getISTMidnightAsUTC(year, 1, 3);  // Feb 3, 00:00 IST
const endDate   = getISTMidnightAsUTC(year, 1, 14);  // Feb 14, 00:00 IST

console.log(startDate, endDate);


// =====================================================
// VIEW LOADER
// =====================================================

async function loadView(path) {
  // Clear all active intervals before transitioning
  clearActiveIntervals();
  
  // Fade out current view
  const existingView = app.querySelector(".view");
  if (existingView) {
    existingView.classList.remove("show");
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  const res = await fetch(path);
  if (!res.ok) throw new Error("Ended");

  const html = await res.text();

  app.innerHTML = `<div class="view">${html}</div>`;

  // Fade in new view
  requestAnimationFrame(() => {
    const newView = app.querySelector(".view");
    newView.classList.add("show");
  });
}

// =====================================================
// COUNTDOWN VIEW
// =====================================================

async function renderCountdown() {
  await loadView("views/countdown/countdown.html");
  
  // Apply countdown day gradient to the view
  const viewElement = app.querySelector(".view");
  if (viewElement) {
    viewElement.classList.add("countdown-day");
  }

  const dEl = document.getElementById("days");
  const hEl = document.getElementById("hours");
  const mEl = document.getElementById("minutes");
  const sEl = document.getElementById("seconds");

  const interval = setInterval(() => {
    const currentUTC = getNowUTC();
    const diff = startDate - currentUTC;

    if (diff <= 0) {
      clearInterval(interval);
      renderSecret();
      return;
    }

    dEl.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
    hEl.textContent = Math.floor((diff / (1000 * 60 * 60)) % 24);
    mEl.textContent = Math.floor((diff / (1000 * 60)) % 60);
    sEl.textContent = Math.floor((diff / 1000) % 60);
  }, 1000);
  activeIntervals.push(interval);
}

// =====================================================
// SECRET VIEW
// =====================================================

async function renderSecret() {
  await loadView("views/secret/secret.html");
  
  // Apply secret screen gradient to the view
  const viewElement = app.querySelector(".view");
  if (viewElement) {
    viewElement.classList.add("secret-screen");
  }
  
  renderSecretCountdown();

  // Automatically transition to daily view after 20 seconds
  setTimeout(() => {
    renderToday();
  }, 20000);
}

// =====================================================
// SECRET COUNTDOWN
// =====================================================

function renderSecretCountdown() {
  const countdownHTML = `
    <div class="daily-countdown">
      <p>Continuing in:</p>
      <div class="countdown-mini">
        <div class="time-item">
          <span id="secret-seconds">20</span>
          <small>s</small>
        </div>
      </div>
    </div>
  `;

  const viewElement = app.querySelector(".view");
  if (viewElement) {
    viewElement.innerHTML += countdownHTML;
  }

  let secondsLeft = 20;

  // Update countdown every second
  const interval = setInterval(() => {
    secondsLeft--;

    const sEl = document.getElementById("secret-seconds");
    if (sEl) sEl.textContent = secondsLeft;

    if (secondsLeft <= 0) {
      clearInterval(interval);
      activeIntervals = activeIntervals.filter(id => id !== interval);
    }
  }, 1000);
  activeIntervals.push(interval);
}

// =====================================================
// DAY VIEW
// =====================================================

async function renderToday() {
  const key = getTodayKeyInIST();
  console.log(key);
  
  const path = `views/days/${key}.html`;

  try {
    await loadView(path);
    
    // Apply day theme class to the view
    const viewElement = app.querySelector(".view");
    if (viewElement) {
      const themeClass = getDayThemeClass();
      if (themeClass) {
        viewElement.classList.add(themeClass);
      }
    }
    
    renderDailyCountdown();
  } catch {
    // Show fallback message with proper styling
    app.innerHTML = `
      <div class="view show valentines-day">
        <h1>Hey Tamanna</h1>
        <h3>I had a feeling you'd return.</h3> <br />
        <p>
          <br />
          I am leaving this ❤️ here for you just so that you know how much I love you.
        </p>
      </div>
    `;
  }
}

// =====================================================
// DAILY COUNTDOWN
// =====================================================

function renderDailyCountdown() {
  const now = new Date();
  
  // Get tomorrow's IST date using UTC methods consistently
  const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const tomorrowIST = new Date(istNow.getTime() + (24 * 60 * 60 * 1000));
  
  // Calculate next midnight in IST, then convert to UTC for comparison
  const nextMidnightIST = new Date(Date.UTC(
    tomorrowIST.getUTCFullYear(),
    tomorrowIST.getUTCMonth(),
    tomorrowIST.getUTCDate(),
    0, 0, 0
  ));
  const nextMidnightUTC = new Date(nextMidnightIST.getTime() - (5.5 * 60 * 60 * 1000));

  const countdownHTML = `
    <div class="daily-countdown">
      <p>Next comes something warm:</p>
      <div class="countdown-mini">
        <div class="time-item">
          <span id="next-hours">0</span>
          <small>h</small>
        </div>
        <div class="time-item">
          <span id="next-minutes">0</span>
          <small>m</small>
        </div>
        <div class="time-item">
          <span id="next-seconds">0</span>
          <small>s</small>
        </div>
      </div>
    </div>
  `;

  const viewElement = app.querySelector(".view");
  if (viewElement) {
    viewElement.innerHTML += countdownHTML;
  }

  // Update countdown every second
  const interval = setInterval(() => {
    const currentUTC = getNowUTC();
    const diff = nextMidnightUTC - currentUTC;

    if (diff <= 0) {
      clearInterval(interval);
      renderToday();
      return;
    }

    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const hEl = document.getElementById("next-hours");
    const mEl = document.getElementById("next-minutes");
    const sEl = document.getElementById("next-seconds");

    if (hEl) hEl.textContent = hours;
    if (mEl) mEl.textContent = minutes;
    if (sEl) sEl.textContent = seconds;
  }, 1000);
  activeIntervals.push(interval);
}

// =====================================================
// APP ENTRY POINT
// =====================================================

// Store active intervals for cleanup
let activeIntervals = [];

// Clear all active intervals before starting new view
function clearActiveIntervals() {
  activeIntervals.forEach(id => clearInterval(id));
  activeIntervals = [];
}

if (nowUTC < startDate) {
  renderCountdown();
} else {
    setTimeout(() => {
    renderToday();
    // renderSecret();
    }, 800);
}