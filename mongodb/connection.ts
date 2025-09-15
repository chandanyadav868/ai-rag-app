// how mongodb connection is established
// import kariye mongodb ko mongodb varialbe mai
import mongoose, { Connection } from "mongoose"

// process.env se mongodb uri ko nikalo
const Mongodb_URI = process.env.MONGODB_URL

// ye typescript ke error ko sant karne ke liye hai esse global ke under ek property mongodb bana hai aur us ke pass object hai jis mai two property hai conn and promise
declare global {
    var mongodb: {
        conn: null | Connection;
        promise: Promise<Connection> | null
    }
}

// global ek global level ka object hai us ke under hum mongodb naam ke variable to search kar rhai hai jo ki undefined hoga, es mongodb ke pass two propety hogi conn and promise
let cached = global.mongodb


async function mongodbConnection() {
    try {
        if (!Mongodb_URI) throw new Error("Your Mongodb URI is empty....");

        // ye for adding reference conn and promide to the cached variable for accessing globally
        if (!cached) {
            cached = global.mongodb = { conn: null, promise: null }
        }

        // check that connection is already established then return this not make new 
        if (cached.conn) {
            return cached.conn
        }

        // if cached connection is not then make a new connection
        if (!cached.promise) {
            cached.promise = mongoose.connect(`${Mongodb_URI}`, { dbName:"aiimage", bufferCommands: true }).then((response) => response.connection)
        }

        // wait till connection is not established
        cached.conn = await cached.promise

        return cached.conn
    } catch (error) {
        console.log("Error in mongodbConnection running funtion:- ", error)
    }

}

export default mongodbConnection