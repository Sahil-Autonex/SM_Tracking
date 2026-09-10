import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { fallbackProjectMaster } from './data/masterData'
import './index.css'

const STORAGE_KEY = 'sm_tracker_data_v1'
const SESSION_KEY = 'sm_tracker_session_v1'

const defaultUsers = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'System Admin' },
  { id: 'employee-1', username: 'Employee', password: '123456789', role: 'employee', name: 'Employee' },
  { id: 'teamlead-1', username: 'Lead', password: 'lead123', role: 'team_lead', name: 'Team Lead' },
  { id: 'finance-1', username: 'Finance', password: 'Fin@SM!9', role: 'finance', name: 'Finance Team' },
]

const emptyData = {
  users: defaultUsers,
  transactions: [],
  invoices: [],
  payments: [],
  logs: [],
}

const sanitizeStoredData = (savedData) => {
  const users = Array.isArray(savedData?.users) ? savedData.users : defaultUsers
  const normalizedUsers = defaultUsers.map((defaultUser) => {
    const savedUser = users.find((user) => user.username.toLowerCase() === defaultUser.username.toLowerCase())
    if (!savedUser) return defaultUser

    if (defaultUser.username.toLowerCase() === 'admin') {
      return { ...defaultUser, ...savedUser, password: defaultUser.password }
    }

    return { ...defaultUser, ...savedUser }
  })

  return {
    ...emptyData,
    ...savedData,
    users: normalizedUsers,
    transactions: Array.isArray(savedData?.transactions) ? savedData.transactions : [],
    invoices: Array.isArray(savedData?.invoices) ? savedData.invoices : [],
    payments: Array.isArray(savedData?.payments) ? savedData.payments : [],
    logs: Array.isArray(savedData?.logs) ? savedData.logs : [],
  }
}

const navMap = {
  admin: ['Dashboard', 'Transactions', 'Invoices', 'Payments', 'Approvals', 'Logs'],
  finance: ['Dashboard', 'Transactions', 'Invoices', 'Payments', 'Logs'],
  team_lead: ['Dashboard', 'Approvals', 'Log', 'Log history'],
  employee: ['Log', 'Log history'],
}

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? sanitizeStoredData(JSON.parse(saved)) : emptyData
    } catch {
      return emptyData
    }
  })

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [transactionForm, setTransactionForm] = useState({
    type: 'Outflow',
    project: 'SV-30',
    parameter: 'Core Electronics',
    item: 'Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)',
    vendor: '',
    quantity: '1',
    expectedAmount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    remarks: '',
  })

  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'Outflow',
      project: 'SV-30',
      parameter: 'Core Electronics',
      item: 'Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)',
      vendor: '',
      quantity: '1',
      expectedAmount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      remarks: '',
    })
  }

  const projectOptions = useMemo(() => Object.keys(fallbackProjectMaster), [])
  const parameterOptions = useMemo(
    () => fallbackProjectMaster[transactionForm.project]?.map((entry) => entry.parameter) ?? [],
    [transactionForm.project],
  )
  const itemOptions = useMemo(() => {
    const selectedParameter = fallbackProjectMaster[transactionForm.project]?.find(
      (entry) => entry.parameter === transactionForm.parameter,
    )
    return selectedParameter?.items ?? []
  }, [transactionForm.project, transactionForm.parameter])

  const invoiceReadyTransactionOptions = useMemo(
    () => data.transactions.filter((transaction) => transaction.status === 'Received'),
    [data.transactions],
  )
  const [invoiceForm, setInvoiceForm] = useState({
    transactionId: '',
    project: 'SV-30',
    vendor: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    file: null,
  })
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    project: 'SV-30',
    vendor: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [logDraft, setLogDraft] = useState('')
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [session])

  const currentUser = session?.user

  const addLog = (actor, action) => {
    setData((prev) => ({
      ...prev,
      logs: [{ id: `LOG-${Date.now()}`, actor, action, time: new Date().toLocaleString('en-GB') }, ...prev.logs].slice(0, 50),
    }))
  }

  const metrics = useMemo(() => {
    const totalOutflow = data.transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const totalPayments = data.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const pendingApprovals = data.transactions.filter((item) => item.status === 'Pending').length
    const verifiedInvoices = data.invoices.filter((item) => item.status === 'Verified').length

    return {
      totalOutflow: formatCurrency(totalOutflow),
      totalPayments: formatCurrency(totalPayments),
      pendingApprovals,
      verifiedInvoices,
      transactions: data.transactions.length,
      invoices: data.invoices.length,
      payments: data.payments.length,
    }
  }, [data])

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - index))
      return {
        label: d.toLocaleString('en-US', { month: 'short' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      }
    })

    return months.map((month) => ({
      name: month.label,
      spend: data.transactions
        .filter((transaction) => {
          const date = new Date(transaction.date)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          return key === month.key
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    }))
  }, [data.transactions])

  const projectTotals = useMemo(() => {
    const totals = {}
    data.transactions.forEach((transaction) => {
      totals[transaction.project] = (totals[transaction.project] || 0) + Number(transaction.amount || 0)
    })
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [data.transactions])

  const matchesDateRange = (value) => {
    if (!value) return true
    const selectedDate = new Date(value)
    if (Number.isNaN(selectedDate.getTime())) return true

    const start = dateFilter.start ? new Date(`${dateFilter.start}T00:00:00`) : null
    const end = dateFilter.end ? new Date(`${dateFilter.end}T23:59:59`) : null

    if (start && selectedDate < start) return false
    if (end && selectedDate > end) return false
    return true
  }

  const filteredTransactions = useMemo(
    () => data.transactions.filter((transaction) => matchesDateRange(transaction.date)),
    [data.transactions, dateFilter],
  )

  const visibleTransactions = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'employee') {
      return filteredTransactions.filter((transaction) => transaction.employee === currentUser.name)
    }
    return filteredTransactions
  }, [currentUser, filteredTransactions])

  const employeeHistoryTransactions = useMemo(() => {
    if (!currentUser) return []
    return filteredTransactions.filter((transaction) => transaction.employee === currentUser.name)
  }, [currentUser, filteredTransactions])

  const selectedTransaction = useMemo(
    () => data.transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null,
    [data.transactions, selectedTransactionId],
  )

  const visibleInvoices = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'employee') return []
    return data.invoices
  }, [currentUser, data.invoices])

  const visiblePayments = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'employee') return []
    return data.payments
  }, [currentUser, data.payments])

  const visibleLogs = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'employee') {
      return data.logs.filter((log) => log.actor === currentUser.name)
    }
    return data.logs
  }, [currentUser, data.logs])

  const approvalQueue = useMemo(() => {
    if (!currentUser || currentUser.role === 'finance') return []
    return filteredTransactions.filter((transaction) => transaction.status === 'Pending' || transaction.status === 'Rejected')
  }, [currentUser, filteredTransactions])

  const handleLogin = (event) => {
    event.preventDefault()
    const foundUser = data.users.find(
      (user) => user.username.toLowerCase() === loginForm.username.trim().toLowerCase() && user.password === loginForm.password,
    )

    if (!foundUser) {
      alert('Incorrect username or password.')
      return
    }

    setSession({ user: foundUser })
    setActiveTab(foundUser.role === 'employee' ? 'Log' : 'Dashboard')
  }

  const handleLogout = () => {
    setSession(null)
  }

  const handleAddTransaction = (event) => {
    event.preventDefault()
    const expectedAmount = Number(transactionForm.expectedAmount)
    const quantity = Number(transactionForm.quantity)
    const isEmployeeRequest = currentUser?.role === 'employee'

    if (!transactionForm.item || !transactionForm.parameter || Number.isNaN(expectedAmount) || expectedAmount <= 0 || Number.isNaN(quantity) || quantity <= 0) {
      alert('Please complete the required details before submitting the request.')
      return
    }

    if (!isEmployeeRequest && (!transactionForm.vendor || !transactionForm.paymentMethod)) {
      alert('Vendor and payment method are required for team lead and admin requests.')
      return
    }

    const newTransaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      type: transactionForm.type,
      project: transactionForm.project,
      parameter: transactionForm.parameter,
      item: transactionForm.item,
      vendor: isEmployeeRequest ? 'Pending vendor' : transactionForm.vendor,
      quantity,
      expectedAmount,
      amount: expectedAmount,
      date: transactionForm.date,
      employee: currentUser?.name || 'Employee',
      status: 'Pending',
      invoiceStatus: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: isEmployeeRequest ? 'To be added later' : transactionForm.paymentMethod,
      remarks: transactionForm.remarks || 'No remarks',
      orderAmount: null,
      modeOfDelivery: '',
      receivedOn: '',
    }

    setData((prev) => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
    }))

    addLog(currentUser?.name || 'Employee', `Transaction request created - ${newTransaction.id}`)
    resetTransactionForm()
    setActiveTab('Transactions')
    alert('Transaction request submitted successfully.')
  }

  const handleAddInvoice = async (event) => {
    event.preventDefault()
    const amount = Number(invoiceForm.amount)
    const selectedTransaction = data.transactions.find((transaction) => transaction.id === invoiceForm.transactionId)

    if (!invoiceForm.transactionId || !invoiceForm.vendor || Number.isNaN(amount) || amount <= 0) {
      alert('Please select a transaction and complete invoice details.')
      return
    }

    if (!selectedTransaction) {
      alert('Selected transaction is invalid.')
      return
    }

    if (selectedTransaction.status !== 'Received') {
      alert('Invoice uploads are allowed only after the employee marks the order as received.')
      return
    }

    if (invoiceForm.file && !/\.pdf$/i.test(invoiceForm.file.name) && invoiceForm.file.type !== 'application/pdf') {
      alert('Only PDF files are allowed for invoice uploads.')
      return
    }

    const documentData = invoiceForm.file ? await readFileAsDataUrl(invoiceForm.file) : ''
    const invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      transactionId: invoiceForm.transactionId,
      project: invoiceForm.project,
      vendor: invoiceForm.vendor,
      amount,
      date: invoiceForm.date,
      status: 'Verified',
      documentName: invoiceForm.file?.name || 'invoice.pdf',
      documentData,
    }

    setData((prev) => ({
      ...prev,
      invoices: [invoice, ...prev.invoices],
      transactions: prev.transactions.map((transaction) =>
        transaction.id === invoiceForm.transactionId ? { ...transaction, invoiceStatus: 'Submitted' } : transaction,
      ),
    }))

    addLog(currentUser?.name || 'Finance Team', `Invoice recorded - ${invoice.id}`)
    setInvoiceForm({
      transactionId: '',
      project: 'SV-30',
      vendor: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      file: null,
    })
    alert('Invoice recorded successfully.')
  }

  const handleAddPayment = (event) => {
    event.preventDefault()
    const amount = Number(paymentForm.amount)

    if (!paymentForm.transactionId || !paymentForm.vendor || Number.isNaN(amount) || amount <= 0) {
      alert('Please select a transaction and complete payment details.')
      return
    }

    const payment = {
      id: `PY-${Date.now().toString().slice(-6)}`,
      transactionId: paymentForm.transactionId,
      project: paymentForm.project,
      vendor: paymentForm.vendor,
      amount,
      date: paymentForm.date,
      status: 'Paid',
    }

    setData((prev) => ({
      ...prev,
      payments: [payment, ...prev.payments],
      transactions: prev.transactions.map((transaction) =>
        transaction.id === paymentForm.transactionId ? { ...transaction, paymentStatus: 'Recorded' } : transaction,
      ),
    }))

    addLog(currentUser?.name || 'Finance Team', `Payment recorded - ${payment.id}`)
    setPaymentForm({
      transactionId: '',
      project: 'SV-30',
      vendor: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
    })
    alert('Payment recorded successfully.')
  }

  const openOrderFormFromApprovedTransaction = (transaction) => {
    setSelectedTransactionId(transaction.id)
    setActiveTab('Log')
    setTransactionForm({
      type: transaction.type || 'Outflow',
      project: transaction.project,
      parameter: transaction.parameter,
      item: transaction.item,
      vendor: transaction.vendor,
      quantity: String(transaction.quantity ?? 1),
      expectedAmount: '',
      date: transaction.date,
      paymentMethod: transaction.paymentMethod || 'Bank Transfer',
      remarks: transaction.remarks || '',
    })
  }

  const handleApproval = (transactionId, nextStatus) => {
    const target = data.transactions.find((transaction) => transaction.id === transactionId)

    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, status: nextStatus } : transaction,
      ),
    }))

    if (nextStatus === 'Approved' && currentUser?.role === 'team_lead' && target) {
      openOrderFormFromApprovedTransaction({ ...target, status: 'Approved' })
    }

    addLog(currentUser?.name || 'Admin', `Transaction ${nextStatus.toLowerCase()} - ${transactionId}`)
  }

  const handlePlaceOrder = (event) => {
    event.preventDefault()
    if (!selectedTransaction) return

    const orderAmount = Number(selectedTransaction.orderAmount ?? 0)
    if (!selectedTransaction.modeOfDelivery || Number.isNaN(orderAmount) || orderAmount <= 0) {
      alert('Please enter the actual amount and choose a delivery mode before placing the order.')
      return
    }

    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((transaction) =>
        transaction.id === selectedTransaction.id
          ? { ...transaction, status: 'Ordered', amount: orderAmount, orderAmount, modeOfDelivery: transaction.modeOfDelivery || 'Shipment' }
          : transaction,
      ),
    }))

    addLog(currentUser?.name || 'Team Lead', `Order placed - ${selectedTransaction.id}`)
    alert('Order placed successfully.')
  }

  const handleMarkReceived = (transactionId, selectedReceivedDate = receivedDate) => {
    const finalDate = selectedReceivedDate || new Date().toISOString().slice(0, 10)
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, status: 'Received', receivedOn: finalDate } : transaction,
      ),
    }))
    addLog(currentUser?.name || 'Employee', `Order received - ${transactionId}`)
    setReceivedDate(finalDate)
    alert('Order marked as received.')
  }

  const handlePasswordChange = (event) => {
    event.preventDefault()

    if (currentUser.role !== 'employee') return

    const currentPassword = passwordForm.current.trim()
    const nextPassword = passwordForm.next.trim()
    const confirmPassword = passwordForm.confirm.trim()

    if (currentPassword !== currentUser.password) {
      alert('Current password does not match.')
      return
    }
    if (nextPassword.length < 6) {
      alert('New password must be at least 6 characters long.')
      return
    }
    if (nextPassword !== confirmPassword) {
      alert('New passwords do not match.')
      return
    }

    const updatedUser = { ...currentUser, password: nextPassword }
    setData((prev) => ({
      ...prev,
      users: prev.users.map((user) => (user.id === currentUser.id ? { ...user, password: nextPassword } : user)),
    }))
    setSession({ user: updatedUser })
    addLog(updatedUser.name, 'Password changed')
    setPasswordForm({ current: '', next: '', confirm: '' })
    alert('Password updated successfully.')
  }

  const handleUpdateRejectedTransaction = (event) => {
    event.preventDefault()
    if (!editDraft || !selectedTransactionId) return

    const expectedAmount = Number(editDraft.expectedAmount)
    const quantity = Number(editDraft.quantity)
    if (!editDraft.vendor || !editDraft.item || !editDraft.parameter || Number.isNaN(expectedAmount) || expectedAmount <= 0 || Number.isNaN(quantity) || quantity <= 0) {
      alert('Please complete all required transaction details before saving.')
      return
    }

    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((transaction) =>
        transaction.id === selectedTransactionId
          ? { ...transaction, ...editDraft, quantity, expectedAmount, amount: expectedAmount, status: 'Pending', invoiceStatus: 'Pending', paymentStatus: 'Pending', orderAmount: null, modeOfDelivery: '', receivedOn: '' }
          : transaction,
      ),
    }))

    addLog(currentUser?.name || 'Employee', `Transaction updated - ${selectedTransactionId}`)
    setSelectedTransactionId(selectedTransactionId)
    setEditDraft(null)
    alert('Transaction updated and sent back for approval.')
  }

  const handleOrderFromApprovedForm = (event) => {
    event.preventDefault()
    if (!selectedTransaction) {
      alert('Please select a transaction to place the order.')
      return
    }

    const orderAmount = Number(transactionForm.expectedAmount)
    if (Number.isNaN(orderAmount) || orderAmount <= 0) {
      alert('Please enter the actual amount before placing the order.')
      return
    }

    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((transaction) =>
        transaction.id === selectedTransaction.id
          ? {
              ...transaction,
              status: 'Ordered',
              amount: orderAmount,
              orderAmount,
              modeOfDelivery: transactionForm.paymentMethod || transaction.modeOfDelivery || 'Shipment',
              receivedOn: transaction.receivedOn || '',
            }
          : transaction,
      ),
    }))

    addLog(currentUser?.name || 'Team Lead', `Order placed - ${selectedTransaction.id}`)
    setActiveTab('Log history')
    setSelectedTransactionId(selectedTransaction.id)
    setTransactionForm({
      type: 'Outflow',
      project: 'SV-30',
      parameter: 'Core Electronics',
      item: 'Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)',
      vendor: '',
      quantity: '1',
      expectedAmount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      remarks: '',
    })
    alert('Order placed successfully.')
  }

  const handleEmployeeInvoiceUpload = async (event) => {
    event.preventDefault()
    if (!selectedTransaction) {
      alert('Please select a transaction first.')
      return
    }

    const file = invoiceForm.file
    if (!file) {
      alert('Please upload a PDF invoice to continue.')
      return
    }

    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      alert('Only PDF files are allowed for invoice uploads.')
      return
    }

    const docData = await readFileAsDataUrl(file)
    const newInvoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      transactionId: selectedTransaction.id,
      project: selectedTransaction.project,
      vendor: selectedTransaction.vendor,
      amount: Number(selectedTransaction.amount || invoiceForm.amount || 0),
      date: invoiceForm.date || selectedTransaction.date,
      status: 'Verified',
      documentName: file.name,
      documentData: docData,
    }

    setData((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      transactions: prev.transactions.map((transaction) =>
        transaction.id === selectedTransaction.id ? { ...transaction, invoiceStatus: 'Submitted' } : transaction,
      ),
    }))

    addLog(currentUser?.name || 'Employee', `Invoice uploaded - ${newInvoice.id}`)
    setInvoiceForm((prev) => ({ ...prev, file: null, amount: '', date: new Date().toISOString().slice(0, 10) }))
    setSelectedTransactionId(selectedTransaction.id)
    alert('Invoice uploaded successfully.')
  }

  if (!session?.user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-lockup">
            <div className="brand-logo large">SM</div>
            <div>
              <p className="eyebrow">secure portal</p>
              <h1>SM_Tracker</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <label>
              User ID
              <input
                type="text"
                value={loginForm.username}
                onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                placeholder="Enter user ID"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Enter password"
              />
            </label>

            <button type="submit" className="primary-button full-width">Login</button>
          </form>
        </div>
      </div>
    )
  }

  const navItems = navMap[currentUser.role] || navMap.admin
  const shouldShowDateFilter = (currentUser.role === 'admin' && activeTab === 'Dashboard') || activeTab === 'Log history' || activeTab === 'Logs'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-logo">SM</div>
          <div>
            <h2>SM_Tracker</h2>
            <p>Finance control</p>
          </div>
        </div>

        <div className="user-badge">
          <span className="avatar">{currentUser.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.role}</small>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={item === activeTab ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab(item)}
            >
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="secondary-button full-width" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">overview</p>
            <h1>SM_Tracker</h1>
          </div>
          <div className="user-pill">
            <span className="avatar">{currentUser.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.role}</small>
            </div>
          </div>
        </header>

        {shouldShowDateFilter && (
          <section className="panel form-panel">
            <div className="panel-header-row compact">
              <div>
                <p className="eyebrow">filter</p>
                <h3>Date range</h3>
              </div>
            </div>
            <div className="field-row">
              <label>
                From
                <input type="date" value={dateFilter.start} onChange={(event) => setDateFilter((prev) => ({ ...prev, start: event.target.value }))} />
              </label>
              <label>
                To
                <input type="date" value={dateFilter.end} onChange={(event) => setDateFilter((prev) => ({ ...prev, end: event.target.value }))} />
              </label>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setDateFilter({ start: '', end: '' })}>Reset</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Dashboard' && (
          <>
            <section className="metric-grid">
              <article className="metric-card positive">
                <span>Total outflow</span>
                <strong>{metrics.totalOutflow}</strong>
              </article>
              <article className="metric-card neutral">
                <span>Payments</span>
                <strong>{metrics.totalPayments}</strong>
              </article>
              <article className="metric-card warning">
                <span>Pending approvals</span>
                <strong>{metrics.pendingApprovals}</strong>
              </article>
              <article className="metric-card success">
                <span>Verified invoices</span>
                <strong>{metrics.verifiedInvoices}</strong>
              </article>
            </section>

            <section className="content-grid two-up">
              <div className="panel chart-panel">
                <div className="panel-header-row compact">
                  <div>
                    <p className="eyebrow">trend</p>
                    <h3>Monthly spend</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="spendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="spend" stroke="#4f46e5" fill="url(#spendFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="panel chart-panel">
                <div className="panel-header-row compact">
                  <div>
                    <p className="eyebrow">distribution</p>
                    <h3>Project spend</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={projectTotals.length ? projectTotals : [{ name: 'No data', value: 1 }]} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                      {(projectTotals.length ? projectTotals : [{ name: 'No data', value: 1 }]).map((entry, index) => (
                        <Cell key={entry.name + index} fill={['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bottom-grid summary-grid">
              <div className="panel">
                <div className="panel-header-row compact">
                  <div>
                    <p className="eyebrow">summary</p>
                    <h3>Operational snapshot</h3>
                  </div>
                </div>
                <div className="status-stack">
                  <div className="status-row"><span className="badge neutral">Transactions</span><strong>{metrics.transactions}</strong></div>
                  <div className="status-row"><span className="badge neutral">Invoices</span><strong>{metrics.invoices}</strong></div>
                  <div className="status-row"><span className="badge neutral">Payments</span><strong>{metrics.payments}</strong></div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header-row compact">
                  <div>
                    <p className="eyebrow">recent</p>
                    <h3>Latest activity</h3>
                  </div>
                </div>
                <div className="audit-list">
                  {visibleLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="audit-item">
                      <strong>{log.action}</strong>
                      <p>{log.actor} · {log.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'Transactions' && (
          <>
            <section className="panel form-panel">
              <div className="panel-header-row compact">
                <div>
                  <p className="eyebrow">add</p>
                  <h3>New transaction</h3>
                </div>
              </div>

              <form onSubmit={handleAddTransaction} className="transaction-form">
                <div className="field-row">
                  <label>
                    Project
                    <select
                      value={transactionForm.project}
                      onChange={(event) => {
                        const nextProject = event.target.value
                        const nextEntries = fallbackProjectMaster[nextProject] ?? []
                        const nextParameter = nextEntries[0]?.parameter ?? ''
                        const nextItem = nextEntries[0]?.items?.[0] ?? ''
                        setTransactionForm((prev) => ({
                          ...prev,
                          project: nextProject,
                          parameter: nextParameter,
                          item: nextItem,
                        }))
                      }}
                    >
                      {projectOptions.map((project) => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Parameter
                    <select
                      value={transactionForm.parameter}
                      onChange={(event) => {
                        const nextParameter = event.target.value
                        const nextItem = fallbackProjectMaster[transactionForm.project]?.find(
                          (entry) => entry.parameter === nextParameter,
                        )?.items?.[0] ?? ''
                        setTransactionForm((prev) => ({
                          ...prev,
                          parameter: nextParameter,
                          item: nextItem,
                        }))
                      }}
                    >
                      {parameterOptions.map((parameter) => (
                        <option key={parameter} value={parameter}>{parameter}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Item
                    <select
                      value={transactionForm.item}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, item: event.target.value }))}
                    >
                      {itemOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Vendor
                    <input value={transactionForm.vendor} onChange={(event) => setTransactionForm({ ...transactionForm, vendor: event.target.value })} />
                  </label>
                  <label>
                    Quantity
                    <input type="number" value={transactionForm.quantity} onChange={(event) => setTransactionForm({ ...transactionForm, quantity: event.target.value })} />
                  </label>
                  <label>
                    Expected amount
                    <input type="number" value={transactionForm.expectedAmount} onChange={(event) => setTransactionForm({ ...transactionForm, expectedAmount: event.target.value })} />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Date
                    <input type="date" value={transactionForm.date} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} />
                  </label>
                  <label>
                    Payment method
                    <select value={transactionForm.paymentMethod} onChange={(event) => setTransactionForm({ ...transactionForm, paymentMethod: event.target.value })}>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                  </label>
                </div>

                <div className="field-row">
                  <label className="full-width">
                    Remarks
                    <textarea rows="3" value={transactionForm.remarks} onChange={(event) => setTransactionForm({ ...transactionForm, remarks: event.target.value })} />
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-button">Save transaction</button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header-row compact">
                <div>
                  <p className="eyebrow">records</p>
                  <h3>{currentUser.role === 'employee' ? 'My transaction history' : 'Transaction history'}</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Project</th>
                      <th>Item</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Employee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentUser.role === 'employee' ? employeeHistoryTransactions : visibleTransactions).map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.type || 'Outflow'}</td>
                        <td>{transaction.project}</td>
                        <td>{transaction.item}</td>
                        <td>{transaction.vendor}</td>
                        <td>{transaction.date}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td><span className={`badge ${transaction.status.toLowerCase()}`}>{transaction.status}</span></td>
                        <td>{transaction.employee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'Invoices' && (
          <section className="panel form-panel">
            <div className="panel-header-row compact">
              <div>
                <p className="eyebrow">finance</p>
                <h3>Invoice upload</h3>
              </div>
            </div>

            <form onSubmit={handleAddInvoice} className="transaction-form">
              <div className="field-row">
                <label>
                  Transaction ID
                  <select value={invoiceForm.transactionId} onChange={(event) => setInvoiceForm({ ...invoiceForm, transactionId: event.target.value })}>
                    <option value="">Select approved transaction</option>
                    {invoiceReadyTransactionOptions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>{transaction.id}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Project
                  <input value={invoiceForm.project} onChange={(event) => setInvoiceForm({ ...invoiceForm, project: event.target.value })} />
                </label>
                <label>
                  Vendor
                  <input value={invoiceForm.vendor} onChange={(event) => setInvoiceForm({ ...invoiceForm, vendor: event.target.value })} />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Amount
                  <input type="number" value={invoiceForm.amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, amount: event.target.value })} />
                </label>
                <label>
                  Date
                  <input type="date" value={invoiceForm.date} onChange={(event) => setInvoiceForm({ ...invoiceForm, date: event.target.value })} />
                </label>
                <label>
                  PDF document
                  <input type="file" accept="application/pdf" onChange={(event) => setInvoiceForm({ ...invoiceForm, file: event.target.files?.[0] || null })} />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">Save invoice</button>
              </div>
            </form>

            <div className="mt-16">
              <h3>Invoice ledger</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Transaction</th>
                      <th>Project</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{invoice.transactionId}</td>
                        <td>{invoice.project}</td>
                        <td>{invoice.vendor}</td>
                        <td>{formatCurrency(invoice.amount)}</td>
                        <td><span className={`badge ${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                        <td>{invoice.documentData ? <a href={invoice.documentData} target="_blank" rel="noreferrer">View PDF</a> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Payments' && (
          <section className="panel form-panel">
            <div className="panel-header-row compact">
              <div>
                <p className="eyebrow">finance</p>
                <h3>Payment entry</h3>
              </div>
            </div>

            <form onSubmit={handleAddPayment} className="transaction-form">
              <div className="field-row">
                <label>
                  Transaction ID
                  <select value={paymentForm.transactionId} onChange={(event) => setPaymentForm({ ...paymentForm, transactionId: event.target.value })}>
                    <option value="">Select transaction</option>
                    {data.transactions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>{transaction.id}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Project
                  <input value={paymentForm.project} onChange={(event) => setPaymentForm({ ...paymentForm, project: event.target.value })} />
                </label>
                <label>
                  Vendor
                  <input value={paymentForm.vendor} onChange={(event) => setPaymentForm({ ...paymentForm, vendor: event.target.value })} />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Amount
                  <input type="number" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} />
                </label>
                <label>
                  Date
                  <input type="date" value={paymentForm.date} onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value })} />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">Save payment</button>
              </div>
            </form>

            <div className="mt-16">
              <h3>Payment ledger</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Transaction</th>
                      <th>Project</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>{payment.transactionId}</td>
                        <td>{payment.project}</td>
                        <td>{payment.vendor}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td><span className={`badge ${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Approvals' && (
          <section className="panel">
            <div className="panel-header-row compact">
              <div>
                <p className="eyebrow">review</p>
                <h3>Approval queue</h3>
              </div>
            </div>
            <div className="approval-list">
              {approvalQueue.length === 0 ? (
                <div className="approval-item"><p>No pending approvals.</p></div>
              ) : approvalQueue.map((item) => (
                <div key={item.id} className="approval-item">
                  <div className="approval-head">
                    <strong>{item.id}</strong>
                    <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                  </div>
                  <p>{item.employee} · {item.project}</p>
                  <div className="approval-meta">
                    <span>{formatCurrency(item.amount)}</span>
                    <small>{item.parameter}</small>
                  </div>
                  <div className="approval-actions">
                    <button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); handleApproval(item.id, 'Approved') }}>Approve</button>
                    <button type="button" className="primary-button" onClick={(event) => { event.stopPropagation(); handleApproval(item.id, 'Rejected') }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Log' && (
          <>
            <section className="panel form-panel">
              <div className="panel-header-row compact">
                <div>
                  <p className="eyebrow">transaction log</p>
                  <h3>Create transaction</h3>
                </div>
              </div>

              <form onSubmit={currentUser.role === 'team_lead' && selectedTransaction?.status === 'Approved' ? handleOrderFromApprovedForm : handleAddTransaction} className="transaction-form">
                <div className="field-row">
                  <label>
                    Type
                    <select
                      value={transactionForm.type}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      <option value="Inflow">Inflow</option>
                      <option value="Outflow">Outflow</option>
                    </select>
                  </label>
                  <label>
                    Project
                    <select
                      value={transactionForm.project}
                      onChange={(event) => {
                        const nextProject = event.target.value
                        const nextEntries = fallbackProjectMaster[nextProject] ?? []
                        const nextParameter = nextEntries[0]?.parameter ?? ''
                        const nextItem = nextEntries[0]?.items?.[0] ?? ''
                        setTransactionForm((prev) => ({
                          ...prev,
                          project: nextProject,
                          parameter: nextParameter,
                          item: nextItem,
                        }))
                      }}
                    >
                      {projectOptions.map((project) => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Parameter
                    <select
                      value={transactionForm.parameter}
                      onChange={(event) => {
                        const nextParameter = event.target.value
                        const nextItem = fallbackProjectMaster[transactionForm.project]?.find(
                          (entry) => entry.parameter === nextParameter,
                        )?.items?.[0] ?? ''
                        setTransactionForm((prev) => ({
                          ...prev,
                          parameter: nextParameter,
                          item: nextItem,
                        }))
                      }}
                    >
                      {parameterOptions.map((parameter) => (
                        <option key={parameter} value={parameter}>{parameter}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Item
                    <select
                      value={transactionForm.item}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, item: event.target.value }))}
                    >
                      {itemOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  {!currentUser.role || currentUser.role !== 'employee' ? (
                    <label>
                      Vendor
                      <input value={transactionForm.vendor} onChange={(event) => setTransactionForm({ ...transactionForm, vendor: event.target.value })} />
                    </label>
                  ) : null}
                  <label>
                    Quantity
                    <input type="number" value={transactionForm.quantity} onChange={(event) => setTransactionForm({ ...transactionForm, quantity: event.target.value })} />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Amount
                    <input type="number" value={transactionForm.expectedAmount} onChange={(event) => setTransactionForm({ ...transactionForm, expectedAmount: event.target.value })} />
                  </label>
                  <label>
                    Date
                    <input type="date" value={transactionForm.date} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} />
                  </label>
                  {!currentUser.role || currentUser.role !== 'employee' ? (
                    <label>
                      Payment method
                      <select value={transactionForm.paymentMethod} onChange={(event) => setTransactionForm({ ...transactionForm, paymentMethod: event.target.value })}>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="field-row">
                  <label className="full-width">
                    Remarks
                    <textarea rows="4" value={transactionForm.remarks} onChange={(event) => setTransactionForm({ ...transactionForm, remarks: event.target.value })} />
                  </label>
                </div>

                <div className="form-actions">
                  {currentUser.role === 'team_lead' && selectedTransaction?.status === 'Approved' ? (
                    <button type="submit" className="primary-button">Place order</button>
                  ) : currentUser.role === 'employee' ? (
                    <button type="submit" className="primary-button">Place a request</button>
                  ) : (
                    <button type="submit" className="primary-button">Save transaction</button>
                  )}
                </div>
              </form>
            </section>

            {currentUser.role === 'employee' && (
              <section className="panel form-panel">
                <form onSubmit={handlePasswordChange} className="password-form mt-16">
                  <h3>Change password</h3>
                  <div className="field-row">
                    <label>
                      Current password
                      <input type="password" value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} />
                    </label>
                    <label>
                      New password
                      <input type="password" value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} />
                    </label>
                    <label>
                      Confirm password
                      <input type="password" value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="secondary-button">Update password</button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}

        {(activeTab === 'Log history' || activeTab === 'Logs') && (
          <section className="panel">
            <div className="panel-header-row compact">
              <div>
                <p className="eyebrow">history</p>
                <h3>{currentUser.role === 'employee' ? 'Your log history' : 'Activity log'}</h3>
              </div>
            </div>

            {currentUser.role === 'employee' ? (
              <div className="transaction-history-layout">
                <div className="transaction-history-list">
                  {employeeHistoryTransactions.length === 0 ? (
                    <div className="empty-state">No transaction history yet.</div>
                  ) : employeeHistoryTransactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      className={selectedTransactionId === transaction.id ? 'transaction-history-item selected' : 'transaction-history-item'}
                      onClick={() => {
                        setSelectedTransactionId(transaction.id)
                        setEditDraft({ ...transaction })
                        setInvoiceForm((prev) => ({
                          ...prev,
                          transactionId: transaction.id,
                          project: transaction.project,
                          vendor: transaction.vendor,
                          amount: String(transaction.amount || ''),
                          date: transaction.date,
                          file: null,
                        }))
                      }}
                    >
                      <div className="transaction-history-header">
                        <strong>{transaction.id}</strong>
                        <span className={`badge ${transaction.status.toLowerCase()}`}>{transaction.status}</span>
                      </div>
                      <p>{transaction.project} · {transaction.item}</p>
                      <small>{transaction.date} · {formatCurrency(transaction.amount)}</small>
                    </button>
                  ))}
                </div>

                <div className="transaction-detail-panel">
                  {!selectedTransaction ? (
                    <div className="empty-state">Select a transaction to view details.</div>
                  ) : (
                    <>
                      <div className="detail-header">
                        <div>
                          <p className="eyebrow">transaction</p>
                          <h3>{selectedTransaction.id}</h3>
                        </div>
                        <span className={`badge ${selectedTransaction.status.toLowerCase()}`}>{selectedTransaction.status}</span>
                      </div>

                      <div className="transaction-detail-grid">
                        <div><span>Type</span><strong>{selectedTransaction.type || 'Outflow'}</strong></div>
                        <div><span>Project</span><strong>{selectedTransaction.project}</strong></div>
                        <div><span>Parameter</span><strong>{selectedTransaction.parameter}</strong></div>
                        <div><span>Item</span><strong>{selectedTransaction.item}</strong></div>
                        <div><span>Vendor</span><strong>{selectedTransaction.vendor}</strong></div>
                        <div><span>Quantity</span><strong>{selectedTransaction.quantity ?? '—'}</strong></div>
                        <div><span>Expected amount</span><strong>{formatCurrency(selectedTransaction.expectedAmount ?? selectedTransaction.amount ?? 0)}</strong></div>
                        <div><span>Date</span><strong>{selectedTransaction.date}</strong></div>
                        <div><span>Method</span><strong>{selectedTransaction.paymentMethod || 'Not set'}</strong></div>
                        <div><span>Delivery</span><strong>{selectedTransaction.modeOfDelivery || 'Not placed yet'}</strong></div>
                        <div><span>Received date</span><strong>{selectedTransaction.receivedOn || 'Not received yet'}</strong></div>
                        {selectedTransaction.orderAmount ? (<div><span>Actual amount</span><strong>{formatCurrency(selectedTransaction.orderAmount)}</strong></div>) : null}
                      </div>

                      <div className="detail-block">
                        <span>Remarks</span>
                        <p>{selectedTransaction.remarks || 'No remarks provided.'}</p>
                      </div>

                      {selectedTransaction.status === 'Rejected' && (
                        <form onSubmit={handleUpdateRejectedTransaction} className="transaction-form detail-form">
                          <div className="field-row">
                            <label>
                              Project
                              <select
                                value={editDraft?.project || selectedTransaction.project}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, project: event.target.value }))}
                              >
                                {projectOptions.map((project) => (
                                  <option key={project} value={project}>{project}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Parameter
                              <select
                                value={editDraft?.parameter || selectedTransaction.parameter}
                                onChange={(event) => {
                                  const nextParameter = event.target.value
                                  const nextItem = fallbackProjectMaster[editDraft?.project || selectedTransaction.project]?.find(
                                    (entry) => entry.parameter === nextParameter,
                                  )?.items?.[0] ?? ''
                                  setEditDraft((prev) => ({ ...prev, parameter: nextParameter, item: nextItem }))
                                }}
                              >
                                {(fallbackProjectMaster[editDraft?.project || selectedTransaction.project] || []).map((entry) => (
                                  <option key={entry.parameter} value={entry.parameter}>{entry.parameter}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Item
                              <select
                                value={editDraft?.item || selectedTransaction.item}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, item: event.target.value }))}
                              >
                                {(fallbackProjectMaster[editDraft?.project || selectedTransaction.project]?.find(
                                  (entry) => entry.parameter === (editDraft?.parameter || selectedTransaction.parameter),
                                )?.items || []).map((item) => (
                                  <option key={item} value={item}>{item}</option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="field-row">
                            <label>
                              Vendor
                              <input
                                value={editDraft?.vendor || selectedTransaction.vendor || ''}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, vendor: event.target.value }))}
                              />
                            </label>
                            <label>
                              Quantity
                              <input
                                type="number"
                                value={editDraft?.quantity ?? selectedTransaction.quantity ?? 1}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, quantity: event.target.value }))}
                              />
                            </label>
                            <label>
                              Expected amount
                              <input
                                type="number"
                                value={editDraft?.expectedAmount ?? selectedTransaction.expectedAmount ?? selectedTransaction.amount ?? ''}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, expectedAmount: event.target.value }))}
                              />
                            </label>
                          </div>

                          <div className="field-row">
                            <label>
                              Date
                              <input
                                type="date"
                                value={editDraft?.date || selectedTransaction.date}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, date: event.target.value }))}
                              />
                            </label>
                            <label className="full-width">
                              Remarks
                              <textarea
                                rows="3"
                                value={editDraft?.remarks || selectedTransaction.remarks || ''}
                                onChange={(event) => setEditDraft((prev) => ({ ...prev, remarks: event.target.value }))}
                              />
                            </label>
                          </div>

                          <div className="form-actions">
                            <button type="submit" className="primary-button">Save edited transaction</button>
                          </div>
                        </form>
                      )}

                      {selectedTransaction.status === 'Approved' && currentUser.role === 'team_lead' && (
                        <form className="invoice-upload-card" onSubmit={handlePlaceOrder}>
                          <div className="invoice-upload-header">
                            <div>
                              <p className="eyebrow">order</p>
                              <h3>Place order</h3>
                            </div>
                            <span className="upload-badge">Required</span>
                          </div>

                          <div className="field-row">
                            <label>
                              Actual amount
                              <input
                                type="number"
                                value={selectedTransaction.orderAmount ?? ''}
                                onChange={(event) => setData((prev) => ({
                                  ...prev,
                                  transactions: prev.transactions.map((transaction) =>
                                    transaction.id === selectedTransaction.id ? { ...transaction, orderAmount: event.target.value } : transaction,
                                  ),
                                }))}
                              />
                            </label>
                            <label>
                              Mode of delivery
                              <select
                                value={selectedTransaction.modeOfDelivery || 'Shipment'}
                                onChange={(event) => setData((prev) => ({
                                  ...prev,
                                  transactions: prev.transactions.map((transaction) =>
                                    transaction.id === selectedTransaction.id ? { ...transaction, modeOfDelivery: event.target.value } : transaction,
                                  ),
                                }))}
                              >
                                <option value="Portar">Portar</option>
                                <option value="Uber">Uber</option>
                                <option value="Shipment">Shipment</option>
                              </select>
                            </label>
                          </div>

                          <div className="form-actions">
                            <button type="submit" className="primary-button">Place order</button>
                          </div>
                        </form>
                      )}

                      {selectedTransaction.status === 'Ordered' && currentUser.role === 'employee' && (
                        <div className="invoice-upload-card">
                          <div className="invoice-upload-header">
                            <div>
                              <p className="eyebrow">order status</p>
                              <h3>Ordered</h3>
                            </div>
                            <span className="upload-badge">In transit</span>
                          </div>

                          <div className="detail-block">
                            <span>Delivery</span>
                            <p>{selectedTransaction.modeOfDelivery || 'Shipment'} · {formatCurrency(selectedTransaction.orderAmount ?? selectedTransaction.amount)}</p>
                          </div>

                          <div className="field-row">
                            <label>
                              Received date
                              <input
                                type="date"
                                value={receivedDate}
                                onChange={(event) => setReceivedDate(event.target.value)}
                              />
                            </label>
                          </div>

                          <div className="form-actions">
                            <button type="button" className="primary-button" onClick={() => handleMarkReceived(selectedTransaction.id, receivedDate)}>Mark as received</button>
                          </div>
                        </div>
                      )}

                      {(selectedTransaction.status === 'Received' && (currentUser.role === 'admin' || currentUser.role === 'team_lead')) && (
                        <form onSubmit={handleEmployeeInvoiceUpload} className="invoice-upload-card">
                          <div className="invoice-upload-header">
                            <div>
                              <p className="eyebrow">invoice</p>
                              <h3>Upload PDF</h3>
                            </div>
                            <span className="upload-badge">Required</span>
                          </div>

                          <div className="field-row">
                            <label>
                              Invoice date
                              <input
                                type="date"
                                value={invoiceForm.date || selectedTransaction.date}
                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, date: event.target.value }))}
                              />
                            </label>
                            <label>
                              Amount
                              <input
                                type="number"
                                value={invoiceForm.amount || String(selectedTransaction.orderAmount ?? selectedTransaction.amount ?? '')}
                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, amount: event.target.value }))}
                              />
                            </label>
                          </div>

                          <label className="upload-dropzone">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(event) => setInvoiceForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                            />
                            <span>{invoiceForm.file ? invoiceForm.file.name : 'Choose PDF invoice'}</span>
                          </label>

                          <div className="form-actions">
                            <button type="submit" className="primary-button">Upload invoice</button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="transaction-history-layout">
                <div className="transaction-history-list">
                  {visibleTransactions.length === 0 ? (
                    <div className="empty-state">No transactions in this date range.</div>
                  ) : visibleTransactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      className={selectedTransactionId === transaction.id ? 'transaction-history-item selected' : 'transaction-history-item'}
                      onClick={() => {
                        setSelectedTransactionId(transaction.id)
                        if (transaction.status === 'Approved') {
                          openOrderFormFromApprovedTransaction(transaction)
                        }
                        setEditDraft({ ...transaction })
                      }}
                    >
                      <div className="transaction-history-header">
                        <strong>{transaction.id}</strong>
                        <span className={`badge ${transaction.status.toLowerCase()}`}>{transaction.status}</span>
                      </div>
                      <p>{transaction.employee} · {transaction.project}</p>
                      <small>{transaction.date} · {formatCurrency(transaction.amount)}</small>
                    </button>
                  ))}
                </div>

                <div className="transaction-detail-panel">
                  {!selectedTransaction ? (
                    <div className="empty-state">Select a transaction to review the details.</div>
                  ) : (
                    <>
                      <div className="detail-header">
                        <div>
                          <p className="eyebrow">transaction</p>
                          <h3>{selectedTransaction.id}</h3>
                        </div>
                        <span className={`badge ${selectedTransaction.status.toLowerCase()}`}>{selectedTransaction.status}</span>
                      </div>

                      <div className="transaction-detail-grid">
                        <div><span>Type</span><strong>{selectedTransaction.type || 'Outflow'}</strong></div>
                        <div><span>Project</span><strong>{selectedTransaction.project}</strong></div>
                        <div><span>Parameter</span><strong>{selectedTransaction.parameter}</strong></div>
                        <div><span>Item</span><strong>{selectedTransaction.item}</strong></div>
                        <div><span>Vendor</span><strong>{selectedTransaction.vendor}</strong></div>
                        <div><span>Quantity</span><strong>{selectedTransaction.quantity ?? '—'}</strong></div>
                        <div><span>Expected amount</span><strong>{formatCurrency(selectedTransaction.expectedAmount ?? selectedTransaction.amount ?? 0)}</strong></div>
                        <div><span>Actual amount</span><strong>{selectedTransaction.orderAmount ? formatCurrency(selectedTransaction.orderAmount) : 'Not placed yet'}</strong></div>
                        <div><span>Received date</span><strong>{selectedTransaction.receivedOn || 'Not received yet'}</strong></div>
                      </div>

                      {selectedTransaction.status === 'Approved' && (
                        <div className="form-actions" style={{ marginTop: '1.25rem' }}>
                          <button type="button" className="primary-button" onClick={() => openOrderFormFromApprovedTransaction(selectedTransaction)}>Open order form</button>
                        </div>
                      )}

                      {(selectedTransaction.status === 'Received' && (currentUser.role === 'admin' || currentUser.role === 'team_lead')) && (
                        <form onSubmit={handleEmployeeInvoiceUpload} className="invoice-upload-card">
                          <div className="invoice-upload-header">
                            <div>
                              <p className="eyebrow">invoice</p>
                              <h3>Upload PDF</h3>
                            </div>
                            <span className="upload-badge">Required</span>
                          </div>

                          <div className="field-row">
                            <label>
                              Invoice date
                              <input
                                type="date"
                                value={invoiceForm.date || selectedTransaction.date}
                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, date: event.target.value }))}
                              />
                            </label>
                            <label>
                              Amount
                              <input
                                type="number"
                                value={invoiceForm.amount || String(selectedTransaction.orderAmount ?? selectedTransaction.amount ?? '')}
                                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, amount: event.target.value }))}
                              />
                            </label>
                          </div>

                          <label className="upload-dropzone">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(event) => setInvoiceForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                            />
                            <span>{invoiceForm.file ? invoiceForm.file.name : 'Choose PDF invoice'}</span>
                          </label>

                          <div className="form-actions">
                            <button type="submit" className="primary-button">Upload invoice</button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
