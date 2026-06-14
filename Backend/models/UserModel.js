import { Schema,model,Types } from "mongoose";

//create user schema(username,email,password,gender)
const UserSchema = new Schema({
    username:{
        type:String,
        required:[true,"Username required"],
        minLength:[4,"minimum 4 characters"],
        maxLength:[10,"maximum 10 characters"],
        unique:[true,"username already exists"],
        trim:true
    
    },
    email:{
        type:String,
        required:[true,"email required"],
        unique:[true,"email already exists"],
        toLowerCase:true
    },
    password:{
        type:String,
        minLength:[4,"minimum 4 characters"],
        required:[true,"password required"]
    },
    avatar:{
        type:String
    },
    isUserActive:{ //for soft deleting 
        type:Boolean,
        default:true
    },
    role:{
        type:String,
        enum:["USER","ADMIN"],
        rquired:[true,"invalid role"]
    },
    bio:{
        type:String
    },
    savedPosts: [
            {
                type: Types.ObjectId,
                ref: "post"
            }
        ],
    moodHistory: [
        {
            mood: {
                type: String,
                enum: ["happy", "calm", "neutral", "sad", "stressed"],
                required: true,
            },
            note: {
                type: String,
                default: "",
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    // Incrementing this value invalidates existing tokens when changed
    tokenVersion: {
        type: Number,
        default: 0
    },
    reports: [
        {
            reportedBy: {
                type: Types.ObjectId,
                ref: 'user'
            },
            reason: {
                type: String,
                enum: ['Spam', 'Harassment', 'Fake Information', 'Inappropriate Content', 'Other'],
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
},{
    timestamps:true,
    versionKey:false,
    strict:'throw'
}
)

export const UserModel=model('user',UserSchema)