import exp from 'express'
import { UserModel } from '../models/UserModel.js'
import { hash,compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {config} from 'dotenv'
import { verifyToken } from '../middlewares/verifyToken.js'
const {sign}=jwt
config()

export const commonApp = exp.Router()

const getCookieOptions = (req) => {
  const isSecure = req.secure || req.get("x-forwarded-proto") === "https";

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    path: "/",
  };
};

// Register a new user
commonApp.post('/users',async(req,res,next)=>{
      try{
        //get new user obj from req
        const newUser=req.body
        if (!newUser.username || !newUser.email || !newUser.password) {
          return res.status(400).json({ message: 'username, email, and password are required' });
        }
        //console.log(newUser)
        //hash the password
        const hashedPassword=await hash(newUser.password,10)
        //replace original password with hashed password
        newUser.password=hashedPassword
        newUser.role = newUser.role || 'USER'
        //create new user document
        const NewUserDocument=new UserModel(newUser)
        //save
        let result=await NewUserDocument.save()
        //send response
        res.status(201).json({message:'User Created'})//it is mandatory to send status code
      } catch (err) {
            if (err?.code === 11000) {
              const duplicateField = Object.keys(err.keyPattern || {})[0] || Object.keys(err.keyValue || {})[0]

              if (duplicateField === 'username') {
                return res.status(409).json({ message: 'username exists' })
              }

              if (duplicateField === 'email') {
                return res.status(409).json({ message: 'email exists' })
              }

              return res.status(409).json({ message: 'Duplicate account already exists' })
            }

            console.log("err is ", err);
            next(err);
    }
})

// Log in an existing user
commonApp.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    // If user doesn't exist
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    // Compare password using bcrypt
    const isPasswordMatch = await compare(password, user.password);
    // If password doesn't match
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    // Check if account is deactivated
    if (!user.isUserActive) {
      return res.status(403).json({
        message: 'Account is deactivated',
        activateRequired: true,
        email: user.email,
      });
    }
    // Create JWT token
    const signedToken = sign(
      {
        userId: user._id,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
      },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );
    // Store token as HTTP-only cookie
    res.cookie('token', signedToken, getCookieOptions(req));
    // Send successful response
    res.status(200).json({
      message: 'Login successful',
      payload: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null,
        role : user.role
      },
    });
});

// Log out the current user
commonApp.get("/logout", (req, res) => {
  //delete token from cookie storage
  res.clearCookie("token", getCookieOptions(req));
  //send res
  res.status(200).json({ message: "Logout success" });
});

// Change the current user's password
commonApp.put("/password",verifyToken("USER","ADMIN"),async (req,res) => {
  const {currentPassword, newPassword} = req.body
  // check current password and new password are same
  if(currentPassword == newPassword){
      return res.status(400).json({message:"Current and new password are same"})
  }
  // get current password of user/admin/author
  const userId = req.user?.userId
  const user = await UserModel.findById(userId)
  // check the current password of req and user are same
  let isMatched = await compare(currentPassword,user.password)
  if(!isMatched){
      return res.status(400).json({message:"Invalid current password"})
  }
  // hash new password
  // repalce current password of user with hashed new password
  user.password = await hash(newPassword,12)
  // save
  await user.save()
  // send res
  res.status(200).json({message:"password successfuly changed"})
})