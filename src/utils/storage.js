import { v4 as uuidv4 } from "uuid";
import { format, parse } from "date-fns";
import Papa from "papaparse";

const STORAGE_KEY = "nutrisnap_meals";
const GOALS_KEY = "nutrisnap_daily_goals";

export const getAllMeals = () => {
  try {
    const meals = localStorage.getItem(STORAGE_KEY);
    return meals ? JSON.parse(meals) : [];
  } catch (error) {
    console.error("Error reading meals from storage:", error);
    return [];
  }
};

export const saveMeal = (newMeal) => {
  try {
    const meals = getAllMeals();
    const mealWithId = {
      ...newMeal,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    meals.push(mealWithId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));

    return mealWithId;
  } catch (error) {
    console.error("Error saving meal to storage:", error);
    throw error;
  }
};

export const deleteMeal = (id) => {
  try {
    const meals = getAllMeals();
    const filteredMeals = meals.filter((meal) => meal.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMeals));
  } catch (error) {
    console.error("Error deleting meal from storage:", error);
    throw error;
  }
};

export const getMealsByDate = (date) => {
  try {
    const meals = getAllMeals();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return meals.filter((meal) => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= targetDate && mealDate < nextDate;
    });
  } catch (error) {
    console.error("Error getting meals by date:", error);
    return [];
  }
};

export function exportMealsToCSV() {
  const meals = getAllMeals();

  // CSV Header
  const headers = [
    "id",
    "date",
    "time",
    "type",
    "foodName",
    "quantity",
    "calories (kcal)",
    "protein (g)",
    "carbohydrates_total (g)",
    "carbohydrates_fiber (g)",
    "carbohydrates_sugar (g)",
    "fat_total (g)",
    "fat_saturated (g)",
    "vitamin_a (mcg)",
    "vitamin_c (mg)",
    "vitamin_d (mcg)",
    "vitamin_b6 (mg)",
    "vitamin_b12 (mcg)",
    "sodium (mg)",
    "iron (mg)",
    "calcium (mg)",
    "potassium (mg)",
    "magnesium (mg)",
    "items (json)",
  ].join(",");

  // Format each meal into a CSV row
  const rows = meals.map((meal) => {
    const date = new Date(meal.timestamp);
    const nutrition = meal.geminiAnalysis?.nutrition || {};
    const vitamins = nutrition.vitamins || {};
    const minerals = nutrition.minerals || {};
    const itemsJson = JSON.stringify(meal.geminiAnalysis?.items || []);

    return [
      meal.id,
      format(date, "yyyy-MM-dd"),
      format(date, "hh:mm a"),
      meal.type,
      `"${(meal.geminiAnalysis?.foodName || "").replace(/"/g, '""')}"`,
      `"${(
        meal.geminiAnalysis?.quantity ||
        meal.userInput?.quantity ||
        ""
      ).replace(/"/g, '""')}"`,
      nutrition.calories?.value || "",
      nutrition.protein?.value || "",
      nutrition.carbs?.value || "",
      nutrition.fiber?.value || "",
      nutrition.sugar?.value || "",
      nutrition.fat?.value || "",
      nutrition.saturatedFat?.value || "",
      vitamins.vitaminA?.value || "",
      vitamins.vitaminC?.value || "",
      vitamins.vitaminD?.value || "",
      vitamins.vitaminB6?.value || "",
      vitamins.vitaminB12?.value || "",
      minerals.sodium?.value || "",
      minerals.iron?.value || "",
      minerals.calcium?.value || "",
      minerals.potassium?.value || "",
      minerals.magnesium?.value || "",
      `"${itemsJson.replace(/"/g, '""')}"`,
    ].join(",");
  });

  // Combine headers and rows
  return [headers, ...rows].join("\n");
}

// Function to trigger CSV download
export function downloadMealsCSV() {
  const csv = exportMealsToCSV();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `nutrisnap_meals_${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSVData(csvContent) {
  // Use PapaParse for robust CSV parsing
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors && parsed.errors.length > 0) {
    console.error("[CSV Import] PapaParse errors:", parsed.errors);
    throw new Error("CSV parsing error: " + parsed.errors[0].message);
  }
  const rows = parsed.data;
  const headers = parsed.meta.fields;
  const expectedHeaders = [
    "id",
    "date",
    "time",
    "type",
    "foodName",
    "quantity",
    "calories (kcal)",
    "protein (g)",
    "carbohydrates_total (g)",
    "carbohydrates_fiber (g)",
    "carbohydrates_sugar (g)",
    "fat_total (g)",
    "fat_saturated (g)",
    "vitamin_a (mcg)",
    "vitamin_c (mg)",
    "vitamin_d (mcg)",
    "vitamin_b6 (mg)",
    "vitamin_b12 (mcg)",
    "sodium (mg)",
    "iron (mg)",
    "calcium (mg)",
    "potassium (mg)",
    "magnesium (mg)",
    "items (json)",
  ];

  console.log("[CSV Import] Headers:", headers);
  // Allow both old and new CSVs (with or without items column)
  const isNewFormat =
    headers.length === expectedHeaders.length &&
    headers[headers.length - 1] === "items (json)";
  const isOldFormat = headers.length === expectedHeaders.length - 1;
  console.log(
    "[CSV Import] Detected format:",
    isNewFormat ? "new" : isOldFormat ? "old" : "invalid"
  );
  if (!isNewFormat && !isOldFormat) {
    console.error(
      "[CSV Import] Invalid CSV format: Headers do not match expected format"
    );
    throw new Error("Invalid CSV format: Headers do not match expected format");
  }

  const meals = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Parse date and time
      const dateStr = row["date"];
      const timeStr = row["time"]?.replace(".", ":"); // Convert decimal point to colon
      const parsedDate = parse(
        `${dateStr} ${timeStr}`,
        "yyyy-MM-dd hh:mm a",
        new Date()
      );
      if (isNaN(parsedDate.getTime())) {
        console.warn(
          `[CSV Import] Skipping row ${i + 2}: Invalid date/time format`
        );
        continue;
      }

      // Clean string values (remove quotes)
      const foodName = (row["foodName"] || "")
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"');
      const quantity = (row["quantity"] || "")
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"');

      // Handle items (json) column if present
      let items = [];
      if (isNewFormat) {
        const itemsJson = row["items (json)"] || "[]";
        try {
          items = JSON.parse(itemsJson.replace(/""/g, '"'));
          if (!Array.isArray(items)) items = [];
        } catch (err) {
          console.warn(
            `[CSV Import] Failed to parse items JSON in row ${i + 2}:`,
            err
          );
          items = [];
        }
      }

      const meal = {
        id: row["id"] || uuidv4(), // Use provided ID or generate new one
        timestamp: parsedDate.getTime(), // Convert to timestamp
        type: row["type"],
        userInput: {
          quantity,
          text: foodName,
        },
        geminiAnalysis: {
          foodName,
          items, // <-- add items array (empty for old CSVs)
          nutrition: {
            calories: { value: parseFloat(row["calories (kcal)"]) || 0 },
            protein: { value: parseFloat(row["protein (g)"]) || 0 },
            carbs: { value: parseFloat(row["carbohydrates_total (g)"]) || 0 },
            fiber: { value: parseFloat(row["carbohydrates_fiber (g)"]) || 0 },
            sugar: { value: parseFloat(row["carbohydrates_sugar (g)"]) || 0 },
            fat: { value: parseFloat(row["fat_total (g)"]) || 0 },
            saturatedFat: { value: parseFloat(row["fat_saturated (g)"]) || 0 },
            vitamins: {
              vitaminA: {
                value: parseFloat(row["vitamin_a (mcg)"]) || 0,
                unit: "mcg",
              },
              vitaminC: {
                value: parseFloat(row["vitamin_c (mg)"]) || 0,
                unit: "mg",
              },
              vitaminD: {
                value: parseFloat(row["vitamin_d (mcg)"]) || 0,
                unit: "mcg",
              },
              vitaminB6: {
                value: parseFloat(row["vitamin_b6 (mg)"]) || 0,
                unit: "mg",
              },
              vitaminB12: {
                value: parseFloat(row["vitamin_b12 (mcg)"]) || 0,
                unit: "mcg",
              },
            },
            minerals: {
              sodium: {
                value: parseFloat(row["sodium (mg)"]) || 0,
                unit: "mg",
              },
              iron: { value: parseFloat(row["iron (mg)"]) || 0, unit: "mg" },
              calcium: {
                value: parseFloat(row["calcium (mg)"]) || 0,
                unit: "mg",
              },
              potassium: {
                value: parseFloat(row["potassium (mg)"]) || 0,
                unit: "mg",
              },
              magnesium: {
                value: parseFloat(row["magnesium (mg)"]) || 0,
                unit: "mg",
              },
            },
          },
        },
      };
      console.log(`[CSV Import] Parsed meal row ${i + 2}:`, meal);
      meals.push(meal);
    } catch (error) {
      console.warn(`[CSV Import] Error parsing row ${i + 2}:`, error);
      continue;
    }
  }
  console.log(`[CSV Import] Total meals parsed: ${meals.length}`);
  return meals;
}

export function importMealsFromCSV(csvContent) {
  try {
    console.log("[CSV Import] Starting import...");
    const meals = parseCSVData(csvContent);
    const existingMeals = getAllMeals();
    console.log(
      `[CSV Import] Existing meals in storage: ${existingMeals.length}`
    );

    // Create a map of existing meal IDs
    const existingIds = new Set(existingMeals.map((meal) => meal.id));

    // Filter out meals that already exist and generate new IDs for duplicates
    const newMeals = meals.map((meal) => {
      if (existingIds.has(meal.id)) {
        console.log(
          `[CSV Import] Duplicate meal ID found, generating new ID: ${meal.id}`
        );
        return { ...meal, id: uuidv4() };
      }
      return meal;
    });

    // Save all meals
    const updatedMeals = [...existingMeals, ...newMeals];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
    console.log(`[CSV Import] Meals after import: ${updatedMeals.length}`);

    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new Event("storage"));

    return {
      success: true,
      imported: newMeals.length,
      total: updatedMeals.length,
    };
  } catch (error) {
    console.error("[CSV Import] Error importing meals:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function getDailyGoals() {
  try {
    const data = localStorage.getItem(GOALS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function setDailyGoals(goals) {
  const existingGoals = getDailyGoals();
  const updatedGoals = { ...existingGoals, ...goals };
  localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
}

export function removeDailyGoal(goalKey) {
  const existingGoals = getDailyGoals();
  delete existingGoals[goalKey];
  localStorage.setItem(GOALS_KEY, JSON.stringify(existingGoals));
}
