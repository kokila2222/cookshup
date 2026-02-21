import React from "react";

function Toast({ message, show }) {
  return (
    <div className={`toast ${show ? "toast-visible" : ""}`}>
      {message}
    </div>
  );
}

export default Toast;
