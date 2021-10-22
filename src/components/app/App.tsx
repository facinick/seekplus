import React, { useRef } from 'react';
import { useEffect, useState } from 'react';
import './App.scss';
import { SeekBar } from '../seekbar/SeekBar';
import { isTouch } from '../../utils';

function App() {

  const [currentDuration, set_currentDuration] = useState(20);
  const [is_touch, set_is_touch] = useState(isTouch());
  const totalDuration = 120;
  const [step, set_step] = useState(1);
  const [disable, set_disable] = useState(false);

  return (
    <main>
        <div id="progress-container">
          {/* <input min={0} max={totalDuration} step={1} onChange={(event) => set_currentDuration(Number(event.target.value))} value={currentDuration} id="seekbarinput" />
          <button>{`-${step}`}</button>
          <button>{`Max`}</button>
          <button>{`Min`}</button>
          <button onClick={() => set_disable(!disable)} >{`${disable ? "enable" : "disable"}`}</button> */}
          <SeekBar onChange={(value: number) => set_currentDuration(value)} disable={disable} isTouch={is_touch} value={currentDuration} min={0} max={totalDuration} step={step} />
        </div>
    </main>
  );
}

export default App;
