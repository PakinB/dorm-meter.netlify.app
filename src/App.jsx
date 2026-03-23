import { useState } from 'react'
import Navbar from './components/Navbar'
import EntryPage from './pages/EntryPage'
import SummaryPage from './pages/SummaryPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingPage'
import RoomCfgPage from './pages/RoomCfgPage'
import PaymentPage from './pages/PaymentPage'

function App() {
  const [page, setPage] = useState('entry')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-blue-800 text-white px-6 py-4 shadow">
        <h1 className="text-lg font-semibold tracking-wide">ระบบจดมิเตอร์หอพัก</h1>
      </div>

      {/* Navbar */}
      <div className="bg-white border-b shadow-sm px-6 py-3">
        <Navbar currentPage={page} onChangePage={setPage} />
      </div>

      {/* Content — เพิ่ม mt-6 */}
      <div className="max-w-5xl mx-auto px-6 py-6 mt-2">
        {page === 'entry' && <EntryPage />}
        {page === 'summary' && <SummaryPage />}
        {page === 'payment' && <PaymentPage />}
        {page === 'history' && <HistoryPage />}
        {page === 'roomcfg' && <RoomCfgPage />}
        {page === 'settings' && <SettingsPage />}
      </div>
    </div>
  )
}

export default App