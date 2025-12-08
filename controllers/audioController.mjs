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

import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
  ssl: { rejectUnauthorized: false }
});


// Add process hook to shutdown pool
process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});


//const app = express();
//const upload = multer({ dest: "uploads/" });


// GET DRINK FROM DB
async function getDrinkMenu() {
  const result = await pool.query("SELECT * FROM beverage_info");
  return result.rows.map(r => [r.name, r.price, r.beverage_info_id]);
}

// Menu Validation
const drinkMenu = await getDrinkMenu();
console.log("Drink menu from DB:", drinkMenu);

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
  drinkPrice : z.number(),
  drinkId: z.number(),
  size: z.string().nullable(),
  toppings: z.array(z.string()).nullable(),
  sweetnessLevel: z.string().nullable(),
  iceLevel: z.string().nullable(),
  quantity: z.number()
});

const drinkOrder = z.object({
  orders: z.array(drinkItem),
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

                If a field is not provided by the user but defaults exist, 
                YOU MUST OUTPUT THE DEFAULT VALUE IN THE JSON. NEVER OUTPUT null for valid drinks.
                DEFAULT VALUES:
                - If toppings are not specified → "no toppings"
                - If sweetness is not specified → "100%"
                - If ice level is not specified → "regular ice"
                - If size is not specified → "medium"
                - If quantity is not specified → 1

                RULES:
                1. You must output a JSON structure that matches the provided Zod schema.
                2. If the user orders more than one drink, create multiple entries inside "orders".

                3. Handling mispronunciations or shortened names:
                  - If a drink name is *close* to a valid drink name on the menu, normalize it to the closest correct menu name.
                  - “Close” means:
                      • missing words (“classic black” → “Classic Tea (Black)”)  
                      • mispronunciations (“oolon” → “oolong milk tea”)  
                      • truncations (“brown sugar” → “brown sugar milk tea”)  
                  - EXAMPLES:
                      User says: “black tea” → drink = “Classic Tea (Black)”
                      User says: “match latte” → drink = “matcha latte”
                      User says: “strawberry smoothy” → drink = “strawberry smoothie”
                      User says: “taro” → drink = “taro milk tea”

                4. If the drink is NOT similar to anything on the menu:
                  - Set "valid": false
                  - "drink": null
                  - All other fields null EXCEPT "quantity" (use 1 unless they specify more)

                5. If the drink IS valid:
                  - Set "valid": true
                  - Fill all missing fields with default values.

                6. Never output anything except valid JSON that matches the schema. 
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







