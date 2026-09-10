const permissions = {
  employee: [
    'Create a transaction/payment entry',
    'Submit for approval',
    'Upload supporting documents',
    'View own transactions and history',
    'View approval status and invoice status',
    'Must not approve transactions or view organization-wide analytics',
  ],
  team_lead: [
    'View team transactions',
    'Approve or reject transactions',
    'View project and parameter spending',
    'Review invoice and payment variance',
    'Reject requires mandatory reason',
  ],
  finance: [
    'View approved transactions',
    'Verify invoices',
    'Record payments',
    'View payment history and variance',
    'Support future reconciliation workflow',
  ],
  admin: [
    'Manage all users, roles and master data',
    'View all projects, transactions, invoices and payments',
    'Approve/reject/override workflows',
    'Monitor analytics and monthly summaries',
    'Audit all changes and financial actions',
  ],
}

export default function RolePermissions({ role }) {
  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Role access</p>
          <h3>{role}</h3>
        </div>
      </div>
      <ul className="permission-list">
        {permissions[role]?.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
