const display = document.getElementById('display');
const degRadBtn = document.getElementById('degRadBtn');

let isNewInput = true;
let ans = 0;         
let memory = 0;      
let isDegree = true; 

// ==========================================
// 1. CÁC HÀM NHẬP LIỆU CƠ BẢN
// ==========================================

function appendString(str) {
    // Danh sách các phép toán cần NỐI TIẾP vào kết quả cũ thay vì xóa đi
    const operators = ['+', '-', '*', '/', '^', '^2', '^3', '%', '!', 'E', '^(1/'];

    if (display.value === 'Lỗi cú pháp' || display.value === 'NaN') {
        display.value = '0';
        isNewInput = true;
    }

    if (isNewInput) {
        // Nếu vừa tính xong mà bấm phép toán -> nối tiếp
        if (operators.includes(str)) {
            display.value += str;
        } else {
            // Nếu bấm số mới hoặc các hàm (sin, cos...) -> ghi đè
            display.value = str;
        }
        isNewInput = false;
    } else {
        // Đang nhập liệu bình thường
        if (display.value === '0' && !operators.includes(str) && str !== '.') {
            display.value = str;
        } else {
            display.value += str;
        }
    }
}

function clearDisplay() {
    display.value = '0';
    isNewInput = true;
}

function backspace() {
    if (display.value.length > 1 && display.value !== 'Lỗi cú pháp') {
        display.value = display.value.slice(0, -1);
    } else {
        display.value = '0';
        isNewInput = true;
    }
}

function toggleSign() {
    if (display.value !== '0' && display.value !== '' && display.value !== 'Lỗi cú pháp') {
        if (display.value.startsWith('-')) {
            display.value = display.value.substring(1);
        } else {
            display.value = '-' + display.value;
        }
    }
}

// ==========================================
// 2. LOGIC: GÓC, BỘ NHỚ & KẾT QUẢ CŨ
// ==========================================

function toggleAngleMode() {
    isDegree = !isDegree;
    degRadBtn.innerText = isDegree ? "Deg" : "Rad";
}

function appendAns() {
    appendString(ans.toString());
}

function memoryAdd() {
    let currentValue = evaluateExpression(display.value);
    if (!isNaN(currentValue)) {
        memory += currentValue;
        isNewInput = true; 
    }
}

function memorySubtract() {
    let currentValue = evaluateExpression(display.value);
    if (!isNaN(currentValue)) {
        memory -= currentValue;
        isNewInput = true;
    }
}

function memoryRecall() {
    appendString(memory.toString());
}

// ==========================================
// 3. TOÁN HỌC NÂNG CAO
// ==========================================

function factorial(n) {
    // Làm tròn số nếu người dùng nhập số thập phân
    n = Math.round(n);
    if (n < 0) return NaN; 
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

window.trigSin = function(x) { return Math.sin(isDegree ? x * Math.PI / 180 : x); };
window.trigCos = function(x) { return Math.cos(isDegree ? x * Math.PI / 180 : x); };
window.trigTan = function(x) { return Math.tan(isDegree ? x * Math.PI / 180 : x); };
window.trigAsin = function(x) { let r = Math.asin(x); return isDegree ? r * 180 / Math.PI : r; };
window.trigAcos = function(x) { let r = Math.acos(x); return isDegree ? r * 180 / Math.PI : r; };
window.trigAtan = function(x) { let r = Math.atan(x); return isDegree ? r * 180 / Math.PI : r; };

// ==========================================
// 4. BỘ XỬ LÝ VÀ DỊCH NGÔN NGỮ TOÁN HỌC
// ==========================================

function evaluateExpression(expr) {
    try {
        let parsed = expr;

        parsed = parsed.replace(/π/g, 'Math.PI');
        
        // BẢN VÁ LỖI SỐ KHOA HỌC: Chỉ đổi chữ 'e' thành Math.E nếu phía trước nó KHÔNG PHẢI là số. 
        // Điều này bảo vệ các số như 1.23e-10 không bị hỏng.
        parsed = parsed.replace(/(^|[^0-9.])e(?!x)/g, '$1Math.E'); 

        parsed = parsed.replace(/sin\(/g, 'trigSin(');
        parsed = parsed.replace(/cos\(/g, 'trigCos(');
        parsed = parsed.replace(/tan\(/g, 'trigTan(');
        parsed = parsed.replace(/asin\(/g, 'trigAsin(');
        parsed = parsed.replace(/acos\(/g, 'trigAcos(');
        parsed = parsed.replace(/atan\(/g, 'trigAtan(');
        
        parsed = parsed.replace(/ln\(/g, 'Math.log('); 
        parsed = parsed.replace(/log\(/g, 'Math.log10(');

        parsed = parsed.replace(/√\(/g, 'Math.sqrt(');
        parsed = parsed.replace(/cbrt\(/g, 'Math.cbrt(');
        parsed = parsed.replace(/\^/g, '**'); 

        // BẢN VÁ GIAI THỪA: Hỗ trợ tính giai thừa kể cả khi số đứng trước là số thập phân
        parsed = parsed.replace(/(\d+(\.\d+)?)!/g, 'factorial($1)');
        
        parsed = parsed.replace(/%/g, '/100');

        let result = eval(parsed);
        
        if(result % 1 !== 0) {
            result = parseFloat(result.toFixed(10));
        }
        return result;
    } catch (error) {
        return NaN; 
    }
}

// ==========================================
// 5. LỊCH SỬ TÍNH TOÁN
// ==========================================

const historyList = document.getElementById('history-list');

function addHistory(expression, result) {
    const emptyMsg = document.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.innerHTML = `
        <span class="history-expr">${expression} =</span>
        <span class="history-res">${result}</span>
    `;
    
    historyList.insertBefore(li, historyList.firstChild);
}

function clearHistory() {
    historyList.innerHTML = '<li class="empty-msg">Chưa có phép tính nào</li>';
}

function calculate() {
    let originalExpression = display.value; 
    let result = evaluateExpression(originalExpression);
    
    if (!isNaN(result)) {
        display.value = result;
        ans = result; 
        isNewInput = true;
        
        if (originalExpression !== '0' && originalExpression !== '') {
            addHistory(originalExpression, result);
        }
    } else {
        display.value = 'Lỗi cú pháp';
        isNewInput = true;
    }
}