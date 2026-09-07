"use strict";

(function () {
  const state = window.BTECH_STATE;
  const grid = document.getElementById("grid");

  function cleanChannelName(name) {
    return String(name || "")
      .replace(/\s*\(\d+p\)/gi, "")
      .replace(/\s*\[[^\]]+\]\s*$/g, "")
      .trim();
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function render() {
    if (!grid) return;

    grid.innerHTML = "";

    state.filtered.forEach((channel, index) => {
      const number = String(index + 1).padStart(3, "0");
      const card = document.createElement("article");

      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute(
        "aria-label",
        `BTECH-TV CH ${number} ${cleanChannelName(channel.name)}`
      );

      card.innerHTML = `
        <span class="badge">LIVE</span>
        ${channel.premium ? '<span class="badge premium-badge" style="right:auto;left:8px">PRO</span>' : ""}
        <div class="card-channel-id">BTECH-TV → CH ${number}</div>
        <div class="card-channel-name">${escapeHTML(cleanChannelName(channel.name))}</div>
        <div class="card-channel-meta">
          ${escapeHTML(channel.country || "Global")} ·
          ${escapeHTML(channel.quality || "AUTO")}
        </div>
      `;

      card.addEventListener("click", () => window.play(index));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.play(index);
        }
      });

      grid.appendChild(card);
    });

    const count = document.getElementById("channelCountLabel");
    if (count) count.textContent = `${state.filtered.length} channels`;
  }

  function updateStats() {
    const total = document.getElementById("total");
    const live = document.getElementById("live");
    const dead = document.getElementById("dead");
    const fav = document.getElementById("fav");

    if (total) total.textContent = state.all.length;
    if (live) live.textContent = state.all.filter(x => x.status !== "Offline").length;
    if (dead) dead.textContent = state.all.filter(x => x.status === "Offline").length;
    if (fav) fav.textContent = state.favorites.size;
  }

  function setChannels(channels) {
    state.all = Array.isArray(channels)
      ? channels.slice(0, BTECH_CONFIG.maxChannels)
      : [];

    state.filtered = [...state.all];
    state.currentIndex = 0;

    render();
    updateStats();
  }

  function parseM3U(text) {
    const lines = String(text || "").split(/\r?\n/);
    const channels = [];

    for (let x = 0; x < lines.length && channels.length < BTECH_CONFIG.maxChannels; x++) {
      const line = lines[x].trim();

      if (!line.startsWith("#EXTINF")) continue;

      const streamUrl = lines[x + 1]?.trim();
      if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) continue;

      const name = line.includes(",")
        ? line.slice(line.lastIndexOf(",") + 1).trim()
        : "Unknown Channel";

      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      const languageMatch = line.match(/tvg-language="([^"]*)"/i);

      channels.push({
        id: channels.length + 1,
        name,
        category: groupMatch?.[1] || "General",
        country: countryMatch?.[1] || "Global",
        language: languageMatch?.[1] || "Unknown",
        logo: logoMatch?.[1] || "",
        quality: "AUTO",
        premium: false,
        status: "Online",
        url: streamUrl
      });
    }

    return channels;
  }

  async function loadM3U(url) {
    if (!isAllowedFeedURL(url)) {
      console.warn("Blocked feed:", url);
      return;
    }

    if (state.activeFeedController) {
      state.activeFeedController.abort();
    }

    const controller = new AbortController();
    state.activeFeedController = controller;

    const timeout = setTimeout(
      () => controller.abort(),
      BTECH_CONFIG.feedTimeout
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/vnd.apple.mpegurl,text/plain,*/*" }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();

      if (new TextEncoder().encode(text).byteLength > BTECH_CONFIG.maxFeedBytes) {
        throw new Error("Feed exceeds configured size limit.");
      }

      const parsed = parseM3U(text);

      if (parsed.length) {
        state.currentFeed = url;
        setChannels(parsed);
      } else {
        setChannels(window.BTECH_CHANNEL_DATA || []);
      }
    } catch (error) {
      console.error("M3U loading error:", error);
      setChannels(window.BTECH_CHANNEL_DATA || []);
    } finally {
      clearTimeout(timeout);
      if (state.activeFeedController === controller) {
        state.activeFeedController = null;
      }
    }
  }

  function isAllowedFeedURL(value) {
    try {
      const parsed = new URL(String(value));
      return (
        parsed.protocol === "https:" &&
        BTECH_CONFIG.allowedFeedHosts.includes(parsed.hostname.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  function filterBy(predicate) {
    state.filtered = state.all.filter(predicate);
    state.currentIndex = 0;
    render();
  }

  function search(query) {
    const q = String(query || "").toLowerCase().trim();

    filterBy(channel =>
      String(channel.name || "").toLowerCase().includes(q)
    );
  }

  async function load(code) {
    const safe = String(code || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!safe) return;
    await loadM3U(BTECH_CONFIG.feeds.country(safe));
  }

  async function loadCat(category) {
    const safe = String(category || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!safe) return;
    await loadM3U(BTECH_CONFIG.feeds.category(safe));
  }

  async function loadLanguage(language) {
    const safe = String(language || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!safe) return;
    await loadM3U(BTECH_CONFIG.feeds.language(safe));
  }

  async function loadUltra() {
    await loadM3U(BTECH_CONFIG.feeds.ultra());
  }

  window.load = load;
  window.loadCat = loadCat;
  window.loadLanguage = loadLanguage;
  window.loadUltra = loadUltra;
  window.loadM3U = loadM3U;
  window.search = search;
  window.renderChannels = render;
  window.updateChannelStats = updateStats;
  window.setChannels = setChannels;
})();
