const statuses = [
  'Invoice Pending',
  '2 Days Remaining',
  '1 Day Remaining',
  'Due Today',
  'Overdue',
  'Invoice Submitted',
  'Finance Verification Pending',
  'Verified',
  'Completed',
]

export default function InvoiceDeadlinePanel() {
  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Workflow</p>
          <h3>Invoice deadline tracking</h3>
        </div>
      </div>
      <div className="deadline-badges">
        {statuses.map((status) => (
          <span className="badge neutral" key={status}>{status}</span>
        ))}
      </div>
    </div>
  )
}
