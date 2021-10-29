import * as React from 'react';
import './SeekBar.scss';
interface Props {
  onChange: (value: number) => void;
  onInput: (value: number) => void;
  onHover: (value: number) => void;
  disable: boolean;
  isTouch: boolean;
  value: number;
  min: number;
  max: number;
  step: number;

  marks: Array<number>;
  ranges: Array<{ start: number; end: number }>;
  styles: {
    interactivePaddingX: number,
    interactivePaddingY: number,
    progressBarScaleYActive: number;
    progressBarHeightInactive: number;
    progressDotSizeActive: number;
  }
}
interface State {
  dragging: boolean;
  value: number;
  hoveredWidth: number;
  hovering: boolean;
  focused: boolean;
  animate: boolean;
  marksAndRanges: Array<{ start: number; end: number }>;
}

const next = (arrr: Array<{ start: number; end: number }>, currentValue: number) => {

  const arr = arrr.map((markAndRange => markAndRange.start));

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

const previous = (arrr: Array<{ start: number; end: number }>, currentValue: number, step: number) => {

  const arr = arrr.map((markAndRange => markAndRange.start));

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
  progressDotDiv: HTMLDivElement | undefined;

  constructor(props: Props) {
    super(props);

    const marksAsRanges = [...props.marks.map(mark => ({ start: mark, end: -1 }))];
    const marksAndRanges = [...marksAsRanges, ...props.ranges];

    this.state = {
      dragging: false,
      hovering: false,
      focused: false,
      animate: false,
      value: this.props.value,
      hoveredWidth: 0,
      marksAndRanges: [...marksAndRanges.sort(
        (rangeA, rangeB) => {
          if (rangeA.start < rangeB.start) {
            return -1;
          }

          return 1;
        }
      )],
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


    this.updateMarksAndRanges(newProps.ranges, newProps.marks);
  };


  componentDidUpdate() {
    this.updateStyles();
  }

  updateMarksAndRanges = (ranges: Array<{ start: number; end: number }>, marks: Array<number>) => {
    const marksAsRanges = marks.map(mark => ({ start: mark, end: -1 }));
    const marksAndRanges = [...marksAsRanges, ...ranges];
    this.setState({
      marksAndRanges: [...marksAndRanges.sort(
        (rangeA, rangeB) => {
          if (rangeA.start < rangeB.start) {
            return -1;
          }

          return 1;
        }
      )]
    })
  }

  updateStyles = (): void => {
    const newProps = this.props;
    this.interactiveDiv?.style.setProperty('--progress-bar-scale-active', String(newProps.styles.progressBarScaleYActive) || '2');
    this.interactiveDiv?.style.setProperty('--progress-bar-height-inactive', `${String(newProps.styles.progressBarHeightInactive)}px` || '10px');
    this.progressDotDiv?.style.setProperty('--progress-dot-size-active', `${String(newProps.styles.progressDotSizeActive)}px` || '30px');
  }

  componentDidMount() {
    this.updateStyles();
  }

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
    if (this.interactiveDiv && event.button === 0 && event.buttons === 1) {
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
    }
  }

  setvalueFromPointerEvent = async (event: any, local = true): Promise<void> => {
    if (this.interactiveDiv) {
      const left = this.state.hoveredWidth || event.clientX - event.currentTarget.getBoundingClientRect().left;
      const value = (this.state.hoveredWidth || left) - this.props.styles.interactivePaddingX;
      const width = this.interactiveDiv.getBoundingClientRect().width - 2 * this.props.styles.interactivePaddingX;
      const newValue = (this.props.max - this.props.min) * (value / width);


      // if(this.Value(newValue) === this.state.value) {
      //   return;
      // }

      if (local) {
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
      let percentage = (value - this.props.styles.interactivePaddingX) / (max - 2 * this.props.styles.interactivePaddingX) * 100;
      if (percentage < 0) {
        percentage = 0;
      }
      if (percentage > 100) {
        percentage = 100;
      }
      if (this.state.hovering) {
        this.props.onHover(percentage);
      }
      return percentage;
    } else {
      if (this.state.hovering) {
        this.props.onHover(0);
      }
      return 0;
    }
  }

  getValuePercentage = () => {
    return this.state.value * 100 / this.props.max;
  }

  getRangeWidthPercentage = (range: { start: number; end: number }) => {
    const { start, end } = range;
    const rangeWidth = end - start;
    const totalWidth = this.props.max - this.props.min;
    return rangeWidth * 100 / totalWidth;
  }

  getRangeLeftPercentage = (range: { start: number; end: number }) => {
    const { start } = range;
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
    const { max, min, isTouch, disable, marks, ranges, styles } = this.props;
    const disableHoverInteractions = isTouch || disable;
    const disablePointerInteractions = disable;
    const { hovering, dragging, focused, animate, } = this.state;
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
            paddingLeft: `${styles.interactivePaddingX}px`,
            paddingRight: `${styles.interactivePaddingX}px`,
            paddingTop: `${styles.interactivePaddingY}px`,
            paddingBottom: `${styles.interactivePaddingY}px`,
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
              ref={this.setProgressDotElement}
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
          {this.interactiveDiv && <p>progresbar width without padding: {this.interactiveDiv.clientWidth - 2 * styles.interactivePaddingX}</p>}
        </div>
      </>
    );
  }

  shiftNext = (): void => {
    const newValue = next([{ start: this.props.min, end: -1 }, { start: this.props.max, end: -1 }, ...this.state.marksAndRanges], this.state.value);
    this.onChange(newValue);
  }

  shiftPrevious = (): void => {
    const newValue = previous([{ start: this.props.min, end: -1 }, { start: this.props.max, end: -1 }, ...this.state.marksAndRanges], this.state.value, this.props.step);
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
    const newValueCapped = this.Value(newValue);

    this.setState({
      value: newValueCapped
    }, () => {
      if (this.state.dragging) {
        this.props.onInput(this.state.value)
      }
      this.props.onChange(this.state.value);
    });
  }

  onLocalChange = (newValue: number) => {
    const newValueCapped = this.Value(newValue);

    this.setState({
      value: newValueCapped
    }, () => {
      if (this.state.dragging) {
        this.props.onInput(this.state.value)
      }
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

  setProgressDotElement = (element: HTMLDivElement): void => {
    if (!this.progressDotDiv && element) {
      this.progressDotDiv = element;
    }
  };
}
