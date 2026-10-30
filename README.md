# Cấu trúc
- index.html  – trang chính (chỉ còn phần HTML)
- css/main.css, css/extra.css – toàn bộ CSS (giữ nguyên thứ tự cũ)
- js/*.js – các đoạn JS, nạp theo đúng thứ tự trong index.html
- assets/img – ảnh đã tách khỏi base64 (đặt tên theo mã băm)
- _headers – header bảo mật (Netlify / Cloudflare Pages)

# Đẩy lên web
Tải cả thư mục `site` (giữ nguyên cấu trúc). Phải chạy qua http(s), mở trực tiếp file.html bằng đường dẫn máy có thể lỗi Supabase.

# Việc cần làm trên Supabase (quan trọng nhất)
1. Bảng `posts`: bật Row Level Security (RLS).
2. Chỉ tạo policy SELECT cho role anon; KHÔNG tạo policy INSERT/UPDATE/DELETE cho anon.
3. Không bao giờ để service_role key trong code web.
