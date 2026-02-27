'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export default function DateSelector({ selectedDate, onDateChange, className = '' }: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate dates for horizontal scroll (7 days before and after today)
  const generateScrollDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const scrollDates = generateScrollDates();

  // Generate calendar dates
  const generateCalendarDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const calendarDates = generateCalendarDates();

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());
  const isSelected = (date: Date) => formatDate(date) === selectedDate;
  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth();

  const getDayName = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getMonthName = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  };

  // Auto-scroll to selected date on mount
  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = scrollDates.findIndex(date => formatDate(date) === selectedDate);
      if (selectedIndex !== -1) {
        const scrollLeft = selectedIndex * 80 - scrollRef.current.clientWidth / 2;
        scrollRef.current.scrollLeft = scrollLeft;
      }
    }
  }, [selectedDate]);

  return (
    <div className={`card-modern ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-neutral-600" />
          <span className="font-semibold text-neutral-900">Select Date</span>
        </div>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            showCalendar 
              ? 'bg-primary-50 text-primary-600 font-medium' 
              : 'text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Clock size={16} />
          Calendar
        </button>
      </div>

      {/* Horizontal Date Scroll */}
      <div className="p-5">
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {scrollDates.map((date, index) => (
            <button
              key={index}
              onClick={() => onDateChange(formatDate(date))}
              className={`flex-shrink-0 w-20 h-24 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                isSelected(date) 
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                  : isToday(date)
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <span className="text-xs font-semibold uppercase">
                {getDayName(date)}
              </span>
              <span className="text-2xl font-bold">
                {date.getDate()}
              </span>
              <span className="text-xs font-medium">
                {getMonthName(date)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className="border-t border-neutral-100 p-5">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-neutral-600" />
            </button>
            <h3 className="font-semibold text-neutral-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-neutral-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-xs font-semibold text-neutral-500">
                {day}
              </div>
            ))}
            {calendarDates.map((date, index) => (
              <button
                key={index}
                onClick={() => {
                  onDateChange(formatDate(date));
                  setShowCalendar(false);
                }}
                className={`h-10 flex items-center justify-center text-sm rounded-lg transition-colors font-medium ${
                  isSelected(date)
                    ? 'bg-primary-600 text-white shadow-sm'
                    : isToday(date)
                    ? 'bg-amber-100 text-amber-700'
                    : isCurrentMonth(date)
                    ? 'text-neutral-900 hover:bg-neutral-100'
                    : 'text-neutral-400 hover:bg-neutral-50'
                }`}
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}