import { set } from "mongoose";
import  io  from "../app.js";
import { Food } from "../models/food.model.js";
import { Order } from "../models/orders.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Emitter from "./client.controller.js";



export const socketListener = () =>{


    io.on("connection" , async (socket)=>{

        // after page refresh this will get the user the order details
        const today = new Date();
        today.setHours(0, 0, 0, 0);
      
        // All Orders
        const orders = await Order.find({
            items: { $elemMatch: { orderStatus: { $in: ["PENDING"] } } },
            createdAt: { $gte: today }
            // add here payment = success when in prod
        })
        
      
        const ordersWithAMPM = orders.map(order => {
          const createdAtAMPM = order.createdAt.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
          return { 
              ...order._doc,
              createdAt: createdAtAMPM 
          };
        });
      
        // Distinct Order Names
        
        let distinctOrdersId = []
      
        orders.forEach(order => {
          order.items.forEach(item => {
            const foodIdStr = item.foodId.toString();
            if (!distinctOrdersId.includes(foodIdStr)) {
              distinctOrdersId.push(foodIdStr);
            }
          });
        });
       
        const distinctFoods = await Food.find({ _id: { $in: distinctOrdersId } }).select("name");
      
         
        const orderData = {
           ordersWithAMPM,
          distinctOrders: distinctFoods
        };

        io.emit("allOrders", orderData);
    
        try {
            console.log(`Socket connected: ${socket.id}`);

            socket.on("disconnect", () => {
              console.log(`Socket disconnected: ${socket.id}`);
            })
    
        } catch (error) {
            console.error("Socket connection error:", error);
        } 
    
    })


}


const confirmOrder = asyncHandler(async(req,res)=>{
   
     const {otp , orderId, foodId} = req.body

     if(!otp || !orderId || !foodId){
         throw new ApiError(400, "Please provide OTP and Order ID and Food ID")
     }

    const order = await Order.findOneAndUpdate(
        { 
          _id: orderId,
          "items.foodId": foodId
        },
        { 
          $set: { "items.$.orderStatus": "DELIVERED" }
        },
        { 
          new: true
        }
      );

     if(!order){
         throw new ApiError(404, "Order not found")
     }

    await order.save()
    await Emitter()

    return res
    .status(200)
    .json(new ApiResponse(200, "Order confirmed successfully"))
     

})




export {confirmOrder}