# BTECH-TV WORLD PRO MAX

Separated project structure:

```text
BTECH-TV-WORLD-PRO-MAX/
├── index.html
├── css/
│   ├── layout.css
│   ├── responsive.css
│   └── style.css
├── data/
│   └── channels.js
├── js/
│   ├── app.js
│   ├── channels.js
│   ├── config.js
│   ├── player.js
│   ├── state.js
│   └── ui.js
└── packages/
    ├── premium/index.html
    ├── super-compact-plus/index.html
    ├── super-premium/index.html
    ├── super-premium-compact-plus/index.html
    └── super-premium-plus/index.html
```

## Scrolling rule

Only `.channel-wrapper` has vertical scrolling. The main dashboard, player/monitor, and channel display container do not receive page-level scrolling.

## Important

The Paystack library is included, but production payment processing must be connected to a verified server-side transaction flow before accepting real payments.
