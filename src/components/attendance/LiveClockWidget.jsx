import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Coffee,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { StartBreakModal } from './StartBreakModal';
import { ClockOutModal } from './ClockOutModal';

export const LiveClockWidget = ({
  todayData,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  isLoading,
}) => {
  const [istTime, setIstTime] = useState('');
  const [istDate, setIstDate] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [locationNotes, setLocationNotes] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const currentStatus = todayData?.currentStatus || 'OFFLINE';
  const activeSession = todayData?.activeSession;
  const attendance = todayData?.attendance;

  // Real-time IST Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);

      setIstTime(timeStr);
      setIstDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Elapsed Work Timer
  useEffect(() => {
    if (!activeSession || currentStatus === 'OFFLINE' || currentStatus === 'COMPLETED') {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeSession.checkInTime).getTime();

    const updateElapsed = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeSession, currentStatus]);

  const formatElapsed = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClockInSubmit = () => {
    onCheckIn({ locationNotes });
    setIsLocationOpen(false);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Live IST Telemetry */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <MapPin className="w-3.5 h-3.5" />
                <span>Indore Site HQ • Asia/Kolkata</span>
              </span>

              {/* Status Indicator Pill */}
              {currentStatus === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>On Duty / Active Session</span>
                </span>
              )}

              {currentStatus === 'ON_BREAK' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>On Break Pause</span>
                </span>
              )}

              {(currentStatus === 'OFFLINE' || currentStatus === 'COMPLETED') && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Shift Concluded / Not Clocked In</span>
                </span>
              )}
            </div>

            {/* Big Digital Clock */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-yellow-100 tracking-tight font-mono">
                {istTime || '--:--:--'}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-semibold">{istDate}</span>
            </div>

            {/* Shift Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-400" />
                <span>
                  First In:{' '}
                  <strong className="text-white">
                    {attendance?.firstCheckIn
                      ? new Date(attendance.firstCheckIn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'None'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-blue-400" />
                <span>
                  Breaks Taken:{' '}
                  <strong className="text-white">{attendance?.totalBreakMinutes || 0}m</strong>
                </span>
              </div>

              {activeSession && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Session Duration:{' '}
                    <strong className="text-emerald-400 font-mono font-bold">
                      {formatElapsed(elapsedSeconds)}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Punch Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Clock-in Button (When Offline) */}
            {(currentStatus === 'OFFLINE' || currentStatus === 'COMPLETED') && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className="px-3.5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{locationNotes ? 'Site Note Added' : 'Add Site Note'}</span>
                </button>

                <button
                  onClick={handleClockInSubmit}
                  disabled={isLoading}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>CLOCK IN / START SHIFT</span>
                </button>
              </div>
            )}

            {/* Active Session Actions */}
            {currentStatus === 'ACTIVE' && (
              <>
                <button
                  onClick={() => setIsBreakModalOpen(true)}
                  disabled={isLoading}
                  className="px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Take a Break</span>
                </button>

                <button
                  onClick={() => setIsClockOutModalOpen(true)}
                  disabled={isLoading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {/* On Break Actions */}
            {currentStatus === 'ON_BREAK' && (
              <>
                <button
                  onClick={() => onEndBreak({})}
                  disabled={isLoading}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>RESUME WORK (END BREAK)</span>
                </button>

                <button
                  onClick={() => setIsClockOutModalOpen(true)}
                  disabled={isLoading}
                  className="px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>End Day Early</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Optional Location Notes Popover */}
        {isLocationOpen && (currentStatus === 'OFFLINE' || currentStatus === 'COMPLETED') && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              placeholder="e.g. Concrete slab casting at Super Corridor site, Indore"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={() => setIsLocationOpen(false)}
              className="text-xs text-amber-400 hover:text-amber-300 shrink-0 font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Break & ClockOut Modals */}
      <StartBreakModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        onStartBreak={onStartBreak}
      />

      <ClockOutModal
        isOpen={isClockOutModalOpen}
        onClose={() => setIsClockOutModalOpen(false)}
        onClockOut={onCheckOut}
        session={activeSession}
      />
    </>
  );
};
