import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'; //using this we can access the user cookie and set the cookie

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json({limit: '16kb'})) // use for handling the json data

app.use(express.urlencoded({extended: true, limit: '16kb'})) // use for the handling url because it may contain the special characters

app.use(express.static("public")) //store the file and folders in our server in a assest folder "public"
app.use(cookieParser()) //help to use the cookie

//routes
import userRouter from './routes/users.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)

export { app }