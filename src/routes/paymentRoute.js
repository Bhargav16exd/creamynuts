import {Router} from 'express';
import { checkPayment, payToPhonePay } from '../controllers/client.controller.js';
import rateLimit from 'express-rate-limit';


const router = Router();

//rate limit trail
const rateLimiter = rateLimit({
    windowMs:  30 * 1000, // 15 minutes
    max: 200, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
})

router.use(rateLimiter)


router.route('/pay').post(payToPhonePay)
router.route('/statusAPI/:transactionId').get(checkPayment)




export default router;