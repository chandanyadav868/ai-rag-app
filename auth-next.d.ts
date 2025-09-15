import { JWT } from "next-auth/jwt"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id?: string | undefined
            emailVerified: Date | null | boolean
        } & DefaultSession["user"]
    }

    interface User extends Omit<UserSchemaProp, "password" | "_id"> {

    }

}


declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
    interface JWT extends Omit<UserSchemaProp, "password"> {
        accessToken:string
    }
}