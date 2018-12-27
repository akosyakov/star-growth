import * as React from 'react';

export type TimeSpanValue = 1 | 3 | 6 | 12 | 24 | 60 | 120;
export interface TimeSpanProps {
    value: TimeSpanValue
    onChange: (value: TimeSpanValue) => void
}

export default function TimeSpan({ value, onChange }: TimeSpanProps): JSX.Element {
    return <select value={value} onChange={e => onChange(Number(e.currentTarget.value) as TimeSpanValue)}>
        <option value="1">Month</option>
        <option value="3">3 Months</option>
        <option value="6">6 Months</option>
        <option value="12">Year</option>
        <option value="24">2 Years</option>
        <option value="60">5 Years</option>
        <option value="120">10 Years</option>
    </select>
}