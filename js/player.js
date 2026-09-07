"use strict";

(function () {
  const state = window.BTECH_STATE;
  const video = document.getElementById("video");
  const container = document.getElementById("btechPlayerContainer");

  function updateOverlay(channel, index) {
    const number = String(index + 1).padStart(3, "0");
    const numberEl = document.getElementById("btechPlayerChannelNumber");
    const nameEl = document.getElementById("btechPlayerChannelName");

    if (numberEl) numberEl.textContent = `CH ${number}`;
    if (nameEl) nameEl.textContent = channel?.name || "No channel selected";
  }

  function destroyHls() {
    if (state.hls) {
      try { state.hls.destroy(); } catch (_) {}
      state.hls = null;
    }
  }

  async function play(index) {
    if (!video || !state.filtered.length) return;

    const safeIndex =
      ((Number(index) || 0) % state.filtered.length + state.filtered.length) %
      state.filtered.length;

    state.currentIndex = safeIndex;
    const channel = state.filtered[safeIndex];

    if (!channel?.url) return;

    updateOverlay(channel, safeIndex);
    document.title =
      `CH ${String(safeIndex + 1).padStart(3, "0")} - ${channel.name} | ${BTECH_CONFIG.appName}`;

    state.recent = [
      channel.id ?? channel.name,
      ...state.recent.filter(x => x !== (channel.id ?? channel.name))
    ].slice(0, 50);

    localStorage.setItem("btech_tv_recents", JSON.stringify(state.recent));

    destroyHls();

    try {
      if (window.Hls && Hls.isSupported()) {
        state.hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        state.hls.loadSource(channel.url);
        state.hls.attachMedia(video);

        state.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else {
        video.src = channel.url;
        await video.play().catch(() => {});
      }
    } catch (error) {
      console.error("BTECH-TV player error:", error);
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (container?.requestFullscreen) {
        await container.requestFullscreen();
      } else if (video?.requestFullscreen) {
        await video.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen unavailable:", error);
    }
  }

  async function togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (
        video &&
        document.pictureInPictureEnabled &&
        video.readyState >= 1
      ) {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.warn("PiP unavailable:", error);
    }
  }

  function toggleMute() {
    if (!video) return;
    video.muted = !video.muted;
  }

  function next() {
    if (!state.filtered.length) return;
    play(state.currentIndex + 1);
  }

  function prev() {
    if (!state.filtered.length) return;
    play(state.currentIndex - 1);
  }

  window.play = play;
  window.next = next;
  window.prev = prev;
  window.toggleMute = toggleMute;
  window.toggleFullscreen = toggleFullscreen;
  window.togglePiP = togglePiP;
})();
