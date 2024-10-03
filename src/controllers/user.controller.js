import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken';
const generateAcessAndrefereshTokens = async(userId)=>{
 try {
  const user  = await User.findById(userId)
  const acessToken = user.gererateAcessToken()
  const refreshToken = user.gererateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({validateBeforeSave: false});
  console.log("its me", acessToken);
  
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
  
  if(email && username) 
    throw new ApiError(400, "username or password is required")

  const user = await User.findOne({
    $or: [
      { username: username }, 
      { email: email }
    ]
  });

    if(!user ){
      throw new ApiError(404, "User does not Exist")
    }

   const isPasswordValid =  await user.isPasswordCorrect(password)

   if(!isPasswordValid ){
    throw new ApiError(404, "Inavlid User Credentials")
  }

  const {acessToken, refreshToken} = await generateAcessAndrefereshTokens(user._id)
   console.log(acessToken);
   
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
  await  User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true
    }
   )

   const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out"))
})


const refreshAcessToken = asyncHandler(async(req, res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
     throw new ApiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      
    )
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "Invalid Refresh Token")
   }
  
   if(incomingRefreshToken != user?.refreshToken){
    throw new ApiError(401, "Refresh Token is expired or used")
   }
    
   const options = {
    httpOnly: true,
    scure:  true
   }
   
   const {acessToken, newRefreshToken} =  await generateAcessAndrefereshTokens(user._id)
  
   return res
   .status(200)
   .cookie("acessToken", acessToken, options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
    new ApiResponse(
      200,
        {acessToken, refreshToken: newRefreshToken},
        "Acess Token refreshed"
    )
   )
  } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
  const {oldPassword, newPassword} = req.body;

  const user = await User.findById(req.user?._id)
  const PasswordCheck = await user.isPasswordCorrect(oldPassword)
  if(!PasswordCheck){
    throw new ApiError(400, "Invalid Old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed Successfully")) 
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched succesfully")
})

const updateAccountDetails = asyncHandler(async()=>{
      const {fullName, email} = req.body

      if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
      }

     const user = User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            fullName,
             email
          }
        },
        {
          new: true
        }
      ).select("-password")

      return res.status(200).json(new ApiResponse(200, user, "Account details updated sucessfully"))
})

const updateUserAvatar = asyncHandler(async (req,res) =>
{
     const avatarLocalPath = req.file?.path;
     if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is missing")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath)

     if(!avatar.url){
      throw new ApiError(400, "Error while uploading on avatar")
     }

     const user = awaitUser.findByIdAndUpdate(
      
        req.user?._id,
        {
          $set : {
            avatar: avatar.url
          }
        },
        {new: true}
    ).select("-password")

    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Avatar updated Sucessfully")
      )
})


const updateUserCoverImage = asyncHandler(async (req,res) =>
  {
       const CoverImageLocalPath = req.file?.path;
       if(!CoverImageLocalPath){
        throw new ApiError(400, "Avatar file is missing")
       }
  
       const avatar = await uploadOnCloudinary(avatarLocalPath)
  
       if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on avatar")
       }
  
       const user = awaitUser.findByIdAndUpdate(
        
          req.user?._id,
          {
            $set : {
              coverImage: coverImage.url
            }
          },
          {new: true}
      ).select("-password")
      return res
      .status(200)
      .json(
        new ApiResponse(200, user, "COverImage updated Sucessfully")
      )
  })

export {
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAcessToken, 
  updateUserAvatar,
   updateUserCoverImage}