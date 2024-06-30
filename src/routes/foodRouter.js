import { Router } from "express";
import { addFoodToMenu, deleteFoodFromMenu, getFoodMenu, listFoodItems, updateFoodMenu } from "../controllers/food.controller.js";
import { checkOrderStatus } from "../controllers/client.controller.js";
import rateLimit from "express-rate-limit"


// Admin Permissions not yet added 
const router = Router();

//rate limit trail
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
})

router.use(rateLimiter)


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