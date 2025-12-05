// orderParser.js

const OpenAI = require("openai");
const client = new OpenAI();

exports.parseOrder = async (transcription, allDrinks) => {
    const drinkNames = allDrinks.map(d => d.name);

    const prompt = `
You are an order-parsing assistant for a bubble tea shop.
The customer said: "${transcription}"

Menu items:
${drinkNames.join(", ")}

Your job is to identify all requested drinks, their quantities, and their modifications.

Valid modifications:
- size (small, medium, large)
- ice level (no ice, light ice, regular ice, extra ice)
- sweetness (0%, 30%, 50%, 80%, 100%, 120%)
- topping (tapioca, lychee jelly, coffee jelly, ice cream, honey, passion fruit)

If a modification is NOT mentioned for a specific drink, return null for that field for that item. If a quantity is not explicitly mentioned, assume 1. Only include items from the Menu. Ignore any invalid or unrecognized drinks.

Return ONLY valid JSON in this format, containing an array of 'order_items'. Do not include any text outside of the JSON object.
JSON Schema to follow:
{
  "order_items": [
    {
      "drink_name": string,
      "quantity": number,
      "size": string | null,
      "ice_level": string | null,
      "sweetness": string | null,
      "topping": string | null
    }
  ]
}
    `;
    

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are an expert order parsing system. You MUST respond with a JSON object that strictly adheres to the JSON Schema provided in the user prompt."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        // ------------------------------------------------------------------
        // *** FIX: Use standard response_format instead of unsupported 'tools' ***
        // ------------------------------------------------------------------
        response_format: { type: "json_object" }, 
    });
    
    // The model's response is in the message content property
    const jsonString = response.choices[0].message.content;

    try {
        // Parse the JSON string directly
        const parsedOutput = JSON.parse(jsonString);
        return parsedOutput; // Return the structured object
    } catch (e) {
        console.error("Failed to parse GPT response JSON:", e);
        return { order_items: [] }; // Return empty array on failure
    }
};