const config = {
    strava: {
        stravaUrl: "https://www.strava.com/oauth/authorize",
        clientId: 33576,
        clientSecret: "42dfe64ebf50a1ecef29db874914bc8676f8be29"
    },
    app: {
        redirect: "http://localhost:3000/strava/token"
    }  
};

export default config;