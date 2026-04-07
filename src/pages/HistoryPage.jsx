import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'
const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]


function HistoryPage() {
    const { waterRate, elecRate, loading: ratesLoading } = useRates()
    const [rooms, setRooms] = useState([])
    const [roomId, setRoomId] = useState(null)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => { fetchRooms() }, [])

    async function fetchRooms() {
        const { data } = await supabase
            .from('rooms')
            .select('id, room_number')
            .order('room_number')
        setRooms(data ?? [])
        if (data?.length) setRoomId(data[0].id)
    }

    useEffect(() => {
        if (!roomId || ratesLoading) return
        fetchHistory()
    }, [roomId, waterRate, elecRate, ratesLoading])

    async function fetchHistory() {
        setLoading(true)

        const { data: roomData } = await supabase
            .from('rooms')
            .select('rent, common_fee, parking_fee, extra_fee')
            .eq('id', roomId)
            .maybeSingle()

        const { data } = await supabase
            .from('meter_readings')
            .select('*')
            .eq('room_id', roomId)
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        if (!data?.length) { setRows([]); setLoading(false); return }

        const { data: payments } = await supabase
            .from('payments')
            .select('month, year, paid, paid_at')
            .eq('room_id', roomId)

        const result = await Promise.all(data.map(async (cur) => {
            const prevMonth = cur.month === 1 ? 12 : cur.month - 1
            const prevYear = cur.month === 1 ? cur.year - 1 : cur.year

            // ดึงเดือนก่อนตรงๆ ก่อน
            const { data: prevData } = await supabase
                .from('meter_readings')
                .select('water_meter, elec_meter')
                .eq('room_id', roomId)
                .eq('month', prevMonth)
                .eq('year', prevYear)
                .maybeSingle()

            // ถ้าไม่มีเดือนก่อน หาข้อมูลล่าสุดที่มีก่อนเดือนนี้
            let prev = prevData
            if (!prev) {
                const { data: sameYear } = await supabase
                    .from('meter_readings')
                    .select('water_meter, elec_meter')
                    .eq('room_id', roomId)
                    .eq('year', cur.year)
                    .lt('month', cur.month)
                    .order('month', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                const { data: prevYear2 } = await supabase
                    .from('meter_readings')
                    .select('water_meter, elec_meter')
                    .eq('room_id', roomId)
                    .lt('year', cur.year)
                    .order('year', { ascending: false })
                    .order('month', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                prev = sameYear ?? prevYear2
            }

            const usedWater = prev ? Math.max(0, cur.water_meter - prev.water_meter) : null
            const usedElec = prev ? Math.max(0, cur.elec_meter - prev.elec_meter) : null
            const billWater = usedWater !== null ? usedWater * waterRate : null
            const billElec = usedElec !== null ? usedElec * elecRate : null
            const fixed = roomData
                ? roomData.rent + roomData.common_fee + roomData.parking_fee + roomData.extra_fee
                : 0
            const total = billWater !== null ? fixed + billWater + billElec : fixed

            const pay = payments?.find((p) => p.month === cur.month && p.year === cur.year)

            return {
                month: cur.month, year: cur.year,
                waterMeter: cur.water_meter,
                elecMeter: cur.elec_meter,
                usedWater, usedElec, billWater, billElec,
                total,
                hasFullData: billWater !== null,
                rent: roomData?.rent ?? 0,
                commonFee: roomData?.common_fee ?? 0,
                parkingFee: roomData?.parking_fee ?? 0,
                paid: pay?.paid ?? false,
                paidAt: pay?.paid_at ?? null,
            }
        }))

        setRows(result)
        setLoading(false)
    }

    const selectedRoom = rooms.find((r) => r.id === roomId)

    return (
        <div className="space-y-4">

            {/* Room picker */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-xs text-slate-400 font-medium mb-3">เลือกห้อง</p>
                <div className="flex flex-wrap gap-2">
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setRoomId(room.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${roomId === room.id
                                ? 'bg-blue-800 text-white border-blue-800'
                                : 'bg-white text-slate-500 border-slate-300 hover:border-blue-400 hover:text-blue-700'
                                }`}
                        >
                            {room.room_number}
                        </button>
                    ))}
                </div>
            </div>

            {/* History table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-3 border-b bg-slate-50">
                    <p className="text-sm font-medium text-slate-600">
                        ประวัติห้อง {selectedRoom?.room_number}
                    </p>
                </div>

                {loading && (
                    <div className="text-sm text-slate-400 py-8 text-center">กำลังโหลด...</div>
                )}

                {!loading && rows.length === 0 && (
                    <div className="text-sm text-slate-400 py-8 text-center">ยังไม่มีข้อมูลห้องนี้</div>
                )}

                {!loading && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-blue-800 text-white text-xs whitespace-nowrap">
                                    <th className="text-left px-3 py-2">เดือน</th>
                                    <th className="text-right px-3 py-2">ค่าเช่า</th>
                                    <th className="text-right px-3 py-2">ส่วนกลาง</th>
                                    <th className="text-right px-3 py-2">ที่จอดรถ</th>
                                    <th className="text-right px-3 py-2">มิเตอร์น้ำ</th>
                                    <th className="text-right px-3 py-2">น้ำ (หน่วยใช้)</th>
                                    <th className="text-right px-3 py-2">ค่าน้ำ</th>
                                    <th className="text-right px-3 py-2">มิเตอร์ไฟ</th>
                                    <th className="text-right px-3 py-2">ไฟ (หน่วยใช้)</th>
                                    <th className="text-right px-3 py-2">ค่าไฟ</th>
                                    <th className="text-right px-3 py-2">รวม</th>
                                    <th className="text-center px-3 py-2">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={`${row.year}-${row.month}`}
                                        style={{ backgroundColor: i % 2 === 1 ? '#eff6ff' : '#ffffff' }}
                                        className="border-b hover:bg-blue-100 transition-colors whitespace-nowrap"
                                    >
                                        <td className="px-3 py-2 font-semibold text-blue-900 whitespace-nowrap">
                                            {MONTHS[row.month - 1]} {row.year}
                                        </td>
                                        <td className="px-3 py-2 text-right">{row.rent.toLocaleString() + ' ฿'}</td>
                                        <td className="px-3 py-2 text-right">
                                            {row.commonFee > 0 ? row.commonFee.toLocaleString() + ' ฿' : '0' + ' ฿'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {row.parkingFee > 0 ? row.parkingFee.toLocaleString() + ' ฿' : '0' + ' ฿'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-500">
                                            {row.waterMeter?.toLocaleString() ?? '0'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {row.usedWater?.toLocaleString() ?? '0'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {row.billWater ? Math.round(row.billWater).toLocaleString() + ' ฿' : '0' + ' ฿'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-500">
                                            {row.elecMeter?.toLocaleString() ?? '0'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {row.usedElec?.toLocaleString() ?? '0'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {row.billElec ? Math.round(row.billElec).toLocaleString() + ' ฿' : '0' + ' ฿'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-blue-700">
                                            {row.total ? Math.round(row.total).toLocaleString() + ' ฿' : '0'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {row.paid ? (
                                                <div>
                                                    <span className="bg-green-50 text-green-700 border border-green-300 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                                                        ✓ จ่ายแล้ว
                                                    </span>
                                                    {row.paidAt && (
                                                        <div className="text-xs text-slate-400 mt-1 whitespace-nowrap">
                                                            {new Date(row.paidAt).toLocaleDateString('th-TH', {
                                                                day: 'numeric', month: 'short', year: '2-digit'
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="bg-amber-50 text-amber-500 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
                                                    ยังไม่จ่าย
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistoryPage
