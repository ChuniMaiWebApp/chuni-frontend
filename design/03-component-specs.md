# Brief 3 — Spec component

**Đọc `00-game-colours.md` trước.** Màu game lấy từ đó, không tự nghĩ.

Đây là những mảnh xuất hiện lặp đi lặp lại. Làm đúng chúng thì phần lớn app tự
khắc đúng theo.

## 1. Giá trị rating — `RatingValue.vue`, đã xong phần màu

Xuất hiện ở: profile, best50, mọi score card, ranking, improve.

**Đã làm, không sửa:** 9 bậc màu; rating từ 16.00 trở lên dùng gradient cầu
vồng **dọc** (hồng → vàng → chanh → lục → bạc hà → lục lam), đo scanline từ
`rating_rainbow_*.png`; keyline tối chỉ bật ở light mode qua token
`--iridescent-outline`.

Lưu ý: gradient là **tĩnh và dọc**, không phải quét ngang. Đây là cách game vẽ
thật, đã đối chiếu với ảnh chụp trong game.

**Còn lại cho bạn:** cỡ chữ và khoảng cách ở ba mức `sm` `md` `lg`, và làm sao
phân biệt **rating tổng của người chơi** với **play rating của một lượt** —
hiện chỉ khác nhau ở font-weight, chưa đủ rõ.

## 2. Huy hiệu rank — `RankBadge.vue`, đã xong phần màu

D · C · B · BB · BBB · A · AA · AAA · S · S+ · SS · SS+ · SSS · SSS+

**Đã làm, không sửa:** màu từng rank; S trở lên có nền tô để tách khỏi nhóm
dưới; SSS+ dùng cùng gradient cầu vồng.

Chỗ khó vẫn còn: **artwork của SEGA dùng chung một màu cho S đến SSS**. Hiện
tôi chỉ phân biệt chúng bằng chữ. Nếu bạn nghĩ ra cách phân cấp tốt hơn —
độ đậm viền, ánh kim tăng dần — thì làm, miễn là **không bịa ra 5 màu mới**.

## 3. Lamp

Clear: `FAILED` `CLEAR` `HARD` `BRAVE` `ABSOLUTE` `CATASTROPHY`
Combo: `FULL COMBO` `ALL JUSTICE` `ALL JUSTICE CRITICAL`
Chain: `FULL CHAIN` `FULL CHAIN+`

Một lượt chơi có thể mang nhiều lamp cùng lúc. Quy tắc hiển thị **đã cố định
trong code, không đổi**: combo lamp lấn át clear lamp, nên `CLEAR` chỉ hiện khi
combo lamp là `NONE`.

Lamp `null` nghĩa là trang nguồn không có dữ liệu badge — **không phải**
`FAILED`. Phải hiện khác đi. Nhầm hai cái này từng là một bug thật.

Đề xuất màu và hình thức. `ALL JUSTICE CRITICAL` phải rực rỡ nhất — nó cực
hiếm.

## 4. Score card

Component dùng nhiều nhất. Xuất hiện ở recent, best50, top, improve,
statistics.

Đang hiện: jacket, số track hoặc thứ hạng, tên bài, difficulty + level +
const, rank, điểm, lamp, rating, OP + phần trăm, thời gian.

Đó là nhiều thứ trong một ô nhỏ. Đề xuất trật tự phân cấp thị giác — **cái gì
đọc trước, cái gì lùi lại**.

Nhớ bối cảnh: người dùng lướt danh sách 50 mục trên điện thoại, một tay. Cái họ
tìm thường là "bài này tôi được bao nhiêu" hoặc "bài này đáng bao nhiêu rating".

Cần: biến thể dày đặc (danh sách) và biến thể thoáng (điểm nhấn).

## 5. Bảng chi tiết một lượt

Đã có ở `/plays/:position` và `/records/:songId/:difficulty`. Xem screenshot
trong repo hoặc chạy thử.

Đang hiện bốn panel: Judgements (kèm điểm mất từng loại), Note accuracy (thanh
phần trăm theo loại note), Worth (rating/OP), Credit (nhân vật/skill).

Đề xuất cải thiện bố cục. Câu hỏi cần trả lời: bốn panel ngang hàng có đúng
không, hay judgement nên nổi bật hơn hẳn?

## 6. Bảng xếp hạng

`/leaderboard` và `/ranking` đều là danh sách hạng — tên — giá trị.

Đã xử lý: đồng hạng hiện `=` thay vì lặp số, dòng của chính người dùng được
highlight.

Đề xuất hình thức. Lưu ý top 3 chưa có gì đặc biệt — có nên không?

## 7. Linked VERSE

10 cổng, mỗi cổng một trạng thái: `not_found` `under_analysis` `linkable`
`clear` `unknown`.

`unknown` **không được** trông giống `not_found`. Nhầm hai cái này chính là bug
đã sửa: hệ thống báo "chưa phá cổng" trong khi người chơi đã phá rồi.

Đề xuất cách hiển thị 10 cổng gọn gàng, phân biệt rõ 5 trạng thái.

## 8. OVER POWER

Luôn đọc tương đối so với trần của chart. Hiện đang là `81.015 (87.11%)`.

Đề xuất: có nên là thanh tiến độ không? Con số thô có ý nghĩa với người chơi
không, hay chỉ phần trăm mới có?

## Cách làm

**Code thẳng vào `frontend/app/components/`.** Đọc
`04-implementation-rules.md` trước — đặc biệt phần nói `RatingValue.vue` và
`RankBadge.vue` chỉ được sửa hình thức, không được sửa logic màu.

Ưu tiên **score card** trước: nó chiếm phần lớn diện tích app.

Nhớ làm cả trạng thái rỗng, đang tải, lỗi, và thiếu dữ liệu — không chỉ trạng
thái đẹp.

Xong thì ghi vào `05-questions.md`.
