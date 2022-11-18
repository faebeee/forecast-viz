import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'


const middlewareExceptions = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/img',
    '/oauth',
    '/illu',
    '/welcome',
]

export function middleware(request: NextRequest) {
    // if the url starts with any of these exceptions, ignore the middleware and return the response.
    if (middlewareExceptions.some((value) =>
        request.nextUrl.pathname.startsWith(value),
    )) {
        console.log('backout', request.nextUrl.pathname)
        return NextResponse.next()
    }

    const cookies = request.cookies;
    const isLoggedIn = false;
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/welcome', request.url))
    }
    return NextResponse.next()
}