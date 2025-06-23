import { v4 as uuidv4 } from "uuid";
import { format, parse } from "date-fns";

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
  ].join(",");

  // Format each meal into a CSV row
  const rows = meals.map((meal) => {
    const date = new Date(meal.timestamp);
    const nutrition = meal.geminiAnalysis?.nutrition || {};
    const vitamins = nutrition.vitamins || {};
    const minerals = nutrition.minerals || {};

    return [
      meal.id,
      format(date, "yyyy-MM-dd"),
      format(date, "hh:mm a"),
      meal.type,
      `"${(meal.geminiAnalysis?.foodName || "").replace(/"/g, '""')}"`,
      `"${(meal.userInput?.quantity || "").replace(/"/g, '""')}"`,
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
  const lines = csvContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const headers = lines[0].split(",");
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
  ];

  // Validate headers
  if (
    headers.length !== expectedHeaders.length ||
    !expectedHeaders.every((header, index) => headers[index] === header)
  ) {
    throw new Error("Invalid CSV format: Headers do not match expected format");
  }

  const meals = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((value) => value.trim());
    if (values.length !== headers.length) continue;

    try {
      // Parse date and time
      const dateStr = values[1];
      const timeStr = values[2].replace(".", ":"); // Convert decimal point to colon
      const parsedDate = parse(
        `${dateStr} ${timeStr}`,
        "dd-MM-yyyy hh:mm a",
        new Date()
      );
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Skipping row ${i + 1}: Invalid date/time format`);
        continue;
      }

      // Clean string values (remove quotes)
      const foodName = values[4].replace(/^"|"$/g, "").replace(/""/g, '"');
      const quantity = values[5].replace(/^"|"$/g, "").replace(/""/g, '"');

      const meal = {
        id: values[0] || uuidv4(), // Use provided ID or generate new one
        timestamp: parsedDate.getTime(), // Convert to timestamp
        type: values[3],
        userInput: {
          quantity,
          text: foodName,
        },
        geminiAnalysis: {
          foodName,
          nutrition: {
            calories: { value: parseFloat(values[6]) || 0 },
            protein: { value: parseFloat(values[7]) || 0 },
            carbs: { value: parseFloat(values[8]) || 0 },
            fiber: { value: parseFloat(values[9]) || 0 },
            sugar: { value: parseFloat(values[10]) || 0 },
            fat: { value: parseFloat(values[11]) || 0 },
            saturatedFat: { value: parseFloat(values[12]) || 0 },
            vitamins: {
              vitaminA: { value: parseFloat(values[13]) || 0, unit: "mcg" },
              vitaminC: { value: parseFloat(values[14]) || 0, unit: "mg" },
              vitaminD: { value: parseFloat(values[15]) || 0, unit: "mcg" },
              vitaminB6: { value: parseFloat(values[16]) || 0, unit: "mg" },
              vitaminB12: { value: parseFloat(values[17]) || 0, unit: "mcg" },
            },
            minerals: {
              sodium: { value: parseFloat(values[18]) || 0, unit: "mg" },
              iron: { value: parseFloat(values[19]) || 0, unit: "mg" },
              calcium: { value: parseFloat(values[20]) || 0, unit: "mg" },
              potassium: { value: parseFloat(values[21]) || 0, unit: "mg" },
              magnesium: { value: parseFloat(values[22]) || 0, unit: "mg" },
            },
          },
        },
      };
      meals.push(meal);
    } catch (error) {
      console.warn(`Error parsing row ${i + 1}:`, error);
      continue;
    }
  }
  return meals;
}

export function importMealsFromCSV(csvContent) {
  try {
    const meals = parseCSVData(csvContent);
    const existingMeals = getAllMeals();

    // Create a map of existing meal IDs
    const existingIds = new Set(existingMeals.map((meal) => meal.id));

    // Filter out meals that already exist and generate new IDs for duplicates
    const newMeals = meals.map((meal) => {
      if (existingIds.has(meal.id)) {
        return { ...meal, id: uuidv4() };
      }
      return meal;
    });

    // Save all meals
    const updatedMeals = [...existingMeals, ...newMeals];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));

    // Dispatch storage event to notify other tabs
    window.dispatchEvent(new Event("storage"));

    return {
      success: true,
      imported: newMeals.length,
      total: updatedMeals.length,
    };
  } catch (error) {
    console.error("Error importing meals:", error);
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
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}
