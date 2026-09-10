import TransactionForm from './TransactionForm'
import InvoiceDeadlinePanel from './InvoiceDeadlinePanel'
import RolePermissions from './RolePermissions'
import MasterDataPanel from './MasterDataPanel'

export default function PageShell() {
  return (
    <div className="page-stack">
      <div className="content-grid single-row-grid">
        <TransactionForm />
        <InvoiceDeadlinePanel />
      </div>

      <div className="content-grid single-row-grid">
        <RolePermissions role="admin" />
        <MasterDataPanel />
      </div>
    </div>
  )
}
