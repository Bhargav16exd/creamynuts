import { Router } from "express";
import { confirmOrder } from "../controllers/merchant.controller.js";


const router = Router()

router.route('/deliverOrder').post(confirmOrder)

export default router;