//
const rawConsole = global.console;
beforeEach(() => {
  /* ------------------------------ 重写console.log ----------------------------- */
  // @ts-ignore
  window.console = {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterEach(() => {
  /* ------------------------------ 重写console.log ----------------------------- */
  global.console = rawConsole;
});
