import { PrismaClient, MelbourneSensor } from '@prisma/client';

const prisma = new PrismaClient();

export interface SensorUpsertData {
  kerbsideId: number;
  zoneNumber: number;
  lat: number;
  lon: number;
  status: string;
  lastUpdated: Date;
}

export const upsertSensor = async (data: SensorUpsertData): Promise<MelbourneSensor> => {
  const existing = await prisma.melbourneSensor.findUnique({
    where: { kerbsideId: data.kerbsideId },
  });

  let occupancySince: Date | null | undefined = undefined;

  if (existing) {
    if (data.status === 'Present' && existing.status === 'Unoccupied') {
      occupancySince = new Date();
    } else if (data.status === 'Unoccupied') {
      occupancySince = null;
    } else {
      occupancySince = existing.occupancySince;
    }
  } else {
    occupancySince = data.status === 'Present' ? new Date() : null;
  }

  return prisma.melbourneSensor.upsert({
    where: { kerbsideId: data.kerbsideId },
    create: {
      kerbsideId: data.kerbsideId,
      zoneNumber: data.zoneNumber,
      lat: data.lat,
      lon: data.lon,
      status: data.status,
      occupancySince,
      lastUpdated: data.lastUpdated,
    },
    update: {
      zoneNumber: data.zoneNumber,
      lat: data.lat,
      lon: data.lon,
      status: data.status,
      occupancySince,
      lastUpdated: data.lastUpdated,
    },
  });
};

export const findAllSensors = async (): Promise<MelbourneSensor[]> => {
  return prisma.melbourneSensor.findMany();
};

export const findSensorsByZone = async (zoneNumber: number): Promise<MelbourneSensor[]> => {
  return prisma.melbourneSensor.findMany({
    where: { zoneNumber },
  });
};
