import { authRequest } from "./auth.js";

export function listCategories() {
  return authRequest("/api/categories");
}

export function createCategory(category) {
  return authRequest("/api/categories", { method: "POST", body: JSON.stringify(category) });
}

export function deleteCategory(id) {
  return authRequest(`/api/categories/${id}`, { method: "DELETE" });
}
