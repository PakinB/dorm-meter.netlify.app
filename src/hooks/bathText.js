// utils/bahtText.js
export function numberToThaiText(num) {
    if (num === 0) return 'ศูนย์บาท'

    const numberText = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
    const positionText = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

    function readNumber(n) {
        let result = ''
        let len = n.length

        for (let i = 0; i < len; i++) {
            let digit = parseInt(n[i])
            let pos = len - i - 1

            if (digit !== 0) {
                if (pos === 0 && digit === 1 && len > 1) {
                    result += 'เอ็ด'
                } else if (pos === 1 && digit === 2) {
                    result += 'ยี่'
                } else if (pos === 1 && digit === 1) {
                    result += ''
                } else {
                    result += numberText[digit]
                }

                result += positionText[pos]
            }
        }

        return result
    }

    let numStr = num.toString()
    let parts = []

    while (numStr.length > 0) {
        parts.unshift(numStr.slice(-6))
        numStr = numStr.slice(0, -6)
    }

    let result = ''
    parts.forEach((part, i) => {
        if (part !== '000000') {
            result += readNumber(part)
            if (i < parts.length - 1) result += 'ล้าน'
        }
    })

    return result + 'บาท'
}