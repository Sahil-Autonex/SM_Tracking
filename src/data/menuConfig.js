export const roles = {
  employee: {
    label: 'Employee',
    nav: ['Dashboard', 'Transactions', 'My Transactions', 'Approvals', 'Invoices', 'Payments', 'Projects', 'Analytics', 'Monthly Summary', 'Bank Reconciliation', 'Master Data', 'Users', 'Audit Logs'],
  },
  team_lead: {
    label: 'Team Lead',
    nav: ['Dashboard', 'Transactions', 'Approvals', 'Invoices', 'Payments', 'Projects', 'Analytics', 'Monthly Summary', 'Bank Reconciliation', 'Master Data', 'Users', 'Audit Logs'],
  },
  finance: {
    label: 'Finance',
    nav: ['Dashboard', 'Transactions', 'Invoices', 'Payments', 'Projects', 'Analytics', 'Monthly Summary', 'Bank Reconciliation', 'Master Data', 'Users', 'Audit Logs'],
  },
  admin: {
    label: 'Admin',
    nav: ['Dashboard', 'Transactions', 'My Transactions', 'Approvals', 'Invoices', 'Payments', 'Projects', 'Analytics', 'Monthly Summary', 'Bank Reconciliation', 'Master Data', 'Users', 'Audit Logs'],
  },
}

export const dashboardMetrics = [
  { label: 'Total Inflow', value: '₹0', accent: 'positive' },
  { label: 'Total Outflow', value: '₹0', accent: 'negative' },
  { label: 'Net Cash Flow', value: '₹0', accent: 'neutral' },
  { label: 'Pending Approvals', value: '0', accent: 'warning' },
]

export const projectHierarchy = [
  { project: 'WILL' },
  { project: 'SV-30' },
  { project: 'VIGIL' },
]

export const initialProjects = ['WILL', 'SV-30', 'VIGIL']
