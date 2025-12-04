import { MONTHS as months} from '../constants/index';

export const getDateRange = (period, currentStartDate = new Date()) => {
    let startDate = new Date();
    let endDate = new Date();

    if (period === '3months') {
        const quarter = Math.floor(currentStartDate.getMonth() / 3);
        startDate = new Date(currentStartDate.getFullYear(), quarter * 3, 1);
        endDate = new Date(currentStartDate.getFullYear(), quarter * 3 + 3, 0);
    } else if (period === '1month') {
        startDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), 1);
        endDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0);
    } else if (period === '7days') {
        const dayOfWeek = currentStartDate.getDay(); // 0=воскресенье, 1=понедельник, ..., 6=суббота
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(currentStartDate);
        startDate.setDate(currentStartDate.getDate() + mondayOffset);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
    } else if (period === '1year') {
        startDate = new Date(currentStartDate.getFullYear(), 0, 1);
        endDate = new Date(currentStartDate.getFullYear(), 12, 0);
    }

    // Генерируем даты
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(currentDate.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }).split('.')[2] + '-' +
                  (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
                  currentDate.getDate().toString().padStart(2, '0'));
        currentDate.setDate(currentDate.getDate() + 1);
    }    

    // Группировка по месяцам для colspan
    let monthGroups = [];
    let currentMonth = null;
    let colspan = 0;
    dates.forEach(dateStr => {
        const d = new Date(dateStr);
        const monthIndex = d.getMonth();
        if (monthIndex !== currentMonth) {
            if (colspan > 0) {
                monthGroups.push({ month: months[currentMonth], colspan });
            }
            currentMonth = monthIndex;
            colspan = 1;
        } else {
            colspan++;
        }
    });    
    if (colspan > 0) {
        monthGroups.push({ month: months[currentMonth], colspan });
    }

    return [dates, monthGroups];
}