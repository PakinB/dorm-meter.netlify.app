import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'
const now = new Date()

function SummaryPage() {
    const { waterRate, elecRate } = useRates()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSummary()
    }, [month, year])

    async function fetchSummary() {
        setLoading(true)

        const { data: rooms } = await supabase
            .from('rooms').select('*').order('room_number')

        const { data: current } = await supabase
            .from('meter_readings').select('*')
            .eq('month', month).eq('year', year)

        // ดึงข้อมูลทุก record ของทุกห้อง เพื่อหาล่าสุด
        const { data: allPrev } = await supabase
            .from('meter_readings').select('*')
            .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        const summary = rooms.map((room) => {
            const cur = current?.find((r) => r.room_id === room.id)

            // หาข้อมูลล่าสุดของห้องนี้ที่อยู่ก่อนเดือนปัจจุบัน
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

    // คำนวณยอดรวมทั้งหมด
    const grandTotal = rows.reduce((sum, r) => sum + (r.total ?? 0), 0)
    const filledRooms = rows.filter((r) => r.total !== null).length

    if (loading) {
        return <div className="p-4 text-sm text-gray-400">กำลังโหลด...</div>
    }
    function exportCSV() {
        const header = 'ห้อง,ค่าเช่า,ส่วนกลาง,น้ำ(หน่วย),ค่าน้ำ,ไฟ(หน่วย),ค่าไฟ,รวม'

        const csvRows = rows.map((r) =>
            [
                r.roomNumber,
                r.rent,
                r.commonFee,
                r.usedWater ?? '',
                r.billWater ?? '',
                r.usedElec ?? '',
                r.billElec ?? '',
                r.total ?? '',
            ].join(',')
        )

        const csv = [header, ...csvRows].join('\n')

        // สร้าง link แล้วกด click อัตโนมัติ
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
        // \uFEFF คือ BOM character ทำให้ Excel เปิดภาษาไทยไม่พัง
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `มิเตอร์_เดือน${month}_${year}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }
    return (
        <div>
            {/* เลือกเดือน/ปี */}
            <div className="flex gap-3 mb-4 items-center">
                <select
                    value={month}
                    onChange={(e) => setMonth(+e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>เดือน {i + 1}</option>
                    ))}
                </select>

                <select
                    value={year}
                    onChange={(e) => setYear(+e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                >
                    {[2024, 2025, 2026].map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <button
                    onClick={exportCSV}
                    className="ml-auto text-sm px-3 py-1 border rounded-lg hover:bg-gray-50"
                >
                    Export CSV ↓
                </button>
            </div>

            {/* metric cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">รวมทั้งหมด</div>
                    <div className="text-lg font-medium">
                        {grandTotal.toLocaleString()} ฿
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">บันทึกแล้ว</div>
                    <div className="text-lg font-medium text-green-600">
                        {filledRooms}/{rows.length}
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">รอมิเตอร์</div>
                    <div className="text-lg font-medium text-amber-500">
                        {rows.length - filledRooms}
                    </div>
                </div>
            </div>


            {/* ตาราง */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-blue-800 text-white text-xs">
                            <th className="text-left p-2">ห้อง</th>
                            <th className="text-right p-2">ค่าเช่า</th>
                            <th className="text-right p-2">ส่วนกลาง</th>
                            <th className="text-right p-2">น้ำ (หน่วย)</th>
                            <th className="text-right p-2">ค่าน้ำ</th>
                            <th className="text-right p-2">ไฟ (หน่วย)</th>
                            <th className="text-right p-2">ค่าไฟ</th>
                            <th className="text-right p-2">รวม</th>
                            <th className="text-center p-2">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.roomNumber}
                                style={{ backgroundColor: i % 2 === 1 ? '#eff6ff' : '#ffffff' }}
                                className="border-b hover:bg-blue-100 transition-colors"
                            >
                                <td className="p-2 font-semibold text-blue-900">{row.roomNumber}</td>
                                <td className="p-2 text-right">{row.rent.toLocaleString()}</td>
                                <td className="p-2 text-right">{row.commonFee.toLocaleString()}</td>
                                <td className="p-2 text-right">{row.usedWater ?? '—'}</td>
                                <td className="p-2 text-right">{row.billWater?.toFixed(0) ?? '—'}</td>
                                <td className="p-2 text-right">{row.usedElec ?? '—'}</td>
                                <td className="p-2 text-right">{row.billElec?.toFixed(0) ?? '—'}</td>
                                <td className="p-2 text-right font-semibold text-blue-700">
                                    {row.total ? row.total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ฿' : '—'}
                                </td>
                                <td className="p-2 text-center">
                                    {row.total !== null
                                        ? <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs font-medium">ครบ</span>
                                        : <span className="bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full text-xs font-medium">รอ</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SummaryPage