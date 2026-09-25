import { authRequest } from "./auth.js";
import { logger } from "../utils/logger.js";

export function listCategories() {
  logger.info('categories', 'listCategories called');
  return authRequest("/api/categories");
}

export function createCategory(category) {
  logger.info('categories', 'createCategory called', { label: category.label, type: category.type });
  return authRequest("/api/categories", { method: "POST", body: JSON.stringify(category) });
}

export function updateCategory(id, patch) {
  logger.info('categories', `updateCategory: ${id}`);
  return authRequest(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export function deleteCategory(id) {
  logger.warn('categories', `deleteCategory: ${id}`);
  return authRequest(`/api/categories/${id}`, { method: "DELETE" });
}
