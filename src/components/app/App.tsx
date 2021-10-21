import React from 'react';
import { useEffect, useState } from 'react';
import './App.scss';
import { SeekBar } from '../seekbar/SeekBar';
import { isTouch } from '../../utils';

function App() {

  const [currentDuration, set_currentDuration] = useState(20);
  const totalDuration = 180;

  const touch: boolean = isTouch();
  
  return (
    <main>
        <div id="progress-container">
          <input min={0} max={totalDuration} step={1} onChange={(event) => set_currentDuration(Number(event.target.value))} value={currentDuration} id="seekbarinput" />
          <SeekBar onChange={(value: number) => set_currentDuration(value)} disable={false} isTouch={touch} value={currentDuration} min={0} max={totalDuration} step={1} />
        </div>
    </main>
  );
}

export default App;
