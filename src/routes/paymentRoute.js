import {Router} from 'express';
import { checkPayment, payToPhonePay } from '../controllers/client.controller.js';


const router = Router();


router.route('/pay').post(payToPhonePay)
router.route('/statusAPI/:transactionId').get(checkPayment)




export default router;