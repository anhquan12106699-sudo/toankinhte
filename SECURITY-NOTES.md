# Ghi chú bảo mật (đã áp dụng + việc cần làm trên Supabase)

## Đã sửa trong mã
- `js/supabase-early.js`: thêm `window.__safeUrl()` chỉ cho phép link `https://` và `blob:`.
- `js/main.js`: link PDF / Word / Google Doc lấy từ DB đều qua `__safeUrl` trước khi vào iframe, window.open, location.href.
- Bỏ `javascript:void(0)`; bỏ các onload/onerror inline (chuyển sang `js/boot.js`).
- Ghim phiên bản: DOMPurify 3.3.3, mammoth 1.11.0.
- `index.html`: thêm Content-Security-Policy (meta) + referrer policy.

## BẮT BUỘC kiểm tra trên Supabase (mã không thể tự sửa)
1. Bảng `posts`: bật Row Level Security.
2. Role `anon` chỉ có SELECT. Không INSERT/UPDATE/DELETE.
3. Trang đăng bài phải đăng nhập (Supabase Auth); policy ghi chỉ cho tài khoản admin.
4. Không đặt `service_role` key trong bất kỳ file nào.

## Thêm SRI cho 2 thư viện CDN (tuỳ chọn, khuyến nghị)
Chạy trên máy có mạng, lấy hash rồi thêm `integrity="sha384-..." crossorigin="anonymous"` vào thẻ script:
    curl -s https://cdn.jsdelivr.net/npm/dompurify@3.3.3/dist/purify.min.js | openssl dgst -sha384 -binary | openssl base64 -A
Với mammoth (nạp bằng JS trong main.js, dòng `sc.src = ...`), thêm `sc.integrity='sha384-...'; sc.crossOrigin='anonymous';`
Hoặc tải 2 file về thư mục `js/vendor/` và tự host (khi đó đổi src trỏ về file nội bộ).

## Giới hạn của GitHub Pages
Không đặt được HTTP header (X-Frame-Options, frame-ancestors...). CSP bằng thẻ meta không hỗ trợ `frame-ancestors`.
Nếu cần đủ header, đặt Cloudflare (miễn phí) phía trước domain.
