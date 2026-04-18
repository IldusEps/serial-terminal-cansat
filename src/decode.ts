export function decodeTelemetry(data) {
    if (data.length < 32) {
        console.error("Пакет слишком короткий");
        return null;
    }

    // 1. Проверка маркера начала (0xAAAA)
    const marker = data[0] | (data[1] << 8);
    if (marker !== 0xAAAA) {
        console.error(`Неверный маркер: 0x${marker.toString(16)}`);
        return null;
    }

    // 2. Чтение полей (little-endian)
    const teamId    = data[2] | (data[3] << 8);
    const time      = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
    const temp      = data[8] | (data[9] << 8);   // int16
    const pressure  = data[10] | (data[11] << 8) | (data[12] << 16) | (data[13] << 24);
    const accX      = data[14] | (data[15] << 8); // int16
    const accY      = data[16] | (data[17] << 8);
    const accZ      = data[18] | (data[19] << 8);
    const gyroX     = data[20] | (data[21] << 8);
    const gyroY     = data[22] | (data[23] << 8);
    const gyroZ     = data[24] | (data[25] << 8);
    const checksum  = data[26];

    // 3. Проверка контрольной суммы (XOR байтов 0..25)
    let calcChecksum = 0;
    for (let i = 0; i < 26; i++) {
        calcChecksum ^= data[i];
    }
    if (calcChecksum !== checksum) {
        console.error(`Ошибка контрольной суммы: вычислено 0x${calcChecksum.toString(16)}, получено 0x${checksum.toString(16)}`);
        return null;
    }

    // 4. Извлечение пользовательских данных (байты 27 и далее)
    const userData = data.length > 27 ? data.slice(27) : new Uint8Array(0);

    // 5. Формирование результата
    return {
        startMarker: marker,
        teamId: teamId,
        time: time,                       // целые единицы (например, секунды)
        temperature: temp,                // целое, единицы по вашему выбору
        pressure: pressure,               // Паскали (целое)
        aX: accX,
        aY: accY,
        aZ: accZ,
        gX: gyroX,
        gY: gyroY,
        gZ: gyroZ,
        checksum: checksum,
        userData: userData                // дополнительные байты (выравнивание/пользовательские)
    };
}
