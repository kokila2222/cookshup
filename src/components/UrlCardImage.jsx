import React, { useState, useEffect } from "react";

/**
 * Displays a URL recipe image with a fallback placeholder.
 * Uses a pre-check: loads the image in memory first to verify it works
 * before rendering it. Shows a placeholder for missing, broken, or tiny images.
 */
function UrlCardImage({ src, alt, height = 180 }) {
  const [status, setStatus] = useState(src ? "loading" : "failed");

  useEffect(() => {
    if (!src) {
      setStatus("failed");
      return;
    }

    setStatus("loading");
    const img = new Image();
    img.onload = () => {
      // Reject tiny tracking pixels
      if (img.naturalWidth < 20 || img.naturalHeight < 20) {
        setStatus("failed");
      } else {
        setStatus("loaded");
      }
    };
    img.onerror = () => setStatus("failed");

    // Timeout: if image takes more than 5s, show placeholder
    const timer = setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "failed" : prev));
    }, 5000);

    img.src = src;

    return () => clearTimeout(timer);
  }, [src]);

  if (status === "loaded") {
    return (
      <img
        src={src}
        alt={alt}
        className="url-card-image"
        style={{ width: "100%", height, objectFit: "cover", display: "block" }}
      />
    );
  }

  // Show placeholder for loading, failed, or no src
  return (
    <div
      style={{
        display: "flex",
        height,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f3f5",
        color: "#adb5bd",
        fontSize: "2.5rem",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {status === "loading" ? (
        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6c757d" }}>Loading preview...</span>
      ) : (
        <>
          <span>&#127859;</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>No preview available</span>
        </>
      )}
    </div>
  );
}

export default UrlCardImage;
