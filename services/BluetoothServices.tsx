import React, { createContext, useState, useEffect } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BluetoothDataParser from "./BluetoothDataParser";  // Import the data parser

export const BluetoothContext = createContext<any>(null);

const bleManager = new BleManager();

const BluetoothService = ({ children }: any) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  
  // ✅ FIX: Explicitly define `errors` as `string[]`
  const [data, setData] = useState<{ rpm: number; voltage: number; current: number; errors: string[] }>({
    rpm: 0,
    voltage: 0,
    current: 0,
    errors: [], // Now explicitly defined as string[]
  });

  useEffect(() => {
    scanForDevices();
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  // Scanning for ESP32 BLE device
  const scanForDevices = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Bluetooth Scan Error:", error);
        return;
      }
      if (device?.name?.includes("ESP32")) {
        setDevices((prevDevices) => {
          const exists = prevDevices.some((d) => d.id === device.id);
          return exists ? prevDevices : [...prevDevices, device];
        });
      }
    });

    setTimeout(() => bleManager.stopDeviceScan(), 10000);
  };

  // Connecting to ESP32
  const connectToDevice = async (device: Device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      console.log(`✅ Connected to ${device.name}`);

      // Start reading data from ESP32
      readDataFromDevice(connected);
    } catch (error) {
      console.error("❌ Connection Error:", error);
    }
  };

  // Disconnect ESP32
  const disconnectDevice = async () => {
    try {
      if (connectedDevice) {
        await connectedDevice.cancelConnection();
        setConnectedDevice(null);
        console.log("✅ Device disconnected.");
      }
    } catch (error) {
      console.error("❌ Disconnect Error:", error);
    }
  };

  // Read Data from ESP32
  const readDataFromDevice = async (device: Device) => {
    if (!device) return;

    try {
      const services = await device.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            characteristic.monitor((error, characteristic) => {
              if (error) {
                console.error("❌ Error reading data:", error);
                return;
              }

              if (characteristic?.value) {
                // Convert Base64 to HEX
                const hexData = Buffer.from(characteristic.value, "base64").toString("hex");
                console.log("📩 Received HEX Data:", hexData);

                // Convert HEX to Bytes Array
                const rawData = hexData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
                
                if (rawData.length === 8) {
                  // Parse CAN Data
                  const parsedData = BluetoothDataParser.parseCANData(rawData);
                  console.log("📊 Parsed Data:", parsedData);

                  // Update state and AsyncStorage
                  setData(parsedData);
                  AsyncStorage.setItem("esp32Data", JSON.stringify(parsedData));
                } else {
                  console.warn("⚠️ Received unexpected data length:", rawData.length);
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("❌ Service Discovery Error:", error);
    }
  };

  return (
    <BluetoothContext.Provider
      value={{ devices, connectedDevice, data, scanForDevices, connectToDevice, disconnectDevice }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export default BluetoothService;