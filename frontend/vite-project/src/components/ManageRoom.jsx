import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./ManageRoom.css";

export default function ManageRoom() {
  const { id } = useParams();
  const [participants, setParticipants] = useState([]);
  const [requests, setRequests] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://192.168.86.22:3000";


  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomRes = await axios.get(`${API_BASE_URL}/api/rooms/${id}`, {
          withCredentials: true,
        });

        setParticipants(roomRes.data.participants || []);
        setOwnerId(roomRes.data.owner._id);

        const meRes = await axios.get(`${API_BASE_URL}/api/users/me`, {
          withCredentials: true,
        });
        setMe(meRes.data._id);

        const reqRes = await axios.get(`${API_BASE_URL}/api/rooms/${id}/requests`, {
          withCredentials: true,
        });
        setRequests(reqRes.data);
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };

    fetchData();
  }, [id, navigate]);

  const kickUser = async (userId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rooms/${id}/kick/${userId}`,
        {},
        { withCredentials: true }
      );
      setParticipants(participants.filter((u) => u._id !== userId));
    } catch (err) {
      console.error(err);
      alert("Failed to kick user");
    }
  };

  const acceptRequest = async (userId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rooms/${id}/requests/${userId}/accept`,
        {},
        { withCredentials: true }
      );
      setParticipants([...participants, requests.find(r => r.user._id === userId).user]);
      setRequests(requests.filter(r => r.user._id !== userId));
    } catch (err) {
      console.error(err);
      alert("Failed to accept request");
    }
  };

  const denyRequest = async (userId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rooms/${id}/requests/${userId}/deny`,
        {},
        { withCredentials: true }
      );
      setRequests(requests.filter(r => r.user._id !== userId));
    } catch (err) {
      console.error(err);
      alert("Failed to deny request");
    }
  };

  if (!me) return <p>Loading...</p>;

  const isOwner = me === ownerId;

  return (
    <div className="manage-room-page">
      <div className="manage-room-card">
        <h2>Manage Room</h2>

        {!isOwner && (
          <p className="not-owner-msg">
            You are not the owner of this room. You cannot kick users or manage requests.
          </p>
        )}

        <h3>Participants</h3>
        <ul className="participant-list">
          {participants.map((user) => (
            <li key={user._id} className="participant-item">
              <span>
                {user.username}{" "}
                {user._id === ownerId && <strong>(Owner)</strong>}
              </span>
              {isOwner && user._id !== ownerId && (
                <button className="kick-btn" onClick={() => kickUser(user._id)}>
                  Kick
                </button>
              )}
            </li>
          ))}
        </ul>

        {isOwner && (
          <>
            <h3>Pending Join Requests</h3>
            {requests.length === 0 && <p>No pending requests</p>}

            <ul className="request-list">
              {requests.map((r) => (
                <li key={r.user._id} className="request-item">
                  <span>{r.user.username}</span>
                  <button
                    className="accept-btn"
                    onClick={() => acceptRequest(r.user._id)}
                  >
                    ✅ Accept
                  </button>
                  <button
                    className="deny-btn"
                    onClick={() => denyRequest(r.user._id)}
                  >
                    ❌ Deny
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
