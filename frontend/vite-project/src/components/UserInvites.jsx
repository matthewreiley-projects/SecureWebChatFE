import { useEffect, useState } from "react";
import axios from "axios";
import "./UserInvites.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";

export default function InvitesPage() {
  const [roomInvites, setRoomInvites] = useState([]);
  const [friendInvites, setFriendInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInvites = async () => {
    try {
      const [roomRes, friendRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/rooms/invites`, {
          withCredentials: true,
        }),
        axios.get(`${API_BASE_URL}/api/friends/friend-invites`, {
          withCredentials: true,
        }),
      ]);

      setRoomInvites(roomRes.data);
      setFriendInvites(friendRes.data.invites || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  const acceptRoomInvite = async (roomId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rooms/invites/${roomId}/accept`,
        {},
        { withCredentials: true }
      );
      setMessage("✅ Room invite accepted!");
      setRoomInvites(roomInvites.filter((inv) => inv.room._id !== roomId));
    } catch (err) {
      console.error(err);
      setMessage("Failed to accept room invite");
    }
  };

  const declineRoomInvite = async (roomId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rooms/${roomId}/decline/invites/user`,
        {},
        { withCredentials: true }
      );
      setMessage("❌ Room invite declined!");
      setRoomInvites(roomInvites.filter((inv) => inv.room._id !== roomId));
    } catch (err) {
      console.error(err);
      setMessage("Failed to decline room invite");
    }
  };

  const acceptFriendInvite = async (senderId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/friends/accept/${senderId}`,
        {},
        { withCredentials: true }
      );
      setFriendInvites(friendInvites.filter((inv) => inv._id !== senderId));
      setMessage("✅ Friend request accepted!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to accept friend request");
    }
  };

  const denyFriendInvite = async (senderId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/friends/reject/${senderId}`,
        {},
        { withCredentials: true }
      );
      setFriendInvites(friendInvites.filter((inv) => inv._id !== senderId));
      setMessage("❌ Friend request declined!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to decline friend request");
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const filteredRoomInvites = roomInvites.filter((invite) =>
    invite.room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriendInvites = friendInvites.filter((invite) =>
    (invite.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="invites-page">
        <div className="invites-card">
          <p>Loading invites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invites-page">
      <div className="invites-card">
        <h1>My Pending Invites</h1>
        {message && <p className="invites-message">{message}</p>}

        <input
          type="text"
          placeholder="Search invites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <h2>Room Invites</h2>
        {filteredRoomInvites.length === 0 ? (
          <p className="no-invites">No matching room invites</p>
        ) : (
          <ul className="invites-list">
            {filteredRoomInvites.map((invite) => (
              <li key={invite._id} className="invite-item">
                <strong>{invite.room.name}</strong>
                <div className="invite-actions">
                  <button
                    onClick={() => acceptRoomInvite(invite.room._id)}
                    className="accept-btn"
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => declineRoomInvite(invite.room._id)}
                    className="decline-btn"
                  >
                    ❌ Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2>Friend Requests</h2>
        {filteredFriendInvites.length === 0 ? (
          <p className="no-invites">No matching friend requests</p>
        ) : (
          <ul className="invites-list">
            {filteredFriendInvites.map((invite) => (
              <li key={invite._id} className="invite-item">
                <strong>{invite.username || "Unknown User"}</strong>
                <div className="invite-actions">
                  <button
                    onClick={() => acceptFriendInvite(invite._id)}
                    className="accept-btn"
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => denyFriendInvite(invite._id)}
                    className="decline-btn"
                  >
                    ❌ Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
