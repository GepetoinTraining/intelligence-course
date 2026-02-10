import { NextRequest, NextResponse } from 'next/server';

// Dev mode: no auth checks
const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

export default async function middleware(req: NextRequest) {
    // In dev mode, allow all requests through
    if (isDevMode) {
        return NextResponse.next();
    }

    // Production mode: use Clerk
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

    const isPublicRoute = createRouteMatcher([
        '/',
        '/sign-in(.*)',
        '/sign-up(.*)',
        '/onboarding(.*)',
        '/join(.*)',
        '/platform(.*)',
        '/p/(.*)',
        '/cert/(.*)',
        '/c/(.*)',
        '/careers(.*)',
        '/lattice/demo(.*)',
        '/api/careers(.*)',
        '/api/onboarding(.*)',
        '/api/invites(.*)',
        '/eco-escola(.*)',
    ]);

    return clerkMiddleware(async (auth, request) => {
        if (!isPublicRoute(request)) {
            await auth.protect();
        }
    })(req, {} as any);
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};

