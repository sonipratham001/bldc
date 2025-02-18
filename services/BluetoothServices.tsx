
import React, { createContext, useState, useEffect } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeCanData } from "./decodeCanData";

export const BluetoothContext = createContext<any>(null);

const bleManager = new BleManager();

const BluetoothService = ({ children }: any) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    scanForDevices();
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  const scanForDevices = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Bluetooth Scan Error:", error);
        return;
      }
      if (device?.name?.includes("ESP32_BT")) {
        setDevices((prevDevices) => {
          const exists = prevDevices.some((d) => d.id === device.id);
          return exists ? prevDevices : [...prevDevices, device];
        });
      }
    });

    setTimeout(() => bleManager.stopDeviceScan(), 10000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      console.log(`✅ Connected to ${device.name}`);

      readDataFromDevice(connected);
    } catch (error) {
      console.error("❌ Connection Error:", error);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      console.log("✅ Device disconnected.");
    }
  };

  const readDataFromDevice = async (device: Device) => {
    if (!device) return;
  
    try {
      const services = await device.services();
      let receivedData: { [key: string]: number[] } = {}; // ✅ Store all CAN IDs together
  
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            characteristic.monitor((error, characteristic) => {
              if (error) {
                console.error("Error reading data:", error);
                return;
              }
              if (characteristic?.value) {
                const rawData = Buffer.from(characteristic.value, "base64").toString("hex");
  
                // ✅ Extract CAN ID and data bytes
                const canId = `0x${rawData.substring(0, 8).toUpperCase()}`;
                const dataBytes = rawData
                  .substring(8)
                  .match(/.{1,2}/g)
                  ?.map((byte) => parseInt(byte, 16)) || [];
  
                receivedData[canId] = dataBytes; // ✅ Store both IDs in an object
              }
            });
          }
        }
      }
  
      // ✅ Decode ALL received CAN IDs in one function call
      const parsedData = decodeCanData(receivedData);
      
      setData((prevData) => ({
        ...prevData, // ✅ Keep previous data
        ...parsedData, // ✅ Merge new parsed data
      }));
    } catch (error) {
      console.error("Service Discovery Error:", error);
    }
  };
  
  

  return (
    <BluetoothContext.Provider value={{ devices, connectedDevice, data, scanForDevices, connectToDevice, disconnectDevice }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export default BluetoothService;