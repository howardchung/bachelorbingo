import React, { useCallback, useEffect, useState } from "react";
import "./App.css";

const GRID_SIZE = 25;

// TODO make this handle any grid size
function countBingo(toggles) {
  // Assume a square number
  const bingos = [];
  const side = Math.sqrt(toggles.length);
  // Check rows
  for (let i = 0; i < toggles.length; i += side) {
    bingos.push([i, i + 1, i + 2, i + 3, i + 4]);
  }
  // Check columns
  for (let i = 0; i < side; i++) {
    bingos.push([i, i + side * 1, i + side * 2, i + side * 3, i + side * 4]);
  }
  // Check diagonals
  // 0, 6, 12, 18, 24
  // 4, 8, 12, 16, 20
  bingos.push([
    0,
    (side + 1) * 1,
    (side + 1) * 2,
    (side + 1) * 3,
    (side + 1) * 4,
  ]);
  bingos.push([
    (side - 1) * 1,
    (side - 1) * 2,
    (side - 1) * 3,
    (side - 1) * 4,
    (side - 1) * 5,
  ]);
  return bingos.filter((bingo) => bingo.every((i) => toggles[i])).length;
}

async function getWakeLock() {
  try {
    const wakeLock = await navigator.wakeLock.request("screen");
    console.log(wakeLock);
  } catch (err) {
    // the wake lock request fails - usually system related, such being low on battery
    console.log(`${err.name}, ${err.message}`);
  }
}
getWakeLock();

function App() {
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [board, setBoard] = useState([]);
  const [sets, setSets] = useState([]);
  const [index, setIndex] = useState(0);
  const [toggles, setToggles] = useState(new Array(GRID_SIZE).fill(false));
  const [showFireworks, setShowFireworks] = useState(false);

  const serialize = useCallback(() => {
    const str = JSON.stringify({ selected: board, toggles, index: index });
    window.localStorage.setItem("bachelorbingo-state", str);
  }, [board, toggles, index]);

  const deserialize = useCallback(() => {
    const str = window.localStorage.getItem("bachelorbingo-state");
    if (str) {
      try {
        const obj = JSON.parse(str);
        setBoard(obj.selected);
        setToggles(obj.toggles);
        setIndex(obj.index);
        const items = data.values
          .filter((d) => Number(d[obj.index + 1])) // Premiere
          .map((d) => d[0]);
        setItems(items);
        return true;
      } catch (e) {
        console.warn(e);
      }
    }
    return false;
  }, [setBoard, setToggles, setItems, setIndex, data]);

  const toggle = useCallback(
    (i) => {
      const newToggles = [...toggles];
      newToggles[i] = !toggles[i];
      setToggles(newToggles);
      // console.log(newToggles, i);
      if (countBingo(newToggles) > countBingo(toggles)) {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 4000);
      }
    },
    [toggles, setToggles]
  );

  const resetCard = useCallback(
    (index) => {
      console.log("resetCard");
      const items = data.values
        .filter((d) => Number(d[index + 1]))
        .map((d) => d[0]);
      setItems(items);
      setIndex(index);
      // Shuffle the list and select 24 items
      const newSelected = shuffle(items.map((_item, i) => i)).slice(
        0,
        GRID_SIZE - 1
      );
      // Put The Bachelor in the middle
      newSelected.splice(Math.floor(GRID_SIZE / 2), 0, -1);
      setBoard(newSelected);
      const newToggles = new Array(GRID_SIZE).fill(false);
      newToggles[Math.floor(GRID_SIZE / 2)] = true;
      setToggles(newToggles);
      setShowFireworks(false);
    },
    [data, setBoard, setToggles, setShowFireworks]
  );

  /* eslint-disable */
  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets/1-B1WtsDnlxpx72KJmqmjKtSxqfVAP37AeB-tIFWU8-o/values/Sheet1?key=AIzaSyDAHivgQUlxM9FKaTYuzfKpOKgf0f9hpXI"
      );
      const data = await resp.json();
      setData(data);
      setSets(data.values[0].filter(Boolean));
    };
    fetchData();
  }, []);
  useEffect(() => {
    if (!data) {
      return;
    }
    const saved = deserialize();
    console.log(saved);
    if (!saved) {
      resetCard(0);
    }
  }, [data]);
  /* eslint-enable */

  useEffect(() => {
    if (board.length) {
      serialize();
    }
  }, [board, toggles, serialize]);

  return (
    <div className="App">
      <h1>Bachelor(ette) Bingo</h1>
      <div className="bingoCard">
        {board.map((itemIndex, i) => {
          if (itemIndex === -1) {
            return (
              <img
                key={itemIndex}
                src="./jesse.jpg"
                alt="The Bachelor(ette)"
                style={{ width: "100%", height: "100%" }}
              />
            );
          }
          return (
            <div
              className={toggles[i] ? "selected cardItem" : "cardItem"}
              key={i}
              onClick={() => toggle(i)}
            >
              {items[itemIndex]}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "grid",
          gap: "4px",
          marginTop: "12px",
          gridAutoFlow: "column",
          gridAutoColumns: "1fr",
        }}
      >
        {sets.map((set, i) => (
          <button key={set} onClick={() => {
            if (confirm("Do you really want to reset?")) {
              resetCard(i);
            }
          }}>
            {set}
          </button>
        ))}
      </div>
      {showFireworks && (
        <div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
      )}
    </div>
  );
}

export default App;

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
