(function () {
  "use strict";

  var client = window.ScoreServices.supabase;
  var configured = Boolean(client);
  var session = null;
  var profile = null;
  var friends = [];
  var heartbeatTimer = null;
  var guestMode = false;
  var GUEST_SESSION_KEY = "board-game-guest-session-v1";

  function $(id) { return document.getElementById(id); }
  function normalizeId(value) { return String(value || "").trim().toLowerCase(); }
  function show(id) { $(id).classList.add("show"); }
  function hide(id) { $(id).classList.remove("show"); }

  function closeNavigation() {
    $("side-menu").classList.remove("open");
    $("side-menu-backdrop").classList.remove("show");
    $("menu-toggle").setAttribute("aria-expanded", "false");
    $("main-content").removeAttribute("inert");
  }

  function setMessage(id, message, isError) {
    var el = $(id);
    el.textContent = message || "";
    el.classList.toggle("show", Boolean(message));
    el.classList.toggle("success", Boolean(message) && !isError);
  }

  function friendlyError(error) {
    var message = error && error.message ? error.message : "요청을 처리하지 못했어요.";
    if (/invalid login credentials/i.test(message)) return "아이디 또는 비밀번호가 올바르지 않아요.";
    if (/user already registered|duplicate key|profiles_login_id_key/i.test(message)) return "이미 사용 중인 아이디예요.";
    if (/password/i.test(message) && /least|characters|weak/i.test(message)) return "비밀번호는 6자 이상 입력해주세요.";
    if (/friendship_already_exists/i.test(message)) return "이미 친구이거나 요청을 보낸 아이디예요.";
    if (/user_not_found/i.test(message)) return "해당 아이디를 찾을 수 없어요.";
    if (/cannot_add_self/i.test(message)) return "내 아이디는 친구로 추가할 수 없어요.";
    return message;
  }

  function updateAccountUI() {
    var signedIn = Boolean(session && profile);
    $("menu-account").textContent = signedIn
      ? profile.display_name + " (@" + profile.login_id + ")"
      : guestMode ? "게스트 이용 중" : "로그인 / 회원가입";
    $("menu-friends").disabled = !signedIn;
    $("menu-history").disabled = !signedIn;
    $("menu-ranking").disabled = !signedIn;
    $("account-status").textContent = signedIn ? profile.display_name : guestMode ? "게스트" : "로그인";
    $("account-status").classList.toggle("signed-in", signedIn);
    document.dispatchEvent(new CustomEvent("account-members-updated"));
  }

  async function loadProfile() {
    if (!client || !session) { profile = null; return; }
    var result = await client.rpc("my_profile");
    if (result.error) throw result.error;
    profile = result.data && result.data[0] ? result.data[0] : null;
  }

  async function refreshFriends(useHeartbeat) {
    if (!client || !session) { friends = []; renderFriends(); return; }
    var result = await client.rpc(useHeartbeat ? "touch_presence" : "friend_dashboard");
    if (result.error) throw result.error;
    friends = result.data || [];
    renderFriends();
    document.dispatchEvent(new CustomEvent("account-members-updated"));
  }

  function restartHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    if (!session) return;
    refreshFriends(true).catch(function () {});
    heartbeatTimer = setInterval(function () {
      if (document.visibilityState === "visible") refreshFriends(true).catch(function () {});
    }, 30000);
  }

  async function restoreSession() {
    var result = client ? await client.auth.getSession() : { data: { session: null } };
    session = result.data.session;
    if (session) {
      try {
        await loadProfile();
        await refreshFriends(true);
      } catch (error) {
        console.error("계정 정보를 불러오지 못했습니다.", error);
      }
      if (!profile) {
        await client.auth.signOut();
        session = null;
      }
    }
    if (!session) {
      try { guestMode = localStorage.getItem(GUEST_SESSION_KEY) === "active"; }
      catch (error) { guestMode = false; }
      if (!guestMode) { window.location.replace("login.html"); return; }
    }
    updateAccountUI();
    restartHeartbeat();
    document.body.classList.remove("auth-checking");
    document.dispatchEvent(new CustomEvent("account-access-granted"));
  }

  async function signOut() {
    if (client && session) await client.auth.signOut();
    window.ScoreServices.clearAccountCache();
    try { localStorage.removeItem(GUEST_SESSION_KEY); } catch (error) { /* 저장소 접근 불가 */ }
    session = null;
    profile = null;
    friends = [];
    guestMode = false;
    restartHeartbeat();
    hide("account-modal");
    window.location.replace("login.html");
  }

  function statusLabel(status) {
    if (status === "playing") return "게임 중";
    if (status === "online") return "온라인";
    return "오프라인";
  }

  function renderFriends() {
    var list = $("friend-list");
    if (!list) return;
    if (!friends.length) {
      list.innerHTML = '<p class="empty-state">등록된 친구가 없어요.</p>';
      return;
    }
    list.innerHTML = friends.map(function (friend) {
      var actions = "";
      if (friend.relationship === "incoming") {
        actions = '<div class="friend-actions"><button class="btn small" data-friend-accept="' + friend.friendship_id + '">수락</button>' +
          '<button class="btn ghost small" data-friend-reject="' + friend.friendship_id + '">거절</button></div>';
      } else if (friend.relationship === "outgoing") {
        actions = '<span class="friend-pending">수락 대기</span>';
      } else {
        actions = '<span class="presence ' + friend.presence_status + '"><i></i>' + statusLabel(friend.presence_status) + '</span>';
      }
      return '<div class="friend-row"><div><strong>' + escapeHtml(friend.display_name) + '</strong><small>@' +
        escapeHtml(friend.login_id) + '</small></div>' + actions + '</div>';
    }).join("");
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  async function addFriend() {
    var target = normalizeId($("friend-id").value);
    if (!target) return;
    var result = await client.rpc("send_friend_request", { target_login_id: target });
    if (result.error) throw result.error;
    $("friend-id").value = "";
    setMessage("friend-message", "친구 요청을 보냈어요.", false);
    await refreshFriends(false);
  }

  async function respondFriend(requestId, accept) {
    var result = await client.rpc("respond_friend_request", { request_id: Number(requestId), accept_request: accept });
    if (result.error) throw result.error;
    await refreshFriends(false);
  }

  async function renderHistory() {
    var result = await window.ScoreServices.accountRows("my_game_history", session.user.id);
    if (result.error) throw result.error;
    var list = $("history-list");
    if (!result.data.length) { list.innerHTML = '<p class="empty-state">완료된 게임 기록이 없어요.</p>'; return; }
    list.innerHTML = result.data.map(function (item) {
      var date = window.ScoreServices.formatGameDate(item.ended_at);
      return '<div class="history-row"><div><strong>' + escapeHtml(gameLabel(item.game_id)) + '</strong><small>' + date +
        (item.team_name ? " · " + escapeHtml(item.team_name) : "") + '</small></div><div><b>' + item.final_score +
        '점</b><span>' + item.final_rank + '등</span></div></div>';
    }).join("");
  }

  async function renderRankings() {
    var result = await window.ScoreServices.accountRows("win_rankings", session.user.id);
    if (result.error) throw result.error;
    var list = $("ranking-list");
    if (!result.data.length) { list.innerHTML = '<p class="empty-state">완료된 게임 기록이 없어요.</p>'; return; }
    list.innerHTML = result.data.map(function (item, index) {
      return '<div class="ranking-row"><span class="ranking-number">' + (index + 1) + '</span><div><strong>' +
        escapeHtml(item.display_name) + '</strong><small>@' + escapeHtml(item.login_id) + '</small></div><div><b>' +
        item.wins + '승</b><small>' + item.games + '게임</small></div></div>';
    }).join("");
  }

  function gameLabel(gameId) {
    return gameId === "skullking" ? "스컬킹" : gameId === "tichu" ? "티츄" : "기타 스코어";
  }

  function selectableMembers() {
    if (!profile) return [];
    var members = [{ id: profile.id, loginId: profile.login_id, displayName: profile.display_name, self: true }];
    friends.filter(function (friend) { return friend.relationship === "accepted"; }).forEach(function (friend) {
      members.push({ id: friend.user_id, loginId: friend.login_id, displayName: friend.display_name, self: false });
    });
    return members.map(function (member) {
      member.label = member.displayName + " (@" + member.loginId + ")";
      return member;
    });
  }

  function memberByLabel(label) {
    return selectableMembers().filter(function (member) { return member.label === label; })[0] || null;
  }

  async function startGame(state) {
    if (!client || !session || !profile) return;
    var participantPayload = [];
    if (state.teams) {
      state.teams.forEach(function (team) {
        team.members.forEach(function (name) {
          var member = memberByLabel(name);
          participantPayload.push({ user_id: member ? member.id : null, display_name: name, team_name: team.name });
        });
      });
    } else {
      state.players.forEach(function (player) {
        var member = player.name === "나" ? selectableMembers()[0] : memberByLabel(player.name);
        participantPayload.push({ user_id: member ? member.id : null, display_name: member && player.name === "나" ? member.label : player.name, team_name: null });
      });
    }
    var mode = state.tichuMode || state.genericMode || state.mode;
    var created = await client.rpc("start_game_room", {
      requested_game_id: state.gameId,
      requested_game_mode: mode,
      participants: participantPayload
    });
    if (created.error) throw created.error;
    state.remoteRoomId = created.data;
    var rows = await client.from("game_participants").select("id,user_id,display_name,team_name").eq("room_id", created.data);
    if (rows.error) throw rows.error;
    state.remoteParticipants = rows.data;
  }

  async function finishGame(state) {
    if (!client || !session || !state || !state.remoteRoomId || !Array.isArray(state.remoteParticipants)) return;
    var ranked = (state.teams || state.players).slice().sort(function (a, b) { return b.total - a.total; });
    function resultFor(row) {
      var entity;
      if (state.teams) entity = state.teams.filter(function (team) { return team.name === row.team_name; })[0];
      else entity = state.players.filter(function (player) {
        var member = player.name === "나" ? selectableMembers()[0] : memberByLabel(player.name);
        var persistedName = member && player.name === "나" ? member.label : player.name;
        return persistedName === row.display_name;
      })[0];
      if (!entity) return null;
      var rank = ranked.findIndex(function (candidate) { return candidate.total === entity.total; }) + 1;
      return { participant_id: row.id, final_score: entity.total, final_rank: rank };
    }
    var results = state.remoteParticipants.map(resultFor).filter(Boolean);
    var response = await client.rpc("finish_game_room", { requested_room_id: state.remoteRoomId, results: results });
    if (response.error) throw response.error;
    await window.ScoreServices.invalidateAccount();
    state.remoteRoomId = null;
    state.remoteParticipants = [];
    await refreshFriends(true);
  }

  async function cancelGame(state) {
    if (!client || !session || !state || !state.remoteRoomId) return;
    var response = await client.rpc("cancel_game_room", { requested_room_id: state.remoteRoomId });
    if (response.error) throw response.error;
    state.remoteRoomId = null;
    state.remoteParticipants = [];
    await refreshFriends(true);
  }

  function openAccount() {
    closeNavigation();
    if (guestMode) {
      $("account-profile-name").textContent = "게스트";
      $("account-profile-id").textContent = "게임 기록과 친구 기능을 사용하지 않아요.";
      $("account-logout").textContent = "게스트 종료";
      show("account-modal");
      return;
    }
    if (!session || !profile) { window.location.href = "login.html"; return; }
    $("account-profile-name").textContent = profile.display_name;
    $("account-profile-id").textContent = "@" + profile.login_id;
    $("account-logout").textContent = "로그아웃";
    show("account-modal");
  }

  function bindEvents() {
    $("menu-account").addEventListener("click", function () { openAccount(); });
    $("account-status").addEventListener("click", openAccount);
    $("account-close").addEventListener("click", function () { hide("account-modal"); });
    $("friends-close").addEventListener("click", function () { hide("friends-modal"); });
    $("history-close").addEventListener("click", function () { hide("history-modal"); });
    $("ranking-close").addEventListener("click", function () { hide("ranking-modal"); });
    $("account-logout").addEventListener("click", function () {
      signOut().catch(function (error) { setMessage("account-message", friendlyError(error), true); });
    });
    $("menu-friends").addEventListener("click", function () {
      closeNavigation();
      show("friends-modal");
      refreshFriends(true).catch(function (error) { setMessage("friend-message", friendlyError(error), true); });
    });
    $("friend-add").addEventListener("click", function () {
      addFriend().catch(function (error) { setMessage("friend-message", friendlyError(error), true); });
    });
    $("friend-list").addEventListener("click", function (event) {
      var accept = event.target.getAttribute("data-friend-accept");
      var reject = event.target.getAttribute("data-friend-reject");
      if (!accept && !reject) return;
      respondFriend(accept || reject, Boolean(accept)).catch(function (error) {
        setMessage("friend-message", friendlyError(error), true);
      });
    });
    $("menu-history").addEventListener("click", function () {
      closeNavigation();
      show("history-modal");
      renderHistory().catch(function (error) { $("history-list").textContent = friendlyError(error); });
    });
    $("menu-ranking").addEventListener("click", function () {
      closeNavigation();
      show("ranking-modal");
      renderRankings().catch(function (error) { $("ranking-list").textContent = friendlyError(error); });
    });
  }

  window.AccountManager = {
    configured: configured,
    getSelectableMembers: selectableMembers,
    startGame: startGame,
    finishGame: finishGame,
    cancelGame: cancelGame
  };

  document.addEventListener("score-modules-ready", function () {
    bindEvents();
    restoreSession().catch(function () { window.location.replace("login.html"); });
  }, { once: true });
})();
