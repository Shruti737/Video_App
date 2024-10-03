import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'

const generateAcessAndrefereshTokens = async(userId)=>{
 try {
  const user  = await User.findById(userId)
  const acessToken = user.gererateAcessToken()
  const refreshToken = user.gererateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({validateBeforeSave: false});

  return {acessToken, refreshToken}
  
 } catch (error) {
  throw new ApiError(500, "Something went while generating acess token")
 }
}


const registerUser = asyncHandler(async (req, res) => {
   
  //get user details from frontend
  //validation - not empty
  //check if user already exist: username and email
  //check for images, check for avatar
  //upload them to cloudinary, avatar
  //create user object - create entry in db
  //remoce password and refresh token field from response 
  //check for user creation 
  //return res 


  const {fullName, email,username, password} = req.body
 
  if(
    [fullName, email, username, password].some((field)=>{
        field?.trim() === ""
    })
  ){
       throw new ApiError(400, "All field are required")
   }

   const existedUser = await User.findOne({
    $or: [{username}, {email}]
   })

  if(existedUser){
    throw new ApiError(409, "User with email or username already exist")
  }
  
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

 let coverImageLocalPath;
 if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalPath = req.files.coverImage[0].path
 }
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required")
  }
 
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullName,
    email,
    avatar: avatar.url,
    coverImage : coverImage?.url || "",
    password,
    username: username.toLowerCase()
  })

  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createUser){
    throw new ApiError(500, "Something went wrong while resgistering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createUser, "User registered Successfully")
  )
});


const loginUser = asyncHandler(async (req, res)=>{
  //get user details from frontend - username, email and password
  //check user  exist or not 
  //if user exist then match the  password 
  //Generate acess token and refresh  token and send it to the user
  // Send cookie

  const {email, username, password} = req.body;
  
  if(!email || !username) 
    throw new ApiError(400, "username or password is required")

  const user = await User.findOne({
    $or:{username, email}, 
    })

    if(!user ){
      throw new ApiError(404, "User does not Exist")
    }

   const isPasswordValid =  await user.isPasswordCorrect(password)

   if(!isPasswordValid ){
    throw new ApiError(404, "Inavlid User Credentials")
  }

  const {acessToken, refreshToken} = await generateAcessAndrefereshTokens(user._id)

  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }
 //cookie send to user
  return res
  .status(200)
  .cookie("accessToken", acessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(200, {
      user: loggedInUser, acessToken, refreshToken
    },
    "User Logged In SucessFully"
  )
  )

})

const logoutUser = asyncHandler(async(req, res)=>{
   //clear cookies
   

})


export {registerUser, loginUser}