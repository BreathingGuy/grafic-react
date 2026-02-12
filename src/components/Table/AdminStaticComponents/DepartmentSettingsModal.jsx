import { useState } from 'react';
import EmployeesTab from './Settings/EmployeesTab/EmployeesTab';
import StatusesTab from './Settings/StatusesTab/StatusesTab';
import DepartmentTab from './Settings/DepartmentTab/DepartmentTab';

/**
 * DepartmentSettingsModal — модальное окно настроек отдела
 * Три раздела: Сотрудники, Обозначения (statusConfig), Название отдела
 */
export default function DepartmentSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('employees');

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Настройки отдела</h3>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>

        <div style={tabsStyle}>
          <button
            style={activeTab === 'employees' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('employees')}
          >
            Сотрудники
          </button>
          <button
            style={activeTab === 'statuses' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('statuses')}
          >
            Обозначения
          </button>
          <button
            style={activeTab === 'department' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('department')}
          >
            Отдел
          </button>
        </div>

        <div style={contentStyle}>
          {activeTab === 'employees' && <EmployeesTab />}
          {activeTab === 'statuses' && <StatusesTab />}
          {activeTab === 'department' && <DepartmentTab />}
        </div>
      </div>
    </div>
  );
}

// Стили модалки (layout)

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  minWidth: '700px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '4px 8px',
  color: '#666'
};

const tabsStyle = {
  display: 'flex',
  gap: '4px',
  marginBottom: '16px',
  borderBottom: '2px solid #e0e0e0',
  paddingBottom: '0'
};

const tabStyle = {
  padding: '8px 16px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#666',
  borderBottom: '2px solid transparent',
  marginBottom: '-2px'
};

const activeTabStyle = {
  ...tabStyle,
  color: '#1976d2',
  fontWeight: 500,
  borderBottom: '2px solid #1976d2'
};

const contentStyle = {
  flex: 1,
  overflow: 'auto'
};
