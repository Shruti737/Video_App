import mongoose from 'mongoose'

import { DB_NAME } from '../constants.js'

const connectDB = async() =>{
    try{
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`); // to get the connectipon URl of the mongodb to verify we connected to correct host 
    
    }catch(err){
        console.log("MongoDb connection error  " + err);
        process.exit(1)
    }
}

export default connectDB