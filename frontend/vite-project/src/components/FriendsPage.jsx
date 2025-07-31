import { useEffect, useState } from "react";
import axios from "axios";
import "./FriendsPage.css"; // reuse or adjust styles as needed

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [message, setMessage] = useState("");
  const [sentRequests, setSentRequests] = useState(new Set());

  // Use environment variable or fallback URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/friends`, {
        withCredentials: true,
      });
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load friends.");
    } finally {
      setLoadingFriends(false);
    }
  };

  // Remove friend
  const removeFriend = async (friendId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/friends/remove/${friendId}`,
        {},
        { withCredentials: true }
      );
      setFriends(friends.filter((f) => f._id !== friendId));
      setMessage("Friend removed.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to remove friend.");
    }
  };

  // Search users to add
  const searchUsers = async () => {
    if (!query.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/users/search?query=${query}`,
        { withCredentials: true }
      );
      setResults(res.data);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("Error searching for users.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (targetId) => {
    if (sentRequests.has(targetId)) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/friends/request/${targetId}`,
        {},
        { withCredentials: true }
      );
      setSentRequests(new Set(sentRequests).add(targetId));
      setMessage(res.data.message || "Friend request sent.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send request.");
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="friends-page">
      <div className="friends-card">
        <h1>My Friends</h1>
        {message && <p className="message">{message}</p>}

        {loadingFriends ? (
          <p>Loading friends...</p>
        ) : friends.length === 0 ? (
          <p>You have no friends yet.</p>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li key={friend._id} className="friend-item">
                <span>{friend.username}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeFriend(friend._id)}
                >
                  Remove Friend
                </button>
              </li>
            ))}
          </ul>
        )}

        <hr style={{ margin: "2rem 0" }} />

        <h2>Add Friends</h2>
        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
          />
          <button onClick={searchUsers} disabled={loadingSearch}>
            {loadingSearch ? "Searching..." : "Search"}
          </button>
        </div>

        <ul className="results-list">
          {results.map((user) => (
            <li key={user._id} className="result-item">
              {user.username}
              <button
                className="friend-btn"
                onClick={() => sendFriendRequest(user._id)}
                disabled={sentRequests.has(user._id)}
              >
                {sentRequests.has(user._id) ? "Request Sent" : "Add Friend"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
