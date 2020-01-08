import * as express from "express";
import config from "./config";

export const stravaSignIn = (req: express.Request, resp: express.Response): express.Response => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (body.env) {
        switch (body.env) {
            case "mobile":
                resp.status(201);
                return resp.json({ "url": `${config.strava.stravaUrl}?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.app.redirect}&scope=read&approval_prompt=force` });
            case "web":
                resp.status(201);
                return resp.json({ "url": `${config.strava.stravaUrl}?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.app.redirect}&scope=read&approval_prompt=force` });
            default:
                resp.status(400);
                break;
        }
    }
    resp.status(400);
    return resp.json({ "error": "Invalid env param" });
};

export const stravaToken = (req: express.Request, resp: express.Response): express.Response => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (body.token) {
        resp.status(201);
        return resp.json({});
    }
    resp.status(400);
    return resp.json({ "error": "Missing token" });
};