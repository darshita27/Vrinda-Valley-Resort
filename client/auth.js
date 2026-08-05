/**
 * Shared admin-session helper used by login.html and admin.html.
 *
 * Everything token-related lives here so the two pages cannot drift apart:
 * one storage key, one expiry rule, one place that talks to the API with
 * credentials attached.
 *
 * Exposed as window.VVAuth (no module bundler in this project).
 */
(function (window) {
  "use strict";

  // Local dev (served from localhost/127.0.0.1) talks to the local API instead
  // of production, so no manual switch is needed before deploying this file.
  var API_BASE_URL =
    ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1
      ? "http://localhost:5000"
      : "https://vrinda-backend-h8oz.onrender.com";

  var TOKEN_KEY = "vv_admin_token";
  var LEGACY_TOKEN_KEY = "token"; // written by the previous login page
  var NOTICE_KEY = "vv_admin_notice";

  // Treat a token as expired slightly early so a request is not fired off at
  // the exact moment the server would reject it.
  var EXPIRY_SKEW_SECONDS = 10;

  /* ------------------------------------------------------------------ *
   * Token storage
   * ------------------------------------------------------------------ */

  /** Reads the payload of a JWT without verifying it — display/expiry use only. */
  function decodeToken(token) {
    try {
      var payload = String(token).split(".")[1];
      if (!payload) return null;

      var base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      var json = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  function isTokenValid(token) {
    if (!token) return false;

    var payload = decodeToken(token);
    if (!payload || !payload.exp) return false;

    return payload.exp - EXPIRY_SKEW_SECONDS > Math.floor(Date.now() / 1000);
  }

  function saveToken(token) {
    // sessionStorage is not used: the dashboard is opened in new tabs often
    // enough that a per-tab session would be a constant re-login.
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  /** Returns a usable token, or null — expired tokens are dropped on the way out. */
  function getToken() {
    var token = localStorage.getItem(TOKEN_KEY);

    if (!token) return null;

    if (!isTokenValid(token)) {
      clearToken();
      return null;
    }

    return token;
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  function isAuthenticated() {
    return getToken() !== null;
  }

  function getAdminEmail() {
    var payload = decodeToken(getToken());
    return payload && payload.email ? payload.email : "";
  }

  /* ------------------------------------------------------------------ *
   * Notices carried across the redirect to login.html
   * ------------------------------------------------------------------ */

  function setNotice(message) {
    try {
      sessionStorage.setItem(NOTICE_KEY, message);
    } catch (error) {
      /* storage disabled — the notice is cosmetic, carry on */
    }
  }

  function takeNotice() {
    try {
      var message = sessionStorage.getItem(NOTICE_KEY);
      sessionStorage.removeItem(NOTICE_KEY);
      return message;
    } catch (error) {
      return null;
    }
  }

  /* ------------------------------------------------------------------ *
   * Page guards
   * ------------------------------------------------------------------ */

  /** Call at the top of a protected page. Returns false once redirecting. */
  function requireAuth() {
    if (isAuthenticated()) return true;

    setNotice("Please log in to open the admin dashboard.");
    // replace() so the back button does not bounce into the guarded page again.
    window.location.replace("login.html");
    return false;
  }

  /** Call on login.html so an already-signed-in admin skips the form. */
  function redirectIfAuthenticated() {
    if (!isAuthenticated()) return false;

    window.location.replace("admin.html");
    return true;
  }

  function logout(message) {
    clearToken();
    if (message) setNotice(message);
    window.location.replace("login.html");
  }

  /* ------------------------------------------------------------------ *
   * API access
   * ------------------------------------------------------------------ */

  function authHeaders() {
    var token = getToken();
    return token ? { Authorization: "Bearer " + token } : {};
  }

  /**
   * Authenticated fetch. Any 401/403 ends the session — the token is dropped
   * and the browser goes back to the login page rather than showing a
   * half-broken dashboard.
   */
  async function apiRequest(path, options) {
    options = options || {};

    var token = getToken();
    if (!token) {
      logout("Your session has expired. Please log in again.");
      throw new Error("Not authenticated");
    }

    var res = await fetch(API_BASE_URL + path, Object.assign({}, options, {
      headers: Object.assign({ Authorization: "Bearer " + token }, options.headers || {})
    }));

    var body = await res.json().catch(function () {
      return null;
    });

    if (res.status === 401 || res.status === 403) {
      logout((body && body.message) || "Your session has expired. Please log in again.");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      throw new Error((body && body.message) || "Request failed (" + res.status + ")");
    }

    return body;
  }

  /**
   * Exchanges credentials for a token. Throws with the server's message so the
   * login page can show it verbatim.
   */
  async function login(email, password) {
    var res = await fetch(API_BASE_URL + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });

    var body = await res.json().catch(function () {
      return null;
    });

    if (!res.ok || !body || !body.token) {
      throw new Error((body && body.message) || "Login failed. Please try again.");
    }

    saveToken(body.token);
    return body;
  }

  /**
   * Requests a password reset code by email. The API returns the same
   * success response whether or not the account exists (so this call
   * essentially never "fails" from the caller's point of view unless the
   * request itself couldn't be made, e.g. the API is unreachable).
   */
  async function forgotPassword(email) {
    var res = await fetch(API_BASE_URL + "/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    });

    var body = await res.json().catch(function () {
      return null;
    });

    if (!res.ok) {
      throw new Error((body && body.message) || "Could not send the reset code. Please try again.");
    }

    return body;
  }

  /** Exchanges a valid OTP for a new password. Throws with the server's message on failure. */
  async function resetPassword(email, otp, newPassword) {
    var res = await fetch(API_BASE_URL + "/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, otp: otp, newPassword: newPassword })
    });

    var body = await res.json().catch(function () {
      return null;
    });

    if (!res.ok) {
      throw new Error((body && body.message) || "Could not reset the password. Please try again.");
    }

    return body;
  }

  /* ------------------------------------------------------------------ *
   * Client-side failed-login tracking (UX hint only)
   *
   * The server deliberately returns the same generic message whether an
   * account doesn't exist, the password is wrong, or the account is
   * currently locked out (see authController.js) — that's what stops an
   * attacker hitting the API directly from telling those cases apart.
   *
   * This counter is different: it only reflects attempts THIS browser just
   * made, so surfacing it after a threshold is reached tells the person
   * sitting at the keyboard something they already know (they've failed
   * repeatedly) without adding any new signal to the API response itself.
   * ------------------------------------------------------------------ */

  var LOGIN_FAIL_COUNT_KEY = "vv_login_fail_count";
  // Mirrors the server's default MAX_LOGIN_ATTEMPTS (server/models/Admin.js).
  // Only used to decide when to show the extra hint below — the server
  // enforces the real limit regardless of what this constant is set to.
  var LOGIN_FAIL_HINT_THRESHOLD = 5;

  function recordLoginFailure() {
    var count = getLoginFailureCount() + 1;
    try {
      sessionStorage.setItem(LOGIN_FAIL_COUNT_KEY, String(count));
    } catch (error) {
      /* storage disabled — the hint just won't show, login itself still works */
    }
    return count;
  }

  function getLoginFailureCount() {
    try {
      return Number(sessionStorage.getItem(LOGIN_FAIL_COUNT_KEY)) || 0;
    } catch (error) {
      return 0;
    }
  }

  function clearLoginFailures() {
    try {
      sessionStorage.removeItem(LOGIN_FAIL_COUNT_KEY);
    } catch (error) {
      /* nothing to clean up if storage is disabled */
    }
  }

  window.VVAuth = {
    API_BASE_URL: API_BASE_URL,
    login: login,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    apiRequest: apiRequest,
    authHeaders: authHeaders,
    getToken: getToken,
    getAdminEmail: getAdminEmail,
    isAuthenticated: isAuthenticated,
    requireAuth: requireAuth,
    redirectIfAuthenticated: redirectIfAuthenticated,
    takeNotice: takeNotice,
    clearToken: clearToken,
    recordLoginFailure: recordLoginFailure,
    getLoginFailureCount: getLoginFailureCount,
    clearLoginFailures: clearLoginFailures,
    LOGIN_FAIL_HINT_THRESHOLD: LOGIN_FAIL_HINT_THRESHOLD
  };
})(window);
