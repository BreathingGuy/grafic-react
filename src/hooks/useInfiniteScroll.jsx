import { useEffect, useRef, useCallback } from 'react';
import { useDateStore } from '../store/dateStore';

/**
 * Хук для infinite scroll с прогрессивной индикацией загрузки
 *
 * @param {Object} options - Настройки
 * @param {number} options.threshold - Расстояние от конца в пикселях, когда начинать показывать индикатор (по умолчанию 200px)
 * @param {number} options.triggerThreshold - Расстояние от конца в пикселях, когда триггерить загрузку (по умолчанию 50px)
 * @returns {Object} - Ref для контейнера и состояние
 */
export function useInfiniteScroll({
  threshold = 200,
  triggerThreshold = 50
} = {}) {
  const scrollContainerRef = useRef(null);
  const loadingTriggeredRef = useRef(false);

  // Получаем методы и состояние из dateStore
  const loadNext3Months = useDateStore(state => state.loadNext3Months);
  const setLoadingProgress = useDateStore(state => state.setLoadingProgress);
  const isLoadingMore = useDateStore(state => state.isLoadingMore);
  const canLoadMore = useDateStore(state => state.canLoadMore);
  const loadingProgress = useDateStore(state => state.loadingProgress);

  // Обработчик скролла
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !canLoadMore) return;

    // Вычисляем позицию скролла
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollRight = scrollWidth - (scrollLeft + clientWidth);

    // Если уже идет загрузка - не обрабатываем
    if (isLoadingMore) return;

    // Если достигли порога для показа индикатора
    if (scrollRight <= threshold) {
      // Вычисляем прогресс (от 0 до 100)
      // Когда scrollRight = threshold, progress = 0
      // Когда scrollRight = 0, progress = 100
      const progress = Math.min(100, ((threshold - scrollRight) / threshold) * 100);
      setLoadingProgress(progress);

      // Если достигли порога для триггера загрузки
      if (scrollRight <= triggerThreshold && !loadingTriggeredRef.current) {
        loadingTriggeredRef.current = true;
        loadNext3Months().then(() => {
          // После загрузки сбрасываем флаг
          loadingTriggeredRef.current = false;
        });
      }
    } else {
      // Сбрасываем прогресс если отскроллили назад
      setLoadingProgress(0);
      loadingTriggeredRef.current = false;
    }
  }, [
    canLoadMore,
    isLoadingMore,
    threshold,
    triggerThreshold,
    loadNext3Months,
    setLoadingProgress
  ]);

  // Подписываемся на скролл
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    scrollContainerRef,
    isLoadingMore,
    canLoadMore,
    loadingProgress
  };
}

export default useInfiniteScroll;
