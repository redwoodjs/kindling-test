import pkg from "../../package.json";

export const START_TIME = Date.now();
export const VERSION: string = pkg.version;

export const statusHandler = {
  get: () => {
    const time = new Date().toISOString();
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);
    const requestId = crypto.randomUUID();
    return Response.json({ status: "ok", requestId, time, uptime, version: VERSION });
  },
};
