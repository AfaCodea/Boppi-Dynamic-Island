import React from "react";
import { BatteryCharging, Battery, Zap, ShieldCheck, Activity } from "lucide-react";
import { BatteryState } from "../types/island";
import { IslandProgressBar } from "./IslandProgressBar";

export interface IslandBatteryIndicatorProps {
  /** Battery telemetry state */
  battery: BatteryState;
}

/**
 * IslandBatteryIndicator: System power diagnostics with charging telemetry
 * and battery condition indicator.
 */
export const IslandBatteryIndicator: React.FC<IslandBatteryIndicatorProps> = ({ battery }) => {
  const isLow = battery.percentage <= 20;

  return (
    <div className="feature-pane island-battery-pane" role="region" aria-label="Battery Status">
      {/* Primary Battery State Left Column */}
      <div className="battery-main-col">
        <div className="battery-number-row">
          <span className="battery-pct-large">{battery.percentage}%</span>
          {battery.isCharging ? (
            <span className="battery-pill-tag charging">
              <Zap size={11} fill="currentColor" aria-hidden="true" />
              <span>Fast Charging</span>
            </span>
          ) : (
            <span className="battery-pill-tag discharging">
              <Activity size={11} aria-hidden="true" />
              <span>On Battery</span>
            </span>
          )}
        </div>

        {/* Battery visual progress bar */}
        <IslandProgressBar
          value={battery.percentage}
          variant={isLow ? "red" : "green"}
          height={4}
          label="Current Battery Charge"
        />

        <div className="battery-sub-text">
          {battery.timeRemainingMinutes
            ? `Estimated ${Math.floor(battery.timeRemainingMinutes / 60)}h ${battery.timeRemainingMinutes % 60}m remaining`
            : "Optimized Power Charging active"}
        </div>
      </div>

      {/* Battery Diagnostics Right Column */}
      <div className="battery-side-col">
        <div className="battery-icon-display" title="Battery State">
          {battery.isCharging ? (
            <BatteryCharging size={28} className="battery-icon-charging" aria-hidden="true" />
          ) : (
            <Battery size={28} aria-hidden="true" />
          )}
        </div>

        <div className="battery-health-chip" title="Battery Condition">
          <ShieldCheck size={11} aria-hidden="true" />
          <span>Health: {battery.health}</span>
        </div>
      </div>
    </div>
  );
};
