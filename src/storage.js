import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "seansownik-items-v1";
const WELCOME_KEY = "seansownik-welcome-seen-v1";

export async function loadAppData() {
  const [savedItems, welcomeSeen] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEY),
    AsyncStorage.getItem(WELCOME_KEY)
  ]);

  let items = [];
  if (savedItems) {
    const parsed = JSON.parse(savedItems);
    if (!Array.isArray(parsed)) throw new Error("Nieprawidłowy format zapisanej listy");
    items = parsed;
  }

  return { items, welcomeSeen: welcomeSeen === "1" };
}

export function saveItems(items) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveWelcomeSeen() {
  return AsyncStorage.setItem(WELCOME_KEY, "1");
}
