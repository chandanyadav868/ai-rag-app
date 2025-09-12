
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { getUserFromDb } from "./utils/util";

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
    Google,
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
        
        const responseData = await getUserFromDb(credentials)
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
  ],

  // ye callbacks har upar wale provider ke sath chalta hai whether it is google or credentials

  callbacks: {
    // jab user sign in karta hai to ye chalta hai , ye bta ta hai ki user ko allow karna hai ya nhi, aur aap custome db insert bhi lik sakte ho
    async signIn({ account, profile }) {
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
          plan: "Free"
        } as UserSchemaProp
        // await userCreating(userData);
        return true
      } else {
        console.log("data in credentials:- ",  account);        
        return true
      }
    },

    // yha se aap token object ke under account ki details ko phit kar sakte ho jo chahe wo
    async jwt({ token, user, account, profile, session, trigger }) {
      // console.log("token:- ", token, "user:- ", user, "account:- ", account, "profile:- ", profile, "session:- ", session, "trigger:- ", trigger);
      if (account?.provider === "credentials") {
        
        if (!user.id)  return token
        
        console.log("I am on the credentials:--- ------ ----- credentials on the road");
        const sessionSingned = jwt.sign({id:user.id,email:user.email},"chandanhahdng",{
          algorithm:"HS256"
        });
        
        // console.log("Session in credentials:- ", sessionSingned);
        token.accessToken = sessionSingned
        return token
      }else{
        token.accessToken = account?.access_token;
        token.emailVerified = profile?.email_verified;
        return token;
      }
    },

    // ye function aap ko useSession ke use karne par session mai maujut sare data deta hai
    async session({ session, token, user, newSession,trigger }) {
      // console.log("session:- ", session, "token:- ", token, "user:- ", user,"newSession:- ",newSession,"trigger:- ",trigger);
      return session
    },

    // ye funtion user ko redirect karta hai 
    async redirect({ baseUrl, url }) {
      console.log("baseUrl:- ", baseUrl, "url:- ", url);
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    },
  },

})




// const userCreating = async (data: UserSchemaProp) => {
//   try {
//     await mongodbConnection();
//     // Always use lean() so it's plain
//     let user = await UserSchemaModel.findOne({ email: data.email }).lean();

//     if (!user) {
//       const createdUser = await UserSchemaModel.create({ ...data });
//       user = createdUser.toObject(); // ✅ Convert mongoose doc → plain object
//     }

//     return user;
//   } catch (error) {
//     console.log("dataSavingResponse error:- ", error);
//     throw new Error(String(error))
//   }
// }