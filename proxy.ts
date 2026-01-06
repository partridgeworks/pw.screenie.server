// middleware.ts
import { clerkMiddleware, ClerkMiddlewareAuth, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const LANDING_PATH = "/home";
const ROOT_PATH = "/";
const SHOPFRONT_PATH = "/about";
const PENDING_APPROVAL_PATH = "/home/pending-approval";

const isProtectedWebRoute = createRouteMatcher(["/home(.*)"]);
const isPendingApprovalPage = createRouteMatcher(["/home/pending-approval"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isPublicApiRoute = createRouteMatcher(["/api/pairing/devicecode(.*)"]);
const isRootPage = createRouteMatcher([ROOT_PATH]);

// Determine authorized parties based on environment
const getAuthorizedParties = () => {
    const parties = [];

    // Always allow localhost for development
    if (process.env.NODE_ENV !== "production") {
        parties.push("http://localhost:3000", "https://localhost:3000");
    } else {
        parties.push("http://screenie.org", "https://screenie.org");
    }
    return parties.length > 0 ? parties : undefined;
};

export default clerkMiddleware(
    async (auth, req) => {
        const { userId } = await auth();

        // Redirects here
        if (isRootPage(req)) {
            return NextResponse.redirect(new URL(SHOPFRONT_PATH, req.url));
        }

        // Require sign-in for protected routes, and implement custom logic for signed-in users
        if (!userId) {
            return signedOutMiddleware(auth, req);
        } else {
            return signedInMiddleware(auth, req);
        }
    },
    {
        authorizedParties: getAuthorizedParties()
    }
);

const signedOutMiddleware = async (auth: ClerkMiddlewareAuth, req: NextRequest) => {

    // Protected routes require sign-in
    if (isProtectedWebRoute(req)) {
        await auth.protect();
        // redirectToSignIn exhibits issues with incorrect return URL in some cases
        // return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Protect API routes
    if (isApiRoute(req)) {
        // Allow public API routes without authentication
        if (isPublicApiRoute(req)) {
            return NextResponse.next();
        }
        // Allow API key authenticated requests (validation happens in route handlers)
        const apiKeyHeader = req.headers.get("X-API-Key");
        if (apiKeyHeader) {
            return NextResponse.next();
        }
        return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    return NextResponse.next();
};

const signedInMiddleware = async (auth: ClerkMiddlewareAuth, req: NextRequest) => {
    const { pathname } = req.nextUrl;
    await auth();

    // Add pathname header for server components to access
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);

    return response;
};

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)"
    ]
};
