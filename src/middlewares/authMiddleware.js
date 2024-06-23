import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";

const authMiddleware = asyncHandler(async(req,res,next)=>{

    try {
        
        const token = req.cookies?.accessToken //|| req.Header("Authorization")?.replace("Bearer")

        if(!token){
            throw new ApiError(401,"Unauthorized")
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.id)

        if(!user){
            throw new ApiError(404,"User not found")
        }

        req.user = user

        next()


    } catch (error) {
       throw new ApiError(400,"Unauthorized")
    }
})



const authenticateSocket = async (socket, next) => {

  console.log("hey")

  try {

    const token = socket.handshake.auth.token;

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new ApiError(400, "Unauthorized"));
  }
};




export  {authenticateSocket}
export default authMiddleware;