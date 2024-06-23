import {Router} from 'express';
import { login, logout, registerUser } from '../controllers/user.controller.js';



const router = Router();

// User Registeration Route
router.route('/register').post(registerUser)

//Login Router
router.route('/login').post(login)

//Logout Route
router.route('/logout').post(logout)




export default router;