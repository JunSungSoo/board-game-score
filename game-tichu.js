// 티츄 게임 모듈. 하위 모드 3가지를 하나의 게임 정의로 묶어 등록한다: 팀전, 쟁상유(개인전), "나" 자유기록.
// 정의 계약은 game-skullking.js 상단 주석 참고.
(function () {
  "use strict";

  var TEAM_TARGET = 1000;
  var ZHENG_TARGET = 11;
  var ZHENG_MIN = 3;
  var ZHENG_MAX = 6;
  var TEAM_MAX_PLAYERS = 8;
  var CALLS = [
    { id: "none", label: "선언 없음", points: 0 },
    { id: "small-ok", label: "스몰 성공 +100", points: 100 },
    { id: "small-fail", label: "스몰 실패 -100", points: -100 },
    { id: "large-ok", label: "라지 성공 +200", points: 200 },
    { id: "large-fail", label: "라지 실패 -200", points: -200 }
  ];

  var entryDraft = null;
  var rankChipEls = null; // { first: chipListEl, second: chipListEl } — 쟁상유 순위 선택 UI 참조

  // 진행 방식: team(팀전) | zheng(쟁상유 개인전) | me(자유 기록)
  function kindOf(state) {
    if (state.mode === "me") return "me";
    return state.tichuMode === "team" ? "team" : "zheng";
  }

  function callPoints(callId) {
    for (var i = 0; i < CALLS.length; i++) {
      if (CALLS[i].id === callId) return CALLS[i].points;
    }
    return 0;
  }

  // ---------- 팀전 ----------
  function calcTeamScore(state, draft) {
    var cardA, cardB;
    if (draft.oneTwo === "A") { cardA = 200; cardB = 0; }
    else if (draft.oneTwo === "B") { cardA = 0; cardB = 200; }
    else { cardA = draft.cardA; cardB = 100 - draft.cardA; }
    var callA = 0, callB = 0;
    state.teams[0].members.forEach(function (member) { callA += callPoints(draft.calls[member]); });
    state.teams[1].members.forEach(function (member) { callB += callPoints(draft.calls[member]); });
    return { a: cardA + callA, b: cardB + callB };
  }

  function renderEntryTeam(state, listEl, ui) {
    listEl.innerHTML = "";
    entryDraft = { oneTwo: "none", cardA: 50, calls: {} };

    var box = document.createElement("div");
    box.className = "player-entry tichu-entry tichu-team-entry";

    // 원투 피니시 선택
    var oneTwoField = ui.entryField("원투 피니시 (한 팀이 1·2등)", null);
    var oneTwoChips = document.createElement("div");
    oneTwoChips.className = "chip-list one-two-chips";
    [{ id: "none", label: "없음" }, { id: "A", label: "팀 A" }, { id: "B", label: "팀 B" }].forEach(function (option) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (entryDraft.oneTwo === option.id ? " selected" : "");
      var label = document.createElement("span");
      label.textContent = option.label;
      chip.appendChild(label);
      if (option.id !== "none") {
        var team = state.teams[option.id === "A" ? 0 : 1];
        var representative = team.members[0];
        var others = Math.max(0, team.members.length - 1);
        var meta = document.createElement("small");
        meta.className = "team-chip-meta";
        meta.textContent = "(" + representative + (others > 0 ? " 외 " + others + "명" : "") + ")";
        chip.appendChild(meta);
        chip.setAttribute("aria-label", option.label + " " + meta.textContent);
      }
      chip.addEventListener("click", function () {
        entryDraft.oneTwo = option.id;
        Array.prototype.forEach.call(oneTwoChips.children, function (child) { child.classList.remove("selected"); });
        chip.classList.add("selected");
        cardField.style.display = option.id === "none" ? "" : "none";
        updatePreview();
      });
      oneTwoChips.appendChild(chip);
    });
    oneTwoField.appendChild(oneTwoChips);
    box.appendChild(oneTwoField);

    // 카드 점수 (팀 A 기준, 팀 B는 자동)
    var cardField = document.createElement("div");
    cardField.className = "tichu-entry-section";
    var cardLabel = document.createElement("label");
    cardLabel.className = "field-label";
    cardLabel.textContent = "팀 A 카드 점수 (팀 B는 자동으로 100 - A)";
    cardField.appendChild(cardLabel);
    cardField.appendChild(ui.makeStepper(50, -25, 125, 5, function (v) {
      entryDraft.cardA = v;
      updatePreview();
    }));
    box.appendChild(cardField);

    // 티츄 선언 (플레이어별)
    var callField = document.createElement("div");
    callField.className = "tichu-entry-section";
    var callLabel = document.createElement("label");
    callLabel.className = "field-label";
    callLabel.textContent = "티츄 선언";
    callField.appendChild(callLabel);
    state.teams.forEach(function (team) {
      team.members.forEach(function (member) {
        entryDraft.calls[member] = "none";
        var row = document.createElement("div");
        row.className = "call-row";
        var nameEl = document.createElement("span");
        nameEl.className = "call-name";
        nameEl.textContent = member + " (" + team.name + ")";
        row.appendChild(nameEl);
        var select = document.createElement("select");
        select.className = "call-select";
        CALLS.forEach(function (call) {
          var option = document.createElement("option");
          option.value = call.id;
          option.textContent = call.label;
          select.appendChild(option);
        });
        select.addEventListener("change", function () {
          entryDraft.calls[member] = select.value;
          updatePreview();
        });
        row.appendChild(select);
        callField.appendChild(row);
      });
    });
    box.appendChild(callField);

    var preview = document.createElement("p");
    preview.className = "preview";
    preview.id = "preview-tichu-team";
    box.appendChild(preview);

    listEl.appendChild(box);
    updatePreview();

    function updatePreview() {
      var result = calcTeamScore(state, entryDraft);
      var format = function (value) {
        var cls = value >= 0 ? "pos" : "neg";
        return "<b class='" + cls + "'>" + (value > 0 ? "+" : "") + value + "점</b>";
      };
      ui.$("preview-tichu-team").innerHTML = "이번 라운드: 팀 A " + format(result.a) + " · 팀 B " + format(result.b);
    }
  }

  function submitTeam(state, ui) {
    var result = calcTeamScore(state, entryDraft);
    state.teams[0].rounds.push(result.a);
    state.teams[0].total += result.a;
    state.teams[1].rounds.push(result.b);
    state.teams[1].total += result.b;
    var totalA = state.teams[0].total;
    var totalB = state.teams[1].total;
    if ((totalA >= TEAM_TARGET || totalB >= TEAM_TARGET) && totalA !== totalB) { ui.finishGame(); return; }
    ui.advanceRound();
  }

  // ---------- 쟁상유(개인전) ----------
  function renderEntryZheng(state, listEl, ui) {
    listEl.innerHTML = "";
    entryDraft = { first: null, second: null };
    rankChipEls = { first: null, second: null };

    var box = document.createElement("div");
    box.className = "player-entry tichu-entry tichu-rank-entry";
    box.appendChild(makeRankPicker(state, ui, "1등 (+2점)", "first"));
    box.appendChild(makeRankPicker(state, ui, "2등 (+1점)", "second"));

    var preview = document.createElement("p");
    preview.className = "preview";
    preview.id = "preview-zheng";
    preview.textContent = "이번 판의 1등과 2등을 선택하세요.";
    box.appendChild(preview);

    listEl.appendChild(box);
  }

  function makeRankPicker(state, ui, labelText, key) {
    var field = ui.entryField(labelText, null);
    field.classList.add("rank-picker");
    var chips = document.createElement("div");
    chips.className = "chip-list";
    rankChipEls[key] = chips;
    state.players.forEach(function (player) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = player.name;
      chip.addEventListener("click", function () {
        entryDraft[key] = player.name;
        // 같은 사람이 1·2등 동시 선택되면 반대쪽 해제
        var otherKey = key === "first" ? "second" : "first";
        if (entryDraft[otherKey] === player.name) {
          entryDraft[otherKey] = null;
          syncRankChips(otherKey);
        }
        syncRankChips(key);
        updateZhengPreview(ui);
      });
      chips.appendChild(chip);
    });
    field.appendChild(chips);
    return field;
  }

  function syncRankChips(key) {
    Array.prototype.forEach.call(rankChipEls[key].children, function (chip) {
      chip.classList.toggle("selected", chip.textContent === entryDraft[key]);
    });
  }

  function updateZhengPreview(ui) {
    var parts = [];
    if (entryDraft.first) parts.push(entryDraft.first + " +2점");
    if (entryDraft.second) parts.push(entryDraft.second + " +1점");
    ui.$("preview-zheng").textContent = parts.length ? "이번 판: " + parts.join(" · ") : "이번 판의 1등과 2등을 선택하세요.";
  }

  function submitZheng(state, ui) {
    if (!entryDraft.first || !entryDraft.second) {
      ui.showEntryError("1등과 2등을 모두 선택해주세요.");
      return;
    }
    state.players.forEach(function (player) {
      var gained = player.name === entryDraft.first ? 2 : (player.name === entryDraft.second ? 1 : 0);
      player.rounds.push(gained);
      player.total += gained;
    });
    var top = state.players.slice().sort(function (a, b) { return b.total - a.total; });
    // 쟁상유는 최소 3명이라 top[1]은 항상 존재한다.
    if (top[0].total >= ZHENG_TARGET && top[0].total !== top[1].total) { ui.finishGame(); return; }
    ui.advanceRound();
  }

  // ---------- "나" 모드: 자유 점수 기록 ----------
  function renderEntryMe(state, listEl, ui) {
    listEl.innerHTML = "";
    entryDraft = { score: 0 };

    var box = document.createElement("div");
    box.className = "player-entry tichu-entry tichu-me-entry";
    var field = ui.entryField("이번 라운드 내 점수 (음수 가능)", null);
    var input = document.createElement("input");
    input.type = "text";
    input.className = "extra-bonus-input";
    input.style.width = "100%";
    input.inputMode = "numeric";
    input.maxLength = 5;
    input.placeholder = "예: 105 또는 -100";
    input.addEventListener("input", function () {
      var cleaned = input.value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");
      if (input.value !== cleaned) input.value = cleaned;
      var parsed = parseInt(cleaned, 10);
      entryDraft.score = isNaN(parsed) ? 0 : parsed;
    });
    field.appendChild(input);
    box.appendChild(field);
    listEl.appendChild(box);
  }

  function submitMe(state, ui) {
    var me = state.players[0];
    me.rounds.push(entryDraft.score);
    me.total += entryDraft.score;
    ui.advanceRound();
  }

  // ---------- 공용 진입점 ----------
  function limits(variantId) {
    if (variantId === "team") {
      // 팀 인원수는 자유(하우스 룰로 3인 팀 등 커스텀 구성이 있을 수 있음). 최소 각 팀 1명 이상만 보장.
      return { min: 2, max: TEAM_MAX_PLAYERS, label: "티츄 팀전은 2명 이상이 필요해요." };
    }
    return { min: ZHENG_MIN, max: ZHENG_MAX, label: "쟁상유는 " + ZHENG_MIN + "~" + ZHENG_MAX + "명이 플레이할 수 있어요." };
  }

  function validateRestore(parsed, ui) {
    var validEntity = function (entity) {
      return entity && typeof entity.name === "string" && ui.isFiniteNumber(entity.total) &&
        Array.isArray(entity.rounds) && entity.rounds.every(ui.isFiniteNumber) &&
        entity.rounds.length === parsed.round - 1;
    };
    if (parsed.mode === "all" && parsed.tichuMode === "team") {
      if (!Array.isArray(parsed.teams) || parsed.teams.length !== 2) return false;
      return parsed.teams.every(function (team) {
        return validEntity(team) && Array.isArray(team.members) && team.members.length >= 1 &&
          team.members.every(function (member) { return typeof member === "string"; });
      });
    }
    if (parsed.mode === "all" && parsed.tichuMode !== "zheng") return false;
    // "나" 모드는 항상 1명, 쟁상유는 3~6명이 정원이다. 그 외는 손상/조작된 상태로 간주한다.
    var maxPlayers = parsed.mode === "me" ? 1 : ZHENG_MAX;
    if (!Array.isArray(parsed.players) || parsed.players.length < 1 || parsed.players.length > maxPlayers) return false;
    return parsed.players.every(validEntity);
  }

  window.ScoreManager.registerGame({
    id: "tichu",
    name: "티츄",
    desc: "팀전 / 쟁상유 · 팀전 2명~, 쟁상유 " + ZHENG_MIN + "~" + ZHENG_MAX + "명",
    variants: [
      { id: "team", label: "팀전", sub: "팀 대항 · " + TEAM_TARGET + "점 선착" },
      { id: "zheng", label: "쟁상유", sub: "개인전 · " + ZHENG_TARGET + "점 선착" }
    ],

    limits: limits,
    isTeamMode: function (variantId) { return variantId === "team"; },

    buildAllState: function (base, ctx) {
      if (ctx.selectedVariant === "team") {
        if (ctx.membersA.length < 1 || ctx.membersB.length < 1) {
          return { error: "각 팀에 최소 1명씩 있어야 해요." };
        }
        return Object.assign(base, {
          tichuMode: "team",
          teams: [
            { name: "팀 A", members: ctx.membersA, total: 0, rounds: [] },
            { name: "팀 B", members: ctx.membersB, total: 0, rounds: [] }
          ]
        });
      }
      return Object.assign(base, { tichuMode: "zheng", players: ctx.names.map(ctx.makeEntity) });
    },
    buildMeState: function (base, ctx) {
      return Object.assign(base, { tichuMode: "me", players: [ctx.makeEntity("나")] });
    },

    round: {
      subtitle: function (state) {
        var kind = kindOf(state);
        if (kind === "team") return TEAM_TARGET + "점에 먼저 도달하는 팀이 승리해요";
        if (kind === "zheng") return ZHENG_TARGET + "점에 먼저 도달하면 승리해요";
        return "라운드마다 내 점수를 기록해요";
      },
      submitLabel: function (state) { return kindOf(state) === "zheng" ? "이번 판 기록" : "라운드 점수 계산"; },
      showEndButton: function () { return true; },
      renderEntry: function (state, listEl, ui) {
        var kind = kindOf(state);
        if (kind === "team") renderEntryTeam(state, listEl, ui);
        else if (kind === "zheng") renderEntryZheng(state, listEl, ui);
        else renderEntryMe(state, listEl, ui);
      },
      submit: function (state, ui) {
        var kind = kindOf(state);
        if (kind === "team") submitTeam(state, ui);
        else if (kind === "zheng") submitZheng(state, ui);
        else submitMe(state, ui);
      }
    },

    validateRestore: validateRestore
  });
})();
