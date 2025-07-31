import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditRoom.css";

export default function EditRoom() {
  const { id } = useParams();
  const [room, setRoom] = useState({ name: "", description: "" });
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/rooms/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setRoom(res.data);
      })
      .catch((err) => console.error(err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE_URL}/api/rooms/${id}`,
        room,
        { withCredentials: true }
      );
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="edit-room-page">
      <div className="edit-room-card">
        <h1 className="title">✏️ Edit Room</h1>
        <form onSubmit={handleSubmit} className="edit-room-form">
          <input
            value={room.name}
            onChange={(e) => setRoom({ ...room, name: e.target.value })}
            placeholder="Room Name"
            required
            className="form-input"
          />
          <input
            value={room.description}
            onChange={(e) =>
              setRoom({ ...room, description: e.target.value })
            }
            placeholder="Room Description"
            className="form-input"
          />
          <button type="submit" className="btn primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}
