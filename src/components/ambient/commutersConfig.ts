/**
 * Commuter Fleet Configuration
 * Centralized mood-specific commuter metadata for OccasionalCommuter.tsx
 */

import { AirshipSVG } from './commuters/default/AirshipSVG';
import { HotAirBalloonSVG } from './commuters/default/HotAirBalloonSVG';
import { CoalPoweredAirshipSVG } from './commuters/default/CoalPoweredAirshipSVG';
import { ClockworkVesselSVG } from './commuters/default/ClockworkVesselSVG';
import { SilkSailedJunkSVG } from './commuters/default/SilkSailedJunkSVG';

import { DataStreamBeaconSVG } from './commuters/hacker/DataStreamBeaconSVG';
import { DataCubeSVG } from './commuters/hacker/DataCubeSVG';
import { FirewallShieldSVG } from './commuters/hacker/FirewallShieldSVG';
import { LoadingBarSVG } from './commuters/hacker/LoadingBarSVG';
import { GridCubeSVG } from './commuters/hacker/GridCubeSVG';

import { HolographicPadSVG } from './commuters/vaporwave/HolographicPadSVG';
import { GeometricPyramidSVG } from './commuters/vaporwave/GeometricPyramidSVG';
import { VHSCassetteSVG } from './commuters/vaporwave/VHSCassetteSVG';
import { SynthesizerKeyboardSVG } from './commuters/vaporwave/SynthesizerKeyboardSVG';
import { FloatingPalmTreeSVG } from './commuters/vaporwave/FloatingPalmTreeSVG';

import { IceCometSVG } from './commuters/europa/IceCometSVG';
import { CrystallineProbeSVG } from './commuters/europa/CrystallineProbeSVG';
import { GlacialRoverSVG } from './commuters/europa/GlacialRoverSVG';
import { AuroraWaveSVG } from './commuters/europa/AuroraWaveSVG';
import { FrozenAISatelliteSVG } from './commuters/europa/FrozenAISatelliteSVG';

import { SteamVentStackSVG } from './commuters/industrial/SteamVentStackSVG';
import { MiningDrillSVG } from './commuters/industrial/MiningDrillSVG';
import { RailThrusterSVG } from './commuters/industrial/RailThrusterSVG';
import { RoboticArmSVG } from './commuters/industrial/RoboticArmSVG';
import { GearAssemblySVG } from './commuters/industrial/GearAssemblySVG';
import { LaserForgeSVG } from './commuters/industrial/LaserForgeSVG';

import { BioluminescentFlowerSVG } from './commuters/nightshade/BioluminescentFlowerSVG';
import { PhantomMothSVG } from './commuters/nightshade/PhantomMothSVG';
import { GhostlyDragonflySVG } from './commuters/nightshade/GhostlyDragonflySVG';
import { SporerCloudSVG } from './commuters/nightshade/SporerCloudSVG';
import { GlowingVineSVG } from './commuters/nightshade/GlowingVineSVG';

/**
 * Commuter metadata
 */
export interface CommuterConfig {
  name: string;
  component: React.ComponentType;
  duration: number; // animation duration in seconds
  className: string; // CSS class for targeting animations
}

/**
 * Mood-indexed fleet of commuters
 * Format: mood → array of commuter configs
 */
export const COMMUTER_FLEET: Record<string, CommuterConfig[]> = {
  default: [
    { name: 'airship', component: AirshipSVG, duration: 32, className: 'commuter-airship' },
    { name: 'hotAirBalloon', component: HotAirBalloonSVG, duration: 38, className: 'commuter-hot-air-balloon' },
    { name: 'coalAirship', component: CoalPoweredAirshipSVG, duration: 35, className: 'commuter-coal-airship' },
    { name: 'clockwork', component: ClockworkVesselSVG, duration: 40, className: 'commuter-clockwork' },
    { name: 'silkJunk', component: SilkSailedJunkSVG, duration: 36, className: 'commuter-silk-junk' },
  ],

  hacker: [
    { name: 'dataBeacon', component: DataStreamBeaconSVG, duration: 28, className: 'commuter-data-beacon' },
    { name: 'dataCube', component: DataCubeSVG, duration: 32, className: 'commuter-data-cube' },
    { name: 'firewall', component: FirewallShieldSVG, duration: 30, className: 'commuter-firewall' },
    { name: 'loading', component: LoadingBarSVG, duration: 24, className: 'commuter-loading' },
    { name: 'gridCube', component: GridCubeSVG, duration: 34, className: 'commuter-grid-cube' },
  ],

  vaporwave: [
    { name: 'holoPad', component: HolographicPadSVG, duration: 31, className: 'commuter-holo-pad' },
    { name: 'pyramid', component: GeometricPyramidSVG, duration: 33, className: 'commuter-pyramid' },
    { name: 'vhs', component: VHSCassetteSVG, duration: 29, className: 'commuter-vhs' },
    { name: 'synth', component: SynthesizerKeyboardSVG, duration: 37, className: 'commuter-synth' },
    { name: 'palmTree', component: FloatingPalmTreeSVG, duration: 35, className: 'commuter-palm' },
  ],

  europa: [
    { name: 'comet', component: IceCometSVG, duration: 34, className: 'commuter-comet' },
    { name: 'probe', component: CrystallineProbeSVG, duration: 36, className: 'commuter-probe' },
    { name: 'rover', component: GlacialRoverSVG, duration: 42, className: 'commuter-glacial-rover' },
    { name: 'aurora', component: AuroraWaveSVG, duration: 38, className: 'commuter-aurora' },
    { name: 'satellite', component: FrozenAISatelliteSVG, duration: 40, className: 'commuter-satellite' },
  ],

  industrial: [
    { name: 'steamVent', component: SteamVentStackSVG, duration: 26, className: 'commuter-steam-vent' },
    { name: 'drill', component: MiningDrillSVG, duration: 28, className: 'commuter-drill' },
    { name: 'thruster', component: RailThrusterSVG, duration: 25, className: 'commuter-thruster' },
    { name: 'arm', component: RoboticArmSVG, duration: 32, className: 'commuter-arm' },
    { name: 'gear', component: GearAssemblySVG, duration: 30, className: 'commuter-gear' },
    { name: 'laser', component: LaserForgeSVG, duration: 27, className: 'commuter-laser' },
  ],

  nightshade: [
    { name: 'flower', component: BioluminescentFlowerSVG, duration: 36, className: 'commuter-flower' },
    { name: 'moth', component: PhantomMothSVG, duration: 33, className: 'commuter-moth' },
      { name: 'dragonfly', component: GhostlyDragonflySVG, duration: 34, className: 'commuter-dragonfly' },
    { name: 'spores', component: SporerCloudSVG, duration: 40, className: 'commuter-spores' },
    { name: 'vine', component: GlowingVineSVG, duration: 38, className: 'commuter-vine' },
  ],
};

/**
 * Utility: Get random commuter for a mood
 */
export const getRandomCommuter = (mood: string): CommuterConfig | null => {
  const fleet = COMMUTER_FLEET[mood];
  if (!fleet || fleet.length === 0) return null;
  return fleet[Math.floor(Math.random() * fleet.length)];
};
