import exp from 'express'
import {connect} from 'mongoose'
import { config } from 'dotenv'
import { createServer } from 'node:http'
import { Server } from "socket.io";
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from "jsonwebtoken"
import { commonApp } from './APIS/CommonApi.js';
import { userApp } from './APIS/userApi.js';
import { messageApp } from './APIS/MessageApi.js';
import { adminApp } from './APIS/AdminApi.js';
//import { setupSocket } from "./Sockets/socket.js";

const app=exp()
app.set('trust proxy', 1)  
const server=createServer(app)

config()

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://ornate-jelly-4c7c12.netlify.app',
  'https://mentalhealthforum.vercel.app'
]

const envOrigins = `${process.env.FRONTEND_URL || ''},${process.env.FRONTEND_URLS || ''}`
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '')

const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins].map(normalizeOrigin))]

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin)
    console.log('CORS request origin:', origin, 'normalized:', normalizedOrigin)

    if (!origin) {
      // Allow non-browser requests such as server-to-server calls.
      return callback(null, true)
    }

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS origin denied: ${origin}`), false)
  },
  credentials: true,
}

console.log('CORS allowed origins:', allowedOrigins)
app.use(cors(corsOptions));


//body parser middleware
app.use(exp.json())

//cookie parser
app.use(cookieParser())

app.use("/common-api",commonApp)
app.use("/user-api",userApp)
app.use("/message-api",messageApp)
app.use("/admin-api",adminApp)

//socket server
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',    // Frontend dev server
      'http://127.0.0.1:5173',
      'https://ornate-jelly-4c7c12.netlify.app',
      'https://mentalhealthforum.vercel.app'
    ],
    credentials: true,
    methods: ["GET", "POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// setupSocket(io);

//port 
const PORT = parseInt(process.env.PORT, 10) || 3000;

// handle unexpected rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  console.error('Missing DB_URL environment variable. Set DB_URL in Render dashboard or your production environment.');
  process.exit(1);
}

const connectDB = async () => {
  try {
    await connect(dbUrl);
    console.log('DB connected ');

    // if server is already listening (e.g., nodemon restarted the module), avoid listening twice
    if (server.listening) {
      console.log(`Server already listening on port ${PORT}`);
      return;
    }

    server.listen(PORT, () => console.log(`server listening on ${PORT}`));
  } catch (error) {
    console.error('error in connecting', error);
    process.exit(1);
  }
};

connectDB();


app.use((err,req,res,next)=>{
    console.log(err)
    //ValidationError
    if(err.name=="ValidationError"){
        return res.status(400).json({message:"Error occured",error:err})
    }

    //CastError
    if(err.name=="CastError"){
        return res.status(400).json({message:"Error occured",error:err})
    }

    //server side error
    res.status(500).json({message:"error occured",error:err.message})
})

