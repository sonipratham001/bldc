import React, { createContext, useState, useEffect } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";

// Create Bluetooth Context
export const BluetoothContext = createContext<any>(null);

const manager = new BleManager();

// Error Code Mapping (from the protocol document)
const ERROR_CODES: { [key: number]: string } = {
  0: "Identification error: Failed to identify motor angle.",
  1: "Over voltage: Battery voltage too high.",
  2: "Low voltage: Battery voltage too low.",
  3: "Reserved (No error).",
  4: "Stall: No speed feedback from motor.",
  5: "Internal voltage fault: Possible wiring or controller issue.",
  6: "Over temperature: Controller exceeded 100°C.",
  7: "Throttle error: Unexpected throttle signal at power-up.",
  8: "Reserved (No error).",
  9: "Internal reset: Temporary fault or power fluctuation.",
  10: "Hall throttle error: Open or short circuit detected.",
  11: "Angle sensor error: Speed sensor misconfiguration.",
  12: "Reserved (No error).",
  13: "Reserved (No error).",
  14: "Motor over-temperature: Motor temperature exceeded limit.",
  15: "Hall Galvanometer sensor error: Internal controller fault.",
};

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [data, setData] = useState<{
    speed?: number;
    current?: number;
    voltage?: number;
    controllerTemp?: number;
    motorTemp?: number;
    throttle?: number;
    errorCode?: number;
    errorMessages?: string[];
  }>({});

  const connectToDevice = async (device: Device) => {
    try {
      await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);

      // Fetch and log all services & characteristics
      const services = await device.services();
      for (const service of services) {
        console.log(`🔹 Service UUID: ${service.uuid}`);

        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          console.log(`   ├── Characteristic UUID: ${characteristic.uuid}`);
          console.log(`   ├── Is Notifiable: ${characteristic.isNotifiable}`);
          console.log(`   ├── Is Readable: ${characteristic.isReadable}`);
          console.log(`   ├── Is Writable: ${characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse}`);
        }
      }

      // ✅ Start Monitoring for Data (Replace with Correct UUIDs)
      const serviceUUID = "YOUR_SERVICE_UUID"; // Replace this
      const characteristicUUID = "YOUR_CHARACTERISTIC_UUID"; // Replace this

      device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
        if (error) {
          console.error("Bluetooth Read Error:", error);
          return;
        }
        if (characteristic?.value) {
          const decodedData = parseBluetoothData(characteristic.value);
          setData(decodedData);
        }
      });

    } catch (error) {
      console.error("Connection Error:", error);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setData({});
    }
  };

  // ✅ Function to Decode CAN Bus Messages from ESP32
  const parseBluetoothData = (rawData: string) => {
    const buffer = Buffer.from(rawData, "base64"); // Convert Base64 to Buffer
    if (buffer.length < 8) return {}; // Ignore incomplete messages

    const messageID = buffer.readUInt32BE(0); // Extract message ID
    const payload = buffer.slice(4); // Extract payload data

    let parsedData: any = {};

    if (messageID === 0xCF11E05) {
      // Message 1: Speed, Current, Voltage, Error Codes
      const errorCode = (payload.readUInt8(7) * 256) + payload.readUInt8(6); // Combine 2 bytes to get 16-bit error code
      parsedData = {
        speed: (payload.readUInt8(1) * 256) + payload.readUInt8(0), // RPM
        current: ((payload.readUInt8(3) * 256) + payload.readUInt8(2)) / 10, // A
        voltage: ((payload.readUInt8(5) * 256) + payload.readUInt8(4)) / 10, // V
        errorCode,
        errorMessages: decodeErrors(errorCode), // Convert error code to human-readable messages
      };
    } else if (messageID === 0xCF11F05) {
      // Message 2: Throttle, Temperatures
      parsedData = {
        throttle: payload.readUInt8(0) * (5 / 255), // Convert 0-255 to 0-5V
        controllerTemp: payload.readUInt8(1) - 40, // °C
        motorTemp: payload.readUInt8(2) - 30, // °C
      };
    }

    return parsedData;
  };

  // ✅ Decode Error Bits to Human-Readable Messages
  const decodeErrors = (errorCode: number): string[] => {
    let errors: string[] = [];

    for (let i = 0; i < 16; i++) {
      if ((errorCode >> i) & 1) {
        errors.push(ERROR_CODES[i]); // Add active error
      }
    }

    return errors.length > 0 ? errors : ["No Errors Detected"];
  };

  return (
    <BluetoothContext.Provider value={{ connectedDevice, connectToDevice, disconnectDevice, data }}>
      {children}
    </BluetoothContext.Provider>
  );
};
