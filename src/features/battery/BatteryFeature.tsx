import React from "react";
import { BatteryCharging, Battery, Zap, ShieldCheck, Activity } from "lucide-react";
import { BatteryState } from "../../types/island";

interface Props {
  battery: BatteryState;
}

export const BatteryFeature: React.FC<Props> = ({ battery }) => {
  return (
    <div className="feature-pane battery-view-v2">
      {/* Primary Battery State Left Column */}
      <div className="battery-main-col">
        <div className="battery-number-row">
          <span className="battery-pct-large">{battery.percentage}%</span>
          {battery.isCharging ? (
            <span className="battery-pill-tag charging">
              <Zap size={11} fill="currentColor" /> Fast Charging
            </span>
          ) : (
            <span className="battery-pill-tag discharging">
              <Activity size={11} /> On Battery
            </span>
          )}
        </div>


        {/* Battery visual progress bar */}
        <div className="battery-bar-track">
          <div
            className={`battery-bar-fill ${battery.percentage <= 20 ? "low" : ""}`}
            style={{ width: `${Math.min(100, Math.max(5, battery.percentage))}%` }}
          />
        </div>

        <div className="battery-sub-text">
          {battery.timeRemainingMinutes
            ? `Estimated ${Math.floor(battery.timeRemainingMinutes / 60)}h ${battery.timeRemainingMinutes % 60}m remaining until empty`
            : "Optimized Power Charging active"}
        </div>
      </div>

      {/* Battery Diagnostics Right Column */}
      <div className="battery-side-col">
        <div className="battery-icon-display" title="Battery Status">
          {battery.isCharging ? (
            <BatteryCharging size={28} className="battery-icon-charging" />
          ) : (
            <Battery size={28} />
          )}
        </div>

        <div className="battery-health-chip" title="Battery Condition & Cycles">
          <ShieldCheck size={11} /> Health: {battery.health}
        </div>
      </div>
    </div>
  );
};

