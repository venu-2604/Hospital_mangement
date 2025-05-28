import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nurseService, Nurse } from '../services/nurseService';
import '../styles/ChatRoom.css';

const ChatRoom: React.FC = () => {
  const { nurseId } = useParams<{ nurseId: string }>();
  const [nurse, setNurse] = useState<Nurse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNurseDetails = async () => {
      try {
        const activeNurses = await nurseService.getActiveNurses();
        const currentNurse = activeNurses.find(n => n.id === Number(nurseId));
        
        if (!currentNurse) {
          setError('Nurse not found');
          return;
        }
        
        setNurse(currentNurse);
      } catch (err) {
        setError('Failed to load nurse details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNurseDetails();
  }, [nurseId]);

  if (loading) {
    return <div className="chat-room-loading">Loading chat room...</div>;
  }

  if (error || !nurse) {
    return (
      <div className="chat-room-error">
        {error || 'Nurse not found'}
        <button onClick={() => navigate('/chat')}>Back to Nurses List</button>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>Chat with {nurse.name}</h2>
        <button onClick={() => navigate('/chat')}>Back to Nurses List</button>
      </div>
      <div className="chat-messages">
        {/* Chat messages will be implemented here */}
        <p>Chat functionality coming soon...</p>
      </div>
    </div>
  );
};

export default ChatRoom; 