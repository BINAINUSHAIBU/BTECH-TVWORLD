# BTECH-TV WORLD IPTV DASHBOARD — FAST + PACKAGE ACCESS

## Access flow
1. New users receive a 5-minute demo trial with up to 500 channels.
2. When the trial expires, the package selector appears.
3. Packages: 500 through 10,051 channels.
4. User selects a demo payment gateway and proceeds.
5. The selected channel limit is activated for 30 days.
6. The player displays a BTECH-TV watermark/logo.

## Production payment
The current Paystack/Flutterwave/Monnify/Stripe choices are explicitly DEMO activation controls. Replace `proceedPayment()` with the corresponding provider checkout and verify payment server-side before granting 30-day access.

## Player and channel translation upgrades
- Advanced BTECH-TV player controls: previous/next channel, play/pause, mute, volume, HLS quality selection, Picture-in-Picture and player fullscreen.
- HLS quality levels are populated automatically when the stream exposes multiple renditions.
- Channel names can be automatically translated for the visible channel list and current player title.
- Translation preference is saved locally. Browser Translator API is preferred where available, with a web translation fallback.
- Original stream URLs and dashboard layout remain unchanged.
