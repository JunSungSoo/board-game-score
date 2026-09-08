(function () {
  "use strict";

  var config = window.BOARD_GAME_SUPABASE || {};
  var client = config.url && config.publishableKey && window.supabase
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;
  var page = document.body.getAttribute("data-auth-page");
  var idVerified = false;
  var verifiedId = "";
  // Supabase Auth는 email 형식의 식별자를 요구하므로 프로젝트 호스트를 내부 식별자에만
  // 사용한다. 실제 사용자의 이메일을 수집하거나 메일을 발송하지 않는다.
  var AUTH_DOMAIN = "danbi.playground.com";
  var GUEST_SESSION_KEY = "board-game-guest-session-v1";

  function $(id) { return document.getElementById(id); }
  function normalizeId(value) { return String(value || "").trim().toLowerCase(); }
  function internalEmail(loginId) { return normalizeId(loginId) + "@" + AUTH_DOMAIN; }

  function setMessage(id, message, isError) {
    var el = $(id);
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("show", Boolean(message));
    el.classList.toggle("success", Boolean(message) && !isError);
  }

  function friendlyError(error) {
    var message = error && error.message ? error.message : "요청을 처리하지 못했어요.";
    if (/invalid login credentials/i.test(message)) return "아이디 또는 비밀번호가 올바르지 않아요.";
    if (/user already registered|duplicate key|profiles_login_id_key/i.test(message)) return "이미 사용 중인 아이디예요.";
    if (/password/i.test(message) && /least|characters|weak/i.test(message)) return "비밀번호는 6자 이상 입력해주세요.";
    return message;
  }

  function setBusy(button, busy, busyText, normalText) {
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
  }

  function bindRippleEffects() {
    document.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      var ripple = document.createElement("span");
      ripple.className = "screen-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.left = event.clientX - 5 + "px";
      ripple.style.top = event.clientY - 5 + "px";
      ripple.addEventListener("animationend", function () { ripple.remove(); });
      document.body.appendChild(ripple);
    });
  }

  async function checkIdAvailability() {
    var loginId = normalizeId($("signup-id").value);
    idVerified = false;
    verifiedId = "";
    if (!/^[a-z0-9_]{4,20}$/.test(loginId)) {
      setMessage("signup-id-message", "영문 소문자, 숫자, 밑줄로 4~20자를 입력해주세요.", true);
      return false;
    }
    var result = await client.rpc("is_login_id_available", { candidate: loginId });
    if (result.error) throw result.error;
    idVerified = Boolean(result.data);
    verifiedId = idVerified ? loginId : "";
    setMessage("signup-id-message", idVerified ? "사용 가능한 아이디예요." : "이미 사용 중인 아이디예요.", !idVerified);
    return idVerified;
  }

  async function signUp(event) {
    event.preventDefault();
    if (!client) { setMessage("auth-message", "Supabase 연결 설정이 완료되지 않았어요.", true); return; }
    var button = $("signup-submit");
    var loginId = normalizeId($("signup-id").value);
    var displayName = $("signup-name").value.trim();
    var password = $("signup-password").value;
    if (!idVerified || verifiedId !== loginId) {
      setMessage("auth-message", "아이디 중복 확인을 먼저 진행해주세요.", true); return;
    }
    if (!displayName || displayName.length > 20) {
      setMessage("auth-message", "이름은 1~20자로 입력해주세요.", true); return;
    }
    if (password.length < 6) {
      setMessage("auth-message", "비밀번호는 6자 이상 입력해주세요.", true); return;
    }
    setBusy(button, true, "가입 중…", "회원가입");
    try {
      var result = await client.auth.signUp({
        email: internalEmail(loginId),
        password: password,
        options: { data: { login_id: loginId, display_name: displayName } }
      });
      if (result.error) throw result.error;
      await client.auth.signOut();
      window.location.replace("login.html?joined=1");
    } catch (error) {
      setMessage("auth-message", friendlyError(error), true);
      setBusy(button, false, "가입 중…", "회원가입");
    }
  }

  async function signIn(event) {
    event.preventDefault();
    if (!client) { setMessage("auth-message", "Supabase 연결 설정이 완료되지 않았어요.", true); return; }
    var button = $("login-submit");
    var loginId = normalizeId($("login-id").value);
    var password = $("login-password").value;
    if (!/^[a-z0-9_]{4,20}$/.test(loginId) || password.length < 6) {
      setMessage("auth-message", "아이디와 비밀번호를 확인해주세요.", true); return;
    }
    setBusy(button, true, "로그인 중…", "로그인");
    try {
      var result = await client.auth.signInWithPassword({ email: internalEmail(loginId), password: password });
      if (result.error) throw result.error;
      window.location.replace("index.html?v=20260903-auth5");
    } catch (error) {
      setMessage("auth-message", friendlyError(error), true);
      setBusy(button, false, "로그인 중…", "로그인");
    }
  }

  function continueAsGuest() {
    try { localStorage.setItem(GUEST_SESSION_KEY, "active"); } catch (error) { /* 저장소 접근 불가 */ }
    window.location.replace("index.html?v=20260903-auth5");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    bindRippleEffects();
    if (!client) { setMessage("auth-message", "Supabase 연결 설정이 완료되지 않았어요.", true); return; }
    var current = await client.auth.getSession();
    if (current.data.session) {
      var profileResult = await client.rpc("my_profile");
      if (!profileResult.error && profileResult.data && profileResult.data.length) {
        window.location.replace("index.html?v=20260903-auth5");
        return;
      }
      // 스키마 적용 전에 만들어진 불완전한 세션은 폐기하고 인증 화면을 정상 노출한다.
      await client.auth.signOut();
    }

    if (page === "login") {
      if (new URLSearchParams(window.location.search).get("joined") === "1") {
        setMessage("auth-message", "회원가입이 완료됐어요. 새 계정으로 로그인해주세요.", false);
      }
      $("login-form").addEventListener("submit", signIn);
      $("guest-login").addEventListener("click", continueAsGuest);
    } else if (page === "signup") {
      $("signup-id").addEventListener("input", function () {
        idVerified = false;
        verifiedId = "";
        setMessage("signup-id-message", "아이디를 변경하면 중복 확인이 다시 필요해요.", true);
      });
      $("signup-check-id").addEventListener("click", function () {
        checkIdAvailability().catch(function (error) { setMessage("signup-id-message", friendlyError(error), true); });
      });
      $("signup-form").addEventListener("submit", signUp);
    }
  });
})();
