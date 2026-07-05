import React from 'react'
import {
  RadarChart as RechartsRadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import { CHART_COLORS } from '@/utils/constants'

export default function RadarChart({
  data,
  radars = [],
  angleKey = 'subject',
  height = 300,
  showLegend = true,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey={angleKey} tick={{ fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: 'none',
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        />
        {showLegend && radars.length > 1 && <Legend wrapperStyle={{ fontSize: '12px' }} />}
        {radars.map((radar, i) => (
          <Radar
            key={radar.dataKey}
            name={radar.name || radar.dataKey}
            dataKey={radar.dataKey}
            stroke={radar.color || CHART_COLORS[i % CHART_COLORS.length]}
            fill={radar.color || CHART_COLORS[i % CHART_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}
