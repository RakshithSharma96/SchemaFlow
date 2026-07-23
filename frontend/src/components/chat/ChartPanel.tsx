import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { ChartConfig, QueryResult } from '@/lib/types';

interface ChartPanelProps {
  config: ChartConfig;
  result: QueryResult;
}

// Enterprise grayscale/monochrome palette with one primary accent
const COLORS = [
  'var(--foreground)', // primary data
  'var(--muted-foreground)', // secondary data
  '#52525b', // zinc-600
  '#71717a', // zinc-500
  '#a1a1aa', // zinc-400
];

export function ChartPanel({ config, result }: ChartPanelProps) {
  if (config.chart_type === 'table' || !config.x_axis || !config.y_axis) {
    return null;
  }

  const data = result.rows.map((row) => {
    const obj: any = {};
    result.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  const { x_axis, y_axis } = config;
  const chart_type = config.chart_type?.toLowerCase() || 'bar';

  const normalizeKey = (key: string, cols: string[]) => {
    const lowerKey = key.toLowerCase();
    return cols.find(c => c.toLowerCase() === lowerKey) || key;
  };

  const actualXAxis = normalizeKey(x_axis, result.columns);
  const actualYAxis = normalizeKey(y_axis, result.columns);

  const chartData = data.map(d => ({
    ...d,
    [actualYAxis]: Number(d[actualYAxis]) || 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-sm text-sm">
          <p className="font-medium text-[var(--muted-foreground)] mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[var(--foreground)] font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="tabular-nums">{p.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const axisStyle = {
    fill: 'var(--muted-foreground)',
    fontSize: 11,
    fontFamily: 'inherit',
  };

  const renderChart = () => {
    switch (chart_type) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={actualXAxis} tick={axisStyle} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)' }} />
            <Bar dataKey={actualYAxis} fill="var(--foreground)" radius={[2, 2, 0, 0]} maxBarSize={40} />
          </BarChart>
        );
      case 'line':
      case 'linechart':
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={actualXAxis} tick={axisStyle} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={actualYAxis} stroke="var(--foreground)" strokeWidth={2} dot={{ r: 3, fill: 'var(--background)', stroke: 'var(--foreground)', strokeWidth: 2 }} activeDot={{ r: 5, fill: 'var(--foreground)' }} />
          </LineChart>
        );
      case 'area':
      case 'areachart':
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={actualXAxis} tick={axisStyle} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={actualYAxis} stroke="var(--foreground)" strokeWidth={2} fillOpacity={1} fill="url(#colorY)" />
          </AreaChart>
        );
      case 'pie':
      case 'piechart':
        return (
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey={actualYAxis}
              nameKey={actualXAxis}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        );
      default:
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={actualXAxis} tick={axisStyle} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)' }} />
            <Bar dataKey={actualYAxis} fill="var(--foreground)" radius={[2, 2, 0, 0]} maxBarSize={40} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full h-[300px] p-4 bg-[var(--card)] rounded-md">
      <div className="text-xs font-semibold tracking-wider text-[var(--muted-foreground)] mb-4">
        {config.chart_type.toUpperCase()} VISUALIZATION
      </div>
      <div className="w-full h-[calc(100%-32px)]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
