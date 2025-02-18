import { Router } from "express";
import { confirmOrder, getTodaysEarning } from "../controllers/merchant.controller.js";


const router = Router()


router.route('/deliverOrder').post(confirmOrder)


//Get Todays Earning Route
router.route('/todaysEarning').get(getTodaysEarning)

export default router;