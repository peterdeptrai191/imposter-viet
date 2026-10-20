# Imposter — Cùng một hội. Khác một từ.

Web app tiếng Việt để 3–20 người chơi trên một điện thoại. React + TypeScript + Vite, không backend, không tài khoản, không biến môi trường.

## Mở ngay trên máy hiện tại

Bản production đã được build trong `dist/`. Nhấp đúp **Choi-ngay.cmd** trên Windows. Tệp mở máy chủ cục bộ và trình duyệt tại **http://127.0.0.1:4173/**. Nếu cổng đang dùng bởi bản xem trước Imposter, dùng luôn trang đó. Đây là địa chỉ trên máy tính này; không phải link công khai và điện thoại khác không truy cập được địa chỉ loopback này.

Để chạy từ mã nguồn, cài Node.js LTS (22 trở lên, kèm npm), mở terminal trong **thư mục chứa package.json này**, chạy:

```sh
npm ci
npm run dev
```

Vite in địa chỉ thực tế, mặc định `http://127.0.0.1:5173/`. Dừng bằng Ctrl+C. Không mở `index.html` bằng cách nhấp đúp: app cần máy chủ HTTP.

```sh
npm run check    # TypeScript, kiểm thử luật/tương tác/lưu trữ, kiểm định kho từ
npm run test     # Kiểm thử Vitest
npm run build    # TypeScript + production build vào dist
npm run preview  # Xem bản production tại địa chỉ Vite in ra
```

## Cách chơi

1. Chọn Chơi ngay, thêm 3–20 tên khác nhau hoặc dùng tên nhanh. Lưu nhóm nếu muốn.
2. Chọn số imposter (1 đến floor((n−1)/2)), chủ đề, độ khó, nguồn từ và thời gian. Độ khó mặc định là Dễ; chế độ Khó có một số khái niệm chuyên hơn.
3. Chuyền máy đúng tên. **Kéo thẻ lên và giữ**, đọc từ, **thả ngón tay để che**. Chỉ khi thẻ đóng hoàn toàn mới có Continue. Bàn phím: giữ phím cách hoặc mũi tên lên, thả để che.
4. Mỗi người còn chơi mô tả một câu ngắn, không nói từ bí mật. Hết giờ chỉ báo, nhóm tự chuyển lượt. Sau đó thảo luận và chuyền máy bỏ phiếu kín. Có thể sửa lựa chọn trước khi xác nhận. Không tự bầu.
5. Người nhiều phiếu nhất bị loại và công bố vai. Người bị loại không mô tả/bỏ phiếu nữa. Khi hòa, ứng viên giải thích thêm và mọi người còn sống bầu lại giữa các ứng viên hòa. Hòa lần nữa thì không loại ai, chuyển vòng mới.
6. Dân thường thắng khi không còn imposter. Nếu còn imposter và số imposter sống bằng hoặc lớn hơn dân thường sống, imposter thắng.
7. Nếu bật đoán cuối, **chỉ imposter cuối cùng vừa bị loại** được đoán đúng một lần. Không tiết lộ đáp án trước bước này. Nhóm có thể xác nhận cách gọi tương đương. Người đã bị loại không được gợi ý.

Một hoặc nhiều imposter cùng nhận từ B; dân thường nhận từ A. A/B đổi ngẫu nhiên từng ván. Không ai được báo vai hoặc đồng đội khi nhận từ. Giảm lặp vai là trọng số ngẫu nhiên, không bảo đảm miễn vai. Tránh lặp cặp trong tập lọc đến khi hết.

## Kho từ và cách thêm

Kho có **1.289 từ/cụm từ riêng biệt, 648 cặp không đảo chiều trùng, 18 chủ đề**, 36 cặp mỗi chủ đề. Báo cáo thực tế ở `reports/data-audit.json`; lệnh `npm run check` cập nhật báo cáo. Kho tách theo chủ đề trong `src/data/*.json`. Bộ lọc dùng độ khó Dễ/Vừa/Khó/Trộn và một/nhiều/tất cả chủ đề.

Trong app, mở **Kho từ → Thêm cặp từ**, hoặc sao chép cặp có sẵn thành bản tự tạo. Chỉ cặp tự tạo được sửa/xóa. Nhập JSON có bước xem trước, bỏ qua cặp trùng/đảo chiều và cấp ID mới khi trùng ID, không ghi đè âm thầm. Xuất chỉ chứa bộ tự tạo. Cách gọi tương đương chỉ dùng để so đáp án đoán cuối, vẫn giữ dấu tiếng Việt, không phân biệt hoa/thường hoặc khoảng trắng thừa.

Ví dụ tệp nhập (cũng dùng được mảng trực tiếp):

```json
{"version":1,"pairs":[{"id":"hoi-ban-001","a":"Bánh quy","b":"Bánh gạo","topic":"Món ăn","difficulty":"easy","source":"custom","aliasesA":[],"aliasesB":[]}]}
```

Để bổ sung kho có sẵn: thêm đối tượng vào tệp chủ đề thích hợp, ID duy nhất ổn định, source `builtin`, difficulty `easy`/`medium`/`hard`; rồi chạy `npm run check`. Chọn cặp có điểm chung và khác biệt, không phải đồng nghĩa hay ghép tùy tiện. Nhập JSON giới hạn 3 MB, tối đa 5.000 cặp/lần.

Các cặp được chọn và đọc rà soát về nghĩa; đã thay các cặp trùng giữa chủ đề. **Chưa có đánh giá độc lập hoặc playtest cân bằng độ khó với nhóm người thật.** Kiểm định tự động chỉ chứng minh cấu trúc, số lượng, ID và trùng lặp.

## Lưu và khôi phục

Một bản lưu có phiên bản `1` trong localStorage (`imposter-viet-v1`): nhóm, thiết lập, từ riêng, ván đang chơi, 50 ván gần nhất, đánh giá, cặp đã dùng và lịch sử vai. Mỗi ván giữ bản chụp cặp từ nên sửa kho không đổi từ ván đó. Phiếu xác nhận được lưu thành một lần ghi cùng toàn bộ trạng thái ván, có số phiên bản thao tác để chống ghi lặp. Tải lại lúc xem từ quay về đúng người, luôn che và yêu cầu xem lại; tải lại bỏ phiếu giữ các phiếu khóa và che lựa chọn.

Dữ liệu chỉ nằm trong trình duyệt hiện tại, không tự đồng bộ. Khi JSON lỗi, app phục hồi phần hợp lệ và báo ngắn gọn. Bộ nhớ bị chặn/đầy sẽ có thông báo. Hủy ván và xóa toàn bộ có xác nhận. Trình duyệt ẩn danh hoặc xóa dữ liệu website sẽ mất bản lưu. App che nội dung khi thả tay, pointer cancel, blur hoặc chuyển ứng dụng nhưng không bảo đảm chống gian lận tuyệt đối trên thiết bị chung.

## Kiến trúc

- `src/engine.ts`: phân vai, chọn cặp, luật, chuyển trạng thái có khóa phiên bản.
- `src/types.ts`: mô hình dữ liệu và mặc định.
- `src/storage.ts`: lưu, phục hồi và xem trước nhập JSON.
- `src/data/`: kho theo chủ đề; `src/data.ts`: tổng hợp bộ từ.
- `src/components.tsx`: thẻ giữ để xem và đồng hồ tính theo deadline thực.
- `src/App.tsx`: các màn hình và điều phối ván.
- `vite.config.ts`: manifest, cache app + kho từ bằng Workbox, cập nhật chủ động.
- `src/*.test.*`, `scripts/check-data.ts`: kiểm thử và kiểm định dữ liệu.

## GitHub → Vercel

Hiện **chưa có kho GitHub từ xa được kết nối và chưa triển khai Vercel**. Mã nguồn và cấu hình đã chuẩn bị; không cần gửi mật khẩu/token cho Codex.

1. Đăng nhập GitHub trên trình duyệt, chọn **New repository**, đặt tên `imposter-viet`, tạo kho trống. Gửi URL kho đó cho Codex để được đẩy mã bằng luồng đăng nhập công cụ. Hoặc dùng GitHub Desktop → Add local repository và Publish repository cho thư mục này. Đưa **nội dung thư mục imposter** vào gốc kho, không đưa `node_modules` hay `dist` lên GitHub.
2. Đăng nhập Vercel bằng tài khoản của bạn. Chọn **Add New → Project**, kết nối GitHub, Import kho.
3. Chọn chính xác:

| Trường | Giá trị |
| --- | --- |
| Framework Preset | **Vite** |
| Root Directory | **.** nếu package.json ở gốc kho (cách bàn giao này). Nếu đẩy nguyên thư mục cha của chat, chọn **outputs/imposter** |
| Install Command | **npm ci** |
| Build Command | **npm run build** |
| Output Directory | **dist** |
| Environment Variables | **Để trống, không cần** |

4. Bấm **Deploy**. Khi Vercel báo thành công, mở URL deployment để kiểm tra. URL Production trong dashboard là link chia sẻ chính; các deployment nhánh khác là bản Preview riêng. Không nhầm link localhost với link Vercel.
5. Mở link HTTPS trên điện thoại, chơi thử; Chrome Android: menu → Thêm vào màn hình chính/Cài đặt ứng dụng. Safari iPhone: Chia sẻ → Thêm vào màn hình chính. Đợi app tải xong, vào Cài đặt kiểm tra ngoại tuyến, rồi tắt mạng và mở lại. Gửi link production cho bạn bè.

Cấu hình Vite/SPA được đối chiếu với [tài liệu Vercel chính thức](https://vercel.com/docs/frameworks/frontend/vite). `vercel.json` có rewrite để tải lại đường dẫn không bị 404; app hiện dùng một URL và lưu bước chơi bằng trạng thái, không bắt buộc router riêng.

### Cập nhật sau này

Yêu cầu Codex sửa tính năng, kiểm tra và đẩy lên nhánh production đã kết nối; Vercel sẽ tạo deployment mới. Kiểm tra Build Logs và link. Người đang chơi giữ phiên bản cache cũ đến khi chủ động chọn **Cập nhật ứng dụng** ngoài ván; app không tự tải lại giữa ván. Kho từ và mã được precache cùng phiên bản. HTML/service worker có cấu hình revalidate, không đặt cache HTML cũ vô hạn.

### Lỗi triển khai thường gặp

- **Không thấy package.json**: chọn sai Root Directory. Chọn thư mục có tệp này, không chọn `src` hoặc `dist`.
- **Không tìm thấy output**: Output Directory phải là `dist`, Build Command `npm run build`.
- **npm ci báo lockfile lệch**: sau thay dependencies phải chạy `npm install` và commit cả `package-lock.json`.
- **TypeScript/build thất bại**: gửi phần Build Logs từ dòng lỗi đầu tiên đến dòng `Error: Command ... exited` cho Codex; không cần tự sửa mã.
- **Trang trắng/404**: kiểm tra URL production, cấu hình Vite, `vercel.json`, và tải lại; gửi lỗi đầu tiên trong Console nếu có. Không mở file HTML trực tiếp.
- **Chưa offline**: phải dùng production build trên HTTPS (hoặc localhost), chờ lần tải đầu thành công. Dev server không bật service worker. Một số chế độ riêng tư chặn cache.
- **Chưa thấy bản mới**: kết thúc ván rồi chọn cập nhật khi banner xuất hiện. Giữ nguyên domain production để giữ localStorage. Đổi domain/từ preview sang production là vùng lưu khác.

Kết quả kiểm tra và giới hạn thử nghiệm được ghi trong `reports/verification.md`.
