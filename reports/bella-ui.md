# BELLA UI 1.1

Thiết kế: https://www.figma.com/design/jeZus11kj79MjZ2dOwdjfQ?node-id=2-47

## Phạm vi

- Áp dụng nền cam đỏ, ô lưới từ Figma, thẻ navy, nút vàng và logo BELLA gốc.
- Dùng Baloo 2 ExtraBold cho tiêu đề/nút, Be Vietnam Pro cho nội dung. Font được đóng gói cục bộ và precache cùng app; giấy phép trong `public/licenses/`.
- Đổi biểu tượng cài ứng dụng và tên hiển thị thành BELLA. Không đổi địa chỉ app hoặc khóa bản lưu.
- Giữ các điều khiển hiện có, kể cả nguồn từ, nhóm đã lưu, nhập/xuất JSON, lịch sử, đoán tương đương và giảm lặp vai; bản Figma chỉ minh họa trạng thái mẫu.
- Không sửa `engine.ts`, `storage.ts`, `types.ts`, dữ liệu và các bài kiểm thử. Thay đổi trong `components.tsx` chỉ là chữ thương hiệu và phần trình bày đồng hồ; các handler vuốt, bàn phím, khóa Continue và deadline giữ nguyên.

## Kiểm tra

- TypeScript, 28 kiểm thử Vitest và kiểm định 648 cặp/1.289 từ/18 chủ đề đạt.
- Build production với font và tài nguyên cục bộ, Workbox precache.
- Kiểm tra trong trình duyệt tại 320, 390, 640, 768 và 1280px: không tràn ngang.
- Qua đủ 8 lượt phát từ bằng bàn phím: từ không còn trong DOM sau khi thả; Continue chuyển đúng người, sau người cuối vào mô tả.
- Đồng hồ tạm dừng/tiếp tục; đủ 8 lượt mô tả, thảo luận, đủ 8 phiếu kín, tổng phiếu và công bố người bị loại.
- Tìm kiếm “Trà đào”, hộp thêm từ tại 320px, cài đặt và màn tiếp tục ván đang chơi.
- Kiểm thử pointer/cancel/blur/visibility và chống Continue lặp do bộ kiểm thử hiện có xác nhận. Kiểm tra trình duyệt thủ công không thay thế thử trên điện thoại cảm ứng thật.

Khi đã cài PWA, áp dụng cập nhật ngoài ván. Không xóa localStorage để cập nhật UI.
