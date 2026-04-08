import { useState, useEffect } from 'react'
import RoomRow from '../components/RoomRow'
import { supabase } from '../lib/supabase'
import { useRates } from '../hooks/useRates'

const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const now = new Date()

function EntryPage() {
    const { waterRate, elecRate } = useRates()
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())

    useEffect(() => { fetchRooms() }, [])

    async function fetchRooms() {
        setLoading(true)
        const { data } = await supabase
            .from('rooms')
            .select('*')
            .order('room_number')
        setRooms(data ?? [])
        setLoading(false)
    }

    if (loading) {
        return <div className="py-10 text-center text-base font-medium text-slate-500">กำลังโหลด...</div>
    }

    return (
        <div className="space-y-4">
            <div className="section-heading">
                <div>
                    <h2 className="section-title">บันทึกมิเตอร์รายเดือน</h2>
                    <p className="section-subtitle">กรอกเลขมิเตอร์ใหม่ของแต่ละห้อง แล้วระบบจะคำนวณค่าน้ำและค่าไฟให้ทันที</p>
                </div>
                <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-slate-700">
                    <div>ค่าน้ำ {waterRate} บาท/หน่วย</div>
                    <div>ค่าไฟ {elecRate} บาท/หน่วย</div>
                </div>
            </div>

            <div className="soft-card px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="text-base font-semibold text-slate-700">เลือกเดือนที่ต้องการบันทึก</span>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={month}
                            onChange={(e) => setMonth(+e.target.value)}
                            className="input-comfort w-full min-w-[180px]"
                        >
                            {MONTHS.map((name, i) => (
                                <option key={i + 1} value={i + 1}>{name}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(+e.target.value)}
                            className="input-comfort w-full min-w-[140px]"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-800 ring-1 ring-blue-100 sm:ml-auto">
                        {rooms.length} ห้อง
                    </span>
                </div>
            </div>

            <div className="table-shell bg-white">
                <div className="mobile-scroll overflow-x-auto">
                    <div className="min-w-[980px]">
                        <div
                            className="grid gap-3 bg-blue-800 px-4 py-3 text-sm font-semibold text-white sm:px-6"
                            style={{ gridTemplateColumns: '120px repeat(5, minmax(140px, 1fr))' }}
                        >
                            <div className="sticky left-0 z-30 flex items-center self-stretch border-r border-blue-700 bg-blue-800 px-4">
                                <span>ห้อง</span>
                            </div>
                            <span>น้ำ (ก่อน)</span>
                            <span>น้ำ (ใหม่)</span>
                            <span>ไฟ (ก่อน)</span>
                            <span>ไฟ (ใหม่)</span>
                            <span>ค่าน้ำ+ไฟ</span>
                        </div>

                        {rooms.map((room, i) => (
                            <RoomRow
                                key={room.id}
                                roomId={room.id}
                                roomNumber={room.room_number}
                                month={month}
                                year={year}
                                stripe={i % 2 === 1}
                                waterRate={waterRate}
                                elecRate={elecRate}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EntryPage
