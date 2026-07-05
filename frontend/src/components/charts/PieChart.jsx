import React from 'react'
import {
  PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { CHART_COLORS } from '@/utils/constants'

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function PieChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  showLegend = true,
  innerRadius = 0,
  colors,
}) {
  const chartColors = colors || CHART_COLORS

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius="70%"
          labelLine={false}
          label={renderCustomLabel}
        >
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || chartColors[index % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: 'none',
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
