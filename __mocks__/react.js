module.exports = {
  useState: (init) => [init, jest.fn()],
  useCallback: (fn) => fn,
  useEffect: jest.fn(),
  useRef: (init) => ({ current: init }),
  useMemo: (fn) => fn(),
  createElement: jest.fn(),
};
