'use client';

import React, { useState } from 'react';
import { useTimelineStore } from '@/lib/store';
import { ItemType, TimelineItem } from '@/lib/types';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Settings2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export default function FormPanel() {
  const items = useTimelineStore((s) => s.items);
  const settings = useTimelineStore((s) => s.settings);
  const selectedItemId = useTimelineStore((s) => s.selectedItemId);
  const addItem = useTimelineStore((s) => s.addItem);
  const updateItem = useTimelineStore((s) => s.updateItem);
  const removeItem = useTimelineStore((s) => s.removeItem);
  const setSelectedItem = useTimelineStore((s) => s.setSelectedItem);
  const updateSettings = useTimelineStore((s) => s.updateSettings);
  const addRow = useTimelineStore((s) => s.addRow);
  const removeRow = useTimelineStore((s) => s.removeRow);
  const renameRow = useTimelineStore((s) => s.renameRow);
  const moveRow = useTimelineStore((s) => s.moveRow);

  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newItem, setNewItem] = useState({
    type: 'phase' as ItemType,
    label: '',
    description: '',
    startDate: '',
    endDate: '',
    row: 0,
  });

  const handleAddItem = () => {
    if (!newItem.label || !newItem.startDate) return;
    addItem({
      ...newItem,
      endDate: newItem.type === 'milestone' ? undefined : newItem.endDate || undefined,
    });
    setNewItem({ type: 'phase', label: '', description: '', startDate: '', endDate: '', row: 0 });
    setShowAdd(false);
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="form-panel">
      {/* Settings section */}
      <div className="panel-section">
        <button
          className="section-header"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 size={14} />
          <span>Timeline Settings</span>
          {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showSettings && (
          <div className="section-body">
            <label className="form-label">
              Title
              <input
                type="text"
                className="form-input"
                value={settings.title}
                onChange={(e) => updateSettings({ title: e.target.value })}
              />
            </label>
            <label className="form-label">
              Subtitle
              <input
                type="text"
                className="form-input"
                value={settings.subtitle || ''}
                onChange={(e) => updateSettings({ subtitle: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label className="form-label">
                Start Date
                <input
                  type="date"
                  className="form-input"
                  value={settings.startDate}
                  onChange={(e) => updateSettings({ startDate: e.target.value })}
                />
              </label>
              <label className="form-label">
                End Date
                <input
                  type="date"
                  className="form-input"
                  value={settings.endDate}
                  onChange={(e) => updateSettings({ endDate: e.target.value })}
                />
              </label>
            </div>
            <div className="form-label">
              Rows
              <div className="row-manager">
                {settings.rowLabels.map((label, i) => (
                  <div key={i} className="row-manager-item">
                    <span className="row-manager-grip">
                      <GripVertical size={12} />
                    </span>
                    <input
                      type="text"
                      className="row-manager-input"
                      value={label}
                      onChange={(e) => renameRow(i, e.target.value)}
                      placeholder={`Row ${i + 1}`}
                    />
                    <span className="row-manager-count">
                      {items.filter((item) => item.row === i).length}
                    </span>
                    <button
                      className="row-manager-btn"
                      onClick={() => moveRow(i, 'up')}
                      disabled={i === 0}
                      title="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      className="row-manager-btn"
                      onClick={() => moveRow(i, 'down')}
                      disabled={i === settings.rowLabels.length - 1}
                      title="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      className="row-manager-btn danger"
                      onClick={() => removeRow(i)}
                      disabled={settings.rowLabels.length <= 1}
                      title="Remove row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <div className="row-manager-add">
                  <input
                    type="text"
                    className="row-manager-input"
                    value={newRowName}
                    onChange={(e) => setNewRowName(e.target.value)}
                    placeholder="New row name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newRowName.trim()) {
                        addRow(newRowName.trim());
                        setNewRowName('');
                      }
                    }}
                  />
                  <button
                    className="row-manager-btn add"
                    onClick={() => {
                      if (newRowName.trim()) {
                        addRow(newRowName.trim());
                        setNewRowName('');
                      }
                    }}
                    title="Add row"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
            <div className="form-row">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.showGrid}
                  onChange={(e) => updateSettings({ showGrid: e.target.checked })}
                />
                Show Grid
              </label>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={settings.showLabels}
                  onChange={(e) => updateSettings({ showLabels: e.target.checked })}
                />
                Show Labels
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Selected item editor */}
      {selectedItem && (
        <div className="panel-section highlight">
          <div className="section-header">
            <Pencil size={14} />
            <span>Edit Item</span>
          </div>
          <div className="section-body">
            <label className="form-label">
              Label
              <input
                type="text"
                className="form-input"
                value={selectedItem.label}
                onChange={(e) => updateItem(selectedItem.id, { label: e.target.value })}
              />
            </label>
            <label className="form-label">
              Description
              <input
                type="text"
                className="form-input"
                value={selectedItem.description || ''}
                onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
              />
            </label>
            <label className="form-label">
              Type
              <select
                className="form-input"
                value={selectedItem.type}
                onChange={(e) => updateItem(selectedItem.id, { type: e.target.value as ItemType })}
              >
                <option value="phase">Phase</option>
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
              </select>
            </label>
            <div className="form-row">
              <label className="form-label">
                Start
                <input
                  type="date"
                  className="form-input"
                  value={selectedItem.startDate}
                  onChange={(e) => updateItem(selectedItem.id, { startDate: e.target.value })}
                />
              </label>
              {selectedItem.type !== 'milestone' && (
                <label className="form-label">
                  End
                  <input
                    type="date"
                    className="form-input"
                    value={selectedItem.endDate || ''}
                    onChange={(e) => updateItem(selectedItem.id, { endDate: e.target.value })}
                  />
                </label>
              )}
            </div>
            <label className="form-label">
              Row
              <select
                className="form-input"
                value={selectedItem.row}
                onChange={(e) => updateItem(selectedItem.id, { row: parseInt(e.target.value) })}
              >
                {settings.rowLabels.map((label, i) => (
                  <option key={i} value={i}>{label}</option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button
                className="btn-danger"
                onClick={() => {
                  removeItem(selectedItem.id);
                  setSelectedItem(null);
                }}
              >
                <Trash2 size={14} />
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add item */}
      <div className="panel-section">
        <button
          className="section-header"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={14} />
          <span>Add Item</span>
          {showAdd ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showAdd && (
          <div className="section-body">
            <label className="form-label">
              Type
              <select
                className="form-input"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as ItemType })}
              >
                <option value="phase">Phase</option>
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
              </select>
            </label>
            <label className="form-label">
              Label
              <input
                type="text"
                className="form-input"
                value={newItem.label}
                placeholder="e.g. Design Sprint"
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
              />
            </label>
            <label className="form-label">
              Description
              <input
                type="text"
                className="form-input"
                value={newItem.description}
                placeholder="Optional description"
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label className="form-label">
                Start Date
                <input
                  type="date"
                  className="form-input"
                  value={newItem.startDate}
                  onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                />
              </label>
              {newItem.type !== 'milestone' && (
                <label className="form-label">
                  End Date
                  <input
                    type="date"
                    className="form-input"
                    value={newItem.endDate}
                    onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                  />
                </label>
              )}
            </div>
            <label className="form-label">
              Row
              <select
                className="form-input"
                value={newItem.row}
                onChange={(e) => setNewItem({ ...newItem, row: parseInt(e.target.value) })}
              >
                {settings.rowLabels.map((label, i) => (
                  <option key={i} value={i}>{label}</option>
                ))}
              </select>
            </label>
            <button className="btn-primary" onClick={handleAddItem}>
              <Plus size={14} />
              Add to Timeline
            </button>
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="panel-section">
        <div className="section-header">
          <span>Items ({items.length})</span>
        </div>
        <div className="item-list">
          {items.length === 0 && (
            <p className="empty-message">
              No items yet. Add items or load a template to get started.
            </p>
          )}
          {settings.rowLabels.map((rowLabel, rowIndex) => {
            const rowItems = items.filter((i) => i.row === rowIndex);
            if (rowItems.length === 0) return null;
            return (
              <div key={rowIndex} className="item-group">
                <div className="item-group-label">{rowLabel}</div>
                {rowItems.map((item) => (
                  <button
                    key={item.id}
                    className={`item-list-entry ${selectedItemId === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item.id)}
                  >
                    <span className={`item-type-badge ${item.type}`}>
                      {item.type === 'milestone' ? '◆' : item.type === 'phase' ? '▬' : '●'}
                    </span>
                    <span className="item-list-label">{item.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
