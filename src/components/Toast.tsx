import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export const Toast: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="toast-container">
      {notifications.map((n) => (
        <div key={n.id} className={`toast-item type-${n.type}`}>
          <div className="toast-icon">
            {n.type === 'success' && <CheckCircle size={16} />}
            {n.type === 'error' && <AlertCircle size={16} />}
            {n.type === 'info' && <Info size={16} />}
          </div>
          <div className="toast-message">{n.message}</div>
          <button className="toast-close" onClick={() => removeNotification(n.id)}>
            <X size={14} />
          </button>
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
};
