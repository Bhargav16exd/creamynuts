import axios from "axios";
import {Food} from "../models/food.model.js"
async function messeger(orderData){

    const url = process.env.whatsappAPI
    const token = process.env.whatsappToken
    const recipientPhoneNumber = orderData.phoneNo
  
    const foodNames = await Promise.all(orderData.items.map(async item => {
      const food = await Food.findById(item.foodId);
      return { name: food.name, OTP: item.OTP };
    }));
  
    const itemsString = foodNames.map(item => ` ${item.name} : OTP ${item.OTP} `).join(',');

    const sanitizedItemsString = itemsString.replace(/[\n\r]/g, '');
  
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const data = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNumber,
      type: 'template',
      template: {
        name: 'template02',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: orderData.customerName },
              { type: 'text', text: sanitizedItemsString },
            ],
          },
        ],
      },
    }

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