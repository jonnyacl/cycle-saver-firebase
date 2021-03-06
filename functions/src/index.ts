import * as express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { stravaSignIn, obtainStravaToken, stravaDisconnect } from "./strava";
import { getAthlete, getActivities } from "./user";
admin.initializeApp();

const cors = require('cors')({ origin: true });

const app = express();

const validateFirebaseIdToken = async (req: express.Request, res: express.Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>');
    res.status(401).send('Unauthorized');
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    await admin.auth().verifyIdToken(idToken);
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(401).send('Unauthorized');
    return;
  }
};

const logRoute = async (req: express.Request, res: express.Response, next: Function) => {
  console.log('REQ ===>', req);
  next();
  console.log('RES <===', res);
  return;
};

app.use(cors);
app.use(logRoute);
app.use(validateFirebaseIdToken);
app.use(express.json());

app.post("/strava/oauth", (req, resp) => {
  stravaSignIn(req, resp);
});

app.post("/:user/strava/deauthorize", async (req, resp) => {
  await stravaDisconnect(req, resp);
});

app.post("/strava/token", async (req, resp) => {
  await obtainStravaToken(req, resp);
});

app.get("/:user/athletes", async (req, resp) => {
  await getAthlete(req, resp);
});

app.get("/:user/activities", async (req, resp) => {
  await getActivities(req, resp);
});

exports.app = functions.https.onRequest(app);