import { authRequest } from "./auth.js";

export function listCategories() {
  return authRequest("/api/categories");
}

export function createCategory(category) {
  return authRequest("/api/categories", { method: "POST", body: JSON.stringify(category) });
}

export function updateCategory(id, patch) {
  return authRequest(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export function deleteCategory(id) {
  return authRequest(`/api/categories/${id}`, { method: "DELETE" });
}
