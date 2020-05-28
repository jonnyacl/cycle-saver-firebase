## CYCLE SAVER FIREBASE

Firebase for cycle-saver. Code for functions which hosts an express.js server, communicating with firestore.

### Security

Express server uses a firebase token validation filter so all requests require a jwt idToken supplied by logging into the firebase users.

### App flow

User signs in, obtains firebase jwt idToken, obtaining access to the functions hosted as an http API express server.

User connects to Strava with OAuth2, obtaining an access token for the Strava user, and syncing their activities.

Http endpoints for fetching the user's strava athlete profile and their activities.

