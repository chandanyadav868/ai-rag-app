
import authConfig from "./auth.config"
import NextAuth from "next-auth"

// this code is very important if you want to use the mongodb and google, because middleware always run on the edge if you try to run the credentials where using database using funtion which run on the heavy machine then always will throw error, so i am first only exporting providers in authConfig which run on the edge, this tricks came after 2 days
export const { auth: middleware } = NextAuth(authConfig)
