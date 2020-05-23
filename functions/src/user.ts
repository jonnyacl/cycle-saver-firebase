import * as express from "express";
import { getUserData } from "./data";

export const getAthlete = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const userId = req.params.user;
    resp.setHeader("Content-Type", "application/json");
    try {
        const athlete = await getUserData("athletes", userId);
        resp.status(200);
        return Promise.resolve(resp.json(athlete));
    } catch(e) {
        resp.status(e.status);
        return Promise.resolve(resp.json({ error: e.error }));
    }
};

export const getActivities = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const userId = req.params.user;
    resp.setHeader("Content-Type", "application/json");
    try {
        const acts = await getUserData("activities", userId);
        resp.status(200);
        return Promise.resolve(resp.json(acts));
    } catch(e) {
        resp.status(e.status);
        return Promise.resolve(resp.json({ error: e.error }));
    }
};