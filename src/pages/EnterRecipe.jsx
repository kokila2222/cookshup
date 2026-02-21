import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const CUISINE_OPTIONS = [
  "Indian", "Italian", "Chinese", "Mexican", "Thai", "American", "Japanese", "Korean", "Middle Eastern", "Other",
];

const CATEGORY_OPTIONS = [
  "Breakfast", "Lunch", "Dinner", "Snack", "Vegan", "Vegetarian", "Gluten Free", "Dessert", "Quick Meal", "Healthy",
];

const initialState = {
  title: "",
  category: [],
  cuisine: "",
  type: "text",
  youtubeUrl: "",
  youtubeId: "",
  recipeUrl: "",
  recipeUrlImage: "",
  photos: [],
  ingredients: "",
  instructions: "",
  notes: "",
  status: "yet",
  rating: 0,
  showInFeeds: false,
};

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com.*(?:\/|v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

function EnterRecipe({ onAddRecipe, showToast }) {
  const [form, setForm] = useState(initialState);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [urlLoading, setUrlLoading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const toggleSelection = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const urlFetchTimer = useRef(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "youtubeUrl") {
      setForm((prev) => ({ ...prev, youtubeUrl: value, youtubeId: getYoutubeId(value) }));
    } else if (name === "recipeUrl") {
      setForm((prev) => ({ ...prev, recipeUrl: value, recipeUrlImage: "" }));
      // Auto-fetch after user stops typing
      if (urlFetchTimer.current) clearTimeout(urlFetchTimer.current);
      if (value && isValidUrl(value)) {
        urlFetchTimer.current = setTimeout(() => handleUrlFetch(value), 800);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  }

  function isValidUrl(str) {
    try { new URL(str); return true; } catch { return false; }
  }

  function handleTypeChange(type) {
    setForm((prev) => ({
      ...prev,
      type,
      youtubeUrl: "",
      youtubeId: "",
      recipeUrl: "",
      recipeUrlImage: "",
      photos: [],
      ingredients: "",
      instructions: "",
    }));
    setPhotoPreviews([]);
    setUrlLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUrlFetch(url) {
    if (!url) return;
    setUrlLoading(true);
    try {
      let ogTitle = "";
      let ogImage = "";

      // Multiple free Open Graph / metadata APIs as fallbacks (microlink first — most reliable)
      const apis = [
        {
          name: "microlink",
          url: `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
          parse: (data) => ({
            title: data.data?.title || "",
            image: data.data?.image?.url || data.data?.logo?.url || "",
          }),
        },
        {
          name: "jsonlink",
          url: `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`,
          parse: (data) => ({ title: data.title || "", image: (data.images && data.images[0]) || "" }),
        },
        {
          name: "opengraph-io",
          url: `https://opengraph.io/api/1.1/site/${encodeURIComponent(url)}?app_id=default`,
          parse: (data) => ({
            title: data.hybridGraph?.title || data.openGraph?.title || "",
            image: data.hybridGraph?.image || data.openGraph?.image?.url || "",
          }),
        },
      ];

      for (const api of apis) {
        try {
          console.log(`[URL Fetch] Trying ${api.name}...`);
          const res = await fetch(api.url, { signal: AbortSignal.timeout(10000) });
          console.log(`[URL Fetch] ${api.name} response status:`, res.status);
          if (!res.ok) continue;
          const data = await res.json();
          console.log(`[URL Fetch] ${api.name} raw data:`, data);
          const result = api.parse(data);
          console.log(`[URL Fetch] ${api.name} parsed:`, result);
          ogTitle = result.title || ogTitle;
          ogImage = result.image;
          if (ogImage) {
            console.log(`[URL Fetch] Got image from ${api.name}:`, ogImage);
            break;
          }
        } catch (e) {
          console.warn(`[URL Fetch] ${api.name} failed:`, e.message);
          continue;
        }
      }

      // If no API returned an image, try to use the YouTube thumbnail if it's a YouTube URL
      if (!ogImage) {
        const ytMatch = url.match(/(?:youtube\.com.*(?:\/|v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) {
          ogImage = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
      }

      console.log(`[URL Fetch] Final result — title: "${ogTitle}", image: "${ogImage}"`);

      setForm((prev) => ({
        ...prev,
        title: prev.title || ogTitle,
        recipeUrlImage: ogImage,
      }));

      if (ogImage) {
        showToast && showToast("Preview loaded!");
      } else {
        showToast && showToast("Couldn't fetch preview image. You can still save the recipe.");
      }
    } catch (err) {
      console.error("Failed to fetch URL metadata:", err);
      showToast && showToast("Couldn't fetch preview. You can still save the recipe.");
    }
    setUrlLoading(false);
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setForm((prev) => ({ ...prev, photos: urls }));
    setPhotoPreviews(urls);
  }

  function handleRating(rating) {
    setForm((prev) => ({ ...prev, rating }));
  }

  function handleStatusToggle() {
    setForm((prev) => ({ ...prev, status: prev.status === "made" ? "yet" : "made" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || form.category.length === 0 || !form.cuisine) {
      showToast && showToast("Please fill all required fields!");
      return;
    }
    if (form.type === "video" && !form.youtubeId) {
      showToast && showToast("Please enter a valid YouTube URL.");
      return;
    }
    if (form.type === "photo" && form.photos.length === 0) {
      showToast && showToast("Please upload at least one photo.");
      return;
    }
    if (form.type === "url" && !form.recipeUrl) {
      showToast && showToast("Please enter a recipe URL.");
      return;
    }

    try {
      const recipe = { ...form, id: Date.now().toString() };
      await onAddRecipe(recipe);
      setForm(initialState);
      setPhotoPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      navigate("/my-recipes");
    } catch (err) {
      console.error("Error adding recipe:", err);
      showToast && showToast("Failed to save recipe. Check console.");
    }
  }

  return (
    <div className="form-page">
      <div className="page-header">
        <h2 className="page-title">Add a New Recipe</h2>
        <p className="page-subtitle">Save a recipe you love or want to try</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Recipe Name *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Grandma's Dal Tadka"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Cuisine & Category side by side */}
          <div className="form-row" style={{ marginBottom: 24 }}>
            <div className="form-col">
              <div className="form-section-title">Cuisine *</div>
              <div className="form-radio-group">
                {CUISINE_OPTIONS.map((opt) => (
                  <label key={opt} className="form-check-label">
                    <input
                      type="radio"
                      name="cuisine"
                      value={opt}
                      checked={form.cuisine === opt}
                      onChange={handleChange}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-col">
              <div className="form-section-title">Category *</div>
              <div className="form-checkbox-group">
                {CATEGORY_OPTIONS.map((opt) => (
                  <label key={opt} className="form-check-label">
                    <input
                      type="checkbox"
                      checked={form.category.includes(opt)}
                      onChange={() => toggleSelection("category", opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Type Selector */}
          <div className="form-section-title">Recipe Type</div>
          <div className="type-selector">
            {["video", "photo", "text", "url"].map((t) => (
              <div
                key={t}
                className={`type-option ${form.type === t ? "type-option-active" : ""}`}
                onClick={() => handleTypeChange(t)}
              >
                {t === "video" ? "\uD83C\uDFA5 Video" : t === "photo" ? "\uD83D\uDCF7 Photo" : t === "url" ? "\uD83D\uDD17 URL" : "\uD83D\uDCDD Text"}
              </div>
            ))}
          </div>

          {/* YouTube video input */}
          {form.type === "video" && (
            <div className="form-group">
              <label>YouTube URL</label>
              <input
                type="text"
                name="youtubeUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={handleChange}
              />
              {form.youtubeId && (
                <img
                  src={`https://img.youtube.com/vi/${form.youtubeId}/hqdefault.jpg`}
                  alt="YouTube Thumbnail"
                  className="yt-thumbnail"
                />
              )}
            </div>
          )}

          {/* Photo upload */}
          {form.type === "photo" && (
            <div className="form-group">
              <label>Upload Photos</label>
              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} />
              {photoPreviews.length > 0 && (
                <div className="photo-gallery">
                  {photoPreviews.map((url, idx) => (
                    <img key={idx} src={url} alt="Preview" className="photo-thumb" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* URL input */}
          {form.type === "url" && (
            <div className="form-group">
              <label>Recipe URL</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="url"
                  name="recipeUrl"
                  placeholder="Paste a recipe URL (e.g., https://www.kitchensanctuary.com/chicken-tikka-recipe/)"
                  value={form.recipeUrl}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                {form.recipeUrl && !urlLoading && (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => handleUrlFetch(form.recipeUrl)}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {form.recipeUrlImage ? "Refresh" : "Fetch Preview"}
                  </button>
                )}
              </div>
              {urlLoading && (
                <div className="url-fetching-status">Fetching preview...</div>
              )}
              {!urlLoading && form.recipeUrlImage && (
                <div className="url-preview-card">
                  <img
                    src={form.recipeUrlImage}
                    alt="Recipe preview"
                    className="url-preview-card-image"
                  />
                  <div className="url-preview-card-info">
                    <div className="url-preview-card-title">{form.title || "Recipe"}</div>
                    {form.recipeUrl && (
                      <div className="url-preview-card-domain">
                        {new URL(form.recipeUrl).hostname.replace("www.", "")}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!urlLoading && form.recipeUrl && !form.recipeUrlImage && (
                <div className="url-fetching-status">
                  No preview image found. Click "Fetch Preview" to try again, or save without an image.
                </div>
              )}
            </div>
          )}

          {/* Text input fields */}
          {form.type === "text" && (
            <>
              <div className="form-group">
                <label>Ingredients</label>
                <textarea
                  name="ingredients"
                  placeholder="List your ingredients, one per line..."
                  value={form.ingredients}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  name="instructions"
                  placeholder="Step-by-step cooking instructions..."
                  value={form.instructions}
                  onChange={handleChange}
                  rows={5}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              name="notes"
              placeholder="Any tips, substitutions, or memories..."
              value={form.notes}
              onChange={handleChange}
              rows={2}
            />
          </div>

          {/* Status, Rating, Feeds */}
          <div className="form-section-title">Details</div>
          <div className="form-inline-group" style={{ marginBottom: 24 }}>
            <label className="form-check-label">
              <input type="checkbox" checked={form.status === "made"} onChange={handleStatusToggle} />
              Made It
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Rating</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleRating(star)}
                  className={`star star-clickable ${star <= form.rating ? "star-active" : "star-empty"}`}
                  style={{ fontSize: "1.3em" }}
                >
                  &#9733;
                </span>
              ))}
            </div>

            <label className="form-check-label">
              <input type="checkbox" name="showInFeeds" checked={form.showInFeeds} onChange={handleChange} />
              Show in Feeds
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-success btn-lg" style={{ minWidth: 160 }}>
            Add Recipe
          </button>
        </form>
      </div>
    </div>
  );
}

export default EnterRecipe;
