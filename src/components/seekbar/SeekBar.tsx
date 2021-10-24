import * as React from 'react';
import './SeekBar.scss';
interface Props {
  onChange: (value: number) => void;
  onHover: (value: number) => void;
  disable: boolean;
  isTouch: boolean;
  value: number;
  min: number;
  max: number;
  step: number;

  marks: Array<number>;
  ranges: Array<{ start: number; end: number }>;
}

interface State {
  dragging: boolean;
  value: number;
  hoveredWidth: number;
  hovering: boolean;
  focused: boolean;
  animate: boolean;
}

const knobInactive = 0;
const knobActive = 14;
const interactivePaddingX = 30;
const interactivePaddingY = 30;
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
  nextValue = Math.min(Math.max.apply(0, arr), nextValue);
  return nextValue;
}

const previous = (arr: Array<number>, currentValue: number, step: number) => {
  let prevValue = Math.min(...arr);
  for (let i = 0; i < arr.length; i++) {
    const mark = arr[i];
    if (currentValue > mark + 2 * step && mark > prevValue) {
      prevValue = mark
    }
  }
  prevValue = Math.max(Math.min.apply(0, arr), prevValue);
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
      animate: false,
      value: this.props.value,
      hoveredWidth: 0,
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
      this.onLocalChange(newProps.value);
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
    if (this.interactiveDiv) {
      this.interactiveDiv.setPointerCapture(event.pointerId);
      if (!this.interactiveDiv.hasPointerCapture(event.pointerId)) {
        return;
      }
      this.interactiveDiv.addEventListener("pointermove", this.keepDragging);
      //@ts-ignore
      document.getElementById("drag").innerText = "start dragging";
      //@ts-ignore
      document.getElementById("pointer").innerText = event.pointerId;
      //@ts-ignore
      document.getElementById("capture").innerText = this.interactiveDiv.hasPointerCapture(event.pointerId) ? "Capturing" : "Not Capturing";
      this.setState({ dragging: true, animate: true });
      this.setvalueFromPointerEvent(event, true);
    }
  }

  keepDragging = (event: any): void => {
    if (this.interactiveDiv) {
      //@ts-ignore
      document.getElementById("drag").innerText = "dragging";
      //@ts-ignore
      document.getElementById("capture").innerText = this.interactiveDiv.hasPointerCapture(event.pointerId) ? "Capturing" : "Not Capturing";
      this.setState({ animate: false })
      this.setvalueFromPointerEvent(event, true);
    }
  }

  stopDragging = (event: any): void => {
    if (this.interactiveDiv) {
      this.interactiveDiv.removeEventListener("pointermove", this.keepDragging);
      if (!this.interactiveDiv.hasPointerCapture(event.pointerId)) {
        return;
      }
      this.interactiveDiv.releasePointerCapture(event.pointerId);

      //@ts-ignore
      document.getElementById("drag").innerText = "stop dragging";
      //@ts-ignore
      document.getElementById("capture").innerText = this.interactiveDiv.hasPointerCapture(event.pointerId) ? "Capturing" : "Not Capturing";
      this.setState({ dragging: false, animate: false });
      this.setvalueFromPointerEvent(event, false);
      setTimeout(() => { this.interactiveDiv?.blur(); }, 1);
    }
  }

  setvalueFromPointerEvent = async (event: any, local = true): Promise<void> => {
    if (this.interactiveDiv) {
      const left = this.state.hoveredWidth || event.clientX - event.currentTarget.getBoundingClientRect().left;
      const value = (this.state.hoveredWidth || left) - interactivePaddingX;
      const width = this.interactiveDiv.getBoundingClientRect().width - 2 * interactivePaddingX;
      const newValue = (this.props.max - this.props.min) * (value / width);

      if(local) {
        this.onLocalChange(newValue);
      } else {
        this.onChange(newValue);
      }
    }
  }

  getHoveredPercentage = () => {
    if (this.interactiveDiv) {
      const value = this.state.hoveredWidth;
      const max = this.interactiveDiv.getBoundingClientRect().width;
      let percentage = (value - interactivePaddingX) / (max - 2 * interactivePaddingX) * 100;
      if (percentage < 0) {
        percentage = 0;
      }
      if (percentage > 100) {
        percentage = 100;
      }
      if(this.state.hovering) {
        this.props.onHover(percentage);
      }
      return percentage;
    } else {
      if(this.state.hovering) {
        this.props.onHover(0);
      }
      return 0;
    }
  }

  getValuePercentage = () => {
    return this.state.value * 100 / this.props.max;
  }

  getRangeWidthPercentage = (range: {start: number; end: number}) => {
    const {start, end} = range;
    const rangeWidth = end - start;
    const totalWidth = this.props.max - this.props.min;
    return rangeWidth * 100 / totalWidth;
  }

  getRangeLeftPercentage = (range: {start: number; end: number}) => {
    const {start} = range;
    return start * 100 / this.props.max;
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
    const { max, min, isTouch, disable, marks, ranges } = this.props;
    const disableHoverInteractions = isTouch || disable;
    const disablePointerInteractions = disable;

    const { hovering, dragging, focused, animate } = this.state;

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
           ${animate ? 'animate' : ''}
          `
          }
          style={{
            paddingLeft: `${interactivePaddingX}px`,
            paddingRight: `${interactivePaddingX}px`,
            paddingTop: `${interactivePaddingY}px`,
            paddingBottom: `${interactivePaddingY}px`,
          }}
          ref={this.setInteractiveElement}
          onMouseEnter={disableHoverInteractions ? () => { } : this.onHoverStart}
          onMouseLeave={disableHoverInteractions ? () => { } : this.onHoverEnd}
          onMouseMove={disableHoverInteractions ? () => { } : this.onHover}
          aria-label={`${this.state.value}`}
          onPointerDown={disablePointerInteractions ? () => { } : this.startDragging}
          onPointerUp={disablePointerInteractions ? () => { } : this.stopDragging}
          onFocus={() => this.setState({ focused: true })}
          onBlur={() => this.setState({ focused: false })}
          tabIndex={0}
          role='slider'
        >
          <div id="progress-bar">

            <div id="progress-bar-list">
              <div id="all" style={{ width: `100%` }} />
              <div id="hovered" style={{ width: `${this.getHoveredPercentage()}%` }} />
              <div id="played" style={{ width: `${this.getValuePercentage()}%` }} />
              {marks.map(mark => (
                <div key={mark} style={{ left: `${this.getMarkPercentage(mark)}%` }} className={mark === min || mark === max ? '' : 'mark'} />
              ))}

              {ranges.map(range => (
                <div 
                  key={range.start * range.end * Math.random() * Math.random() * Math.random()} 
                  style={{ width: `${this.getRangeWidthPercentage(range)}%`, left: `${this.getRangeLeftPercentage(range)}%` }}
                  className='range'
                />
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
          <p>marks {marks.length}: {marks.sort().toString()}</p>
          <p>focused: {focused ? "YES" : "NO"}</p>
          <p>min: {min}</p>
          <p>max: {max}</p>
          <p>step: {this.props.step}</p>
          {this.props.isTouch && <p>Touch</p>}
          {this.interactiveDiv && <p>progresbar width with padding: {this.interactiveDiv.clientWidth}</p>}
          {this.interactiveDiv && <p>progresbar width without padding: {this.interactiveDiv.clientWidth - 2 * interactivePaddingX}</p>}
        </div>
      </>
    );
  }

  shiftNext = (): void => {
    const newValue = next([this.props.min, this.props.max, ...this.props.marks], this.state.value);
    this.onChange(newValue);
  }

  shiftPrevious = (): void => {
    const newValue = previous([this.props.min, this.props.max, ...this.props.marks], this.state.value, this.props.step);
    this.onChange(newValue);
  }

  shiftUp = (by: number = this.props.step): void => {
    const newValue = this.state.value + by;
    this.onChange(newValue);
  }

  shiftDown = (by: number = this.props.step): void => {
    const newValue = this.state.value - by;
    this.onChange(newValue);
  }

  shiftMax = (): void => {
    const newValue = this.props.max;
    this.onChange(newValue);
  }

  shiftMin = (): void => {
    const newValue = this.props.min;
    this.onChange(newValue);
  }

  onChange = (newValue: number) => {
    this.setState({
      value: this.Value(newValue)
    }, () => {
      this.props.onChange(this.state.value);
    });
  }

  onLocalChange = (newValue: number) => {
    this.setState({
      value: this.Value(newValue)
    });
  }

  Value = (value: number): number => {

    if (value < this.props.min) {
      value = this.props.min;
    }

    if (value > this.props.max) {
      value = this.props.max;
    }

    return valueRound(value, this.props.step);
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
