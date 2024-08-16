import mongoose from "mongoose";
import jwt from "jsonwebtoken";


const orderSchema = new mongoose.Schema({


    customerName:{
        type: String,
        required: true
    },
    phoneNo:{
        type: Number,
        required: true
    },
    transactionId:{
        type: String,
        select: false
    },
    transactionStatus:{
        type: String,
        default:"NOT STARTED",
        enum:['NOT STARTED', 'SUCCESS', 'FAILED']
    },
    price:{
        type: Number,
        required: true
    },
    items:[{
        foodId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            required: true
        },
        quantity:{
            type: Number,
            required: true
        },
        OTP:{
            type: Number,
            required: true
        },
        orderStatus:{
            type: String,
            default: "PENDING",
            enum:['PENDING', 'DELIVERED']
        }

    }]

},
{timestamps: true})


// Order Validation

orderSchema.methods.generateToken = function(){

    return jwt.sign({
        id: this._id,
        transactionId: this.transactionId
    },
    process.env.JWT_SECRET,
    {
        expiresIn: '10m'
    })

}


export const Order = mongoose.model("Order", orderSchema)