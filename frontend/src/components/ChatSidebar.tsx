import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nurseService, Nurse } from '../services/nurseService';
import '../styles/ChatSidebar.css';

const ChatSidebar: React.FC = () => {
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

  return (
    <div className="chat-sidebar">
      <h3 className="sidebar-title">Nurses</h3>
      {loading && <div className="sidebar-loading">Loading...</div>}
      {error && <div className="sidebar-error">{error}</div>}
      <div className="sidebar-nurse-list">
        {nurses.map((nurse) => (
          <div
            key={nurse.id}
            className="sidebar-nurse-item"
            onClick={() => handleNurseClick(nurse.id)}
          >
            {nurse.name}
          </div>
        ))}
        {(!loading && nurses.length === 0) && (
          <div className="sidebar-no-nurses">No active nurses</div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar; 