import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import EnterRecipe from "./pages/EnterRecipe";
import MyRecipes from "./pages/MyRecipes";
import RecipeDetail from "./pages/RecipeDetail";
import Account from "./pages/Account";
import Feeds from "./pages/Feeds";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Toast from "./components/Toast";
import "./App.css";

import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
} from "firebase/firestore";

function App() {
  const { currentUser, logout, loading } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [userName, setUserName] = useState("Your Name");
  const [toast, setToast] = useState({ show: false, message: "" });
  const navigate = useNavigate();
  const location = useLocation();
  const prevUserRef = useRef(undefined);

  useEffect(() => {
    if (loading) return;
    const authPages = ["/login", "/signup"];
    // Only redirect if the user was previously logged in and just logged out
    if (prevUserRef.current && currentUser === null && !authPages.includes(location.pathname)) {
      showToast("You have been logged out.");
      navigate("/login");
    }
    prevUserRef.current = currentUser;
  }, [currentUser, loading, navigate, location.pathname]);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      const localData = localStorage.getItem("cookshup_recipes");
      setRecipes(localData ? JSON.parse(localData) : []);
      return;
    }

    const q = query(collection(db, "recipes"), where("uid", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((docSnap) =>
        fetched.push({ ...docSnap.data(), id: docSnap.id })
      );
      setRecipes(fetched);
    }, (error) => {
      console.error("Firestore listener error:", error);
      showToast("Error loading recipes. Check console.");
    });

    return unsubscribe;
  }, [currentUser, loading]);

  useEffect(() => {
    if (currentUser?.displayName) {
      setUserName(currentUser.displayName);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem("cookshup_userName", userName);
    }
  }, [userName, currentUser]);

  async function handleAddRecipe(newRecipe) {
    if (!currentUser) {
      const updated = [
        { ...newRecipe, id: Date.now().toString(), userName, likes: 0 },
        ...recipes,
      ];
      setRecipes(updated);
      localStorage.setItem("cookshup_recipes", JSON.stringify(updated));
      showToast("Recipe added!");
      return;
    }

    try {
      // Remove the form-generated id — Firestore will create its own document ID
      const { id: _formId, ...recipeData } = newRecipe;
      await addDoc(collection(db, "recipes"), {
        ...recipeData,
        uid: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        createdAt: Date.now(),
        likes: 0,
      });
      showToast("Recipe added!");
    } catch (err) {
      console.error("Firestore addDoc error:", err);
      showToast("Failed to save recipe: " + err.message);
    }
  }

  async function handleEditRecipe(updatedRecipe) {
    if (!currentUser) {
      const updated = recipes.map((r) =>
        r.id === updatedRecipe.id ? updatedRecipe : r
      );
      setRecipes(updated);
      localStorage.setItem("cookshup_recipes", JSON.stringify(updated));
      showToast("Recipe updated!");
      return;
    }

    try {
      const { id, ...rest } = updatedRecipe;
      await updateDoc(doc(db, "recipes", id), rest);
      showToast("Recipe updated!");
    } catch (err) {
      console.error("Firestore updateDoc error:", err);
      showToast("Failed to update recipe: " + err.message);
    }
  }

  async function handleDeleteRecipe(recipeId) {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;

    if (!currentUser) {
      const updated = recipes.filter((r) => r.id !== recipeId);
      setRecipes(updated);
      localStorage.setItem("cookshup_recipes", JSON.stringify(updated));
      showToast("Recipe deleted.");
      return;
    }

    try {
      console.log("Deleting recipe with ID:", recipeId);
      console.log("All recipe IDs:", recipes.map(r => r.id));
      await deleteDoc(doc(db, "recipes", recipeId));
      showToast("Recipe deleted.");
    } catch (err) {
      console.error("Firestore deleteDoc error:", err);
      showToast("Failed to delete recipe: " + err.message);
    }
  }

  async function handleLikeRecipe(recipeId) {
    if (!currentUser) {
      const updated = recipes.map((r) =>
        r.id === recipeId ? { ...r, likes: (r.likes || 0) + 1 } : r
      );
      setRecipes(updated);
      localStorage.setItem("cookshup_recipes", JSON.stringify(updated));
      return;
    }

    const recipeRef = doc(db, "recipes", recipeId);
    await updateDoc(recipeRef, { likes: increment(1) });
  }

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-logo-link">
            <span className="app-logo-text">cook<span className="app-logo-accent">shup</span></span>
          </Link>

          <nav className="app-nav">
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "nav-link-active" : ""}`}
            >
              Feeds
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/my-recipes"
                  className={`nav-link ${isActive("/my-recipes") ? "nav-link-active" : ""}`}
                >
                  My Recipes
                </Link>
                <Link
                  to="/enter-recipe"
                  className={`nav-link ${isActive("/enter-recipe") ? "nav-link-active" : ""}`}
                >
                  Add Recipe
                </Link>
                <Link
                  to="/account"
                  className={`nav-link ${isActive("/account") ? "nav-link-active" : ""}`}
                >
                  Account
                </Link>
                <div className="nav-divider" />
                <button onClick={handleLogout} className="btn-outline-danger btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="nav-divider" />
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary btn-sm"
                  style={{ textDecoration: "none", color: "#fff" }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <Toast show={toast.show} message={toast.message} />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Feeds recipes={recipes} onLike={handleLikeRecipe} />} />
          <Route
            path="/my-recipes"
            element={
              <PrivateRoute>
                <MyRecipes
                  recipes={recipes}
                  editRecipe={handleEditRecipe}
                  deleteRecipe={handleDeleteRecipe}
                  showToast={showToast}
                  onLike={handleLikeRecipe}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/enter-recipe"
            element={
              <PrivateRoute>
                <EnterRecipe onAddRecipe={handleAddRecipe} showToast={showToast} />
              </PrivateRoute>
            }
          />
          <Route path="/recipe/:id" element={<RecipeDetail recipes={recipes} />} />
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <Account userName={userName} setUserName={setUserName} />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login showToast={showToast} />} />
          <Route path="/signup" element={<SignUp showToast={showToast} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
