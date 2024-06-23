import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({


    userId: {
        type: String,
        required: true,
        unique: true
    },
    role:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true,
        select:false
    }
    
},
{
    timestamps: true
}
)


userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})



userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
}   


// Generating JWT token

userSchema.methods.getSignedToken = function(){
    

    return jwt.sign({
        id: this._id,
        role: this.role
    },
     process.env.JWT_SECRET,
    {
        expiresIn:'7d'

    })

}




export const User = mongoose.model("User",userSchema)