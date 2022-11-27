import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {getIronSession} from "iron-session/edge";
import {IRON_SESSION_OPTIONS} from "./src/server/utils";


const middlewareExceptions = [
    '/_next',
    '/favicon.ico',
    '/img',
    '/oauth',
    '/illu',
    '/welcome',
]

export async function middleware(request: NextRequest) {
    let response = NextResponse.next();


    // if the url starts with any of these exceptions, ignore the middleware and return the response.
    if (middlewareExceptions.some((value) =>
        request.nextUrl.pathname.startsWith(value),
    )) {
        return response
    }

    const session = await getIronSession(request, response, IRON_SESSION_OPTIONS);
    const isLoggedIn = session.accessToken && session.forecastId && session.harvestId;
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');


    // if the user is not logged in, we redirect him/hear to the welcome page
    if(!isLoggedIn && !isApiRoute) {
        return NextResponse.redirect(new URL('/welcome', request.url))
    }

    // in case of api routes, we don't want to redirect
    if(!isLoggedIn && isApiRoute) {
        return new NextResponse(null, {status: 403, headers: {'content-type': 'application/json'}})
    }

    return response
}