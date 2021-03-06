import * as express from "express";
import config from "./config";
import axios from "axios";
import * as moment from "moment";
import { storeUserData, storeStravaToken, getUserToken } from "./data";

export const stravaSignIn = (req: express.Request, resp: express.Response): express.Response => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (body.env) {
        switch (body.env) {
            case "mobile":
                resp.status(201);
                return resp.json({ "url": `${config.strava.signinUrl}?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.app.redirect}&scope=read_all,activity:read_all,profile:read_all&approval_prompt=force` });
            case "web":
                resp.status(201);
                return resp.json({ "url": `${config.strava.signinUrl}?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.app.redirect}&scope=read_all,activity:read_all,profile:read_all&approval_prompt=force` });
            default:
                break;
        }
    }
    resp.status(400);
    return resp.json({ "error": "Invalid env param" });
};

export const stravaDisconnect = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const userId = req.params.user;
    resp.setHeader("Content-Type", "application/json");
    try {
        const stravaToken = await getUserToken("strava", userId);
        if (stravaToken.access_token) {
            const deAuthUrl = `https://www.strava.com/oauth/deauthorize?access_token=${stravaToken.access_token}`;
            const deAuthResp = await axios.post(deAuthUrl);
            if (deAuthResp.status === 201) {
                console.log(`Revoked Strava access for user ${userId}`);
                resp.status(201);
                return resp.json({});
            } else {
                console.error(`Failed to revoke Strava access for user ${userId}`);
                resp.status(deAuthResp.status);
                return resp.json({});
            }
        }
        resp.status(500);
        return resp.json({});
    } catch(e) {
        if (e.status) {
            resp.status(e.status);
        } else if (e.response && e.response.status) {
            console.error(`Failed to revoke Strava access for user ${userId}`, e.response.data);
            resp.status(e.response.status);
        } else {
            resp.status(500);
        }
        return resp.json({});
    }
};

export const obtainStravaToken = async (req: express.Request, resp: express.Response): Promise<express.Response> => {
    const body = req.body;
    resp.setHeader("Content-Type", "application/json");
    if (!body.user_id) {
        console.error(`Missing user id in body ${JSON.stringify(body)}`);
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
        console.log(`POST ${tokenUrl} with body ${JSON.stringify(stravaBody)}`);
        let stravaResp;
        try {
            stravaResp = await axios.post(tokenUrl, stravaBody);
            // store token and async request the athlete's profile and activities
            console.log(`Strava resp: ${stravaResp}`);
            storeStravaToken(body.user_id, stravaResp.data);
            try {
                const athlete = await fetchAndStoreAthlete(stravaResp.data.access_token, body.user_id);
                resp.status(201);
                return Promise.resolve(resp.json(athlete));
            } catch(e) {
                console.error("Failed to fetch athlete data", e);
                if (e.response) {
                    console.error(`Status: ${e.response.status}, ${e.response.statusText}`);
                    if (e.response.data) {
                        console.error(`Reason ${e.response.data.message}`);
                        e.response.data.errors.forEach((err: any) => {
                            console.error(err)
                        });
                    }
                }
                resp.status(500);
                return Promise.resolve(resp.json({ "error": "Failed to fetch athlete data" }));
            }
        } catch(e) {
            console.error('Failed to obtain strava token', e);
            resp.status(502);
            return Promise.resolve(resp.json({ "error": "Failed to connect strava" }));
        }
    } else {
        resp.status(400);
        return Promise.resolve(resp.json({ "error": "Missing token" }));
    }
};

const fetchAndStoreAthlete = async (stravaToken: string, user_id: string): Promise<any> => {
    const athleteUrl = `${config.strava.apiUrl}athlete`;
    return new Promise((resolve, reject) => {
        axios.get(athleteUrl, { headers: { Authorization: `Bearer ${stravaToken}` }}).then(resp => {
            // store resp
            let athlete = resp.data;
            athlete.connected = moment().toISOString();
            storeUserData("athletes", user_id, athlete).then(r => {
                console.log(`Added athlete ${r.id}, user ${user_id}`)
                downloadAthleteActivites(stravaToken, user_id);
                resolve(resp.data);
            }).catch(e => {
                console.error(`Failed to add athlete for user ${user_id}`, e);
                reject(e);
            });
        }).catch(e => {
            console.error(`Failed to fetch athlete data: ${e.message}`);
            reject(e);
        });
    });
};

const downloadAthleteActivites = (stravaToken: string, user_id: string, since?: moment.Moment) => {
    let activityUrl = `${config.strava.apiUrl}athlete/activities`;
    if (since) {
        activityUrl = `${activityUrl}?after=${since.toISOString()}`;
    }
    axios.get(activityUrl, { headers: { Authorization: `Bearer ${stravaToken}` }}).then(resp => {
        resp.data.forEach((activity: any) => {
            storeUserData("activities", user_id, activity).then(r => {
                console.log(`Added activity ${r.id} for user ${user_id}`);
            }).catch(e => {
                console.error(`Failed to add activity for user ${user_id}`, e);
            });
        });
    }).catch(e => {
        console.error(`Failed to fetch athlete activities: ${e.message}`);
    });
};