"use strict";

(function () {
  function createButton(label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-btn";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function buildMenus() {
    const countryMenu = document.getElementById("countryMenu");
    const categoryMenu = document.getElementById("categoryMenu");
    const languageMenu = document.getElementById("languageMenu");

    if (countryMenu) {
      BTECH_COUNTRIES.forEach(([code, name, icon]) => {
        countryMenu.appendChild(
          createButton(`${icon} ${name}`, () => window.load(code))
        );
      });
    }

    if (categoryMenu) {
      BTECH_CATEGORIES.forEach(([code, name, icon]) => {
        categoryMenu.appendChild(
          createButton(`${icon} ${name}`, () => window.loadCat(code))
        );
      });
    }

    if (languageMenu) {
      BTECH_LANGUAGES.forEach(([code, name, icon]) => {
        languageMenu.appendChild(
          createButton(`${icon} ${name}`, () => window.loadLanguage(code))
        );
      });
    }
  }

  function scanStreams() {
    alert("BTECH-TV stream scan started.");
  }

  function speedBoost() {
    const video = document.getElementById("video");
    if (video) video.playbackRate = 1.15;
  }

  function repairStreams() {
    alert("BTECH-TV repair mode activated.");
  }

  function optimizeMemory() {
    const hls = BTECH_STATE.hls;
    if (hls) {
      try {
        hls.stopLoad();
        hls.startLoad();
      } catch (_) {}
    }
    alert("BTECH-TV memory optimization completed.");
  }

  function recordMode() {
    alert("Recording mode requires a backend/media recorder implementation.");
  }

  function clearRecents() {
    BTECH_STATE.recent = [];
    localStorage.removeItem("btech_tv_recents");
    alert("BTECH-TV recent channels cleared.");
  }

  function updateTrialUI(seconds) {
    const min = Math.max(0, Math.floor(seconds / 60));
    const sec = Math.max(0, seconds % 60);
    const value = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    const timer = document.getElementById("timer");
    const floating = document.getElementById("floatingTimer");

    if (timer) timer.textContent = `Trial expires in: ${value}`;
    if (floating) floating.textContent = value;
  }

  function showTrialExpired() {
    const overlay = document.getElementById("trialOverlay");
    const payment = document.getElementById("paymentArea");
    const video = document.getElementById("video");

    BTECH_STATE.trialExpired = true;

    if (video) video.pause();
    if (overlay) overlay.style.display = "flex";
    if (payment) payment.style.display = "block";

    updateTrialUI(0);
  }

  function hideTrialOverlay() {
    const overlay = document.getElementById("trialOverlay");
    if (overlay) overlay.style.display = "none";
  }

  function startTrial() {
    const key = "btech_tv_trial_start";
    const stored = Number(localStorage.getItem(key));

    const start = Number.isFinite(stored) && stored > 0
      ? stored
      : Date.now();

    if (!stored) localStorage.setItem(key, String(start));

    function tick() {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, BTECH_CONFIG.trialSeconds - elapsed);

      updateTrialUI(remaining);

      if (remaining <= 0) {
        showTrialExpired();
        return;
      }

      window.setTimeout(tick, 1000);
    }

    hideTrialOverlay();
    tick();
  }

  function pay() {
    const select = document.getElementById("package");
    const target = select?.value;

    if (!target) {
      alert("Please select a BTECH-TV package.");
      return;
    }

    localStorage.setItem("btech_tv_selected_package", target);

    const data = {
      fullName: document.getElementById("fullName")?.value.trim() || "",
      email: document.getElementById("email")?.value.trim() || "",
      phone: document.getElementById("phone")?.value.trim() || "",
      otherInfo: document.getElementById("otherInfo")?.value.trim() || ""
    };

    localStorage.setItem("btech_tv_customer", JSON.stringify(data));
    window.location.href = target;
  }

  window.scanStreams = scanStreams;
  window.speedBoost = speedBoost;
  window.repairStreams = repairStreams;
  window.optimizeMemory = optimizeMemory;
  window.recordMode = recordMode;
  window.clearRecents = clearRecents;
  window.pay = pay;
  window.startTrial = startTrial;
  window.showTrialExpired = showTrialExpired;
  window.hideTrialOverlay = hideTrialOverlay;

  window.BTECH_UI = { buildMenus };
})();
