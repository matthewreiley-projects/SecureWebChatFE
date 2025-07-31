import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://192.168.86.22:3000";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/users/me`, { withCredentials: true })
      .then((res) => {
        setUsername(res.data.username);
        setNewUsername(res.data.username);
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      });
  }, [navigate]);

  const saveUsername = () => {
    axios
      .put(
        `${API_BASE_URL}/api/users/me`,
        { username: newUsername },
        { withCredentials: true }
      )
      .then(() => {
        setUsername(newUsername);
        setEditing(false);
      })
      .catch(console.error);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">🧑‍💻 Profile</h1>

        {editing ? (
          <>
            <input
              className="profile-input"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
            />
            <div className="profile-actions">
              <button onClick={saveUsername} className="btn save">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="btn cancel">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="username-display">
              <span className="label">Username:</span>{" "}
              <strong className="username">{username}</strong>
            </p>
            <button onClick={() => setEditing(true)} className="btn edit">
              ✏️ Edit Username
            </button>
          </>
        )}
      </div>
    </div>
  );
}
