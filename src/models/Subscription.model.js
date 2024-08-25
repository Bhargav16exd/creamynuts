import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
});
  
export const Subscription = mongoose.model('Subscription', subscriptionSchema);