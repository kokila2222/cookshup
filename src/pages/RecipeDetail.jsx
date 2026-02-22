import { useParams, useNavigate } from "react-router-dom";
import React from "react";

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

function formatCategory(category) {
  if (Array.isArray(category)) {
    return category.map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  }
  return category ? [category.charAt(0).toUpperCase() + category.slice(1)] : [];
}

function RecipeDetail({ recipes = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128269;</div>
        <h2 style={{ marginBottom: 12 }}>Recipe not found</h2>
        <button onClick={() => navigate(-1)} className="btn-outline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Hero */}
      <div className="detail-hero">
        <h1 className="detail-title">{recipe.title}</h1>
        {recipe.userName && (
          <div className="detail-author">by {recipe.userName}</div>
        )}
      </div>

      {/* Meta Tags */}
      <div className="recipe-card-meta" style={{ marginBottom: 24 }}>
        {recipe.cuisine && <span className="tag">{recipe.cuisine}</span>}
        {formatCategory(recipe.category).map((cat) => (
          <span key={cat} className="tag tag-outline">{cat}</span>
        ))}
        <span className={`tag ${recipe.status === "made" ? "tag-success" : "tag-warning"}`}>
          {recipe.status === "made" ? "Made It" : "Yet to Make"}
        </span>
      </div>

      {/* Rating */}
      <div className="detail-meta-row">
        <div className="detail-meta-item">
          <span style={{ fontWeight: 500 }}>Rating:</span>
          {renderStars(recipe.rating)}
        </div>
        {recipe.likes > 0 && (
          <div className="detail-meta-item">
            <span>&#10084;&#65039;</span>
            <span>{recipe.likes} like{recipe.likes !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Media */}
      {recipe.type === "video" && recipe.youtubeId && (
        <div className="video-embed" style={{ marginBottom: 28 }}>
          <iframe
            src={`https://www.youtube.com/embed/${recipe.youtubeId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {recipe.type === "url" && recipe.recipeUrl && (
        <a href={recipe.recipeUrl} target="_blank" rel="noopener noreferrer" className="url-card-link url-card-link-lg" style={{ marginBottom: 28 }}>
          {recipe.recipeUrlImage ? (
            <img
              src={recipe.recipeUrlImage}
              alt={recipe.title}
              className="url-card-image"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextElementSibling?.classList.contains("url-card-placeholder")) {
                  e.target.nextElementSibling.style.display = "flex";
                }
              }}
            />
          ) : null}
          <div className="url-card-placeholder" style={{ display: recipe.recipeUrlImage ? "none" : "flex", height: 220, alignItems: "center", justifyContent: "center", background: "#f1f3f5", color: "#6c757d", fontSize: "3rem" }}>
            &#128279;
          </div>
          <div className="url-card-domain">
            {new URL(recipe.recipeUrl).hostname.replace("www.", "")} &mdash; View Full Recipe &#8599;
          </div>
        </a>
      )}

      {recipe.type === "photo" && recipe.photos?.length > 0 && (
        <div className="photo-gallery" style={{ marginBottom: 28 }}>
          {recipe.photos.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Recipe Photo ${idx + 1}`}
              style={{ maxWidth: 200, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            />
          ))}
        </div>
      )}

      {/* Text Content */}
      {recipe.type === "text" && (
        <>
          {recipe.ingredients && (
            <div className="detail-section">
              <div className="detail-section-title">Ingredients</div>
              <div className="detail-content">{recipe.ingredients}</div>
            </div>
          )}
          {recipe.instructions && (
            <div className="detail-section">
              <div className="detail-section-title">Instructions</div>
              <div className="detail-content">{recipe.instructions}</div>
            </div>
          )}
        </>
      )}

      {/* Notes */}
      {recipe.notes && (
        <div className="detail-section">
          <div className="detail-section-title">Notes</div>
          <div className="detail-content">{recipe.notes}</div>
        </div>
      )}

      {/* Actions */}
      <div className="detail-actions">
        <button onClick={() => navigate(-1)} className="btn-outline">
          &#8592; Back
        </button>
      </div>
    </div>
  );
}

export default RecipeDetail;
