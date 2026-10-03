// Loader functions run BEFORE their matching route renders.
// react-router-dom calls these automatically when navigating to a route,
// waits for them to resolve, then renders the page with the returned data.
// Access the result inside a page with: const data = useLoaderData();

import * as api from "./api";

// Runs before Home renders - fetches categories to show under the hero video.
export async function homeLoader() {
  const categories = await api.getCategories().catch(() => []);
  return { categories };
}

// Runs before the category products page renders - fetches the category's own
// details (name, etc.) so the page has a title even before products load.
export async function categoryLoader({ params }) {
  const category = await api.getCategory(params.categoryId).catch(() => null);
  return { category };
}