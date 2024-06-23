
import axios from "axios";

async function messeger(orderData){

    console.log(orderData.OTP)

    const url = process.env.whatsappAPI
    const token = process.env.whatsappToken
    const recipientPhoneNumber = orderData.phoneNo
    const messageContent = 
    `Hello ${orderData.customerName} , Thank You for confirming the order of Rs ${orderData.price} . OTP is ${orderData.OTP} 
     Check your order status here http://localhost:5173/order/status/${orderData._id} 
     onlyfriends.in
    ` 

    
   const data = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhoneNumber,
    type: 'text',
    text: {
      preview_url: true,
      body: messageContent
    }
   }

   const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.post(url, data, config);
    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
    

}

export {
    messeger
}