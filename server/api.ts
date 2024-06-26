import * as alt from 'alt-server';

import { startTracking, executeOnMilageUpdate } from './function.js';
import { useRebar } from '@Server/index.js';

type MilageCallback = (milage: number) => void;

const Rebar = useRebar();

function useOdometerAPI() {
    function startTrackingVehicle(vehicle: alt.Vehicle) {
        startTracking(vehicle);
    }

    function onMilageUpdate(callback: MilageCallback) {
        executeOnMilageUpdate(callback);
    }

    return {
        startTrackingVehicle,
        onMilageUpdate,
    };
}

declare global {
    export interface ServerPlugin {
        ['ouranos-odometer-api']: ReturnType<typeof useOdometerAPI>;
    }
}

Rebar.useApi().register('ouranos-odometer-api', useOdometerAPI());
