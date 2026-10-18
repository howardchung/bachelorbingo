import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const GRID_SIZE = 25;
const CENTER = Math.floor(GRID_SIZE / 2);
const STORAGE_KEY = "bachelorbingo-state";
const SHEET_URL =
  "https://googlesheet.howardzchung.workers.dev/?url=https://sheets.googleapis.com/v4/spreadsheets/1-B1WtsDnlxpx72KJmqmjKtSxqfVAP37AeB-tIFWU8-o/values/Sheet1";

// FIX: previously hard-coded to 5 squares per line; now works for any square grid
function countBingo(toggles: boolean[]) {
  const side = Math.round(Math.sqrt(toggles.length));
  const lines: number[][] = [];
  for (let r = 0; r < side; r++) {
    lines.push(Array.from({ length: side }, (_, c) => r * side + c));
  }
  for (let c = 0; c < side; c++) {
    lines.push(Array.from({ length: side }, (_, r) => r * side + c));
  }
  lines.push(Array.from({ length: side }, (_, i) => i * (side + 1)));
  lines.push(Array.from({ length: side }, (_, i) => (i + 1) * (side - 1)));
  return lines.filter((line) => line.every((i) => toggles[i])).length;
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// FIX: wake lock is released when the tab is hidden, so re-acquire on return.
// Also no longer runs at import time / crashes on unsupported browsers.
function useWakeLock() {
  useEffect(() => {
    let lock: any = null;
    const request = async () => {
      try {
        if ("wakeLock" in navigator) {
          lock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err: any) {
        console.log(`${err.name}, ${err.message}`);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

function itemsForSet(values: any[][], setIndex: number): string[] {
  return values
    .slice(1) // FIX: skip the header row so set names never appear as squares
    .filter((row) => Number(row[setIndex + 1]))
    .map((row) => row[0])
    .filter(Boolean);
}

function App() {
  const [values, setValues] = useState<any[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [sets, setSets] = useState<string[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [toggles, setToggles] = useState<boolean[]>(
    new Array(GRID_SIZE).fill(false)
  );
  const [showFireworks, setShowFireworks] = useState(false);
  const fireworkTimer = useRef<number | undefined>(undefined);

  useWakeLock();

  const load = useCallback(async () => {
    setError(null);
    try {
      const resp = await fetch(SHEET_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!data?.values?.length) throw new Error("Empty sheet");
      setValues(data.values);
      setSets(data.values[0].filter(Boolean));
    } catch (e) {
      console.warn(e);
      setError("Couldn't load squares. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => window.clearTimeout(fireworkTimer.current), []);

  const resetCard = useCallback(
    (ind: number, vals: any[][]) => {
      const newItems = itemsForSet(vals, ind);
      setItems(newItems);
      setIndex(ind);
      const picked = shuffle(newItems.map((_, i) => i)).slice(0, GRID_SIZE - 1);
      // FIX: pad if a set has fewer than 24 squares so the grid never breaks
      while (picked.length < GRID_SIZE - 1) {
        picked.push(-2);
      }
      picked.splice(CENTER, 0, -1); // The Bachelor goes in the middle
      setBoard(picked);
      const t = new Array(GRID_SIZE).fill(false);
      t[CENTER] = true;
      setToggles(t);
      setShowFireworks(false);
    },
    []
  );

  // Restore saved game (or start fresh) once the sheet has loaded
  useEffect(() => {
    if (!values) return;
    try {
      const obj = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const restoredItems = itemsForSet(values, obj?.index ?? 0);
      const valid =
        obj &&
        Array.isArray(obj.selected) &&
        obj.selected.length === GRID_SIZE &&
        Array.isArray(obj.toggles) &&
        obj.toggles.length === GRID_SIZE &&
        // FIX: ignore saved boards that point past the (possibly edited) sheet
        obj.selected.every((n: number) => n < restoredItems.length);
      if (valid) {
        setBoard(obj.selected);
        setToggles(obj.toggles);
        setIndex(obj.index);
        setItems(restoredItems);
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    resetCard(0, values);
  }, [values, resetCard]);

  useEffect(() => {
    if (!board.length) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selected: board, toggles, index })
      );
    } catch (e) {
      // storage full / private mode — game still works
      console.warn(e);
    }
  }, [board, toggles, index]);

  const toggle = (i: number) => {
    if (board[i] === -1 || board[i] === -2) return;
    const next = [...toggles];
    next[i] = !next[i];
    setToggles(next);
    if (countBingo(next) > countBingo(toggles)) {
      setShowFireworks(true);
      window.clearTimeout(fireworkTimer.current);
      fireworkTimer.current = window.setTimeout(
        () => setShowFireworks(false),
        4000
      );
    }
    navigator.vibrate?.(next[i] ? 40 : 15);
  };

  const bingos = countBingo(toggles);

  return (
    <div className="App">
      <header className="header">
        <h1>Bachelor(ette) Bingo</h1>
        <p className="count" aria-live="polite">
          {bingos === 0 ? "Tap a square when it happens" : `${bingos} bingo${bingos > 1 ? "s" : ""}!`}
        </p>
      </header>

      {error && (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button onClick={load}>Try again</button>
        </div>
      )}

      {!error && !board.length && <p className="notice">Loading squares…</p>}

      {board.length > 0 && (
        <div className="bingoCard">
          {board.map((itemIndex, i) => {
            if (itemIndex === -1) {
              return (
                <div key={i} className="cardItem free selected">
                  <img src="./jesse.jpg" alt="The Bachelor(ette)" />
                </div>
              );
            }
            if (itemIndex === -2) {
              return <div key={i} className="cardItem empty" />;
            }
            return (
              <button
                type="button"
                className={toggles[i] ? "cardItem selected" : "cardItem"}
                key={i}
                aria-pressed={toggles[i]}
                onClick={() => toggle(i)}
              >
                <span>{items[itemIndex]}</span>
              </button>
            );
          })}
        </div>
      )}

      {sets.length > 0 && (
        <nav className="sets" aria-label="Choose a new card">
          <p className="setsLabel">New card</p>
          <div className="setsList">
            {sets.map((set, i) => (
              <button
                key={set}
                className={i === index ? "active" : ""}
                onClick={() => {
                  if (values && confirm("Start a new card? Your current progress will be lost.")) {
                    resetCard(i, values);
                  }
                }}
              >
                {set}
              </button>
            ))}
          </div>
        </nav>
      )}

      {showFireworks && (
        <div className="fireworks" aria-hidden="true">
          <div className="firework" />
          <div className="firework" />
          <div className="firework" />
          <div className="bingoBanner">BINGO!</div>
        </div>
      )}
    </div>
  );
}

export default App;
