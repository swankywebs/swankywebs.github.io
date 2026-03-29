(function () {
  'use strict';

  let gameData = null;
  let currentMode = 'national';
  let currentGameIndex = 0;
  let currentRound = 0;
  let totalScore = 0;
  let roundScores = [];
  let hintCount = 0;
  let hintPenaltyTotal = 0;
  let gameHintUsed = false;
  let hintsRevealed = {};
  let visiblePhotos = [];
  let currentPhotoIndex = 0;
  let leaderboard = [];
  let newlyUnlockedAchievements = [];
  let roundLocked = false;
  let usedQuips = {};
  const SETTINGS_ENABLED = false;
  const nationalPlayedStorageKey = 'realty-roulette-national-played-v1';
  const stateChallengeStorageKey = 'realty-roulette-state-challenge-v1';
  const selectedStateStorageKey = 'realty-roulette-selected-state-v1';
  const achievementStorageKey = 'realty-roulette-achievements-v1';
  const leaderboardStorageKey = 'realty-roulette-leaderboard-v1';
  const settingsStorageKey = 'realty-roulette-settings-v1';
  const medalRank = { none: 0, bronze: 1, silver: 2, gold: 3 };
  const quipBuckets = [
    {
      emoji: '🎯',
      maxPct: 5,
      lines: {
        any: [
          'Are you the appraiser?',
          'Dead on. Suspiciously good.',
          "Zillow's calling—they want you.",
          "You might've listed this one.",
          "That's not a guess, that's insider trading.",
        ],
      },
    },
    {
      emoji: '👍',
      maxPct: 15,
      lines: {
        under: [
          "That'll buy you most of the house.",
          'Close enough to make an offer.',
          "You'd survive this market.",
        ],
        over: [
          "You're in the right neighborhood.",
          'Respectable guess.',
          "You'd survive this market.",
        ],
      },
    },
    {
      emoji: '🤏',
      maxPct: 30,
      lines: {
        under: [
          "You're shopping in the right zip code.",
          'Closer than most buyers, honestly.',
          'Needs a bit more... inflation.',
        ],
        over: [
          'A little optimistic there.',
          'Not quite HGTV-ready.',
          'Closer than most buyers, honestly.',
        ],
      },
    },
    {
      emoji: '😬',
      maxPct: 60,
      lines: {
        under: [
          "You're gonna need a bigger budget.",
          'That might get you a shed.',
          'Wrong neighborhood pal.',
        ],
        over: [
          'The seller would like a word.',
          "We're in the ballpark... just not this one.",
          'That is... ambitious.',
        ],
      },
    },
    {
      emoji: '🚫',
      maxPct: 100,
      lines: {
        under: [
          "That wasn't a guess, that was a wish.",
          'Great price-for the driveway.',
          "You're shopping in a different decade.",
          'That comes with... just the mailbox.',
          'You found the before price.',
          'Even the ghosts said no.',
          'Was that before the renovation... in 1982?',
        ],
        over: [
          'Bold strategy. Very bold.',
          'Close! If we ignore reality.',
          'You paid for the whole block.',
          'That offer might scare the comps.',
          'The seller accepts your generosity.',
        ],
      },
    },
    {
      emoji: '💀',
      maxPct: Infinity,
      lines: {
        under: [
          'Did you guess that in 1995?',
          '"Back in my day you could buy a house for a nickel!"',
          "This isn't your grandma's housing market.",
          'The bank laughed harder than we did.',
          'You just invented affordable housing.',
          'Inflation would like a word.',
          'Try adding a zero. Maybe two.',
          'Have you seen the market lately?',
        ],
        over: [
          'Respectfully... what?',
          "Okay Meemaw let's get you to bed now",
          'You just set a neighborhood record.',
          'That bid comes with a yacht, right?',
          'The seller is printing this offer out.',
          'You bought the house and three imaginary additions.',
        ],
      },
    },
  ];
  const achievementDefinitions = [
    { id: 'round_4500_no_hints', name: 'No-Help Heater', description: 'Score over 4,500 in a round without using hints.', icon: '🔥' },
    { id: 'no_hints_game', name: 'No Hints Please!', description: 'Finish a full game without using a single hint.', icon: '🚫' },
    { id: 'all_hints_round', name: 'Just Guess Bro', description: 'Use every available hint in a single round.', icon: '🕵️' },
    { id: 'game_15000', name: '15K Club', description: 'Score 15,000 or more in a single game.', icon: '⭐' },
    { id: 'game_20000', name: '20K Club', description: 'Score 20,000 or more in a single game.', icon: '🏆' },
    { id: 'exact_price', name: 'Bullseye', description: 'Guess a listing price exactly right.', icon: '🎯' },
    { id: 'all_bronze', name: 'All Bronze States', description: 'Earn at least bronze in every state challenge.', icon: '🥉' },
    { id: 'all_silver', name: 'All Silver States', description: 'Earn at least silver in every state challenge.', icon: '🥈' },
    { id: 'all_gold', name: 'All Gold States', description: 'Earn gold in every state challenge.', icon: '🥇' },
  ];
  const hintConfig = {
    location: { cost: 500, requires: () => true },
    photos: { cost: 250, requires: (round) => Array.isArray(round.extraPhotos) && round.extraPhotos.length > 0 },
    details: { cost: 250, requires: () => true },
    yearBuilt: { cost: 50, requires: (round) => Boolean(round.yearBuilt) },
    daysOnMarket: { cost: 50, requires: (round) => Boolean(round.daysOnMarketText || Number.isFinite(round.daysOnMarket)) },
  };

  const $ = (sel) => document.querySelector(sel);
  const screens = {
    start: $('#start-screen'),
    game: $('#game-screen'),
    gameover: $('#gameover-screen'),
    leaderboard: $('#leaderboard-screen'),
  };
  const els = {
    appNotice: $('#app-notice'),
    btnStart: $('#btn-start'),
    btnStateStart: $('#btn-state-start'),
    btnHome: $('#btn-home'),
    logoImage: $('.logo img'),
    btnSettings: $('#btn-settings'),
    btnSettingsClose: $('#btn-settings-close'),
    settingsOverlay: $('#settings-overlay'),
    toggleNightMode: $('#toggle-night-mode'),
    toggleMusic: $('#toggle-music'),
    bgMusic: $('#bg-music'),
    stateProgressGrid: $('#state-progress-grid'),
    btnGuess: $('#btn-guess'),
    btnNext: $('#btn-next'),
    btnPlayAgain: $('#btn-play-again'),
    btnNewGameOver: $('#btn-new-game-over'),
    btnViewLeaderboard: $('#btn-view-leaderboard'),
    btnFooterShareText: $('#btn-footer-share-text'),
    btnFooterShareInstagram: $('#btn-footer-share-instagram'),
    btnFooterShareX: $('#btn-footer-share-x'),
    btnFooterShareFacebook: $('#btn-footer-share-facebook'),
    btnSaveScore: $('#btn-save-score'),
    btnMap: $('#btn-map'),
    btnRedfin: $('#btn-redfin'),
    guessInput: $('#guess-input'),
    currentScore: $('#current-score'),
    roundDots: $('#round-dots'),
    modeLabel: $('#mode-label'),
    roundLabel: $('#round-label'),
    stateStatus: $('#state-status'),
    mainPhoto: $('#main-photo'),
    photoLoading: $('#photo-loading'),
    photoCounter: $('#photo-counter'),
    photoPrev: $('#photo-prev'),
    photoNext: $('#photo-next'),
    resultOverlay: $('#result-overlay'),
    resultCard: $('#result-card'),
    resultEmoji: $('#result-emoji'),
    resultTitle: $('#result-title'),
    resultLocation: $('#result-location'),
    resultActual: $('#result-actual'),
    resultGuess: $('#result-guess'),
    resultAccuracy: $('#result-accuracy'),
    resultHints: $('#result-hints'),
    resultPoints: $('#result-points'),
    resultDetailsInfo: $('#result-details-info'),
    gameoverTitle: $('#gameover-screen h2'),
    finalScore: $('#final-score'),
    finalScoreLabel: $('.final-score-label'),
    stateMedal: $('#state-medal'),
    roundSummary: $('#round-summary'),
    nameInput: $('#name-input'),
    nameInputGroup: $('.name-input-group'),
    leaderboardTable: $('#leaderboard-table'),
  };

  function formatPrice(num) {
    return '$' + num.toLocaleString('en-US');
  }

  function getLocalityLabel(round) {
    return round.state === 'DC' && round.neighborhood ? round.neighborhood : round.city;
  }

  function getLocationHintLabel(round) {
    return `${getLocalityLabel(round)}, ${round.state}`;
  }

  function getResultLocationLabel(round) {
    return `${round.address}, ${getLocalityLabel(round)}, ${round.state}`;
  }

  function buildMapsUrl(round) {
    const query = encodeURIComponent(`${round.address}, ${round.city}, ${round.state}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  function getShareUrl() {
    if (window.location.protocol === 'file:') return 'https://example.com';
    return window.location.href;
  }

  function getInviteShareText() {
    return `Think you know the housing market? Try Realty Roulette: guess the asking price of real homes for sale. ${getShareUrl()}`;
  }

  function buildSmsUrl(message) {
    return `sms:?&body=${encodeURIComponent(message)}`;
  }

  function openShareWindow(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function normalizeExternalUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    try {
      return new URL(trimmed, window.location.href).href;
    } catch (e) {
      return '';
    }
  }

  function setExternalLink(el, url) {
    if (!el) return;
    const normalized = normalizeExternalUrl(url);
    if (!normalized) {
      el.href = '#';
      el.hidden = true;
      el.onclick = null;
      return;
    }
    el.hidden = false;
    el.href = normalized;
    el.onclick = (event) => {
      event.stopPropagation();
      window.open(normalized, '_blank', 'noopener,noreferrer');
    };
  }

  function shouldAutofocusGuessInput() {
    return !window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  }

  function formatGuessInput(val) {
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('en-US');
  }

  function shuffleArray(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function parseGuess(val) {
    return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
  }

  function calculateScore(guess, actual) {
    if (actual === 0) return 0;
    const pctError = Math.abs(guess - actual) / actual;
    const raw = Math.max(0, 5000 * (1 - Math.pow(pctError, 0.68) * 0.88));
    return Math.round(raw);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(settingsStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        nightMode: Boolean(parsed?.nightMode),
        musicEnabled: Boolean(parsed?.musicEnabled),
      };
    } catch (e) {
      return { nightMode: false, musicEnabled: false };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    } catch (e) {}
  }

  function isNearWhitePixel(data, index) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return a > 0 && min >= 238 && max >= 245 && (max - min) <= 18;
  }

  async function makeLogoTransparent() {
    if (!els.logoImage || els.logoImage.dataset.cleaned === 'true') return;
    const source = els.logoImage.getAttribute('src');
    if (!source) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = source;

    try {
      if (img.decode) {
        await img.decode();
      } else if (!img.complete) {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;
      const visited = new Uint8Array(width * height);
      const queue = [];

      const enqueue = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const pixelIndex = y * width + x;
        if (visited[pixelIndex]) return;
        visited[pixelIndex] = 1;
        queue.push(pixelIndex);
      };

      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0);
        enqueue(x, height - 1);
      }
      for (let y = 0; y < height; y += 1) {
        enqueue(0, y);
        enqueue(width - 1, y);
      }

      while (queue.length) {
        const pixelIndex = queue.shift();
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const dataIndex = pixelIndex * 4;

        if (!isNearWhitePixel(data, dataIndex)) continue;

        data[dataIndex + 3] = 0;
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
      }

      ctx.putImageData(imageData, 0, 0);
      els.logoImage.src = canvas.toDataURL('image/png');
      els.logoImage.dataset.cleaned = 'true';
      els.logoImage.alt = 'Realty Roulette logo';
    } catch (e) {}
  }

  function applyNightMode(enabled) {
    const shouldEnable = SETTINGS_ENABLED && enabled;
    document.documentElement.dataset.theme = shouldEnable ? 'night' : 'day';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', shouldEnable ? '#0d131d' : '#fafaf8');
    if (els.toggleNightMode) els.toggleNightMode.checked = shouldEnable;
  }

  async function syncMusicPlayback() {
    if (!els.bgMusic) return;
    const settings = loadSettings();
    const musicEnabled = SETTINGS_ENABLED && settings.musicEnabled;
    if (els.toggleMusic) els.toggleMusic.checked = musicEnabled;
    if (!musicEnabled) {
      els.bgMusic.pause();
      els.bgMusic.currentTime = 0;
      return;
    }
    try {
      await els.bgMusic.play();
    } catch (e) {}
  }

  function openSettings() {
    if (!els.settingsOverlay) return;
    els.settingsOverlay.classList.add('active');
    els.settingsOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    if (!els.settingsOverlay) return;
    els.settingsOverlay.classList.remove('active');
    els.settingsOverlay.setAttribute('aria-hidden', 'true');
  }

  function getQuipBucket(pctOff) {
    return quipBuckets.find((bucket) => pctOff <= bucket.maxPct) || quipBuckets[quipBuckets.length - 1];
  }

  function getQuipDirection(guess, actual) {
    if (guess < actual) return 'under';
    if (guess > actual) return 'over';
    return 'any';
  }

  function getQuipLines(bucket, direction) {
    if (Array.isArray(bucket.lines)) return bucket.lines;
    return bucket.lines[direction] || bucket.lines.any || bucket.lines.under || bucket.lines.over || [];
  }

  function pickQuip(pctOff, guess, actual) {
    const bucket = getQuipBucket(pctOff);
    const direction = getQuipDirection(guess, actual);
    const poolKey = `${bucket.emoji}:${direction}`;
    const lines = getQuipLines(bucket, direction);
    const used = new Set(usedQuips[poolKey] || []);
    let available = lines.filter((line) => !used.has(line));
    if (available.length === 0) {
      available = lines.slice();
      used.clear();
    }
    const line = available[Math.floor(Math.random() * available.length)];
    used.add(line);
    usedQuips[poolKey] = Array.from(used);
    return { emoji: bucket.emoji, line };
  }

  function getMedal(score) {
    if (score >= 15000) return 'gold';
    if (score >= 10000) return 'silver';
    if (score >= 5000) return 'bronze';
    return 'none';
  }

  function showScreen(name) {
    Object.values(screens).filter(Boolean).forEach((s) => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }

  function maybeGoHome() {
    const inGame =
      screens.game.classList.contains('active') || (
        screens.gameover.classList.contains('active') &&
        currentRound > 0
      );
    if (inGame) {
      const confirmed = window.confirm('Go back to the home page? You will lose your current game progress.');
      if (!confirmed) return;
    }
    updateStartScreenStatus();
    renderUnlockedAchievements('#gameover-achievements', []);
    closeSettings();
    showScreen('start');
  }

  function setAppNotice(message, type = 'info') {
    if (!els.appNotice) return;
    if (!message) {
      els.appNotice.textContent = '';
      els.appNotice.className = 'app-notice';
      return;
    }
    els.appNotice.textContent = message;
    els.appNotice.className = `app-notice active ${type}`;
  }

  function getNationalGames() {
    return gameData?.games || [];
  }

  function getStateGames() {
    return gameData?.stateGames || [];
  }

  function getCurrentGame() {
    return currentMode === 'state' ? getStateGames()[currentGameIndex] : getNationalGames()[currentGameIndex];
  }

  function loadNationalProgress() {
    try {
      const raw = localStorage.getItem(nationalPlayedStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.played) || parsed.totalGames !== getNationalGames().length) return [];
      return parsed.played.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < getNationalGames().length);
    } catch (e) {
      return [];
    }
  }

  function saveNationalProgress(played) {
    try {
      localStorage.setItem(
        nationalPlayedStorageKey,
        JSON.stringify({ totalGames: getNationalGames().length, played })
      );
    } catch (e) {}
  }

  function loadStateProgress() {
    try {
      const raw = localStorage.getItem(stateChallengeStorageKey);
      if (!raw) return { played: [], medals: {} };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.played) || typeof parsed?.medals !== 'object') {
        return { played: [], medals: {} };
      }
      return {
        played: parsed.played.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < getStateGames().length),
        medals: parsed.medals || {},
      };
    } catch (e) {
      return { played: [], medals: {} };
    }
  }

  function loadSelectedState() {
    try {
      return localStorage.getItem(selectedStateStorageKey) || '';
    } catch (e) {
      return '';
    }
  }

  function saveSelectedState(stateCode) {
    try {
      localStorage.setItem(selectedStateStorageKey, stateCode);
    } catch (e) {}
  }

  function saveStateProgress(progress) {
    try {
      localStorage.setItem(stateChallengeStorageKey, JSON.stringify(progress));
    } catch (e) {}
  }

  function loadAchievements() {
    try {
      const raw = localStorage.getItem(achievementStorageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveAchievements(achievements) {
    try {
      localStorage.setItem(achievementStorageKey, JSON.stringify(achievements));
    } catch (e) {}
  }

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(leaderboardStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => entry && typeof entry.name === 'string' && Number.isFinite(entry.score))
        .slice(0, 50);
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard() {
    try {
      localStorage.setItem(leaderboardStorageKey, JSON.stringify(leaderboard.slice(0, 50)));
    } catch (e) {}
  }

  function unlockAchievements(ids) {
    const achievements = loadAchievements();
    const unlockedNow = [];
    ids.forEach((id) => {
      if (!id || achievements[id]) return;
      achievements[id] = new Date().toISOString();
      unlockedNow.push(id);
    });
    if (unlockedNow.length > 0) {
      saveAchievements(achievements);
      newlyUnlockedAchievements = newlyUnlockedAchievements.concat(unlockedNow);
      renderAchievements();
    }
    return unlockedNow;
  }

  function getAchievementLabel(id) {
    const match = achievementDefinitions.find((item) => item.id === id);
    return match ? match.name : id;
  }

  function renderAchievements() {
    const container = $('#achievement-list');
    const counter = $('#achievement-count');
    if (!container || !counter) return;

    const achievements = loadAchievements();
    const unlockedCount = achievementDefinitions.filter((item) => Boolean(achievements[item.id])).length;
    counter.textContent = `${unlockedCount} / ${achievementDefinitions.length} unlocked`;

    container.innerHTML = '';
    achievementDefinitions.forEach((item) => {
      const icon = item.icon || '★';
      const row = document.createElement('div');
      row.className = `achievement-item${achievements[item.id] ? ' unlocked' : ''}`;
      row.innerHTML = `
        <div class="achievement-icon" aria-hidden="true">${icon}</div>
        <div class="achievement-copy">
          <div class="achievement-name">${escapeHtml(item.name)}</div>
          <div class="achievement-description">${escapeHtml(item.description)}</div>
        </div>
        <div class="achievement-icon achievement-icon-mirror" aria-hidden="true">${icon}</div>
      `;
      container.appendChild(row);
    });
  }

  function renderUnlockedAchievements(targetSelector, ids) {
    const el = $(targetSelector);
    if (!el) return;
    if (!ids || ids.length === 0) {
      el.innerHTML = '';
      el.classList.remove('active');
      return;
    }
    el.innerHTML = ids
      .map((id) => `<div class="achievement-chip">Unlocked: ${escapeHtml(getAchievementLabel(id))}</div>`)
      .join('');
    el.classList.add('active');
  }

  function evaluateStateAchievementProgress(progress) {
    const medals = getStateGames().map((entry) => progress.medals[entry.state] || 'none');
    const unlocks = [];
    if (medals.length === 0) return unlocks;
    if (medals.every((medal) => medalRank[medal] >= medalRank.bronze)) unlocks.push('all_bronze');
    if (medals.every((medal) => medalRank[medal] >= medalRank.silver)) unlocks.push('all_silver');
    if (medals.every((medal) => medalRank[medal] >= medalRank.gold)) unlocks.push('all_gold');
    return unlocks;
  }

  function getMedalSymbol(medal) {
    if (medal === 'gold') return '★';
    if (medal === 'silver') return '★';
    if (medal === 'bronze') return '★';
    return '•';
  }

  function getSelectedStateGameIndex() {
    const selected = loadSelectedState();
    return getStateGames().findIndex((game) => game.state === selected);
  }

  function renderStatePicker() {
    if (!els.stateProgressGrid) return;
    const games = getStateGames();
    const progress = loadStateProgress();
    const selectedState = loadSelectedState();
    const playedStates = new Set(
      (progress.played || [])
        .map((idx) => games[idx]?.state)
        .filter(Boolean)
    );
    const firstAvailableState = games.find((game) => !playedStates.has(game.state))?.state || '';

    const selectedIsAvailable = games.some((game) => game.state === selectedState && !playedStates.has(game.state));
    const activeState = selectedIsAvailable ? selectedState : firstAvailableState;

    els.stateProgressGrid.innerHTML = '';
    games
      .slice()
      .sort((a, b) => a.state.localeCompare(b.state))
      .forEach((game) => {
      const medal = progress.medals[game.state] || 'none';
      const isPlayed = playedStates.has(game.state);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `state-progress-chip ${medal}${isPlayed && medal === 'none' ? ' failed' : ''}${activeState === game.state ? ' active' : ''}${isPlayed ? ' completed' : ''}`;
      chip.disabled = isPlayed;
      chip.innerHTML = `
        <span class="state-progress-code">${game.state}</span>
        <span class="state-progress-star ${medal}">${getMedalSymbol(medal)}</span>
      `;
      chip.title = `${game.name}${medal !== 'none' ? ` • ${medal} medal` : ''}${isPlayed ? ' • completed' : ''}`;
      chip.addEventListener('click', () => {
        if (isPlayed) return;
        saveSelectedState(game.state);
        renderStatePicker();
      });
      els.stateProgressGrid.appendChild(chip);
    });

    els.btnStateStart.disabled = !firstAvailableState || !activeState;
    els.btnStateStart.textContent = firstAvailableState ? 'Play Selected State' : 'All State Challenges Complete';
  }

  function updateStartScreenStatus() {
    const stateStatus = els.stateStatus;
    if (!stateStatus) return;
    if (getStateGames().length === 0) {
      stateStatus.textContent = 'State challenge data is still being prepared.';
      els.btnStateStart.disabled = true;
      return;
    }
    const progress = loadStateProgress();
    const clearedCount = (progress.played || []).length;
    const medals = Object.values(progress.medals).filter((medal) => medal !== 'none');
    const gold = medals.filter((m) => m === 'gold').length;
    const silver = medals.filter((m) => m === 'silver').length;
    const bronze = medals.filter((m) => m === 'bronze').length;
    stateStatus.innerHTML = `${clearedCount} / ${getStateGames().length || 50} state challenges completed<br>${gold} gold • ${silver} silver • ${bronze} bronze`;
    renderStatePicker();
    renderAchievements();
  }

  function chooseRandomIndex(total, played) {
    if (total <= 0) {
      return { nextIndex: -1, played: [] };
    }
    let pool = played.slice();
    if (pool.length >= total) {
      pool = [];
    }
    const used = new Set(pool);
    const available = [];
    for (let i = 0; i < total; i++) {
      if (!used.has(i)) available.push(i);
    }
    return { nextIndex: available[Math.floor(Math.random() * available.length)], played: pool };
  }

  function chooseRandomNationalGameIndex() {
    const stored = loadNationalProgress();
    const { nextIndex, played } = chooseRandomIndex(getNationalGames().length, stored);
    played.push(nextIndex);
    saveNationalProgress(played);
    return nextIndex;
  }

  function updateModeHud(game) {
    els.modeLabel.textContent = currentMode === 'state' ? `${game.name} Challenge` : 'National Game';
    els.roundLabel.textContent = `Round ${currentRound + 1} of ${game.rounds.length}`;
  }

  async function init() {
    leaderboard = loadLeaderboard();
    const settings = loadSettings();
    applyNightMode(settings.nightMode);
    if (els.toggleMusic) els.toggleMusic.checked = SETTINGS_ENABLED && settings.musicEnabled;
    if (els.btnSettings) els.btnSettings.hidden = !SETTINGS_ENABLED;
    await makeLogoTransparent();
    try {
      const resp = await fetch('./gameData.json');
      if (!resp.ok) {
        throw new Error(`Request failed: ${resp.status}`);
      }
      gameData = await resp.json();
      if (!Array.isArray(gameData?.games) || !Array.isArray(gameData?.stateGames)) {
        throw new Error('Invalid game data shape');
      }
      setAppNotice('');
      updateStartScreenStatus();
      renderAchievements();
      bindEvents();
    } catch (e) {
      setAppNotice('We could not load the listings right now. Refresh to try again.', 'error');
      els.btnStart.disabled = true;
      els.btnStateStart.disabled = true;
    }
  }

  function bindEvents() {
    els.btnStart.addEventListener('click', startNationalGame);
    els.btnStateStart.addEventListener('click', startStateGame);
    els.btnHome.addEventListener('click', maybeGoHome);
    if (SETTINGS_ENABLED) {
      els.btnSettings.addEventListener('click', openSettings);
      els.btnSettingsClose.addEventListener('click', closeSettings);
      els.settingsOverlay.addEventListener('click', (e) => {
        if (e.target === els.settingsOverlay) closeSettings();
      });
      els.toggleNightMode.addEventListener('change', (e) => {
        const settings = loadSettings();
        settings.nightMode = e.target.checked;
        saveSettings(settings);
        applyNightMode(settings.nightMode);
      });
      els.toggleMusic.addEventListener('change', async (e) => {
        const settings = loadSettings();
        settings.musicEnabled = e.target.checked;
        saveSettings(settings);
        await syncMusicPlayback();
      });
    }
    els.btnGuess.addEventListener('click', submitGuess);
    els.btnNext.addEventListener('click', nextRound);
    els.btnNewGameOver.addEventListener('click', () => {
      if (currentMode === 'state') {
        startStateGame();
      } else {
        startNationalGame();
      }
    });
    els.btnPlayAgain.addEventListener('click', () => {
      maybeGoHome();
    });
    els.btnViewLeaderboard.addEventListener('click', showLeaderboard);
    els.btnFooterShareText.addEventListener('click', () => {
      openShareWindow(buildSmsUrl(getInviteShareText()));
    });
    els.btnFooterShareX.addEventListener('click', () => {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getInviteShareText())}`;
      openShareWindow(shareUrl);
    });
    els.btnFooterShareFacebook.addEventListener('click', () => {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(getInviteShareText())}`;
      openShareWindow(shareUrl);
    });
    els.btnFooterShareInstagram.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(getInviteShareText());
        window.alert('Game link copied. Paste it into your Instagram post or story.');
      } catch (e) {}
      openShareWindow('https://www.instagram.com/');
    });
    $('#btn-lb-back').addEventListener('click', maybeGoHome);
    els.btnSaveScore.addEventListener('click', saveScore);

    els.guessInput.addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      const oldLen = e.target.value.length;
      e.target.value = formatGuessInput(e.target.value);
      const newLen = e.target.value.length;
      e.target.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
    });

    els.guessInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitGuess();
    });

    $('#hint-location').addEventListener('click', () => revealHint('location'));
    $('#hint-photos').addEventListener('click', () => revealHint('photos'));
    $('#hint-details').addEventListener('click', () => revealHint('details'));
    $('#hint-yearBuilt').addEventListener('click', () => revealHint('yearBuilt'));
    $('#hint-daysOnMarket').addEventListener('click', () => revealHint('daysOnMarket'));

    els.photoPrev.addEventListener('click', () => changePhoto(-1));
    els.photoNext.addEventListener('click', () => changePhoto(1));
  }

  function startNationalGame() {
    syncMusicPlayback();
    currentMode = 'national';
    currentGameIndex = chooseRandomNationalGameIndex();
    if (currentGameIndex < 0) return;
    currentRound = 0;
    totalScore = 0;
    gameHintUsed = false;
    roundScores = [];
    usedQuips = {};
    showScreen('game');
    loadRound();
  }

  function startStateGame() {
    syncMusicPlayback();
    currentMode = 'state';
    currentGameIndex = getSelectedStateGameIndex();
    if (currentGameIndex < 0) return;
    const progress = loadStateProgress();
    if ((progress.played || []).includes(currentGameIndex)) {
      updateStartScreenStatus();
      return;
    }
    currentRound = 0;
    totalScore = 0;
    gameHintUsed = false;
    roundScores = [];
    usedQuips = {};
    showScreen('game');
    loadRound();
  }

  function preloadNextRoundPhoto() {
    const game = getCurrentGame();
    const next = game?.rounds?.[currentRound + 1];
    if (!next?.mainPhoto) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = next.mainPhoto;
  }

  function loadRound() {
    const game = getCurrentGame();
    if (!game || !Array.isArray(game.rounds) || !game.rounds[currentRound]) {
      setAppNotice('This game could not be loaded. Please start a new game.', 'error');
      showScreen('start');
      return;
    }
    const round = game.rounds[currentRound];

    roundLocked = false;
    hintCount = 0;
    hintPenaltyTotal = 0;
    hintsRevealed = Object.fromEntries(Object.keys(hintConfig).map((key) => [key, false]));
    visiblePhotos = [round.mainPhoto];
    currentPhotoIndex = 0;
    newlyUnlockedAchievements = [];

    updateModeHud(game);
    updateRoundDots();
    els.currentScore.textContent = totalScore.toLocaleString();
    els.btnGuess.disabled = false;

    Object.keys(hintConfig).forEach((h) => {
      const btn = $(`#hint-${h}`);
      btn.classList.remove('used');
      const available = hintConfig[h].requires(round);
      btn.disabled = !available;
      btn.hidden = !available;
      const existingVal = btn.querySelector('.hint-value');
      if (existingVal) existingVal.remove();
      const cost = btn.querySelector('.hint-cost');
      if (cost) cost.style.display = '';
    });

    loadPhoto(round.mainPhoto);
    updatePhotoNav();
    els.guessInput.value = '';
    if (shouldAutofocusGuessInput()) {
      els.guessInput.focus();
    } else {
      els.guessInput.blur();
    }
    els.resultOverlay.classList.remove('active');
    renderUnlockedAchievements('#achievement-unlocked', []);
    renderUnlockedAchievements('#gameover-achievements', []);
    preloadNextRoundPhoto();
  }

  function updateRoundDots() {
    const game = getCurrentGame();
    const dotsEl = els.roundDots;
    dotsEl.innerHTML = '';
    for (let i = 0; i < game.rounds.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'round-dot';
      if (i < currentRound) dot.classList.add('completed');
      if (i === currentRound) dot.classList.add('current');
      dotsEl.appendChild(dot);
    }
  }

  function loadPhoto(url) {
    const img = els.mainPhoto;
    img.classList.add('loading');
    if (els.photoLoading) els.photoLoading.classList.add('active');
    img.onload = () => {
      img.classList.remove('loading');
      if (els.photoLoading) els.photoLoading.classList.remove('active');
    };
    img.onerror = () => {
      img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" fill="%23f4f3f0"><rect width="800" height="500"/><text x="400" y="250" text-anchor="middle" fill="%23a0a0a0" font-size="18" font-family="sans-serif">Photo unavailable</text></svg>');
      img.classList.remove('loading');
      if (els.photoLoading) els.photoLoading.classList.remove('active');
    };
    img.src = url;
  }

  function updatePhotoNav() {
    const counter = els.photoCounter;
    counter.textContent = `${currentPhotoIndex + 1} / ${visiblePhotos.length}`;
    els.photoPrev.style.display = visiblePhotos.length > 1 ? '' : 'none';
    els.photoNext.style.display = visiblePhotos.length > 1 ? '' : 'none';
  }

  function changePhoto(dir) {
    currentPhotoIndex = (currentPhotoIndex + dir + visiblePhotos.length) % visiblePhotos.length;
    loadPhoto(visiblePhotos[currentPhotoIndex]);
    updatePhotoNav();
  }

  function revealHint(type) {
    if (hintsRevealed[type]) return;
    const round = getCurrentGame().rounds[currentRound];
    if (!hintConfig[type].requires(round)) return;
    hintsRevealed[type] = true;
    hintCount++;
    gameHintUsed = true;
    hintPenaltyTotal += hintConfig[type].cost;
    const btn = $(`#hint-${type}`);
    btn.classList.add('used');
    btn.disabled = true;

    const cost = btn.querySelector('.hint-cost');
    if (cost) cost.style.display = 'none';

    if (type === 'location') {
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = getLocationHintLabel(round);
      btn.appendChild(val);
    } else if (type === 'photos') {
      visiblePhotos = [round.mainPhoto, ...shuffleArray(round.extraPhotos)];
      currentPhotoIndex = 0;
      updatePhotoNav();
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = `${visiblePhotos.length} photos`;
      btn.appendChild(val);
    } else if (type === 'details') {
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = `${round.beds} bed / ${round.baths} bath / ${Number(round.sqft).toLocaleString()} sqft`;
      btn.appendChild(val);
    } else if (type === 'yearBuilt') {
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = `${round.yearBuilt}`;
      btn.appendChild(val);
    } else if (type === 'daysOnMarket') {
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = round.daysOnMarketText || `${round.daysOnMarket} days`;
      btn.appendChild(val);
    }
  }

  function submitGuess() {
    if (roundLocked) return;
    const input = els.guessInput;
    const guess = parseGuess(input.value);
    if (guess <= 0) {
      input.style.borderColor = 'var(--color-error)';
      setTimeout(() => (input.style.borderColor = ''), 1000);
      return;
    }

    const round = getCurrentGame().rounds[currentRound];
    roundLocked = true;
    els.btnGuess.disabled = true;
    const actual = round.price;
    const baseScore = calculateScore(guess, actual);
    const roundPoints = Math.max(0, baseScore - hintPenaltyTotal);
    const pctOff = (Math.abs(guess - actual) / actual) * 100;

    totalScore += roundPoints;
    roundScores.push({
      guess,
      actual,
      points: roundPoints,
      city: round.city,
      state: round.state,
    });

    const roundUnlocks = [];
    if (guess === actual) roundUnlocks.push('exact_price');
    if (hintCount === 0 && roundPoints > 4500) roundUnlocks.push('round_4500_no_hints');
    const availableHints = Object.keys(hintConfig).filter((key) => hintConfig[key].requires(round));
    if (availableHints.length > 0 && availableHints.every((key) => hintsRevealed[key])) {
      roundUnlocks.push('all_hints_round');
    }
    unlockAchievements(roundUnlocks);

    showResult(guess, actual, roundPoints, pctOff);
    revealHintPostAnswer('location');
    revealHintPostAnswer('details');
  }

  function revealHintPostAnswer(type) {
    if (hintsRevealed[type]) return;
    hintsRevealed[type] = true;

    const round = getCurrentGame().rounds[currentRound];
    const btn = $(`#hint-${type}`);
    btn.classList.add('used');
    btn.disabled = true;

    const cost = btn.querySelector('.hint-cost');
    if (cost) cost.style.display = 'none';

    if (type === 'location') {
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = getLocationHintLabel(round);
      btn.appendChild(val);
    } else if (type === 'details') {
      const val = document.createElement('span');
      val.className = 'hint-value';
      val.textContent = `${round.beds} bed / ${round.baths} bath / ${Number(round.sqft).toLocaleString()} sqft`;
      btn.appendChild(val);
    }
  }

  function showResult(guess, actual, points, pctOff) {
    const round = getCurrentGame().rounds[currentRound];
    const { emoji, line } = pickQuip(pctOff, guess, actual);
    let pointsClass;
    if (points >= 4000) {
      pointsClass = 'great';
    } else if (points >= 1500) {
      pointsClass = 'good';
    } else {
      pointsClass = 'poor';
    }

    els.resultEmoji.textContent = emoji;
    els.resultTitle.textContent = line;
    els.resultLocation.textContent = getResultLocationLabel(round);
    setExternalLink(els.btnMap, buildMapsUrl(round));
    setExternalLink(els.btnRedfin, round.sourceUrl);
    els.resultActual.textContent = formatPrice(actual);
    els.resultGuess.textContent = formatPrice(guess);
    els.resultAccuracy.textContent = `${pctOff.toFixed(1)}% off`;
    els.resultHints.textContent = hintCount > 0 ? `${hintCount} (-${hintPenaltyTotal} pts)` : 'None';
    els.resultDetailsInfo.textContent = `${round.beds} bed / ${round.baths} bath / ${Number(round.sqft).toLocaleString()} sqft`;

    const pointsEl = els.resultPoints;
    pointsEl.textContent = `+${points.toLocaleString()} pts`;
    pointsEl.className = `result-points ${pointsClass}`;

    const game = getCurrentGame();
    const isLastRound = currentRound >= game.rounds.length - 1;
    els.btnNext.textContent = isLastRound ? 'See Results' : 'Next Round';

    els.resultOverlay.classList.add('active');
    els.resultCard.classList.add('animate-bounce-in');
    renderUnlockedAchievements('#achievement-unlocked', newlyUnlockedAchievements);
    setTimeout(() => els.resultCard.classList.remove('animate-bounce-in'), 500);
  }

  function nextRound() {
    currentRound++;
    if (currentRound >= getCurrentGame().rounds.length) {
      showGameOver();
    } else {
      loadRound();
    }
  }

  function awardStateMedal(game, score) {
    if (currentMode !== 'state') return;
    const progress = loadStateProgress();
    const medal = getMedal(score);
    const existing = progress.medals[game.state] || 'none';
    progress.played = Array.from(new Set((progress.played || []).concat(currentGameIndex)));
    if (medalRank[medal] > medalRank[existing]) {
      progress.medals[game.state] = medal;
    }
    saveStateProgress(progress);
    unlockAchievements(evaluateStateAchievementProgress(progress));
  }

  function showGameOver() {
    const game = getCurrentGame();
    showScreen('gameover');
    els.resultOverlay.classList.remove('active');

    els.finalScore.textContent = '0';
    animateNumber(els.finalScore, totalScore, 1000);
    els.gameoverTitle.textContent = currentMode === 'state' ? `${game.name} Complete` : 'Game Over';
    els.btnPlayAgain.textContent = 'Back to Home';

    const medalEl = els.stateMedal;
    medalEl.className = 'state-medal';
    let medal = 'none';
    if (currentMode === 'state') {
      medal = getMedal(totalScore);
      awardStateMedal(game, totalScore);
      medalEl.classList.add(medal);
      medalEl.textContent = medal === 'none' ? 'No medal this time' : `${medal[0].toUpperCase()}${medal.slice(1)} medal`;
      els.finalScoreLabel.textContent = `${game.name} challenge total`;
      els.nameInputGroup.style.display = 'none';
      els.btnViewLeaderboard.style.display = 'none';
      els.btnNewGameOver.style.display = 'none';
    } else {
      medalEl.textContent = '';
      els.finalScoreLabel.textContent = 'out of 25,000 possible points';
      els.nameInputGroup.style.display = '';
      els.btnViewLeaderboard.style.display = '';
      els.btnSaveScore.disabled = false;
      els.btnSaveScore.textContent = 'Save Score';
      els.btnNewGameOver.style.display = '';
      els.btnNewGameOver.textContent = 'New Game';
    }

    const gameUnlocks = [];
    if (totalScore >= 20000) gameUnlocks.push('game_20000');
    if (totalScore >= 15000) gameUnlocks.push('game_15000');
    if (!gameHintUsed) gameUnlocks.push('no_hints_game');
    unlockAchievements(gameUnlocks);
    renderUnlockedAchievements('#gameover-achievements', newlyUnlockedAchievements);

    const summary = els.roundSummary;
    summary.innerHTML = '';
    roundScores.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'round-summary-row';
      row.innerHTML = `
        <span>Round ${i + 1}</span>
        <span class="city">${r.city}, ${r.state}</span>
        <span class="pts">${r.points.toLocaleString()} pts</span>
      `;
      summary.appendChild(row);
    });

    els.nameInput.value = '';
    updateStartScreenStatus();
  }

  function animateNumber(el, target, duration) {
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function saveScore() {
    if (currentMode !== 'national') return;
    const name = els.nameInput.value.trim() || 'Anonymous';
    leaderboard.push({
      name,
      score: totalScore,
      gameId: currentGameIndex + 1,
      date: new Date().toISOString(),
    });
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 50) leaderboard.length = 50;
    saveLeaderboard();
    els.btnSaveScore.disabled = true;
    els.btnSaveScore.textContent = 'Saved!';
  }

  function showLeaderboard() {
    showScreen('leaderboard');
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const table = els.leaderboardTable;
    table.innerHTML = '';

    if (leaderboard.length === 0) {
      table.innerHTML = '<div class="lb-empty">No scores yet. Play a national game to get on the board.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'lb-header';
    header.innerHTML = '<span>#</span><span>Player</span><span>Game</span><span style="text-align:right">Score</span>';
    table.appendChild(header);

    leaderboard.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'lb-row';
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      row.innerHTML = `
        <span class="lb-rank ${rankClass}">${i + 1}</span>
        <span class="lb-name">${escapeHtml(entry.name)}</span>
        <span class="lb-game">Game ${entry.gameId}</span>
        <span class="lb-score">${entry.score.toLocaleString()}</span>
      `;
      table.appendChild(row);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  init();
})();
