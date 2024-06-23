import express , {urlencoded} from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from "http"
import {Server} from 'socket.io'

// Importing Routes
import userRouter from "./routes/userRegisterationRoute.js"
import foodRouter from "./routes/foodRouter.js"
import paymentRouter from "./routes/paymentRoute.js"
import merchantRouter from "./routes/merchantRoute.js"
import { authenticateSocket } from './middlewares/authMiddleware.js';
import { socketListener } from './controllers/merchant.controller.js';


// Normal Express app
const app = express();

// Socket server

const server = http.createServer(app)

const io = new Server(server , {
    cors: {
        origin: '*',
        credentials: true
    }
})


// Middleware
app.use(cookieParser())
app.use(urlencoded({extended: true}))
app.use(cors({
    origin: '*',
    credentials: true
}))
app.use(express.static('public'))
app.use(express.json({
    limit: '50mb'
}))

io.use((socket,next)=>{
    authenticateSocket(socket,next)
})


// Routes
app.use('/api/v1/admin', userRouter)
app.use('/api/v1/menu',foodRouter )
app.use('/api/v1/payment',paymentRouter)
app.use('/api/v1/merchant',merchantRouter)


// Error Handling 
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message ;
    const errors = err.errors || [];

    res.status(statusCode).json({
        success:false,
        message,
        errors ,
        data:null
    })
    next()
})

export { server }
export default io;
socketListener();
