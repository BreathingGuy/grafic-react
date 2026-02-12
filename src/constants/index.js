export const MONTHS = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];

// Предопределённые варианты codeList с описанием и часами
export const CODELIST_OPTIONS = [
  { codeList: 'В',  label: 'Выходной',             hours: 0,  descriptin: 'Выходной' },
  { codeList: 'Д',  label: 'Дневная смена',        hours: 8,  descriptin: '08:00–16:30' },
  { codeList: 'ДК', label: 'День короткий',        hours: 7,  descriptin: '08:00–15:30' },
  { codeList: 'ДП', label: 'День (поздний)',        hours: 8,  descriptin: '10:00–18:30' },
  { codeList: 'К',  label: 'Командировка',          hours: 8,  descriptin: 'Командировка' },
  { codeList: 'Н1', label: 'Ночная смена первая',  hours: 8,  descriptin: '16:00–00:00' },
  { codeList: 'Н2', label: 'Ночная смена вторая',  hours: 8,  descriptin: '00:00–08:00' },
  { codeList: 'О',  label: 'Отпуск',               hours: 8,  descriptin: 'Отпуск' },
  { codeList: 'ОВ', label: 'Отпуск в выходной',    hours: 0,  descriptin: 'Отпуск в выходной' },
  { codeList: 'У',  label: 'Учёба',                hours: 8,  descriptin: 'Учёба' },
  { codeList: 'Э',  label: 'Эксперт',              hours: 8,  descriptin: '09:00–17:30' },
  { codeList: 'ЭК', label: 'Эксперт короткий',    hours: 7,  descriptin: '09:00–16:45' },
  { codeList: 'ЭУ', label: 'Эксперт утро',         hours: 8,  descriptin: '08:00–16:00' },
];
