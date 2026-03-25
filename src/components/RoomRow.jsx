import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
function formatNum(val) {
    if (val === '' || val === null || val === undefined) return ''
    return Number(val).toLocaleString()
}

function RoomRow({ roomId, roomNumber, month, year, stripe, waterRate, elecRate }) {
    const [prevWater, setPrevWater] = useState('')
    const [prevElec, setPrevElec] = useState('')
    const [newWater, setNewWater] = useState('')
    const [newElec, setNewElec] = useState('')
    const [saved, setSaved] = useState(false)
    const [toast, setToast] = useState(null)

    function showToast(msg, type = 'success') {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 2500)
    }


    useEffect(() => { fetchMeterData() }, [month, year])

    async function fetchMeterData() {
        setSaved(false)
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year

        // ดึงเดือนก่อนตรงๆ ก่อน
        const { data: prevData } = await supabase
            .from('meter_readings')
            .select('water_meter, elec_meter')
            .eq('room_id', roomId)
            .eq('month', prevMonth)
            .eq('year', prevYear)
            .maybeSingle()

        if (prevData) {
            setPrevWater(prevData.water_meter ?? '')
            setPrevElec(prevData.elec_meter ?? '')
        } else {
            // หาข้อมูลล่าสุดที่มีก่อนเดือนนี้
            const { data: sameYearData } = await supabase
                .from('meter_readings')
                .select('water_meter, elec_meter')
                .eq('room_id', roomId)
                .eq('year', year)
                .lt('month', month)
                .order('month', { ascending: false })
                .limit(1)
                .maybeSingle()

            const { data: prevYearData } = await supabase
                .from('meter_readings')
                .select('water_meter, elec_meter')
                .eq('room_id', roomId)
                .lt('year', year)
                .order('year', { ascending: false })
                .order('month', { ascending: false })
                .limit(1)
                .maybeSingle()

            const latest = sameYearData ?? prevYearData

            setPrevWater(latest?.water_meter ?? '')
            setPrevElec(latest?.elec_meter ?? '')
        }

        // ดึงข้อมูลเดือนนี้
        const { data: curData } = await supabase
            .from('meter_readings')
            .select('water_meter, elec_meter')
            .eq('room_id', roomId)
            .eq('month', month)
            .eq('year', year)
            .maybeSingle()

        if (curData) {
            setNewWater(curData.water_meter ?? '')
            setNewElec(curData.elec_meter ?? '')
            setSaved(true)
        } else {
            setNewWater('')
            setNewElec('')
            setSaved(false)
        }
    }

    async function handleSave() {
        const { error } = await supabase
            .from('meter_readings')
            .upsert({
                room_id: roomId,
                month,
                year,
                water_meter: +newWater,
                elec_meter: +newElec,
            }, { onConflict: 'room_id,month,year' })

        if (!error) {
            setSaved(true)
            showToast(`บันทึกห้อง ${roomNumber} สำเร็จ`)
        } else {
            showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error')
        }
    }

    const usedWater = newWater !== '' && prevWater !== ''
        ? Math.max(0, +newWater - +prevWater)
        : null
    const usedElec = newElec !== '' && prevElec !== ''
        ? Math.max(0, +newElec - +prevElec)
        : null
    const total = usedWater !== null && usedElec !== null
        ? usedWater * waterRate + usedElec * elecRate
        : null

    return (

        <div
            style={{ backgroundColor: stripe ? '#eff6ff' : '#ffffff' }}
            className="grid grid-cols-6 gap-2 px-4 py-2 border-b items-center hover:bg-blue-100 transition-colors"
        >
            <span className="text-sm font-semibold text-blue-900">ห้อง {roomNumber}</span>

            {/* น้ำ ก่อน */}
            <input
                type="text"
                value={prevWater !== '' ? formatNum(prevWater) : ''}
                onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (!isNaN(raw)) { setPrevWater(raw); setSaved(false) }
                }}
                placeholder="—"
                className="border border-slate-200 rounded-md px-2 py-1 text-sm w-full bg-slate-50 text-slate-500 focus:outline-none focus:border-blue-300"
            />

            {/* น้ำ ใหม่ */}
            <input
                type="text"
                value={newWater !== '' ? formatNum(newWater) : ''}
                onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (!isNaN(raw)) { setNewWater(raw); setSaved(false) }
                }}
                placeholder="กรอก"
                className="border border-slate-300 rounded-md px-2 py-1 text-sm w-full bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />

            {/* ไฟ ก่อน */}
            <input
                type="text"
                value={prevElec !== '' ? formatNum(prevElec) : ''}
                onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (!isNaN(raw)) { setPrevElec(raw); setSaved(false) }
                }}
                placeholder="—"
                className="border border-slate-200 rounded-md px-2 py-1 text-sm w-full bg-slate-50 text-slate-500 focus:outline-none focus:border-blue-300"
            />

            {/* ไฟ ใหม่ */}
            <input
                type="text"
                value={newElec !== '' ? formatNum(newElec) : ''}
                onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (!isNaN(raw)) { setNewElec(raw); setSaved(false) }
                }}
                placeholder="กรอก"
                className="border border-slate-300 rounded-md px-2 py-1 text-sm w-full bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />

            <div className="flex items-center gap-2 justify-between w-full whitespace-nowrap ">
                <span className={`text-sm font-medium ${total !== null ? 'text-blue-700' : 'text-slate-300'}`}>
                    {total !== null ? `${total.toLocaleString()} ฿` : '—'}
                </span>

                {saved ? (
                    // บันทึกแล้ว — แสดง 2 ปุ่ม
                    <div className="flex flex-wrap gap-1 justify-end">
                        <span className="text-xs px-2 py-0.5 rounded-full border border-green-300 text-green-700 bg-green-50 whitespace-nowrap">
                            บันทึกแล้ว
                        </span>
                        <button
                            onClick={() => setSaved(false)}
                            className="text-xs px-2 py-0.5 rounded-full border border-orange-300 text-orange-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            แก้ไข
                        </button>
                    </div>
                ) : (
                    // ยังไม่บันทึก — แสดงปุ่มบันทึก
                    <button
                        onClick={handleSave}
                        className="text-xs px-2.5 py-1 rounded-full border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium transition-colors whitespace-nowrap"
                    >
                        บันทึก
                    </button>
                )}
            </div>
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '999px',
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    background: toast.type === 'success' ? '#1e3a8a' : '#dc2626',
                    color: 'white',
                    animation: 'slideUp 0.2s ease',
                }}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
                </div>
            )}

            <style>{`
            @keyframes slideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(12px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            `}</style>
        </div>
    )
}

export default RoomRow