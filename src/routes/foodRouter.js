import { Router } from "express";
import { addFoodToMenu, deleteFoodFromMenu, getFoodMenu, listFoodItems, updateFoodMenu } from "../controllers/food.controller.js";
import { checkOrderStatus } from "../controllers/client.controller.js";



// Admin Permissions not yet added 
const router = Router();


// Admin Routes

router.route('/addItem').post(addFoodToMenu)
router.route('/deleteItem').delete(deleteFoodFromMenu)
router.route('/updateItem').put(updateFoodMenu)

//Listing Food Items on IDs

router.route('/foodList').post(listFoodItems)

// User Routes
router.route('/listMenu').get(getFoodMenu)

// Client checking his order status
router.route('/checkStatus/:id').get(checkOrderStatus)





export default router;