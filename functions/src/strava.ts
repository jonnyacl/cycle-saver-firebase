import * as express from "express";

export const stravaSignIn = (req: express.Request, resp: express.Response): express.Response => {
    console.log("STRAVA SIGNIN");
    resp.setHeader("Content-Type", "application/json");
    return resp.json({ "hello": "world" });
};