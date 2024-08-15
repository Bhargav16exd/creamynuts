import { ApiError } from "../utils/ApiError.js";
import { Food } from "../models/food.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import axios from "axios";
import mongoose from "mongoose";
import { Order } from "../models/orders.model.js";
import sha256 from "sha256";
import io from "../app.js";
import { messeger } from "../utils/messeger.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import generateUnique4DigitOTP from "../utils/OTP.js";



const MERCHANT_ID = process.env.PHONE_PAY_MERCHANT_ID;
const PHONE_PE_HOST_URL = process.env.PHONE_PAY_HOST_URL;
const SALT_INDEX = process.env.PHONE_PAY_SALT_INDEX;
const SALT_KEY = process.env.PHONE_PAY_SALT_KEY;
const APP_BE_URL = process.env.APP_BE_URL;
const PRICE_CAP = process.env.PRICE_CAP
const frontendURL = process.env.CLIENT_URL

// Pay to PhonePay API

// This api will get order details
// This api sends server to server call to phonepay server for payment processing
// A payment gateway will open in the browser
// After payment is done, phonepay will send a callback to the server

const payToPhonePay = asyncHandler(async (req, res) => {

  // Starting a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  const { name, phoneNo, items } = req.body;

  if (!name || !phoneNo || !items) {
    throw new ApiError(400, "Please provide all the details");
  }

  let totalPrice = 0 
  const orderItems = []

 
  // This loops go to each item sent by frontend and check whether the IDs exist IF not error and then create a array of Order ITEMS
  for (const item of items) {
    const food = await Food.findById(item.foodId);

      if (!food) {
      throw new ApiError(400,"IDs doest not exist in DB");
      }

      if(item.quantity < 1){
        throw new ApiError(400,"Quantity should be greater than 0")
      }

      totalPrice = totalPrice + food.price * item.quantity

      orderItems.push({
        foodId:item.foodId,
        quantity:item.quantity,
        OTP: generateUnique4DigitOTP(),
        orderStatus:"PENDING"
      })
    
    }


   // price cap handling
   
    if(totalPrice < PRICE_CAP){
      throw new ApiError(400,"Minimum Order Value is 50")
    }

  const merchantTransactionIdByUs = Math.floor(Math.random() * 100000000000);
  
  console.log(merchantTransactionIdByUs) 

  // Creating a payload to send to phonepe

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: merchantTransactionIdByUs,
    merchantUserId: "MUID123",
    amount: totalPrice * 100,
    redirectUrl:`${APP_BE_URL}/api/v1/payment/statusAPI/${merchantTransactionIdByUs}`,
    redirectMode: "REDIRECT",
    mobileNumber: phoneNo,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const bufferObj = Buffer.from(JSON.stringify(payload), "utf-8");
  const base64EncodedPayLoad = bufferObj.toString("base64");

  const string = base64EncodedPayLoad + "/pg/v1/pay" + SALT_KEY;
  const sha256Value = sha256(string);
  const xVerify = sha256Value + "###" + SALT_INDEX;

 

  const options = {
    method: "post",
    url: `${PHONE_PE_HOST_URL}/pg/v1/pay`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY":xVerify
    },
    data: {
        request: base64EncodedPayLoad
    },
  };
  
  

   await Order.create({
    customerName: name,
    phoneNo: phoneNo,
    transactionId: merchantTransactionIdByUs,
    price: totalPrice,
    items: orderItems
  });

           
  await axios
    .request(options)
    .then(function (response) {
      session.commitTransaction()
      const url = response.data.data.instrumentResponse.redirectInfo.url
      return res.send(url);
    })
    .catch(function (error) {
      session.abortTransaction()
      console.error(error);
    });
});

// check payment status
const checkPayment = asyncHandler(async(req,res)=>{

    console.log("Checking Payment Status")

    const merchantTransactionId = req.params?.transactionId


    if(!merchantTransactionId){
        throw new ApiError(400,"No order found")
    }

    const orders = await Order.findOne({transactionId:merchantTransactionId})

    if(!orders){
      throw new ApiError(500,"Internal Server Error")
    }


    const xVerify = sha256(`/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`+ SALT_KEY )+ "###"+ SALT_INDEX


    const options = {
        method: 'get',
        url: `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
              accept: 'application/json',
              'Content-Type':'application/json',
              'X-MERCHANT-ID':MERCHANT_ID,
              'X-VERIFY':xVerify
             }
      };


      axios
        .request(options)
        .then(async function (response) {

            if(response.data?.code == 'PAYMENT_SUCCESS' ){
              orders.transactionStatus = "SUCCESS"
              await orders.save()
              await Emitter()
             // await messeger(orders)
              return res.redirect(`${frontendURL}/payment/success/${orders._id}`)
            }
            else if(response.data?.code == 'PAYMENT_ERROR'){
              orders.transactionStatus = "FAILED"
              await orders.save()
              return res.redirect(`${frontendURL}/payment/failed/${orders._id}`)
            }
        })
        .catch(function (error) {
          console.error(error);
        });  



})

async function Emitter(){
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // All Orders
  const orders = await Order.aggregate([
    {
      $match: {
        items: { $elemMatch: { orderStatus: { $in: ["PENDING"] } } },
        createdAt: { $gte: today }
      }
    },
    {
      $project: {
        customerName: 1,
        phoneNo: 1,
        transactionId: 1,
        transactionStatus: 1,
        price: 1,
        items: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $eq: ["$$item.orderStatus", "PENDING"] }
          }
        },
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);
  
  //orders.items.map(item => console.log(item))
  

  const ordersWithAMPM = orders.map(order => {
    const createdAtAMPM = order.createdAt.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true , timeZone: 'Asia/Kolkata'});
    return { 
        ...order,
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

  console.log(distinctFoods)
   
  const orderData = {
     ordersWithAMPM,
    distinctOrders: distinctFoods
  };
  

  io.emit("allOrders", orderData);
}


const checkOrderStatus = asyncHandler(async(req,res)=>{

  const id = req.params?.id 

  console.log(id)

  if(!id){
    throw new ApiError(400,"Invalid Id")
  }

  const order = await Order.findById(id).select("customerName phoneNo transactionStatus transactionId price")

  if(!order){
    throw new ApiError(400,"No Such Orders Exist")
  }

  return res
  .status(200)
  .json( new ApiResponse (200, "Order Status Fetched Success", order))

})


export { payToPhonePay , checkPayment, checkOrderStatus};
export default Emitter
