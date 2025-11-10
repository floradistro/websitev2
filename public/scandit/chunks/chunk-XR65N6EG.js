import { logger } from "@/lib/logger";

var v;
((t) => {
  ((n) => (
    (n.Debug = "debug"),
    (n.Info = "info"),
    (n.Warn = "warn"),
    (n.Error = "error"),
    (n.Quiet = "quiet")
  ))(t.Level || (t.Level = {}));
  let u = new Map([
      ["debug", 1],
      ["info", 2],
      ["warn", 3],
      ["error", 4],
      ["quiet", 5],
    ]),
    l = "debug";
  function c(e) {
    l = e;
  }
  t.setLevel = c;
  function o(e, ...r) {
    if (!(u.get(l) > u.get(e)))
      switch (e) {
        case "debug": {
          logger.debug(...r);
          break;
        }
        case "info": {
          logger.debug(...r);
          break;
        }
        case "warn": {
          logger.warn(...r);
          break;
        }
        case "error": {
          logger.error(...r);
          break;
        }
      }
  }
  t.log = o;
  function b(...e) {
    o("warn", ...e);
  }
  t.warn = b;
  function a(...e) {
    o("debug", ...e);
  }
  t.debug = a;
  function f(...e) {
    o("info", ...e);
  }
  t.info = f;
  function L(...e) {
    o("error", ...e);
  }
  t.error = L;
})(v || (v = {}));
export { v as a };
