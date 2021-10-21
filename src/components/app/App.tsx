import React from 'react';
import { useEffect, useState } from 'react';
import './App.scss';
import { SeekBar } from '../seekbar/SeekBar';

function App() {

  const [currentDuration, set_currentDuration] = useState(20);
  const totalDuration = 180;
  
  return (
    <div>
      <main>
        <div id="progress-container">
          <SeekBar disable={false} isTouch={false} value={currentDuration} min={0} max={totalDuration} step={1} />
        </div>
      </main>
    </div>
  );
}

export default App;
