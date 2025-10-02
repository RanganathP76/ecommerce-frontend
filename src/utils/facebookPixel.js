// facebookPixel.js

// Get Pixel ID from environment variable
const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID;

export const initFacebookPixel = () => {
  if (!PIXEL_ID) {
    console.warn("❌ No META_PIXEL_ID found in .env");
    return;
  }

  // Insert the Meta Pixel base code
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  // Initialize Pixel
  window.fbq("init", PIXEL_ID);
  // Track PageView by default
  window.fbq("track", "PageView");
};

// Function to track any custom event anywhere
export const trackEvent = (eventName, params = {}) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, params);
  } else {
    console.warn("❌ fbq not initialized yet");
  }
};
