import React from 'react'
import StatsCard from '@/components/dashboard/StatsCard'

interface DashboardStatsProps {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
}

export default function DashboardStats({ totalCalls, analyzed, hotLeads, avgScore }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        label="Total Calls"
        value={totalCalls}
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
      />
      <StatsCard
        label="Analyzed"
        value={`${analyzed}/${totalCalls}`}
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <StatsCard
        label="Hot Leads"
        value={hotLeads}
        icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.266-.526.75-.36 1.158.328.808.454 1.703.454 2.674 0 1.553-.37 3.078-1.083 4.413.071.165.136.33.201.492.126.277.208.576.208.906 0 .893-.36 1.702-.94 2.289a1 1 0 001.415 1.414c.822-.822 1.333-1.96 1.333-3.203 0-.339-.027-.674-.08-1.003.686-1.46 1.081-3.081 1.081-4.762 0-1.2-.132-2.371-.382-3.5.226-.617.733-1.058 1.341-1.058.981 0 1.793.795 1.8 1.772.007.09.01.18.01.27 0 1.03-.244 2.006-.68 2.87.313.29.64.56.977.776.604.404 1.266.72 1.964.93.504.144 1.028.226 1.567.226 1.654 0 3.173-.447 4.506-1.23.177-.106.35-.218.519-.336a1 1 0 00-1.219-1.612c-.134.1-.268.2-.406.3-1.09.766-2.408 1.209-3.806 1.209-.42 0-.835-.04-1.24-.118-.327.073-.666.11-1.013.11-.982 0-1.793-.795-1.8-1.773a5.946 5.946 0 00-.01-.269z" clipRule="evenodd" /></svg>}
      />
      <StatsCard
        label="Avg Score"
        value={`${avgScore}%`}
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
    </div>
  )
}