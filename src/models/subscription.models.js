import mongoose, {Schema} from "mongoose"

const subscriptionSchema = new Schema(
    {
        subsciber: 
        { 
            type : Schema.Types.ObjcetId,
            ref: "User"
        },
        channel: 
        {
           type: Schema.Types,ObjcetId,
           ref: "User"
        }
    },
    {timestamps: true})

export const subscription = mongoose.model("Subsciption",subscriptionSchema)