export const isTouch = (): boolean => {
  const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
  const mq = function (query: string) {
      return window.matchMedia(query).matches;
  };

  if ('ontouchstart' in window) {
      return true;
  }
  const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');

  console.log(`device detection (isTouch): ${mq(query)}`);
  return mq(query);
};