"use strict";

document.addEventListener("DOMContentLoaded", () => {
  BTECH_UI.buildMenus();

  if (Array.isArray(window.BTECH_CHANNEL_DATA) && window.BTECH_CHANNEL_DATA.length) {
    setChannels(window.BTECH_CHANNEL_DATA);
    play(0);
  }

  startTrial();
});
