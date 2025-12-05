// // audioController.js

// const { transcribeAudio } = require("../services/whisperService");
// const { parseOrder } = require("../services/orderParser");
// const fs = require('fs/promises'); // Use fs/promises for async file operations
// // path is not strictly needed here since we are just adding an extension

// // --- Mock Data and Constants ---
// const MOCK_DRINK_PRICES = new Map([
//     ["Classic Milk Tea", 4.50],
//     ["Taro Milk Tea", 5.00],
//     ["Brown Sugar Boba", 5.50],
//     ["Strawberry Smoothie", 6.00],
//     ["Winter Melon Tea", 4.00],
//     ["Jasmine Green Tea", 3.75]
// ]);
// const MOCK_ALL_DRINKS = Array.from(MOCK_DRINK_PRICES.keys()).map(name => ({ name }));

// const TOPPING_PRICE = 0.75;
// const TAX_RATE = 0.0825; 

// // -----------------------------------------------------------------
// // EXPORT 1: handleAudioUpload
// // -----------------------------------------------------------------
// exports.handleAudioUpload = async (req, res) => {
//     let tempAudioPath;
//     try {
//         const originalPath = req.file.path;
//         const newPath = originalPath + ".webm"; 
        
//         // CRITICAL FIX 1: Rename the Multer file to include the supported extension
//         await fs.rename(originalPath, newPath);
//         tempAudioPath = newPath; 

//         // 1. Whisper Transcription
//         const text = await transcribeAudio(tempAudioPath);

//         // 2. Load drinks from MOCK data
//         const allDrinks = MOCK_ALL_DRINKS;
//         const priceMap = MOCK_DRINK_PRICES;

//         // 3. Parse with GPT
//         const parsedData = await parseOrder(text, allDrinks);
//         let items = parsedData.order_items || [];

//         // 4. Filter invalid items and perform calculations (Multi-item logic)
//         let validItems = [];
//         let grandSubtotal = 0;

//         for (const item of items) {
//             const drinkName = item.drink_name;
//             const quantity = Math.max(1, Math.round(item.quantity) || 1); 
//             const basePrice = priceMap.get(drinkName);

//             if (basePrice !== undefined) {
//                 const hasTopping = item.topping !== null && item.topping.trim() !== "";
//                 const itemBaseCost = basePrice * quantity;
//                 const itemToppingCost = (hasTopping ? TOPPING_PRICE : 0) * quantity;
//                 const itemSubtotal = itemBaseCost + itemToppingCost;
                
//                 grandSubtotal += itemSubtotal;

//                 validItems.push({
//                     ...item,
//                     quantity: quantity,
//                     base_price: basePrice,
//                     topping_fee: (hasTopping ? TOPPING_PRICE : 0),
//                     item_subtotal: itemSubtotal.toFixed(2)
//                 });
//             }
//         }

//         if (validItems.length === 0) {
//             return res.json({
//                 success: true,
//                 transcription: text,
//                 order: null,
//                 message: "I couldn't recognize any valid drink from the menu. Please try again!"
//             });
//         }

//         // 5. Final Grand Total Calculation
//         const grandTax = grandSubtotal * TAX_RATE;
//         const grandTotal = grandSubtotal + grandTax;

//         return res.json({
//             success: true,
//             transcription: text,
//             order: {
//                 items: validItems,
//                 grand_subtotal: grandSubtotal.toFixed(2),
//                 grand_tax: grandTax.toFixed(2),
//                 grand_total: grandTotal.toFixed(2)
//             },
//             message: "Order ready for confirmation."
//         });

//     } catch (err) {
//         // Log the error response data if available (useful for debugging API issues)
//         console.error("Audio processing error:", err, err.response?.data);
//         res.status(500).json({ error: "Internal server error during audio processing." });
//     } finally {
//         // CRITICAL FIX 2: Cleanup: Delete the temporary file asynchronously
//         if (tempAudioPath) {
//             await fs.unlink(tempAudioPath).catch(console.error);
//         }
//     }
// };

// // -----------------------------------------------------------------
// // EXPORT 2: saveConfirmedOrder (Mocked, no DB access)
// // -----------------------------------------------------------------
// exports.saveConfirmedOrder = async (req, res) => {
//     // This function is still mocked as per your request.
//     const orderItems = req.body.items; 

//     if (!orderItems || orderItems.length === 0) {
//         return res.status(400).json({ success: false, message: "No items provided for saving." });
//     }

//     // Mock a saved ID and success message
//     res.json({
//         success: true,
//         message: `Order confirmed successfully! (Database save mocked: ${orderItems.length} item(s))`,
//         savedItems: orderItems.map((item, index) => ({ id: index + 1000, ...item }))
//     });
// };



// npm install zod
// npm install openai
//npm install multer

//import express from "express";
//import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";


dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//const app = express();
//const upload = multer({ dest: "uploads/" });

// Menu Validation
const drinkMenu = [
  "taro milk tea",
  "thai tea",
  "matcha latte",
  "oolong milk tea",
  "brown sugar milk tea",
  "strawberry smoothie",
  "coffee milk tea"
];

const toppingMenu = [
  "tapioca pearl",
  "lychee jelly",
  "coffee jelly",
  "ice cream",
  "honey",
  "passion fruit"
 ];


// JSON SCHEMA
const drinkItem = z.object({
  valid: z.boolean(),
  drink: z.string(),
  size: z.string().nullable(),
  toppings: z.array(z.string()).nullable(),
  sweetness: z.string().nullable(),
  ice: z.string().nullable(),
  quantity: z.number()
});

const drinkOrder = z.object({
  orders: z.array(drinkItem)
});




export async function handleAudioRequest(filePath) {
  try{

    // TRANSCRIBE AUDIO
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-transcribe",
    });   
    // for testing purposes-- can delete onces functioning loll
    const transcribedText = transcription.text
    console.log(transcribedText);


    // CONVERT TRANSCRIBE TO JSON
    const response = await client.responses.parse({
    model: "gpt-4o-mini",
    input: [
        {
        role: "system",
        content:
                `
                You are a drink ordering kiosk.
                Here is the valid drink menu: ${drinkMenu.join(", ")}  
                Here are valid toppings: ${toppingMenu.join(", ")}
                Here are valid sweetness levels: 0%, 25%, 50%, 75%, 100%.
                Here are valid ice levels: no ice, light ice, regular ice, extra ice.
                Here are valid drink sizes: small, medium, large.

                DEFAULT VALUES:
                - If toppings are not specified → "no toppings" 
                - If sweetness is not specified → "100%"
                - If ice level is not specified → "regular ice"
                - If size is not specified → "medium"
                - If quantity is not specified → 1
             
                RULES:
                1. You must output a JSON structure that matches the provided Zod schema.
                2. If the user orders more than one drink, create multiple entries inside "orders".
                3. If a drink is NOT on the drink menu:
                    - Set "valid": false
                    - Fill all other fields with null EXCEPT "quantity", which must be 1 unless stated.
                4. If the drink IS valid:
                    - Set "valid": true
                    - Fill missing fields using the default values.
                5. Never output anything except valid JSON that matches the schema.
                `
        },
        { role: "user", content: transcription.text },
    ],
    text: {
        format: zodTextFormat(drinkOrder, "drink_order"),
      },
    });

    // Also for testing purposes to check if json output is correct
    const orderJSON = response.output[0].content[0].text;
    console.log("Parsed Order:", orderJSON);

    return{
      transcription: transcribedText,
      parsedOrder: JSON.parse(orderJSON)
    };

  } catch(error){
      console.error("Error in handleAudioRequest:", error);
      throw new Error("Failed to process audio order via OpenAI.");
  }
}




