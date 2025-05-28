import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nurseService, Nurse } from '../services/nurseService';
import '../styles/ChatBox.css';

const ChatBox: React.FC = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchActiveNurses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const activeNurses = await nurseService.getActiveNurses();
      setNurses(activeNurses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active nurses');
      console.error('Error in fetchActiveNurses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveNurses();
  }, [fetchActiveNurses]);

  const handleNurseClick = (nurseId: number) => {
    navigate(`/chat/${nurseId}`);
  };

  const handleRetry = () => {
    fetchActiveNurses();
  };

  if (loading) {
    return (
      <div className="chat-box-loading">
        <div className="loading-spinner"></div>
        <p>Loading nurses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-box-error">
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <h2>Active Nurses</h2>
      <div className="nurse-list">
        {nurses.length === 0 ? (
          <p className="no-nurses">No active nurses found</p>
        ) : (
          nurses.map((nurse) => (
            <div
              key={nurse.id}
              className="nurse-item"
              onClick={() => handleNurseClick(nurse.id)}
            >
              <span className="nurse-name">{nurse.name}</span>
              <span className="nurse-status">{nurse.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatBox; 