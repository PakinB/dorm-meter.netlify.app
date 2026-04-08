import { useEffect, useRef, useState } from 'react'
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'
import { toJpeg } from 'html-to-image'
import { numberToThaiText } from '../hooks/bathText'

const MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

function BillModal({ bill, info, onClose }) {
    const billRef = useRef()
    const [qrUrl, setQrUrl] = useState('')

    useEffect(() => {
        if (info.promptpay) {
            try {
                const payload = generatePayload(info.promptpay, { amount: bill.total })
                QRCode.toDataURL(payload, { width: 200, margin: 1 })
                    .then((url) => setQrUrl(url))
            } catch (e) {
                console.error('QR error:', e)
            }
        }
    }, [info.promptpay, bill.total])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    function getBillHTML() {
        return `
      <div class="bill">
        <div class="bh">
          <h1>${info.dorm_name || 'หอพัก'}</h1>
          <p>${info.dorm_address || ''}</p>
          <p>เบอร์โทร : 063-546-2928</p>
        </div>
        <div class="bm">
          <span>ห้อง <b>${bill.roomNumber}</b></span>
          <span>ประจำเดือน <b>${MONTHS[bill.month - 1]} ${bill.year}</b></span>
        </div>

        <div class="sl">ค่าใช้จ่ายคงที่</div>
        <div class="row"><span>ค่าเช่าห้อง</span><span>${bill.rent.toLocaleString()} ฿</span></div>
        <div class="row"><span>ค่าส่วนกลาง</span><span>${bill.commonFee > 0 ? bill.commonFee.toLocaleString() + ' ฿' : '0 ฿'}</span></div>
        <div class="row"><span>ค่าที่จอดรถ</span><span>${bill.parkingFee > 0 ? bill.parkingFee.toLocaleString() + ' ฿' : '0 ฿'}</span></div>
        ${bill.extraFee > 0 ? `<div class="row"><span>ค่าอื่นๆ</span><span>${bill.extraFee.toLocaleString()} ฿</span></div>` : ''}

        <div class="sl">ค่าน้ำ</div>
        <div class="row"><span>ค่าน้ำ (${bill.usedWater ?? '?'} หน่วย × ${info.waterRate ?? 18} ฿)</span><span>${bill.billWater?.toFixed(0) ?? '0'} ฿</span></div>
        ${bill.prevWater !== null ? `<div class="row sub"><span>มิเตอร์เก่า ${bill.prevWater} → ใหม่ ${bill.newWater}</span></div>` : ''}

        <div class="sl">ค่าไฟ</div>
        <div class="row"><span>ค่าไฟ (${bill.usedElec ?? '?'} หน่วย × ${info.elecRate ?? 8} ฿)</span><span>${bill.billElec?.toFixed(0) ?? '0'} ฿</span></div>
        ${bill.prevElec !== null ? `<div class="row sub"><span>มิเตอร์เก่า ${bill.prevElec} → ใหม่ ${bill.newElec}</span></div>` : ''}

        <div class="total"><span>รวมทั้งหมด</span>
            <div style="text-align:right;">
                <div style="white-space:nowrap;">${bill.total.toLocaleString()} ฿</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;white-space:nowrap;">
                (${numberToThaiText(Number(bill.total))})
            </div>
        </div></div>

        <div class="ft"></div>
      </div>
    `
    }

    function handlePrint() {
        const billHTML = getBillHTML()
        const win = window.open('', '_blank')
        win.document.write(`
      <html><head>
      <meta charset="utf-8">
      <title>ใบบิล ห้อง ${bill.roomNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #1a1a1a; background: white; }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .half {
          height: 138.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4mm 0;
        }

        .cut-line {
          border-top: 1.5px dashed #cbd5e1;
          position: relative;
          margin: 0 -10mm;
        }
        .cut-label {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 0 8px;
          font-size: 9px;
          color: #94a3b8;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .bill { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; width: 100%; }
        .bh { background: #1e3a8a; color: white; padding: 12px 16px; }
        .bh h1 { font-size: 15px; font-weight: 600; }
        .bh p { font-size: 10px; opacity: 0.75; margin-top: 2px; }
        .bm { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
        .bm b { color: #1e293b; }
        .sl { font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 16px 3px; }
        .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 4px 16px; font-size: 12px; color: #334155; }
        .row > span:first-child { white-space: nowrap; }
        .row > span:last-child { white-space: nowrap; flex-shrink: 0; }
        .row.sub { padding: 2px 16px 5px 28px; font-size: 10px; color: #94a3b8; }
        .row.sub span { white-space: nowrap; }
        .total { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin: 4px 16px 0; padding: 10px 0; border-top: 2px solid #1e3a8a; font-size: 15px; font-weight: 700; color: #1e3a8a; }
        .total > span { white-space: nowrap; flex-shrink: 0; }
        .ft { display: flex; gap: 12px; align-items: center; padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; min-height: 18px; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 0; }
        }
      </style>
      </head>
      <body>
        <div class="page">
          <div class="half">${billHTML}</div>
          <div class="cut-line"><div class="cut-label">✂ ตัดตรงนี้</div></div>
          <div class="half">${billHTML}</div>
        </div>
      </body></html>
    `)
        win.document.close()
        win.focus()
        setTimeout(() => { win.print(); win.close() }, 600)
    }

    async function handleDownloadJPG() {
        try {
            const element = billRef.current.querySelector('.bill')
            if (!element) return

            const dataUrl = await toJpeg(element, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                skipFonts: true
            })

            const link = document.createElement('a')
            link.download = `bill${bill.roomNumber}.jpg`
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-semibold text-slate-700">ใบแจ้ง ห้อง {bill.roomNumber}</h2>
                    <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="p-5" ref={billRef}>
                    <div className="bill overflow-hidden rounded-lg border border-slate-200">
                        <div className="bg-blue-800 p-4 text-white">
                            <h1 className="text-base font-semibold">{info.dorm_name || 'หอพัก'}</h1>
                            <p className="mt-0.5 text-xs text-blue-200">{info.dorm_address}</p>
                            <p className="mt-0.5 text-xs text-blue-200">เบอร์โทร : 063-546-2928</p>
                        </div>

                        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2 text-xs text-slate-500">
                            <span className="whitespace-nowrap">ห้อง <span className="font-semibold text-slate-700">{bill.roomNumber}</span></span>
                            <span className="whitespace-nowrap">ประจำเดือน <span className="font-semibold text-slate-700">{MONTHS[bill.month - 1]} {bill.year}</span></span>
                        </div>

                        <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">ค่าใช้จ่ายคงที่</p>
                        <div className="flex justify-between gap-3 px-4 py-1 text-sm">
                            <span className="whitespace-nowrap">ค่าเช่าห้อง</span>
                            <span className="whitespace-nowrap font-medium">{bill.rent.toLocaleString()} ฿</span>
                        </div>
                        <div className="flex justify-between gap-3 px-4 py-1 text-sm">
                            <span className="whitespace-nowrap">ค่าส่วนกลาง</span>
                            <span className="whitespace-nowrap font-medium">
                                {bill.commonFee > 0 ? `${bill.commonFee.toLocaleString()} ฿` : '0 ฿'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-3 px-4 py-1 text-sm">
                            <span className="whitespace-nowrap">ค่าที่จอดรถ</span>
                            <span className="whitespace-nowrap font-medium">
                                {bill.parkingFee > 0 ? `${bill.parkingFee.toLocaleString()} ฿` : '0 ฿'}
                            </span>
                        </div>
                        {bill.extraFee > 0 && (
                            <div className="flex justify-between gap-3 px-4 py-1 text-sm">
                                <span className="whitespace-nowrap">ค่าอื่นๆ</span>
                                <span className="whitespace-nowrap font-medium">{bill.extraFee.toLocaleString()} ฿</span>
                            </div>
                        )}

                        <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">ค่าน้ำ</p>
                        <div className="flex justify-between gap-3 px-4 py-1 text-sm">
                            <span className="whitespace-nowrap">ค่าน้ำ ({bill.usedWater ?? '?'} หน่วย × {info.waterRate ?? 18} ฿)</span>
                            <span className="whitespace-nowrap font-medium">{bill.billWater?.toFixed(0) ?? '—'} ฿</span>
                        </div>
                        {bill.prevWater !== null && (
                            <p className="whitespace-nowrap px-4 pb-1 pl-8 text-xs text-slate-400">
                                มิเตอร์เก่า {bill.prevWater} - ใหม่ {bill.newWater}
                            </p>
                        )}

                        <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">ค่าไฟ</p>
                        <div className="flex justify-between gap-3 px-4 py-1 text-sm">
                            <span className="whitespace-nowrap">ค่าไฟ ({bill.usedElec ?? '?'} หน่วย × {info.elecRate ?? 8} ฿)</span>
                            <span className="whitespace-nowrap font-medium">{bill.billElec?.toFixed(0) ?? '—'} ฿</span>
                        </div>
                        {bill.prevElec !== null && (
                            <p className="whitespace-nowrap px-4 pb-1 pl-8 text-xs text-slate-400">
                                มิเตอร์เก่า {bill.prevElec} - ใหม่ {bill.newElec}
                            </p>
                        )}

                        <div className="mx-4 mt-2 flex justify-between gap-3 border-t-2 border-blue-800 py-3 text-base font-bold text-blue-800">
                            <span className="whitespace-nowrap">รวมทั้งหมด</span>

                            <div className="flex flex-col items-end gap-1 leading-none">
                                <span className="whitespace-nowrap">{bill.total.toLocaleString()} ฿</span>
                                <span className="whitespace-nowrap text-xs text-slate-500">
                                    ({numberToThaiText(Number(bill.total))})
                                </span>
                            </div>
                        </div>

                        <div className="min-h-[18px] border-t bg-slate-50 px-4 py-3" />
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t px-5 py-4">
                    <button
                        onClick={handleDownloadJPG}
                        className="w-full rounded-lg bg-blue-800 py-2 text-sm font-medium text-white"
                    >
                        ดาวน์โหลดรูปภาพ
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex-1 rounded-lg border border-blue-800 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                        >
                            ปริ้นใบแจ้งหนี้
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 rounded-lg bg-blue-800 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            บันทึก PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BillModal
