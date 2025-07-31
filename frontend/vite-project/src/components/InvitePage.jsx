import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./InvitePage.css";

export default function InvitePage() {
  const { roomId } = useParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [friendInvites, setFriendInvites] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [invitedUserIds, setInvitedUserIds] = useState([]);

    // Use environment variable or fallback URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";

  // Fetch friend invites and suggested friends on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // NOTE: Fixed the friend invites URL from `/api/users/friend-invites` to `/api/friends/friend-invites`
        const [invitesRes, suggestedRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/friends/friend-invites`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE_URL}/api/friends/suggested/${roomId}`, {
            withCredentials: true,
          }),
        ]);
        setFriendInvites(invitesRes.data.invites || []);
        setSuggestedFriends(suggestedRes.data.suggested || []);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();
  }, [roomId]);

  const searchUsers = async () => {
    if (!query.trim()) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/users/search?query=${query}`,
        { withCredentials: true }
      );
      setResults(res.data || []);
    } catch (err) {
      console.error("Error searching users", err);
    }
  };

  const inviteUser = async (userId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/rooms/${roomId}/invite`,
        { userId },
        { withCredentials: true }
      );
      setMessage(res.data.message);
      setInvitedUserIds((prev) => [...prev, userId]);
      setSuggestedFriends((prev) =>
        prev.filter((user) => user._id !== userId)
      );
      setResults((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      setMessage(err.response?.data?.error || "Error inviting user");
    }
  };

  // IMPORTANT: Fix accept/deny URLs and param name
  // Backend expects senderId (user _id) and routes under /api/friends/accept/:senderId
  const acceptFriendInvite = async (senderId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/friends/accept/${senderId}`,
        {},
        { withCredentials: true }
      );
      setFriendInvites((prev) =>
        prev.filter((invite) => invite._id !== senderId)
      );
    } catch (err) {
      console.error("Error accepting invite", err);
    }
  };

  const denyFriendInvite = async (senderId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/friends/reject/${senderId}`,
        {},
        { withCredentials: true }
      );
      setFriendInvites((prev) =>
        prev.filter((invite) => invite._id !== senderId)
      );
    } catch (err) {
      console.error("Error denying invite", err);
    }
  };

  return (
    <div className="invite-page">
      <div className="invite-card">
        <h2>Invite Users to Room</h2>

        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
          />
          <button onClick={searchUsers}>Search</button>
        </div>

        {results.length > 0 && (
          <ul className="results-list">
            {results.map((user) => (
              <li key={user._id} className="result-item">
                {user.username}
                <button
                  className="invite-btn"
                  disabled={invitedUserIds.includes(user._id)}
                  onClick={() => inviteUser(user._id)}
                >
                  {invitedUserIds.includes(user._id) ? "Invited ✅" : "Invite"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {suggestedFriends.length > 0 && (
          <>
            <h3>Suggested Friends</h3>
            <ul className="results-list">
              {suggestedFriends.map((user) => (
                <li key={user._id} className="result-item">
                  {user.username}
                  <button
                    className="invite-btn"
                    disabled={invitedUserIds.includes(user._id)}
                    onClick={() => inviteUser(user._id)}
                  >
                    {invitedUserIds.includes(user._id)
                      ? "Invited ✅"
                      : "Invite"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {message && <p className="message">{message}</p>}

        {/* Friend Invite Section */}
        {friendInvites.length > 0 && (
          <>
            <h3>Friend Requests</h3>
            <ul className="results-list">
              {friendInvites.map((invite) => (
                <li key={invite._id} className="result-item">
                  {invite.username || "Unknown User"}
                  <div>
                    <button
                      className="accept-btn"
                      onClick={() => acceptFriendInvite(invite._id)}
                    >
                      Accept
                    </button>
                    <button
                      className="deny-btn"
                      onClick={() => denyFriendInvite(invite._id)}
                    >
                      Deny
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
