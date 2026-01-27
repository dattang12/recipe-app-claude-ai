export async function getRecipeFromMistral(ingredientsArr) {
  const res = await fetch("/api/recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients: ingredientsArr, provider: "mistral" }),
  })

  if (!res.ok) {
    throw new Error("Failed to fetch recipe")
  }

  const data = await res.json()
  return data.recipe
}
