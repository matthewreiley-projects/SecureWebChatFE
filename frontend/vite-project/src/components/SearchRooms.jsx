import { useEffect, useState } from "react";
import axios from "axios";
import "./SearchRooms.css";


const API_BASE_URL = import.meta.env.VITE_API_URL || "https://192.168.86.22:3000";

export default function SearchRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, membershipsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/rooms/public/search`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/rooms`, {
          withCredentials: true,
        }),
      ]);
      setRooms(roomsRes.data);
      setMemberships(membershipsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (roomId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rooms/${roomId}/join/room`,
        {},
        { withCredentials: true }
      );
      fetchData();
      alert("Join request sent! Waiting for owner approval.");
    } catch (err) {
      console.error(err);
      alert("Could not send join request.");
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(query.toLowerCase())
  );

  const getRoomStatus = (roomId) => {
    const membership = memberships.find(m => m.room._id === roomId);
    if (!membership) return "none";
    if (membership.status === "pending") return "pending";
    if (membership.status === "accepted") return "member";
    return "none";
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="search-rooms-page">
      <div className="search-rooms-card">
        <h2>Search Rooms</h2>

        <input
          type="text"
          placeholder="Search rooms by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />

        <ul className="rooms-list">
          {filteredRooms.map((room) => {
            const status = getRoomStatus(room._id);
            return (
              <li key={room._id} className="room-item">
                <div>
                  <strong>{room.name}</strong> — Owner: {room.owner?.username}
                </div>

                <div>
                  {status === "member" && (
                    <span className="status member">✔ You are a member</span>
                  )}
                  {status === "pending" && (
                    <span className="status pending">⌛ Request pending</span>
                  )}
                  {status === "none" && (
                    <button
                      onClick={() => handleJoin(room._id)}
                      className="join-btn"
                    >
                      Request to Join
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {filteredRooms.length === 0 && <p>No rooms found.</p>}
      </div>
    </div>
  );
}
