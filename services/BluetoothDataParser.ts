// services/BluetoothDataParser.ts
export default class BluetoothDataParser {
    /**
     * Convert HEX data to a readable format based on the CAN specification
     * @param rawData - An array of 8 bytes from ESP32
     */
    static parseCANData(rawData: number[]): { rpm: number; current: number; voltage: number; errors: string[] } {
      if (rawData.length !== 8) {
        console.error("Invalid CAN data length:", rawData);
        return { rpm: 0, current: 0, voltage: 0, errors: [] };
      }
  
      // Extracting values from bytes
      const rpm = (rawData[1] * 256 + rawData[0]); // RPM (MSB * 256 + LSB)
      const current = (rawData[3] * 256 + rawData[2]) / 10; // Current (MSB * 256 + LSB) / 10
      const voltage = (rawData[5] * 256 + rawData[4]) / 10; // Voltage (MSB * 256 + LSB) / 10
  
      // Extract Error Codes (LSB and MSB of error byte)
      const errorCodeLSB = rawData[6]; // Byte 7
      const errorCodeMSB = rawData[7]; // Byte 8
  
      // Decode error codes
      const errors = BluetoothDataParser.decodeErrorBits(errorCodeLSB, errorCodeMSB);
  
      return { rpm, current, voltage, errors };
    }
  
    /**
     * Decode error bits based on the provided mapping
     * @param lsb - Byte 7 (LSB of error code)
     * @param msb - Byte 8 (MSB of error code)
     */
    static decodeErrorBits(lsb: number, msb: number): string[] {
      const errorMessages: { [key: number]: string } = {
        0: "Identification Error",
        1: "Over Voltage",
        2: "Low Voltage",
        3: "Reserved",
        4: "Stall",
        5: "Internal Voltage Fault",
        6: "Over Temperature",
        7: "Throttle Error at Power-up",
        8: "Reserved",
        9: "Internal Reset",
        10: "Hall Throttle Open/Short",
        11: "Angle Sensor Error",
        12: "Reserved",
        13: "Reserved",
        14: "Motor Over-temperature",
        15: "Hall Galvanometer Sensor Error",
      };
  
      const detectedErrors: string[] = [];
  
      // Loop through each bit in LSB & MSB and extract the errors
      for (let i = 0; i < 8; i++) {
        if ((lsb & (1 << i)) !== 0) detectedErrors.push(`ERR${i}: ${errorMessages[i]}`);
        if ((msb & (1 << i)) !== 0) detectedErrors.push(`ERR${i + 8}: ${errorMessages[i + 8]}`);
      }
  
      return detectedErrors;
    }
  }