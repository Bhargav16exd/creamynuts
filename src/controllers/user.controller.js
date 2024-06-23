import asyncHandler from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";


// This route is for admins only to register new Merchant and new Admins

const registerUser = asyncHandler(async (req, res) => {
 
    const { userId, role, password } = req.body;
  
    if(!userId || !role || !password){
        throw new ApiError(400,"Please provide all the required fields")    
    }

    const ifUserExistData = await User.findOne({userId})

    if(ifUserExistData){
        throw new ApiError(400,"User already exists")
    }

    const user = await User.create({
        userId,
        role,
        password
    })

    await user.save()

    return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", user))
    
})

const login = asyncHandler(async(req,res)=>{

    const {userId, password} = req.body

    if(!userId || !password){
        throw new ApiError(400,"Please provide all the required fields")
    }

    const user = await User.findOne({userId}).select('+password')

    if(!user){
        throw new ApiError(401,"User not found")
    }

    const isMatch = await user.matchPassword(password)

    if(!isMatch){
        throw new ApiError(401,"Invalid credentials")
    }

    const token = await user.getSignedToken()
    const loggedInUserDetails = await User.findOne({userId})

    const options = {
        httpOnly:true,
        secure:true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }


    return res
    .cookie("accessToken",token,options)
    .status(200)
    .json(
        new ApiResponse(200,"User Login Success",{loggedInUserDetails,token})
    )


})

const logout = asyncHandler(async(req,res)=>{

    return res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200,"User logged out successfully")) 

})



export {
    registerUser,
    login,
    logout
}