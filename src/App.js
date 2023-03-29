import { useCallback, useEffect, useState } from "react";
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

function App() {
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [board, setBoard] = useState([]);
  const [toggles, setToggles] = useState(new Array(GRID_SIZE).fill(false));
  const [showFireworks, setShowFireworks] = useState(false);

  const serialize = useCallback(() => {
    const str = JSON.stringify({ selected: board, toggles });
    window.localStorage.setItem("bachelorbingo-state", str);
  }, [board, toggles]);

  const deserialize = useCallback(() => {
    const str = window.localStorage.getItem("bachelorbingo-state");
    if (str) {
      try {
        const obj = JSON.parse(str);
        setBoard(obj.selected);
        setToggles(obj.toggles);
        return true;
      } catch (e) {
        console.warn(e);
      }
    }
    return false;
  }, [setBoard, setToggles]);

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

  const resetCard = useCallback(() => {
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
  }, [items, setBoard, setToggles, setShowFireworks]);

  /* eslint-disable */
  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets/1-B1WtsDnlxpx72KJmqmjKtSxqfVAP37AeB-tIFWU8-o/values/Sheet1?key=AIzaSyDAHivgQUlxM9FKaTYuzfKpOKgf0f9hpXI"
      );
      const data = await resp.json();
      setData(data);
    };
    fetchData();
  }, []);
  useEffect(() => {
    if (!data) {
      return;
    }
    // TODO choose items based on which set was used
    const items = data.values
      .map((d) => d[0])
      .filter(Boolean)
      .slice(1);
    setItems(items);
    const saved = deserialize();
    if (!saved) {
      resetCard();
    }
  }, [data]);
  /* eslint-enable */

  useEffect(() => {
    if (board.length) {
      // TODO serialize which set is being used
      serialize();
    }
  }, [board, toggles, serialize]);

  return (
    <div className="App">
      <h1>Bachelor Bingo</h1>
      <div className="bingoCard">
        {board.map((itemIndex, i) => {
          if (itemIndex === -1) {
            return (
              <img
                src="./zach.jpg"
                alt="The Bachelor"
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
      <p>
        <button onClick={resetCard}>New Card</button>
      </p>
      {showFireworks && (
        <div>
          <div class="firework"></div>
          <div class="firework"></div>
          <div class="firework"></div>
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
