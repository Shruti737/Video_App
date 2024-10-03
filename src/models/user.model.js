import mongoose,{Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,

        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String, //cloudinary url use
            required: true,
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
             {
                type: Schema.Types.ObjectId,
                ref: "Video"
             }     
            ],
        password: {
            type:String,
            required: [true, 'Password is required']
        },
        refreshToken:{
          type: String  
        }
    },{timestamps: true})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.gererateAcessToken = function (){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET ,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.gererateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET ,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

// Difference between acess token and refresh token

// Acess Token -  Short Lived  and for every session end it genrate next token. and authentication of user checkend using the acess token

// Refresh Token - Long Lived. It is Stored in database and database refresh token and user refresh token same it give next acess token  to user. user do not have to re login itself and follow the procedure.



export const User = mongoose.model("User", userSchema)