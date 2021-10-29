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

  paddingX: number;
  paddingY: number;
  phinactive: number;
  phscale: number;
  dotactive: number;
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
      disable: false,
      paddingX: 30,
      paddingY: 30,
      phinactive: 10,
      phscale: 2,
      dotactive: 30,
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
          <input placeholder={'padding x'} onChange={(event) => this.setState({ paddingX: Number(event.target.value) })} id="seekbarinput" />
          <input placeholder={'padding y'} onChange={(event) => this.setState({ paddingY: Number(event.target.value) })} id="seekbarinput" />
          <input placeholder={'prog bar height inactive'} onChange={(event) => this.setState({ phinactive: Number(event.target.value) })} id="seekbarinput" />
          <input placeholder={'prog bar height scale'} onChange={(event) => this.setState({ phscale: Number(event.target.value) })} id="seekbarinput" />
          <input placeholder={'prog dot size active'} onChange={(event) => this.setState({ dotactive: Number(event.target.value) })} id="seekbarinput" />
          <button onClick={(event) => { this.seekbar?.shiftDown() }} >{`-${step}`}</button>
          <button onClick={(event) => { this.seekbar?.shiftUp() }} >{`+${step}`}</button>
          <button onClick={(event) => { this.seekbar?.shiftMax() }} >{`Max`}</button>
          <button onClick={(event) => { this.seekbar?.shiftMin() }} >{`Min`}</button>
          <button onClick={(event) => { this.seekbar?.shiftPrevious() }} >{`Prev`}</button>
          <button onClick={(event) => { this.seekbar?.shiftNext() }} >{`Next`}</button>
          <button onClick={() => this.setState((oldState: State) => ({ disable: !oldState.disable }))} >{`${disable ? "enable" : "disable"}`}</button>
        </div>
        <div id="progress-container">
          <SeekBar 
            onHover={(value) => {}} 
            ranges={[{start: 60, end: 90}, {start: 80, end: 110}]} 
            marks={[20, 34]} 
            ref={this.setSeekbar}

            onChange={(value: number) => { 
              this.setState({ currentDuration: value }); 
            }} 

            onInput={(value: number) => { 
             console.log(`value: ${value}`);
            }} 
            disable={disable} 
            isTouch={is_touch} 
            value={currentDuration}
            min={0} 
            max={totalDuration} 
            step={step} 
            styles = {{
              interactivePaddingX: this.state.paddingX,
              interactivePaddingY: this.state.paddingY,
              progressBarScaleYActive: this.state.phscale,
              progressBarHeightInactive: this.state.phinactive,
              progressDotSizeActive: this.state.dotactive,
            }}
          />
        </div>
        <span id="cur-value"> {currentDuration} </span>
      </main>
    );
  }

}

export default App;
