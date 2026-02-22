import React, { useState } from "react";

/**
 * Displays a URL recipe image with a fallback placeholder.
 * Handles: no image URL, failed loads, and tiny/broken images.
 */
function UrlCardImage({ src, alt, className = "url-card-image", height = 180 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="url-card-placeholder"
        style={{
          display: "flex",
          height,
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f3f5",
          color: "#adb5bd",
          fontSize: "2.5rem",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span>&#127859;</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>No preview available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      onLoad={(e) => {
        // Detect tiny placeholder images (e.g. 1x1 tracking pixels)
        if (e.target.naturalWidth < 10 || e.target.naturalHeight < 10) {
          setFailed(true);
        }
      }}
    />
  );
}

export default UrlCardImage;
