# 🎬 CineGo Frontend (CGV-FE-USER)

> Giao diện Web Người Dùng Đặt Vé Xem Phim Trực Tuyến Hiện Đại (Modern Cinema Booking SPA).
> Tương thích kiến trúc Microservices CGV Enterprise.

---

## ✨ Tính năng Nổi bật

1. **Trang chủ (`/`):**
   - Hero Slider phim bom tấn điện ảnh với hiệu ứng chuyển động mượt mà.
   - Thanh "Đặt vé nhanh" 4 bước (Phim $\rightarrow$ Rạp $\rightarrow$ Ngày $\rightarrow$ Suất chiếu).
   - Danh sách "Phim đang chiếu" và "Phim sắp chiếu".
   - Bảng xếp hạng Top phim được yêu thích (1–5).

2. **Danh mục Phim (`/movies`):**
   - Bộ lọc đa tiêu chí: Trạng thái (Đang chiếu, Sắp chiếu), Thể loại (Hành động, Kinh dị, Hoạt hình...), Quốc gia, Sắp xếp (Đánh giá cao nhất, Mới nhất).
   - Tìm kiếm trực tiếp theo tên phim hoặc diễn viên.

3. **Cụm Rạp & Lịch Chiếu (`/cinemas`):**
   - Lọc cụm rạp theo khu vực (TP. Hồ Chí Minh, Hà Nội, Đà Nẵng...) và tiện ích (IMAX, 4DX, Dolby Atmos, Ghế đôi).
   - Banner Spotlight rạp nổi bật (CineGo Landmark 81).
   - Lịch chiếu phim trực quan theo ngày: Bấm vào khung giờ để chuyển sang sơ đồ chọn ghế.

4. **Ưu Đãi & Hội Viên (`/promotions`):**
   - Banner khuyến mãi "Mega Sale Thứ 4" đồng giá vé 55K.
   - Danh sách "Mã giảm giá độc quyền" kèm nút **Sao chép mã** một chạm (`CGWED55`, `COMBO30`, `MEM50K`).
   - Quyền lợi thành viên 3 cấp bậc: **Silver (Member)**, **Gold (VIP)**, **Platinum (VVIP)** đồng bộ với `IdentityService`.

5. **Sơ đồ Chọn ghế Real-time & Thanh toán (Modal Booking Flow):**
   - Sơ đồ phòng chiếu 8 hàng ghế (A–H) phân loại rõ ràng: Ghế thường, Ghế VIP, Ghế đôi Sweetbox.
   - Đồng hồ đếm ngược 10 phút giữ ghế (Holding Lock Timeout).
   - Ô nhập mã giảm giá áp dụng Voucher trừ tiền trực tiếp.
   - Xác nhận thanh toán VNPay / MoMo và hiển thị mã vé QR đặt chỗ thành công.

6. **Tài khoản & Đăng nhập (Auth Modal):**
   - Đăng nhập / Đăng ký.
   - Các nút đăng nhập nhanh với tài khoản mẫu (VIP, Platinum VVIP, Admin) phục vụ demo và chấm điểm đồ án.

---

## 🛠️ Công nghệ Sử dụng

- **Core:** React 18 + Vite
- **Styling:** Vanilla CSS hiện đại (Design System Tokens, Dark Mode `#0b0f19`, Neon Red `#ff2b54`, Glassmorphism)
- **Icons:** `lucide-react`
- **Routing:** `react-router-dom`
- **Tầng API & Mock Data:** Tự động kết nối Kong API Gateway (`http://localhost:8000/api/v1/...`). Khi Backend chưa bật, hệ thống tự động fallback sang Mock Data chuẩn để ứng dụng luôn hoạt động 100%.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

```bash
# 1. Cài đặt thư viện phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển (Dev Server)
npm run dev

# 3. Build bundle sản phẩm
npm run build
```
