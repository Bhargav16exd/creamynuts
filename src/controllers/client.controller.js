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



const MERCHANT_ID = "PGTESTPAYUAT143";
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const SALT_INDEX = 1;
const SALT_KEY = "ab3ab177-b468-4791-8071-275c404d8ab0";
const APP_BE_URL = "http://localhost:8010";

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

      totalPrice = totalPrice + food.price * item.quantity

      orderItems.push({
        foodId:item.foodId,
        quantity:item.quantity,
        OTP: Math.floor(Math.random() * 10000),
        orderStatus:"PENDING"
      })
    
    }


   // price cap handling
   
    if(totalPrice < 50){
      throw new ApiError(400,"Minimum Order Value is 50")
    }

  const merchantTransactionIdByUs = Math.floor(Math.random() * 100000000000);
  
  console.log(totalPrice)

  // Creating a payload to send to phonepe

  const payload = {
    merchantId: "PGTESTPAYUAT143",
    merchantTransactionId: "MT7850590068188104",
    merchantUserId: "MUID123",
    amount: totalPrice * 100,
    redirectUrl:`${APP_BE_URL}/api/v1/payment/statusAPI/MT7850590068188104`,
    redirectMode: "REDIRECT",
    mobileNumber: "9999999999",
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
    url: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
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
    transactionId:"MT7850590068188104",
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
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
              accept: 'application/json',
              'Content-Type':'application/json',
              'X-MERCHANT-ID':'PGTESTPAYUAT',
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
              return res.redirect("http://localhost:5173/payment/success")
            }
            else if(response.data?.code == 'PAYMENT_ERROR'){
              orders.transactionStatus = "FAILED"
              await orders.save()
              return res.redirect("http://localhost:5173/payment/failed")
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
  const orders = await Order.find({
      items: { $elemMatch: { orderStatus: { $in: ["PENDING", "ACCEPTED"] } } },
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

  const order = await Order.findById(id)

  if(!order){
    throw new ApiError(400,"No Such Orders Exist")
  }

  return res
  .status(200)
  .json( new ApiResponse (200, "Order Status Fetched Success", order))

})


export { payToPhonePay , checkPayment, checkOrderStatus};
export default Emitter
