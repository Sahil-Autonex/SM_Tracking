import { useMemo, useState } from 'react'
import { fallbackProjectMaster } from '../data/masterData'

const paymentMethods = ['Bank Transfer', 'UPI', 'Cash', 'Card', 'Other']
const transactionTypes = ['Payment Made', 'Payment Received']

export default function TransactionForm() {
  const [project, setProject] = useState('SV-30')
  const [parameter, setParameter] = useState('Core Electronics')
  const [item, setItem] = useState('Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)')
  const [form, setForm] = useState({
    transactionType: 'Payment Made',
    amount: '',
    vendor: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    reference: '',
    remarks: '',
  })

  const parameters = useMemo(() => fallbackProjectMaster[project]?.map((entry) => entry.parameter) ?? [], [project])

  const items = useMemo(() => {
    const selectedParameter = fallbackProjectMaster[project]?.find((entry) => entry.parameter === parameter)
    return selectedParameter?.items ?? []
  }, [project, parameter])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log('Transaction draft ready', {
      project,
      parameter,
      item,
      ...form,
    })
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-header-row">
        <div>
          <p className="eyebrow">Create transaction</p>
          <h3>Transaction entry</h3>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Project Name</label>
          <select value={project} onChange={(e) => {
            const nextProject = e.target.value
            const nextParameter = fallbackProjectMaster[nextProject]?.[0]?.parameter ?? ''
            const nextItem = fallbackProjectMaster[nextProject]?.[0]?.items?.[0] ?? ''
            setProject(nextProject)
            setParameter(nextParameter)
            setItem(nextItem)
          }}>
            {Object.keys(fallbackProjectMaster).map((proj) => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Parameter</label>
          <select value={parameter} onChange={(e) => {
            const nextParameter = e.target.value
            const nextItem = fallbackProjectMaster[project]?.find((entry) => entry.parameter === nextParameter)?.items?.[0] ?? ''
            setParameter(nextParameter)
            setItem(nextItem)
          }}>
            {parameters.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Item Description</label>
          <select value={item} onChange={(e) => setItem(e.target.value)}>
            {items.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Transaction Type</label>
          <select name="transactionType" value={form.transactionType} onChange={handleChange}>
            {transactionTypes.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Amount</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="₹0.00" />
        </div>

        <div className="field">
          <label>Vendor / Recipient</label>
          <input name="vendor" type="text" value={form.vendor} onChange={handleChange} placeholder="Vendor or payee" />
        </div>

        <div className="field">
          <label>Transaction Date</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Payment Method</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
            {paymentMethods.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Reference / Transaction ID</label>
          <input name="reference" type="text" value={form.reference} onChange={handleChange} />
        </div>

        <div className="field field-full">
          <label>Remarks</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} rows="4" placeholder="Transaction notes and purpose" />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button">Save Draft</button>
        <button type="submit" className="primary-button">Submit for approval</button>
      </div>
    </form>
  )
}
