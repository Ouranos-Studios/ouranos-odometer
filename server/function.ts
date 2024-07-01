import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { OdometerConfig } from './config.js';

const Rebar = useRebar();

type MilageCallback = (milage: number) => void;

const milageCallbacks: Array<MilageCallback> = [];

const vehicleData = new Map();

async function createMilagePropertie(vehicle: alt.Vehicle) {
    try {
        const vehicleDocument = Rebar.document.vehicle.useVehicle(vehicle);

        await vehicleDocument.setBulk({
            milage: 0,
        });
        console.log(
            `Added milage properties for Vehicle Model: ${Rebar.utility.vehicleHashes.getNameFromHash(vehicle.model)} | Milage: ${vehicleDocument.getField('milage')}`,
        );
    } catch (error) {
        console.error('Error while setting milage Properties:', error);
    }
}

export async function startTracking(veh: alt.Vehicle) {
    const rebarDocument = Rebar.document.vehicle.useVehicle(veh).get();
    if (!veh || !rebarDocument) return;

    if (typeof rebarDocument.milage !== 'number') {
        await createMilagePropertie(veh);
    }

    const updatedRebarDocument = Rebar.document.vehicle.useVehicle(veh).get();

    vehicleData.set(veh.id, {
        position: veh.pos,
        milage: updatedRebarDocument.milage,
    });
}

async function updateMilage(vehicle: alt.Vehicle): Promise<void> {
    const rebarVehicle = Rebar.document.vehicle.useVehicle(vehicle).get();
    if (!rebarVehicle) {
        return;
    }

    const initialData = vehicleData.get(vehicle.id);
    if (!initialData) {
        return;
    }

    const { position: initialPos, milage: initialMilage } = initialData;
    const currentPos = vehicle.pos;

    const distance: number = Rebar.utility.vector.distance(currentPos, initialPos);

    const newMilage = initialMilage + distance;

    Rebar.document.vehicle.useVehicle(vehicle).set('milage', newMilage);

    vehicleData.set(vehicle.id, {
        position: currentPos,
        milage: newMilage,
    });
}

async function getVehicleMilage(veh: alt.Vehicle) {
    const rebarVehicle = Rebar.document.vehicle.useVehicle(veh).get();
    if (!rebarVehicle) return 0;

    return rebarVehicle.milage;
}

export function executeOnMilageUpdate(callback: MilageCallback) {
    milageCallbacks.push(callback);
}

export function init() {
    alt.on('playerEnteredVehicle', async (player: alt.Player) => {
        await updateVehicleMilage(player);
    });

    async function updateVehicleMilage(player: alt.Player) {
        const milage = await getVehicleMilage(player.vehicle); // milage in meters

        if (OdometerConfig.AscHUD) {
            const HudAPI = await Rebar.useApi().getAsync('ascended-hud-api');
            HudAPI.pushData(player, HudAPI.GetHUDEvents().WebView.PUSH_MILAGE, milage, true);
        }

        for (let cb of milageCallbacks) {
            cb(milage);
        }
    }

    alt.setInterval(async () => {
        const allVehicles = alt.Vehicle.all;

        for (const veh of allVehicles) {
            if (!veh.engineOn) {
                continue;
            }
            updateMilage(veh);
        }
    }, 200);

    alt.setInterval(async () => {
        const playersWithVehicles = alt.Player.all.filter((player) => player.vehicle);

        for (const player of playersWithVehicles) {
            if (!player.vehicle.engineOn) {
                return;
            }

            await updateVehicleMilage(player);
        }
    }, OdometerConfig.frontendUpdateFrequency);
}
