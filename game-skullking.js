// 스컬킹 게임 모듈. window.ScoreManager.registerGame(definition)으로 자신을 등록한다.
//
// 정의 계약(공통 매니저가 기대하는 모양):
//   id, name, desc          — 게임 선택 화면에 노출되는 정보
//   variants                — 하위 모드 목록(예: 티츄의 팀전/쟁상유). 게임 선택 화면에
//                              "게임명 · 모드명" 카드로 하나씩 펼쳐져 노출된다. 없으면 null.
//   limits(variantId)       — { min, max, label } 참가 인원 제한
//   isTeamMode(variantId)   — 팀 나누기 UI 노출 여부
//   buildAllState(base, ctx)— "모두" 모드 시작 시 state 생성. 실패 시 { error: string } 반환
//   buildMeState(base, ctx) — "나" 모드 시작 시 state 생성
//   round.roundSuffix?(state)   — 라운드 라벨 뒤에 붙는 문자열 (예: " / 10")
//   round.subtitle(state)       — 라운드 안내 문구
//   round.submitLabel(state)    — 제출 버튼 문구
//   round.endLabel?(state)      — 중간 종료 버튼 문구(생략 시 공통 기본 문구)
//   round.showEndButton(state)  — "현재 점수로 게임 종료" 버튼 노출 여부
//   round.renderEntry(state, listEl, ui) — 라운드 입력 UI 렌더링
//   round.submit(state, ui)     — 제출 처리(점수 반영 후 ui.advanceRound() 또는 ui.finishGame() 호출)
//   validateRestore(parsed, ui) — localStorage 복원 시 스키마 검증
//
// 추가로 지켜야 하는 암묵 규칙(공통 매니저/HTML이 게임 id를 보고 찾는 것들):
//   - index.html에 <details class="rules" id="rules-<게임id>">를 등록해두면
//     게임 진행 화면에서 자동으로 노출된다(없어도 에러는 안 나고 그냥 안 보이므로,
//     새 게임을 추가할 때 규칙 블록 추가를 잊지 않도록 주의).
//   - isTeamMode()가 true인 팀 모드는 common.js가 A/B 정확히 2팀으로 고정 처리한다
//     (team-a/team-b DOM, teamAssign 값이 'A'|'B'). 3팀 이상을 쓰는 게임을 추가하려면
//     common.js의 renderTeamAssign/startGame 팀 분리 로직 자체를 일반화해야 한다.
(function () {
  "use strict";

  var TOTAL_ROUNDS = 10;
  var MAX_PLAYERS = 8;
  // 보너스는 모두 10점 단위(14 획득 +10/+20, 해적↔인어 +20, 스컬킹→해적 +30, 인어→스컬킹 +40)라
  // 세부 종류를 따로 입력받지 않고 합산값 하나를 10점 단위 스테퍼로 받는다.
  var BONUS_STEP = 10;
  var BONUS_MAX = 300;

  var entryDraft = null;

  function calcScore(round, bid, tricks, bonus) {
    return window.ScoreServices.calculateSkullkingScore(round, bid, tricks, bonus);
  }

  function renderEntry(state, listEl, ui) {
    var round = state.round;
    listEl.innerHTML = "";
    entryDraft = {};
    var trickSteppers = [];
    var sharedLimitNote = null;

    state.players.forEach(function (_, index) {
      entryDraft[index] = { bid: 0, tricks: 0, bonus: 0 };
    });

    if (state.mode === "all") {
      sharedLimitNote = document.createElement("p");
      sharedLimitNote.className = "shared-trick-limit";
      listEl.appendChild(sharedLimitNote);
    }

    state.players.forEach(function (player, index) {
      var box = document.createElement("div");
      box.className = "player-entry";

      var nameEl = document.createElement("div");
      nameEl.className = "p-name";
      nameEl.textContent = player.name;
      box.appendChild(nameEl);

      var grid = document.createElement("div");
      grid.className = "entry-grid";
      grid.appendChild(ui.entryField("비드", ui.makeStepper(0, 0, round, 1, function (v) {
        entryDraft[index].bid = v; updatePreview(index);
      })));
      var trickMax = state.mode === "all"
        ? function () { return entryDraft[index].tricks + remainingTricks(); }
        : round;
      var trickStepper = ui.makeStepper(0, 0, trickMax, 1, function (v) {
        entryDraft[index].tricks = v;
        refreshSharedTrickLimit();
        updatePreview(index);
      });
      trickSteppers.push(trickStepper);
      grid.appendChild(ui.entryField("획득 트릭", trickStepper));
      grid.appendChild(ui.entryField("보너스 점수", ui.makeStepper(0, -BONUS_MAX, BONUS_MAX, BONUS_STEP, function (v) {
        entryDraft[index].bonus = v; updatePreview(index);
      }), "bonus-field"));
      box.appendChild(grid);

      var note = document.createElement("p");
      note.className = "bonus-note";
      note.textContent = "보너스는 비드를 정확히 맞췄을 때만 반영되며, 능력 결과에 따라 음수로 입력할 수 있어요.";
      box.appendChild(note);

      var preview = document.createElement("p");
      preview.className = "preview";
      preview.id = "preview-" + index;
      box.appendChild(preview);

      listEl.appendChild(box);
      updatePreview(index);
    });
    refreshSharedTrickLimit();

    function remainingTricks() {
      return window.ScoreServices.remainingTricks(round, state.players.map(function (_, index) { return entryDraft[index].tricks; }));
    }

    function refreshSharedTrickLimit() {
      trickSteppers.forEach(function (stepper) { stepper.refresh(); });
      if (sharedLimitNote) {
        sharedLimitNote.innerHTML = "전체 남은 획득 트릭: <b>" + remainingTricks() + "</b> / " + round;
      }
    }

    function updatePreview(index) {
      var draft = entryDraft[index];
      var result = calcScore(state.round, draft.bid, draft.tricks, draft.bonus);
      var el = ui.$("preview-" + index);
      var cls = result.total >= 0 ? "pos" : "neg";
      var sign = result.total > 0 ? "+" : "";
      var bonusDetail = result.bonus > 0
        ? " + 보너스 " + result.bonus
        : (result.bonus < 0 ? " - 보너스 " + Math.abs(result.bonus) : "");
      var detail = result.exact
        ? "비드 성공! 기본 " + result.base + bonusDetail
        : "비드 실패 (보너스 미적용)";
      el.innerHTML = "이번 라운드: <b class='" + cls + "'>" + sign + result.total + "점</b> · " + detail;
    }
  }

  function submit(state, ui) {
    if (state.mode === "all") {
      var totalTricks = state.players.reduce(function (sum, player, index) {
        return sum + entryDraft[index].tricks;
      }, 0);
      if (totalTricks !== state.round) {
        ui.showEntryError("전체 획득 트릭 합계(" + totalTricks + ")가 이번 라운드 트릭 수(" + state.round + ")와 달라요. 다시 확인해주세요.");
        return;
      }
    }
    if (!Array.isArray(state.roundLabels)) {
      state.roundLabels = [];
      for (var oldRound = 0; oldRound < state.players[0].rounds.length; oldRound++) {
        state.roundLabels.push(oldRound + 1);
      }
    }
    state.players.forEach(function (player, index) {
      var draft = entryDraft[index];
      var result = calcScore(state.round, draft.bid, draft.tricks, draft.bonus);
      player.rounds.push(result.total);
      player.total += result.total;
    });
    state.roundLabels.push(state.round);
    if (state.round >= TOTAL_ROUNDS) { ui.finishGame(); return; }
    if (state.skullkingCustomMode && state.skullkingAutoAdvance === false) {
      ui.saveState();
      ui.renderGame();
      return;
    }
    ui.advanceRound();
  }

  function validateRestore(parsed, ui) {
    if (parsed.round > TOTAL_ROUNDS) return false;
    var hasRoundLabels = Array.isArray(parsed.roundLabels);
    if (hasRoundLabels && (!parsed.roundLabels.every(function (round) {
      return Number.isInteger(round) && round >= 1 && round <= TOTAL_ROUNDS;
    }) || (parsed.skullkingAutoAdvance !== undefined && typeof parsed.skullkingAutoAdvance !== "boolean") ||
      (parsed.skullkingCustomMode !== undefined && typeof parsed.skullkingCustomMode !== "boolean"))) return false;
    var validEntity = function (entity) {
      return entity && typeof entity.name === "string" && ui.isFiniteNumber(entity.total) &&
        Array.isArray(entity.rounds) && entity.rounds.every(ui.isFiniteNumber) &&
        entity.rounds.length === (hasRoundLabels ? parsed.roundLabels.length : parsed.round - 1);
    };
    if (!Array.isArray(parsed.players) || parsed.players.length < 1 || parsed.players.length > MAX_PLAYERS) return false;
    return parsed.players.every(validEntity);
  }

  window.ScoreManager.registerGame({
    id: "skullking",
    name: "스컬킹",
    desc: "트릭 예측 게임 · 2~8명",
    variants: null,

    limits: function () { return { min: 2, max: MAX_PLAYERS, label: "스컬킹은 2~8명이 플레이할 수 있어요." }; },
    isTeamMode: function () { return false; },

    buildAllState: function (base, ctx) {
      return Object.assign(base, {
        players: ctx.names.map(ctx.makeEntity),
        roundLabels: [],
        skullkingCustomMode: false,
        skullkingAutoAdvance: true
      });
    },
    buildMeState: function (base, ctx) {
      return Object.assign(base, {
        players: [ctx.makeEntity("나")],
        roundLabels: [],
        skullkingCustomMode: false,
        skullkingAutoAdvance: true
      });
    },

    round: {
      roundSuffix: function () { return " / " + TOTAL_ROUNDS; },
      subtitle: function (state) { return "이번 라운드는 <u><b>" + state.round + "장</b></u>씩 받아요"; },
      submitLabel: function () { return "라운드 점수 계산"; },
      endLabel: function () { return "게임 종료"; },
      showEndButton: function (state) {
        return state.mode === "all" && state.players[0].rounds.length > 0;
      },
      renderEntry: renderEntry,
      submit: submit
    },

    validateRestore: validateRestore
  });
})();
