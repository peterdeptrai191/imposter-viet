# Báo cáo kiểm tra — 20/10/2026

## Kết quả đã chạy

- `npm run check`: **28/28 kiểm thử đạt**, gồm TypeScript, 21 kiểm thử luật/lưu trữ/nhập và 7 kiểm thử tương tác thẻ.
- `npm run build`: thành công, đầu ra `dist/`, service worker/manifest/biểu tượng đều được tạo. Kho từ nằm trong bundle được precache, không tải từ dịch vụ ngoài.
- Kho: **1.289 từ/cụm từ khác nhau sau chuẩn hóa NFC, hoa/thường và khoảng trắng; 648 cặp; 18 chủ đề**, 36 cặp/chủ đề. Không trùng ID, không cặp đảo chiều trùng, không hai từ giống nhau hoặc từ rỗng. Chi tiết phân bố ở `data-audit.json`.
- Kiểm thử duyệt tất cả cấu hình hợp lệ 3–20 người; phân vai không trùng/thiếu, kể cả trọng số lịch sử lớn; 8 người/1 imposter = 7 A + 1 B; 8 người/2 imposter = 6 A + 2 B khi hướng A/B cố định trong kiểm thử.
- Kiểm thử điều kiện thắng nhiều imposter, ưu tiên dân thường khi hết imposter, đoán cuối chỉ cho imposter cuối vừa bị loại, đáp án tương đương, chỉ chốt một lần, người bị loại không vào lượt mới, hòa/bầu lại/tiếp tục hòa, tập ứng viên hòa, tự bầu bị chặn, thao tác phiên bản cũ không ghi phiếu trùng.
- Kiểm thử thẻ: dưới/vượt ngưỡng kéo, thả che ngay, đóng hết mới Continue, xem lại, khóa nhấp đôi, đổi người reset, blur, pointer cancel, visibilitychange. Đã phát hiện và sửa lỗi blur gỡ nút Continue trước sự kiện click; có kiểm thử hồi quy.
- Kiểm thử deadline thực, tạm dừng và tiếp tục sau thời gian dài; bộ lọc rỗng bị chặn; chống lặp cặp đến khi hết; lưu ảnh chụp cặp; dữ liệu lỗi; nhập JSON lỗi/cặp trùng/ID trùng.

## Kiểm tra trình duyệt trực tiếp

Trình duyệt trong ứng dụng, bản production tại `http://127.0.0.1:4173/`:

- Chơi trọn ván **8 người/1 imposter**, 4 vòng: loại 3 dân thường rồi imposter cuối, chốt một đáp án sai, xác nhận kết quả dân thường thắng. Từ chỉ xuất hiện đầy đủ sau chốt đoán cuối.
- Chơi trọn ván **8 người/2 imposter**, 4 vòng: loại 4 dân thường, còn 2 imposter/2 dân thường, imposter thắng đúng luật.
- Phát đủ từ qua 8 lượt; kiểm tra vuốt ngắn không Continue, kéo đủ và thả che; kiểm tra bàn phím mũi tên lên giữ/thả và Continue.
- Tải lại lúc người chơi 2 nhận máy: vẫn đúng người 2, từ che, không có Continue trước khi xem lại.
- Tải lại sau một phiếu: mở đúng lượt người bỏ phiếu thứ 2, giữ phiếu đã khóa, lựa chọn trước được che; tổng cuối đúng 8 phiếu.
- Thêm → sửa → xác nhận xóa một cặp tự tạo qua giao diện; kiểm tra tìm kiếm và lọc.
- Bố cục desktop, viewport 390×844 và 320×740. Bản cuối ở 320px: document clientWidth = scrollWidth = 305px khi có thanh cuộn desktop, không cuộn ngang. Điện thoại thật thường không chiếm bề rộng bởi thanh cuộn.
- PWA phát hiện bản build mới và hiện nút cập nhật; chỉ sau bấm nút ngoài ván mới áp dụng bản mới.
- **Ngoại tuyến đã kiểm tra**: tắt máy chủ 4173, xác nhận HTTP không kết nối được; tải lại trình duyệt vẫn mở app; tìm “Mojito” trong kho vẫn có cặp đúng; tạo ván mới và chuyển sang người chơi 2 thành công khi máy chủ vẫn tắt. Sau đó hủy ván kiểm tra qua xác nhận. Đã mở lại máy chủ để bàn giao địa chỉ chơi thử.
- Kiểm tra URL trực tiếp/đường dẫn dự phòng qua máy chủ tĩnh cục bộ. Vercel có cấu hình rewrite riêng đã chuẩn bị.

## Giới hạn cần ghi nhận

- Khi kiểm tra bản đầu, chưa có kho GitHub từ xa hoặc phiên Vercel gắn dự án. Sau đó người dùng đã cung cấp kho `peterdeptrai191/imposter-viet`; remote `origin` đã được cấu hình tới kho đó, nhánh `main`. Chưa triển khai Vercel; chưa xác minh URL production công khai hay rewrite trên hạ tầng Vercel thực tế.
- Chưa thử trên phần cứng iPhone/Android thật, chưa thử cài biểu tượng ngoài màn hình chính trên hai hệ điều hành đó. Kiểm tra mobile ở đây là viewport trình duyệt.
- Chưa mô phỏng mọi tổ hợp vòng đời hệ điều hành, trình duyệt, thiếu bộ nhớ hoặc xóa cache. Không bảo đảm mọi trình duyệt luôn giữ offline cache; trình duyệt có thể tự dọn bộ nhớ.
- Có kiểm tra thông báo và áp dụng cập nhật giữa hai bản build cục bộ. Chưa kiểm tra hai deployment Vercel thực hoặc mọi tình huống mất mạng giữa lúc cập nhật.
- Hòa phiếu và các nhánh đoán đúng/xác nhận tương đương được kiểm tra tự động. Hai ván trình duyệt không chủ đích tạo hòa hoặc đoán đúng.
- Nội dung được chọn thủ công và đọc rà soát về nghĩa, đã loại trùng toàn kho. Chưa có đánh giá độc lập bởi biên tập viên hoặc playtest với nhóm người thật để cân bằng độ khó.

Đây là trò chơi thiết bị dùng chung, không tuyên bố chống gian lận tuyệt đối. Dữ liệu chỉ lưu ở trình duyệt hiện tại.
