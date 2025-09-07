import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import mongodbConnection from "./mongodb.ts/connection";
import UserSchemaModel, { UserSchemaProp } from "./mongodb.ts/schema/User.Schema";
import { compare, hash } from 'bcryptjs';

/* {
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
      },
    },
  }
*/

// maine NextAuth run karwa use mai se kuchh object nikal liye hai aur yha se export bhi kar diya hai
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google
  ],

  callbacks: {

    // jab user sign in karta hai to ye chalta hai , ye bta ta hai ki user ko allow karna hai ya nhi, aur aap custome db insert bhi lik sakte ho
    async signIn({ account, profile }) {
      if (!account || !profile) {
        return false
      }
      // console.log("account:- ", account, "profile:- ", profile);
      const { email, name, picture, email_verified } = profile
      // if db inserting
      if (!email || !name || !picture || !email_verified) return false
      const userData = {
        email,
        emailVerified: email_verified,
        username: name,
        avatar: picture,
        plan: "Free"
      } as UserSchemaProp
      await userCreating(userData);
      return true
    },

    // yha se aap token object ke under account ki details ko phit kar sakte ho jo chahe wo
    async jwt({ token, user, account, profile, session, trigger }) {
      // console.log("token:- ", token, "user:- ", user, "account:- ", account, "profile:- ", profile, "session:- ", session, "trigger:- ", trigger);
      token.accessToken = account?.access_token;
      token.emailVerified = profile?.email_verified;
      return token;
    },

    // ye function aap ko useSession ke use karne par session mai maujut sare data deta hai
    async session({ session, token, user }) {
      // console.log("session:- ", session, "token:- ", token, "user:- ", user);
      return session
    },

    // ye funtion user ko redirect karta hai 
    async redirect({ baseUrl, url }) {
      // console.log("baseUrl:- ", baseUrl, "url:- ", url);
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    },
  },

})




const userCreating = async (data: UserSchemaProp) => {
  try {
    await mongodbConnection();
    // Always use lean() so it's plain
    let user = await UserSchemaModel.findOne({ email: data.email }).lean();

    if (!user) {
      const createdUser = await UserSchemaModel.create({ ...data });
      user = createdUser.toObject(); // ✅ Convert mongoose doc → plain object
    }

    return user;
  } catch (error) {
    console.log("dataSavingResponse error:- ", error);
    throw new Error(String(error))
  }
}