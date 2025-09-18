
import { NextRequest, NextResponse } from "next/server"
import authConfig from "./auth.config"
import NextAuth from "next-auth"
import { getToken } from "next-auth/jwt"

// this code is very important if you want to use the mongodb and google, because middleware always run on the edge if you try to run the credentials where using database using funtion which run on the heavy machine then always will throw error, so i am first only exporting providers in authConfig which run on the edge, this tricks came after 2 days
export const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
        const token = req.auth

    console.log(
        "authValue", req.auth?.user
    );

    const { pathname } = req.nextUrl;

    if (pathname === "/image-editing") {
        if (!token || !token?.user.email) {
            return NextResponse.redirect(new URL("/login/signin", req.nextUrl.origin))
        }
    }
    console.log("NextResponse:- ");
    NextResponse.next();
})


export const config = {
    matcher: "/image-editing"
}