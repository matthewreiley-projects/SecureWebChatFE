import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateRoom.css";

export default function CreateRoom() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState(""); // 🌟 NEW
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear old errors

    try {
      await axios.post(
        import.meta.env.VITE_API_BASE_URL
        ? `${import.meta.env.VITE_API_BASE_URL}/api/rooms`
        : "https://192.168.86.22:3000/api/rooms",
        {
          name,
          description,
          visibility,
        },
        { withCredentials: true }
      );
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="create-room-page">
      <div className="create-room-card">
        <h1>Create Room</h1>

        {/* 🌟 Show error message */}
        {error && <p className="create-error">{error}</p>}

        <form onSubmit={handleSubmit} className="create-room-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Room Name"
            required
            className="create-input"
          />

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="create-input"
          />

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="create-select"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          <button type="submit" className="create-btn">
            ➕ Create
          </button>
        </form>
      </div>
    </div>
  );
}
