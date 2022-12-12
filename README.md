This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).



# Deploy on Heroku

Autodeployment for these two branches
- Branch [main](https://forecast-viz.herokuapp.com)
- Branch [stage](https://forecast-viz-stage.herokuapp.com)


# Resources

[Illustrations](https://undraw.co/search)

Color #ffe290

# Env Variables

To get a local harvest client id. Open [Harvest ID Security Settings](https://id.getharvest.com/), go to Developer Settings, `Create new OAuth2 application`:
- Redirect Url:  e.g `http://localhost:3000/oauth`
- Access: `multiple accounts`
- Products: `harvest and forecast`

```
# redis cache configuration
REDIS_URL=****
REDIS_CACHE_TTL=600
REDIS_ENABLED=false

# session cookie encryption password, must be at least a 32 characters long password 
IRON_SESSION_PASSWORD=****

# harvest client id
HARVEST_CLIENT_ID=****
NEXT_PUBLIC_OAUTH_CLIENT_ID='****'

# Optional
NEXT_PUBLIC_ANALYTICS_ID=****
```
