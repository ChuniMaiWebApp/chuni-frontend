# Luật khi code

Đọc file này trước khi sửa dòng đầu tiên.

## Được sửa

```
frontend/app/assets/css/main.css     ← token chrome, layout toàn cục
frontend/app/components/*.vue        ← trừ hai file dưới
frontend/app/pages/**/*.vue
frontend/app/layouts/*.vue           ← tạo mới nếu cần
frontend/app/composables/*.ts        ← chỉ khi thêm hành vi UI mới
```

## Không được sửa

```
backend/**                           ← toàn bộ. Không đụng.
frontend/shared/types/api.ts         ← hợp đồng với backend
frontend/app/utils/game-colours.ts   ← số liệu đã đo
frontend/app/utils/chunithm.ts       ← quy tắc hiển thị đã kiểm chứng
frontend/app/composables/useApi.ts   ← đã sửa một lỗi typing khó, đừng đụng
frontend/app/composables/useAuth.ts
design/00-game-colours.md
```

Với `RatingValue.vue` và `RankBadge.vue`: **được sửa cỡ chữ, khoảng cách, hình
khối**. **Không được sửa** logic chọn bậc màu, giá trị gradient, hay ngưỡng.

## Cấm tuyệt đối

**Không xoá thông báo giải thích cho người dùng.** Nhiều dòng chữ trong app
trông như thừa nhưng thực ra là kết quả của việc sửa bug thật:

- `songs/[id].vue` — thông báo bài chỉ có ở JP, kèm ngày dữ liệu
- `records/[songId]/[difficulty].vue` — ba nhánh giải thích vì sao có hoặc
  không có judgement
- `plays/[position].vue` — cảnh báo link đã trôi sang lượt chơi khác
- `recent.vue` — giải thích vì sao cần bấm Capture

Được **đổi cách trình bày** chúng. Không được bỏ. Nếu thấy chỗ nào thừa thật,
ghi vào `05-questions.md`.

**Không đổi `v-if` thành `v-show` hay ngược lại một cách tuỳ tiện** ở những chỗ
phân biệt `null` với `false`. Ví dụ lamp `null` nghĩa là "không có dữ liệu",
khác hẳn `FAILED`. Nhầm hai cái này từng là bug thật.

**Không dùng `!important`.** Nếu cần nó thì specificity đang sai ở chỗ khác.

## Một cái bẫy đã dính, đừng dính lại

CSS scoped của trang **vẫn chạm được root element của component con**. Cụ thể:

```css
/* trong best50.vue */
.rating span { font-size: 0.75rem; }   /* ← cũng trúng luôn <RatingValue> */
```

Nó đã âm thầm biến rating cầu vồng thành chữ xám 12px. Quy tắc: **đừng dùng
selector kiểu phần tử (`span`, `div`, `p`) làm hậu duệ** trong CSS của trang.
Luôn dùng class.

## Verify trước khi báo xong

Chạy đủ ba lệnh, cả ba phải sạch:

```bash
cd frontend && npx nuxt typecheck
```

```bash
cd frontend && npx eslint .
```

```bash
cd backend && npx jest
```

Lệnh thứ ba chạy để chắc chắn không có gì bên frontend làm hỏng hợp đồng API.
109 test phải pass.

Ngoài ra tự kiểm bằng mắt ở **cả light lẫn dark**, ít nhất các trang:
`/` `/profile` `/recent` `/best50` `/songs` và một trang chi tiết.

## Đo tương phản, đừng đoán

Bảng màu game rất khó ở light mode (xem `01-visual-direction.md` có số đo).
Sau khi đổi màu, tự đo lại. Đoạn này dán vào console là chạy:

```js
const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (r, g, b) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
const ratio = (a, b) => {
  const [l1, l2] = [lum(...a), lum(...b)]
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return ((hi + 0.05) / (lo + 0.05)).toFixed(2)
}
const rgb = (s) => s.match(/[\d.]+/g).map(Number)
// ví dụ: chữ mờ trên nền trang
ratio(rgb(getComputedStyle(document.body).color),
      rgb(getComputedStyle(document.body).backgroundColor))
```

Chữ thường cần **4.5:1**, chữ lớn (≥24px hoặc ≥19px đậm) cần **3:1**.

## Chạy app

```bash
cd backend && npm run start:dev
```

```bash
cd frontend && npm run dev
```

Frontend ở `localhost:3100`, API ở `localhost:3333`. Cần đăng nhập bằng SEGA ID
mới xem được phần lớn trang — hỏi chủ dự án nếu chưa có session.

## Báo cáo

Sửa xong thì ghi vào `05-questions.md`:

- Đã làm gì, ở file nào
- Chỗ nào phải đánh đổi, vì sao
- Chỗ nào muốn sửa nhưng bị luật trên chặn
- Số đo tương phản cho các cặp màu chính, cả hai theme
