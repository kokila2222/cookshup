import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UrlCardImage from "../components/UrlCardImage";

function formatCategory(category) {
  if (Array.isArray(category)) {
    return category.map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  }
  return category ? [category.charAt(0).toUpperCase() + category.slice(1)] : [];
}

function formatCuisine(cuisine) {
  return cuisine ? cuisine.charAt(0).toUpperCase() + cuisine.slice(1) : "";
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function renderStars(rating) {
  if (!rating || rating === 0) return <span className="rating-unset">Not rated</span>;
  return (
    <span>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? "star-active" : "star-empty"}`}
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

function PancakeLikeButton({ recipeId, likes, onLike, currentUser }) {
  const [flipping, setFlipping] = useState(false);

  function handleClick() {
    if (!currentUser) {
      alert("Please log in to like recipes.");
      return;
    }
    setFlipping(true);
    onLike(recipeId);
    setTimeout(() => setFlipping(false), 600);
  }

  return (
    <button className="like-btn" onClick={handleClick}>
      <span className={`like-btn-pancake${flipping ? " flipping" : ""}`}>&#129374;</span>
      <span className="like-btn-label">Like</span>
      {(likes || 0) > 0 && <span className="like-btn-count">{likes}</span>}
    </button>
  );
}

function Feeds({ recipes, onLike }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");
  const [filterCuisine, setFilterCuisine] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const typeOptions = ["all", ...getUniqueOptions(recipes, "type")];
  const cuisineOptions = ["all", ...getUniqueOptions(recipes, "cuisine")];
  const categoryOptions = ["all", ...getUniqueOptions(recipes, "category")];

  const filteredAndSorted = useMemo(() => {
    let result = recipes;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.title?.toLowerCase().includes(q) ||
        r.cuisine?.toLowerCase().includes(q) ||
        r.userName?.toLowerCase().includes(q) ||
        (Array.isArray(r.category) && r.category.some((c) => c.toLowerCase().includes(q))) ||
        r.notes?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter((r) => r.type === filterType);
    }

    // Cuisine filter
    if (filterCuisine !== "all") {
      result = result.filter((r) => r.cuisine === filterCuisine);
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter((r) =>
        Array.isArray(r.category)
          ? r.category.includes(filterCategory)
          : r.category === filterCategory
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case "oldest":
        sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
      case "highest_rated":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "most_liked":
        sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [recipes, searchQuery, sortBy, filterType, filterCuisine, filterCategory]);

  function handleTagClick(type, value) {
    if (type === "cuisine") {
      setFilterCuisine((prev) => (prev === value ? "all" : value));
    } else if (type === "category") {
      setFilterCategory((prev) => (prev === value ? "all" : value));
    }
  }

  const hasActiveFilters = filterType !== "all" || filterCuisine !== "all" || filterCategory !== "all" || searchQuery.trim();

  function clearFilters() {
    setFilterType("all");
    setFilterCuisine("all");
    setFilterCategory("all");
    setSearchQuery("");
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Recipe Feeds</h2>
        <p className="page-subtitle">Discover what everyone is cooking</p>
      </div>

      {/* Search & Sort Bar */}
      <div className="feeds-toolbar">
        <div className="search-bar">
          <span className="search-icon">&#128269;</span>
          <input
            type="search"
            placeholder="Search recipes by name, cuisine, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")} title="Clear search">
              &times;
            </button>
          )}
        </div>
        <div className="sort-group">
          <span className="filter-label">Sort by</span>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_rated">Highest Rated</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>
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
        {hasActiveFilters && (
          <button className="btn-ghost btn-sm" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#127859;</div>
          <p className="empty-state-text">
            {hasActiveFilters ? "No recipes match your filters." : "No recipes in the feed yet!"}
          </p>
          {hasActiveFilters && (
            <button className="btn-outline" onClick={clearFilters}>Clear Filters</button>
          )}
          {!hasActiveFilters && currentUser && (
            <Link to="/enter-recipe" className="btn-primary" style={{ textDecoration: "none", color: "#fff" }}>
              Add a Recipe
            </Link>
          )}
        </div>
      ) : (
        <>
          {hasActiveFilters && (
            <div className="results-count">
              Showing {filteredAndSorted.length} of {recipes.length} recipes
            </div>
          )}
          <div className="recipe-grid">
            {filteredAndSorted.map((recipe) => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-card-header">
                  <div>
                    {recipe.userName && (
                      <div className="recipe-card-author">by {recipe.userName}</div>
                    )}
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
                  {formatCuisine(recipe.cuisine) && (
                    <span
                      className={`tag tag-clickable ${filterCuisine === recipe.cuisine ? "tag-active" : ""}`}
                      onClick={() => handleTagClick("cuisine", recipe.cuisine)}
                      title={`Filter by ${formatCuisine(recipe.cuisine)}`}
                    >
                      {formatCuisine(recipe.cuisine)}
                    </span>
                  )}
                  {formatCategory(recipe.category).map((cat, idx) => {
                    const rawCat = Array.isArray(recipe.category) ? recipe.category[idx] : recipe.category;
                    return (
                      <span
                        key={cat}
                        className={`tag tag-outline tag-clickable ${filterCategory === rawCat ? "tag-active" : ""}`}
                        onClick={() => handleTagClick("category", rawCat)}
                        title={`Filter by ${cat}`}
                      >
                        {cat}
                      </span>
                    );
                  })}
                  <span className={`tag ${recipe.status === "made" ? "tag-success" : "tag-warning"}`}>
                    {recipe.status === "made" ? "Made It" : "Yet to Make"}
                  </span>
                </div>

                <div className="recipe-card-body">
                  {recipe.type === "video" && recipe.youtubeId && (
                    <div className="video-embed">
                      <iframe
                        src={`https://www.youtube.com/embed/${recipe.youtubeId}`}
                        title="YouTube video"
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {recipe.type === "photo" && recipe.photos?.length > 0 && (
                    <div className="photo-gallery">
                      {recipe.photos.map((url, idx) => (
                        <img key={idx} src={url} alt={`Recipe Photo ${idx + 1}`} className="photo-thumb" />
                      ))}
                    </div>
                  )}

                  {recipe.type === "url" && recipe.recipeUrl && (
                    <a href={recipe.recipeUrl} target="_blank" rel="noopener noreferrer" className="url-card-link">
                      <UrlCardImage src={recipe.recipeUrlImage} alt={recipe.title} height={180} />
                      <div className="url-card-domain">
                        {new URL(recipe.recipeUrl).hostname.replace("www.", "")}
                      </div>
                    </a>
                  )}

                  {recipe.type === "text" && (
                    <>
                      {recipe.ingredients && (
                        <div className="recipe-card-section">
                          <div className="recipe-card-section-label">Ingredients</div>
                          <div className="recipe-card-section-content">{recipe.ingredients}</div>
                        </div>
                      )}
                      {recipe.instructions && (
                        <div className="recipe-card-section">
                          <div className="recipe-card-section-label">Instructions</div>
                          <div className="recipe-card-section-content">{recipe.instructions}</div>
                        </div>
                      )}
                    </>
                  )}

                  {recipe.notes && (
                    <div className="recipe-card-section">
                      <div className="recipe-card-section-label">Notes</div>
                      <div className="recipe-card-section-content">{recipe.notes}</div>
                    </div>
                  )}
                </div>

                <div className="recipe-card-footer">
                  <PancakeLikeButton
                    recipeId={recipe.id}
                    likes={recipe.likes}
                    onLike={onLike}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Feeds;
