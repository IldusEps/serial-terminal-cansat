// filters.ts

/**
 * Скользящее среднее (Moving Average)
 * @param data - массив данных
 * @param windowSize - размер окна (должен быть нечётным для симметрии)
 * @returns отфильтрованный массив
 */
export function movingAverage(data: number[], windowSize = 5): number[] {
    if (data.length < windowSize) return [...data];
    
    const result: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(data.length, i + halfWindow + 1);
        let sum = 0;
        
        for (let j = start; j < end; j++) {
            sum += data[j];
        }
        
        result.push(sum / (end - start));
    }
    
    return result;
}

/**
 * Экспоненциальное сглаживание (Exponential Smoothing)
 * @param data - массив данных
 * @param alpha - коэффициент сглаживания (0-1), чем меньше, тем сильнее сглаживание
 * @returns отфильтрованный массив
 */
export function exponentialSmoothing(data: number[], alpha = 0.3): number[] {
    if (data.length === 0) return [];
    
    const result: number[] = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
        result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    
    return result;
}

/**
 * Медианный фильтр (удаляет выбросы)
 * @param data - массив данных
 * @param windowSize - размер окна (должен быть нечётным)
 * @returns отфильтрованный массив
 */
export function medianFilter(data: number[], windowSize = 5): number[] {
    if (data.length < windowSize) return [...data];
    
    const result: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(data.length, i + halfWindow + 1);
        const window = data.slice(start, end);
        
        // Сортируем и берём медиану
        window.sort((a, b) => a - b);
        const median = window[Math.floor(window.length / 2)];
        result.push(median);
    }
    
    return result;
}

/**
 * Фильтр Савицкого-Голая (полиномиальное сглаживание)
 * @param data - массив данных
 * @param windowSize - размер окна (должен быть нечётным, минимум 3)
 * @param _order - порядок полинома (обычно 2 или 3) - параметр зарезервирован для будущего использования
 * @returns отфильтрованный массив
 */
export function savitzkyGolay(data: number[], windowSize = 5, _order = 2): number[] {
    if (data.length < windowSize || windowSize < 3) return [...data];
    
    // Убедимся, что windowSize нечётный
    const adjustedWindowSize = windowSize % 2 === 0 ? windowSize + 1 : windowSize;
    
    const halfWindow = Math.floor(adjustedWindowSize / 2);
    const result: number[] = [];
    
    // Простые коэффициенты для окна 5 и порядка 2
    // В реальном проекте лучше использовать более общий подход
    const coefficients: { [key: number]: number[] } = {
        5: [-0.0857, 0.3429, 0.4857, 0.3429, -0.0857],
        7: [-0.0952, 0.1429, 0.2857, 0.3333, 0.2857, 0.1429, -0.0952],
        9: [-0.0909, 0.0606, 0.1688, 0.2338, 0.2554, 0.2338, 0.1688, 0.0606, -0.0909]
    };
    
    const coeff = coefficients[adjustedWindowSize] || coefficients[5];
    
    for (let i = 0; i < data.length; i++) {
        if (i < halfWindow || i >= data.length - halfWindow) {
            // Края: используем простое копирование или скользящее среднее
            result.push(data[i]);
            continue;
        }
        
        let filtered = 0;
        for (let j = -halfWindow; j <= halfWindow; j++) {
            filtered += coeff[j + halfWindow] * data[i + j];
        }
        result.push(filtered);
    }
    
    return result;
}

/**
 * Комбинированный фильтр (медианный + экспоненциальное сглаживание)
 * @param data - массив данных
 * @param medianWindow - окно для медианного фильтра
 * @param alpha - коэффициент экспоненциального сглаживания
 * @returns отфильтрованный массив
 */
export function combinedFilter(data: number[], medianWindow = 3, alpha = 0.3): number[] {
    // Сначала удаляем выбросы медианным фильтром
    const medianFiltered = medianFilter(data, medianWindow);
    // Затем сглаживаем экспоненциально
    return exponentialSmoothing(medianFiltered, alpha);
}