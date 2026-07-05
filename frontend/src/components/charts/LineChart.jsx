import React from 'react'
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { CHART_COLORS } from '@/utils/constants'

export default function LineChart({
  data,
  lines = [],
  xDataKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
        {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {lines.map((line, i) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
