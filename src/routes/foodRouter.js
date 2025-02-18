import { Router } from "express";
import { addFoodToMenu, deleteFoodFromMenu, getFoodMenu, listFoodItems, searchFood, singleFoodItem, updateFoodMenu } from "../controllers/food.controller.js";
import { checkOrderStatus } from "../controllers/client.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {upload} from "../middlewares/multer.middleware.js"



// Admin Permissions not yet added 
const router = Router();




// Admin Routes


router.route('/addItem').post(upload.single('image'),addFoodToMenu)
router.route('/deleteItem/:id').delete(deleteFoodFromMenu)
router.route('/updateItem/:id').put(upload.single('image'),updateFoodMenu)
router.route('/singleItem/:id').get(singleFoodItem)

//Listing Food Items on IDs

router.route('/foodList').post(listFoodItems)

// User Routes
router.route('/listMenu').get(getFoodMenu)

//search food 

router.route('/search/:name').get(searchFood)

// Client checking his order status
router.route('/checkStatus/:id').get(authMiddleware,checkOrderStatus)





export default router;