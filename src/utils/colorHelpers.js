/**
 * Утилиты для работы с цветами
 */

/**
 * Вычисляет относительную яркость цвета (luminance)
 * @param {string} color - цвет в формате hex (#rrggbb)
 * @returns {number} - яркость от 0 (черный) до 1 (белый)
 */
export function getLuminance(color) {
  // Удаляем # если есть
  const hex = color.replace('#', '');

  // Парсим RGB компоненты
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Применяем формулу относительной яркости (WCAG)
  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Вычисляет контрастный цвет текста для заданного фона
 * @param {string} backgroundColor - цвет фона в формате hex
 * @returns {string} - '#000000' или '#ffffff'
 */
export function getContrastColor(backgroundColor) {
  if (!backgroundColor) return '#000000';

  const luminance = getLuminance(backgroundColor);

  // Порог яркости для выбора черного или белого текста
  // Если фон светлый (> 0.5) - черный текст, иначе - белый
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Проверяет, является ли цвет светлым
 * @param {string} color - цвет в формате hex
 * @returns {boolean}
 */
export function isLightColor(color) {
  return getLuminance(color) > 0.5;
}

/**
 * Проверяет достаточный ли контраст между двумя цветами (WCAG AA)
 * @param {string} color1 - первый цвет (hex)
 * @param {string} color2 - второй цвет (hex)
 * @returns {boolean} - true если контраст >= 4.5:1
 */
export function hasGoodContrast(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const contrast = (lighter + 0.05) / (darker + 0.05);

  // WCAG AA требует минимум 4.5:1 для нормального текста
  return contrast >= 4.5;
}
