import * as alt from 'alt-server';

import { useApi } from '@Server/api/index.js';
import { startTracking } from './function.js';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();
function useOdometerAPI() {
    function startTrackingVehicle(vehicle: alt.Vehicle) {
        startTracking(vehicle);
    }

    return {
        startTrackingVehicle,
    };
}

declare global {
    export interface ServerPlugin {
        ['ouranos-odometer-api']: ReturnType<typeof useOdometerAPI>;
    }
}

useApi().register('ouranos-odometer-api', useOdometerAPI());
