import React, { useState } from 'react';

interface CalendarProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  appointments?: { startTime: string; endTime: string }[];
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  appointments = [],
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const hasAppointment = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.some(appointment =>
      appointment.startTime.startsWith(dateStr)
    );
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    onDateSelect(selected);
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="btn-secondary"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-gray-800">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="btn-secondary"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10"></div>
          ))}

          {Array.from({ length: daysInMonth }, (_, day) => (
            <button
              key={day + 1}
              onClick={() => handleDateClick(new Date(currentYear, currentMonth, day + 1))}
              className={`h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                ${isDateSelected(new Date(currentYear, currentMonth, day + 1))
                  ? 'bg-primary-600 text-white'
                  : hasAppointment(new Date(currentYear, currentMonth, day + 1))
                  ? 'bg-red-100 text-red-600'
                  : 'hover:bg-gray-100 text-gray-700'
                }
                ${new Date(currentYear, currentMonth, day + 1) < new Date().setHours(0, 0, 0, 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
                }
              `}
              disabled={new Date(currentYear, currentMonth, day + 1) < new Date().setHours(0, 0, 0, 0)}
            >
              {day + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Выбор времени */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Выберите время</h4>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => onTimeSelect(time)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors
                ${selectedTime === time
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};