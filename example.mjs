
// npm install zod
// npm install openai
//npm install multer

import express from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";


dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const app = express();
const upload = multer({ dest: "uploads/" });


// TRANSCRIBE AUDIO

async function main() {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream("./uploads/recording.webm"),
    model: "gpt-4o-transcribe",
  });

  console.log(transcription.text);


// CONVERT TRANSCRIBE TEXT TO JSON
    // Validate drink order 

    // change this --> pull from database
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


    // json format response structure
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
    const orderJSON = response.output[0].content[0].text;
    console.log("Parsed Order:", orderJSON);

}


main();


