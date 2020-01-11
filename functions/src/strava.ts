import * as express from "express";
import config from "./config";
import axios from "axios";
import * as moment from "moment";
import { storeData, getData } from "./data";

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
                resp.status(400);
                break;
        }
    }
    resp.status(400);
    return resp.json({ "error": "Invalid env param" });
};

export const stravaToken = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
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
            storeData("token", { type: "strava", token: stravaResp.data.access_token, user_id: body.user_id });
            fetchAthleteData(stravaResp.data.access_token);
            resp.status(201);
            return Promise.resolve(resp.json({}));
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

const fetchAthleteData = (stravaToken: string, user_id?: string) => {
    if (!user_id) {
        user_id = setUserId(stravaToken);
    }
    const athleteUrl = `${config.strava.apiUrl}athlete`;
    axios.get(athleteUrl, { headers: { Authorization: `Bearer ${stravaToken}` }}).then(resp => {
        // store resp
        storeData("athlete", { athlete: resp.data, user_id });
        fetchAthleteActivites(stravaToken);
    }).catch(e => {
        console.error(`Failed to fetch athlete data: ${e.message}`);
    });
};

const fetchAthleteActivites = (stravaToken: string, since?: moment.Moment, user_id?: string) => {
    if (!user_id) {
        user_id = setUserId(stravaToken);
    }
    if (user_id) {
        let activityUrl = `${config.strava.apiUrl}athlete/activities`;
        if (since) {
            activityUrl = `${activityUrl}?after=${since.toISOString()}`;
        }
        axios.get(activityUrl, { headers: { Authorization: `Bearer ${stravaToken}` }}).then(resp => {
            // store resp
            resp.data.forEach((activity: any) => {
                storeData("activity", { activity, user_id });
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