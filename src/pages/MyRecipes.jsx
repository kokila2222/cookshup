import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import UrlCardImage from "../components/UrlCardImage";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const CUISINE_OPTIONS = [
  "Indian", "Italian", "Chinese", "Mexican", "Thai", "American", "Japanese", "Korean", "Middle Eastern", "Other",
];

const CATEGORY_OPTIONS = [
  "Breakfast", "Lunch", "Dinner", "Snack", "Vegan", "Vegetarian", "Gluten Free", "Dessert", "Quick Meal", "Healthy",
];

function renderStars(rating, setRating) {
  if (!setRating && (!rating || rating === 0)) {
    return <span className="rating-unset">Not rated</span>;
  }
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

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MyRecipes({ recipes, editRecipe, deleteRecipe, showToast, currentUser }) {
  const typeOptions = ["all", ...getUniqueOptions(recipes, "type")];
  const cuisineOptions = ["all", ...getUniqueOptions(recipes, "cuisine")];
  const categoryOptions = ["all", ...getUniqueOptions(recipes, "category")];

  const [filterType, setFilterType] = useState("all");
  const [filterCuisine, setFilterCuisine] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editThumbFile, setEditThumbFile] = useState(null);
  const [editThumbPreview, setEditThumbPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const editThumbInputRef = useRef();

  const filteredRecipes = recipes.filter(
    (recipe) =>
      (filterType === "all" || recipe.type === filterType) &&
      (filterCuisine === "all" || recipe.cuisine === filterCuisine) &&
      (filterCategory === "all" ||
        (Array.isArray(recipe.category)
          ? recipe.category.includes(filterCategory)
          : recipe.category === filterCategory))
  );

  function handleTagClick(type, value) {
    if (type === "cuisine") {
      setFilterCuisine((prev) => (prev === value ? "all" : value));
    } else if (type === "category") {
      setFilterCategory((prev) => (prev === value ? "all" : value));
    }
  }

  function startEdit(recipe) {
    setEditingId(recipe.id);
    setEditForm({
      ...recipe,
      category: Array.isArray(recipe.category) ? recipe.category : (recipe.category ? [recipe.category] : []),
    });
    setEditThumbFile(null);
    setEditThumbPreview("");
  }

  function handleEditChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleEditCategory(value) {
    setEditForm((prev) => ({
      ...prev,
      category: prev.category.includes(value)
        ? prev.category.filter((v) => v !== value)
        : [...prev.category, value],
    }));
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      let updatedForm = { ...editForm };

      // Upload new thumbnail if pasted/uploaded
      if (currentUser && editThumbFile && editForm.type === "url") {
        showToast && showToast("Uploading thumbnail...");
        const thumbRef = ref(
          storage,
          `recipes/${currentUser.uid}/${Date.now()}_thumb_${editThumbFile.name}`
        );
        await uploadBytes(thumbRef, editThumbFile);
        updatedForm.recipeUrlImage = await getDownloadURL(thumbRef);
      }

      await editRecipe(updatedForm);
      setEditingId(null);
      setEditForm({});
      setEditThumbFile(null);
      setEditThumbPreview("");
      showToast && showToast("Recipe updated!");
    } catch (e) {
      console.error("Failed to update recipe:", e);
      alert("Something went wrong while saving.");
    }
    setSaving(false);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm({});
    setEditThumbFile(null);
    setEditThumbPreview("");
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

                {/* Cuisine - structured radio pickers */}
                <div className="form-group">
                  <label>Cuisine</label>
                  <div className="edit-picker-group">
                    {CUISINE_OPTIONS.map((opt) => (
                      <label key={opt} className="form-check-label">
                        <input
                          type="radio"
                          name="edit-cuisine"
                          value={opt}
                          checked={editForm.cuisine === opt}
                          onChange={() => handleEditChange("cuisine", opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category - structured checkbox pickers */}
                <div className="form-group">
                  <label>Category</label>
                  <div className="edit-picker-group">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <label key={opt} className="form-check-label">
                        <input
                          type="checkbox"
                          checked={editForm.category?.includes(opt) || false}
                          onChange={() => toggleEditCategory(opt)}
                        />
                        {opt}
                      </label>
                    ))}
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
                    <label style={{ marginTop: 12 }}>Thumbnail Image</label>
                    {(editThumbPreview || editForm.recipeUrlImage) && (
                      <img
                        src={editThumbPreview || editForm.recipeUrlImage}
                        alt="Preview"
                        className="url-preview-image"
                        style={{ marginTop: 8, maxHeight: 140, objectFit: "cover", borderRadius: 8, width: "100%" }}
                      />
                    )}
                    <div
                      tabIndex={0}
                      onPaste={(e) => {
                        const items = e.clipboardData?.items;
                        if (!items) return;
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type.startsWith("image/")) {
                            const file = items[i].getAsFile();
                            if (file) {
                              setEditThumbFile(file);
                              setEditThumbPreview(URL.createObjectURL(file));
                              showToast && showToast("Image pasted!");
                            }
                            break;
                          }
                        }
                      }}
                      style={{
                        marginTop: 8,
                        border: "2px dashed #cbd5e1",
                        borderRadius: 10,
                        padding: "18px 12px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "0.92rem",
                        cursor: "pointer",
                        background: "#f8fafc",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                    >
                      Click here &amp; paste an image (Ctrl+V)
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        Copy an image from the web, then paste here
                      </span>
                    </div>
                    {editThumbFile && (
                      <button
                        type="button"
                        onClick={() => { setEditThumbFile(null); setEditThumbPreview(""); }}
                        className="btn-outline btn-sm"
                        style={{ marginTop: 6 }}
                      >
                        Remove pasted image
                      </button>
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
                  <button onClick={handleSaveEdit} className="btn-success btn-sm" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
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
                    {recipe.createdAt && (
                      <div className="recipe-card-date">{formatDate(recipe.createdAt)}</div>
                    )}
                  </div>
                  <div>{renderStars(recipe.rating)}</div>
                </div>

                <div className="recipe-card-meta">
                  {recipe.cuisine && (
                    <span
                      className={`tag tag-clickable ${filterCuisine === recipe.cuisine ? "tag-active" : ""}`}
                      onClick={() => handleTagClick("cuisine", recipe.cuisine)}
                      title={`Filter by ${recipe.cuisine}`}
                    >
                      {recipe.cuisine}
                    </span>
                  )}
                  {Array.isArray(recipe.category) &&
                    recipe.category.map((cat) => (
                      <span
                        key={cat}
                        className={`tag tag-outline tag-clickable ${filterCategory === cat ? "tag-active" : ""}`}
                        onClick={() => handleTagClick("category", cat)}
                        title={`Filter by ${cat}`}
                      >
                        {cat}
                      </span>
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
                    <UrlCardImage src={recipe.recipeUrlImage} alt={recipe.title} height={140} />
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
