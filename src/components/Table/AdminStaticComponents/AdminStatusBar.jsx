import { memo} from 'react';

import AdminStatusCount from './AdminStatusCount';
import s from './AdminPanel.module.css';

const AdminStatusBar = memo(() => {
  return (
    <div className={s.statusBar}>
      <AdminStatusCount />
      <span className={s.statusBarHint}>
        Ctrl+C копировать | Ctrl+V вставить | Ctrl+Z отменить | Esc снять выделение
      </span>
    </div>
  );
});

AdminStatusBar.displayName = 'AdminStatusBar';

export default AdminStatusBar;
