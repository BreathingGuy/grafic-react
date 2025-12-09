import styles from './LoadingIndicator.module.css';

/**
 * Круговой индикатор прогресса загрузки
 * Показывается когда пользователь приближается к концу и заполняется при продолжении скролла
 *
 * @param {number} progress - Прогресс загрузки от 0 до 100
 * @param {boolean} isLoading - Идет ли загрузка данных
 */
export default function LoadingIndicator({ progress = 0, isLoading = false }) {
  // Не показываем если прогресс 0 и не загружается
  if (progress === 0 && !isLoading) {
    return null;
  }

  // Параметры круга
  const size = 60;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Вычисляем offset для прогресса (круг заполняется по часовой стрелке)
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.container}>
      <div className={styles.indicator}>
        <svg width={size} height={size} className={styles.svg}>
          {/* Фоновый круг */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={styles.backgroundCircle}
            strokeWidth={strokeWidth}
          />

          {/* Прогресс круг */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={isLoading ? styles.progressCircleLoading : styles.progressCircle}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>

        {/* Текст в центре */}
        {isLoading ? (
          <div className={styles.loadingText}>
            <span className={styles.spinner}>⟳</span>
          </div>
        ) : (
          <div className={styles.progressText}>
            {Math.round(progress)}%
          </div>
        )}
      </div>

      <div className={styles.hint}>
        {isLoading ? 'Загрузка...' : 'Продолжайте листать'}
      </div>
    </div>
  );
}
