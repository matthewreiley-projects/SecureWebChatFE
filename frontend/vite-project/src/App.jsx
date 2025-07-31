import { Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import RoomChat from "./components/RoomChat";
import CreateRoom from "./components/CreateRoom";
import EditRoom from "./components/EditRoom";
import Login from "./components/Login";
import Profile from "./components/Profile";
import InvitePage from "./components/InvitePage";
import ProtectedRoute from "./components/ProtectedRoute";
import UserInvites from "./components/UserInvites";
import { useAuth } from "./auth/AuthContext";
import axios from "axios";
import ManageRoom from "./components/ManageRoom";
import SearchRooms from "./components/SearchRooms";
import FriendsPage from "./components/FriendsPage";
import './App.css';
import { useState } from "react";


function Navbar() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(
        "https://192.168.86.22:3000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      window.location.href = "/"; // reload page to reset state
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
          <img 
            src="/snug.png" 
            alt="Chat App Logo" 
            className="logo-image" 
          />
      </Link>

      {isAuthenticated && (
        <>
          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            onClick={toggleMenu}
          >
            {/* Hamburger icon */}
            <span className="hamburger" />
            <span className="hamburger" />
            <span className="hamburger" />
          </button>

          <div className={`nav-links ${isOpen ? "open" : ""}`}>
            <Link to="/" onClick={() => setIsOpen(false)} 
            className="logout-btn">
              Dashboard
            </Link>
            <Link to="/rooms/create" onClick={() => setIsOpen(false)} 
            className="logout-btn">
              Create Room
            </Link>
            <Link to="/user-invites" onClick={() => setIsOpen(false)} 
            className="logout-btn">
              Invites
            </Link>
            <Link to="/search-rooms" onClick={() => setIsOpen(false)} 
            className="logout-btn">
              Search Rooms
            </Link>
            <Link to="/profile" onClick={() => setIsOpen(false)} 
            className="logout-btn">
              Profile
            </Link>
            <Link to="/friends" onClick={() => setIsOpen(false)} 
            className="logout-btn">
              Friends
            </Link>
            <Link
              to="#"
              className="logout-btn"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              🚪 Logout
            </Link>

          </div>
        </>
      )}
    </nav>
  );
}


function App() {
  const { isAuthenticated } = useAuth();
  return (
    <div className={isAuthenticated ? "logged-in" : "logged-out"}>
    <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />

      <Route
        path="/rooms/create"
        element={
          <ProtectedRoute>
            <CreateRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path="/search-rooms"
        element={
          <ProtectedRoute>
            <SearchRooms />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms/:id/:roomName"
        element={
          <ProtectedRoute>
            <RoomChat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms/:id/edit"
        element={
          <ProtectedRoute>
            <EditRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invite-users/:roomId"
        element={
          <ProtectedRoute>
            <InvitePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-invites"
        element={
          <ProtectedRoute>
            <UserInvites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/:id/manage"
        element={
          <ProtectedRoute>
            <ManageRoom />
          </ProtectedRoute>
        } 
      />

      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <FriendsPage />
          </ProtectedRoute>
        }
      />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>

  );
}

export default App;

