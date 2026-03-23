const TABS = [
  { id: 'entry',    label: 'บันทึกมิเตอร์' },
  { id: 'summary',  label: 'สรุปเดือน' },
  { id: 'payment',  label: 'การชำระเงิน' },
  { id: 'history',  label: 'ประวัติ' },
  { id: 'roomcfg',  label: 'ตั้งค่าห้อง' },
  { id: 'settings', label: 'ตั้งค่าทั่วไป' },
]

function Navbar({ currentPage, onChangePage }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChangePage(tab.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            currentPage === tab.id
              ? 'bg-blue-700 text-white'
              : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default Navbar