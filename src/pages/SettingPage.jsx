import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SettingsPage() {
  const [rates, setRates] = useState({ waterRate: 18, elecRate: 8 })
  const [info,  setInfo]  = useState({
    dorm_name: '', dorm_address: '',
    bank_name: '', bank_number: '', bank_account: '', promptpay: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: rateData } = await supabase.from('settings').select('*')
    const { data: infoData  } = await supabase.from('settings_text').select('*')

    if (rateData) {
      const w = rateData.find((r) => r.key === 'water_rate')
      const e = rateData.find((r) => r.key === 'elec_rate')
      setRates({ waterRate: w?.value ?? 18, elecRate: e?.value ?? 8 })
    }
    if (infoData) {
      const obj = {}
      infoData.forEach((r) => { obj[r.key] = r.value })
      setInfo((prev) => ({ ...prev, ...obj }))
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('settings')
      .upsert({ key: 'water_rate', value: rates.waterRate }, { onConflict: 'key' })
    await supabase.from('settings')
      .upsert({ key: 'elec_rate',  value: rates.elecRate  }, { onConflict: 'key' })

    for (const [key, value] of Object.entries(info)) {
      await supabase.from('settings_text')
        .upsert({ key, value }, { onConflict: 'key' })
    }
    setSaving(false)
    setMsg('บันทึกแล้ว ✓')
    setTimeout(() => setMsg(''), 2000)
  }

  if (loading) return <div className="text-sm text-slate-400 py-8 text-center">กำลังโหลด...</div>

  return (
    <div className="space-y-4 max-w-lg">

      {/* ราคามิเตอร์ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50">
          <p className="text-sm font-medium text-slate-600">ราคามิเตอร์ต่อหน่วย</p>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">ค่าน้ำ (฿/หน่วย)</label>
            <input type="number" value={rates.waterRate}
              onChange={(e) => setRates((p) => ({ ...p, waterRate: +e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">ค่าไฟ (฿/หน่วย)</label>
            <input type="number" value={rates.elecRate}
              onChange={(e) => setRates((p) => ({ ...p, elecRate: +e.target.value }))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </div>

      {/* ข้อมูลหอพัก */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50">
          <p className="text-sm font-medium text-slate-600">ข้อมูลหอพัก (แสดงในใบบิล)</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { key: 'dorm_name',    label: 'ชื่อหอพัก' },
            { key: 'dorm_address', label: 'ที่อยู่' },
            { key: 'bank_name',    label: 'ชื่อธนาคาร' },
            { key: 'bank_number',  label: 'เลขบัญชี' },
            { key: 'bank_account', label: 'ชื่อบัญชี' },
            { key: 'promptpay',    label: 'เบอร์ PromptPay' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-slate-500 block mb-1">{label}</label>
              <input type="text" value={info[key] ?? ''}
                onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-5 py-2 bg-blue-800 text-white text-sm rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
          {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
        {msg && <span className="text-green-600 text-sm font-medium">{msg}</span>}
      </div>
    </div>
  )
}

export default SettingsPage