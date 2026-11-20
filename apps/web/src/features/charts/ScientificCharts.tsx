import { CaloCellRecord, ParticleRecord, TrackerHitRecord } from "@/types";
import ReactECharts from "echarts-for-react";
import React, { useMemo } from "react";

interface ScientificChartsProps {
  particle: ParticleRecord;
  trackerHits: TrackerHitRecord[];
  caloCells: CaloCellRecord[];
  onSelectHit?: (hitIndex: number) => void;
  onSelectCell?: (cellIndex: number) => void;
}

export const ScientificCharts: React.FC<ScientificChartsProps> = ({
  particle,
  trackerHits,
  caloCells,
}) => {
  const [activeChart, setActiveChart] = React.useState<
    "momentum" | "coordinates" | "calorimeter" | "timing"
  >("momentum");

  // Filter hits for this particle
  const particleHits = useMemo(() => {
    return trackerHits.filter((h) => h.particle_id === particle.particle_id);
  }, [trackerHits, particle.particle_id]);

  // Filter calo contributions
  const particleCalo = useMemo(() => {
    const list: {
      cellIndex: number;
      detector: string;
      energy: number;
      time: number;
    }[] = [];
    for (const cell of caloCells) {
      const idx = cell.contrib_particle_ids.indexOf(particle.particle_id);
      if (idx !== -1) {
        list.push({
          cellIndex: cell.cell_index,
          detector: cell.detector,
          energy: cell.contrib_energies[idx] || 0,
          time: cell.contrib_times[idx] || 0,
        });
      }
    }
    return list;
  }, [caloCells, particle.particle_id]);

  // Chart 1: Momentum components
  const momentumOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: "{b}: {c} GeV/c",
      },
      grid: { top: 20, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: "category",
        data: ["px", "py", "pz", "pT", "|p|"],
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
      },
      yAxis: {
        type: "value",
        name: "GeV/c",
        nameTextStyle: { color: "#64748b" },
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
      },
      series: [
        {
          data: [
            {
              value: Number(particle.px.toFixed(3)),
              itemStyle: { color: "#38bdf8" },
            },
            {
              value: Number(particle.py.toFixed(3)),
              itemStyle: { color: "#38bdf8" },
            },
            {
              value: Number(particle.pz.toFixed(3)),
              itemStyle: { color: "#38bdf8" },
            },
            {
              value: Number(particle.pt.toFixed(3)),
              itemStyle: { color: "#10b981" },
            },
            {
              value: Number(particle.p.toFixed(3)),
              itemStyle: { color: "#f59e0b" },
            },
          ],
          type: "bar",
          barWidth: "40%",
        },
      ],
    };
  }, [particle]);

  // Chart 2: Coordinate Projections (X-Y and R-Z)
  const coordinatesOption = useMemo(() => {
    const xyData = particleHits.map((h) => [
      Number(h.x.toFixed(2)),
      Number(h.y.toFixed(2)),
      h.hit_index,
    ]);
    const rzData = particleHits.map((h) => {
      const r = Math.sqrt(h.x * h.x + h.y * h.y);
      return [Number(h.z.toFixed(2)), Number(r.toFixed(2)), h.hit_index];
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        formatter: (params: any) => {
          return `Hit #${params.value[2]}<br/>Coords: (${params.value[0]}, ${params.value[1]}) mm`;
        },
      },
      legend: {
        data: ["Transverse (X vs Y)", "Longitudinal (Z vs R)"],
        textStyle: { color: "#94a3b8" },
      },
      grid: { top: 40, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: "value",
        name: "mm",
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
      },
      yAxis: {
        type: "value",
        name: "mm",
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
      },
      series: [
        {
          name: "Transverse (X vs Y)",
          type: "scatter",
          data: xyData,
          itemStyle: { color: "#10b981" },
          symbolSize: 8,
        },
        {
          name: "Longitudinal (Z vs R)",
          type: "scatter",
          data: rzData,
          itemStyle: { color: "#38bdf8" },
          symbolSize: 8,
        },
      ],
    };
  }, [particleHits]);

  // Chart 3: Calorimeter cell energy contributions
  const caloOption = useMemo(() => {
    const categories = particleCalo.map((c) => `Cell #${c.cellIndex}`);
    const energies = particleCalo.map((c) => Number(c.energy.toFixed(3)));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        formatter: "{b}: {c} GeV",
      },
      grid: { top: 20, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace", rotate: 25 },
      },
      yAxis: {
        type: "value",
        name: "Energy (GeV)",
        nameTextStyle: { color: "#64748b" },
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
      },
      series: [
        {
          data: energies,
          type: "bar",
          barWidth: "35%",
          itemStyle: { color: "#a855f7" },
        },
      ],
    };
  }, [particleCalo]);

  // Chart 4: Timing sequence
  const timingOption = useMemo(() => {
    const items: { label: string; time: number; type: string }[] = [];
    items.push({
      label: "Production Vertex",
      time: particle.time,
      type: "vertex",
    });
    for (const h of particleHits) {
      items.push({
        label: `Tracker #${h.hit_index}`,
        time: h.time,
        type: "tracker",
      });
    }
    for (const c of particleCalo) {
      items.push({ label: `Calo #${c.cellIndex}`, time: c.time, type: "calo" });
    }
    items.sort((a, b) => a.time - b.time);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const pt = items[params[0].dataIndex];
          return `${pt.label}<br/>Time: ${pt.time.toFixed(4)} ns`;
        },
      },
      grid: { top: 20, right: 20, bottom: 50, left: 60 },
      xAxis: {
        type: "category",
        data: items.map((i) => i.label),
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace", rotate: 30 },
      },
      yAxis: {
        type: "value",
        name: "Time (ns)",
        nameTextStyle: { color: "#64748b" },
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#94a3b8", fontFamily: "monospace" },
      },
      series: [
        {
          data: items.map((i) => Number(i.time.toFixed(4))),
          type: "line",
          smooth: true,
          lineStyle: { color: "#38bdf8" },
          itemStyle: { color: "#38bdf8" },
        },
      ],
    };
  }, [particle, particleHits, particleCalo]);

  return (
    <div className="flex flex-col h-full text-xs p-3 gap-3">
      {/* Chart Selector Pills */}
      <div className="flex items-center gap-1 border-b border-science-border pb-2">
        <button
          onClick={() => setActiveChart("momentum")}
          className={`px-2.5 py-1 rounded text-xs transition ${
            activeChart === "momentum"
              ? "bg-science-particle/20 text-science-particle border border-science-particle/40 font-semibold"
              : "text-science-muted hover:text-white"
          }`}
        >
          Kinematics (p)
        </button>
        <button
          onClick={() => setActiveChart("coordinates")}
          className={`px-2.5 py-1 rounded text-xs transition ${
            activeChart === "coordinates"
              ? "bg-science-tracker/20 text-science-tracker border border-science-tracker/40 font-semibold"
              : "text-science-muted hover:text-white"
          }`}
        >
          Projections (XY / RZ)
        </button>
        <button
          onClick={() => setActiveChart("calorimeter")}
          className={`px-2.5 py-1 rounded text-xs transition ${
            activeChart === "calorimeter"
              ? "bg-science-ecal/20 text-science-ecal border border-science-ecal/40 font-semibold"
              : "text-science-muted hover:text-white"
          }`}
        >
          Calo Energy
        </button>
        <button
          onClick={() => setActiveChart("timing")}
          className={`px-2.5 py-1 rounded text-xs transition ${
            activeChart === "timing"
              ? "bg-amber-400/20 text-amber-400 border border-amber-400/40 font-semibold"
              : "text-science-muted hover:text-white"
          }`}
        >
          Timing Profile
        </button>
      </div>

      {/* Active Chart */}
      <div className="flex-1 min-h-[220px]">
        {activeChart === "momentum" && (
          <ReactECharts
            option={momentumOption}
            style={{ height: "100%", width: "100%" }}
          />
        )}
        {activeChart === "coordinates" && (
          <ReactECharts
            option={coordinatesOption}
            style={{ height: "100%", width: "100%" }}
          />
        )}
        {activeChart === "calorimeter" &&
          (particleCalo.length > 0 ? (
            <ReactECharts
              option={caloOption}
              style={{ height: "100%", width: "100%" }}
            />
          ) : (
            <div className="p-8 text-center text-science-muted">
              No calorimeter deposits to chart.
            </div>
          ))}
        {activeChart === "timing" && (
          <ReactECharts
            option={timingOption}
            style={{ height: "100%", width: "100%" }}
          />
        )}
      </div>
    </div>
  );
};
