import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import {User} from '../models/user.model'
export const verifyJWT = asyncHandler(async(req, resp, next)=>{
   const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Bearer ", "")

   if(!token) {
    throw new ApiError(401, "Unauthorized request")
   }

   const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

   await User.find
})