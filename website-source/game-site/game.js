const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const itemsEl = document.querySelector("#items");
const healthEl = document.querySelector("#health");
const staminaEl = document.querySelector("#stamina");
const statusEl = document.querySelector("#status");
const messageEl = document.querySelector("#message");
const helpStrip = document.querySelector(".help-strip");
const accountGate = document.querySelector("#accountGate");
const accountForm = document.querySelector("#accountForm");
const accountInput = document.querySelector("#accountInput");
const accountError = document.querySelector("#accountError");
const nicknameGate = document.querySelector("#nicknameGate");
const nicknameForm = document.querySelector("#nicknameForm");
const nicknameInput = document.querySelector("#nicknameInput");
const nicknameError = document.querySelector("#nicknameError");
const startEl = document.querySelector("#start");
const startBtn = document.querySelector("#startBtn");
const startText = document.querySelector("#startText");
const levelButtons = [...document.querySelectorAll(".level-button")];
const joystick = document.querySelector("#joystick");
const stick = document.querySelector("#stick");
const phoneButton = document.querySelector("#phoneButton");
const sprintButton = document.querySelector("#sprintButton");
const cloakButton = document.querySelector("#cloakButton");
const examButton = document.querySelector("#examButton");
const drinkButton = document.querySelector("#drinkButton");
const codexButton = document.querySelector("#codexButton");
const codexPanel = document.querySelector("#codexPanel");
const codexClose = document.querySelector("#codexClose");
const leaderboardButton = document.querySelector("#leaderboardButton");
const leaderboardHomeButton = document.querySelector("#leaderboardHomeButton");
const leaderboardStartButton = document.querySelector("#leaderboardStartButton");
const leaderboardPanel = document.querySelector("#leaderboardPanel");
const leaderboardClose = document.querySelector("#leaderboardClose");
const leaderboardList = document.querySelector("#leaderboardList");
const bgmToggle = document.querySelector("#bgmToggle");
const zoomOutButton = document.querySelector("#zoomOutButton");
const zoomInButton = document.querySelector("#zoomInButton");

const WORLD_W = 1280;
const WORLD_H = 720;
const keys = new Set();
const touchKeys = new Set();
const joystickVector = { x: 0, y: 0 };
const teacherImage = new Image();
teacherImage.src = "./assets/teacher.png";
const playerImage = new Image();
playerImage.src = "./assets/htx.png";
const drinkImage = new Image();
drinkImage.src = "./assets/dongpeng.png";

let game;
let lastTime = 0;
let messageTimer = 0;
let scale = 1;
let baseScale = 1;
let viewZoom = Number(localStorage.getItem("labEscapeViewZoom") || "1");
let selectedLevel = 0;
let isPortraitView = false;
let viewOffsetX = 0;
let viewOffsetY = 0;
let currentAccount = "";
let playerSave = null;
let bgmStarted = false;
let bgmEnabled = localStorage.getItem("labEscapeBgm") !== "off";

const bgmAudio = new Audio();
bgmAudio.src = "./assets/kb.mp3";
bgmAudio.preload = "auto";
bgmAudio.volume = 0.78;
bgmAudio.loop = true;
bgmAudio.setAttribute("playsinline", "");
bgmAudio.setAttribute("webkit-playsinline", "");

const ACCOUNT_RE = /^[A-Za-z0-9]{1,10}$/;
const NICKNAME_RE = /^[^\x00-\x1F\x7F<>/\\{}[\]]{1,12}$/u;
const DEFAULT_UNLOCKED_LEVELS = 3;
const MAX_LEVELS = 30;
const MIN_VIEW_ZOOM = 0.62;
const MAX_VIEW_ZOOM = 1.38;
const VIEW_ZOOM_STEP = 0.12;
const RELEASE_VERSION = "v1.8";
const RELEASE_NOTES = [
  "\u5173\u5361\u6269\u5c55\u5230 30 \u5173\uff0c20 \u5173\u4ee5\u540e\u5730\u56fe\u66f4\u5927\u3001\u8001\u5e08\u66f4\u591a\uff0c\u8001\u5e08\u901f\u5ea6\u548c\u89c6\u91ce\u5708\u4e5f\u4f1a\u7ee7\u7eed\u63d0\u9ad8\u3002",
  "\u65b0\u589e\u9053\u5177\uff1a\u4e1c\u9e4f\u7279\u996e\u3002\u7b2c 21 \u5173\u4ee5\u540e\u51fa\u73b0\uff0c\u559d\u4e0b\u540e 5 \u79d2\u5185\u79fb\u901f\u7ffb\u500d\u5e76\u65e0\u654c\uff0c\u649e\u5230\u8001\u5e08\u4f1a\u628a\u8001\u5e08\u51fb\u98de\uff0c\u843d\u5730\u540e\u7729\u6655 3 \u79d2\u3002",
  "\u65b0\u589e\u6392\u884c\u699c\uff1a\u4e3b\u9875\u548c\u6e38\u620f\u5185\u90fd\u53ef\u4ee5\u67e5\u770b\u6240\u6709\u7528\u6237\u8fdb\u5ea6\uff0c\u5173\u5361\u8d8a\u9ad8\u6392\u540d\u8d8a\u9760\u524d\uff0c\u540c\u5173\u5361\u6309\u66f4\u65e9\u901a\u8fc7\u6392\u5e8f\u3002",
  "\u65b0\u589e\u6635\u79f0\u673a\u5236\uff1a\u8d26\u53f7\u53ea\u7528\u6765\u767b\u5f55\u548c\u4fdd\u5b58\u8fdb\u5ea6\uff0c\u6392\u884c\u699c\u53ea\u663e\u793a\u6635\u79f0\u3002\u8001\u7528\u6237\u7b2c\u4e00\u6b21\u8fdb\u5165\u4f1a\u8981\u6c42\u8bbe\u7f6e\u6635\u79f0\uff0c\u539f\u8fdb\u5ea6\u4fdd\u7559\u3002",
];

function getSaveKey(account) {
  return `labEscapeSave:${account}`;
}

function createDefaultSave(account) {
  return {
    account,
    nickname: "",
    unlocked: DEFAULT_UNLOCKED_LEVELS,
    wins: [],
    firstReachedAt: {},
    updatedAt: Date.now(),
  };
}

function sanitizeSave(account, save) {
  const safe = save && typeof save === "object" ? save : createDefaultSave(account);
  const unlocked = Number.isFinite(safe.unlocked) ? safe.unlocked : DEFAULT_UNLOCKED_LEVELS;
  const wins = Array.isArray(safe.wins) ? safe.wins.filter((level) => Number.isInteger(level)) : [];
  const highestUnlockedFromWins = wins.length ? Math.min(levels.length, Math.max(...wins) + 2) : DEFAULT_UNLOCKED_LEVELS;
  return {
    account,
    nickname: typeof safe.nickname === "string" ? safe.nickname.trim() : "",
    unlocked: Math.min(levels.length, Math.max(DEFAULT_UNLOCKED_LEVELS, Math.floor(unlocked), highestUnlockedFromWins)),
    wins,
    firstReachedAt: safe.firstReachedAt && typeof safe.firstReachedAt === "object" ? safe.firstReachedAt : {},
    updatedAt: Number.isFinite(safe.updatedAt) ? safe.updatedAt : Date.now(),
  };
}

async function loadPlayerSave(account) {
  try {
    const response = await fetch(`/game/api/save/${encodeURIComponent(account)}`, { cache: "no-store" });
    if (response.ok) {
      return sanitizeSave(account, await response.json());
    }
  } catch {}
  try {
    return sanitizeSave(account, JSON.parse(localStorage.getItem(getSaveKey(account))));
  } catch {
    return createDefaultSave(account);
  }
}

function persistPlayerSave() {
  if (!currentAccount || !playerSave) return;
  playerSave.updatedAt = Date.now();
  localStorage.setItem(getSaveKey(currentAccount), JSON.stringify(playerSave));
  localStorage.setItem("labEscapeCurrentAccount", currentAccount);
  fetch(`/game/api/save/${encodeURIComponent(currentAccount)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(playerSave),
  }).catch(() => {});
}

async function persistPlayerSaveNow() {
  if (!currentAccount || !playerSave) return false;
  playerSave.updatedAt = Date.now();
  localStorage.setItem(getSaveKey(currentAccount), JSON.stringify(playerSave));
  localStorage.setItem("labEscapeCurrentAccount", currentAccount);
  try {
    const response = await fetch(`/game/api/save/${encodeURIComponent(currentAccount)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playerSave),
    });
    if (response.ok) {
      playerSave = sanitizeSave(currentAccount, await response.json());
      localStorage.setItem(getSaveKey(currentAccount), JSON.stringify(playerSave));
    }
    return response.ok;
  } catch {
    return false;
  }
}

const teacherQuotes = [
  "左脚进门扣五分，右脚进门扣10分，双脚进门扣15，不进门扣100",
  "我以前在企业的时候，你这种小把戏我见多了",
  "扣分扣分",
  "我不管，我发现你了，你扣分",
  "上课玩手机？我在企业的时候一眼就看出来了",
];

const phoneQuotes = ["刷刷抖音", "点外卖了", "好享吃猪脚饭真难吃"];

const boundaryWalls = [
  { x: 0, y: 0, w: WORLD_W, h: 32 },
  { x: 0, y: WORLD_H - 32, w: WORLD_W, h: 32 },
  { x: 0, y: 0, w: 32, h: WORLD_H },
  { x: WORLD_W - 32, y: 0, w: 32, h: WORLD_H },
];

function boundaryFor(width, height) {
  return [
    { x: 0, y: 0, w: width, h: 32 },
    { x: 0, y: height - 32, w: width, h: 32 },
    { x: 0, y: 0, w: 32, h: height },
    { x: width - 32, y: 0, w: 32, h: height },
  ];
}

const mapLayouts = [
  {
    spawn: { x: 92, y: 74 },
    teacherStart: { x: 930, y: 110 },
    walls: [
      { x: 360, y: 62, w: 28, h: 178 }, { x: 360, y: 270, w: 28, h: 48 },
      { x: 788, y: 72, w: 28, h: 132 }, { x: 788, y: 242, w: 28, h: 68 },
      { x: 410, y: 328, w: 28, h: 188 }, { x: 410, y: 566, w: 28, h: 76 },
      { x: 812, y: 348, w: 28, h: 156 }, { x: 812, y: 552, w: 28, h: 64 },
      { x: 166, y: 318, w: 150, h: 24 }, { x: 500, y: 318, w: 154, h: 24 },
      { x: 838, y: 318, w: 98, h: 24 }, { x: 42, y: 612, w: 224, h: 22 },
      { x: 450, y: 612, w: 372, h: 22 }, { x: 970, y: 612, w: 112, h: 22 },
      { x: 230, y: 170, w: 82, h: 24 }, { x: 528, y: 166, w: 110, h: 24 },
      { x: 980, y: 184, w: 88, h: 24 }, { x: 176, y: 486, w: 120, h: 24 },
      { x: 592, y: 500, w: 118, h: 24 },
    ],
    teacherPath: [
      { x: 930, y: 110 }, { x: 1080, y: 150 }, { x: 1120, y: 300 }, { x: 1000, y: 438 },
      { x: 870, y: 520 }, { x: 676, y: 542 }, { x: 520, y: 480 }, { x: 612, y: 274 },
      { x: 460, y: 150 }, { x: 300, y: 142 }, { x: 180, y: 238 }, { x: 144, y: 452 }, { x: 256, y: 540 },
    ],
    cards: [{ x: 300, y: 250 }, { x: 704, y: 200 }, { x: 1090, y: 548 }],
    cloak: { x: 250, y: 410 },
    exam: { x: 570, y: 538 },
  },
  {
    spawn: { x: 86, y: 86 },
    teacherStart: { x: 650, y: 118 },
    walls: [
      { x: 248, y: 96, w: 26, h: 210 }, { x: 248, y: 410, w: 26, h: 210 },
      { x: 506, y: 32, w: 26, h: 188 }, { x: 506, y: 330, w: 26, h: 238 },
      { x: 746, y: 132, w: 26, h: 210 }, { x: 746, y: 452, w: 26, h: 168 },
      { x: 990, y: 68, w: 26, h: 252 }, { x: 990, y: 430, w: 26, h: 168 },
      { x: 92, y: 190, w: 124, h: 24 }, { x: 322, y: 296, w: 124, h: 24 },
      { x: 564, y: 246, w: 132, h: 24 }, { x: 806, y: 372, w: 134, h: 24 },
      { x: 150, y: 548, w: 280, h: 24 }, { x: 560, y: 598, w: 292, h: 24 },
      { x: 1038, y: 210, w: 108, h: 24 },
    ],
    teacherPath: [
      { x: 650, y: 118 }, { x: 880, y: 142 }, { x: 1120, y: 344 }, { x: 880, y: 520 },
      { x: 590, y: 472 }, { x: 346, y: 350 }, { x: 118, y: 520 }, { x: 390, y: 142 },
    ],
    cards: [{ x: 430, y: 126 }, { x: 630, y: 390 }, { x: 920, y: 548 }, { x: 1110, y: 548 }],
    cloak: { x: 1060, y: 112 },
    exam: { x: 190, y: 548 },
  },
  {
    spawn: { x: 76, y: 626 },
    teacherStart: { x: 980, y: 110 },
    walls: [
      { x: 166, y: 92, w: 26, h: 230 }, { x: 166, y: 436, w: 26, h: 184 },
      { x: 350, y: 32, w: 26, h: 160 }, { x: 350, y: 286, w: 26, h: 250 },
      { x: 534, y: 116, w: 26, h: 210 }, { x: 534, y: 448, w: 26, h: 172 },
      { x: 718, y: 32, w: 26, h: 190 }, { x: 718, y: 330, w: 26, h: 250 },
      { x: 902, y: 116, w: 26, h: 236 }, { x: 902, y: 462, w: 26, h: 158 },
      { x: 1086, y: 56, w: 26, h: 254 }, { x: 1086, y: 420, w: 26, h: 200 },
      { x: 64, y: 238, w: 228, h: 24 }, { x: 258, y: 386, w: 210, h: 24 },
      { x: 430, y: 250, w: 210, h: 24 }, { x: 614, y: 526, w: 210, h: 24 },
      { x: 780, y: 284, w: 210, h: 24 }, { x: 956, y: 388, w: 196, h: 24 },
    ],
    teacherPath: [
      { x: 980, y: 110 }, { x: 1140, y: 340 }, { x: 986, y: 562 }, { x: 770, y: 438 },
      { x: 618, y: 150 }, { x: 430, y: 548 }, { x: 250, y: 340 }, { x: 112, y: 120 },
    ],
    cards: [{ x: 116, y: 118 }, { x: 448, y: 214 }, { x: 650, y: 590 }, { x: 840, y: 126 }, { x: 1120, y: 548 }],
    cloak: { x: 270, y: 560 },
    exam: { x: 1000, y: 250 },
  },
];

function buildGeneratedLayout(index) {
  const late = Math.max(0, index - 20);
  const width = index <= 10 ? WORLD_W : 1280 + (index - 10) * 92 + late * 74;
  const height = index <= 10 ? WORLD_H : 720 + (index - 10) * 44 + late * 36;
  const extraColumns = Math.floor(Math.max(0, index - 10) / 2) + Math.floor(late / 3);
  const columnCount = late > 0 ? Math.min(8, 4 + Math.floor(late / 3)) : 7 + extraColumns;
  const columns = Array.from({ length: columnCount }, (_, i) => 188 + i * Math.max(164, Math.floor((width - 360) / columnCount)));
  const mainY = index % 2 ? height - 124 : 118;
  const sideY = index % 2 ? 118 : height - 124;
  const walls = [];

  for (let i = 0; i < columns.length; i += 1) {
    const x = columns[i];
    const topGap = Math.min(mainY, sideY) - 56 + ((i % 3) - 1) * 10;
    const bottomGap = Math.max(mainY, sideY) - 56 + (((i + 1) % 3) - 1) * 10;
    if (late > 0) {
      const doorA = 120 + ((index * 41 + i * 93) % Math.max(120, height - 300));
      const doorB = Math.max(150, Math.min(height - 170, doorA + 170 + ((i % 2) * 90)));
      if (doorA - 88 > 52) walls.push({ x, y: 88, w: 24, h: doorA - 88 });
      if (i % 2 === 0 && doorB - doorA > 146) walls.push({ x, y: doorA + 96, w: 24, h: doorB - doorA - 96 });
      if (height - 124 - doorB > 78) walls.push({ x, y: doorB + 96, w: 24, h: height - 124 - doorB - 96 });
    } else {
      walls.push({ x, y: 52, w: 24, h: Math.max(30, topGap - 52) });
      walls.push({ x, y: topGap + 112, w: 24, h: Math.max(28, bottomGap - (topGap + 112)) });
      walls.push({ x, y: bottomGap + 112, w: 24, h: Math.max(28, height - 84 - (bottomGap + 112)) });
    }
  }

  for (let i = 0; i < 7 + Math.floor(index / 4); i += 1) {
    let y = 180 + ((index * 83 + i * 71) % Math.max(330, height - 360));
    if (Math.abs(y - mainY) < 66) y += y < mainY ? -72 : 72;
    if (Math.abs(y - sideY) < 66) y += y < sideY ? -72 : 72;
    y = Math.max(170, Math.min(height - 170, y));
    const x = 78 + ((index * 47 + i * 139) % Math.max(900, width - 260));
    walls.push({ x, y, w: 126 + ((index + i) % 4) * 28, h: 22 });
  }

  if (late > 0) {
    const rows = 3 + Math.floor(late / 2);
    for (let i = 0; i < rows; i += 1) {
      const y = 160 + i * Math.max(120, Math.floor((height - 320) / Math.max(1, rows - 1)));
      const gap = 180 + ((index * 79 + i * 211) % Math.max(300, width - 560));
      const gapSize = 170 + ((index + i) % 3) * 42;
      walls.push({ x: 76, y, w: Math.max(120, gap - 76), h: 22 });
      walls.push({ x: gap + gapSize, y, w: Math.max(140, width - gap - gapSize - 190), h: 22 });
    }
    for (let i = 0; i < 5 + Math.floor(late / 2); i += 1) {
      const x = 220 + ((index * 113 + i * 257) % Math.max(500, width - 520));
      const y = 190 + ((index * 67 + i * 149) % Math.max(260, height - 380));
      walls.push({ x, y, w: 110 + (i % 3) * 46, h: 22 });
      if (i % 3 === 0) walls.push({ x: x + 22, y: y + 22, w: 22, h: 62 + (i % 3) * 24 });
      if (i % 3 === 1) walls.push({ x: x + 96, y: y - 72, w: 22, h: 72 });
    }
  }

  const cardCount = Math.min(14, 3 + Math.floor(index * 0.55));
  const cards = Array.from({ length: cardCount }, (_, i) => ({
    x: 116 + i * ((width - 260) / Math.max(1, cardCount - 1)),
    y: i % 2 ? sideY : mainY,
  }));
  const teacherPath = [
    { x: width - 300, y: 110 }, { x: width - 120, y: Math.min(height - 160, 300) },
    { x: width - 230, y: height - 160 }, { x: width * 0.62, y: height - 260 },
    { x: width * 0.5, y: 160 }, { x: width * 0.34, y: height - 180 },
    { x: width * 0.2, y: height * 0.5 }, { x: 112, y: 140 },
  ];
  const secondPath = teacherPath.map((point, i) => ({
    x: Math.max(90, Math.min(width - 90, width - point.x)),
    y: Math.max(90, Math.min(height - 90, i % 2 ? point.y : height - point.y)),
  }));

  const teacherCount = index <= 10 ? 1 : index <= 20 ? 2 : Math.min(5, 2 + Math.floor((index - 20) / 3));
  const teachers = Array.from({ length: teacherCount }, (_, teacherIndex) => {
    const mirrored = teacherIndex % 2 === 1;
    const sourcePath = mirrored ? secondPath : teacherPath;
    return {
      start: {
        x: Math.max(120, Math.min(width - 120, mirrored ? width * (0.42 + teacherIndex * 0.04) : width - 260 - teacherIndex * 86)),
        y: Math.max(90, Math.min(height - 90, teacherIndex % 3 === 0 ? sideY : teacherIndex % 3 === 1 ? mainY : height * 0.5)),
      },
      path: sourcePath.map((point, i) => ({
        x: Math.max(90, Math.min(width - 90, point.x + Math.sin(i + teacherIndex) * 34)),
        y: Math.max(90, Math.min(height - 90, point.y + Math.cos(i * 1.4 + teacherIndex) * 28)),
      })),
    };
  });

  return {
    worldW: width,
    worldH: height,
    spawn: { x: 76, y: mainY },
    teacherStart: { x: width - 260 - index * 8, y: sideY },
    teachers: teacherCount > 1 ? teachers : undefined,
    walls: [...boundaryFor(width, height), ...walls],
    teacherPath,
    cards,
    cloak: { x: width * 0.48, y: sideY },
    cloaks: [{ x: width * 0.48, y: sideY }, ...(index > 10 ? [{ x: width * 0.72, y: mainY }] : [])],
    exam: { x: width * 0.68, y: mainY },
    exams: [{ x: width * 0.68, y: mainY }, ...(index > 12 ? [{ x: width * 0.28, y: sideY }] : [])],
    drinks: index > 20
      ? [
          { x: width * 0.36, y: mainY },
          ...(index > 24 ? [{ x: width * 0.82, y: sideY }] : []),
          ...(index > 27 ? [{ x: width * 0.58, y: height * 0.52 }] : []),
        ]
      : [],
    exit: { x: width - 120, y: height - 234, w: 82, h: 142 },
  };
}

const levelLayouts = [mapLayouts[0], mapLayouts[1], mapLayouts[2], ...Array.from({ length: 27 }, (_, index) => buildGeneratedLayout(index + 4))];

const levelNames = [
  "\u95e8\u7981\u521d\u9501",
  "\u5de1\u67e5\u52a0\u5bc6",
  "\u5168\u697c\u5c01\u63a7",
  "\u8bd5\u5242\u8ff7\u5eca",
  "\u76d1\u63a7\u76f2\u533a",
  "\u51b7\u5e93\u56de\u58f0",
  "\u6863\u6848\u5c01\u6761",
  "\u6df1\u591c\u5de1\u697c",
  "\u8b66\u62a5\u6c42\u771f\u697c",
  "\u6700\u7ec8\u9003\u751f\u95e8",
  "\u53cc\u5e08\u5de1\u697c",
  "\u5668\u6750\u8ff7\u9635",
  "\u6697\u706f\u957f\u5eca",
  "\u5c01\u95ed\u6f14\u7ec3",
  "\u9ad8\u538b\u665a\u4fee",
  "\u6863\u6848\u6df1\u4e95",
  "\u53cc\u7ebf\u5939\u51fb",
  "\u6c42\u771f\u56de\u5eca",
  "\u6700\u7ec8\u95e8\u7981",
  "\u6821\u957f\u8def\u8fc7",
  "\u80fd\u91cf\u8865\u7ed9",
  "\u53cc\u7ebf\u8ffd\u6355",
  "\u6863\u6848\u8ff7\u5bab",
  "\u665a\u4fee\u5c01\u697c",
  "\u5668\u6750\u603b\u5e93",
  "\u5de1\u697c\u52a0\u901f",
  "\u6697\u533a\u4f1a\u5408",
  "\u4e09\u5e08\u56f4\u5835",
  "\u7ec8\u6781\u6c42\u771f",
  "\u6700\u540e\u9003\u751f",
];

const levels = levelLayouts.map((layout, index) => ({
  name: `第 ${index + 1} 关：${levelNames[index]}`,
  cardsRequired: layout.cards.length,
  teacherSpeed: 142 + index * 8 + Math.max(0, index - 19) * 7,
  visionRadius: 104 + index * 2 + Math.max(0, index - 19) * 5,
  alertRadius: 148 + index * 2 + Math.max(0, index - 19) * 6,
  suspicionScale: 1 + index * 0.08,
  healthDrain: 4,
  damageScale: 1 + index * 0.1,
  ...layout,
}));
const rooms = [
  { x: 62, y: 116, w: 284, h: 184, label: "化学实验区" },
  { x: 420, y: 96, w: 330, h: 174, label: "生物观察区" },
  { x: 840, y: 118, w: 320, h: 176, label: "资料封存区" },
  { x: 92, y: 408, w: 292, h: 196, label: "试剂储藏间" },
  { x: 494, y: 396, w: 284, h: 206, label: "监控控制台" },
  { x: 884, y: 402, w: 278, h: 188, label: "逃生出口" },
];

const walls = [
  { x: 0, y: 0, w: WORLD_W, h: 32 },
  { x: 0, y: WORLD_H - 32, w: WORLD_W, h: 32 },
  { x: 0, y: 0, w: 32, h: WORLD_H },
  { x: WORLD_W - 32, y: 0, w: 32, h: WORLD_H },
  { x: 360, y: 62, w: 28, h: 178 },
  { x: 360, y: 270, w: 28, h: 48 },
  { x: 788, y: 72, w: 28, h: 132 },
  { x: 788, y: 242, w: 28, h: 68 },
  { x: 410, y: 328, w: 28, h: 188 },
  { x: 410, y: 566, w: 28, h: 76 },
  { x: 812, y: 348, w: 28, h: 156 },
  { x: 812, y: 552, w: 28, h: 64 },
  { x: 166, y: 318, w: 150, h: 24 },
  { x: 500, y: 318, w: 154, h: 24 },
  { x: 838, y: 318, w: 98, h: 24 },
  { x: 42, y: 612, w: 224, h: 22 },
  { x: 450, y: 612, w: 372, h: 22 },
  { x: 970, y: 612, w: 112, h: 22 },
  { x: 230, y: 170, w: 82, h: 24 },
  { x: 528, y: 166, w: 110, h: 24 },
  { x: 980, y: 184, w: 88, h: 24 },
  { x: 176, y: 486, w: 120, h: 24 },
  { x: 592, y: 500, w: 118, h: 24 },
];

const labProps = [
  { type: "microscope", x: 126, y: 180 },
  { type: "testTubes", x: 178, y: 190 },
  { type: "flasks", x: 248, y: 218 },
  { type: "sink", x: 80, y: 246 },
  { type: "glassTank", x: 536, y: 124 },
  { type: "microscope", x: 640, y: 128 },
  { type: "incubator", x: 696, y: 200 },
  { type: "whiteboard", x: 438, y: 110 },
  { type: "fileCabinet", x: 910, y: 150 },
  { type: "shelves", x: 1038, y: 140 },
  { type: "archiveBox", x: 1088, y: 226 },
  { type: "hazard", x: 128, y: 430 },
  { type: "testTubes", x: 210, y: 452 },
  { type: "shelves", x: 300, y: 432 },
  { type: "controlPanel", x: 540, y: 432 },
  { type: "monitor", x: 642, y: 430 },
  { type: "cable", x: 718, y: 530 },
  { type: "glassTank", x: 918, y: 440 },
  { type: "flasks", x: 1032, y: 492 },
  { type: "exitLight", x: 1142, y: 614 },
];

const furniture = [
  { x: 118, y: 188, w: 92, h: 42, c: "#6d5a3b" },
  { x: 552, y: 128, w: 118, h: 42, c: "#4f6a62" },
  { x: 944, y: 154, w: 120, h: 44, c: "#6d5a3b" },
  { x: 152, y: 458, w: 140, h: 46, c: "#4f6a62" },
  { x: 574, y: 458, w: 118, h: 48, c: "#6d5a3b" },
  { x: 936, y: 492, w: 132, h: 44, c: "#4f6a62" },
];

function resizeCanvas() {
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  isPortraitView = false;
  // Keep the original 16:9 game scale. Larger late-game maps move under the camera
  // instead of being squeezed smaller or zoomed oddly on phones.
  baseScale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
  applyViewZoom(false);
  updateWorldView();
  ctx.setTransform(scale, 0, 0, scale, viewOffsetX, viewOffsetY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function applyViewZoom(save = true) {
  viewZoom = clamp(Number.isFinite(viewZoom) ? viewZoom : 1, MIN_VIEW_ZOOM, MAX_VIEW_ZOOM);
  scale = baseScale * viewZoom;
  if (save) localStorage.setItem("labEscapeViewZoom", viewZoom.toFixed(2));
  updateZoomButtons();
}

function changeViewZoom(delta) {
  viewZoom = Math.round((viewZoom + delta) * 100) / 100;
  applyViewZoom();
  updateWorldView();
}

function updateZoomButtons() {
  if (zoomOutButton) zoomOutButton.disabled = viewZoom <= MIN_VIEW_ZOOM + 0.001;
  if (zoomInButton) zoomInButton.disabled = viewZoom >= MAX_VIEW_ZOOM - 0.001;
  const label = `${Math.round(viewZoom * 100)}%`;
  zoomOutButton?.setAttribute("title", `当前视野 ${label}`);
  zoomInButton?.setAttribute("title", `当前视野 ${label}`);
}

function worldW() {
  return game?.level?.worldW || WORLD_W;
}

function worldH() {
  return game?.level?.worldH || WORLD_H;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateWorldView() {
  const w = worldW();
  const h = worldH();
  const renderedW = w * scale;
  const renderedH = h * scale;
  if (game?.player && renderedW > canvas.width) {
    const desiredX = canvas.width / 2 - game.player.x * scale;
    viewOffsetX = clamp(desiredX, canvas.width - renderedW, 0);
  } else {
    viewOffsetX = (canvas.width - renderedW) / 2;
  }
  if (game?.player && renderedH > canvas.height) {
    const desiredY = canvas.height / 2 - game.player.y * scale;
    viewOffsetY = clamp(desiredY, canvas.height - renderedH, 0);
  } else {
    viewOffsetY = (canvas.height - renderedH) / 2;
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function canMove(entity, nx, ny) {
  if (nx < entity.r + 34 || nx > worldW() - entity.r - 34 || ny < entity.r + 34 || ny > worldH() - entity.r - 34) {
    return false;
  }
  const next = { x: nx - entity.r, y: ny - entity.r, w: entity.r * 2, h: entity.r * 2 };
  return !(game?.walls || levelWallSets[0]).some((wall) => rectsOverlap(next, wall));
}

function clampEntityToMap(entity) {
  entity.x = Math.max(entity.r + 34, Math.min(worldW() - entity.r - 34, entity.x));
  entity.y = Math.max(entity.r + 34, Math.min(worldH() - entity.r - 34, entity.y));
}

function resetGame() {
  const level = levels[selectedLevel];
  const teacherConfigs = level.teachers || [{ start: level.teacherStart, path: level.teacherPath }];
  game = {
    state: "playing",
    levelIndex: selectedLevel,
    level,
    score: 100,
    health: 100,
    stamina: 100,
    found: 0,
    phoneHeat: 0,
    phoneQuote: "",
    phoneQuoteTimer: 0,
    phoneQuoteCooldown: 0,
    lowHealthNoticeCooldown: 0,
    cloaks: (level.cloaks || [level.cloak]).map((cloak) => ({ ...cloak, r: 16, got: false })),
    cloak: { ...(level.cloaks?.[0] || level.cloak), r: 16, got: false },
    cloakReady: false,
    cloakUsed: false,
    cloakTimer: 0,
    exams: (level.exams || [level.exam]).map((exam) => ({ ...exam, r: 16, got: false })),
    exam: { ...(level.exams?.[0] || level.exam), r: 16, got: false },
    examReady: false,
    examUsed: false,
    drinks: (level.drinks || []).map((drink) => ({ ...drink, r: 18, got: false })),
    drinkReady: false,
    drinkUsed: false,
    drinkTimer: 0,
    decoy: null,
    walls: level.walls,
    player: { x: level.spawn.x, y: level.spawn.y, r: 15, speed: 235 },
    teachers: teacherConfigs.map((config, teacherIndex) => ({
      x: config.start.x,
      y: config.start.y,
      r: 18,
      speed: level.teacherSpeed * (teacherIndex ? 0.94 : 1),
      target: 0,
      retargetTimer: 0.5 + teacherIndex * 0.25,
      cooldown: 0,
      phoneCooldown: 0,
      mutterTimer: 0.8 + teacherIndex * 0.7,
      mutterText: "",
      mutterTextTimer: 0,
      facing: 1,
      alert: 0,
      stunTimer: 0,
      flyTimer: 0,
      flyDuration: 0.72,
      flyFrom: null,
      flyTo: null,
      spin: 0,
      step: teacherIndex * 2,
      path: config.path,
    })),
    cards: level.cards.map((card) => ({ ...card, r: 12, got: false })),
    exit: level.exit || { x: 1160, y: 486, w: 82, h: 142 },
  };
  game.teacher = game.teachers[0];
  setMessage(`${level.name}\uFF1A\u62FF\u9F50 ${level.cardsRequired} \u5F20\u901A\u884C\u5361\u624D\u80FD\u9003\u8D70\u3002`);
  updateCloakButton();
  updateExamButton();
  updateDrinkButton();
  updateHud();
}
function unlockLevelAfterWin(levelIndex) {
  if (!playerSave) return;
  if (!playerSave.wins.includes(levelIndex)) {
    playerSave.wins.push(levelIndex);
  }
  playerSave.firstReachedAt = playerSave.firstReachedAt || {};
  if (!Number.isFinite(playerSave.firstReachedAt[String(levelIndex)])) {
    playerSave.firstReachedAt[String(levelIndex)] = Date.now();
  }
  playerSave.unlocked = Math.min(levels.length, Math.max(playerSave.unlocked, levelIndex + 2));
  persistPlayerSaveNow();
  syncLevelButtons();
}

function setMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.add("show");
  messageTimer = 2.5;
}

function updateCloakButton() {
  if (!cloakButton || !game) return;
  const active = game.cloakTimer > 0;
  cloakButton.hidden = !game.cloakReady && !active && !game.cloakUsed;
  cloakButton.disabled = !game.cloakReady || active || game.state !== "playing";
  cloakButton.textContent = active
    ? `隐身 ${Math.ceil(game.cloakTimer)}s`
    : game.cloakReady
      ? "使用隐身"
      : game.cloakUsed
        ? "实验服 已使用"
        : "实验服 未获得";
  cloakButton.classList.toggle("is-active", active);
  cloakButton.classList.toggle("is-ready", game.cloakReady);
}

function useCloak() {
  if (!game || game.state !== "playing" || !game.cloakReady || game.cloakTimer > 0) return;
  game.cloakReady = false;
  game.cloakUsed = true;
  game.cloakTimer = 10;
  setMessage("隐身实验服启动：10 秒内老师看不到你。玩手机会失效。");
  updateCloakButton();
}

function updateExamButton() {
  if (!examButton || !game) return;
  const active = !!game.decoy && (!game.decoy.reached || game.decoy.timer > 0);
  examButton.hidden = !game.examReady && !active && !game.examUsed;
  examButton.disabled = !game.examReady || active || game.state !== "playing";
  examButton.textContent = active
    ? game.decoy.reached
      ? `挨骂 ${Math.ceil(game.decoy.timer)}s`
      : "老师赶路中"
    : game.examReady
      ? "使用试卷"
      : game.examUsed
        ? "试卷 已使用"
        : "试卷 未获得";
  examButton.classList.toggle("is-ready", game.examReady);
  examButton.classList.toggle("is-active", active);
}

function useExam() {
  if (!game || game.state !== "playing" || !game.examReady || game.decoy?.timer > 0) return;
  const p = game.player;
  const x = Math.max(100, Math.min(worldW() - 130, p.x + (p.x < worldW() / 2 ? 190 : -190)));
  const y = Math.max(90, Math.min(worldH() - 100, p.y + (p.y < worldH() / 2 ? 120 : -120)));
  game.examReady = false;
  game.examUsed = true;
  game.decoy = { x, y, timer: 5, quoteTimer: 0, quote: "你都断层了", reached: false };
  for (const teacher of game.teachers) {
    teacher.target = 0;
    teacher.retargetTimer = 5;
    teacher.alert = 0;
    teacher.cooldown = 0.8;
  }
  setMessage("断层试卷发动：老师去骂那个 38 分 NPC 了。");
  updateExamButton();
}

function updateDrinkButton() {
  if (!drinkButton || !game) return;
  const active = game.drinkTimer > 0;
  drinkButton.hidden = !game.drinkReady && !active && !game.drinkUsed;
  drinkButton.disabled = !game.drinkReady || active || game.state !== "playing";
  drinkButton.textContent = active
    ? `东鹏 ${Math.ceil(game.drinkTimer)}s`
    : game.drinkReady
      ? "喝东鹏"
      : game.drinkUsed
        ? "东鹏 已使用"
        : "东鹏 未获得";
  drinkButton.classList.toggle("is-ready", game.drinkReady);
  drinkButton.classList.toggle("is-active", active);
}

function useDrink() {
  if (!game || game.state !== "playing" || !game.drinkReady || game.drinkTimer > 0) return;
  game.drinkReady = false;
  game.drinkUsed = true;
  game.drinkTimer = 5;
  setMessage("东鹏特饮启动：5 秒内移速翻倍并无敌，冲进老师圆圈可以把老师撞飞。");
  updateDrinkButton();
}

function knockTeacherAway(t) {
  const p = game.player;
  let dx = t.x - p.x;
  let dy = t.y - p.y;
  let len = Math.hypot(dx, dy);
  if (len < 1) {
    dx = Math.random() - 0.5;
    dy = Math.random() - 0.5;
    len = Math.hypot(dx, dy) || 1;
  }
  const force = Math.max(worldW(), worldH()) * 0.55;
  t.flyFrom = { x: t.x, y: t.y };
  t.flyTo = {
    x: clamp(t.x + (dx / len) * force, t.r + 48, worldW() - t.r - 48),
    y: clamp(t.y + (dy / len) * force, t.r + 48, worldH() - t.r - 48),
  };
  t.flyDuration = 0.72;
  t.flyTimer = t.flyDuration;
  t.stunTimer = 0;
  t.alert = 0;
  t.cooldown = 1;
  t.mutterText = "怎么这么多星星";
  t.mutterTextTimer = 2.8;
  setMessage("东鹏特饮把老师撞飞了。");
}

function updateHud() {
  scoreEl.textContent = Math.max(0, Math.round(game.score));
  healthEl.textContent = Math.max(0, Math.round(game.health));
  staminaEl.textContent = Math.max(0, Math.round(game.stamina));
  itemsEl.textContent = `${game.found}/${game.level.cardsRequired}`;
  statusEl.textContent = game.state === "playing" ? `第 ${game.levelIndex + 1} 关` : game.state === "won" ? "成功" : "失败";
  if (helpStrip) helpStrip.textContent = objectiveText();
}

function objectiveText() {
  if (!game || game.state === "won") return "\u6210\u529f\u9003\u51fa\u6c42\u771f\u697c\u3002";
  if (game.state === "lost") return "\u5931\u8d25\u4e86\uff0c\u70b9\u51fb\u91cd\u65b0\u5f00\u59cb\u518d\u8bd5\u4e00\u6b21\u3002";
  if (game.stamina < 20) return "\u4f53\u529b\u4f4e\u4e86\uff1a\u677e\u5f00\u51b2\u523a\uff0c\u4f53\u529b\u4f1a\u6162\u6162\u6062\u590d\u3002";
  if (game.health < 28) return "\u5065\u5eb7\u592a\u4f4e\u4e86\uff1a\u6309\u4f4f\u53f3\u4fa7\u73a9\u624b\u673a\u6309\u94ae\u56de\u8840\uff0c\u4f46\u79fb\u52a8\u901f\u5ea6\u4f1a\u51cf\u534a\u3002";
  const taskName = game.levelIndex >= 20 ? "\u68c0\u67e5\u70b9" : "\u901a\u884c\u5361";
  if (game.found < game.level.cardsRequired) return `目标：${game.level.name}，完成第 ${game.found + 1}/${game.level.cardsRequired} 个${taskName}。玩手机可回血，冲刺会耗体力。`;
  return "\u51fa\u53e3\u5df2\u5f00\u542f\uff1a\u53bb\u53f3\u4fa7\u53d1\u5149\u7684\u9003\u751f\u95e8\u3002";
}

function inputVector() {
  let x = 0;
  let y = 0;
  const active = new Set([...keys, ...touchKeys]);
  if (active.has("arrowleft") || active.has("a")) x -= 1;
  if (active.has("arrowright") || active.has("d")) x += 1;
  if (active.has("arrowup") || active.has("w")) y -= 1;
  if (active.has("arrowdown") || active.has("s")) y += 1;
  x += joystickVector.x;
  y += joystickVector.y;
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function update(dt) {
  if (!game || game.state !== "playing" || isGameplayPaused()) return;

  const p = game.player;
  const v = inputVector();
  const playingPhone = keys.has(" ") || touchKeys.has("phone");
  if (playingPhone && game.cloakTimer > 0) {
    game.cloakTimer = 0;
    setMessage("玩手机暴露了位置，隐身实验服失效。");
  }
  const cloaked = game.cloakTimer > 0;
  const powered = game.drinkTimer > 0;
  const sprinting = (keys.has("shift") || touchKeys.has("sprint")) && game.stamina > 0 && !playingPhone;
  const baseMoveSpeed = playingPhone ? p.speed * 0.5 : sprinting ? p.speed * 1.3 : p.speed;
  const moveSpeed = powered ? baseMoveSpeed * 2 : baseMoveSpeed;
  const moving = Math.hypot(v.x, v.y) > 0.05;
  if (sprinting && moving) {
    game.stamina = Math.max(0, game.stamina - 36 * dt);
  } else {
    game.stamina = Math.min(100, game.stamina + 6 * dt);
  }
  const nx = p.x + v.x * moveSpeed * dt;
  const ny = p.y + v.y * moveSpeed * dt;
  if (canMove(p, nx, p.y)) p.x = nx;
  if (canMove(p, p.x, ny)) p.y = ny;
  clampEntityToMap(p);

  for (const card of game.cards) {
    if (!card.got && Math.hypot(p.x - card.x, p.y - card.y) < p.r + card.r + 4) {
      card.got = true;
      game.found += 1;
      setMessage(game.found >= game.level.cardsRequired ? "出口权限恢复，快去右侧逃生门。" : `拿到通行卡，还差 ${game.level.cardsRequired - game.found} 张。`);
    }
  }

  for (const cloak of game.cloaks || []) {
    if (!cloak.got && Math.hypot(p.x - cloak.x, p.y - cloak.y) < p.r + cloak.r + 6) {
      cloak.got = true;
      game.cloak = cloak;
      game.cloakReady = true;
      setMessage("\u6361\u5230\u9690\u8EAB\u5B9E\u9A8C\u670D\uFF1A\u53EF\u4E3B\u52A8\u9690\u8EAB 10 \u79D2\u3002");
    }
  }

  for (const exam of game.exams || []) {
    if (!exam.got && Math.hypot(p.x - exam.x, p.y - exam.y) < p.r + exam.r + 6) {
      exam.got = true;
      game.exam = exam;
      game.examReady = true;
      setMessage("\u6361\u5230\u65AD\u5C42\u8BD5\u5377\uFF1A\u53EF\u53EC\u5524 NPC \u5438\u5F15\u8001\u5E08 5 \u79D2\u3002");
    }
  }

  for (const drink of game.drinks || []) {
    if (!drink.got && Math.hypot(p.x - drink.x, p.y - drink.y) < p.r + drink.r + 6) {
      drink.got = true;
      game.drinkReady = true;
      setMessage("捡到东鹏特饮：喝下后 5 秒内移速翻倍并无敌，可撞飞老师。");
    }
  }

  if (game.cloakTimer > 0) {
    game.cloakTimer = Math.max(0, game.cloakTimer - dt);
  }
  if (game.drinkTimer > 0) {
    game.drinkTimer = Math.max(0, game.drinkTimer - dt);
  }
  if (game.decoy && !game.decoy.reached) {
    game.decoy.quote = "老师冲过来了";
  } else if (game.decoy?.timer > 0) {
    game.decoy.timer = Math.max(0, game.decoy.timer - dt);
    game.decoy.quoteTimer = Math.max(0, game.decoy.quoteTimer - dt);
    if (game.decoy.quoteTimer <= 0) {
      game.decoy.quote = Math.random() > 0.5 ? "你都断层了" : "捞都捞不起来";
      game.decoy.quoteTimer = 3.4;
    }
  }

  for (const teacher of game.teachers) {
    updateTeacher(teacher, dt, p, cloaked, playingPhone, powered);
  }
  game.lowHealthNoticeCooldown = Math.max(0, game.lowHealthNoticeCooldown - dt);

  if (playingPhone) {
    game.health = Math.min(100, game.health + 22 * dt);
    game.phoneHeat = Math.min(100, game.phoneHeat + 28 * dt);
    game.phoneQuoteCooldown = Math.max(0, game.phoneQuoteCooldown - dt);
    game.phoneQuoteTimer = Math.max(0, game.phoneQuoteTimer - dt);
    if (game.phoneQuoteCooldown <= 0) {
      game.phoneQuote = phoneQuotes[Math.floor(Math.random() * phoneQuotes.length)];
      game.phoneQuoteTimer = 1.45;
      game.phoneQuoteCooldown = 1.8 + Math.random() * 1.1;
    }
  } else {
    game.health -= game.level.healthDrain * dt;
    game.phoneHeat = Math.max(0, game.phoneHeat - 42 * dt);
    game.phoneQuoteTimer = 0;
    game.phoneQuoteCooldown = 0;
  }

  if (game.health < 20 && !playingPhone && game.lowHealthNoticeCooldown <= 0) {
    setMessage("健康值过低，请玩手机");
    game.lowHealthNoticeCooldown = 4;
  }

  if (game.score <= 60) endGame("lost", "分数低于 60，逃脱失败。");
  if (game.health <= 0) endGame("lost", "太久没玩手机，健康值归零。");
  if (game.found === game.level.cardsRequired && rectsOverlap({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, game.exit)) {
    const next = game.levelIndex < levels.length - 1;
    endGame("won", next ? `第 ${game.levelIndex + 1} 关通过，下一关更难。` : "全部关卡通关，成功逃出求真楼。");
  }

  updateHud();
  updateCloakButton();
  updateExamButton();
  updateDrinkButton();
}

function updateTeacher(t, dt, p, cloaked, playingPhone, powered = false) {
  if (t.flyTimer > 0 && t.flyFrom && t.flyTo) {
    t.flyTimer = Math.max(0, t.flyTimer - dt);
    const progress = 1 - t.flyTimer / t.flyDuration;
    const lift = Math.sin(progress * Math.PI) * 150;
    t.x = t.flyFrom.x + (t.flyTo.x - t.flyFrom.x) * progress;
    t.y = t.flyFrom.y + (t.flyTo.y - t.flyFrom.y) * progress - lift;
    t.spin += dt * 18;
    if (t.flyTimer <= 0) {
      t.x = t.flyTo.x;
      t.y = t.flyTo.y;
      clampEntityToMap(t);
      t.flyFrom = null;
      t.flyTo = null;
      t.stunTimer = 3;
      t.mutterText = Math.random() > 0.5 ? "怎么这么多星星" : "通风橱忘开了吗";
      t.mutterTextTimer = 3;
      t.mutterTimer = 3;
    }
    return;
  }
  if (t.stunTimer > 0) {
    t.stunTimer = Math.max(0, t.stunTimer - dt);
    t.step += dt * 4.5;
    t.mutterTextTimer = Math.max(0, t.mutterTextTimer - dt);
    if (t.mutterTextTimer <= 0) {
      t.mutterText = Math.random() > 0.5 ? "怎么这么多星星" : "通风橱忘开了吗";
      t.mutterTextTimer = 2.2;
    }
    return;
  }
  const teacherDistance = Math.hypot(p.x - t.x, p.y - t.y);
  if (powered && teacherDistance < 126 + p.r) {
    knockTeacherAway(t);
    return;
  }
  const decoyActive = !!game.decoy && (!game.decoy.reached || game.decoy.timer > 0);
  const nearTeacher = !decoyActive && !cloaked && teacherDistance < (game.level.alertRadius || 148);
  t.alert = Math.max(0, t.alert - dt);
  t.retargetTimer = Math.max(0, t.retargetTimer - dt);
  if (!nearTeacher && t.retargetTimer <= 0) {
    t.target = (t.target + 1 + Math.floor(Math.random() * 2)) % t.path.length;
    t.retargetTimer = 0.75 + Math.random() * 0.55;
  }
  const decoyLecture = !!game.decoy && game.decoy.reached && game.decoy.timer > 0;
  const target = decoyActive ? game.decoy : nearTeacher ? p : t.path[t.target];
  const dx = target.x - t.x;
  const dy = target.y - t.y;
  const dist = Math.hypot(dx, dy);
  const chase = decoyActive ? 2 : nearTeacher ? 1.55 : 1;
  if (decoyActive && !game.decoy.reached && dist < 54) {
    game.decoy.reached = true;
    game.decoy.timer = 5;
    game.decoy.quoteTimer = 3.4;
    game.decoy.quote = "\u4F60\u90FD\u65AD\u5C42\u4E86";
    t.retargetTimer = 5;
  } else if (decoyLecture) {
    t.facing = game.decoy.x >= t.x ? 1 : -1;
    t.step += dt * 4.2;
  } else if (!nearTeacher && !decoyActive && dist < 8) {
    t.target = (t.target + 1) % t.path.length;
  } else if (dist > 0) {
    const tx = t.x + (dx / dist) * t.speed * chase * dt;
    const ty = t.y + (dy / dist) * t.speed * chase * dt;
    if (decoyActive) {
      t.x = tx;
      t.y = ty;
    } else {
      if (canMove(t, tx, t.y)) t.x = tx;
      if (canMove(t, t.x, ty)) t.y = ty;
    }
    clampEntityToMap(t);
    t.facing = dx >= 0 ? 1 : -1;
    t.step += dt * (decoyActive ? 12 : nearTeacher ? 11 : 7);
  }

  t.cooldown = Math.max(0, t.cooldown - dt);
  t.phoneCooldown = Math.max(0, t.phoneCooldown - dt);
  t.mutterTimer = Math.max(0, t.mutterTimer - dt);
  t.mutterTextTimer = Math.max(0, t.mutterTextTimer - dt);
  if (t.mutterTimer <= 0 && !nearTeacher) {
    t.mutterText = teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)];
    t.mutterTextTimer = 3.8;
    t.mutterTimer = 3.2 + Math.random() * 2.4;
  }
  const inTeacherCircle = !cloaked && teacherDistance < (game.level.visionRadius || 126) + p.r;
  if (inTeacherCircle) {
    game.score -= 3 * dt;
    t.alert = 1;
    if (t.cooldown <= 0) {
      t.cooldown = 1.8;
      setMessage(playingPhone ? "\u4E0A\u8BFE\u73A9\u624B\u673A\uFF0C\u88AB\u6211\u902E\u5230\u4E86\uFF0C\u6263\u5206\u3002" : teacherQuotes[Math.floor(Math.random() * teacherQuotes.length)]);
    }
  }
}
function endGame(state, text) {
  game.state = state;
  setMessage(text);
  startEl.hidden = false;
  if (state === "won" && game.levelIndex < levels.length - 1) {
    unlockLevelAfterWin(game.levelIndex);
    selectedLevel = game.levelIndex + 1;
    startBtn.textContent = "下一关";
  } else {
    if (state === "won") unlockLevelAfterWin(game.levelIndex);
    startBtn.textContent = state === "won" ? `重玩第 ${game.levelIndex + 1} 关` : "再玩一次";
  }
  syncLevelButtons();
}

function roundRect(x, y, w, h, r = 10) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRoundRect(x, y, w, h, r, fillStyle) {
  ctx.fillStyle = fillStyle;
  roundRect(x, y, w, h, r);
  ctx.fill();
}

function strokeRoundRect(x, y, w, h, r, strokeStyle, lineWidth = 2) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawGrid() {
  const w = worldW();
  const h = worldH();
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#22322c");
  bg.addColorStop(0.42, "#18221d");
  bg.addColorStop(1, "#111713");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 40) {
    for (let x = 0; x < w; x += 40) {
      const tile = ctx.createLinearGradient(x, y, x + 40, y + 40);
      tile.addColorStop(0, (x / 40 + y / 40) % 2 === 0 ? "#233329" : "#1b2922");
      tile.addColorStop(1, (x / 40 + y / 40) % 2 === 0 ? "#17231d" : "#142018");
      ctx.fillStyle = tile;
      ctx.fillRect(x, y, 40, 40);
      ctx.strokeStyle = "rgba(255,245,210,0.055)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, 39, 39);
    }
  }

  const glow = ctx.createRadialGradient(560, 210, 30, 560, 210, 540);
  glow.addColorStop(0, "rgba(137,202,180,0.12)");
  glow.addColorStop(0.46, "rgba(215,181,109,0.045)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawLab() {
  const extraRooms = worldW() > WORLD_W || worldH() > WORLD_H
    ? Array.from({ length: Math.ceil((worldW() - WORLD_W) / 320) + Math.ceil((worldH() - WORLD_H) / 220) }, (_, i) => ({
        x: 118 + (i * 310) % Math.max(360, worldW() - 420),
        y: 110 + (i * 190) % Math.max(240, worldH() - 330),
        w: 260 + (i % 3) * 28,
        h: 156 + (i % 2) * 32,
        label: ["器材区", "暗室", "资料室", "监控角"][i % 4],
      }))
    : [];
  for (const room of [...rooms, ...extraRooms]) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.24)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    fillRoundRect(room.x, room.y, room.w, room.h, 14, "rgba(128, 158, 132, 0.18)");
    ctx.restore();
    fillRoundRect(room.x + 5, room.y + 5, room.w - 10, room.h - 10, 12, "rgba(215, 241, 219, 0.055)");
    strokeRoundRect(room.x, room.y, room.w, room.h, 14, "rgba(210, 230, 202, 0.18)", 3);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(room.x + 12, room.y + 12, room.w - 24, 28, 10);
    ctx.fill();
    ctx.fillStyle = "#dfbf71";
    ctx.font = "900 15px 'Microsoft YaHei', sans-serif";
    ctx.fillText(room.label, room.x + 16, room.y + 28);
  }

  drawFurniture();
  for (const prop of labProps) drawProp(prop);
  if (worldW() > WORLD_W || worldH() > WORLD_H) {
    const count = 8 + Math.floor((worldW() - WORLD_W) / 90);
    for (let i = 0; i < count; i += 1) {
      drawProp({
        type: ["microscope", "testTubes", "flasks", "computer", "cabinet"][i % 5],
        x: 120 + (i * 237) % Math.max(400, worldW() - 220),
        y: 170 + (i * 151) % Math.max(260, worldH() - 260),
      });
    }
  }

  for (const wall of game.walls) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    fillRoundRect(wall.x, wall.y, wall.w, wall.h, 8, "#504b3d");
    ctx.restore();
    fillRoundRect(wall.x + 3, wall.y + 3, Math.max(2, wall.w - 6), Math.max(2, wall.h - 6), 6, "#665f4b");
    ctx.strokeStyle = "rgba(255,232,170,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (wall.w > wall.h) {
      ctx.moveTo(wall.x + 8, wall.y + wall.h / 2);
      ctx.lineTo(wall.x + wall.w - 8, wall.y + wall.h / 2);
    } else {
      ctx.moveTo(wall.x + wall.w / 2, wall.y + 8);
      ctx.lineTo(wall.x + wall.w / 2, wall.y + wall.h - 8);
    }
    ctx.stroke();
  }

  drawExitDoor();
}

function drawExitDoor() {
  const exit = game.exit;
  const open = game.found === game.level.cardsRequired;
  const glow = 0.62 + Math.sin(performance.now() / 150) * 0.24;
  const aura = ctx.createRadialGradient(exit.x + exit.w / 2, exit.y + exit.h / 2, 12, exit.x + exit.w / 2, exit.y + exit.h / 2, 110);
  aura.addColorStop(0, open ? `rgba(125,238,170,${0.28 + glow * 0.16})` : `rgba(255,213,114,${0.24 + glow * 0.1})`);
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(exit.x - 78, exit.y - 76, exit.w + 156, exit.h + 152);
  ctx.save();
  ctx.shadowColor = open ? "rgba(103,188,139,0.5)" : "rgba(215,181,109,0.45)";
  ctx.shadowBlur = 22;
  fillRoundRect(exit.x - 14, exit.y - 16, exit.w + 28, exit.h + 32, 10, open ? "#446f55" : "#80683b");
  ctx.restore();
  fillRoundRect(exit.x, exit.y, exit.w, exit.h, 8, open ? "#67bc8b" : "#d7b56d");
  fillRoundRect(exit.x + 12, exit.y + 12, exit.w - 24, 22, 6, open ? "#d9ffe2" : "#ffe49a");
  fillRoundRect(exit.x + 12, exit.y + exit.h - 34, exit.w - 24, 22, 6, open ? "#d9ffe2" : "#ffe49a");
  strokeRoundRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12, 10, open ? "#dcffe4" : "#ffe29b", 6);
  fillRoundRect(exit.x + 18, exit.y + 48, exit.w - 36, 42, 8, "#10140f");
  ctx.fillStyle = open ? "#dcffe4" : "#ffe29b";
  ctx.font = "900 24px 'Microsoft YaHei', sans-serif";
  ctx.fillText(open ? "出去" : "锁定", exit.x + 15, exit.y + 77);
  ctx.fillStyle = "#f6eed5";
  ctx.font = "900 20px 'Microsoft YaHei', sans-serif";
  ctx.fillText("逃生门", exit.x - 2, exit.y - 18);
}

function drawFurniture() {
  for (const table of furniture) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;
    fillRoundRect(table.x, table.y, table.w, table.h, 10, table.c);
    ctx.restore();
    fillRoundRect(table.x + 5, table.y + 5, table.w - 10, 9, 5, "rgba(255,255,255,0.18)");
    fillRoundRect(table.x + 8, table.y + table.h - 8, table.w - 16, 6, 4, "rgba(0,0,0,0.18)");
    fillRoundRect(table.x + 10, table.y + table.h - 1, 12, 20, 4, "#2b241d");
    fillRoundRect(table.x + table.w - 22, table.y + table.h - 1, 12, 20, 4, "#2b241d");
  }
}

function drawProp(prop) {
  const { x, y } = prop;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  if (prop.type === "microscope") {
    ctx.fillStyle = "#b7d3c9";
    ctx.fillRect(x, y + 26, 38, 8);
    ctx.fillRect(x + 14, y + 6, 9, 24);
    ctx.fillStyle = "#6f9387";
    ctx.fillRect(x + 22, y, 22, 8);
    ctx.fillRect(x + 24, y + 8, 8, 16);
  }
  if (prop.type === "testTubes") {
    ctx.fillStyle = "#433927";
    ctx.fillRect(x, y + 24, 48, 7);
    ["#9bd3ff", "#a8e58f", "#e5c65a", "#ef8c82"].forEach((c, i) => {
      ctx.fillStyle = "#d8eee8";
      ctx.fillRect(x + 5 + i * 10, y, 6, 24);
      ctx.fillStyle = c;
      ctx.fillRect(x + 5 + i * 10, y + 14 - i, 6, 10 + i);
    });
  }
  if (prop.type === "flasks") {
    ctx.fillStyle = "#c8e8dc";
    ctx.fillRect(x + 10, y, 8, 18);
    ctx.fillRect(x + 2, y + 18, 24, 20);
    ctx.fillStyle = "#77c7a2";
    ctx.fillRect(x + 4, y + 28, 20, 10);
    ctx.fillStyle = "#d7b56d";
    ctx.fillRect(x + 36, y + 8, 8, 28);
    ctx.fillRect(x + 30, y + 30, 20, 8);
  }
  if (prop.type === "sink") {
    ctx.fillStyle = "#8ca89f";
    ctx.fillRect(x, y, 58, 28);
    ctx.fillStyle = "#26342f";
    ctx.fillRect(x + 9, y + 7, 40, 14);
    ctx.fillStyle = "#d7b56d";
    ctx.fillRect(x + 26, y - 10, 6, 14);
  }
  if (prop.type === "glassTank") {
    ctx.fillStyle = "rgba(170,220,230,0.2)";
    ctx.fillRect(x, y, 70, 44);
    ctx.strokeStyle = "#9fc7c6";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 70, 44);
    ctx.fillStyle = "#6fb18f";
    ctx.fillRect(x + 7, y + 29, 56, 8);
  }
  if (prop.type === "incubator") {
    ctx.fillStyle = "#596057";
    ctx.fillRect(x, y, 54, 64);
    ctx.fillStyle = "#9fc7c6";
    ctx.fillRect(x + 8, y + 10, 38, 28);
    ctx.fillStyle = "#d7b56d";
    ctx.fillRect(x + 10, y + 48, 8, 8);
    ctx.fillRect(x + 24, y + 48, 8, 8);
  }
  if (prop.type === "whiteboard") {
    ctx.fillStyle = "#dbe6dc";
    ctx.fillRect(x, y, 82, 42);
    ctx.fillStyle = "#517a6f";
    ctx.fillRect(x + 8, y + 9, 50, 4);
    ctx.fillRect(x + 8, y + 20, 64, 4);
    ctx.fillStyle = "#d86158";
    ctx.fillRect(x + 62, y + 30, 12, 4);
  }
  if (prop.type === "fileCabinet") {
    ctx.fillStyle = "#605b4d";
    ctx.fillRect(x, y, 48, 70);
    ctx.fillStyle = "#2b2a24";
    ctx.fillRect(x + 8, y + 16, 32, 3);
    ctx.fillRect(x + 8, y + 38, 32, 3);
  }
  if (prop.type === "shelves") {
    ctx.fillStyle = "#5f4d35";
    ctx.fillRect(x, y, 68, 70);
    ctx.fillStyle = "#352918";
    ctx.fillRect(x + 6, y + 18, 56, 4);
    ctx.fillRect(x + 6, y + 42, 56, 4);
    ctx.fillStyle = "#8ac8bb";
    ctx.fillRect(x + 12, y + 6, 8, 12);
    ctx.fillStyle = "#d7b56d";
    ctx.fillRect(x + 28, y + 28, 12, 14);
    ctx.fillStyle = "#e2695c";
    ctx.fillRect(x + 46, y + 50, 10, 14);
  }
  if (prop.type === "archiveBox") {
    ctx.fillStyle = "#9c7a43";
    ctx.fillRect(x, y, 56, 34);
    ctx.fillStyle = "#f0dca2";
    ctx.fillRect(x + 14, y + 10, 28, 6);
  }
  if (prop.type === "hazard") {
    ctx.fillStyle = "#d7b56d";
    for (let i = 0; i < 6; i++) ctx.fillRect(x + i * 28, y, 18, 8);
  }
  if (prop.type === "controlPanel") {
    ctx.fillStyle = "#29312e";
    ctx.fillRect(x, y, 86, 56);
    ctx.fillStyle = "#76d7a7";
    ctx.fillRect(x + 12, y + 12, 30, 20);
    ctx.fillStyle = "#d7b56d";
    ctx.fillRect(x + 54, y + 12, 10, 10);
    ctx.fillStyle = "#e2695c";
    ctx.fillRect(x + 68, y + 12, 10, 10);
    ctx.fillStyle = "#9fc7ff";
    ctx.fillRect(x + 54, y + 32, 24, 8);
  }
  if (prop.type === "monitor") {
    ctx.fillStyle = "#161b1a";
    ctx.fillRect(x, y, 62, 40);
    ctx.fillStyle = "#6fd3c4";
    ctx.fillRect(x + 8, y + 8, 46, 22);
    ctx.fillStyle = "#5a5240";
    ctx.fillRect(x + 26, y + 40, 10, 14);
  }
  if (prop.type === "cable") {
    ctx.strokeStyle = "#7e6b43";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 34, y + 28, x - 18, y + 60, x + 54, y + 78);
    ctx.stroke();
  }
  if (prop.type === "exitLight") {
    ctx.fillStyle = "#70d28f";
    ctx.fillRect(x, y, 62, 20);
    ctx.fillStyle = "#102015";
    ctx.font = "900 12px 'Courier New'";
    ctx.fillText("EXIT", x + 14, y + 14);
  }
  ctx.restore();
}

function drawCloakItem() {
  for (const cloak of game.cloaks || []) {
    if (cloak.got) continue;
    const pulse = Math.sin(performance.now() / 210 + cloak.x * 0.01) * 3;
    const x = cloak.x;
    const y = cloak.y + pulse;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "rgba(122, 205, 188, 0.72)";
    ctx.shadowBlur = 18;
    fillRoundRect(-28, -22, 56, 46, 12, "rgba(120, 211, 194, 0.2)");
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#9adbd0";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(-28, -18, -24, 28, -8, 30);
    ctx.lineTo(-2, 8);
    ctx.lineTo(2, 8);
    ctx.lineTo(8, 30);
    ctx.bezierCurveTo(24, 28, 28, -18, 0, -28);
    ctx.fill();
    ctx.fillStyle = "rgba(15, 28, 24, 0.58)";
    ctx.beginPath();
    ctx.ellipse(0, -14, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6eed5";
    ctx.font = "900 12px 'Microsoft YaHei', sans-serif";
    ctx.fillText("?", -6, 4);
    ctx.restore();
  }
}
function drawExamItem() {
  for (const exam of game.exams || []) {
    if (exam.got) continue;
    const pulse = Math.sin(performance.now() / 230 + exam.x * 0.01) * 3;
    const x = exam.x;
    const y = exam.y + pulse;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12);
    ctx.shadowColor = "rgba(255, 232, 170, 0.65)";
    ctx.shadowBlur = 14;
    fillRoundRect(-22, -28, 44, 56, 5, "#f6eed5");
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e2695c";
    ctx.font = "900 18px 'Microsoft YaHei', sans-serif";
    ctx.fillText("38", -13, -7);
    ctx.fillStyle = "rgba(20,20,16,0.38)";
    for (let i = 0; i < 4; i += 1) ctx.fillRect(-14, 3 + i * 7, 28, 3);
    ctx.restore();
  }
}

function drawDrinkItem() {
  for (const drink of game.drinks || []) {
    if (drink.got) continue;
    const pulse = Math.sin(performance.now() / 190 + drink.x * 0.01) * 4;
    const x = drink.x;
    const y = drink.y + pulse;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "rgba(255, 220, 52, 0.8)";
    ctx.shadowBlur = 20;
    fillRoundRect(-26, -30, 52, 60, 13, "rgba(255, 210, 38, 0.2)");
    ctx.shadowBlur = 0;
    if (drinkImage.complete && drinkImage.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(drinkImage, -15, -42, 30, 84);
    } else {
      fillRoundRect(-12, -34, 24, 68, 8, "#ffd935");
      ctx.fillStyle = "#e5392f";
      ctx.fillRect(-9, -6, 18, 24);
    }
    ctx.fillStyle = "#10110d";
    ctx.font = "900 11px 'Microsoft YaHei', sans-serif";
    ctx.fillText("东鹏", -13, 8);
    ctx.restore();
  }
}

function drawCards() {
  const target = getNextTarget();
  const inspectionMode = game.levelIndex >= 20;
  for (let index = 0; index < game.cards.length; index += 1) {
    const card = game.cards[index];
    if (card.got) continue;
    const pulse = Math.sin(performance.now() / 180) * 2;
    const isNext = target && target.kind === "card" && target.index === index;
    ctx.save();
    ctx.translate(card.x, card.y + pulse);
    ctx.shadowColor = isNext ? "rgba(255,226,125,0.7)" : "rgba(0,0,0,0.28)";
    ctx.shadowBlur = isNext ? 16 : 8;
    fillRoundRect(isNext ? -26 : -20, isNext ? -22 : -16, isNext ? 52 : 40, isNext ? 44 : 32, 8, isNext ? "rgba(255,226,125,0.34)" : "rgba(215,181,109,0.2)");
    ctx.shadowBlur = 0;
    if (inspectionMode) {
      const colors = ["#a7d8d1", "#f4df9f", "#d7b56d"];
      fillRoundRect(-16, -12, 32, 24, 6, colors[index % colors.length]);
      ctx.fillStyle = index % 3 === 0 ? "#294942" : "#4e3a22";
      ctx.fillRect(-9, -3, 18, 4);
      if (index % 3 === 1) {
        ctx.beginPath();
        ctx.arc(0, 3, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "#294942";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else {
      fillRoundRect(-14, -10, 28, 20, 5, "#d7b56d");
      fillRoundRect(-10, -6, 20, 4, 2, "#f4df9f");
      fillRoundRect(-10, 2, 20, 4, 2, "rgba(17,16,14,0.42)");
    }
    ctx.fillStyle = "#10110d";
    ctx.font = "900 12px 'Microsoft YaHei', sans-serif";
    ctx.fillText(String(index + 1), -4, 5);
    ctx.restore();
  }
}

function getNextTarget() {
  const nextCardIndex = game.cards.findIndex((card) => !card.got);
  if (nextCardIndex !== -1) {
    const card = game.cards[nextCardIndex];
    const label = game.levelIndex >= 20 ? `第 ${nextCardIndex + 1} 个检查点` : `第 ${nextCardIndex + 1} 张通行卡`;
    return { kind: "card", index: nextCardIndex, x: card.x, y: card.y, label };
  }
  return { kind: "exit", x: game.exit.x + game.exit.w / 2, y: game.exit.y + game.exit.h / 2, label: "\u9003\u751f\u95e8" };
}

function drawDecoyNpc() {
  if (!game.decoy || game.decoy.timer <= 0) return;
  const d = game.decoy;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  fillRoundRect(-18, -38, 36, 48, 8, "#53645f");
  fillRoundRect(-16, -68, 32, 32, 999, "#f0d7aa");
  fillRoundRect(-24, -16, 48, 38, 6, "#f6eed5");
  ctx.fillStyle = "#e2695c";
  ctx.font = "900 14px 'Microsoft YaHei', sans-serif";
  ctx.fillText("38", -10, 8);
  ctx.restore();
  drawSpeechBubble(d.x + 24, d.y - 92, d.quote);
}
function drawTeacher(t = game.teacher) {
  if (!t) return;
  const distance = Math.hypot(game.player.x - t.x, game.player.y - t.y);
  const cloaked = game.cloakTimer > 0;
  const stunned = t.stunTimer > 0;
  const flying = t.flyTimer > 0;
  const warn = !cloaked && !stunned && !flying && distance < (game.level.alertRadius || 148);
  const lecturing = !!game.decoy && game.decoy.reached && game.decoy.timer > 0;
  const touching = !cloaked && distance < game.player.r + t.r + 24;
  ctx.fillStyle = touching ? "rgba(226,105,92,0.32)" : warn ? "rgba(226,105,92,0.18)" : "rgba(226,105,92,0.08)";
  ctx.beginPath();
  ctx.arc(t.x, t.y, warn ? (game.level.visionRadius || 126) : Math.max(96, (game.level.visionRadius || 126) - 22), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = warn ? "rgba(226,105,92,0.5)" : "rgba(226,105,92,0.18)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const lectureLean = lecturing ? Math.sin(t.step * 1.15) : 0;
  const bob = lecturing ? Math.round(Math.sin(t.step * 0.8) * 1.5) : Math.round(Math.sin(t.step) * 3);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 8, 36, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (teacherImage.complete && teacherImage.naturalWidth > 0) {
    const w = 86;
    const h = 126;
    ctx.save();
    ctx.translate(Math.round(t.x + lectureLean * 3), Math.round(t.y - h + 26 + bob));
    ctx.scale(t.facing, 1);
    if (flying) ctx.rotate(t.spin);
    else if (lecturing || stunned) ctx.rotate(lectureLean * 0.035);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(teacherImage, -w / 2, 0, w, h);
    ctx.restore();
  } else {
    drawPixelPerson(t.x, t.y + bob, "#e2695c", "#3a1713", "师");
  }
  if (stunned) {
    drawSpeechBubble(t.x + 28 * t.facing, t.y - 106, t.mutterText || "怎么这么多星星");
    ctx.save();
    ctx.fillStyle = "#f4df9f";
    ctx.font = "900 18px 'Microsoft YaHei', sans-serif";
    ctx.fillText("★  ★  ★", t.x - 30, t.y - 118);
    ctx.restore();
  } else if (warn) {
    drawSpeechBubble(t.x + 28 * t.facing, t.y - 106, "扣分!");
  } else if (t.mutterText && t.mutterTextTimer > 0) {
    drawSpeechBubble(t.x + 24 * t.facing, t.y - 106, t.mutterText);
  }
}

function drawSpeechBubble(x, y, text) {
  const width = Math.min(260, Math.max(62, text.length * 15 + 20));
  const safeX = Math.max(14, Math.min(worldW() - width - 14, x));
  const safeY = Math.max(42, Math.min(worldH() - 48, y));
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.32)";
  ctx.shadowBlur = 10;
  fillRoundRect(safeX, safeY, width, 34, 12, "rgba(15,14,11,0.9)");
  strokeRoundRect(safeX, safeY, width, 34, 12, "rgba(244,223,159,0.26)", 1.5);
  ctx.restore();
  ctx.fillStyle = "#f4df9f";
  ctx.font = "800 14px 'Microsoft YaHei', sans-serif";
  ctx.fillText(text, safeX + 10, safeY + 22);
}

function drawPlayer() {
  const p = game.player;
  const playingPhone = keys.has(" ") || touchKeys.has("phone");
  const cloaked = game.cloakTimer > 0;
  const bob = Math.round(Math.sin(performance.now() / (playingPhone ? 220 : 150)) * (playingPhone ? 1 : 2));
  ctx.save();
  ctx.fillStyle = cloaked ? "rgba(122,205,188,0.18)" : "rgba(0,0,0,0.26)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, cloaked ? 42 : 31, cloaked ? 14 : 9, 0, 0, Math.PI * 2);
  ctx.fill();
  if (cloaked) {
    ctx.strokeStyle = "rgba(154,219,208,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 34, 42 + Math.sin(performance.now() / 160) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (playerImage.complete && playerImage.naturalWidth > 0) {
    const w = 76;
    const h = 112;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y - h + 28 + bob));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 5;
    ctx.globalAlpha = cloaked ? 0.45 : 1;
    ctx.drawImage(playerImage, -w / 2, 0, w, h);
    ctx.restore();
  } else {
    drawPixelPerson(p.x, p.y + bob, "#6fc7b2", "#0b2b26", "我");
  }
}

function drawPixelPerson(x, y, shirt, dark, label) {
  const px = Math.round(x - 16);
  const py = Math.round(y - 24);
  ctx.fillStyle = "#f0d3aa";
  ctx.fillRect(px + 8, py, 16, 14);
  ctx.fillStyle = dark;
  ctx.fillRect(px + 6, py - 4, 20, 8);
  ctx.fillStyle = shirt;
  ctx.fillRect(px + 5, py + 14, 22, 24);
  ctx.fillStyle = dark;
  ctx.fillRect(px + 2, py + 18, 6, 16);
  ctx.fillRect(px + 26, py + 18, 6, 16);
  ctx.fillRect(px + 7, py + 38, 7, 12);
  ctx.fillRect(px + 19, py + 38, 7, 12);
  ctx.fillStyle = "#f6eed5";
  ctx.font = "800 12px 'Microsoft YaHei', sans-serif";
  ctx.fillText(label, px + 10, py + 31);
}

function drawPhoneHint() {
  const p = game.player;
  const playingPhone = keys.has(" ") || touchKeys.has("phone");
  if (!playingPhone) return;
  ctx.fillStyle = "rgba(111,199,178,0.16)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6fc7b2";
  ctx.fillRect(Math.round(p.x + 18), Math.round(p.y - 18), 12, 20);
  ctx.fillStyle = "#0b2b26";
  ctx.fillRect(Math.round(p.x + 20), Math.round(p.y - 15), 8, 13);
  if (game.phoneQuote && game.phoneQuoteTimer > 0) {
    drawPlayerBubble(p.x + 24, p.y - 58, game.phoneQuote);
  }
}

function drawTargetCompass() {
  const target = getNextTarget();
  const p = game.player;
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 46) return;
  const angle = Math.atan2(dy, dx);
  const x = p.x + Math.cos(angle) * 54;
  const y = p.y + Math.sin(angle) * 54;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = target.kind === "exit" ? "#67bc8b" : "#d7b56d";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, -12);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-10, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayerBubble(x, y, text) {
  const width = Math.max(86, text.length * 16 + 22);
  fillRoundRect(x, y, width, 34, 12, "rgba(8, 10, 8, 0.88)");
  strokeRoundRect(x, y, width, 34, 12, "rgba(111,199,178,0.32)", 1.5);
  ctx.fillStyle = "#6fc7b2";
  roundRect(x + 10, y + 26, 12, 12, 3);
  ctx.fill();
  ctx.fillStyle = "#f6eed5";
  ctx.font = "900 15px 'Microsoft YaHei', sans-serif";
  ctx.fillText(text, x + 12, y + 21);
}

function drawInstructionPanel() {
  ctx.fillStyle = "rgba(9,11,9,0.72)";
  ctx.fillRect(300, 40, 680, 56);
  ctx.strokeStyle = "rgba(215,181,109,0.34)";
  ctx.strokeRect(300, 40, 680, 56);
  ctx.fillStyle = "#f6eed5";
  ctx.font = "800 16px 'Microsoft YaHei', sans-serif";
  ctx.fillText("\u73a9\u6cd5\uff1a\u5de6\u4fa7\u6447\u6746\u79fb\u52a8\uff1b\u51b2\u523a\u8017\u4f53\u529b\uff1b\u6309\u4f4f\u73a9\u624b\u673a\u53ef\u6062\u590d\u5065\u5eb7\u503c\u4f46\u79fb\u901f\u51cf\u534a\uff1b\u96c6\u9f50\u76ee\u6807\u540e\u53bb\u51fa\u53e3\u3002", 322, 73);
}

function drawExitGuide() {
  const exit = game.exit;
  const pulse = Math.sin(performance.now() / 160);
  const text = game.found === game.level.cardsRequired ? "出口已开启，去右侧大门" : `先拿通行卡：还差 ${game.level.cardsRequired - game.found} 张`;
  ctx.save();
  ctx.translate(exit.x - 186 + pulse * 4, exit.y + 36);
  ctx.fillStyle = "rgba(8, 10, 8, 0.72)";
  ctx.fillRect(-182, -32, 282, 34);
  ctx.strokeStyle = "rgba(215,181,109,0.45)";
  ctx.strokeRect(-182, -32, 282, 34);
  ctx.fillStyle = "#f6eed5";
  ctx.font = "800 15px 'Microsoft YaHei', sans-serif";
  ctx.fillText(text, -170, -10);
  ctx.fillStyle = game.found === game.level.cardsRequired ? "#67bc8b" : "#d7b56d";
  ctx.beginPath();
  ctx.moveTo(112, -18);
  ctx.lineTo(152, -18);
  ctx.lineTo(152, -34);
  ctx.lineTo(190, 0);
  ctx.lineTo(152, 34);
  ctx.lineTo(152, 18);
  ctx.lineTo(112, 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  if (!game) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#080b09";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  updateWorldView();
  ctx.setTransform(scale, 0, 0, scale, viewOffsetX, viewOffsetY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawGrid();
  drawLab();
  drawCloakItem();
  drawExamItem();
  drawDrinkItem();
  drawCards();
  for (const teacher of game.teachers || [game.teacher]) drawTeacher(teacher);
  drawDecoyNpc();
  drawPlayer();
  drawPhoneHint();
  drawTargetCompass();
  drawExitGuide();
  ctx.restore();

  if (messageTimer > 0) {
    messageTimer -= 1 / 60;
  } else {
    messageEl.classList.remove("show");
  }
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function isGameplayPaused() {
  return !startEl.hidden ||
    !accountGate.hidden ||
    (nicknameGate && !nicknameGate.hidden) ||
    (codexPanel && !codexPanel.hidden) ||
    (leaderboardPanel && !leaderboardPanel.hidden) ||
    !!document.querySelector(".release-panel");
}

function syncLevelButtons() {
  levelButtons.forEach((button) => {
    const levelIndex = Number(button.dataset.level);
    const locked = !!playerSave && levelIndex >= playerSave.unlocked;
    if (!button.dataset.baseText) button.dataset.baseText = button.textContent;
    button.classList.toggle("active", levelIndex === selectedLevel);
    button.classList.toggle("locked", locked);
    button.disabled = locked;
    button.setAttribute("aria-disabled", String(locked));
    button.textContent = locked ? `${button.dataset.baseText} 锁` : button.dataset.baseText;
  });
  if (startText) {
    const level = levels[selectedLevel];
    const displayName = playerSave?.nickname ? playerSave.nickname : currentAccount;
    const accountText = currentAccount ? `${displayName} · 已解锁 ${playerSave?.unlocked || DEFAULT_UNLOCKED_LEVELS}/${levels.length} 关。` : "\u8bf7\u8f93\u5165\u8d26\u53f7\u540e\u5f00\u59cb\u3002";
    const taskName = selectedLevel >= 20 ? "\u68c0\u67e5\u70b9" : "\u901a\u884c\u5361";
    startText.textContent = `${accountText} ${level.name}：需要完成 ${level.cardsRequired} 个${taskName}。按住右侧玩手机按钮会增加健康值，但移动速度减半；越往后老师速度和视野越强。`;
  }
}

function updateBgmButton() {
  if (!bgmToggle) return;
  bgmToggle.textContent = bgmEnabled ? "BGM 开" : "BGM 关";
  bgmToggle.classList.toggle("is-muted", !bgmEnabled);
  bgmToggle.setAttribute("aria-pressed", String(bgmEnabled));
}

function ensureBgmSource() {
  if (!bgmAudio.getAttribute("src")) {
    bgmAudio.src = "./assets/kb.mp3";
    bgmAudio.loop = true;
    bgmAudio.load();
  }
}

function startHorrorBgm() {
  bgmStarted = true;
  ensureBgmSource();
  if (bgmEnabled) {
    bgmAudio.play().catch(() => {});
  }
}

function unlockBgmFromGesture() {
  if (!bgmEnabled) return;
  startHorrorBgm();
}

function toggleBgm() {
  bgmEnabled = !bgmEnabled;
  localStorage.setItem("labEscapeBgm", bgmEnabled ? "on" : "off");
  updateBgmButton();
  if (bgmEnabled) {
    startHorrorBgm();
  } else {
    bgmAudio.pause();
  }
}

function releaseSeenKey(account) {
  return `labEscapeReleaseSeen:${account}:${RELEASE_VERSION}`;
}

function showReleaseNotesIfNeeded() {
  if (!currentAccount || localStorage.getItem(releaseSeenKey(currentAccount)) === "1") return;
  const panel = document.createElement("div");
  panel.className = "release-panel";
  panel.innerHTML = `
    <div class="release-card" role="dialog" aria-modal="true" aria-label="版本更新公告">
      <p class="kicker">VERSION UPDATE</p>
      <h2>${RELEASE_VERSION} 更新公告</h2>
      <ul>${RELEASE_NOTES.map((note) => `<li>${note}</li>`).join("")}</ul>
      <button type="button">知道了</button>
    </div>
  `;
  const close = () => {
    localStorage.setItem(releaseSeenKey(currentAccount), "1");
    panel.remove();
  };
  panel.querySelector("button").addEventListener("click", close);
  panel.addEventListener("click", (event) => {
    if (event.target === panel) close();
  });
  document.body.appendChild(panel);
}

function formatRankProgress(row) {
  if (row.highestWin >= MAX_LEVELS) return "30 关全通";
  if (row.highestWin > 0) return `已通第 ${row.highestWin} 关`;
  return `已解锁第 ${row.unlocked || DEFAULT_UNLOCKED_LEVELS} 关`;
}

async function openLeaderboard() {
  if (!leaderboardPanel || !leaderboardList) return;
  leaderboardPanel.hidden = false;
  leaderboardList.textContent = "读取中...";
  try {
    const response = await fetch("/game/api/leaderboard", { cache: "no-store" });
    if (!response.ok) throw new Error("bad response");
    const data = await response.json();
    const rows = Array.isArray(data.rows) ? data.rows : [];
    leaderboardList.innerHTML = rows.length
      ? rows.slice(0, 80).map((row, index) => `
          <div class="leaderboard-row">
            <strong>${index + 1}</strong>
            <span>${row.nickname}</span>
            <em>${formatRankProgress(row)}</em>
          </div>
        `).join("")
      : "<p>还没有玩家存档。</p>";
  } catch {
    leaderboardList.textContent = "排行榜读取失败，请稍后再试。";
  }
}

function closeLeaderboard() {
  if (leaderboardPanel) leaderboardPanel.hidden = true;
}

function getContinueLevel() {
  if (!playerSave) return 0;
  for (let index = 0; index < playerSave.unlocked; index += 1) {
    if (!playerSave.wins.includes(index)) return index;
  }
  return Math.min(levels.length - 1, playerSave.unlocked - 1);
}

async function enterAccount(account) {
  currentAccount = account;
  playerSave = await loadPlayerSave(account);
  if (!playerSave.nickname) {
    accountGate.hidden = true;
    if (nicknameGate) nicknameGate.hidden = false;
    startEl.hidden = true;
    nicknameInput?.focus();
    return;
  }
  await enterGameWithSave();
}

async function enterGameWithSave() {
  selectedLevel = getContinueLevel();
  accountGate.hidden = true;
  if (nicknameGate) nicknameGate.hidden = true;
  startEl.hidden = false;
  startBtn.textContent = "继续游戏";
  resetGame();
  syncLevelButtons();
  await persistPlayerSaveNow();
  showReleaseNotesIfNeeded();
}

const rememberedAccount = localStorage.getItem("labEscapeCurrentAccount");
if (accountInput && rememberedAccount && ACCOUNT_RE.test(rememberedAccount)) {
  accountInput.value = rememberedAccount;
}
accountInput?.addEventListener("input", () => {
  accountInput.value = accountInput.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
});

accountForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const account = accountInput.value.trim();
  const submitButton = accountForm.querySelector("button");
  if (!ACCOUNT_RE.test(account)) {
    accountError.textContent = "账号只能使用 1-10 位数字或字母。";
    accountInput.focus();
    return;
  }
  accountError.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "读取存档中";
  try {
    await enterAccount(account);
  } catch {
    accountError.textContent = "存档读取失败，请稍后再试。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "进入游戏";
  }
});

nicknameInput?.addEventListener("input", () => {
  nicknameInput.value = nicknameInput.value.slice(0, 12);
});

nicknameForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nickname = nicknameInput.value.trim();
  const submitButton = nicknameForm.querySelector("button");
  if (!NICKNAME_RE.test(nickname)) {
    nicknameError.textContent = "昵称需为 1-12 位，可使用中文、字母、数字、空格、下划线或短横线。";
    nicknameInput.focus();
    return;
  }
  nicknameError.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "保存中";
  try {
    playerSave.nickname = nickname;
    const saved = await persistPlayerSaveNow();
    if (!saved || !playerSave.nickname) throw new Error("nickname save failed");
    await enterGameWithSave();
  } catch {
    nicknameError.textContent = "昵称保存失败，请稍后再试。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "保存昵称";
  }
});

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const levelIndex = Number(button.dataset.level);
    if (playerSave && levelIndex >= playerSave.unlocked) return;
    selectedLevel = levelIndex;
    startBtn.textContent = "开始游戏";
    syncLevelButtons();
  });
});

startBtn.addEventListener("click", () => {
  if (!currentAccount) {
    accountGate.hidden = false;
    startEl.hidden = true;
    accountInput?.focus();
    return;
  }
  if (playerSave && selectedLevel >= playerSave.unlocked) {
    selectedLevel = getContinueLevel();
    syncLevelButtons();
    return;
  }
  startHorrorBgm();
  startEl.hidden = true;
  startBtn.textContent = "开始游戏";
  resetGame();
});

startBtn.addEventListener("pointerdown", unlockBgmFromGesture, { passive: true });
document.addEventListener("pointerdown", unlockBgmFromGesture, { once: true, passive: true, capture: true });
document.addEventListener("touchstart", unlockBgmFromGesture, { once: true, passive: true, capture: true });

bgmToggle?.addEventListener("click", (event) => {
  event.preventDefault();
  toggleBgm();
});

zoomOutButton?.addEventListener("click", () => {
  changeViewZoom(-VIEW_ZOOM_STEP);
});

zoomInButton?.addEventListener("click", () => {
  changeViewZoom(VIEW_ZOOM_STEP);
});

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
  keys.delete(event.key);
});

function setStick(clientX, clientY) {
  const box = joystick.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const max = box.width * 0.32;
  const dist = Math.min(max, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const sx = Math.cos(angle) * dist;
  const sy = Math.sin(angle) * dist;
  joystickVector.x = sx / max;
  joystickVector.y = sy / max;
  stick.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
}

function resetStick() {
  joystickVector.x = 0;
  joystickVector.y = 0;
  stick.style.transform = "translate(-50%, -50%)";
}

function playButtonJelly(button) {
  button.classList.remove("is-jelly");
  void button.offsetWidth;
  button.classList.add("is-jelly");
}

function vibrateSprint() {
  if ("vibrate" in navigator) {
    navigator.vibrate([18, 35, 18]);
  }
}

joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  joystick.setPointerCapture(event.pointerId);
  setStick(event.clientX, event.clientY);
});

joystick.addEventListener("pointermove", (event) => {
  if (event.buttons) setStick(event.clientX, event.clientY);
});

joystick.addEventListener("pointerup", resetStick);
joystick.addEventListener("pointercancel", resetStick);

phoneButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  playButtonJelly(phoneButton);
  touchKeys.add("phone");
  phoneButton.setPointerCapture(event.pointerId);
});
phoneButton.addEventListener("pointerup", () => touchKeys.delete("phone"));
phoneButton.addEventListener("pointercancel", () => touchKeys.delete("phone"));
phoneButton.addEventListener("contextmenu", (event) => event.preventDefault());
phoneButton.addEventListener("selectstart", (event) => event.preventDefault());

sprintButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  playButtonJelly(sprintButton);
  vibrateSprint();
  touchKeys.add("sprint");
  sprintButton.setPointerCapture(event.pointerId);
});
sprintButton.addEventListener("pointerup", () => touchKeys.delete("sprint"));
sprintButton.addEventListener("pointercancel", () => touchKeys.delete("sprint"));
sprintButton.addEventListener("contextmenu", (event) => event.preventDefault());

cloakButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  playButtonJelly(cloakButton);
  useCloak();
});
cloakButton?.addEventListener("contextmenu", (event) => event.preventDefault());

examButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  playButtonJelly(examButton);
  useExam();
});
examButton?.addEventListener("contextmenu", (event) => event.preventDefault());

drinkButton?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  playButtonJelly(drinkButton);
  useDrink();
});
drinkButton?.addEventListener("contextmenu", (event) => event.preventDefault());

codexButton?.addEventListener("click", () => {
  codexPanel.hidden = false;
});
codexClose?.addEventListener("click", () => {
  codexPanel.hidden = true;
});
codexPanel?.addEventListener("click", (event) => {
  if (event.target === codexPanel) codexPanel.hidden = true;
});

leaderboardButton?.addEventListener("click", openLeaderboard);
leaderboardHomeButton?.addEventListener("click", openLeaderboard);
leaderboardStartButton?.addEventListener("click", openLeaderboard);
leaderboardClose?.addEventListener("click", closeLeaderboard);
leaderboardPanel?.addEventListener("click", (event) => {
  if (event.target === leaderboardPanel) closeLeaderboard();
});

window.addEventListener("blur", () => {
  touchKeys.delete("phone");
  touchKeys.delete("sprint");
});

window.addEventListener("resize", resizeCanvas);
teacherImage.addEventListener("load", draw);
playerImage.addEventListener("load", draw);
resizeCanvas();
syncLevelButtons();
updateBgmButton();
resetGame();
draw();
requestAnimationFrame(loop);
