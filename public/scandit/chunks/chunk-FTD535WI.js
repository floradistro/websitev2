import { logger } from "@/lib/logger";

function n(e, t) {
  if (e === false) throw new Error(t);
}
function r(e) {
  logger.warn("Reached unexpected case", e);
}
function o(e) {
  throw new Error("Reached unexpected case");
}
export { n as a, r as b, o as c };
