export function decodeTelemetry(data) {
    if (data.length < 64) {  // Проверяем полный размер структуры
        console.error(`Пакет слишком короткий: ${data.length} байт, ожидается 64`);
        return null;
    }

    // 1. Проверка маркера начала (0xAAAA)
    // В структуре start_marker uint16_t MSBF (старший байт первый)
    const marker = (data[0] << 8) | data[1];
    if (marker !== 0xAAAA) {
        console.error(`Неверный маркер: 0x${marker.toString(16)}`);
        return null;
    }

    // 2. Чтение полей с учётом endianness из спецификации
    // team_id: uint16_t MSBF (байты 2-3)
    const teamId = (data[2] << 8) | data[3];
    
    // time: uint32_t LSBF (байты 4-7) - младший байт первый
    const time = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
    
    // temperature: int16_t LSB (байты 8-9)
    let temp = data[8] | (data[9] << 8);
    // Преобразуем в знаковое int16
    if (temp & 0x8000) temp = temp - 65536;
    
    // pressure: uint32_t LSB (байты 10-13)
    const pressure = data[10] | (data[11] << 8) | (data[12] << 16) | (data[13] << 24);
    
    // Акселерометр: int16_t LSB
    let accX = data[14] | (data[15] << 8);
    let accY = data[16] | (data[17] << 8);
    let accZ = data[18] | (data[19] << 8);
    if (accX & 0x8000) accX = accX - 65536;
    if (accY & 0x8000) accY = accY - 65536;
    if (accZ & 0x8000) accZ = accZ - 65536;
    
    // Гироскоп: int16_t LSB
    let gyroX = data[20] | (data[21] << 8);
    let gyroY = data[22] | (data[23] << 8);
    let gyroZ = data[24] | (data[25] << 8);
    if (gyroX & 0x8000) gyroX = gyroX - 65536;
    if (gyroY & 0x8000) gyroY = gyroY - 65536;
    if (gyroZ & 0x8000) gyroZ = gyroZ - 65536;
    
    const checksum = data[26];

    // 3. Проверка контрольной суммы (XOR байтов 0..25)
    let calcChecksum = 0;
    for (let i = 0; i < 26; i++) {
        calcChecksum ^= data[i];
    }
    if (calcChecksum !== checksum) {
        console.error(`Ошибка контрольной суммы: вычислено 0x${calcChecksum.toString(16)}, получено 0x${checksum.toString(16)}`);
        return null;
    }

    // 4. Чтение GPS координат (байты 27-34)
    // latitude: float32 LSBF (байты 27-30)
    const latitude = new Float32Array(data.slice(27, 31).buffer)[0];
    // longitude: float32 LSBF (байты 31-34)
    const longitude = new Float32Array(data.slice(31, 35).buffer)[0];
    
    // 5. Padding (байты 35-63) - проверяем что нули или просто пропускаем
    const padding = data.slice(35, 64);
    
    // 6. Формирование результата
    return {
        // Основные поля
        startMarker: marker,
        teamId: teamId,
        time: time,                       // время в миллисекундах
        temperature: temp,                // температура (целое, нужен коэффициент)
        pressure: pressure,               // давление в Паскалях
        aX: accX,
        aY: accY,
        aZ: accZ,
        gX: gyroX,
        gY: gyroY,
        gZ: gyroZ,
        checksum: checksum,
        
        // GPS данные
        gps: {
            latitude: latitude,    // широта в градусах
            longitude: longitude   // долгота в градусах
        },
        
        // Дополнительная информация
        padding: padding,
        
        // Для удобства - физические величины (настройте коэффициенты под ваши датчики)
        temperatureC: temp / 100.0,           // если температура в сотых долях градуса
        pressureHPa: pressure / 100.0,        // гектопаскали (мбар)
        acceleration: {
            x: accX / 1000.0,    // если акселерометр в тысячных долях g
            y: accY / 1000.0,
            z: accZ / 1000.0
        },
        gyroscope: {
            x: gyroX / 10.0,     // если гироскоп в десятых долях град/сек
            y: gyroY / 10.0,
            z: gyroZ / 10.0
        },
        
        // Поля для обратной совместимости со старым кодом
        userData: padding          // для совместимости, хотя теперь это padding
    };
}