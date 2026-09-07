"use strict";

window.BTECH_CONFIG = Object.freeze({
  appName: "BTECH-TV WORLD PRO MAX",
  trialSeconds: 120,
  maxChannels: 100000,
  feedTimeout: 20000,
  maxFeedBytes: 25 * 1024 * 1024,

  iptvBase: "https://iptv-org.github.io/iptv",
  feeds: {
    country: code => `https://iptv-org.github.io/iptv/countries/${code}.m3u`,
    category: code => `https://iptv-org.github.io/iptv/categories/${code}.m3u`,
    language: code => `https://iptv-org.github.io/iptv/languages/${code}.m3u`,
    ultra: () => "https://iptv-org.github.io/iptv/index.country.m3u"
  },

  allowedFeedHosts: ["iptv-org.github.io"],

  packages: {
    premium: "packages/premium/index.html",
    superCompactPlus: "packages/super-compact-plus/index.html",
    superPremium: "packages/super-premium/index.html",
    superPremiumCompactPlus: "packages/super-premium-compact-plus/index.html",
    superPremiumPlus: "packages/super-premium-plus/index.html"
  }
});
