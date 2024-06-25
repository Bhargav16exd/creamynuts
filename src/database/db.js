import mongoose from 'mongoose';


const connectToDatabase = async()=>{

    try {

        const connectionResult = await mongoose.connect(`${process.env.MONGO_DB_URL}/${process.env.DB_NAME}`)
        console.log("DB connected : " , connectionResult.connection.host)
        
    } catch (error) {

        console.log("DB connection failed : " , error)
        process.exit(1)
        
    }
    
}

export default connectToDatabase;