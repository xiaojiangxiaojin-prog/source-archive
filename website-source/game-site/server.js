const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 80);
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const accountPattern = /^[A-Za-z0-9]{1,10}$/;
const nicknamePattern = /^[\p{L}\p{N}_\-\s]{1,12}$/u;
const maxLevel = 30;
const defaultUnlocked = 3;
const adminAccounts = new Set(["jjq666"]);

app.use(express.json({ limit: "32kb" }));

function cleanSave(account, input = {}) {
  const unlocked = Number.isFinite(input.unlocked) ? Math.floor(input.unlocked) : defaultUnlocked;
  const wins = Array.isArray(input.wins)
    ? input.wins.filter((level) => Number.isInteger(level) && level >= 0 && level < maxLevel)
    : [];
  const highestUnlockedFromWins = wins.length ? Math.min(maxLevel, Math.max(...wins) + 2) : defaultUnlocked;
  const firstReachedAt = {};
  if (input.firstReachedAt && typeof input.firstReachedAt === "object") {
    for (const [key, value] of Object.entries(input.firstReachedAt)) {
      const level = Number(key);
      if (Number.isInteger(level) && level >= 0 && level < maxLevel && Number.isFinite(value)) {
        firstReachedAt[String(level)] = value;
      }
    }
  }
  return {
    account,
    nickname: typeof input.nickname === "string" && nicknamePattern.test(input.nickname.trim())
      ? input.nickname.trim()
      : "",
    unlocked: adminAccounts.has(account) ? maxLevel : Math.min(maxLevel, Math.max(defaultUnlocked, unlocked, highestUnlockedFromWins)),
    wins: [...new Set(wins)].sort((a, b) => a - b),
    firstReachedAt,
    updatedAt: Date.now(),
  };
}

function cleanSaveForRead(account, input = {}) {
  const save = cleanSave(account, input);
  const updatedAt = Number.isFinite(input.updatedAt) ? input.updatedAt : save.updatedAt;
  return { ...save, updatedAt };
}

function savePath(account) {
  return path.join(dataDir, `${account}.json`);
}

async function readSave(req, res) {
  const account = req.params.account;
  if (!accountPattern.test(account)) {
    res.status(400).json({ error: "invalid_account" });
    return;
  }
  try {
    const raw = await fs.readFile(savePath(account), "utf8");
    res.json(cleanSaveForRead(account, JSON.parse(raw)));
  } catch {
    res.json(cleanSave(account));
  }
}

async function writeSave(req, res) {
  const account = req.params.account;
  if (!accountPattern.test(account)) {
    res.status(400).json({ error: "invalid_account" });
    return;
  }
  const save = cleanSave(account, req.body);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(savePath(account), JSON.stringify(save, null, 2), "utf8");
  res.json(save);
}

app.get(["/api/save/:account", "/game/api/save/:account"], readSave);
app.post(["/api/save/:account", "/game/api/save/:account"], writeSave);

async function leaderboard(_req, res) {
  await fs.mkdir(dataDir, { recursive: true });
  const names = await fs.readdir(dataDir);
  const rows = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const account = path.basename(name, ".json");
    if (!accountPattern.test(account)) continue;
    if (adminAccounts.has(account)) continue;
    try {
      const raw = await fs.readFile(path.join(dataDir, name), "utf8");
      const parsed = JSON.parse(raw);
      const save = cleanSaveForRead(account, parsed);
      if (!save.nickname) continue;
      const wins = save.wins;
      const highestWin = wins.length ? Math.max(...wins) + 1 : 0;
      const unlocked = Math.min(maxLevel, Math.max(defaultUnlocked, save.unlocked));
      const progress = Math.max(highestWin, Math.min(unlocked, maxLevel));
      const firstReachedAt = Number.isFinite(parsed.firstReachedAt?.[String(highestWin - 1)])
        ? parsed.firstReachedAt[String(highestWin - 1)]
        : save.updatedAt;
      rows.push({
        nickname: save.nickname,
        unlocked,
        highestWin,
        progress,
        wins,
        updatedAt: save.updatedAt,
        firstReachedAt,
      });
    } catch {}
  }
  rows.sort((a, b) =>
    b.highestWin - a.highestWin ||
    b.unlocked - a.unlocked ||
    a.firstReachedAt - b.firstReachedAt ||
    a.nickname.localeCompare(b.nickname, "zh-CN")
  );
  res.json({ maxLevel, total: rows.length, rows });
}

app.get(["/api/leaderboard", "/game/api/leaderboard"], leaderboard);

app.use(express.static(__dirname, { extensions: ["html"] }));
app.use("/game", express.static(__dirname, { extensions: ["html"] }));
app.get("/game/*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(port, () => {
  console.log(`Lab escape game running on ${port}`);
});
