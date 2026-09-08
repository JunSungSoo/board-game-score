// 특정 게임 규칙 없이 팀 또는 개인 점수를 라운드별로 기록하는 기타 스코어 모듈.
(function () {
  "use strict";

  var MAX_PLAYERS = 20;
  var PRESET_UNITS = [1, 5, 10, 50];
  var MAX_UNIT = 1000000;
  var entryDraft = null;

  function entities(state) { return state.teams || state.players; }

  function selectUnit(state, unit, source, chips, customInput, ui) {
    state.scoreUnit = unit;
    state.scoreUnitSource = source;
    chips.forEach(function (chip) {
      chip.classList.toggle("selected", source === "preset" && parseInt(chip.getAttribute("data-unit"), 10) === unit);
    });
    customInput.classList.toggle("selected", source === "custom");
    ui.saveState();
  }

  function renderEntry(state, listEl, ui) {
    listEl.innerHTML = "";
    entryDraft = { scores: entities(state).map(function () { return 0; }), customUnitValid: true };

    var unitPanel = document.createElement("div");
    unitPanel.className = "generic-unit-panel";
    var unitLabel = document.createElement("label");
    unitLabel.className = "field-label";
    unitLabel.textContent = "점수 증감 단위";
    unitPanel.appendChild(unitLabel);

    var unitControls = document.createElement("div");
    unitControls.className = "generic-unit-controls";
    var unitChips = document.createElement("div");
    unitChips.className = "chip-list generic-unit-chips";
    var customInput = document.createElement("input");
    customInput.type = "number";
    customInput.inputMode = "numeric";
    customInput.min = "1";
    customInput.max = String(MAX_UNIT);
    customInput.step = "1";
    customInput.className = "generic-unit-input";
    customInput.placeholder = "직접 입력";
    customInput.setAttribute("aria-label", "직접 점수 단위 입력");

    var chips = PRESET_UNITS.map(function (unit) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (state.scoreUnitSource !== "custom" && state.scoreUnit === unit ? " selected" : "");
      chip.textContent = unit;
      chip.setAttribute("data-unit", unit);
      chip.addEventListener("click", function () {
        entryDraft.customUnitValid = true;
        customInput.value = "";
        customInput.removeAttribute("aria-invalid");
        selectUnit(state, unit, "preset", chips, customInput, ui);
      });
      unitChips.appendChild(chip);
      return chip;
    });

    if (state.scoreUnitSource === "custom") {
      customInput.value = state.scoreUnit;
      customInput.classList.add("selected");
    }
    customInput.addEventListener("input", function () {
      var value = Number(customInput.value);
      var valid = Number.isSafeInteger(value) && value >= 1 && value <= MAX_UNIT;
      entryDraft.customUnitValid = valid;
      customInput.setAttribute("aria-invalid", valid ? "false" : "true");
      if (valid) selectUnit(state, value, "custom", chips, customInput, ui);
    });

    unitControls.appendChild(unitChips);
    unitControls.appendChild(customInput);
    unitPanel.appendChild(unitControls);
    listEl.appendChild(unitPanel);

    entities(state).forEach(function (entity, index) {
      var box = document.createElement("div");
      box.className = "player-entry generic-score-entry";
      var name = document.createElement("div");
      name.className = "p-name";
      name.textContent = ui.entityDisplayName(entity);
      box.appendChild(name);
      box.appendChild(makeScoreStepper(index, entity.name, state, ui));
      listEl.appendChild(box);
    });
  }

  function makeScoreStepper(index, name, state, ui) {
    var wrap = document.createElement("div");
    wrap.className = "stepper generic-score-stepper";
    var minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", name + " 점수 감소");
    var value = document.createElement("div");
    value.className = "val";
    value.textContent = "0";
    var plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", name + " 점수 증가");

    function change(direction) {
      if (state.scoreUnitSource === "custom" && !entryDraft.customUnitValid) {
        ui.showEntryError("점수 단위를 1 이상의 정수로 입력해주세요.");
        return;
      }
      entryDraft.scores[index] += direction * state.scoreUnit;
      value.textContent = entryDraft.scores[index];
    }
    minus.addEventListener("click", function () { change(-1); });
    plus.addEventListener("click", function () { change(1); });
    wrap.appendChild(minus);
    wrap.appendChild(value);
    wrap.appendChild(plus);
    return wrap;
  }

  function submit(state, ui) {
    if (state.scoreUnitSource === "custom" && !entryDraft.customUnitValid) {
      ui.showEntryError("점수 단위를 1 이상의 정수로 입력해주세요.");
      return;
    }
    entities(state).forEach(function (entity, index) {
      var score = entryDraft.scores[index];
      entity.rounds.push(score);
      entity.total += score;
    });
    ui.advanceRound();
  }

  function validEntity(entity, round) {
    return entity && typeof entity.name === "string" && Number.isFinite(entity.total) &&
      Array.isArray(entity.rounds) && entity.rounds.every(Number.isFinite) && entity.rounds.length === round - 1;
  }

  function validateRestore(parsed) {
    if (!Number.isSafeInteger(parsed.scoreUnit) || parsed.scoreUnit < 1 || parsed.scoreUnit > MAX_UNIT) return false;
    if (parsed.scoreUnitSource !== "preset" && parsed.scoreUnitSource !== "custom") return false;
    if (parsed.mode === "all") {
      if (parsed.genericMode !== "team" || !Array.isArray(parsed.teams) || parsed.teams.length !== 2) return false;
      return parsed.teams.every(function (team) {
        return validEntity(team, parsed.round) && Array.isArray(team.members) && team.members.length >= 1 &&
          team.members.every(function (member) { return typeof member === "string" && member.length > 0; });
      });
    }
    return parsed.mode === "me" && parsed.genericMode === "me" && Array.isArray(parsed.players) &&
      parsed.players.length === 1 && validEntity(parsed.players[0], parsed.round);
  }

  window.ScoreManager.registerGame({
    id: "generic",
    name: "기타 스코어",
    desc: "특정 규칙 없이 팀 또는 내 점수 기록",
    variants: null,
    guestOnlySetup: true,
    modeOptions: {
      all: { label: "팀", sub: "참가자를 등록하고 두 팀으로 점수 기록" },
      me: { label: "나", sub: "내 점수만 간단하게 기록" }
    },
    variantForMode: function (mode) { return mode === "all" ? "team" : "me"; },

    limits: function () { return { min: 2, max: MAX_PLAYERS, label: "팀 점수 기록은 2명 이상이 필요해요." }; },
    isTeamMode: function (variantId) { return variantId === "team"; },

    buildAllState: function (base, ctx) {
      if (ctx.membersA.length < 1 || ctx.membersB.length < 1) {
        return { error: "각 팀에 최소 1명씩 있어야 해요." };
      }
      return Object.assign(base, {
        genericMode: "team",
        scoreUnit: 1,
        scoreUnitSource: "preset",
        teams: [
          { name: "팀 A", members: ctx.membersA, total: 0, rounds: [] },
          { name: "팀 B", members: ctx.membersB, total: 0, rounds: [] }
        ]
      });
    },
    buildMeState: function (base, ctx) {
      return Object.assign(base, {
        genericMode: "me",
        scoreUnit: 1,
        scoreUnitSource: "preset",
        players: [ctx.makeEntity("나")]
      });
    },

    round: {
      subtitle: function () { return ""; },
      submitLabel: function () { return "라운드 종료"; },
      showEndButton: function () { return false; },
      renderEntry: renderEntry,
      submit: submit
    },

    validateRestore: validateRestore
  });
})();
