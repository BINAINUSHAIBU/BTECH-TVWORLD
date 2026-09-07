/*
 * BTECH-TV WORLD PRO MAX
 * Data layer
 *
 * Static fallback/demo channels plus feed metadata.
 * Live IPTV-org feeds are loaded by js/channels.js.
 */

"use strict";

window.BTECH_CHANNEL_DATA = Object.freeze([
  {
    id: 1,
    name: "BTECH News",
    category: "News",
    country: "Nigeria",
    language: "English",
    quality: "HD",
    premium: false,
    status: "Online",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: 2,
    name: "BTECH Sports",
    category: "Sports",
    country: "United Kingdom",
    language: "English",
    quality: "FHD",
    premium: true,
    status: "Online",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: 3,
    name: "Movie World 4K",
    category: "Movies",
    country: "USA",
    language: "English",
    quality: "4K",
    premium: true,
    status: "Online",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: 4,
    name: "Kids Planet",
    category: "Kids",
    country: "Canada",
    language: "English",
    quality: "HD",
    premium: false,
    status: "Online",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  }
]);

window.BTECH_COUNTRIES = Object.freeze([
  ["ng", "Nigeria", "🇳🇬"], ["us", "USA", "🇺🇸"], ["uk", "UK", "🇬🇧"],
  ["in", "India", "🇮🇳"], ["fr", "France", "🇫🇷"], ["de", "Germany", "🇩🇪"],
  ["br", "Brazil", "🇧🇷"], ["za", "South Africa", "🇿🇦"], ["ca", "Canada", "🇨🇦"],
  ["au", "Australia", "🇦🇺"], ["jp", "Japan", "🇯🇵"], ["kr", "South Korea", "🇰🇷"],
  ["cn", "China", "🇨🇳"], ["es", "Spain", "🇪🇸"], ["it", "Italy", "🇮🇹"],
  ["tr", "Turkey", "🇹🇷"], ["mx", "Mexico", "🇲🇽"], ["ae", "UAE", "🇦🇪"],
  ["sa", "Saudi Arabia", "🇸🇦"], ["eg", "Egypt", "🇪🇬"], ["ar", "Argentina", "🇦🇷"],
  ["pk", "Pakistan", "🇵🇰"], ["id", "Indonesia", "🇮🇩"], ["ph", "Philippines", "🇵🇭"],
  ["al", "Albania", "🇦🇱"]
]);

window.BTECH_CATEGORIES = Object.freeze([
  ["news", "News", "📰"], ["sports", "Sports", "⚽"], ["movies", "Movies", "🎬"],
  ["music", "Music", "🎵"], ["kids", "Kids", "👶"], ["comedy", "Comedy", "😂"],
  ["documentary", "Documentary", "📚"], ["business", "Business", "💼"],
  ["science", "Science", "🔬"], ["travel", "Travel", "✈️"]
]);

window.BTECH_LANGUAGES = Object.freeze([
  ["eng", "English", "🇬🇧"], ["spa", "Spanish", "🇪🇸"], ["ara", "Arabic", "🇸🇦"],
  ["fra", "French", "🇫🇷"], ["hin", "Hindi", "🇮🇳"], ["zho", "Chinese", "🇨🇳"],
  ["por", "Portuguese", "🇵🇹"]
]);
