import React, { useState } from 'react';

interface CalendarProps {
  selectedDate?: Date | null;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  appointments?: { startTime: string; endTime: string }[];
  showTimeSlots?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  appointments = [],
  showTimeSlots = true,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() &&
           currentMonth === selectedDate.getMonth() &&
           currentYear === selectedDate.getFullYear();
  };

  const hasAppointment = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.some(a => a.startTime.startsWith(dateStr));
  };

  const isPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const handleDateClick = (day: number) => {
    if (isPast(day)) return;
    onDateSelect(new Date(currentYear, currentMonth, day));
  };

  const changeMonth = (direction: number) => {
    const newMonth = currentMonth + direction;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  // Monday-first: shift Sunday (0) to end
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => changeMonth(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const past = isPast(day);
            const selected = isDateSelected(day);
            const todayDay = isToday(day);
            const hasAppt = hasAppointment(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={past}
                className={`h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150 relative
                  ${selected
                    ? 'bg-primary-600 text-white shadow-sm'
                    : past
                    ? 'text-gray-300 cursor-not-allowed'
                    : todayDay
                    ? 'bg-primary-50 text-primary-700 font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {day}
                {hasAppt && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showTimeSlots && (
        <div className="card">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Выберите время</h4>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => onTimeSelect(time)}
                className={`py-2 px-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${selectedTime === time
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }
                `}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
