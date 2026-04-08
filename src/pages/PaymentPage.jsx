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

    function openBill(row) {
        setBillData(row)
    }

    const paidCount = rows.filter((r) => r.paid).length
    const unpaidCount = rows.filter((r) => !r.paid).length
    const totalPaid = rows.filter((r) => r.paid).reduce((s, r) => s + r.total, 0)

    if (loading) return <div className="py-10 text-center text-base font-medium text-slate-500">กำลังโหลด...</div>

    return (
        <div className="space-y-4">
            <div className="section-heading">
                <div>
                    <h2 className="section-title">การชำระเงิน</h2>
                    <p className="section-subtitle">ตรวจสถานะการจ่ายเงิน ออกใบบิล และติดตามห้องที่ยังไม่ได้ชำระ</p>
                </div>
            </div>

            <div className="soft-card px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="text-base font-semibold text-slate-700">เลือกเดือน</span>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select value={month} onChange={(e) => setMonth(+e.target.value)}
                            className="input-comfort min-w-[180px]">
                            {MONTHS.map((name, i) => (
                                <option key={i + 1} value={i + 1}>{name}</option>
                            ))}
                        </select>
                        <select value={year} onChange={(e) => setYear(+e.target.value)}
                            className="input-comfort min-w-[140px]">
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="metric-card p-5">
                    <div className="metric-label">จ่ายแล้ว</div>
                    <div className="metric-value text-green-700">{paidCount} ห้อง</div>
                </div>
                <div className="metric-card p-5">
                    <div className="metric-label">ยังไม่จ่าย</div>
                    <div className="metric-value text-amber-600">{unpaidCount} ห้อง</div>
                </div>
                <div className="metric-card p-5">
                    <div className="metric-label">รับเงินแล้ว</div>
                    <div className="metric-value">{totalPaid.toLocaleString()} บาท</div>
                </div>
            </div>

            <div className="table-shell bg-white whitespace-nowrap">
                <div className="mobile-scroll overflow-x-auto">
                    <table className="min-w-[760px] w-full text-sm">
                        <colgroup>
                            <col style={{ width: '84px' }} />
                            <col style={{ width: '132px' }} />
                            <col style={{ width: '96px' }} />
                            <col />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '124px' }} />
                            <col style={{ width: '94px' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-blue-800 text-sm text-white">
                                <th className="sticky left-0 z-20 bg-blue-800 px-3 py-3 text-left shadow-[inset_-1px_0_0_#1d4ed8]">ห้อง</th>
                                <th className="px-3 py-3 text-right">ยอดรวม</th>
                                <th className="px-3 py-3 text-center">มิเตอร์</th>
                                <th className="px-3 py-3 text-left">หมายเหตุ</th>
                                <th className="px-3 py-3 text-center">วันที่จ่าย</th>
                                <th className="px-3 py-3 text-center">สถานะ</th>
                                <th className="px-3 py-3 text-center">ใบแจ้งหนี้</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => {
                                const rowBackground = i % 2 === 1 ? '#eff6ff' : '#ffffff'

                                return (
                                    <tr
                                        key={row.roomId}
                                        style={{ backgroundColor: rowBackground }}
                                        className="border-b border-blue-50 transition-colors hover:bg-blue-50"
                                    >
                                        <td
                                            style={{ backgroundColor: rowBackground }}
                                            className="sticky left-0 z-10 px-3 py-3 font-semibold text-blue-900 shadow-[inset_-1px_0_0_#dbeafe]"
                                        >
                                            {row.roomNumber}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="font-semibold">{row.total.toLocaleString()} ฿</div>
                                            {!row.hasMeter && <div className="text-xs text-amber-500">*ยังไม่มีข้อมูลมิเตอร์</div>}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {row.hasMeter
                                                ? <span className="text-sm font-medium text-green-600">✓ มีข้อมูล</span>
                                                : <span className="text-sm text-slate-300">—</span>
                                            }
                                        </td>
                                        <td className="px-3 py-3">
                                            <input
                                                type="text"
                                                defaultValue={row.note}
                                                onBlur={(e) => saveNote(row, e.target.value)}
                                                placeholder="หมายเหตุ"
                                                className="min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-center text-sm text-slate-500">
                                            {row.paidAt
                                                ? new Date(row.paidAt).toLocaleDateString('th-TH', {
                                                    day: 'numeric', month: 'short', year: '2-digit'
                                                })
                                                : '—'
                                            }
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={() => togglePaid(row)}
                                                className={`w-full rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${row.paid
                                                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'border-amber-300 bg-white text-amber-500 hover:border-blue-400 hover:text-blue-600'
                                                    }`}
                                            >
                                                {row.paid ? '✓ จ่ายแล้ว' : 'ยังไม่จ่าย'}
                                            </button>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={() => openBill(row)}
                                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium transition-colors hover:border-blue-400 hover:text-blue-600"
                                            >
                                                เปิดบิล
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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
