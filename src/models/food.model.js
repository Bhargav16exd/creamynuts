import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    picture:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true
    },
    time:{
        type: String,
        required: true
    }
    
}, {timestamps: true})


export const Food = mongoose.model('Food', foodSchema);