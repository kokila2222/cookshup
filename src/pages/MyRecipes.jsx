import React, { useState } from "react";
import { Link } from "react-router-dom";

function renderStars(rating, setRating) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? "star-active" : "star-empty"} ${setRating ? "star-clickable" : ""}`}
          onClick={setRating ? () => setRating(star) : undefined}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

function getUniqueOptions(recipes, field) {
  let values = [];
  recipes.forEach((r) => {
    if (field === "category" && Array.isArray(r[field])) {
      values.push(...r[field]);
    } else if (r[field]) {
      values.push(r[field]);
    }
  });
  return Array.from(new Set(values.filter(Boolean)));
}

function formatCategory(category) {
  if (Array.isArray(category)) {
    return category.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
  }
  return category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
}

function MyRecipes({ recipes, editRecipe, deleteRecipe, showToast }) {
  const typeOptions = ["all", ...getUniqueOptions(recipes, "type")];
  const cuisineOptions = ["all", ...getUniqueOptions(recipes, "cuisine")];
  const categoryOptions = ["all", ...getUniqueOptions(recipes, "category")];

  const [filterType, setFilterType] = useState("all");
  const [filterCuisine, setFilterCuisine] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filteredRecipes = recipes.filter(
    (recipe) =>
      (filterType === "all" || recipe.type === filterType) &&
      (filterCuisine === "all" || recipe.cuisine === filterCuisine) &&
      (filterCategory === "all" ||
        (Array.isArray(recipe.category)
          ? recipe.category.includes(filterCategory)
          : recipe.category === filterCategory))
  );

  function startEdit(recipe) {
    setEditingId(recipe.id);
    setEditForm({ ...recipe });
  }

  function handleEditChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveEdit() {
    try {
      await editRecipe(editForm);
      setEditingId(null);
      setEditForm({});
      showToast && showToast("Recipe updated!");
    } catch (e) {
      console.error("Failed to update recipe:", e);
      alert("Something went wrong while saving.");
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">My Recipes</h2>
        <p className="page-subtitle">{recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Type</span>
          <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Cuisine</span>
          <select className="filter-select" value={filterCuisine} onChange={(e) => setFilterCuisine(e.target.value)}>
            {cuisineOptions.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#128221;</div>
          <p className="empty-state-text">No recipes yet. Start adding some!</p>
          <Link to="/enter-recipe" className="btn-primary" style={{ textDecoration: "none", color: "#fff" }}>
            Add Recipe
          </Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe) =>
            editingId === recipe.id ? (
              /* ---- Edit Mode ---- */
              <div key={recipe.id} className="edit-card">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => handleEditChange("title", e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label>Category</label>
                    <input
                      type="text"
                      value={Array.isArray(editForm.category) ? editForm.category.join(", ") : editForm.category}
                      onChange={(e) =>
                        handleEditChange("category", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Cuisine</label>
                    <input
                      type="text"
                      value={editForm.cuisine}
                      onChange={(e) => handleEditChange("cuisine", e.target.value)}
                    />
                  </div>
                </div>

                {editForm.type === "video" && editForm.youtubeId && (
                  <div className="video-embed" style={{ marginBottom: 16 }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${editForm.youtubeId}`}
                      title="YouTube video"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                )}

                {editForm.type === "url" && (
                  <div className="form-group">
                    <label>Recipe URL</label>
                    <input
                      type="url"
                      value={editForm.recipeUrl || ""}
                      onChange={(e) => handleEditChange("recipeUrl", e.target.value)}
                    />
                    {editForm.recipeUrlImage && (
                      <img src={editForm.recipeUrlImage} alt="Preview" className="url-preview-image" style={{ marginTop: 8 }} />
                    )}
                  </div>
                )}

                {editForm.type === "text" && (
                  <>
                    <div className="form-group">
                      <label>Ingredients</label>
                      <textarea
                        value={editForm.ingredients}
                        onChange={(e) => handleEditChange("ingredients", e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Instructions</label>
                      <textarea
                        value={editForm.instructions}
                        onChange={(e) => handleEditChange("instructions", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => handleEditChange("notes", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="form-inline-group" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ marginBottom: 0 }}>Rating</label>
                    <div>{renderStars(editForm.rating, (r) => handleEditChange("rating", r))}</div>
                  </div>
                  <div>
                    <label style={{ marginBottom: 0 }}>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => handleEditChange("status", e.target.value)}
                      style={{ width: "auto", minWidth: 140 }}
                    >
                      <option value="made">Made it</option>
                      <option value="yet">Yet to make it</option>
                    </select>
                  </div>
                  <label className="form-check-label">
                    <input
                      type="checkbox"
                      checked={!!editForm.showInFeeds}
                      onChange={(e) => handleEditChange("showInFeeds", e.target.checked)}
                    />
                    Show in Feeds
                  </label>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSaveEdit} className="btn-success btn-sm">Save</button>
                  <button onClick={handleCancelEdit} className="btn-outline btn-sm">Cancel</button>
                </div>
              </div>
            ) : (
              /* ---- View Mode ---- */
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-card-header">
                  <div>
                    <h3 className="recipe-card-title">
                      <Link to={`/recipe/${recipe.id}`}>{recipe.title}</Link>
                    </h3>
                  </div>
                  <div>{renderStars(recipe.rating)}</div>
                </div>

                <div className="recipe-card-meta">
                  {recipe.cuisine && <span className="tag">{recipe.cuisine}</span>}
                  {Array.isArray(recipe.category) &&
                    recipe.category.map((cat) => (
                      <span key={cat} className="tag tag-outline">{cat}</span>
                    ))}
                  <span className={`tag ${recipe.status === "made" ? "tag-success" : "tag-warning"}`}>
                    {recipe.status === "made" ? "Made it" : "Yet to make it"}
                  </span>
                  {recipe.showInFeeds && <span className="tag" style={{ background: "#f0fdf4", color: "#16a34a" }}>In Feeds</span>}
                </div>

                {recipe.type === "video" && recipe.youtubeId && (
                  <div className="video-embed" style={{ marginBottom: 16 }}>
                    <iframe src={`https://www.youtube.com/embed/${recipe.youtubeId}`} title="YouTube video" frameBorder="0" allowFullScreen />
                  </div>
                )}

                {recipe.type === "url" && recipe.recipeUrl && (
                  <a href={recipe.recipeUrl} target="_blank" rel="noopener noreferrer" className="url-card-link" style={{ marginBottom: 16 }}>
                    {recipe.recipeUrlImage && (
                      <img src={recipe.recipeUrlImage} alt={recipe.title} className="url-card-image" />
                    )}
                    <div className="url-card-domain">
                      {new URL(recipe.recipeUrl).hostname.replace("www.", "")}
                    </div>
                  </a>
                )}

                {recipe.notes && (
                  <div className="recipe-card-section">
                    <div className="recipe-card-section-label">Notes</div>
                    <div className="recipe-card-section-content">{recipe.notes}</div>
                  </div>
                )}

                <div className="recipe-card-footer">
                  <div />
                  <div className="recipe-card-actions">
                    <button onClick={() => startEdit(recipe)} className="btn-outline btn-sm">Edit</button>
                    <button onClick={() => deleteRecipe(recipe.id)} className="btn-outline-danger btn-sm">Delete</button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default MyRecipes;
