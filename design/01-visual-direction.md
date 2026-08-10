# Brief 1 — Hướng thị giác

**Đọc `00-game-colours.md` trước.** Mọi màu thuộc về game đều lấy từ đó.

## Bối cảnh

App queue cho máy CHUNITHM ở Việt Nam. Ít máy, đông người chơi. Trước khi làm
phần queue, giao diện hiện tại cần được tổ chức lại.

Người dùng là người chơi rhythm game, thường mở app **khi đang đứng ở tiệm
game, trên điện thoại, một tay**, để xem điểm vừa chơi hoặc chờ tới lượt. Đây
không phải dashboard ngồi bàn.

Giao diện hiện tại là placeholder: bảng màu chrome chỉ là giá trị tạm, chưa có
bản sắc gì.

**Đã dựng sẵn, đừng thiết kế lại:** cơ chế light/dark đã chạy — token trong
`app/assets/css/main.css`, chuyển bằng `data-theme` trên `<html>`, ba trạng thái
(auto/light/dark), lưu vào localStorage, có script chạy trước paint để không
nháy. Màu game đã đo xong và nằm trong token. Việc của brief này là **giá trị
màu**, không phải cơ chế.

## Việc cần làm

Định ra hướng thị giác cho app, bám bản sắc X-VERSE-X, chạy được cả light lẫn
dark.

### 1. Bảng màu chrome

Đề xuất token cho **nền, bề mặt, viền, chữ, chữ mờ, nhấn, thành công, lỗi** —
đủ cho cả hai theme. Nêu rõ giá trị hex.

Ràng buộc:

- Bản sắc X-VERSE-X là `#b700ff`. **Nhưng nó gần như trùng màu MASTER
  `#8c1be1`.** Phần lớn nội dung app là chart MASTER. Giải quyết mâu thuẫn này
  và nói rõ cách giải quyết. Vài hướng: đổi màu nhấn sang lục lam `#18f2d1`;
  giữ tím nhưng chỉ dùng ở chrome, không bao giờ cạnh badge difficulty; hoặc
  dùng tím ở độ bão hoà khác hẳn. Chọn một, lý giải.
- Tương phản chữ đạt WCAG AA (4.5:1) ở **cả hai** theme. Ghi kèm tỉ số cho các
  cặp chính.
- Dark là mặc định — hầu hết người chơi mở app trong tiệm tối.

### 2. Vấn đề light mode

Bảng màu game sinh ra để đặt trên nền tối. Đây **không phải phỏng đoán** — tôi
đã dựng light mode và đo tỉ số tương phản thật trên nền `#f7f7f9`:

| Màu | Tương phản | WCAG AA cần |
|---|---|---|
| `--rating-platinum` `#fff9e5` | **1.02:1** | 4.5:1 |
| `--rank-s` `#fbecad` | **1.11:1** | 4.5:1 |
| `--rating-green` `#32fd23` | **1.29:1** | 4.5:1 |
| `--rating-silver` `#8ae7ff` | **1.31:1** | 4.5:1 |
| `--rating-gold` `#f6cb11` | **1.46:1** | 4.5:1 |
| `--rating-purple` `#fd66f5` | **2.34:1** | 4.5:1 |

Không màu nào đạt. `platinum` ở 1.02:1 là **vô hình theo đúng nghĩa đen**.

Đây là vấn đề thật, không lờ được. Đề xuất một cơ chế **nhất quán** — ví dụ mọi
giá trị game trên light mode đều nằm trong "chip" nền tối, hoặc mỗi màu có bản
đồng hành đã tối lại cho light mode, hoặc dùng viền/đổ bóng thay vì đổi màu.
Chọn một cơ chế và áp dụng cho tất cả, đừng xử lý từng ca.

Nếu chọn cách có màu đồng hành: liệt kê giá trị hex cho **cả 9 tier rating và
14 rank**. Giữ đúng sắc độ, chỉ chỉnh độ sáng và bão hoà.

### 3. Chữ

Hiện dùng system font stack. Đề xuất giữ hay đổi, lý giải. Ràng buộc thật:

- Tên bài hát có **tiếng Nhật, tiếng Anh, ký hiệu, chữ toàn rộng** lẫn lộn.
  Tên người chơi luôn toàn rộng (`♪Ｓｅｅｌｅ♪`).
- Điểm số, rating, notecount cần `font-variant-numeric: tabular-nums` — chúng
  nằm trong danh sách và phải thẳng cột.
- Không dùng webfont từ CDN ngoài. Nếu muốn font riêng thì phải self-host, và
  cân nhắc dung lượng khi phải cover cả kana/kanji.

### 4. Nhịp và hình khối

Đề xuất thang khoảng cách, bán kính bo góc, thang đổ bóng, thang cỡ chữ. Ghi
dạng token.

Bối cảnh: dùng một tay trên điện thoại. Vùng chạm tối thiểu 44px. Danh sách dài
là màn hình chính, nên mật độ thông tin quan trọng hơn khoảng thở.

### 5. Nút chuyển theme

Cơ chế đã xong. Hiện nút nằm ở góc phải header, một nút xoay vòng
auto → light → dark, nhãn `◐ ☀ ☾`.

Chỉ cần góp ý **vị trí và hình thức**: một nút xoay vòng có đủ rõ không, hay nên
là ba lựa chọn hiện rõ? Icon hiện tại có đọc được không? Trên mobile nó nên nằm
đâu khi header phải gánh cả nav?

## Cách làm

**Sửa thẳng `frontend/app/assets/css/main.css`.** Đọc
`04-implementation-rules.md` trước.

Token chrome hiện tại là giá trị tạm — thay hết. Token game thì giữ nguyên.

Xong thì ghi vào `05-questions.md`: bảng token mới (hex, cột light, cột dark),
lý giải ngắn cho các quyết định lớn, và **số đo tương phản thật** cho các cặp
chính ở cả hai theme.

Đừng chỉ mô tả. Code chạy được mới tính.
