import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import google.generativeai as genai
# Đã thêm make_response vào dòng này để sửa lỗi tải CSS
from flask import Flask, render_template, request, jsonify, make_response

app = Flask(__name__)

# ==========================================
# PHẦN 1: DỮ LIỆU & MACHINE LEARNING
# Mục đích: Tạo dữ liệu giả lập và huấn luyện mô hình dự đoán
# ==========================================
ml_model = None
customer_df = None
chat_session = None # Biến lưu trữ phiên trò chuyện của AI

def setup_data_and_model():
    """Hàm chuẩn bị dữ liệu và huấn luyện mô hình AI phân loại."""
    global ml_model, customer_df
    
    # Dữ liệu khách hàng mẫu
    data = {
        'age': [25, 45, 30, 50, 23, 60, 35, 40, 28, 55],
        'support_calls': [1, 5, 0, 4, 1, 6, 2, 5, 0, 7],
        'churn': [0, 1, 0, 1, 0, 1, 0, 1, 0, 1] 
    }
    customer_df = pd.DataFrame(data)
    
    # Huấn luyện mô hình RandomForest
    X = customer_df[['age', 'support_calls']]
    y = customer_df['churn']
    ml_model = RandomForestClassifier(random_state=42)
    ml_model.fit(X.values, y.values)

# ==========================================
# PHẦN 2: CÁC CÔNG CỤ (HÀM) CHO CHATBOT
# Mục đích: Để AI tự động gọi khi người dùng hỏi về số liệu
# ==========================================

def analyze_customer_data() -> str:
    """Công cụ giúp AI thống kê tổng quan dữ liệu khách hàng."""
    if customer_df is None:
        return "System Error: The database is empty."

    total_customers = len(customer_df)
    churn_rate = (customer_df['churn'].sum() / total_customers) * 100
    avg_support_calls = customer_df['support_calls'].mean()
    
    return f"We have {total_customers} customers. Avg support calls: {avg_support_calls:.1f}. Churn rate: {churn_rate}%"

def predict_customer_churn(age: int, support_calls: int) -> str:
    """Công cụ giúp AI dự đoán xem một khách hàng cụ thể có rời bỏ dịch vụ không."""
    if ml_model is None:
        return "System Error: Model not trained."

    prediction = ml_model.predict([[age, support_calls]])[0]
    
    if prediction == 1:
        return f"A customer aged {age} with {support_calls} support calls is HIGHLY LIKELY to churn."
    else:
        return f"A customer aged {age} with {support_calls} support calls is UNLIKELY to churn."

# ==========================================
# PHẦN 3: CẤU HÌNH AI & CHẠY TRANG WEB
# Mục đích: Kết nối Gemini API và mở cổng giao tiếp Web
# ==========================================

def init_ai():
    """Khởi tạo AI với phiên bản chuẩn."""
    global chat_session
    
    api_key = "AIzaSyB3rRI-zpXwccx9rzSTjqEt0UYk_vMSKyM"
    genai.configure(api_key=api_key)
    
    # Khôi phục lại tên mô hình chuẩn để tránh lỗi 404
    model = genai.GenerativeModel(
        model_name='gemini-3.1-flash-lite-preview',
        tools=[analyze_customer_data, predict_customer_churn]
    )
    
    # Bật tính năng tự động sử dụng công cụ
    chat_session = model.start_chat(enable_automatic_function_calling=True)

@app.route("/style.css")
def serve_css():
    """Đọc tệp style.css từ thư mục templates và gửi cho trình duyệt."""
    response = make_response(render_template("style.css"))
    # Báo cho trình duyệt biết đây là tệp CSS
    response.headers['Content-Type'] = 'text/css'
    return response

@app.route("/")
def home():
    """Hiển thị giao diện HTML khi người dùng vào trang web."""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Nhận tin nhắn từ web, gửi cho AI và trả kết quả về."""
    if chat_session is None:
        return jsonify({"response": "Lỗi: Hệ thống AI chưa sẵn sàng."})

    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"response": "Vui lòng nhập tin nhắn."})

    try:
        # Gửi tin nhắn cho AI xử lý
        response = chat_session.send_message(user_message)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"response": f"Lỗi kỹ thuật: {str(e)}"})

# Lệnh khởi động chương trình
if __name__ == "__main__":
    setup_data_and_model()
    init_ai()
    print("Máy chủ web MVP đang chạy... Mở trình duyệt tại: http://127.0.0.1:5000")
    app.run(debug=True)