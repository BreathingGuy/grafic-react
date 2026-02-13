import { useState, Fragment } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { usePostWebStore } from '../../../store/postWebStore';
import { MONTHS } from '../../../constants';

/**
 * YearSettingsModal — настройка норм часов по месяцам для года
 * 12 месяцев + автосуммы кварталов + кнопка Сохранить
 */
export default function YearSettingsModal({ isOpen, onClose }) {
  const editingYear = useAdminStore(s => s.editingYear);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const storeNorms = useAdminStore(s => s.monthNorms);

  const [draftNorms, setDraftNorms] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Инициализация при открытии
  if (isOpen && !initialized) {
    setDraftNorms({ ...storeNorms });
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
  }

  // Ключ месяца: "2025-01"
  const monthKey = (monthIdx) => {
    const m = String(monthIdx + 1).padStart(2, '0');
    return `${editingYear}-${m}`;
  };

  const getValue = (monthIdx) => draftNorms[monthKey(monthIdx)] ?? '';

  const setValue = (monthIdx, val) => {
    setDraftNorms(prev => ({
      ...prev,
      [monthKey(monthIdx)]: val === '' ? '' : Number(val)
    }));
  };

  // Суммы кварталов (вычисляется при каждом рендере — 12 сложений)
  const quarterSums = [0, 0, 0, 0];
  for (let q = 0; q < 4; q++) {
    for (let m = q * 3; m < q * 3 + 3; m++) {
      const v = draftNorms[monthKey(m)];
      quarterSums[q] += (typeof v === 'number' ? v : 0);
    }
  }

  const yearTotal = quarterSums[0] + quarterSums[1] + quarterSums[2] + quarterSums[3];

  const handleSave = () => {
    // Очистить пустые значения → 0
    const cleaned = {};
    for (let i = 0; i < 12; i++) {
      const key = monthKey(i);
      const val = draftNorms[key];
      cleaned[key] = typeof val === 'number' ? val : 0;
    }

    useAdminStore.setState({ monthNorms: cleaned });
    usePostWebStore.getState().saveMonthNorms(editingDepartmentId, editingYear, cleaned);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Нормы часов — {editingYear}</h3>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>

        <div style={contentStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Месяц</th>
                <th style={thStyle}>Норма (часы)</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((name, idx) => {
                const isQuarterEnd = (idx + 1) % 3 === 0;
                const quarterIdx = Math.floor(idx / 3);

                return (
                  <Fragment key={idx}>
                    <tr>
                      <td style={tdStyle}>
                        <span style={{ textTransform: 'capitalize' }}>{name}</span>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={getValue(idx)}
                          onChange={e => setValue(idx, e.target.value)}
                          style={inputStyle}
                          min={0}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    {isQuarterEnd && (
                      <tr style={quarterRowStyle}>
                        <td style={quarterTdStyle}>
                          <strong>Квартал {quarterIdx + 1}</strong>
                        </td>
                        <td style={quarterTdStyle}>
                          <strong>{quarterSums[quarterIdx]}</strong>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <tr style={totalRowStyle}>
                <td style={quarterTdStyle}><strong>Итого за год</strong></td>
                <td style={quarterTdStyle}><strong>{yearTotal}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={footerStyle}>
          <button onClick={handleSave} style={saveBtnStyle}>Сохранить</button>
          <button onClick={onClose} style={cancelBtnStyle}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// Стили

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
  minWidth: '400px',
  maxWidth: '500px',
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

const contentStyle = {
  flex: 1,
  overflow: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px'
};

const thStyle = {
  padding: '8px 12px',
  borderBottom: '2px solid #e0e0e0',
  textAlign: 'left',
  fontWeight: 500
};

const tdStyle = {
  padding: '6px 12px',
  borderBottom: '1px solid #f0f0f0'
};

const inputStyle = {
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
  width: '100px'
};

const quarterRowStyle = {
  backgroundColor: '#e8f0fe'
};

const quarterTdStyle = {
  padding: '8px 12px',
  borderBottom: '2px solid #ccc'
};

const totalRowStyle = {
  backgroundColor: '#e0e0e0'
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #e0e0e0'
};

const saveBtnStyle = {
  padding: '8px 24px',
  fontSize: '14px',
  fontWeight: 500,
  border: 'none',
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelBtnStyle = {
  padding: '8px 24px',
  fontSize: '14px',
  border: '1px solid #ccc',
  backgroundColor: 'white',
  color: '#333',
  borderRadius: '4px',
  cursor: 'pointer'
};
