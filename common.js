// 공통 스코어 매니저: 화면 전환, 상태 저장/복원, 인원 설정, 점수판, 공용 입력 컴포넌트를 담당한다.
// 게임별 규칙(점수 계산, 라운드 입력 UI)은 이 파일을 참조하지 않고, 각 game-*.js가
// window.ScoreManager.registerGame(definition)으로 자신을 등록하는 방식으로 붙는다.
// 게임 정의 계약은 각 game-*.js 상단 주석을 참고.
window.ScoreManager = (function () {
  "use strict";

  var PRESET_NAMES = ["파비", "효명", "엘라", "동원", "주령", "서온", "유찬"];

  var registry = {};
  var registryOrder = [];

  // ---------- 상태 ----------
  var state = null;

  // 설정 화면 임시 상태
  var selectedGame = null;
  var selectedVariant = null;
  var selectedPreset = {};
  var guestList = [];
  var teamAssign = {}; // { 이름: 'A' | 'B' }

  // ---------- 유틸 ----------
  function $(id) { return document.getElementById(id); }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function isFiniteNumber(value) { return typeof value === "number" && isFinite(value); }

  function makeEntity(name) { return { name: name, total: 0, rounds: [] }; }

  function entities() { return state.teams || state.players; }

  function entityDisplayName(entity) {
    if (entity.members) return entity.name + " (" + entity.members.join("·") + ")";
    return entity.name;
  }

  function currentGame() { return registry[state.gameId]; }
  function currentSetupGame() { return registry[selectedGame]; }

  function accountPlayerOptions() {
    if (!window.AccountManager || !window.AccountManager.configured) return [];
    return window.AccountManager.getSelectableMembers();
  }

  function setupPresetNames() {
    var game = currentSetupGame();
    var names = game && game.guestOnlySetup ? [] : PRESET_NAMES.slice();
    accountPlayerOptions().forEach(function (member) {
      if (names.indexOf(member.label) === -1) names.push(member.label);
    });
    return names;
  }

  // ---------- 저장/복원 ----------
  function saveState() {
    try {
      if (state) window.ScoreServices.saveGame(state);
      else window.ScoreServices.clearGame();
    } catch (err) { /* 저장 불가 환경(시크릿 모드 등)은 무시 */ }
  }

  function loadState() {
    try {
      var parsed = window.ScoreServices.loadGame();
      if (!parsed || typeof parsed.gameId !== "string" || !registry[parsed.gameId]) return null;
      if (parsed.mode !== "all" && parsed.mode !== "me") return null;
      if (!Number.isInteger(parsed.round) || parsed.round < 1) return null;
      // 나머지 스키마 검증(엔티티 모양, 라운드 상한 등)은 게임마다 다르므로 해당 모듈에 위임한다.
      return registry[parsed.gameId].validateRestore(parsed, ui) ? parsed : null;
    } catch (err) { return null; }
  }

  // ---------- 화면 전환 ----------
  function showScreen(name) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove("active");
    $("screen-" + name).classList.add("active");
    if (name !== "game") hideAllFloatingPanels();
  }

  // 게임 선택 시점부터 결과 화면까지 은은한 배경 워터마크를 유지하고, 게임 선택 화면으로
  // 돌아가면 지운다. gameId가 null/미등록이면 배경 없음.
  function applyGameBackground(gameId) {
    var el = $("game-bg");
    var active = gameId && registry[gameId];
    if (active) {
      el.setAttribute("data-active", gameId);
      document.body.setAttribute("data-game", gameId);
    } else {
      el.removeAttribute("data-active");
      document.body.removeAttribute("data-game");
    }
  }

  // ---------- 게임 선택 ----------
  // 하위 모드(variants)가 있는 게임은 별도 화면을 거치지 않고, 게임 선택 화면 자체에
  // "게임명 · 모드명" 카드로 펼쳐서 보여준다(예: "티츄 · 팀전", "티츄 · 쟁상유").
  // 카드를 고르면 게임과 모드가 동시에 확정된다. 팀전은 항상 전체 팀 점수를 계산하므로
  // 모두/나 선택을 건너뛰고 참가자·팀 설정으로 바로 넘어간다.
  function renderGameList() {
    var wrap = $("game-list");
    wrap.innerHTML = "";

    function addEntry(game, variant) {
      var btn = document.createElement("button");
      btn.className = "mode-btn";
      var label = variant ? game.name + " · " + variant.label : game.name;
      var desc = variant ? variant.sub : game.desc;
      btn.innerHTML = escapeHtml(label) + "<small>" + escapeHtml(desc) + "</small>";
      btn.addEventListener("click", function () {
        selectedGame = game.id;
        selectedVariant = variant ? variant.id : null;
        selectedPreset = {};
        guestList = [];
        teamAssign = {};
        applyGameBackground(game.id);
        if (game.isTeamMode(selectedVariant)) {
          clearSetupError();
          renderSetup();
          showScreen("setup");
        } else {
          renderModeOptions();
          showScreen("mode");
        }
      });
      wrap.appendChild(btn);
    }

    registryOrder.forEach(function (id) {
      var game = registry[id];
      if (Array.isArray(game.variants) && game.variants.length > 0) {
        game.variants.forEach(function (variant) { addEntry(game, variant); });
      } else {
        addEntry(game, null);
      }
    });
  }

  function isTeamSetup() { return currentSetupGame().isTeamMode(selectedVariant); }

  function selectedPlayerNames() {
    var names = setupPresetNames().filter(function (name) { return selectedPreset[name]; });
    return names.concat(guestList);
  }

  function renderModeOptions() {
    var game = currentSetupGame();
    var defaults = {
      all: { label: "모두", sub: "여럿이서 함께 점수 계산" },
      me: { label: "나", sub: "내 점수만 기록" }
    };
    document.querySelectorAll(".mode-btn[data-mode]").forEach(function (btn) {
      var mode = btn.getAttribute("data-mode");
      var option = game && game.modeOptions && game.modeOptions[mode]
        ? game.modeOptions[mode]
        : defaults[mode];
      btn.innerHTML = escapeHtml(option.label) + "<small>" + escapeHtml(option.sub) + "</small>";
    });
  }

  function renderSetup() {
    var game = currentSetupGame();
    var limits = game.limits(selectedVariant);
    $("setup-title").textContent = game.guestOnlySetup ? "참가 인원 등록" : "참가 인원 선택";
    // 직접 입력 전용 게임도 이 영역에 등록된 참가자 칩을 표시한다.
    // 고정 이름은 renderPlayerChips()에서 생성하지 않으므로 노출되지 않는다.
    $("preset-players").style.display = "";
    $("guest-name").placeholder = game.guestOnlySetup ? "참가자 이름 입력" : "게스트 이름 입력";
    $("setup-hint").textContent = game.guestOnlySetup
      ? limits.label + " 이름을 입력해 참가자를 등록하고, 등록된 이름을 누르면 제거돼요."
      : limits.label + " 이름을 눌러 선택/해제하고, 추가한 게스트는 이름을 누르면 제거돼요.";
    $("team-card").style.display = isTeamSetup() ? "" : "none";
    renderPlayerChips();
  }

  function renderPlayerChips() {
    var wrap = $("preset-players");
    wrap.innerHTML = "";
    setupPresetNames().forEach(function (name) {
        var chip = document.createElement("button");
        chip.className = "chip" + (selectedPreset[name] ? " selected" : "");
        chip.textContent = name;
        chip.addEventListener("click", function () {
          selectedPreset[name] = !selectedPreset[name];
          renderPlayerChips();
        });
        wrap.appendChild(chip);
      });
    guestList.forEach(function (name, index) {
      var chip = document.createElement("button");
      chip.className = "chip selected";
      chip.textContent = "👤 " + name + " ✕";
      chip.addEventListener("click", function () {
        guestList.splice(index, 1);
        renderPlayerChips();
      });
      wrap.appendChild(chip);
    });
    if (isTeamSetup()) renderTeamAssign();
  }

  function renderTeamAssign() {
    var names = selectedPlayerNames();
    // 선택 해제된 사람 제거, 새로 선택된 사람은 인원이 적은 팀에 배정
    Object.keys(teamAssign).forEach(function (name) {
      if (names.indexOf(name) === -1) delete teamAssign[name];
    });
    names.forEach(function (name) {
      if (teamAssign[name] !== "A" && teamAssign[name] !== "B") {
        var countA = names.filter(function (other) { return teamAssign[other] === "A"; }).length;
        var countB = names.filter(function (other) { return teamAssign[other] === "B"; }).length;
        teamAssign[name] = countA <= countB ? "A" : "B";
      }
    });
    var boxA = $("team-a");
    var boxB = $("team-b");
    boxA.innerHTML = "";
    boxB.innerHTML = "";
    names.forEach(function (name) {
      var chip = document.createElement("button");
      chip.className = "chip selected";
      chip.textContent = name;
      chip.addEventListener("click", function () {
        teamAssign[name] = teamAssign[name] === "A" ? "B" : "A";
        renderTeamAssign();
      });
      (teamAssign[name] === "A" ? boxA : boxB).appendChild(chip);
    });
  }

  function showSetupError(message) {
    var el = $("setup-error");
    el.textContent = message;
    el.classList.add("show");
  }

  function clearSetupError() { $("setup-error").classList.remove("show"); }

  // 실제 터치/클릭 지점을 중심으로 전체 화면 끝까지 퍼지는 리플 효과.
  // 특정 버튼이나 UI 영역에 묶이지 않는 고정 뷰포트 오버레이로 표시한다.
  function bindRippleEffects() {
    document.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      var x = event.clientX;
      var y = event.clientY;
      var ripple = document.createElement("span");
      ripple.className = "screen-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.left = x - 5 + "px";
      ripple.style.top = y - 5 + "px";
      ripple.addEventListener("animationend", function () { ripple.remove(); });
      document.body.appendChild(ripple);
    });
  }

  function addGuest() {
    clearSetupError();
    var input = $("guest-name");
    var name = input.value.trim();
    if (!name) { showSetupError("게스트 이름을 입력해주세요."); return; }
    var allNames = selectedPlayerNames();
    var presetNameConflict = setupPresetNames().indexOf(name) !== -1;
    if (presetNameConflict || allNames.indexOf(name) !== -1) {
      showSetupError("이미 있는 이름이에요. 다른 이름을 입력해주세요.");
      return;
    }
    if (allNames.length >= currentSetupGame().limits(selectedVariant).max) {
      showSetupError("최대 " + currentSetupGame().limits(selectedVariant).max + "명까지 참가할 수 있어요.");
      return;
    }
    guestList.push(name);
    input.value = "";
    renderPlayerChips();
  }

  function startGame(mode) {
    var game = currentSetupGame();
    var base = { gameId: selectedGame, mode: mode, round: 1 };

    if (mode === "me") {
      state = game.buildMeState(base, { makeEntity: makeEntity });
    } else {
      var names = selectedPlayerNames();
      var limits = game.limits(selectedVariant);
      if (names.length < limits.min || names.length > limits.max) {
        showSetupError(limits.label);
        return;
      }
      var membersA = names.filter(function (name) { return teamAssign[name] === "A"; });
      var membersB = names.filter(function (name) { return teamAssign[name] === "B"; });
      var result = game.buildAllState(base, {
        names: names,
        membersA: membersA,
        membersB: membersB,
        selectedVariant: selectedVariant,
        makeEntity: makeEntity
      });
      if (result && result.error) { showSetupError(result.error); return; }
      state = result;
    }
    saveState();
    renderGame();
    showScreen("game");
    startRemoteGameTracking();
  }

  function startRemoteGameTracking() {
    if (!state || !window.AccountManager || !window.AccountManager.configured) return;
    window.AccountManager.startGame(state).then(function () {
      saveState();
    }).catch(function (error) {
      console.error("온라인 게임방을 시작하지 못했습니다.", error);
    });
  }

  // ---------- 점수판 ----------
  function scoreRoundColumnLabel(index, roundCount) {
    var sequence = index + 1;
    if (Array.isArray(state.roundLabels) && state.roundLabels.length === roundCount &&
      state.roundLabels[index] !== sequence) {
      return "R" + sequence + "(" + state.roundLabels[index] + ")";
    }
    return "R" + sequence;
  }

  function renderScoreBoard(tableId, ranked) {
    var list = entities();
    var table = $(tableId);
    var rows = list;
    if (ranked) rows = rows.slice().sort(function (a, b) { return b.total - a.total; });
    var decoratedRanking = ranked && state.gameId === "skullking";
    table.classList.toggle("skullking-ranking", decoratedRanking);

    var roundCount = list[0].rounds.length;
    var html = "<tr><th>" + (ranked ? "순위" : "") + "</th><th style='text-align:left;'>이름</th>";
    for (var r = 0; r < roundCount; r++) html += "<th>" + scoreRoundColumnLabel(r, roundCount) + "</th>";
    html += "<th>합계</th></tr>";

    rows.forEach(function (entity, order) {
      var isTop = ranked && entity.total === rows[0].total;
      var rowClasses = [];
      if (isTop) rowClasses.push("rank-1");
      if (decoratedRanking) rowClasses.push("rank-position-" + (order + 1));
      html += "<tr" + (rowClasses.length ? " class='" + rowClasses.join(" ") + "'" : "") + ">";
      if (decoratedRanking && order < 3) {
        html += "<td><span class='rank-medal rank-medal-" + (order + 1) + "'><span class='rank-crown' aria-hidden='true'>♛</span><span>" + (order + 1) + "등</span></span></td>";
      } else {
        html += "<td>" + (ranked ? (decoratedRanking ? (order + 1) + "등" : (order + 1)) : "") + "</td>";
      }
      html += "<td class='name'>" + escapeHtml(entityDisplayName(entity)) + "</td>";
      entity.rounds.forEach(function (score) {
        html += "<td>" + score + "</td>";
      });
      var cls = entity.total >= 0 ? "total-pos" : "total-neg";
      html += "<td class='" + cls + "'>" + entity.total + "</td></tr>";
    });
    table.innerHTML = html;
  }

  // ---------- 공용 입력 컴포넌트 (게임 모듈이 재사용) ----------
  function makeStepper(value, min, max, step, onChange) {
    var wrap = document.createElement("div");
    wrap.className = "stepper";
    var minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    var val = document.createElement("div");
    val.className = "val";
    val.textContent = value;
    var plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    function boundValue(bound) { return typeof bound === "function" ? bound() : bound; }
    function refresh() {
      var current = parseInt(val.textContent, 10);
      minus.disabled = current <= boundValue(min);
      plus.disabled = current >= boundValue(max);
    }
    minus.addEventListener("click", function () {
      var next = Math.max(boundValue(min), parseInt(val.textContent, 10) - step);
      val.textContent = next;
      onChange(next);
      refresh();
    });
    plus.addEventListener("click", function () {
      var next = Math.min(boundValue(max), parseInt(val.textContent, 10) + step);
      val.textContent = next;
      onChange(next);
      refresh();
    });
    wrap.appendChild(minus);
    wrap.appendChild(val);
    wrap.appendChild(plus);
    wrap.refresh = refresh;
    refresh();
    return wrap;
  }

  function entryField(labelText, control, className) {
    var wrap = document.createElement("div");
    if (className) wrap.className = className;
    var label = document.createElement("label");
    label.textContent = labelText;
    wrap.appendChild(label);
    if (control) wrap.appendChild(control);
    return wrap;
  }

  // ---------- 게임 진행 공통 ----------
  function showEntryError(message) {
    var el = $("entry-error");
    el.textContent = message;
    el.classList.add("show");
  }

  function submitRound() {
    $("entry-error").classList.remove("show");
    var completedRounds = entities()[0].rounds.length;
    currentGame().round.submit(state, ui);
    // 유효성 검사에 실패한 경우는 그대로 두고, 점수가 실제 저장된 경우에만
    // 다음 라운드/결과 화면의 최상단으로 이동한다.
    if (state && entities()[0].rounds.length > completedRounds) {
      requestAnimationFrame(function () {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    }
  }

  function advanceRound() {
    state.round += 1;
    saveState();
    renderGame();
  }

  function renderGame() {
    var game = currentGame();
    var suffix = game.round.roundSuffix ? game.round.roundSuffix(state) : "";
    $("round-label").innerHTML = "라운드 <span>" + state.round + "</span>" + suffix;
    // subtitle은 게임 모듈이 내부적으로 만드는 고정 문구이며 사용자 입력이 섞이지 않으므로 innerHTML로 처리한다.
    $("round-sub").innerHTML = game.round.subtitle(state);
    $("entry-title").textContent = "라운드 " + state.round + " 결과 입력";
    $("submit-round").textContent = game.round.submitLabel(state);
    $("end-game").textContent = game.round.endLabel ? game.round.endLabel(state) : "현재 점수로 게임 종료";
    $("end-game").style.display = game.round.showEndButton(state) ? "" : "none";

    document.querySelectorAll(".rules").forEach(function (el) { el.style.display = "none"; });
    document.querySelectorAll(".rules[data-rules-game]").forEach(function (el) {
      if (el.getAttribute("data-rules-game") === state.gameId) el.style.display = "";
    });

    renderSkullkingCustomControls();
    renderScoreBoard("score-board", false);
    $("edit-rounds").style.display = entities()[0].rounds.length > 0 ? "" : "none";
    game.round.renderEntry(state, $("entry-list"), ui);
  }

  function renderSkullkingCustomControls() {
    var panel = $("skullking-custom-panel");
    if (state.gameId !== "skullking") {
      panel.style.display = "none";
      return;
    }
    panel.style.display = "";
    var enabled = state.skullkingCustomMode === true;
    $("skullking-custom-toggle").checked = enabled;
    $("skullking-custom-options").style.display = enabled ? "" : "none";
    $("custom-round-value").textContent = state.round;
    $("custom-round-minus").disabled = state.round <= 1;
    $("custom-round-plus").disabled = state.round >= 10;
    $("custom-auto-advance").checked = state.skullkingAutoAdvance !== false;
  }

  function ensureRoundLabels() {
    if (Array.isArray(state.roundLabels)) return;
    var count = entities()[0].rounds.length;
    state.roundLabels = [];
    for (var i = 0; i < count; i++) state.roundLabels.push(i + 1);
  }

  function toggleSkullkingCustomMode() {
    state.skullkingCustomMode = $("skullking-custom-toggle").checked;
    // 커스텀 모드를 켜고 끌 때마다 "라운드 자동 상승"은 항상 기본값(켜짐)으로 되돌린다.
    // 이전에는 숨겨진 체크박스에 남아있던 값을 그대로 읽어와, 자동 상승을 한 번이라도
    // 끈 적이 있으면 커스텀 모드를 껐다 다시 켜도 라운드가 계속 고정되는 버그가 있었다.
    state.skullkingAutoAdvance = true;
    ensureRoundLabels();
    saveState();
    renderGame();
  }

  function adjustSkullkingRound(delta) {
    if (!state || state.gameId !== "skullking" || !state.skullkingCustomMode) return;
    state.round = Math.max(1, Math.min(10, state.round + delta));
    saveState();
    renderGame();
  }

  // ---------- 스컬킹 점수 규칙·해적 능력 플로팅 패널 ----------
  var FLOATING_EDGE = 8;
  var FLOATING_GAP = 1;
  var FLOATING_SNAP_DISTANCE = 16;
  var floatingDrag = null;
  var floatingPanelConfig = {
    score: {
      panelId: "score-floating",
      rulesId: "rules-skullking",
      sourceSelector: ".score-rules-list",
      bodyId: "score-floating-body",
      showId: "show-score-floating",
      toggleId: "toggle-score-floating",
      hideId: "hide-score-floating"
    },
    pirate: {
      panelId: "pirate-floating",
      rulesId: "rules-skullking-pirates",
      sourceSelector: ".pirate-abilities",
      bodyId: "pirate-floating-body",
      showId: "show-pirate-floating",
      toggleId: "toggle-pirate-floating",
      hideId: "hide-pirate-floating"
    }
  };

  function floatingConfigs() {
    return Object.keys(floatingPanelConfig).map(function (key) { return floatingPanelConfig[key]; });
  }

  function visibleFloatingConfigs() {
    return floatingConfigs().filter(function (config) {
      return $(config.panelId).style.display !== "none";
    });
  }

  function applyFloatingFocus(targetConfig) {
    var visible = visibleFloatingConfigs();
    visible.forEach(function (config) { $(config.panelId).classList.remove("focused"); });
    if (!targetConfig) return;
    var target = $(targetConfig.panelId);
    target.classList.add("focused");
    if (target.classList.contains("snapped")) {
      visible.forEach(function (config) {
        var panel = $(config.panelId);
        if (panel.classList.contains("snapped")) panel.classList.add("focused");
      });
    }
  }

  function setFloatingPosition(panel, left, top) {
    var maxLeft = Math.max(FLOATING_EDGE, window.innerWidth - panel.offsetWidth - FLOATING_EDGE);
    var maxTop = Math.max(FLOATING_EDGE, window.innerHeight - panel.offsetHeight - FLOATING_EDGE);
    panel.style.left = Math.min(maxLeft, Math.max(FLOATING_EDGE, left)) + "px";
    panel.style.top = Math.min(maxTop, Math.max(FLOATING_EDGE, top)) + "px";
  }

  function panelsOverlap(first, second) {
    var a = first.getBoundingClientRect();
    var b = second.getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function clearFloatingSnap() {
    floatingConfigs().forEach(function (config) { $(config.panelId).classList.remove("snapped"); });
  }

  function updateFloatingPairState() {
    var visible = visibleFloatingConfigs();
    floatingConfigs().forEach(function (config) {
      $(config.panelId).classList.toggle("paired", visible.length > 1);
      if (visible.length < 2) $(config.panelId).classList.remove("snapped");
    });
  }

  function stackFloatingPanels(first, second) {
    setFloatingPosition(first, first.getBoundingClientRect().left, FLOATING_EDGE);
    setFloatingPosition(second, first.getBoundingClientRect().left, first.getBoundingClientRect().bottom + FLOATING_GAP);
    first.classList.add("snapped");
    second.classList.add("snapped");
  }

  function placeFloatingBeside(panel, other) {
    var panelRect = panel.getBoundingClientRect();
    var otherRect = other.getBoundingClientRect();
    var candidates = [
      { left: otherRect.left, top: otherRect.bottom + FLOATING_GAP },
      { left: otherRect.left, top: otherRect.top - panelRect.height - FLOATING_GAP },
      { left: otherRect.right + FLOATING_GAP, top: otherRect.top },
      { left: otherRect.left - panelRect.width - FLOATING_GAP, top: otherRect.top }
    ];
    var placed = candidates.some(function (candidate) {
      var fits = candidate.left >= FLOATING_EDGE && candidate.top >= FLOATING_EDGE &&
        candidate.left + panelRect.width <= window.innerWidth - FLOATING_EDGE &&
        candidate.top + panelRect.height <= window.innerHeight - FLOATING_EDGE;
      if (fits) setFloatingPosition(panel, candidate.left, candidate.top);
      return fits;
    });
    if (!placed) stackFloatingPanels(other, panel);
    panel.classList.add("snapped");
    other.classList.add("snapped");
  }

  function arrangeFloatingPanels() {
    updateFloatingPairState();
    var visible = visibleFloatingConfigs();
    visible.forEach(function (config) {
      var panel = $(config.panelId);
      var rect = panel.getBoundingClientRect();
      setFloatingPosition(panel, rect.left, rect.top);
    });
    if (visible.length === 2) {
      var first = $(visible[0].panelId);
      var second = $(visible[1].panelId);
      if (panelsOverlap(first, second)) placeFloatingBeside(second, first);
    }
    var focused = visible.filter(function (config) { return $(config.panelId).classList.contains("focused"); })[0];
    if (focused) applyFloatingFocus(focused);
  }

  function showFloatingPanel(key) {
    var config = floatingPanelConfig[key];
    var source = $(config.rulesId).querySelector(config.sourceSelector);
    var body = $(config.bodyId);
    body.innerHTML = "";
    body.appendChild(source.cloneNode(true));
    var rules = $(config.rulesId);
    rules.open = false;
    rules.classList.add("is-floating");
    $(config.showId).textContent = "플로팅 제거";
    $(config.panelId).style.display = "";
    body.style.display = "";
    $(config.toggleId).textContent = "접기";
    $(config.toggleId).setAttribute("aria-expanded", "true");
    applyFloatingFocus(config);
    requestAnimationFrame(arrangeFloatingPanels);
    $(config.toggleId).focus();
  }

  function hideFloatingPanel(key) {
    var config = floatingPanelConfig[key];
    var panel = $(config.panelId);
    if (!panel) return;
    var wasFloating = panel.style.display !== "none";
    panel.style.display = "none";
    panel.classList.remove("dragging", "snapped", "paired");
    var rules = $(config.rulesId);
    rules.classList.remove("is-floating");
    if (wasFloating) rules.open = true;
    $(config.showId).textContent = "플로팅";
    if (floatingDrag && floatingDrag.panel === panel) floatingDrag = null;
    applyFloatingFocus(null);
    updateFloatingPairState();
  }

  function hideAllFloatingPanels() {
    Object.keys(floatingPanelConfig).forEach(hideFloatingPanel);
  }

  function toggleFloatingMode(key, event) {
    event.preventDefault();
    event.stopPropagation();
    var config = floatingPanelConfig[key];
    if ($(config.panelId).style.display === "none") showFloatingPanel(key);
    else hideFloatingPanel(key);
  }

  function toggleFloatingBody(key) {
    var config = floatingPanelConfig[key];
    var body = $(config.bodyId);
    var expanded = body.style.display !== "none";
    body.style.display = expanded ? "none" : "";
    $(config.toggleId).textContent = expanded ? "펼치기" : "접기";
    $(config.toggleId).setAttribute("aria-expanded", expanded ? "false" : "true");
    requestAnimationFrame(arrangeFloatingPanels);
  }

  function resolveFloatingCollision(panel, desiredLeft, desiredTop) {
    var width = panel.offsetWidth;
    var height = panel.offsetHeight;
    var maxLeft = Math.max(FLOATING_EDGE, window.innerWidth - width - FLOATING_EDGE);
    var maxTop = Math.max(FLOATING_EDGE, window.innerHeight - height - FLOATING_EDGE);
    var left = Math.min(maxLeft, Math.max(FLOATING_EDGE, desiredLeft));
    var top = Math.min(maxTop, Math.max(FLOATING_EDGE, desiredTop));
    var otherConfig = visibleFloatingConfigs().filter(function (config) {
      return $(config.panelId) !== panel;
    })[0];
    if (!otherConfig) return { left: left, top: top, snapped: false };

    var other = $(otherConfig.panelId);
    var otherRect = other.getBoundingClientRect();
    var horizontalOverlap = left < otherRect.right && left + width > otherRect.left;
    var verticalOverlap = top < otherRect.bottom && top + height > otherRect.top;
    var candidates = [];

    if (horizontalOverlap && verticalOverlap) {
      candidates = [
        { left: otherRect.left - width - FLOATING_GAP, top: top },
        { left: otherRect.right + FLOATING_GAP, top: top },
        { left: left, top: otherRect.top - height - FLOATING_GAP },
        { left: left, top: otherRect.bottom + FLOATING_GAP }
      ];
    } else {
      if (verticalOverlap && Math.abs(left + width - otherRect.left) <= FLOATING_SNAP_DISTANCE) {
        candidates.push({ left: otherRect.left - width - FLOATING_GAP, top: top });
      }
      if (verticalOverlap && Math.abs(left - otherRect.right) <= FLOATING_SNAP_DISTANCE) {
        candidates.push({ left: otherRect.right + FLOATING_GAP, top: top });
      }
      if (horizontalOverlap && Math.abs(top + height - otherRect.top) <= FLOATING_SNAP_DISTANCE) {
        candidates.push({ left: left, top: otherRect.top - height - FLOATING_GAP });
      }
      if (horizontalOverlap && Math.abs(top - otherRect.bottom) <= FLOATING_SNAP_DISTANCE) {
        candidates.push({ left: left, top: otherRect.bottom + FLOATING_GAP });
      }
    }

    var valid = candidates.filter(function (candidate) {
      return candidate.left >= FLOATING_EDGE && candidate.top >= FLOATING_EDGE &&
        candidate.left + width <= window.innerWidth - FLOATING_EDGE &&
        candidate.top + height <= window.innerHeight - FLOATING_EDGE;
    }).sort(function (a, b) {
      var distanceA = Math.abs(a.left - left) + Math.abs(a.top - top);
      var distanceB = Math.abs(b.left - left) + Math.abs(b.top - top);
      return distanceA - distanceB;
    });

    if (valid.length) return { left: valid[0].left, top: valid[0].top, snapped: true, other: other };
    if (horizontalOverlap && verticalOverlap) {
      var current = panel.getBoundingClientRect();
      return { left: current.left, top: current.top, snapped: true, other: other };
    }
    return { left: left, top: top, snapped: false, other: other };
  }

  function startFloatingDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button")) return;
    var panel = event.currentTarget.closest(".floating-panel");
    var rect = panel.getBoundingClientRect();
    floatingDrag = {
      panel: panel,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top
    };
    panel.classList.add("dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
    applyFloatingFocus(floatingPanelConfig[panel.getAttribute("data-floating-key")]);
    event.preventDefault();
  }

  function moveFloatingPanel(event) {
    if (!floatingDrag || event.pointerId !== floatingDrag.pointerId) return;
    var panel = floatingDrag.panel;
    var result = resolveFloatingCollision(
      panel,
      floatingDrag.left + event.clientX - floatingDrag.startX,
      floatingDrag.top + event.clientY - floatingDrag.startY
    );
    panel.style.left = result.left + "px";
    panel.style.top = result.top + "px";
    clearFloatingSnap();
    if (result.snapped) {
      panel.classList.add("snapped");
      if (result.other) result.other.classList.add("snapped");
    }
    applyFloatingFocus(floatingPanelConfig[panel.getAttribute("data-floating-key")]);
    event.preventDefault();
  }

  function endFloatingDrag(event) {
    if (!floatingDrag || event.pointerId !== floatingDrag.pointerId) return;
    floatingDrag.panel.classList.remove("dragging");
    floatingDrag = null;
  }

  // ---------- 이전 라운드 점수 수정 ----------
  function openRoundEditor() {
    var list = entities();
    var roundCount = list[0].rounds.length;
    if (roundCount === 0) return;

    var table = $("round-edit-table");
    table.innerHTML = "";
    var headRow = document.createElement("tr");
    var nameHead = document.createElement("th");
    nameHead.textContent = state.teams ? "팀" : "이름";
    headRow.appendChild(nameHead);
    for (var roundIndex = 0; roundIndex < roundCount; roundIndex++) {
      var roundHead = document.createElement("th");
      roundHead.textContent = scoreRoundColumnLabel(roundIndex, roundCount);
      headRow.appendChild(roundHead);
    }
    table.appendChild(headRow);

    list.forEach(function (entity, entityIndex) {
      var row = document.createElement("tr");
      var nameCell = document.createElement("td");
      nameCell.textContent = entityDisplayName(entity);
      row.appendChild(nameCell);
      entity.rounds.forEach(function (score, scoreIndex) {
        var cell = document.createElement("td");
        var input = document.createElement("input");
        input.type = "number";
        input.inputMode = "numeric";
        input.className = "round-score-input";
        input.value = score;
        input.setAttribute("aria-label", entityDisplayName(entity) + " " + (scoreIndex + 1) + "라운드 점수");
        input.setAttribute("data-entity-index", entityIndex);
        input.setAttribute("data-round-index", scoreIndex);
        cell.appendChild(input);
        row.appendChild(cell);
      });
      table.appendChild(row);
    });

    $("round-edit-error").classList.remove("show");
    $("edit-rounds-modal").classList.add("show");
    var firstInput = table.querySelector("input");
    if (firstInput) firstInput.focus();
  }

  function closeRoundEditor() {
    $("edit-rounds-modal").classList.remove("show");
    $("round-edit-error").classList.remove("show");
  }

  function saveRoundEdits() {
    var list = entities();
    var nextRounds = list.map(function (entity) { return entity.rounds.slice(); });
    var inputs = $("round-edit-table").querySelectorAll(".round-score-input");
    for (var i = 0; i < inputs.length; i++) {
      var raw = inputs[i].value.trim();
      var value = Number(raw);
      if (raw === "" || !Number.isSafeInteger(value)) {
        $("round-edit-error").textContent = "모든 점수를 정수로 입력해주세요.";
        $("round-edit-error").classList.add("show");
        inputs[i].focus();
        return;
      }
      nextRounds[parseInt(inputs[i].getAttribute("data-entity-index"), 10)]
        [parseInt(inputs[i].getAttribute("data-round-index"), 10)] = value;
    }

    list.forEach(function (entity, entityIndex) {
      entity.rounds = nextRounds[entityIndex];
      entity.total = entity.rounds.reduce(function (sum, score) { return sum + score; }, 0);
    });
    saveState();
    renderGame();
    closeRoundEditor();
  }

  // ---------- 결과 ----------
  function finishGame() {
    $("end-game-modal").classList.remove("show");
    if (window.AccountManager && window.AccountManager.configured) {
      window.AccountManager.finishGame(state).catch(function (error) {
        console.error("게임 기록을 저장하지 못했습니다.", error);
      });
    }
    renderResult();
    showScreen("result");
    // 종료된 게임은 저장소에 남기지 않는다(같은 멤버 재시작을 위해 state 자체는 메모리에 유지).
    // 저장된 채로 재접속하면 결과 화면이 아닌 라운드 입력 화면으로 복원되어
    // 마지막 라운드가 중복 기록될 수 있다.
    window.ScoreServices.clearGame();
  }

  function renderResult() {
    renderScoreBoard("final-board", true);
    var ranked = entities().slice().sort(function (a, b) { return b.total - a.total; });
    var winners = ranked.filter(function (entity) { return entity.total === ranked[0].total; });
    $("winner-name").textContent = winners.map(entityDisplayName).join(", ") + " (" + ranked[0].total + "점)";
  }

  // 사이드 메뉴/그만하기 모두가 공유하는 화면 전환. "게임 선택"은 지금까지의 게임·인원
  // 선택을 전부 비우고 처음부터 다시 고르게 하고, "모두/나 선택"은 이미 고른 게임은
  // 유지한 채 모드만 다시 고르게 한다.
  function goToScreen(target) {
    if (target === "gameselect") {
      selectedGame = null;
      selectedVariant = null;
      selectedPreset = {};
      guestList = [];
      teamAssign = {};
      applyGameBackground(null);
      showScreen("gameselect");
    } else if (target === "mode") {
      // 티츄 팀전처럼 개인 점수 모드가 없는 게임은 참가자·팀 설정으로 곧바로 이동한다.
      if (selectedGame && isTeamSetup()) {
        clearSetupError();
        renderSetup();
        showScreen("setup");
      } else {
        showScreen("mode");
      }
    }
  }

  function resetToGameSelect() {
    state = null;
    saveState();
    goToScreen("gameselect");
  }

  // ---------- 사이드 메뉴 ----------
  var pendingQuitTarget = "gameselect"; // 확인 모달에서 "그만하기"를 눌렀을 때 이동할 화면

  function openSideMenu() {
    $("menu-go-mode").disabled = !selectedGame;
    $("menu-go-mode").textContent = selectedGame && isTeamSetup() ? "참가자/팀 설정" : "모두/나 선택";
    $("side-menu").classList.add("open");
    $("side-menu-backdrop").classList.add("show");
    $("menu-toggle").setAttribute("aria-expanded", "true");
    // 메뉴가 열린 동안 뒤에 가려진 본문으로 키보드 포커스가 넘어가지 않도록 막는다.
    $("main-content").setAttribute("inert", "");
  }

  function closeSideMenu() {
    $("side-menu").classList.remove("open");
    $("side-menu-backdrop").classList.remove("show");
    $("menu-toggle").setAttribute("aria-expanded", "false");
    $("main-content").removeAttribute("inert");
  }

  // 메뉴 항목 클릭: 점수를 입력 중인 게임 화면이면(state가 있으면) 그만하기와 동일한
  // 확인 모달을 띄우고, 아니면 바로 이동한다. "모두/나 선택"은 게임이 선택되지 않았으면
  // 버튼 자체가 비활성화되어 있으므로 여기서는 방어적으로만 재확인한다.
  function requestMenuNavigation(target) {
    closeSideMenu();
    if (target === "mode" && !selectedGame) return;
    if (state) {
      pendingQuitTarget = target;
      $("quit-modal").classList.add("show");
      return;
    }
    goToScreen(target);
  }

  function restartSameMembers() {
    state.round = 1;
    if (Array.isArray(state.roundLabels)) state.roundLabels = [];
    entities().forEach(function (entity) {
      entity.total = 0;
      entity.rounds = [];
    });
    saveState();
    renderGame();
    showScreen("game");
    startRemoteGameTracking();
  }

  // 게임 모듈에 주입되는 도구 모음. 각 game-*.js는 이 객체만으로 렌더링/제출/복원검증을 구현한다.
  var ui = {
    $: $,
    escapeHtml: escapeHtml,
    isFiniteNumber: isFiniteNumber,
    makeStepper: makeStepper,
    entryField: entryField,
    showEntryError: showEntryError,
    entities: entities,
    entityDisplayName: entityDisplayName,
    makeEntity: makeEntity,
    saveState: saveState,
    advanceRound: advanceRound,
    finishGame: finishGame,
    renderGame: renderGame
  };

  function registerGame(definition) {
    registry[definition.id] = definition;
    registryOrder.push(definition.id);
  }

  // ---------- 이벤트 바인딩 & 초기화 ----------
  function bindEvents() {
    document.querySelectorAll(".mode-btn[data-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        var game = currentSetupGame();
        if (game.variantForMode) selectedVariant = game.variantForMode(mode);
        if (mode === "me") { startGame("me"); return; }
        // selectedGame/selectedVariant는 게임 선택 화면에서 이미 확정되어 있다.
        clearSetupError();
        renderSetup();
        showScreen("setup");
      });
    });

    $("add-guest").addEventListener("click", addGuest);
    $("guest-name").addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); addGuest(); }
    });
    $("start-game").addEventListener("click", function () { startGame("all"); });
    $("submit-round").addEventListener("click", submitRound);
    $("end-game").addEventListener("click", function () {
      if (state && state.gameId === "skullking") {
        $("end-game-modal").classList.add("show");
        return;
      }
      finishGame();
    });
    $("end-game-cancel").addEventListener("click", function () { $("end-game-modal").classList.remove("show"); });
    $("end-game-confirm").addEventListener("click", finishGame);
    $("edit-rounds").addEventListener("click", openRoundEditor);
    $("edit-rounds-cancel").addEventListener("click", closeRoundEditor);
    $("edit-rounds-save").addEventListener("click", saveRoundEdits);
    $("skullking-custom-toggle").addEventListener("change", toggleSkullkingCustomMode);
    $("custom-auto-advance").addEventListener("change", function () {
      state.skullkingAutoAdvance = $("custom-auto-advance").checked;
      saveState();
    });
    $("custom-round-minus").addEventListener("click", function () { adjustSkullkingRound(-1); });
    $("custom-round-plus").addEventListener("click", function () { adjustSkullkingRound(1); });
    Object.keys(floatingPanelConfig).forEach(function (key) {
      var config = floatingPanelConfig[key];
      var panel = $(config.panelId);
      var header = panel.querySelector(".floating-header");
      $(config.showId).addEventListener("click", function (event) { toggleFloatingMode(key, event); });
      $(config.hideId).addEventListener("click", function () { hideFloatingPanel(key); });
      $(config.toggleId).addEventListener("click", function () { toggleFloatingBody(key); });
      $(config.rulesId).querySelector("summary").addEventListener("click", function (event) {
        if ($(config.rulesId).classList.contains("is-floating")) event.preventDefault();
      });
      header.addEventListener("pointerdown", startFloatingDrag);
      header.addEventListener("pointermove", moveFloatingPanel);
      header.addEventListener("pointerup", endFloatingDrag);
      header.addEventListener("pointercancel", endFloatingDrag);
      panel.addEventListener("focusin", function () { applyFloatingFocus(config); });
      panel.addEventListener("focusout", function () {
        setTimeout(function () {
          var activeConfig = visibleFloatingConfigs().filter(function (candidate) {
            return $(candidate.panelId).contains(document.activeElement);
          })[0];
          applyFloatingFocus(activeConfig || null);
        }, 0);
      });
    });
    document.addEventListener("pointerdown", function (event) {
      var targetConfig = visibleFloatingConfigs().filter(function (config) {
        return $(config.panelId).contains(event.target);
      })[0];
      applyFloatingFocus(targetConfig || null);
    });
    window.addEventListener("resize", function () { requestAnimationFrame(arrangeFloatingPanels); });
    $("back-to-gameselect").addEventListener("click", function () { goToScreen("gameselect"); });
    $("back-from-setup").addEventListener("click", function () {
      var game = currentSetupGame();
      if (isTeamSetup() && Array.isArray(game.variants) && game.variants.length > 0) {
        goToScreen("gameselect");
      } else {
        renderModeOptions();
        showScreen("mode");
      }
    });
    $("quit-game").addEventListener("click", function () {
      pendingQuitTarget = "gameselect";
      $("quit-modal").classList.add("show");
    });
    $("quit-cancel").addEventListener("click", function () { $("quit-modal").classList.remove("show"); });
    $("quit-confirm").addEventListener("click", function () {
      $("quit-modal").classList.remove("show");
      if (window.AccountManager && window.AccountManager.configured) {
        window.AccountManager.cancelGame(state).catch(function (error) {
          console.error("온라인 게임방 종료를 반영하지 못했습니다.", error);
        });
      }
      state = null;
      saveState();
      goToScreen(pendingQuitTarget);
    });

    // 좌측 상단 햄버거 메뉴: 게임 선택 / 모두·나 선택으로 바로 이동.
    // 점수 입력 중(state가 있을 때)이면 그만하기와 동일한 확인 모달을 먼저 띄운다.
    $("menu-toggle").addEventListener("click", function () {
      if ($("side-menu").classList.contains("open")) closeSideMenu();
      else openSideMenu();
    });
    $("side-menu-backdrop").addEventListener("click", closeSideMenu);
    $("menu-go-gameselect").addEventListener("click", function () { requestMenuNavigation("gameselect"); });
    $("menu-go-mode").addEventListener("click", function () { requestMenuNavigation("mode"); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && $("side-menu").classList.contains("open")) closeSideMenu();
    });

    $("restart-same").addEventListener("click", restartSameMembers);
    $("restart-new").addEventListener("click", resetToGameSelect);
    document.addEventListener("account-members-updated", function () {
      if ($("screen-setup").classList.contains("active") && selectedGame) renderPlayerChips();
    });
  }

  function init() {
    bindRippleEffects();
    bindEvents();
    renderGameList();
    var restored = loadState();
    if (restored) {
      if (confirm("진행 중이던 게임이 있어요. 이어서 할까요?")) {
        state = restored;
        applyGameBackground(state.gameId);
        renderGame();
        showScreen("game");
      } else {
        state = null;
        saveState();
      }
    }
  }

  // Vite 진입점에서 모든 게임 모듈을 등록한 다음 계정 확인을 시작한다.
  // 계정 또는 게스트 진입이 확인된 뒤에만 게임 UI를 초기화한다.
  // 인증 확인 전 localStorage 복원 팝업이나 게임 화면이 먼저 뜨는 것을 막는다.
  if (window.AccountManager) document.addEventListener("account-access-granted", init, { once: true });
  else document.addEventListener("DOMContentLoaded", init);

  return { registerGame: registerGame };
})();
