# Brief 2 — Tổ chức lại thông tin

**Đọc `00-game-colours.md` và `01-visual-direction.md` trước.**

## Vấn đề

15 trang, tất cả đều nằm ngang hàng nhau trên một thanh nav. Nav hiện tại:

```
Profile · Recent · Best 50 · Top · Stats · Improve · Rankings · Songs · Tools
```

Chín mục, không phân nhóm, không cho biết cái nào dùng thường xuyên. Trên điện
thoại nó xuống dòng thành đống lộn xộn. Và **phần queue sắp thêm vào sẽ là
tính năng quan trọng nhất của app** — hiện chưa có chỗ cho nó.

## Toàn bộ trang đang có

| Route | Nội dung | Nguồn dữ liệu |
|---|---|---|
| `/` | Trang chủ, hiện danh sách link + trạng thái hệ thống | cục bộ |
| `/login` | Đăng nhập SEGA ID | — |
| `/profile` | Thẻ người chơi, banner, rating, OP, level, credit, login bonus, tiến trình Linked VERSE, đổi tên | CHUNITHM-NET, nhiều request |
| `/recent` | 50 lượt chơi gần nhất | CHUNITHM-NET |
| `/plays/:position` | Chi tiết một lượt: judgement, note accuracy, credit | CHUNITHM-NET, 2 request |
| `/best50` | Best 30 + New 20, tổng rating | CHUNITHM-NET |
| `/records/:songId/:difficulty` | Thành tích trên một chart | CHUNITHM-NET + cache |
| `/top` | Lọc và sắp xếp mọi personal best | cache cục bộ |
| `/statistics` | Độ phủ folder, đếm rank/lamp, OP, đồng bộ | cache cục bộ |
| `/improve` | Điểm cần đạt, gợi ý bài nên chơi | CHUNITHM-NET |
| `/songs` | Tìm bài | cục bộ |
| `/songs/:id` | Chi tiết bài, mọi chart | cục bộ |
| `/leaderboard` | Top 100 của một chart | CHUNITHM-NET |
| `/ranking` | 3 bảng xếp hạng toàn server | CHUNITHM-NET |
| `/tools` | Máy tính rating, OP, border, anmitsu | thuần tính toán |

Sắp có: **queue** — xem hàng chờ ở một tiệm, vào hàng, biết còn bao lâu tới
lượt. Đây sẽ là lý do chính người ta mở app.

## Việc cần làm

### 1. Nhóm lại điều hướng

Đề xuất cấu trúc nav gánh được 15 trang **cộng thêm queue** mà không thành một
hàng chữ dài.

Suy nghĩ theo tần suất dùng thật:

- Người chơi ở tiệm mở app để **vào hàng chờ** và **xem điểm vừa chơi**. Đây là
  đường đi nóng.
- Best 50, Statistics, Improve là để xem lúc rảnh.
- Songs, Tools, Ranking là tra cứu, thỉnh thoảng.
- Leaderboard và Records gần như luôn được mở từ một trang khác, hiếm khi vào
  thẳng.

Cân nhắc: thanh tab dưới cho mobile? Nav gộp nhóm? Trang chủ làm bảng điều
khiển thay vì danh mục link?

Nói rõ **cái gì hiện luôn, cái gì nằm sau một lần chạm, cái gì chỉ tới được từ
ngữ cảnh khác**.

### 2. Trang chủ nên là gì

Hiện nó chỉ là danh sách link — lặp lại y nguyên thanh nav. Lãng phí.

Đề xuất nó nên hiện gì cho người **đã đăng nhập**. Nguyên liệu có sẵn: rating
hiện tại, lượt chơi gần nhất, trạng thái đồng bộ, độ tươi dữ liệu bài, tiến
trình Linked VERSE, và sắp tới là trạng thái hàng chờ.

Ràng buộc thật: mỗi mẩu dữ liệu CHUNITHM-NET là **một request tới SEGA**, có
rate limit chung cho cả instance. Trang chủ nhồi 6 widget sống là thiết kế tồi.
Nói rõ cái nào đọc từ cache cục bộ, cái nào cần gọi mạng, và cái nào nên chờ
người dùng bấm.

### 3. Trang Profile đang quá tải

Đang nhồi: thẻ người chơi, banner nameplate, rating, OP, level, credit, play
count, login bonus (theo tháng + chuỗi + theo thứ), tiến trình Linked VERSE
(10 cổng), và form đổi tên.

Đề xuất cắt ra hay tổ chức lại. Cái gì thuộc về đây, cái gì nên đi chỗ khác.

### 4. Trang có nội dung trùng nhau

- `/best50` và `/top` đều là danh sách personal best. Khác nhau: best50 là 50
  bài game tính rating (lấy trực tiếp từ SEGA), top là **mọi** bài trong cache
  cục bộ, có lọc. Người dùng không đoán được điều đó từ tên trang.
- `/statistics` và `/improve` đều nói về "bạn đang ở đâu và cần gì tiếp".

Đề xuất gộp, đổi tên, hay để nguyên nhưng làm rõ khác biệt.

### 5. Trạng thái rỗng và trạng thái chờ

Mọi trang gọi CHUNITHM-NET đều mất **1–3 giây** vì phải đi qua SSO và bị rate
limit. Hiện chỉ hiện chữ "Loading…".

Đề xuất cách xử lý cho thống nhất: skeleton? giữ dữ liệu cũ mờ đi? chỉ báo tiến
trình?

Cũng cần: người dùng chưa từng đồng bộ nhìn thấy gì ở `/top` và `/statistics`?

## Cách làm

**Code thẳng.** `AppHeader.vue`, `pages/index.vue`, `pages/profile.vue`, và
tạo layout mới nếu cần. Đọc `04-implementation-rules.md` trước.

Nếu định **gộp hoặc bỏ** một trang: đừng xoá file. Ghi đề xuất vào
`05-questions.md` rồi chờ duyệt — có trang được link tới từ chỗ khác, xoá là
gãy.

Đổi cấu trúc điều hướng và bố cục trang thì cứ làm.

Xong thì ghi vào `05-questions.md`: đã đổi gì, ở đâu, và lý do cho các quyết
định lớn.
