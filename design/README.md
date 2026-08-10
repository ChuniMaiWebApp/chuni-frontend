# design/

Brief cho việc thiết kế lại giao diện. **Gemini viết code thật trong repo**,
không phải viết spec để người khác làm.

## Thứ tự đọc

| File | Nội dung |
|---|---|
| `00-game-colours.md` | Bảng màu game đã đo từ file của SEGA. **Đọc trước. Không sửa.** |
| `04-implementation-rules.md` | Được động vào file nào, cấm gì, verify ra sao. **Đọc thứ hai.** |
| `01-visual-direction.md` | Bảng màu chrome, light mode, chữ, nhịp |
| `02-information-architecture.md` | Gom lại 15 trang + chỗ cho queue |
| `03-component-specs.md` | Hình thức từng component |

## Phân chia

**Gemini code**: toàn bộ CSS, layout, cấu trúc component, điều hướng, trạng
thái rỗng/chờ. Sửa file trong `frontend/app/` trực tiếp.

**Claude đã làm xong, đừng làm lại**:

- Cơ chế light/dark: `data-theme` trên `<html>`, ba trạng thái
  auto/light/dark, lưu localStorage, script chạy trước paint để không nháy.
  Composable `useTheme()`.
- Toàn bộ màu game đã đo và nằm trong token CSS.
- `RatingValue` và `RankBadge` — logic bậc màu và cầu vồng đã đúng game.
- Mọi thứ ở `backend/`.

Nếu thấy cần đổi những phần trên, **ghi vào `05-questions.md`** thay vì tự sửa.
Sẽ có người xem xét.

## Ràng buộc bắt buộc

1. **Không đổi số liệu.** Rating, OP, judgement, ngưỡng màu đều đã kiểm chứng
   với tài khoản thật và có test. Không đụng vào cách tính.
2. **Không thêm dependency.** Không Tailwind, không component library, không
   icon pack, không webfont từ CDN. CSS thuần với custom property — đây là
   quyết định đã chốt, vì mọi màu game là giá trị động đọc từ dữ liệu.
3. **Không tự nghĩ màu cho thứ thuộc về game.** Rank, lamp, difficulty, rating
   tier, Linked VERSE — lấy từ token trong `main.css`.
4. **Không avatar.** Đã bỏ khỏi phạm vi.
5. **Phải chạy verify trước khi báo xong.** Xem `04-implementation-rules.md`.

## Hiện trạng

Nuxt 4, `frontend/app/pages/*.vue`, CSS scoped mỗi component, token toàn cục ở
`frontend/app/assets/css/main.css`.

Trang đang có:

`/` `/login` `/profile` `/recent` `/plays/:position` `/best50` `/top`
`/statistics` `/improve` `/songs` `/songs/:id` `/records/:songId/:difficulty`
`/leaderboard` `/ranking` `/tools`

Component dùng chung: `AppHeader` `ScoreCard` `ScoreDetail` `StatusCard`
`ApiError` `RatingValue` `RankBadge`.

Sắp có: **queue** — xem hàng chờ ở một tiệm, vào hàng, biết còn bao lâu tới
lượt. Đây sẽ là lý do chính người ta mở app, nên điều hướng phải chừa chỗ.
