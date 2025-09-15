
import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import mongodbConnection from "./mongodb/connection";
import UserSchema from "./mongodb/schema/User.Schema";
import authConfig from "./auth.config"
import { JWT } from "next-auth/jwt";

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
    // i am importing function which are going exported from them spreading, for edge compatibility
    ...(authConfig.providers ?? []),
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
        let user: User | null = null
        // console.log("Email and Password in authorized:- ", credentials);

        const userData = await mongodbConnection();
        const responseData = await UserSchema.findOne({ email: credentials.email }).lean() as UserSchemaProp | null;
        console.log("ResponseData:- ", responseData);
        if (!responseData) {
          // agar aap throw karoge to ye internall Error will count so return null
          return user
          // throw new Error("User not Found")
        }

        const PasswordChecking = await bcrypt.compare(credentials.password as string, responseData.password as string);

        // console.log("Password checking:- ", PasswordChecking);
        if (!PasswordChecking) {
          return user
          // throw new Error("Password incorrect")
        }



        user = {
          id: responseData._id?.toString(),
          email: responseData.email,
          plan: responseData.plan,
          credit: responseData.credit,
          username: responseData.username,
          emailVerified: responseData.emailVerified,
          avatar: responseData.avatar,
          image: responseData.image,
          name: responseData.name
        }
        // console.log("User Credentials:---  ", user);

        return user
      }
    })
  ],

  // ye callbacks har upar wale provider ke sath chalta hai whether it is google or credentials

  callbacks: {
    // jab user sign in karta hai to ye chalta hai , ye bta ta hai ki user ko allow karna hai ya nhi, aur aap custome db insert bhi lik sakte ho
    async signIn({ account, profile, user }) {
      // console.log("Accounin from Account and Profile", account, profile);

      if (account?.provider === "google") {
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
          plan: "Free",
          name: name,
        } as UserSchemaProp
        const UserData = await userCreating(userData);
        if (!UserData) return false
        user = {...UserData}
        console.log("user SignIn:--", user);

        return true
      } else {
        // console.log("data in credentials:- ", account);
        return true
      }
    },

    // yha se aap token object ke under account ki details ko phit kar sakte ho jo chahe wo
    async jwt({ token, user, account, profile, session, trigger }) {
      // console.log("token:- ", token, "user:- ", user, "account:- ", account, "profile:- ", profile, "session:- ", session, "trigger:- ", trigger);
      
      
      // ye auth.js do bar chalta hai is liye condition check karna chahiye, first time value rahti hai leking second time nhi rhti hai
      if (user) {
        const UserData = await userCreating({email:user.email as string});
        token = { ...UserData,...token } as JWT;
        // console.log("user JWT:--", token,account);

      }

      // if (account?.provider === "credentials") {

      //   if (!user.id) return token

      //   console.log("I am on the credentials:--- ------ ----- credentials on the road");
      //   const sessionSingned = jwt.sign({ id: user.id, email: user.email },"chandanyadav", {
      //     algorithm: "HS256"
      //   });

      //   // console.log("Session in credentials:- ", sessionSingned);
      //   token.accessToken = sessionSingned
      //   return token
      // } else {
      //   token.accessToken = account?.access_token as string;
      //   return token;
      // }

      return token
    },

    // ye function aap ko useSession ke use karne par session mai maujut sare data deta hai
    async session({ session, token, user, newSession, trigger }) {
      session.user = {
        id : token._id as string,
        email: token.email as string,
        plan: token.plan,
        credit: token.credit,
        username: token.username,
        emailVerified: token.emailVerified as (Date & (boolean | Date)) | null,
        avatar: token.avatar,
        image: token.image,
        name: token.name
      }
      session.sessionToken = token.accessToken

      // console.log("session:- ", session, "token:- ", token, "user:- ", user, "newSession:- ", newSession, "trigger:- ", trigger);
        // console.log("user Seesion:--", user);

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

  session: {
    strategy: "jwt"
  },
  secret:process.env.AUTH_SECRET

})




const userCreating = async (data: Pick<UserSchemaProp,"email">) => {
  try {
    await mongodbConnection();
    // Always use lean() so it's plain
    let user = await UserSchema.findOne({ email: data.email }).lean()  as UserSchemaProp | null;;

    console.log("userCreating with google SignUp:- ", user);


    if (!user) {
      const createdUser = await UserSchema.create({ ...data });
      user = createdUser.toObject(); // ✅ Convert mongoose doc → plain object

    }else{
      user = {
        _id: user._id?.toString() ?? "",
          email: user.email as string,
          plan: user.plan,
          credit: user.credit,
          username: user.username,
          emailVerified: user.emailVerified as (Date & (boolean | Date)) | null,
          avatar: user.avatar,
          image: user.image,
          name: user.name
      }
    }
    return user;
  } catch (error) {
    console.log("dataSavingResponse error:- ", error);
    throw new Error(String(error))
  }
}