const config = {
    strava: {
        signinUrl: "https://www.strava.com/oauth/authorize",
        apiUrl: "https://www.strava.com/api/v3/",
        clientId: 33576,
        clientSecret: "42dfe64ebf50a1ecef29db874914bc8676f8be29",
        tokenEndpoint: "token",
    },
    app: {
        redirect: "http://localhost:3000/strava/token"
    }  
};

export default config;