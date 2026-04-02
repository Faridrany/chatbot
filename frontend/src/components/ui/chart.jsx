"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "./utils";

const THEMES = {
  light: "",
  dark: ".dark",
};

const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({ id, className, children, config, ...props }) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color);

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = (itemConfig.theme && itemConfig.theme[theme]) || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : "";
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;

    const [item] = payload;
    const key = labelKey || item?.dataKey || item?.name || "value";
    const itemConfig = getPayloadConfigFromPayload(config, item, key);

    const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;

    if (labelFormatter) {
      return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
    }

    if (!value) return null;

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [label, payload, hideLabel, config, labelKey]);

  if (!active || !payload?.length) return null;

  return (
    <div className={cn("bg-background border rounded-lg px-2 py-1.5 text-xs shadow-xl", className)}>
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = nameKey || item.name || item.dataKey || "value";
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color || item.fill || item.color;

          return (
            <div key={index} className="flex justify-between gap-2">
              {!hideIndicator && <div className="h-2 w-2 rounded" style={{ backgroundColor: indicatorColor }} />}
              <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
              <span className="font-mono">{item.value?.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({ className, hideIcon = false, payload }) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className={cn("flex gap-4 justify-center", className)}>
      {payload.map((item, index) => {
        const key = item.dataKey || "value";
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div key={index} className="flex items-center gap-1.5">
            {!hideIcon && <div className="h-2 w-2 rounded" style={{ backgroundColor: item.color }} />}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}

function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) return;

  const payloadData = payload.payload || {};

  let configKey = key;

  if (typeof payload[key] === "string") {
    configKey = payload[key];
  } else if (typeof payloadData[key] === "string") {
    configKey = payloadData[key];
  }

  return config[configKey] || config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
