import * as express from "express";
import config from "./config";
import axios from "axios";
import * as moment from "moment";
import { getData } from "./data";

export const stravaSignIn = (req: express.Request, resp: express.Response): express.Response => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (body.env) {
        switch (body.env) {
            case "mobile":
                resp.status(201);
                return resp.json({ "url": `${config.strava.signinUrl}?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.app.redirect}&scope=read&approval_prompt=force` });
            case "web":
                resp.status(201);
                return resp.json({ "url": `${config.strava.signinUrl}?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.app.redirect}&scope=read&approval_prompt=force` });
            default:
                break;
        }
    }
    resp.status(400);
    return resp.json({ "error": "Invalid env param" });
};

export const obtainStravaToken = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (!body.user_id) {
        resp.status(400);
        return Promise.resolve(resp.json({ "error": "Missing user id" }));
    }
    if (body.code) {
        // call strava api to obtain and store access token
        const tokenUrl = `${config.strava.apiUrl}${config.strava.tokenEndpoint}`;
        const stravaBody = {
            client_id: config.strava.clientId,
            client_secret: config.strava.clientSecret,
            code: body.code,
            grant_type: "authorization_code"
        };
        const stravaResp = await axios.post(tokenUrl, stravaBody);
        if (stravaResp.status === 200 || stravaResp.status === 201) {
            // store token and async request the athlete's profile and activities
            console.log(`Strava token: ${stravaResp}`);
            // storeData("token", { type: "strava", token: stravaResp.data.access_token, user_id: body.user_id });
            fetchStoreAthlete(stravaResp.data.access_token).then(athlete => {
                resp.status(201);
                return Promise.resolve(resp.json(athlete));
            }).catch(() => {
                resp.status(502);
                return Promise.resolve({ "error": "Failed to obtain token" });
            });
        } else {
            resp.status(stravaResp.status);
            return Promise.resolve(resp.json({ "error": "Failed to obtain token" }));
        }
    }
    resp.status(400);
    return Promise.resolve(resp.json({ "error": "Missing token" }));
};

export const getAthlete = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const userId = req.params.user_id;
    resp.setHeader("Content-Type", "application/json");
    const athlete = await getData("athlete", `user_id=${userId}`);
    if (athlete.data) {
        resp.status(200);
        return Promise.resolve(resp.json(athlete.data));
    } else {
        resp.status(athlete.status);
        return Promise.resolve(resp.json({ error: athlete.error }));
    }
};

export const getAthleteActivities = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const userId = req.params.user_id;
    resp.setHeader("Content-Type", "application/json");
    const activities = await getData("activity", `user_id=${userId}`);
    if (activities.data) {
        resp.status(200);
        return Promise.resolve(resp.json(activities.data));
    } else {
        resp.status(activities.status);
        return Promise.resolve(resp.json({ error: activities.error }));
    }
};

const fetchStoreAthlete = (stravaT: string, user_id?: string): Promise<any> => {
    let userId = user_id;
    if (!userId) {
        userId = setUserId(stravaT);
    }
    const athleteUrl = `${config.strava.apiUrl}athlete`;
    return new Promise((resolve, reject) => {
        axios.get(athleteUrl, { headers: { Authorization: `Bearer ${stravaT}` }}).then(resp => {
            // store resp
            console.log(`Athlete: ${JSON.stringify(resp.data)}`);
            const athlete = { athlete: resp.data, user_id };
            // storeData("athlete", athlete);
            downloadAthleteActivites(stravaT);
            resolve(athlete);
        }).catch(e => {
            console.error(`Failed to fetch athlete data: ${e.message}`);
            reject(e);
        });
    });
};

const downloadAthleteActivites = (stravaTo: string, since?: moment.Moment, user_id?: string) => {
    let userId = user_id;
    if (!userId) {
        userId = setUserId(stravaTo);
    }
    if (user_id) {
        let activityUrl = `${config.strava.apiUrl}athlete/activities`;
        if (since) {
            activityUrl = `${activityUrl}?after=${since.toISOString()}`;
        }
        axios.get(activityUrl, { headers: { Authorization: `Bearer ${stravaTo}` }}).then(resp => {
            resp.data.forEach((activity: any) => {
                // storeData("activity", { activity, user_id });
            });
        }).catch(e => {
            console.error(`Failed to fetch athlete activities: ${e.message}`);
        });
    }
};

const setUserId = (stravaToken: string): any => {
    const u = getData("token", `token=${stravaToken}`);
    if (u.data) {
        return getData("token", `token=${stravaToken}`).data.user_id;
    }
    return null;
}