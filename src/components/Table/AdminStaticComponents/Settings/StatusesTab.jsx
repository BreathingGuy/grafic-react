import { useState, useCallback } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useMetaStore } from '../../../../store/metaStore';
import { usePostWebStore } from '../../../../store/postWebStore';
import {
  tableStyle, thStyle, tdStyle, inputStyle, colorInputStyle,
  smallBtnStyle, smallBtnGrayStyle, smallBtnRedStyle, addFormStyle
} from './settingsStyles';

export default function StatusesTab() {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);

  const statuses = currentConfig?.statusConfig || [];
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '', codeWork: '', codeList: '', label: '',
    colorText: '#000000', colorBack: '#ffffff', descriptin: ''
  });

  const saveConfig = useCallback((newStatuses) => {
    if (!editingDepartmentId || !currentConfig) return;

    const newConfig = {
      ...currentConfig,
      statusConfig: newStatuses
    };

    const colorMap = useMetaStore.getState().buildColorMap(newConfig);
    useMetaStore.setState({ currentDepartmentConfig: newConfig, statusColorMap: colorMap });

    usePostWebStore.getState().saveDepartmentConfig(editingDepartmentId, newConfig);
  }, [editingDepartmentId, currentConfig]);

  const startEdit = (idx) => {
    setEditForm({ ...statuses[idx] });
    setEditingIdx(idx);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const saveEdit = () => {
    const newStatuses = [...statuses];
    newStatuses[editingIdx] = { ...editForm };
    saveConfig(newStatuses);
    setEditingIdx(null);
  };

  const addStatus = () => {
    if (!addForm.code) return;
    const newStatuses = [...statuses, { ...addForm }];
    saveConfig(newStatuses);
    setAddForm({
      code: '', codeWork: '', codeList: '', label: '',
      colorText: '#000000', colorBack: '#ffffff', descriptin: ''
    });
    setShowAddForm(false);
  };

  const deleteStatus = (idx) => {
    if (!window.confirm(`Удалить обозначение "${statuses[idx].code}"?`)) return;
    const newStatuses = statuses.filter((_, i) => i !== idx);
    saveConfig(newStatuses);
  };

  return (
    <div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Код</th>
              <th style={thStyle}>Отобр.</th>
              <th style={thStyle}>Список</th>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Цвет текста</th>
              <th style={thStyle}>Цвет фона</th>
              <th style={thStyle}>Описание</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status, idx) => {
              if (editingIdx === idx) {
                return (
                  <tr key={idx}>
                    <td style={tdStyle}>
                      <input
                        value={editForm.code}
                        onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                        style={{ ...inputStyle, width: '40px' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.codeWork || ''}
                        onChange={e => setEditForm(f => ({ ...f, codeWork: e.target.value }))}
                        style={{ ...inputStyle, width: '40px' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.codeList || ''}
                        onChange={e => setEditForm(f => ({ ...f, codeList: e.target.value }))}
                        style={{ ...inputStyle, width: '40px' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.label}
                        onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="color"
                        value={editForm.colorText || '#000000'}
                        onChange={e => setEditForm(f => ({ ...f, colorText: e.target.value }))}
                        style={colorInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="color"
                        value={editForm.colorBack || '#ffffff'}
                        onChange={e => setEditForm(f => ({ ...f, colorBack: e.target.value }))}
                        style={colorInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.descriptin || ''}
                        onChange={e => setEditForm(f => ({ ...f, descriptin: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <button onClick={saveEdit} style={smallBtnStyle}>Сохр.</button>
                      <button onClick={cancelEdit} style={smallBtnGrayStyle}>Отм.</button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={idx}>
                  <td style={tdStyle}><strong>{status.code}</strong></td>
                  <td style={tdStyle}>{status.codeWork}</td>
                  <td style={tdStyle}>{status.codeList}</td>
                  <td style={tdStyle}>{status.label}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', width: '20px', height: '20px',
                      backgroundColor: status.colorText || '#000', border: '1px solid #ccc',
                      verticalAlign: 'middle'
                    }} />
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', width: '20px', height: '20px',
                      backgroundColor: status.colorBack || '#fff', border: '1px solid #ccc',
                      verticalAlign: 'middle'
                    }} />
                  </td>
                  <td style={tdStyle}>{status.descriptin}</td>
                  <td style={tdStyle}>
                    <button onClick={() => startEdit(idx)} style={smallBtnStyle}>Ред.</button>
                    <button onClick={() => deleteStatus(idx)} style={smallBtnRedStyle}>Уд.</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <div style={addFormStyle}>
          <h4 style={{ margin: '0 0 8px 0' }}>Новое обозначение</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Код"
              value={addForm.code}
              onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
              style={{ ...inputStyle, width: '50px' }}
            />
            <input
              placeholder="Отобр."
              value={addForm.codeWork}
              onChange={e => setAddForm(f => ({ ...f, codeWork: e.target.value }))}
              style={{ ...inputStyle, width: '50px' }}
            />
            <input
              placeholder="Список"
              value={addForm.codeList}
              onChange={e => setAddForm(f => ({ ...f, codeList: e.target.value }))}
              style={{ ...inputStyle, width: '50px' }}
            />
            <input
              placeholder="Название"
              value={addForm.label}
              onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
              style={inputStyle}
            />
            <label style={{ fontSize: '12px' }}>
              Текст: <input
                type="color"
                value={addForm.colorText}
                onChange={e => setAddForm(f => ({ ...f, colorText: e.target.value }))}
                style={colorInputStyle}
              />
            </label>
            <label style={{ fontSize: '12px' }}>
              Фон: <input
                type="color"
                value={addForm.colorBack}
                onChange={e => setAddForm(f => ({ ...f, colorBack: e.target.value }))}
                style={colorInputStyle}
              />
            </label>
            <input
              placeholder="Описание"
              value={addForm.descriptin}
              onChange={e => setAddForm(f => ({ ...f, descriptin: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <button onClick={addStatus} style={smallBtnStyle}>Добавить</button>
            <button onClick={() => setShowAddForm(false)} style={smallBtnGrayStyle}>Отмена</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{ ...smallBtnStyle, marginTop: '12px' }}
        >
          + Добавить обозначение
        </button>
      )}
    </div>
  );
}
