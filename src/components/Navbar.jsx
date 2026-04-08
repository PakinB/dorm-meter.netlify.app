const TABS = [
  { id: 'entry', label: 'บันทึกมิเตอร์' },
  { id: 'summary', label: 'สรุปรายเดือน' },
  { id: 'payment', label: 'การชำระเงิน' },
  { id: 'history', label: 'ประวัติ' },
  { id: 'roomcfg', label: 'ตั้งค่าห้อง' },
  { id: 'settings', label: 'ตั้งค่าทั่วไป' },
]

function Navbar({ currentPage, onChangePage }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChangePage(tab.id)}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all sm:px-5 ${
            currentPage === tab.id
              ? 'bg-blue-800 text-white shadow-md shadow-blue-900/20'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:ring-blue-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default Navbar
