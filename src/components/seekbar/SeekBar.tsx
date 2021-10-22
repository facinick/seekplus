import * as React from 'react';
import './SeekBar.scss';
interface Props {
  onChange: (value: number) => void;
  disable: boolean;
  isTouch: boolean;
  value: number;
  min: number;
  max: number;
  step: number;
}

interface State {
  dragging: boolean;
  value: number;
  hoveredWidth: number;
  marks: Array<number>;
  hovering: boolean;
  focused: boolean;
}

const knobInactive = 0;
const knobActive = 14;
const interactivePaddingX = 10;
const interactivePaddingY = 0;
const trackHeightInactive = 6;
const trackScaleOnActive = 2;

const next = (arr: Array<number>, currentValue: number) => {
  let nextValue = Math.max(...arr);
  for (let i = 0; i < arr.length; i++) {
    const mark = arr[i];
    if (currentValue < mark && mark < nextValue) {
      nextValue = mark
    }
  }
  console.log(nextValue);
  nextValue = Math.min(Math.max.apply(0, arr),nextValue);
  return nextValue;
}

const previous = (arr: Array<number>, currentValue: number) => {
  let prevValue = Math.min(...arr);
  for (let i = 0; i < arr.length; i++) {
    const mark = arr[i];
    if (currentValue > mark && mark > prevValue) {
      prevValue = mark
    }
  }
  console.log(prevValue);
  prevValue = Math.max(Math.min.apply(0, arr),prevValue);
  return prevValue;
}

const valueRound = (value: number, step: number): number => {
  const inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}
export class SeekBar extends React.Component<Props, State> {

  interactiveDiv: HTMLDivElement | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      dragging: false,
      hovering: false,
      focused: false,
      value: this.props.value,
      hoveredWidth: 0,
      marks: [props.min, props.max, 20],
    };
    this.setupKeyboardControl();
  }

  setupKeyboardControl = (): void => {
    document.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (document.activeElement !== this.interactiveDiv) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          this.shiftUp(this.props.step * 10);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          this.shiftDown(this.props.step * 10);
          break;
      }
    }, false);
  }

  UNSAFE_componentWillReceiveProps = (newProps: Props): void => {
    if (newProps.value !== this.props.value && !this.state.dragging) {
     this.setValue(newProps.value)
    }
  };

  onHoverStart = () => {
    this.setState({
      hovering: true,
    });
  }

  onHover = (event: any) => {
    let currentTargetRect = event.currentTarget.getBoundingClientRect();
    let event_offsetX = event.clientX - currentTargetRect.left;
    this.sethoveredWidth(event_offsetX);
  }

  onHoverEnd = (event: any) => {
    this.setState({
      hovering: false,
    });
    this.sethoveredWidth(0);
  }

  startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if(this.interactiveDiv) {
      this.interactiveDiv.setPointerCapture(event.pointerId);
      this.interactiveDiv.addEventListener("pointermove", this.keepDragging);
      //@ts-ignore
      document.getElementById("drag").innerText = "start dragging";
      //@ts-ignore
      document.getElementById("pointer").innerText = event.pointerId;
       //@ts-ignore
      document.getElementById("capture").innerText = this.interactiveDiv.hasPointerCapture(event.pointerId) ? "Capturing" : "Not Capturing";
      console.log(`start dragging`);
      this.setState({ dragging: true, });
      this.setvalueFromPointerEvent();
      // setTimeout(() => { this.interactiveDiv?.focus(); }, 1);
    }
  }

  addMark = (mark: number) => {
    if(this.state.marks.indexOf(mark) > -1) {
      console.log(`mark ${mark} already exists...`);
    } else {
      const marks = this.state.marks;
      marks.push(mark);
      this.setState({
        marks,
      })
    }
  }

  removeMark = (mark: number) => {
    const marks = this.state.marks;
    const index = marks.indexOf(mark);
    if(index > -1) {
      marks.splice(index, 1);
      this.setState({
        marks,
      })
    } else {
      console.log(`mark ${mark} doesn't exist...`); 
    }
  }

  keepDragging = (event: any): void => {
    if(this.interactiveDiv) {
      console.log(`dragging`);
      //@ts-ignore
      document.getElementById("drag").innerText = "dragging";
       //@ts-ignore
      document.getElementById("capture").innerText = this.interactiveDiv.hasPointerCapture(event.pointerId) ? "Capturing" : "Not Capturing";
      this.setvalueFromPointerEvent(event);
    }
  }

  stopDragging = (event: any): void => {
    if(this.interactiveDiv) {
      this.interactiveDiv.releasePointerCapture(event.pointerId);
      this.interactiveDiv.removeEventListener("pointermove", this.keepDragging);
      //@ts-ignore
      document.getElementById("drag").innerText = "stop dragging";
      //@ts-ignore
      document.getElementById("capture").innerText = this.interactiveDiv.hasPointerCapture(event.pointerId) ? "Capturing" : "Not Capturing";
      console.log(`stop dragging`);
      this.setState({ dragging: false, });
      setTimeout(() => { this.interactiveDiv?.blur(); }, 1);
    }
  }

  setvalueFromPointerEvent = (event?: any) => {
    if(this.interactiveDiv) {
      const left = this.state.hoveredWidth || event.clientX -  event.currentTarget.getBoundingClientRect().left;
      const value = (this.state.hoveredWidth || left) - interactivePaddingX;
      const width = this.interactiveDiv.getBoundingClientRect().width - 2 * interactivePaddingX;
      const newValue = (this.props.max - this.props.min) * (value / width);
      this.setValue(newValue);
    }
  }

  getHoveredPercentage = () => {
    if (this.interactiveDiv) {
      const value = this.state.hoveredWidth;
      const max = this.interactiveDiv.getBoundingClientRect().width;
      let percentage = (value - interactivePaddingX) / (max - 2 * interactivePaddingX) * 100;
      if(percentage < 0) {
        percentage = 0;
      }
      if(percentage > 100) {
        percentage = 100;
      }
      return percentage;
    } else {
      return 0;
    }
  }

  getValuePercentage = () => {
    return this.state.value * 100 / this.props.max;
  }

  getMarkPercentage = (mark: number) => {
      const value = mark;
      const max = this.props.max - this.props.min;
      let percentage = (value) / (max) * 100;
      return percentage;

  }

  render(): JSX.Element {

    const value = this.state.value;
    const valuePercentage = value * 100 / (this.props.max);
    const hoveredWidth = this.state.hoveredWidth;
    const { max, min ,isTouch, disable} = this.props;
    const disableHoverInteractions = isTouch || disable;
    const disablePointerInteractions = disable;

    const { hovering, dragging, marks, focused } = this.state;

    return (
      <>
        <div
          id="interactive"
          className={
          `${dragging ? 'dragging' : ''} 
           ${hovering ? 'hovering' : ''}
           ${disablePointerInteractions ? 'disable' : ''}
           ${focused ? 'focused' : ''}
           ${isTouch ? 'touch' : ''}
          `
          }
          style={{
            paddingLeft: `${interactivePaddingX}px`,
            paddingRight: `${interactivePaddingX}px`,
            paddingTop: `${interactivePaddingY}px`,
            paddingBottom: `${interactivePaddingY}px`,
          }}
          ref={this.setInteractiveElement}
          onMouseEnter={disableHoverInteractions ? () => {} : this.onHoverStart }
          onMouseLeave={disableHoverInteractions ? () => {} : this.onHoverEnd}
          onMouseMove={disableHoverInteractions ? () => {} : this.onHover}
          aria-label={`${this.state.value}`}
          onPointerDown={disablePointerInteractions ? () => {} : this.startDragging}
          onPointerUp={disablePointerInteractions ? () => {} : this.stopDragging}
          onFocus={()=> this.setState({focused: true})}
          onBlur={()=> this.setState({focused: false})}
          tabIndex={0}
          role='slider'
        >
          <div id="progress-bar">

            <div id="progress-bar-list">
              <div id="all" style={{ width: `100%` }} />
              <div id="hovered" style={{ width: `${this.getHoveredPercentage()}%` }} />
              <div id="played" style={{ width: `${this.getValuePercentage()}%` }} />
              {marks.map(mark => (
                <div key={mark} style={{left: `${this.getMarkPercentage(mark)}%`}} className={mark === min || mark === max ? '' : 'mark'} />
              ))}
            </div>

            <div
              aria-label={`${this.state.value}`}
              id="progress-dot"
              style={{ left: `${this.getValuePercentage()}%`, }}
            />
          </div>

        </div>

        <div id="debug">
          <p id="drag"> </p>
          <p id="pointer"> </p>
          <p id="capture"></p>
          <p>value: {this.state.value}</p>
          <p>valuePercentage: {this.getValuePercentage()}%</p>
          <p>hoveredWidth: {hoveredWidth}px</p>
          <p>hoveredPercentage: {this.getHoveredPercentage()}%</p>
          {dragging && <p>dragging</p>}
          {hovering && <p>hovering</p>}
          <p>marks: {this.state.marks}</p>
          <p>focused: {focused ? "YES" : "NO"}</p>
          <p>min: {min}</p>
          <p>max: {max}</p>
          <p>step: {this.props.step}</p>
          {this.props.isTouch && <p>Touch</p>} 
          { this.interactiveDiv && <p>progresbar width with padding: {this.interactiveDiv.clientWidth}</p>}
          { this.interactiveDiv && <p>progresbar width without padding: {this.interactiveDiv.clientWidth - 2 * interactivePaddingX}</p>}
        </div>
      </>
    );
  }

  shiftNext = (): void => {
    const newValue = next(this.state.marks, this.state.value);

    this.setValue(newValue);
  }

  shiftPrevious = (): void => {
    const newValue = previous(this.state.marks, this.state.value);

    this.setValue(newValue);
  }

  shiftUp = (by: number = this.props.step): void => {
    const newValue = this.state.value + by;
    this.setValue(newValue);
  }

  shiftDown = (by: number = this.props.step): void => {
    const newValue = this.state.value - by;
    this.setValue(newValue);
  }

  shiftMax = (): void => {
    const newValue = this.props.max;
    this.setValue(newValue);
  }

  shiftMin = (): void => {
    const newValue = this.props.min;
    this.setValue(newValue);
  }

  setValue = (value: number): void => {
    if (value < this.props.min) {
      value = this.props.min;
    }
    if (value > this.props.max) {
      value = this.props.max;
    }
    if (this.state.value === valueRound(value, this.props.step)) {
      return;
    }
    this.setState({ value: valueRound(value, this.props.step)}, () => {
      this.props.onChange(this.state.value);
    });
  }

  sethoveredWidth = (value: number): void => {
    const width = this.interactiveDiv?.clientWidth;
    if (width) {
      if (value < 0) {
        value = 0;
      }
      if (value > width) {
        value = width;
      }
      if (this.state.hoveredWidth === valueRound(value, 1)) {
        return;
      }
      this.setState({ hoveredWidth: valueRound(value, 1) });
    }
  }

  setInteractiveElement = (element: HTMLDivElement): void => {
    if (!this.interactiveDiv && element) {
      this.interactiveDiv = element;
    }
  };
}
