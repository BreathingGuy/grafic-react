import { memo} from 'react';

import AdminStatusCount from './AdminStatusCount';

const AdminStatusBar = memo(() => {
  return (
    <div style={{
      marginBottom: '12px',
      padding: '8px 12px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'space-between'
    }}>
      <AdminStatusCount />
      <span style={{ color: '#666' }}>
        Ctrl+C копировать | Ctrl+V вставить | Ctrl+Z отменить | Esc снять выделение
      </span>
    </div>
  );
});

AdminStatusBar.displayName = 'AdminStatusBar';

export default AdminStatusBar;
