import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'
import BillModal from '../components/BillModal'

const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const now = new Date()

function PaymentPage() {
    const { waterRate, elecRate } = useRates()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [billData, setBillData] = useState(null)
    const [dormInfo, setDormInfo] = useState({})

    useEffect(() => { fetchData() }, [month, year, waterRate, elecRate])


    async function fetchData() {
        setLoading(true)


        const [
            { data: rooms },
            { data: current },
            { data: previous },
            { data: allPrevious },
            { data: payments },
            { data: infoData },
        ] = await Promise.all([
            supabase.from('rooms').select('*').order('room_number'),
            supabase.from('meter_readings').select('*').eq('month', month).eq('year', year),
            supabase.from('meter_readings').select('*')
                .eq('month', month === 1 ? 12 : month - 1)
                .eq('year', month === 1 ? year - 1 : year),
            supabase.from('meter_readings').select('*')
                .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
                .order('year', { ascending: false })
                .order('month', { ascending: false }),
            supabase.from('payments').select('*').eq('month', month).eq('year', year),
            supabase.from('settings_text').select('*'),
        ])

        if (infoData) {
            const obj = {}
            infoData.forEach((r) => { obj[r.key] = r.value })
            obj.waterRate = waterRate
            obj.elecRate = elecRate
            setDormInfo(obj)
        }

        const result = (rooms ?? []).map((room) => {
            const cur = current?.find((r) => r.room_id === room.id)

            // หา prev จาก previous ก่อน ถ้าไม่มีค่อยหาจาก allPrevious
            const prev = previous?.find((r) => r.room_id === room.id)
                ?? allPrevious?.find((r) => r.room_id === room.id)

            const pay = payments?.find((r) => r.room_id === room.id)

            const usedWater = cur && prev ? Math.max(0, cur.water_meter - prev.water_meter) : null
            const usedElec = cur && prev ? Math.max(0, cur.elec_meter - prev.elec_meter) : null
            const billWater = usedWater !== null ? usedWater * waterRate : null
            const billElec = usedElec !== null ? usedElec * elecRate : null
            const fixed = room.rent + room.common_fee + room.parking_fee + room.extra_fee
            const total = billWater !== null ? fixed + billWater + billElec : fixed

            return {
                roomId: room.id,
                roomNumber: room.room_number,
                rent: room.rent,
                commonFee: room.common_fee,
                parkingFee: room.parking_fee,
                extraFee: room.extra_fee,
                total,
                hasMeter: cur !== undefined,
                paid: pay?.paid ?? false,
                paidAt: pay?.paid_at ?? null,
                note: room.note ?? '',
                prevWater: prev?.water_meter ?? null,
                newWater: cur?.water_meter ?? null,
                prevElec: prev?.elec_meter ?? null,
                newElec: cur?.elec_meter ?? null,
                usedWater,
                usedElec,
                billWater,
                billElec,
                month,
                year,
            }
        })

        setRows(result)
        setLoading(false)
    }

    async function togglePaid(row) {
        const newPaid = !row.paid
        const paidAt = newPaid ? new Date().toISOString() : null

        await supabase.from('payments').upsert({
            room_id: row.roomId,
            month, year,
            paid: newPaid,
            paid_at: paidAt,
        }, { onConflict: 'room_id,month,year' })

        setRows((prev) =>
            prev.map((r) =>
                r.roomId === row.roomId ? { ...r, paid: newPaid, paidAt } : r
            )
        )
    }

    async function saveNote(row, note) {
        await supabase
            .from('rooms')
            .update({ note })
            .eq('id', row.roomId)
    }

    // 3. openBill
    function openBill(row) {
        setBillData(row)
    }

    const paidCount = rows.filter((r) => r.paid).length
    const unpaidCount = rows.filter((r) => !r.paid).length
    const totalPaid = rows.filter((r) => r.paid).reduce((s, r) => s + r.total, 0)

    if (loading) return <div className="text-sm text-slate-400 py-8 text-center">กำลังโหลด...</div>

    return (
        <div className="space-y-4">

            {/* เลือกเดือน */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4">
                <div className="flex gap-3 items-center flex-wrap">
                    <span className="text-sm text-slate-500 font-medium">เดือน:</span>
                    <select value={month} onChange={(e) => setMonth(+e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                        {MONTHS.map((name, i) => (
                            <option key={i + 1} value={i + 1}>{name}</option>
                        ))}
                    </select>
                    <select value={year} onChange={(e) => setYear(+e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* metric cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-xs text-slate-400 mb-1">จ่ายแล้ว</div>
                    <div className="text-xl font-semibold text-green-600">{paidCount} ห้อง</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-xs text-slate-400 mb-1">ยังไม่จ่าย</div>
                    <div className="text-xl font-semibold text-amber-500">{unpaidCount} ห้อง</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-xs text-slate-400 mb-1">รับเงินแล้ว</div>
                    <div className="text-xl font-semibold text-blue-700">{totalPaid.toLocaleString()} ฿</div>
                </div>
            </div>

            {/* ตาราง */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden whitespace-nowrap">
                <table className="min-w-[700px] w-full text-sm">
                    <colgroup>
                        <col style={{ width: '70px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '90px' }} />
                        <col />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '70px' }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-blue-800 text-white text-xs">
                            <th className="text-left px-3 py-2">ห้อง</th>
                            <th className="text-right px-3 py-2">ยอดรวม</th>
                            <th className="text-center px-3 py-2">มิเตอร์</th>
                            <th className="text-left px-3 py-2">หมายเหตุ</th>
                            <th className="text-center px-3 py-2">วันที่จ่าย</th>
                            <th className="text-center px-3 py-2">สถานะ</th>
                            <th className="text-center px-3 py-2">ใบบิล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.roomId}
                                style={{ backgroundColor: i % 2 === 1 ? '#eff6ff' : '#ffffff' }}
                                className="border-b hover:bg-blue-50 transition-colors"
                            >
                                <td className="px-3 py-2 font-semibold text-blue-900">{row.roomNumber}</td>
                                <td className="px-3 py-2 text-right">
                                    <div className="font-medium">{row.total.toLocaleString()} ฿</div>
                                    {!row.hasMeter && <div className="text-xs text-amber-400">*ไม่มีมิเตอร์</div>}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {row.hasMeter
                                        ? <span className="text-green-500 text-xs font-medium">✓ มีข้อมูล</span>
                                        : <span className="text-slate-300 text-xs">—</span>
                                    }
                                </td>
                                <td className="px-3 py-2">
                                    <input type="text" defaultValue={row.note}
                                        onBlur={(e) => saveNote(row, e.target.value)}
                                        placeholder="หมายเหตุ"
                                        className="border border-slate-200 rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:border-blue-300" />
                                </td>
                                <td className="px-3 py-2 text-center text-xs text-slate-400">
                                    {row.paidAt
                                        ? new Date(row.paidAt).toLocaleDateString('th-TH', {
                                            day: 'numeric', month: 'short', year: '2-digit'
                                        })
                                        : '—'
                                    }
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => togglePaid(row)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors w-full ${row.paid
                                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                            : 'bg-white text-amber-500 border-amber-300 hover:border-blue-400 hover:text-blue-600'
                                            }`}>
                                        {row.paid ? '✓ จ่ายแล้ว' : 'ยังไม่จ่าย'}
                                    </button>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => openBill(row)}
                                        className="text-xs px-2 py-1 border border-slate-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors">
                                        ปริ้น
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bill Modal */}
            {billData && (
                <BillModal
                    bill={billData}
                    info={dormInfo}
                    onClose={() => setBillData(null)}
                />
            )}
        </div>
    )
}

export default PaymentPage