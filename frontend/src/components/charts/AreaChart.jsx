import React from 'react'
import {
  AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { CHART_COLORS } from '@/utils/constants'

export default function AreaChart({
  data,
  areas = [],
  xDataKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          {areas.map((area, i) => {
            const color = area.color || CHART_COLORS[i % CHART_COLORS.length]
            return (
              <linearGradient key={area.dataKey} id={`gradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            )
          })}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis dataKey={xDataKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: 'none',
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        />
        {showLegend && areas.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {areas.map((area, i) => {
          const color = area.color || CHART_COLORS[i % CHART_COLORS.length]
          return (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${area.dataKey})`}
              stackId={stacked ? 'stack' : undefined}
            />
          )
        })}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
