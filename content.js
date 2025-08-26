// The New York Times Unlocker
// IMPORTANT: Configure selectors below for sites you control or have permission to modify.

const CONFIG = {
  lockSelector: `.vi-gateway-container[data-testid="vi-gateway-container"]`,
  bannerSelector: `[data-testid="onsite-messaging-unit-gateway"][data-audience]`,
  gradientSelector: `.vi-gateway-container[data-testid="vi-gateway-container"] > div:last-of-type`,
  pollIntervalMs: 1000,
  pollMaxMs: 60000
};

let pollTimer = null;
let pollStart = 0;

let unlockedScroll = false;
let removedBanner = false;
let removedGradient = false;

let promptVisible = false;
let promptOverlay = null;
let promptWatcher = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    startPromptWatcher();
  }, { once: true });
} else {
  // DOM is already ready (e.g., with run_at: "document_idle")
  startPromptWatcher();
}

function bothTargetsPresent() {
  try {
    const lockEl = CONFIG.lockSelector && document.querySelector(CONFIG.lockSelector);
    const bannerEl = CONFIG.bannerSelector && document.querySelector(CONFIG.bannerSelector);
    return !!(lockEl && bannerEl);
  } catch {
    return false;
  }
}

function startPromptWatcher() {
  if (promptWatcher) return;
  // Light polling until user scrolls or timeout; runs only before started === true
  promptWatcher = setInterval(() => {
    if (started) {
      stopPromptWatcher();
      hideScrollToUnlockPrompt();
      return;
    }
    if (bothTargetsPresent()) {
      if (!promptVisible) showScrollToUnlockPrompt();
    } else if (promptVisible) {
      hideScrollToUnlockPrompt();
    }
  }, 500);
}

function stopPromptWatcher() {
  if (promptWatcher) {
    clearInterval(promptWatcher);
    promptWatcher = null;
  }
}

function showScrollToUnlockPrompt() {
  if (promptVisible) return;
  promptVisible = true;

  // Inline CSS for the prompt (kept scoped via an id)
  const style = document.createElement("style");
  style.id = "overlay-cleaner-scroll-prompt-css";
  style.textContent = `
    @keyframes oc-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
    #overlay-cleaner-scroll-prompt {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 250ms ease;
      background: transparent;
    }
    #overlay-cleaner-scroll-prompt .oc-box {
      min-width: 240px;
      max-width: 80vw;
      padding: 14px 18px;
      border-radius: 14px;
      background: rgba(0,0,0,0.70);
      color: #e5e7eb;
      font: 500 14px/1.3 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, Helvetica, Arial, sans-serif;
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
      display: flex;
      gap: 24px;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      backdrop-filter: blur(4px);
    }
    #overlay-cleaner-scroll-prompt .oc-chevron-wrap {
      margin-top: -16px;
      animation: oc-bounce 1200ms infinite;
      will-change: transform;
      display: inline-flex;
    }
    #overlay-cleaner-scroll-prompt .oc-chevron-rot {
      transform: rotate(45deg);
      display: inline-flex;
    }
    #overlay-cleaner-scroll-prompt .oc-chevron {
      width: 18px;
      height: 18px;
      border-right: 3px solid #a7f3d0;
      border-bottom: 3px solid #a7f3d0;
      opacity: 0.9;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
    }
    #overlay-cleaner-scroll-prompt .oc-text {
      pointer-events: none;
      user-select: none;
      color: #d1fae5;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  promptOverlay = document.createElement("div");
  promptOverlay.id = "overlay-cleaner-scroll-prompt";
  promptOverlay.innerHTML = `
    <div class="oc-box">
      <div class="oc-chevron-wrap"><div class="oc-chevron-rot"><div class="oc-chevron"></div></div></div>
      <div class="oc-text">Scroll to unlock</div>
    </div>
  `;
  document.documentElement.appendChild(promptOverlay);

  // Fade in after insertion
  requestAnimationFrame(() => {
    if (promptOverlay) promptOverlay.style.opacity = "1";
  });
}

function hideScrollToUnlockPrompt() {
  if (!promptVisible) return;
  promptVisible = false;
  if (promptOverlay) {
    promptOverlay.style.opacity = "0";
    const toRemove = promptOverlay;
    promptOverlay = null;
    setTimeout(() => toRemove.remove(), 220);
  }
  const css = document.getElementById("overlay-cleaner-scroll-prompt-css");
  if (css) css.remove();
}

function startPolling() {
  if (pollTimer) return;
  pollStart = Date.now();
  pollTimer = setInterval(() => {
    try {
      scanAndAct();

      // If three targets are satisfied, celebrate and stop polling
      const satisfied = [unlockedScroll, removedBanner, removedGradient].filter(Boolean).length;
      if (satisfied >= 3) {
        clearInterval(pollTimer);
        pollTimer = null;
        showSuccessAnimation();
      }

      // Stop after max duration as a failsafe
      if (Date.now() - pollStart > CONFIG.pollMaxMs) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    } catch (e) {
      // Fail-safe: stop polling on unexpected errors
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }, CONFIG.pollIntervalMs);
}

function scanAndAct() {
  const lockEl = document.querySelector(CONFIG.lockSelector);
  const bannerEl = document.querySelector(CONFIG.bannerSelector);
  const gradientEl = document.querySelector(CONFIG.gradientSelector);
  let changed = false;

  if (!unlockedScroll && CONFIG.lockSelector) {
    if (lockEl) {
      lockEl.style.setProperty("overflow", "visible", "important");
      lockEl.style.setProperty("position", "static", "important");
      unlockedScroll = true;
      changed = true;
    }
  }

  if (!removedBanner && CONFIG.bannerSelector) {
    if (bannerEl) {
      bannerEl.remove();
      removedBanner = true;
      changed = true;
    }
  }

  if (!removedGradient && CONFIG.gradientSelector) {
    if (gradientEl) {
      gradientEl.remove();
      removedGradient = true;
      changed = true;
    }
  }

  return changed;
}

// Start polling upon first scroll gesture (wheel/touch/scroll/key)
let started = false;

function onFirstScrollGesture() {
  if (started) return;
  started = true;
  hideScrollToUnlockPrompt(); // ensure prompt disappears immediately on scroll
  stopPromptWatcher(); // stop pre-scroll watcher
  startPolling();
}

const oncePassive = { once: true, passive: true };
window.addEventListener("wheel", onFirstScrollGesture, oncePassive);
window.addEventListener("scroll", onFirstScrollGesture, oncePassive);
window.addEventListener("touchstart", onFirstScrollGesture, oncePassive);
window.addEventListener("touchmove", onFirstScrollGesture, oncePassive);

// Keyboard-based scrolling (Arrow/PageUp/PageDown/Space/Home/End)
function onFirstScrollKey(e) {
  const k = e.key;
  if (
    k === "ArrowDown" ||
    k === "ArrowUp" ||
    k === "PageDown" ||
    k === "PageUp" ||
    k === " " ||
    k === "Home" ||
    k === "End"
  ) {
    onFirstScrollGesture();
    window.removeEventListener("keydown", onFirstScrollKey, true);
  }
}
window.addEventListener("keydown", onFirstScrollKey, true);

// Lightweight confetti animation (no external assets)
function showSuccessAnimation() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "2147483647";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.background = "transparent";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 300ms ease";

  const canvas = document.createElement("canvas");
  overlay.appendChild(canvas);
  document.documentElement.appendChild(overlay);

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const onResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", onResize);

  const colors = ["#16a34a", "#22c55e", "#38bdf8", "#f59e0b", "#ef4444", "#a855f7"];
  const pieces = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * width,
    y: -10 - Math.random() * height * 0.3,
    r: 4 + Math.random() * 6,
    tilt: Math.random() * 10,
    tiltAngle: Math.random() * Math.PI,
    tiltAngleInc: 0.02 + Math.random() * 0.08,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 3
  }));

  let running = true;
  let start = null;

  function draw(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;

    ctx.clearRect(0, 0, width, height);

    for (const p of pieces) {
      p.tiltAngle += p.tiltAngleInc;
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.tiltAngle) * 0.5;
      p.tilt = Math.sin(p.tiltAngle) * 10;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.r * 2);
      ctx.stroke();
    }

    if (elapsed < 2200 && running) {
      requestAnimationFrame(draw);
    } else {
      overlay.style.opacity = "0";
      setTimeout(() => {
        running = false;
        window.removeEventListener("resize", onResize);
        overlay.remove();
      }, 350);
    }
  }

  // Brief checkmark badge in the center
  const badge = document.createElement("div");
  badge.style.position = "absolute";
  badge.style.width = "180px";
  badge.style.height = "180px";
  badge.style.borderRadius = "20px";
  badge.style.background = "rgba(0,0,0,0.75)";
  badge.style.backdropFilter = "blur(4px)";
  badge.style.display = "flex";
  badge.style.alignItems = "center";
  badge.style.justifyContent = "center";
  badge.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  badge.style.transform = "scale(0.9)";
  badge.style.opacity = "0";
  badge.style.transition = "transform 300ms cubic-bezier(.2,.8,.2,1), opacity 300ms ease";

  // Unlocked image
  const badgeImg = document.createElement("img");
  badgeImg.src = chrome.runtime.getURL("tnyt-unlocker.png");
  badgeImg.alt = "Unlocked";
  badgeImg.width = 96;
  badgeImg.height = 96;
  badgeImg.style.width = "96px";
  badgeImg.style.height = "96px";
  badgeImg.style.borderRadius = "24px";
  badgeImg.style.objectFit = "contain";
  badge.appendChild(badgeImg);
  overlay.appendChild(badge);

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    badge.style.opacity = "1";
    badge.style.transform = "scale(1)";
  });

  requestAnimationFrame(draw);
}
