import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function formatCategory(category) {
  if (Array.isArray(category)) {
    return category.map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  }
  return category ? [category.charAt(0).toUpperCase() + category.slice(1)] : [];
}

function formatCuisine(cuisine) {
  return cuisine ? cuisine.charAt(0).toUpperCase() + cuisine.slice(1) : "";
}

function renderStars(rating) {
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

function Feeds({ recipes, onLike }) {
  const { currentUser } = useAuth();
  // Recipes passed in are already filtered to public feed items
  const feedRecipes = recipes;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Recipe Feeds</h2>
        <p className="page-subtitle">Discover what everyone is cooking</p>
      </div>

      {feedRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#127859;</div>
          <p className="empty-state-text">No recipes in the feed yet!</p>
          {currentUser && (
            <Link to="/enter-recipe" className="btn-primary" style={{ textDecoration: "none", color: "#fff" }}>
              Add a Recipe
            </Link>
          )}
        </div>
      ) : (
        <div className="recipe-grid">
          {feedRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              <div className="recipe-card-header">
                <div>
                  {recipe.userName && (
                    <div className="recipe-card-author">by {recipe.userName}</div>
                  )}
                  <h3 className="recipe-card-title">
                    <Link to={`/recipe/${recipe.id}`}>{recipe.title}</Link>
                  </h3>
                </div>
                <div>{renderStars(recipe.rating)}</div>
              </div>

              <div className="recipe-card-meta">
                {formatCuisine(recipe.cuisine) && (
                  <span className="tag">{formatCuisine(recipe.cuisine)}</span>
                )}
                {formatCategory(recipe.category).map((cat) => (
                  <span key={cat} className="tag tag-outline">{cat}</span>
                ))}
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
                    {recipe.recipeUrlImage && (
                      <img src={recipe.recipeUrlImage} alt={recipe.title} className="url-card-image" />
                    )}
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
                <button
                  className="like-btn"
                  onClick={() => {
                    if (currentUser) {
                      onLike(recipe.id);
                    } else {
                      alert("Please log in to like recipes.");
                    }
                  }}
                >
                  <span className="like-btn-heart">&#10084;&#65039;</span>
                  <span>{recipe.likes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Feeds;
