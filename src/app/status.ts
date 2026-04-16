import pkg from "../../package.json";

// Exported as a mutable object so tests can override START_TIME.value to
// simulate elapsed time without monkey-patching globals. See
// .docs/learnings/testable-time-dependent-handlers.md for the pattern.
export const START_TIME = { value: Date.now() };
export const VERSION: string = pkg.version;

export const statusHandler = {
  get: () => {
    const time = new Date().toISOString();
    const uptime = Math.floor((Date.now() - START_TIME.value) / 1000);
    const requestId = crypto.randomUUID();
    return Response.json({ status: "running", requestId, time, uptime, version: VERSION });
  },
};
