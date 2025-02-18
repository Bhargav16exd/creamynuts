import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Food } from "../models/food.model.js";
import { removeImage, upload } from "../utils/upload.js";


// Admins Options ONLY
const addFoodToMenu = asyncHandler(async(req,res)=>{

    const {name , price, category , time , description} = req.body

    if(!name || !price || !category || !time){
        throw new ApiError(400,"Please provide all the required fields")
    }


    if(!req.file){
        throw new ApiError(400,"Please provide an image")
    }

    const {secure_url , public_id} = await upload(req.file.path)

    if(!secure_url || !public_id){
        throw new ApiError(500,"Image upload failed")
    }

    const food = await Food.create({
        name,
        picture:secure_url,
        pictureId:public_id,
        price,
        category,
        time,
        description
    }) 

    await food.save()

    return res
    .status(201)
    .json(new ApiResponse(201, "Food added successfully"))

})

const deleteFoodFromMenu = asyncHandler(async(req,res)=>{

    const {id} = req.params

    if(!id){
        throw new ApiError(400,"Please provide all the required fields")
    }
    const food = await Food.findById(id)

    if(!food){
        throw new ApiError(404,"Food not found")
    }

    await removeImage(food.pictureId)
    await Food.findByIdAndDelete(id)

    return res
    .status(200)
    .json(new ApiResponse(200, "Food deleted successfully"))

})


const updateFoodMenu = asyncHandler(async(req,res)=>{

    const {id} = req.params
    const {name,description, price,category,time} = req.body

    if(!id ){
        throw new ApiError(400,"Please provide all the required fields")
    }


    const food = await Food.findById(id)

    if(!food){
        throw new ApiError(404,"Food not found")
    }

    if(req.file){

        const {secure_url , public_id} = await upload(req.file.path)

        if(!secure_url || !public_id){
            throw new ApiError(500,"Image upload failed")
        }

        await removeImage(food.pictureId)
        
        food.picture = secure_url
        food.pictureId = public_id
    }

    food.name = name
    food.price = price
    food.category = category
    food.time = time
    food.description = description

    await food.save()

    return res
    .status(200)
    .json(new ApiResponse(200, "Food updated successfully", food))

})


// Accessible to all users
const getFoodMenu = asyncHandler(async(req,res)=>{

    let food = await Food.find({})
    let category = await Food.distinct('category')

    function randomNumber(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    
    function shuffle(arr){
        let lastIndex = arr.length - 1 
        while(lastIndex>0){
            const randomIndex = randomNumber(0,lastIndex)
            let temp = arr[lastIndex]
            arr[lastIndex] = arr[randomIndex]
            arr[randomIndex] = temp 
            lastIndex -- 
        }
        return arr
    }

    food = shuffle(food)
    category = Array.from(new Set(food.map(item => item.category)));

    const menu = {
        food: food,
        category:category
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "Food Menu", menu))

})

// listing food items based on id recieved 

const listFoodItems = asyncHandler(async(req,res)=>{

    const idArray = req.body 


    if(!idArray){
        throw new ApiError(400,"Please provide all the required fields")
    }


    const foodList = await Promise.all(idArray.map(async (id) => {
        return await Food.findById(id.foodId);
    }));


    return res
    .status(200)
    .json(new ApiResponse(200, "Food Items", foodList))

})

const searchFood =  asyncHandler(async(req,res)=>{

    const {name} = req.params;

    if(!name){
        throw new ApiError(400,"Kindly Provide Name")
    }

    const food = await Food.find({
      name:{$regex : new RegExp(name,'igmu')}
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Search Patient Success",food)
    )
})



export {addFoodToMenu, deleteFoodFromMenu, updateFoodMenu, getFoodMenu,listFoodItems,searchFood} 