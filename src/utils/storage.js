import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "nutrisnap_meals";

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
