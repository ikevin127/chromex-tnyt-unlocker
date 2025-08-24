# The New York Times Unlocker

This is a Chrome extension that polls for The New York Times subscription overlay elements, removes them, unlocks scroll and displays a lively celebratory animation upon unlocking.

**Important**
- This is for educational and demo purposes only. Do not use this to bypass paywalls or violate the New York Times' terms of service.
- The extension is pre-configured for `https://www.nytimes.com/*` but should only be used on sites you own or have explicit permission to modify.

## Install (Unpacked)
1. **Verify manifest.json**
   - The `content_scripts.matches` is set to `["https://www.nytimes.com/*"]` for demo purposes. Ensure you have permission to modify this domain or update to your own site, e.g., `["https://example.com/*"]`.
2. **Edit content.js**
   - Configure `CONFIG.lockSelector` and `CONFIG.bannerSelector` to match stable selectors for New York Times subscription overlays or your own permitted site.
   - Leave as placeholders if relying on the gradient heuristic and scroll unlock.
3. **Load in Chrome**
   - Navigate to `chrome://extensions`.
   - Enable “Developer mode”.
   - Click “Load unpacked” and select the `new-york-times-unlocker` folder.
4. **Test on your permitted page**
   - Visit a page (e.g., `https://www.nytimes.com/*`) that may inject subscription overlays after user interaction.
   - Scroll or click to trigger polling; the content script runs automatically.
   - If target conditions (lock, banner, gradient) are met, a confetti-and-check animation celebrates the unlock.

## Notes
- Polling cadence is adjustable via `CONFIG.pollIntervalMs` and `CONFIG.pollMaxMs` in `content.js`.
- No external libraries; the celebratory animation is a lightweight canvas-based confetti effect with a centered badge.

## Files
- `content.js` — Handles polling, overlay removal, scroll unlocking, and the celebratory animation logic.
- `manifest.json` — Manifest V3, registers the content script for New York Times pages.
- `tnyt-unlocked.png` — Extension icon.

## License
- For demo and educational purposes only.