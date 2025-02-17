import {v2 as cloudinary} from "cloudinary";
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_KEY_SECRET
});


export const upload = async (path) => {

    try {

        if (!path) return null

        const uploadResult = await cloudinary.uploader.upload(path,{resource_type:"auto"})
        fs.unlinkSync(path)
        return uploadResult

        
    } catch (error) {

        console.log(error)
        fs.unlinkSync(path)
        return null
        
    }

}

export const removeImage = async (publicId) => {

    try {
        
        if(!publicId) return null

        const deleteResult = await cloudinary.uploader.destroy(publicId)
        return deleteResult

    } catch (error) {

        console.log(error)
        return null
    }
}