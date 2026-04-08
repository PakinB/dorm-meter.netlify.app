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
    <div className="app-shell">
      <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 text-white shadow-lg">
        <div className="page-wrap py-5 sm:py-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200"></p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">ระบบจดมิเตอร์หอพัก</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                
              </p>
            </div>
           
          </div>
        </div>
      </div>

      <div className="page-wrap pt-4">
        <div className="glass-panel rounded-[28px] p-3 sm:p-4">
          <Navbar currentPage={page} onChangePage={setPage} />
        </div>
      </div>

      <div className="page-wrap pb-8 pt-4">
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
