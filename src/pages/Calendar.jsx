import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { getEventsApi, createEventApi, deleteEventApi } from '../api/events.api.js';

const IMPACT_COLORS = { high:'#FF3B6B', medium:'#F3BA2F', low:'#00FF9D' };
const TYPE_COLORS = { macro:'#627EEA', crypto:'#F7931A', event:'#9945FF' };
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CalendarPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ date: '', title: '', impact: 'medium', type: 'crypto', description: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await getEventsApi();
      setEvents(data?.data?.events || []);
    } catch {
      error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month filler
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, current: false, dateStr: null });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, current: true, dateStr });
    }
    // Next month filler
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, dateStr: null });
    }
    return days;
  }, [year, month]);

  const getEventsForDate = (dateStr) => events.filter(e => e.date === dateStr);
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nowStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [...events]
      .filter(e => e.date >= nowStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [events]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!form.date || !form.title || !form.description) return;
    setSubmitting(true);
    try {
      const { data } = await createEventApi(form);
      const created = data?.data?.event;
      if (created) setEvents(prev => [...prev, created]);
      success('Event created.');
      setIsModalOpen(false);
      setForm({ date: '', title: '', impact: 'medium', type: 'crypto', description: '' });
    } catch {
      error('Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEventApi(deleteId);
      setEvents(prev => prev.filter(e => e.id !== deleteId));
      success('Event deleted.');
    } catch {
      error('Failed to delete event.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Economic Calendar</h1>
          <p className="text-sm text-text-secondary">Upcoming crypto events and announcements</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Add Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
        {/* Calendar Grid */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] text-text-secondary hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-white">{monthName} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-md hover:bg-[rgba(255,255,255,0.04)] text-text-secondary hover:text-white transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] text-text-secondary font-semibold py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              const evs = cell.dateStr ? getEventsForDate(cell.dateStr) : [];
              const isSelected = cell.dateStr === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => cell.dateStr && setSelectedDate(cell.dateStr === selectedDate ? null : cell.dateStr)}
                  className={`relative min-h-[70px] p-2 rounded-lg text-left text-xs transition-all ${
                    !cell.current ? 'text-text-secondary/30' :
                    isSelected ? 'bg-[rgba(0,212,255,0.12)] border border-[var(--accent-cyan)] text-white' :
                    'text-white hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                  }`}
                  disabled={!cell.current}
                >
                  <span className="font-semibold">{cell.day}</span>
                  {evs.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {evs.map((ev, j) => (
                        <div key={j} className="w-2 h-2 rounded-full" style={{ backgroundColor: IMPACT_COLORS[ev.impact] }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-4 border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Events on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric'})}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-text-secondary">No events on this date.</p>
              ) : (
                selectedEvents.map((ev, i) => (
                  <div key={i} className="rounded-lg bg-[var(--bg-elevated)] p-3 space-y-2 relative group">
                    <div className="flex items-center gap-2 flex-wrap pr-8">
                      <span className="text-sm font-semibold text-white">{ev.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: IMPACT_COLORS[ev.impact] + '25', color: IMPACT_COLORS[ev.impact] }}>
                        {ev.impact.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: TYPE_COLORS[ev.type] + '25', color: TYPE_COLORS[ev.type] }}>
                        {ev.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{ev.description}</p>
                    
                    {user?.role === 'ADMIN' && (
                      <button 
                        onClick={() => setDeleteId(ev.id)}
                        className="absolute top-3 right-3 p-1.5 text-text-secondary hover:bg-[rgba(255,59,107,0.1)] hover:text-[#FF3B6B] rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Upcoming Sidebar */}
        <div className="glass-card h-fit">
          <h2 className="text-sm font-semibold text-white mb-3">Upcoming Events</h2>
          <div className="space-y-3">
            {upcomingEvents.length === 0 && <p className="text-xs text-text-secondary">No upcoming events.</p>}
            {upcomingEvents.map((ev, i) => (
              <div key={i} className="flex gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)] last:border-0 last:pb-0">
                <div className="text-center shrink-0">
                  <div className="text-[10px] text-text-secondary">
                    {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month:'short' })}
                  </div>
                  <div className="text-lg font-semibold text-white leading-tight">
                    {new Date(ev.date + 'T00:00:00').getDate()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{ev.title}</div>
                  <div className="flex gap-1 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: IMPACT_COLORS[ev.impact] + '25', color: IMPACT_COLORS[ev.impact] }}>
                      {ev.impact}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: TYPE_COLORS[ev.type] + '25', color: TYPE_COLORS[ev.type] }}>
                      {ev.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Calendar Event">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
            <input 
              type="date" 
              required
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg p-2.5 text-white placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g., FOMC Meeting"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg p-2.5 text-white placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Impact</label>
              <select 
                value={form.impact}
                onChange={e => setForm({...form, impact: e.target.value})}
                className="w-full bg-[#1A1C23] border border-[rgba(255,255,255,0.08)] rounded-lg p-2.5 text-white focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Type</label>
              <select 
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full bg-[#1A1C23] border border-[rgba(255,255,255,0.08)] rounded-lg p-2.5 text-white focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
              >
                <option value="crypto">Crypto</option>
                <option value="macro">Macro</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
            <textarea 
              required
              rows={3}
              placeholder="Detailed description of the event..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg p-2.5 text-white placeholder-text-secondary/50 focus:outline-none focus:border-[var(--accent-cyan)] transition-colors resize-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-semibold rounded-lg p-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
        danger
      />
    </div>
  );
};

export default CalendarPage;
