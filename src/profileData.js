export const EMPTY_PROFILE = { age: "", gender: "", occupation: "", foodHabit: "" };
export const GENDERS = ["Female", "Male", "Other"];
export const FOOD_HABITS = ["Non-Vegetarian", "Vegetarian", "Vegan"];

export function toProfileForm(profile) {
  return {
    age: profile?.age ?? "",
    gender: profile?.gender ?? "",
    occupation: profile?.occupation ?? "",
    foodHabit: profile?.food_habit ?? "",
  };
}

export function createProfilePayload(form, userId) {
  if (!userId) throw new Error("Please sign in again before saving your profile.");
  const ageText = String(form.age).trim();
  const age = ageText === "" ? null : Number(ageText);
  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 150)) {
    throw new Error("Enter a whole-number age between 0 and 150, or leave it empty.");
  }
  if (form.gender && !GENDERS.includes(form.gender)) throw new Error("Choose a gender from the list.");
  if (form.foodHabit && !FOOD_HABITS.includes(form.foodHabit)) throw new Error("Choose a food habit from the list.");
  return {
    id: userId,
    age,
    gender: form.gender || null,
    occupation: form.occupation.trim() || null,
    food_habit: form.foodHabit || null,
    updated_at: new Date().toISOString(),
  };
}
