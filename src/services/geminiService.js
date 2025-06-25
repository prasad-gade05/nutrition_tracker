// src/services/geminiService.js

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Use the latest, fast, and powerful multimodal model.
// 'gemini-1.5-flash-latest' is fast and cost-effective.
// 'gemini-1.5-pro-latest' is higher quality but slower/more expensive.
const MODEL_NAME = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// --- DETAILED PROMPT TEMPLATES ---

const NUTRITION_JSON_STRUCTURE = `
{
  "foodName": "A descriptive name of the meal",
  "items": [
    { "name": "Name of food item", "quantity": "Estimated quantity (e.g., 3 pieces, 2 bowls)" }
  ],
  "quantity": "The estimated total quantity or serving size",
  "nutrition": {
    "calories": { "value": Number, "unit": "kcal" },
    "macronutrients": {
      "protein": { "value": Number, "unit": "g" },
      "carbohydrates": {
        "total": { "value": Number, "unit": "g" },
        "fiber": { "value": Number, "unit": "g" },
        "sugar": { "value": Number, "unit": "g" }
      },
      "fat": {
        "total": { "value": Number, "unit": "g" },
        "saturated": { "value": Number, "unit": "g" }
      }
    },
    "micronutrients": {
      "vitamins": {
        "vitaminA": { "value": Number, "unit": "mcg" },
        "vitaminC": { "value": Number, "unit": "mg" },
        "vitaminD": { "value": Number, "unit": "mcg" },
        "vitaminB6": { "value": Number, "unit": "mg" },
        "vitaminB12": { "value": Number, "unit": "mcg" }
      },
      "minerals": {
        "sodium": { "value": Number, "unit": "mg" },
        "iron": { "value": Number, "unit": "mg" },
        "calcium": { "value": Number, "unit": "mg" },
        "potassium": { "value": Number, "unit": "mg" },
        "magnesium": { "value": Number, "unit": "mg" }
      }
    }
  }
}`;

const TEXT_PROMPT_TEMPLATE = `
You are a world-class nutritional analysis AI. Your task is to analyze the following food description and provide a detailed, structured nutritional breakdown.

**Food Description:** '{{description}}'
**Estimated Quantity:** '{{quantity}}'

Your response MUST be a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or include any text before or after it.

The JSON object must strictly follow this structure:
${NUTRITION_JSON_STRUCTURE}

**Example Request:**
Food Description: 'A large bowl of oatmeal with blueberries and almonds'
Estimated Quantity: '1 serving, approx 300g'

**Example Response:**
{
  "foodName": "Oatmeal with Blueberries and Almonds",
  "quantity": "1 serving, approx 300g",
  "nutrition": {
    "calories": { "value": 350, "unit": "kcal" },
    "macronutrients": {
      "protein": { "value": 10, "unit": "g" },
      "carbohydrates": { "total": { "value": 60, "unit": "g" }, "fiber": { "value": 8, "unit": "g" }, "sugar": { "value": 15, "unit": "g" } },
      "fat": { "total": { "value": 12, "unit": "g" }, "saturated": { "value": 1.5, "unit": "g" } }
    },
    "micronutrients": { "vitamins": { "vitaminC": { "value": 1.4, "unit": "mg" } }, "minerals": { "iron": { "value": 2.5, "unit": "mg" } } }
  }
}

**Important:** If the food description is too vague or unrecognizable (e.g., 'some food'), return this exact JSON object:
{ "error": "Unrecognizable food item. Please provide a more detailed description." }
`;

const IMAGE_PROMPT_TEMPLATE = `
You are a world-class nutritional analysis AI with expert vision capabilities. Your task is to identify all food items in the provided image, estimate their portion sizes, and provide a single, consolidated nutritional breakdown for the entire meal.

Your response MUST be a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or include any text before or after it.

The JSON object must strictly follow this structure:
${NUTRITION_JSON_STRUCTURE}

**Important:** The 'items' array must list each visible food item with its estimated quantity (e.g., 3 leg pieces, 2 breasts, 1 bowl of rice). This is for review only and should not affect the nutrition calculation.

**Important:** If the image does not contain identifiable food, return this exact JSON object:
{ "error": "No identifiable food found in the image. Please use a clearer photo." }

Now, analyze the provided image.
`;

/**
 * **FIXED VERSION**
 * A robust function to parse JSON from the API response.
 * It now handles the specific case of a truncated JSON string by attempting to append a closing brace.
 * @param {string} text - The raw text response from the API.
 * @returns {object} The parsed and normalized JSON object.
 */
const parseJsonFromText = (text) => {
  console.log("🔍 Raw API response text:", text);
  let cleanedText = text.trim();

  // Remove markdown code blocks just in case
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
  }

  let parsedData;
  try {
    // First attempt: Parse the text as-is
    parsedData = JSON.parse(cleanedText);
    console.log("✅ Successfully parsed JSON on first attempt.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn("⚠️ Initial parse failed. Error:", error.message);
      console.warn(
        "⚠️ Attempting to fix by appending a closing brace '}' for potential truncation..."
      );

      try {
        // Second attempt: Append '}' and try parsing again. This is the fix.
        const fixedText = cleanedText + "}";
        parsedData = JSON.parse(fixedText);
        console.log("✅ Successfully parsed JSON after fixing truncation!");
      } catch (secondError) {
        console.error(
          "❌ Failed to parse even after attempting a fix. The JSON is likely malformed.",
          secondError
        );
        throw new Error(
          "Unable to parse JSON response from API. The response may be malformed."
        );
      }
    } else {
      // If it's not a syntax error, something else is wrong.
      console.error("❌ An unexpected error occurred during parsing:", error);
      throw error;
    }
  }

  // Check for the structured error we defined in the prompt
  if (parsedData.error) {
    console.error("❌ API returned a structured error:", parsedData.error);
    throw new Error(parsedData.error);
  }

  // Normalize the response structure to match our expected format
  return normalizeNutritionData(parsedData);
};

/**
 * Normalizes different response structures from Gemini to our expected format
 * @param {object} data - The parsed JSON data from Gemini
 * @returns {object} Normalized nutrition data
 */
const normalizeNutritionData = (data) => {
  console.log("🔄 Normalizing nutrition data:", data);

  let normalized = {
    foodName: data.foodName || "Unknown Food",
    quantity: data.quantity || "1 serving",
    items: Array.isArray(data.items) ? data.items : [],
    nutrition: {
      calories: { value: 0, unit: "kcal" },
      protein: { value: 0, unit: "g" },
      carbs: { value: 0, unit: "g" },
      fat: { value: 0, unit: "g" },
      fiber: { value: 0, unit: "g" },
      sugar: { value: 0, unit: "g" },
      vitamins: {},
      minerals: {},
    },
  };

  if (data.nutrition) {
    const nutrition = data.nutrition;
    if (nutrition.calories) {
      normalized.nutrition.calories =
        typeof nutrition.calories === "object"
          ? nutrition.calories
          : { value: nutrition.calories, unit: "kcal" };
    }
    if (nutrition.macronutrients) {
      const macros = nutrition.macronutrients;
      if (macros.protein) normalized.nutrition.protein = macros.protein;
      if (macros.carbohydrates)
        normalized.nutrition.carbs =
          macros.carbohydrates.total || macros.carbohydrates;
      if (macros.fat) normalized.nutrition.fat = macros.fat.total || macros.fat;
      if (macros.carbohydrates && macros.carbohydrates.fiber)
        normalized.nutrition.fiber = macros.carbohydrates.fiber;
      if (macros.carbohydrates && macros.carbohydrates.sugar)
        normalized.nutrition.sugar = macros.carbohydrates.sugar;
    }
    if (nutrition.micronutrients) {
      const micros = nutrition.micronutrients;
      if (micros.vitamins) normalized.nutrition.vitamins = micros.vitamins;
      if (micros.minerals) normalized.nutrition.minerals = micros.minerals;
    }

    // Handle legacy structure (direct properties)
    if (nutrition.protein && !normalized.nutrition.protein.value) {
      normalized.nutrition.protein =
        typeof nutrition.protein === "object"
          ? nutrition.protein
          : { value: nutrition.protein, unit: "g" };
    }
    if (nutrition.carbs && !normalized.nutrition.carbs.value) {
      normalized.nutrition.carbs =
        typeof nutrition.carbs === "object"
          ? nutrition.carbs
          : { value: nutrition.carbs, unit: "g" };
    }
    if (nutrition.fat && !normalized.nutrition.fat.value) {
      normalized.nutrition.fat =
        typeof nutrition.fat === "object"
          ? nutrition.fat
          : { value: nutrition.fat, unit: "g" };
    }
    if (nutrition.fiber && !normalized.nutrition.fiber.value) {
      normalized.nutrition.fiber =
        typeof nutrition.fiber === "object"
          ? nutrition.fiber
          : { value: nutrition.fiber, unit: "g" };
    }
    if (nutrition.sugar && !normalized.nutrition.sugar.value) {
      normalized.nutrition.sugar =
        typeof nutrition.sugar === "object"
          ? nutrition.sugar
          : { value: nutrition.sugar, unit: "g" };
    }

    // Handle vitamins and minerals (legacy structure)
    if (
      nutrition.vitamins &&
      Object.keys(normalized.nutrition.vitamins).length === 0
    ) {
      normalized.nutrition.vitamins = nutrition.vitamins;
    }
    if (
      nutrition.minerals &&
      Object.keys(normalized.nutrition.minerals).length === 0
    ) {
      normalized.nutrition.minerals = nutrition.minerals;
    }
  }
  console.log("✅ Normalized nutrition data:", normalized);
  return normalized;
};

/**
 * Gets nutritional data from a text description using the Gemini API.
 */
export const getNutritionFromText = async (description, quantity) => {
  console.log("🚀 Starting text nutrition analysis for:", description);
  const prompt = TEXT_PROMPT_TEMPLATE.replace(
    "{{description}}",
    description
  ).replace("{{quantity}}", quantity);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ API request failed:", response.status, errorBody);
      throw new Error(`API request failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;

    // **CHANGE:** We now only need to call our single, robust parsing function.
    const nutritionData = parseJsonFromText(responseText);

    return { ...nutritionData, rawResponse: responseText };
  } catch (error) {
    console.error("❌ Error in getNutritionFromText:", error);
    throw error;
  }
};

/**
 * Gets nutritional data from an image using the Gemini API.
 */
export const getNutritionFromImage = async (base64Image) => {
  console.log("🚀 Starting image nutrition analysis");
  const imageData = base64Image.split(",")[1];
  if (!imageData) {
    throw new Error("Invalid Base64 image format.");
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: IMAGE_PROMPT_TEMPLATE },
              { inline_data: { mime_type: "image/jpeg", data: imageData } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ API request failed:", response.status, errorBody);
      throw new Error(`API request failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;

    // **CHANGE:** We now only need to call our single, robust parsing function.
    const nutritionData = parseJsonFromText(responseText);

    return { ...nutritionData, rawResponse: responseText };
  } catch (error) {
    console.error("❌ Error in getNutritionFromImage:", error);
    throw error;
  }
};

/**
 * Gets nutritional data from an image and a user suggestion using the Gemini API.
 * The suggestion is used to correct or clarify the item breakdown.
 */
export const getNutritionFromImageWithSuggestion = async (
  base64Image,
  suggestion
) => {
  console.log("🚀 Starting image nutrition analysis with user suggestion");
  const imageData = base64Image.split(",")[1];
  if (!imageData) {
    throw new Error("Invalid Base64 image format.");
  }

  // Compose a prompt that includes the suggestion
  const SUGGESTION_PROMPT = `\nA user has provided the following correction or clarification about the food items in the image:\n"${suggestion}"\nPlease use this information to improve the breakdown of items and their quantities, and update the nutrition analysis accordingly.\n`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: IMAGE_PROMPT_TEMPLATE + SUGGESTION_PROMPT },
              { inline_data: { mime_type: "image/jpeg", data: imageData } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ API request failed:", response.status, errorBody);
      throw new Error(`API request failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;

    const nutritionData = parseJsonFromText(responseText);

    return { ...nutritionData, rawResponse: responseText };
  } catch (error) {
    console.error("❌ Error in getNutritionFromImageWithSuggestion:", error);
    throw error;
  }
};
