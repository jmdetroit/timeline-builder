'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTimelineStore } from '@/lib/store';
import { ItemType, TimelineItem, TimelineProject, EventLineStyle } from '@/lib/types';
import {
  getSavedProjects,
  saveNewProject,
  updateSavedProject,
  deleteSavedProject,
  renameSavedProject,
  getActiveProjectId,
  setActiveProjectId,
} from '@/lib/storage';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Settings2, ArrowUp, ArrowDown, GripVertical, Milestone, Save, FolderOpen, Check, LayoutList, CalendarRange, Flag } from 'lucide-react';

type SidebarTab = 'projects' | 'timeline' | 'items';

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
  const addEventLine = useTimelineStore((s) => s.addEventLine);
  const updateEventLine = useTimelineStore((s) => s.updateEventLine);
  const removeEventLine = useTimelineStore((s) => s.removeEventLine);

  const loadProject = useTimelineStore((s) => s.loadProject);

  const [activeTab, setActiveTab] = useState<SidebarTab>('items');
  const [showEventLines, setShowEventLines] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));
  const [quickAddRow, setQuickAddRow] = useState<number | null>(null);
  const [renamingRowIndex, setRenamingRowIndex] = useState<number | null>(null);
  const [rowRenameValue, setRowRenameValue] = useState('');
  const [savedProjects, setSavedProjects] = useState<TimelineProject[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newRowName, setNewRowName] = useState('');
  const [newEvent, setNewEvent] = useState({ label: '', date: '', color: '#E84393', style: 'dashed' as EventLineStyle });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    type: 'phase' as ItemType,
    label: '',
    description: '',
    startDate: '',
    endDate: '',
    row: 0,
  });

  const [quickItem, setQuickItem] = useState({
    type: 'phase' as ItemType,
    label: '',
    startDate: '',
    endDate: '',
  });

  const handleQuickAdd = (rowIndex: number) => {
    if (!quickItem.label || !quickItem.startDate) return;
    addItem({
      type: quickItem.type,
      label: quickItem.label,
      startDate: quickItem.startDate,
      endDate: quickItem.type === 'milestone' ? undefined : quickItem.endDate || undefined,
      row: rowIndex,
    });
    setQuickItem({ type: 'phase', label: '', startDate: '', endDate: '' });
    setQuickAddRow(null);
  };

  const toggleRowExpanded = (rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const startRenamingRow = (rowIndex: number) => {
    setRenamingRowIndex(rowIndex);
    setRowRenameValue(settings.rowLabels[rowIndex]);
  };

  const commitRowRename = (rowIndex: number) => {
    const trimmed = rowRenameValue.trim();
    if (trimmed) renameRow(rowIndex, trimmed);
    setRenamingRowIndex(null);
  };

  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // When an item is selected, switch to items tab
  useEffect(() => {
    if (selectedItemId) {
      setActiveTab('items');
    }
  }, [selectedItemId]);

  // ── Saved projects ──
  const refreshProjects = useCallback(() => {
    setSavedProjects(getSavedProjects());
    setActiveId(getActiveProjectId());
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleSaveNewProject = () => {
    const name = newProjectName.trim() || settings.title || 'Untitled Project';
    setConfirmAction({
      message: `Save current timeline as "${name}"?`,
      onConfirm: () => {
        const project = saveNewProject(name, items, settings);
        setActiveId(project.id);
        setNewProjectName('');
        refreshProjects();
      },
    });
  };

  const handleSaveCurrentProject = () => {
    if (!activeProjectId) return;
    const projectName = savedProjects.find((p) => p.id === activeProjectId)?.name || 'Current';
    setConfirmAction({
      message: `Update "${projectName}" with current changes?`,
      onConfirm: () => {
        updateSavedProject(activeProjectId, items, settings);
        refreshProjects();
      },
    });
  };

  const handleLoadProject = (project: TimelineProject) => {
    setConfirmAction({
      message: `Load "${project.name}"? This will replace your current timeline.`,
      onConfirm: () => {
        loadProject(project.items, project.settings);
        setActiveProjectId(project.id);
        setActiveId(project.id);
      },
    });
  };

  const handleDeleteProject = (id: string) => {
    const projectName = savedProjects.find((p) => p.id === id)?.name || 'this project';
    setConfirmAction({
      message: `Delete "${projectName}"? This cannot be undone.`,
      onConfirm: () => {
        deleteSavedProject(id);
        if (activeProjectId === id) setActiveId(null);
        refreshProjects();
      },
    });
  };

  const handleRenameProject = (id: string) => {
    if (!renameValue.trim()) return;
    renameSavedProject(id, renameValue.trim());
    setRenamingProjectId(null);
    setRenameValue('');
    refreshProjects();
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="form-panel">
      {/* ═══ Nav Rail ═══ */}
      <div className="sidebar-rail">
        <button
          className={`rail-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
          title="Projects"
        >
          <FolderOpen size={16} />
          <span>Projects</span>
        </button>
        <button
          className={`rail-tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
          title="Timeline Settings"
        >
          <CalendarRange size={16} />
          <span>Timeline</span>
        </button>
        <button
          className={`rail-tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
          title="Items & Events"
        >
          <LayoutList size={16} />
          <span>Items</span>
        </button>
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="sidebar-content">

        {/* ── PROJECTS TAB ── */}
        {activeTab === 'projects' && (
          <div className="tab-content">
            <div className="tab-content-header">
              <FolderOpen size={14} />
              <span>Projects ({savedProjects.length})</span>
            </div>
            <div className="section-body">
              {/* Save actions */}
              <div className="project-save-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder={settings.title || 'Project name...'}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNewProject();
                  }}
                />
                <button className="btn-primary btn-compact" onClick={handleSaveNewProject} title="Save as new project">
                  <Save size={14} /> Save New
                </button>
              </div>
              {activeProjectId && (
                <button
                  className="btn-save-current"
                  onClick={handleSaveCurrentProject}
                  title="Update the currently active project"
                >
                  <Check size={12} />
                  Update &ldquo;{savedProjects.find((p) => p.id === activeProjectId)?.name || 'Current'}&rdquo;
                </button>
              )}

              {/* Project list */}
              <div className="project-list">
                {savedProjects.length === 0 && (
                  <p className="empty-message">No saved projects yet. Save your current timeline to access it later.</p>
                )}
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-item ${activeProjectId === project.id ? 'active' : ''}`}
                  >
                    {renamingProjectId === project.id ? (
                      <div className="project-rename-row">
                        <input
                          type="text"
                          className="form-input"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameProject(project.id);
                            if (e.key === 'Escape') setRenamingProjectId(null);
                          }}
                          autoFocus
                        />
                        <button className="btn-sm" onClick={() => handleRenameProject(project.id)}>Save</button>
                        <button className="btn-sm" onClick={() => setRenamingProjectId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="project-item-main"
                          onClick={() => handleLoadProject(project)}
                          title="Load this project"
                        >
                          <div className="project-item-info">
                            <span className="project-item-name">{project.name}</span>
                            <span className="project-item-meta">
                              {project.items.length} items &middot; {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                        <div className="project-item-actions">
                          <button
                            className="icon-btn"
                            onClick={() => {
                              setRenamingProjectId(project.id);
                              setRenameValue(project.name);
                            }}
                            title="Rename"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDeleteProject(project.id)}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div className="tab-content">
            <div className="tab-content-header">
              <CalendarRange size={14} />
              <span>Timeline Settings</span>
            </div>
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
              <div className="form-row">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.showTodayMarker !== false}
                    onChange={(e) => updateSettings({ showTodayMarker: e.target.checked })}
                  />
                  Show Today Marker
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.showProgress !== false}
                    onChange={(e) => updateSettings({ showProgress: e.target.checked })}
                  />
                  Show Progress
                </label>
              </div>

              {/* Event Lines subsection */}
              <div className="panel-subsection">
                <button
                  className="subsection-header"
                  onClick={() => setShowEventLines(!showEventLines)}
                >
                  <Flag size={12} />
                  <span>Event Lines ({(settings.eventLines || []).length})</span>
                  {showEventLines ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showEventLines && (
                  <div className="subsection-body">
                    {/* Add new event line */}
                    <div className="event-line-add">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Label (e.g. Phase 2 Begins)"
                        value={newEvent.label}
                        onChange={(e) => setNewEvent({ ...newEvent, label: e.target.value })}
                      />
                      <div className="form-row">
                        <input
                          type="date"
                          className="form-input"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        />
                        <input
                          type="color"
                          className="form-color-sm"
                          value={newEvent.color}
                          onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                          title="Line color"
                        />
                      </div>
                      <div className="form-row">
                        <select
                          className="form-input"
                          value={newEvent.style}
                          onChange={(e) => setNewEvent({ ...newEvent, style: e.target.value as EventLineStyle })}
                        >
                          <option value="dashed">Dashed</option>
                          <option value="solid">Solid</option>
                          <option value="dotted">Dotted</option>
                        </select>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (!newEvent.label || !newEvent.date) return;
                            addEventLine(newEvent);
                            setNewEvent({ label: '', date: '', color: '#E84393', style: 'dashed' });
                          }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>

                    {/* Event line list */}
                    {(settings.eventLines || []).map((evt) => (
                      <div key={evt.id} className="event-line-item">
                        {editingEventId === evt.id ? (
                          <div className="event-line-edit">
                            <input
                              type="text"
                              className="form-input"
                              value={evt.label}
                              onChange={(e) => updateEventLine(evt.id, { label: e.target.value })}
                            />
                            <div className="form-row">
                              <input
                                type="date"
                                className="form-input"
                                value={evt.date}
                                onChange={(e) => updateEventLine(evt.id, { date: e.target.value })}
                              />
                              <input
                                type="color"
                                className="form-color-sm"
                                value={evt.color}
                                onChange={(e) => updateEventLine(evt.id, { color: e.target.value })}
                              />
                            </div>
                            <div className="form-row">
                              <select
                                className="form-input"
                                value={evt.style}
                                onChange={(e) => updateEventLine(evt.id, { style: e.target.value as EventLineStyle })}
                              >
                                <option value="dashed">Dashed</option>
                                <option value="solid">Solid</option>
                                <option value="dotted">Dotted</option>
                              </select>
                              <button className="btn-sm" onClick={() => setEditingEventId(null)}>Done</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span
                              className="event-line-color"
                              style={{ background: evt.color, borderStyle: evt.style === 'dotted' ? 'dotted' : evt.style === 'dashed' ? 'dashed' : 'solid' }}
                            />
                            <div className="event-line-info">
                              <span className="event-line-label">{evt.label}</span>
                              <span className="event-line-date">{evt.date}</span>
                            </div>
                            <div className="event-line-actions">
                              <button className="icon-btn" onClick={() => setEditingEventId(evt.id)} title="Edit">
                                <Pencil size={12} />
                              </button>
                              <button className="icon-btn danger" onClick={() => removeEventLine(evt.id)} title="Delete">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {(settings.eventLines || []).length === 0 && (
                      <p className="empty-message">No event lines yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ITEMS TAB ── */}
        {activeTab === 'items' && (
          <div className="tab-content">
            {/* Edit selected item (pinned at top when active) */}
            {selectedItem && (
              <div className="panel-section highlight">
                <div className="tab-content-header compact">
                  <Pencil size={14} />
                  <span>Edit Item</span>
                  <button
                    className="icon-btn deselect-btn"
                    onClick={() => setSelectedItem(null)}
                    title="Deselect"
                  >
                    &times;
                  </button>
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
                  {selectedItem.type !== 'milestone' && (
                    <label className="form-label">
                      Progress
                      <div className="progress-slider-row">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={selectedItem.progress ?? 0}
                          onChange={(e) => updateItem(selectedItem.id, { progress: parseInt(e.target.value) })}
                          className="progress-slider"
                        />
                        <span className="progress-value">{selectedItem.progress ?? 0}%</span>
                      </div>
                    </label>
                  )}
                  <div className="form-actions">
                    <button
                      className="btn-danger"
                      onClick={() => {
                        setConfirmAction({
                          message: `Delete "${selectedItem.label}"?`,
                          onConfirm: () => {
                            removeItem(selectedItem.id);
                            setSelectedItem(null);
                          },
                        });
                      }}
                    >
                      <Trash2 size={14} />
                      Delete Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Row sections */}
            {settings.rowLabels.map((rowLabel, rowIndex) => {
              const rowItems = items.filter((i) => i.row === rowIndex);
              const isExpanded = expandedRows.has(rowIndex);
              const isQuickAdding = quickAddRow === rowIndex;

              return (
                <div key={rowIndex} className="row-section">
                  <div className="row-section-header">
                    <button
                      className="row-section-toggle"
                      onClick={() => toggleRowExpanded(rowIndex)}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />}
                    </button>

                    {renamingRowIndex === rowIndex ? (
                      <input
                        type="text"
                        className="row-rename-input"
                        value={rowRenameValue}
                        onChange={(e) => setRowRenameValue(e.target.value)}
                        onBlur={() => commitRowRename(rowIndex)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRowRename(rowIndex);
                          if (e.key === 'Escape') setRenamingRowIndex(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="row-section-name"
                        onDoubleClick={() => startRenamingRow(rowIndex)}
                        title="Double-click to rename"
                      >
                        {rowLabel}
                      </span>
                    )}

                    <span className="row-section-count">{rowItems.length}</span>

                    <div className="row-section-actions">
                      <button
                        className="icon-btn row-action-btn"
                        onClick={() => {
                          setQuickAddRow(isQuickAdding ? null : rowIndex);
                          setQuickItem({ type: 'phase', label: '', startDate: '', endDate: '' });
                        }}
                        title="Add item to this row"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        className="icon-btn row-action-btn"
                        onClick={() => startRenamingRow(rowIndex)}
                        title="Rename row"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        className="icon-btn row-action-btn"
                        onClick={() => moveRow(rowIndex, 'up')}
                        disabled={rowIndex === 0}
                        title="Move up"
                      >
                        <ArrowUp size={10} />
                      </button>
                      <button
                        className="icon-btn row-action-btn"
                        onClick={() => moveRow(rowIndex, 'down')}
                        disabled={rowIndex === settings.rowLabels.length - 1}
                        title="Move down"
                      >
                        <ArrowDown size={10} />
                      </button>
                      <button
                        className="icon-btn row-action-btn danger"
                        onClick={() => {
                          setConfirmAction({
                            message: `Delete row "${rowLabel}" and its ${rowItems.length} items?`,
                            onConfirm: () => removeRow(rowIndex),
                          });
                        }}
                        disabled={settings.rowLabels.length <= 1}
                        title="Delete row"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Quick-add inline form */}
                  {isQuickAdding && (
                    <div className="row-quick-add">
                      <div className="form-row">
                        <select
                          className="form-input quick-add-type"
                          value={quickItem.type}
                          onChange={(e) => setQuickItem({ ...quickItem, type: e.target.value as ItemType })}
                        >
                          <option value="phase">Phase</option>
                          <option value="task">Task</option>
                          <option value="milestone">Milestone</option>
                        </select>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Item name..."
                          value={quickItem.label}
                          onChange={(e) => setQuickItem({ ...quickItem, label: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(rowIndex); }}
                          autoFocus
                        />
                      </div>
                      <div className="form-row">
                        <input
                          type="date"
                          className="form-input"
                          value={quickItem.startDate}
                          onChange={(e) => setQuickItem({ ...quickItem, startDate: e.target.value })}
                          placeholder="Start"
                        />
                        {quickItem.type !== 'milestone' && (
                          <input
                            type="date"
                            className="form-input"
                            value={quickItem.endDate}
                            onChange={(e) => setQuickItem({ ...quickItem, endDate: e.target.value })}
                            placeholder="End"
                          />
                        )}
                        <button
                          className="btn-primary btn-compact"
                          onClick={() => handleQuickAdd(rowIndex)}
                          disabled={!quickItem.label || !quickItem.startDate}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Row items */}
                  {isExpanded && (
                    <div className="row-section-items">
                      {rowItems.length === 0 && (
                        <p className="empty-message small">No items in this row yet.</p>
                      )}
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
                          {item.progress != null && item.progress > 0 && (
                            <span className="item-progress-badge">{item.progress}%</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add new row */}
            <div className="row-section add-row-section">
              <div className="row-add-inline">
                <input
                  type="text"
                  className="form-input"
                  value={newRowName}
                  onChange={(e) => setNewRowName(e.target.value)}
                  placeholder="Add new row..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRowName.trim()) {
                      addRow(newRowName.trim());
                      setNewRowName('');
                    }
                  }}
                />
                <button
                  className="icon-btn row-action-btn add"
                  onClick={() => {
                    if (newRowName.trim()) {
                      addRow(newRowName.trim());
                      setNewRowName('');
                    }
                  }}
                  title="Add row"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{confirmAction.message}</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn confirm"
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
