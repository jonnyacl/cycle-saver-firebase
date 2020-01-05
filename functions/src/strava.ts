import * as express from "express";
import config from "./config";

export const stravaSignIn = (req: express.Request, resp: express.Response): express.Response => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (body.env) {
        switch (body.env) {
            case "mobile":
                resp.status(201);
                return resp.json({ "url": config.strava.stravaUrl });
            case "web":
                resp.status(201);
                return resp.json({ "url": config.strava.stravaUrl });
            default:
                resp.status(400);
                break;
        }
    }
    resp.status(400);
    return resp.json({ "error": "Invalid env param" });
};