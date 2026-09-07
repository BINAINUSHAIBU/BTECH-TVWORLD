"use strict";

window.BTECH_STATE = {
  all: [],
  filtered: [],
  currentIndex: 0,
  hls: null,
  activeFeedController: null,
  currentFeed: "",
  trialSeconds: 120,
  trialExpired: false,
  favorites: new Set(),
  recent: []
};

window.BTECH_STATE.favorites = new Set(
  JSON.parse(localStorage.getItem("btech_tv_favorites") || "[]")
);

window.BTECH_STATE.recent = JSON.parse(
  localStorage.getItem("btech_tv_recents") || "[]"
);
