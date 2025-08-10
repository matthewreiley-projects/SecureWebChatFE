import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const ROOMS_PER_PAGE = 12;

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/rooms`, {
          withCredentials: true,
        });
        // ✅ filter out non-accepted memberships
        const acceptedRooms = res.data.filter(
          (membership) => membership.status === "accepted"
        );
        setRooms(acceptedRooms);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [navigate]);

  const leaveRoom = async (roomId) => {
    await axios.delete(`${API_BASE_URL}/api/rooms/${roomId}/user/leave`, {
      withCredentials: true,
    });
    setRooms(rooms.filter((r) => r.room?._id !== roomId));
  };

  const totalPages = Math.ceil(rooms.length / ROOMS_PER_PAGE);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="dashboard-loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Rooms</h1>
        <button
          className="create-btn"
          onClick={() => navigate("/rooms/create")}
        >
          + Create Room
        </button>
      </div>

      <div className="rooms-list">
        {rooms.length === 0 && <p>No rooms yet. Create one to get started!</p>}

        {paginatedRooms.map((room) => (
          <div key={room?.room?._id} className="room-card">
            <h3>
              <Link
                to={`/rooms/${room.room._id}/${room.room.name}`}
                className="room-link"
              >
                {room.room.name}
              </Link>
            </h3>
            <div className="room-actions">
              {(room.role === "owner" || room.role === "admin") && (
                <>
                  <button
                    className="edit-btn"
                    onClick={() => navigate(`/rooms/${room.room._id}/edit`)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="invite-btn"
                    onClick={() =>
                      navigate(`/invite-users/${room.room._id}`)
                    }
                  >
                    📩 Invite
                  </button>
                  <button
                    className="manage-btn"
                    onClick={() => navigate(`/rooms/${room.room._id}/manage`)}
                  >
                    👤 Manage
                  </button>
                </>
              )}

              <button
                className="leave-btn"
                onClick={() => leaveRoom(room.room._id)}
              >
                ❌ Leave
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            ⬅ Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}
