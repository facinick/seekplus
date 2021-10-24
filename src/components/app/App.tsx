import React from 'react';
import './App.scss';
import { SeekBar } from '../seekbar/SeekBar';
import { isTouch } from '../../utils';

interface Props {

}
interface State {
  currentDuration: number;
  totalDuration: number;
  step: number;
  is_touch: boolean;
  disable: boolean;
}

class App extends React.Component<Props, State> {

  seekbar: SeekBar | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      currentDuration: 0,
      is_touch: isTouch(),
      totalDuration: 120,
      step: 1,
      disable: false
    }

    setInterval(()=>{
      this.setState(({currentDuration}) => ({
        currentDuration: (currentDuration + 1) % ( this.state.totalDuration + 1)
      }));
    }, 1000);
  }

  setSeekbar = (component: SeekBar): void => {
    if (!this.seekbar && component) {
      this.seekbar = component;
    }
  }

  render(): JSX.Element {
    const { currentDuration, is_touch, totalDuration, step, disable } = this.state;

    return (
      <main>
        <div id="progress-controls-container">
          <input readOnly min={0} max={totalDuration} step={1} onChange={(event) => this.setState({ currentDuration: Number(event.target.value) })} value={currentDuration} id="seekbarinput" />
          <button onClick={(event) => { this.seekbar?.shiftDown() }} >{`-${step}`}</button>
          <button onClick={(event) => { this.seekbar?.shiftUp() }} >{`+${step}`}</button>
          <button onClick={(event) => { this.seekbar?.shiftMax() }} >{`Max`}</button>
          <button onClick={(event) => { this.seekbar?.shiftMin() }} >{`Min`}</button>
          <button onClick={(event) => { this.seekbar?.shiftPrevious() }} >{`Prev`}</button>
          <button onClick={(event) => { this.seekbar?.shiftNext() }} >{`Next`}</button>
          <button onClick={() => this.setState((oldState: State) => ({ disable: !oldState.disable }))} >{`${disable ? "enable" : "disable"}`}</button>
        </div>
        <div id="progress-container">
          <SeekBar ranges={[{start: 60, end: 90}]} marks={[20, 34]} ref={this.setSeekbar} onChange={(value: number) => { 
            console.log(value);
            this.setState({ currentDuration: value }); }} disable={disable} isTouch={is_touch} value={currentDuration} min={0} max={totalDuration} step={step} />
        </div>
        <span id="cur-value"> {currentDuration} </span>
      </main>
    );
  }

}

export default App;
