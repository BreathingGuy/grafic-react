import styles from './Table.module.css';

// Skeleton loader для колонок дат при подгрузке
export default function SkeletonLoader({ columnCount = 7, employeesCount = 30 }) {
  return (
    <>
      {Array.from({ length: columnCount }).map((_, colIndex) => (
        <td key={`skeleton-col-${colIndex}`} className={styles.skeletonColumn}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonPulse} />
          </div>
          <div className={styles.skeletonCells}>
            {Array.from({ length: employeesCount }).map((_, rowIndex) => (
              <div key={`skeleton-cell-${rowIndex}`} className={styles.skeletonCell}>
                <div className={styles.skeletonPulse} />
              </div>
            ))}
          </div>
        </td>
      ))}
    </>
  );
}
