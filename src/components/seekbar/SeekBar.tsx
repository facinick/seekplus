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
  dotFocused: boolean;
}

const knobInactive = 0;
const knobActive = 15;
const interactivePaddingX = knobActive * 3;
const interactivePaddingY = 30;
const trackHeightInactive = 6;
const trackScaleOnActive = 2;

const next = (arr: Array<number>, x: number) => {
  let value = Number.MAX_VALUE;
  for (let i = 0; i < arr.length; i++) {
    if (x <= arr[i] && arr[i] <= value) {
      value = arr[i]
    }
  }
  value = Math.min(Math.max.apply(0, arr), value);
  return value;
}

const previous = (arr: Array<number>, x: number) => {
  let value = Number.MIN_VALUE;
  for (let i = 0; i < arr.length; i++) {
    if (x >= arr[i] && arr[i] >= value) {
      value = arr[i]
    }
  }
  value = Math.max(Math.min.apply(0, arr), value);
  return value;
}

const valuePercentage = (value: number, min: number, max: number): number => {
  return Math.round(value / (max - min));
}

const valueRound = (value: number, step: number): number => {
  const inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

export class SeekBar extends React.Component<Props, State> {

  interactiveDiv: HTMLDivElement | undefined;
  progressDotButton: HTMLDivElement | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      dragging: false,
      hovering: false,
      dotFocused: false,
      value: this.props.value,
      hoveredWidth: 0,
      marks: [props.min, props.max],
    };
    this.setupKeyboardControl();
  }

  setupKeyboardControl = (): void => {
    document.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (document.activeElement !== this.progressDotButton) {
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
    this.sethoveredWidth(event_offsetX + 1);
  }


  onHoverEnd = (event: any) => {
    this.setState({
      hovering: false,
    });
    this.sethoveredWidth(0);
  }

  getPointervalue = (event: any): number => {
    if(this.interactiveDiv) {
      return Math.max(Math.min(this.interactiveDiv.getBoundingClientRect().width, (event.pageX - this.interactiveDiv.getBoundingClientRect().left)), 0);
    } else {
      return 0;
    }
  }

  startDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    this.setState({ dragging: true, });
    this.setvalueFromPointerEvent(event);
    this.interactiveDiv?.setPointerCapture(event.pointerId);

    //@ts-ignore
    this.interactiveDiv.addEventListener('pointermove', this.keepDragging);
    //@ts-ignore
    this.interactiveDiv.addEventListener('pointerup', this.stopDragging);

    setTimeout(() => { this.progressDotButton?.focus(); }, 1);
  }

  keepDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if(this.state.dragging) {
      this.setvalueFromPointerEvent(event);
    }
  }

  stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if(this.state.dragging) {
      this.setState({ dragging: false, });

      //@ts-ignore
      this.interactiveDiv.removeEventListener('pointermove', this.keepDragging);
      //@ts-ignore
      this.interactiveDiv.removeEventListener('pointerup', this.stopDragging);

      setTimeout(() => { this.progressDotButton?.blur(); }, 1);
    }
  }

  setvalueFromPointerEvent = (event: any) => {
    if(this.interactiveDiv) {
      const width = this.interactiveDiv.getBoundingClientRect().width;
      const relativeValueInPixel = this.getPointervalue(event);
      const mappedValuePercentage = this.getMappedvaluePercentage(relativeValueInPixel, width);
      const newValue = (mappedValuePercentage * this.props.max / 100);
      this.setValue(newValue);
    }
  }

  getHoveredPercentage = () => {
    if (this.interactiveDiv) {
      const value = this.state.hoveredWidth;
      const max = this.interactiveDiv.getBoundingClientRect().width;
      return this.getMappedvaluePercentage(value, max);
    } else {
      return 0;
    }
  }

  getMappedvalue = (oldValue: number, max: number): number => {
    const smalMax = max - 2 * interactivePaddingX;
    let newValue = oldValue;
    if (newValue < interactivePaddingX) {
      newValue = 0;
    } else if (newValue > max - interactivePaddingX) {
      newValue = smalMax;
    } else {
      newValue = newValue - interactivePaddingX;
    }
    return newValue;
  }

  getMappedvaluePercentage = (oldValue: number, max: number): number => {
    const newValue = this.getMappedvalue(oldValue, max);
    return newValue * 100 / (max - 2 * interactivePaddingX);
  }

  getValuePercentage = () => {
    return this.state.value * 100 / this.props.max;
  }

  render(): JSX.Element {

    const value = this.state.value;
    const valuePercentage = value * 100 / (this.props.max);
    const hoveredWidth = this.state.hoveredWidth;
    const { max, min ,isTouch} = this.props;

    return (
      <>
        <div
          id="interactive"
          className={
            `${this.state.dragging ? 'dragging' : ''} 
           ${this.state.hovering ? 'hovering' : ''}
           ${document.activeElement === this.progressDotButton ? 'focused' : ''}
           ${this.props.disable ? 'disable-interaction' : ''} 
           ${this.props.isTouch ? 'touch' : ''}
          `
          }
          style={{
            paddingLeft: `${interactivePaddingX}px`,
            paddingRight: `${interactivePaddingX}px`,
            paddingTop: `${interactivePaddingY}px`,
            paddingBottom: `${interactivePaddingY}px`,
            boxSizing: `border-box`,
          }}
          ref={this.setInteractiveElement}
          onMouseEnter={!isTouch ? this.onHoverStart : ()=>{}}
          onMouseLeave={!isTouch ? this.onHoverEnd: ()=>{}}
          onMouseMove={!isTouch ? this.onHover: ()=>{}}
          aria-label={`${this.state.value}`}
          onPointerDown={this.startDragging}
        >
          <div id="progress-bar">

            <div id="progress-bar-list">
              {<div id="played" style={{ width: `${this.getValuePercentage()}%` }} />}
              {<div id="hovered" style={{ width: `${this.getHoveredPercentage()}%` }} />}
              <div id="all" style={{ width: `100%` }} />
            </div>

            <div
              ref={this.setProgressDotDiv}
              onFocus={() => this.setState({ dotFocused: true })}
              onBlur={() => this.setState({ dotFocused: false })}
              tabIndex={0}
              role='slider'
              aria-label={`${this.state.value}`}
              id="progress-dot"
              style={{ left: `${valuePercentage}%`, }}
            />
          </div>

        </div>
        <div id="debug">
          <p>value: {this.state.value}</p>
          <p>valuePercentage: {this.getValuePercentage()}%</p>
          <p>hoveredWidth: {hoveredWidth}px</p>
          <p>hoveredPercentage: {this.getHoveredPercentage()}%</p>
          {this.state.dragging && <p>dragging</p>}
          {this.state.hovering && <p>hovering</p>}
          <p>marks: {this.state.marks}</p>
          <p>focused: {this.state.dotFocused ? "YES" : "NO"}</p>
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

    this.setState({ value: valueRound(value, this.props.step) }, () => {
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

      if (this.state.hoveredWidth === valueRound(value, 1.01)) {
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

  setProgressDotDiv = (element: HTMLDivElement): void => {
    if (!this.progressDotButton && element) {
      this.progressDotButton = element;
    }
  };
}
