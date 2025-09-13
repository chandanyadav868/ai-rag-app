import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import mongodbConnection from "./mongodb/connection";
import UserSchema from "./mongodb/schema/User.Schema";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers:[
         Credentials({
      credentials: {
        password: {
          type: "password",
          label: "Password"
        },
        email: {
          type: "email",
          label: "Email"
        }
      },
      async authorize(credentials) {
        let user = null
        console.log("Email and Password in authorized:- ", credentials);
        
        const userData = await mongodbConnection();
        const responseData = await UserSchema.findOne({ email: credentials.email }).lean() as UserSchemaProp | null;
        console.log("ResponseData:- ", responseData);
        if (!responseData) {
          throw new Error("User not Found")
        }

        const PasswordChecking = await bcrypt.compare(credentials.password as string, responseData.password as string);

        console.log("Password checking:- ", PasswordChecking);
        if (!PasswordChecking) {
          throw new Error("Password incorrect")
        }

        user = {
          id: responseData._id?.toString(),
          email: responseData.email
        }
        console.log("User:---  ", user);

        return user
      }
    })
    ]
})