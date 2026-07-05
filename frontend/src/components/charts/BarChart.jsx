import React from 'react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { CHART_COLORS } from '@/utils/constants'

export default function BarChart({
  data,
  bars = [],
  xDataKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
  stacked = false,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xDataKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          </>
        ) : (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis dataKey={xDataKey} type="category" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={100} />
          </>
        )}
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: 'none',
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        />
        {showLegend && bars.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color || CHART_COLORS[i % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
