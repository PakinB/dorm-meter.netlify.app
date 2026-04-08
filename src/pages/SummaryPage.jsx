import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'

const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const now = new Date()

function SummaryPage() {
    const { waterRate, elecRate, loading: ratesLoading } = useRates()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (ratesLoading) return
        fetchSummary()
    }, [month, year, waterRate, elecRate, ratesLoading])

    async function fetchSummary() {
        setLoading(true)

        const { data: rooms } = await supabase
            .from('rooms').select('*').order('room_number')

        const { data: current } = await supabase
            .from('meter_readings').select('*')
            .eq('month', month).eq('year', year)

        const { data: allPrev } = await supabase
            .from('meter_readings').select('*')
            .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        const summary = (rooms ?? []).map((room) => {
            const cur = current?.find((r) => r.room_id === room.id)
            const prev = allPrev?.find((r) => r.room_id === room.id)

            const usedWater = cur && prev ? Math.max(0, cur.water_meter - prev.water_meter) : null
            const usedElec = cur && prev ? Math.max(0, cur.elec_meter - prev.elec_meter) : null
            const billWater = usedWater !== null ? usedWater * waterRate : null
            const billElec = usedElec !== null ? usedElec * elecRate : null
            const fixed = room.rent + room.common_fee + room.parking_fee + room.extra_fee
            const total = billWater !== null ? fixed + billWater + billElec : null

            return {
                roomNumber: room.room_number,
                rent: room.rent,
                commonFee: room.common_fee,
                parkingFee: room.parking_fee,
                extraFee: room.extra_fee,
                usedWater,
                usedElec,
                billWater,
                billElec,
                total,
            }
        })

        setRows(summary)
        setLoading(false)
    }

    const grandTotal = rows.reduce((sum, r) => sum + (r.total ?? 0), 0)
    const filledRooms = rows.filter((r) => r.total !== null).length

    function exportCSV() {
        const header = 'ห้อง,ค่าเช่า,ส่วนกลาง,ค่าอื่นๆ,น้ำ(หน่วย),ค่าน้ำ,ไฟ(หน่วย),ค่าไฟ,รวม'

        const csvRows = rows.map((r) =>
            [
                r.roomNumber,
                r.rent,
                r.commonFee,
                r.extraFee,
                r.usedWater ?? '',
                r.billWater ?? '',
                r.usedElec ?? '',
                r.billElec ?? '',
                r.total ?? '',
            ].join(',')
        )

        const csv = [header, ...csvRows].join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `มิเตอร์_เดือน${month}_${year}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return <div className="py-10 text-center text-base font-medium text-slate-500">กำลังโหลด...</div>
    }

    return (
        <div className="space-y-4">
            <div className="section-heading">
                <div>
                    <h2 className="section-title">สรุปรายเดือน</h2>
                    <p className="section-subtitle">ดูยอดรวมของแต่ละห้อง พร้อมค่าใช้จ่ายคงที่ ค่าน้ำ ค่าไฟ และค่าอื่น ๆ ในตารางเดียว</p>
                </div>
            </div>

            <div className="soft-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-6">
                <select
                    value={month}
                    onChange={(e) => setMonth(+e.target.value)}
                    className="input-comfort min-w-[180px]"
                >
                    {MONTHS.map((name, i) => (
                        <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                </select>

                <select
                    value={year}
                    onChange={(e) => setYear(+e.target.value)}
                    className="input-comfort min-w-[140px]"
                >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <button
                    onClick={exportCSV}
                    className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-50 sm:ml-auto"
                >
                    ดาวน์โหลด Excel
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="metric-card p-5">
                    <div className="metric-label">รวมทั้งหมด</div>
                    <div className="metric-value">{grandTotal.toLocaleString()} บาท</div>
                </div>
                <div className="metric-card p-5">
                    <div className="metric-label">บันทึกแล้ว</div>
                    <div className="metric-value text-green-700">{filledRooms}/{rows.length}</div>
                </div>
                <div className="metric-card p-5">
                    <div className="metric-label">รอมิเตอร์</div>
                    <div className="metric-value text-amber-600">{rows.length - filledRooms}</div>
                </div>
            </div>

            <div className="table-shell bg-white">
                <div className="mobile-scroll overflow-x-auto">
                    <table className="min-w-[1100px] w-full text-sm">
                        <thead>
                            <tr className="bg-blue-800 text-sm font-semibold text-white whitespace-nowrap">
                                <th className="sticky left-0 z-20 bg-blue-800 px-4 py-3 text-left shadow-[inset_-1px_0_0_#1d4ed8]">ห้อง</th>
                                <th className="px-4 py-3 text-right">ค่าเช่า</th>
                                <th className="px-4 py-3 text-right">ส่วนกลาง</th>
                                <th className="px-4 py-3 text-right">ที่จอดรถ</th>
                                <th className="px-4 py-3 text-right">ค่าอื่นๆ</th>
                                <th className="px-4 py-3 text-right">น้ำ (หน่วยใช้)</th>
                                <th className="px-4 py-3 text-right">ค่าน้ำ</th>
                                <th className="px-4 py-3 text-right">ไฟ (หน่วยใช้)</th>
                                <th className="px-4 py-3 text-right">ค่าไฟ</th>
                                <th className="px-4 py-3 text-right">รวม</th>
                                <th className="px-4 py-3 text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => {
                                const rowBackground = i % 2 === 1 ? '#eff6ff' : '#ffffff'

                                return (
                                    <tr
                                        key={row.roomNumber}
                                        style={{ backgroundColor: rowBackground }}
                                        className="border-b border-blue-50 whitespace-nowrap transition-colors hover:bg-blue-50"
                                    >
                                        <td
                                            style={{ backgroundColor: rowBackground }}
                                            className="sticky left-0 z-10 px-4 py-3 text-left text-base font-semibold text-blue-900 shadow-[inset_-1px_0_0_#dbeafe]"
                                        >
                                            {row.roomNumber}
                                        </td>
                                        <td className="px-4 py-3 text-right">{row.rent.toLocaleString()} ฿</td>
                                        <td className="px-4 py-3 text-right">
                                            {row.commonFee > 0 ? `${row.commonFee.toLocaleString()} ฿` : '0 ฿'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {row.parkingFee > 0 ? `${row.parkingFee.toLocaleString()} ฿` : '0 ฿'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {row.extraFee > 0 ? `${row.extraFee.toLocaleString()} ฿` : '0 ฿'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{row.usedWater?.toLocaleString() ?? '0'}</td>
                                        <td className="px-4 py-3 text-right">
                                            {row.billWater ? `${Math.round(row.billWater).toLocaleString()} ฿` : '0 ฿'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{row.usedElec?.toLocaleString() ?? '0'}</td>
                                        <td className="px-4 py-3 text-right">
                                            {row.billElec ? `${Math.round(row.billElec).toLocaleString()} ฿` : '0 ฿'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-base font-semibold text-blue-700">
                                            {row.total ? `${Math.round(row.total).toLocaleString()} ฿` : '0 ฿'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {row.total !== null
                                                ? <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">ครบ</span>
                                                : <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-500">รอ</span>
                                            }
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default SummaryPage
