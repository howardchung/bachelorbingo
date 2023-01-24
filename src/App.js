import { useCallback, useEffect, useState } from 'react';
import './App.css';

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const items = [
  '"right reasons"',
  'parents mentioned',
  'kiss',
  'tears',
  'sent home directly',
  '"journey / process"',
  '"falling"',
  '"it\'s the final rose"',
  '"best friend"',
  '"future wife"',
  '"my person"',
  'Zach takes his shirt off',
  'accused of starting drama',
  'something weird with food',
  'guest musical appearance',
  'childhood picture',
  'fireworks',
  'awkward dancing',
  'airplane / helicopter / boat date',
  'insulting someone\'s outfit',
  'hot tub',
  'cocktail party cancelled',
  'talk with producers',
  'asks Jesse for advice',
  '"can I steal you"',
  'Bachelor(ette) alum appearance',
  'Rachel mentioned',
  'live animals',
  'baby dolls',
  'truth / honesty mentioned',
];

function App() {
  const [selected, setSelected] =  useState(items);
  const [toggles, setToggles] = useState(new Array(25).fill(false));
  
  const toggle = useCallback((i) => {
    const newToggles = [...toggles];
    newToggles[i] = !toggles[i];
    setToggles(newToggles);
    // console.log(newToggles, i);
  }, [toggles, setToggles]);

  const resetCard = useCallback(() => {
    // Shuffle the list and select 24 items
    const nSelected = shuffle(items).slice(0, 24);
    // Put Zach in the middle
    nSelected.splice(12, 0, 'ZACH');
    setSelected(nSelected);
    const newToggles = new Array(25).fill(false);
    newToggles[12] = true;
    setToggles(newToggles);
  }, [setSelected, setToggles]);
  
  useEffect(resetCard, []);

  return (
    <div className="App">
      <h1>Bachelor Bingo</h1> 
      <div className="bingoCard">
        {selected.map((item, i) => {
          if (item === 'ZACH') {
            return <img src="./zach.jpg" style={{ width: '100%', height: '100%' }} />
          }
          return <div className={toggles[i] ? 'selected cardItem' : 'cardItem'} key={i} onClick={() => toggle(i)}>{item}</div>;
        })}
      </div>
      <p>
      <button onClick={resetCard}>New Card</button>
      </p>
    </div>
  );
}

export default App;
