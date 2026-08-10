# Review vòng 1 và việc tiếp theo

Claude viết. Gemini đọc rồi làm phần "Việc tiếp theo".

## Đánh giá chung

Làm được nhiều và verify là thật — typecheck, eslint, 109/109 jest đều sạch,
tôi chạy lại và xác nhận. Bốn thông báo bắt buộc đều còn nguyên. Không tự ý
đụng vào backend hay file cấm. Tốt.

Ba vấn đề dưới đây tôi đã tự sửa vì chúng thuộc loại đúng-sai, không phải thẩm
mỹ. Nêu ra để lần sau tránh.

### 1. Số enum lọt ra giao diện

`ScoreCard.vue` in `{{ score.chart.difficulty }}` lên jacket. Trường đó là
**enum số** — EXPERT là 2, MASTER là 3. Người chơi thấy "2" và "3" nằm chình
ình trên ảnh bìa, không có nghĩa gì.

Sửa lần một: đổi sang `score.chart.level`. Chủ dự án xem rồi bảo bỏ hẳn — và
đúng: dòng chữ ngay cạnh đã ghi `MASTER 15.5`, tức **chart constant**, chính xác
hơn `15+`. Nhãn trên jacket chỉ là bản kém hơn của thông tin đã có.

Đã gỡ luôn cả `.score__diff-tag` lẫn `position: relative` trên khung jacket
(không còn gì định vị theo nó nữa). **Đừng thêm lại.**

**Bài học:** trước khi in một trường ra màn hình, kiểm hai điều — nó là dữ liệu
cho người đọc hay mã nội bộ, và chỗ khác trên cùng thẻ đã nói điều đó chưa.

### 2. AJC hiện màu xám — thành tựu hiếm nhất game

`getLampClass()` phân loại lamp bằng cách **đọc lại chuỗi hiển thị**:

```js
if (normalized.includes('CRITICAL')) return 'score__lamp--ajcr'
if (normalized.includes('ALL JUSTICE')) return 'score__lamp--aj'
```

Nhưng nhãn của ALL JUSTICE CRITICAL là `'AJC'` — viết tắt. Nó không chứa
`CRITICAL`, cũng không chứa `ALL JUSTICE`. Rơi hết xuống `--default` và ra màu
xám.

Ngoài ra `HARD` `BRAVE` `ABSOLUTE` `CATASTROPHY` — đều là clear **khó hơn**
CLEAR — cũng rơi xuống xám, trong khi CLEAR thường lại có màu xanh.

Đã sửa: thêm `app/utils/lamps.ts` phân loại theo **giá trị enum**, và
`components/LampBadge.vue` để tô màu. Nhãn và loại đi cùng nhau, không suy ra
từ nhau nữa.

**Bài học:** đừng phân loại bằng cách parse ngược chuỗi hiển thị. Chuỗi hiển
thị là để người đọc, nó đổi lúc nào cũng được.

### 3. Bảng tương phản báo sai

Báo cáo ghi `#0d9488` trên `#ffffff` là **4.8:1**. Đo lại: **3.74:1** — trượt
WCAG AA.

Đo bằng công thức WCAG (`(L1+0.05)/(L2+0.05)`, L là relative luminance sau khi
linearise sRGB). Đoạn JS trong `04-implementation-rules.md` làm đúng việc này —
dùng nó, đừng ước lượng.

---

## Đã sửa thêm: màu accent

Chủ dự án phản hồi cyan **chói ở dark mode, bợt ở light mode**. Đo lại thì đúng:

| | Dark | Light |
|---|---|---|
| `#18f2d1` / `#0d9488` (cyan cũ) | 12.26:1 — quá gắt | 3.74:1 — trượt AA |
| `#d98cff` / `#8b3dc9` (mới) | 7.65:1 | 5.82:1 |

12:1 cho một màu nhấn là quá cao — nó nhảy ra khỏi màn hình. Vùng dễ chịu cho
accent là khoảng 5–8:1.

Màu mới là tím orchid dịu — vẫn thuộc họ tím-magenta của X-VERSE-X như yêu cầu
ban đầu, nhưng nhạt và ít bão hoà hơn MASTER `#8c1be1` nên không lẫn.

---

## Vòng 2 — Claude đã sửa thêm

### ULTIMA sai màu

Code để `#c80000` (đỏ sẫm). Đo `musiclevel_ultimate.png` của SEGA: ULTIMA là
**`#141414` gần đen**, chữ kem `#f9f9db`, viền hồng đỏ `#ff2854`.

Nhưng đen thuần không dùng làm chữ trên nền tối được. Cách game giải: nhãn
difficulty là **tấm nền màu, chữ kem** — nên tôi làm đúng vậy cho tất cả
difficulty (`DifficultyLabel.vue`). ULTIMA ra đen với viền hồng đỏ, đúng cabinet.

Hai hàm giờ khác nhau, đừng dùng lẫn:

- `difficultyColour()` — màu thật, dùng cho **nền** tấm.
- `difficultyInk()` — màu nhìn thấy được, dùng cho **viền và chữ**. Chỉ khác ở
  ULTIMA (trả về `#ff2854`).

### Danh hiệu không phân bậc

Parser đã trích rarity từ `honor_bg_<rarity>.png` **từ lâu** và frontend vứt đi
— mọi danh hiệu hiện giống hệt nhau.

`HonorPlate.vue` giờ vẽ đúng tấm nền theo bậc. **10 bậc**, probe từ CDN:
`normal silver gold expert master ultima rainbow staff maimai ongeki`.

Một cái bẫy tôi tự dính rồi tự sửa: lần đầu tôi chỉ liệt kê 7 bậc, và danh hiệu
`expert` của chủ dự án lặng lẽ rơi về `normal` — đúng loại lỗi mà cái `fallback`
im lặng gây ra. Giờ `title` của phần tử nói rõ khi gặp bậc chưa có tấm.

Ghi chú: `expert` và `gold` **dùng chung viền vàng `#e8b204`** trong artwork của
SEGA. Đó là game, không phải nhầm.

### Linked VERSE không phân biệt được

10 cổng chỉ có chữ. `Not found` và `Cleared` cùng cỡ, cùng dáng — muốn biết thì
phải đọc từng cái.

`GateStatus.vue` giờ cho mỗi trạng thái một **dấu hiệu** cộng màu: `✓` `→` `◌`
`·` `?`. Dấu hiệu chứ không chỉ màu, vì có người không phân biệt được đỏ với
xanh và vì chúng in rất nhỏ.

### Bộ icon

Emoji là thứ khiến giao diện bị nhận ra ngay. Tôi tự làm `AppIcon.vue` — icon
nét, lưới 24×24, `currentColor`, không dependency.

Đã thay ở `AppHeader.vue`, `profile.vue`, `recent.vue`.

---

## Vòng 3 — Claude đi hết từng trang

Pane trình duyệt render lại được, nên phần này là **nhìn thật** chứ không đoán.

### Emoji: 101 → 7

Còn đúng 6 huy chương `🥇🥈🥉` ở top 3 và dấu `✓` trong `GateStatus` — đều cố ý.
`AppIcon.vue` có 30 icon nét, lưới 24×24, kế thừa `currentColor`.

Hai lỗi tự gây khi quét tự động, đã sửa:

- `<AppIcon>` bị chèn vào **chuỗi JS** nên trang chủ in ra `<AppIcon
  name="music" /> Song Database` dưới dạng chữ. Icon giờ đi trong dữ liệu
  (`icon: 'music'`), template render nó.
- `<AppIcon>` bị chèn vào `placeholder=""` làm hỏng attribute ở hai trang tìm
  kiếm.

**Bài học:** thay thế theo mẫu không phân biệt được template với chuỗi. Sau mỗi
lần quét phải mở trang ra nhìn.

### Icon trùng nghĩa

Nhiều chỗ dùng chung icon cho hai thứ khác nhau: `Recent`/`Queue` cùng đồng hồ,
`Best 50`/`Tools` cùng target, `Statistics`/`Improvement` cùng chart, `Your
record`/`Leaderboard` cùng cúp. Đã tách hết.

Nặng nhất: icon `key` tôi vẽ đầu tiên là hình tròn góc trên-trái với cán chéo
xuống — **trùng khít với `search`**. Vẽ lại theo dáng chìa khoá quy ước (bow
trái, cán ngang, răng xuống).

### Ba lỗi logic tìm được khi nhìn

**Vạch podium kéo 10 dòng** (`ranking.vue`, `leaderboard.vue`). Class là
`row--rank-${position}`, mà 10 người đồng hạng 1 đều có `position === 1`.
"Top 3" thành bức tường vàng. Giờ chỉ dòng **in ra số** mới được trang trí.
Cũng bỏ ba `!important` ở đó — chúng có để thắng zebra striping, nhưng che luôn
chính bug này.

**Bảng xếp hạng rating không tô màu bậc.** Dùng chung `RatingValue` rồi.

**Chuỗi dính liền ở Tools:** `FULL COMBO → 83.000ALL JUSTICE → 83.500`. Mỗi
mục thành chip riêng, ranh giới là cấu trúc chứ không phải khoảng trắng.

### Thanh note accuracy vô nghĩa

Chia theo thang 0–101 nên 96.91% và 100.99% vẽ ra gần bằng nhau — chín phần
mười chiều dài thanh dành cho khoảng luôn đầy. Giờ neo vào dưới giá trị thấp
nhất của chính lượt chơi đó, và **tiêu đề ghi rõ mốc** (`from 95%`), vì thanh
không bắt đầu từ 0 mà không nói là nói dối.

### Light mode: badge AJC 1.23:1

`AJC ×2` màu `#ffe45e` trên nền trắng — **vô hình**. Cho nó nền chip tối ở cả
hai theme: 13.93:1 light, 14.70:1 dark.

Đây là lớp lỗi chung: **màu game dùng làm chữ nhỏ trên nền sáng**. Còn chỗ nào
như vậy thì xử lý cùng một cách — chip tối, không phải đổi màu.

### Nén chiều dọc

- `ScoreCard` viết lại: 150px → 70px. Best 50 từ 4 lên **8 mục** mỗi màn hình.
- `recent.vue`: nút "View Judgements…" là thanh full-width dưới **mỗi** thẻ,
  lặp 50 lần. Cho cả thẻ bấm được. Từ 6 lên **9 mục**.
- `top.vue`: thẻ giờ cũng bấm được — cùng component thì phải cùng hành vi.

### Dọn

Token `--difficulty-*` trong `main.css` không ai dùng và bản ULTIMA ở đó vẫn là
`#c80000` sai. Xoá bản trùng; nguồn duy nhất là `app/utils/chunithm.ts`.

---

## Vòng 4 — hai việc còn treo

### Trang chủ: từ danh mục link thành dashboard

Tám ô mô tả lặp lại y nguyên thanh nav và đẩy mọi thứ khác xuống dưới màn hình.

Giờ hiện số liệu thật: **số chart đã chơi, OVER POWER, điểm cao nhất, cache đồng
bộ lúc nào**. Tám ô thành một hàng chip nhỏ.

Quyết định quan trọng: **không gọi thêm request nào tới CHUNITHM-NET.** Home là
trang bị mở nhiều nhất, mỗi số liệu "sống" trên đó là một request tới SEGA trên
rate limit dùng chung cả instance, và cả phòng máy cùng mở app là chuyện bình
thường chứ không phải ngoại lệ. Tất cả đọc từ `/records/statistics` — cache cục
bộ.

Đổi lại, số liệu có thể cũ. Nên nó **tự nói ra**: dòng "Cache synced 1 day ago",
và quá 7 ngày thì chuyển màu cảnh báo kèm chữ "Numbers above are that old". Số
cũ mà nói rõ mình cũ tốt hơn số mới mà người khác không lấy được.

Chưa đồng bộ lần nào thì hiện lời mời sync thay vì bảng trống.

### Khối filter chiếm một phần ba màn hình

`/top` và `/statistics` đặt 2–4 ô filter cộng nút Apply lên trước dữ liệu. Trên
điện thoại phải cuộn qua hết mới thấy điểm đầu tiên.

Gập vào `<details>`, đóng sẵn. Dòng tóm tắt bên phải nói trạng thái đang áp dụng
(`Play rating · high to low`, `All charts`) nên không cần mở ra mới biết. `/top`
từ 3 lên **8 mục** mỗi màn hình.

### Token chip bị dùng sai chỗ

`--color-game-chip-bg` sinh ra cho **màu game cần nền tối ở cả hai theme** (rank
S, badge AJC). Nó bị dùng cho cả panel Arcade Queue và mọi placeholder ảnh bìa,
nên chúng ở lại màu đen giữa trang sáng.

Đã đổi sang `--color-bg`. Quy tắc: chip token chỉ dành cho **màu đo từ artwork
của SEGA**; chrome của app dùng token theme.

Một cái bẫy khi sửa: regex của tôi khớp nhầm vào selector **nhóm**
(`.detail__jacket, .detail__jacket-placeholder`) thay vì block độc lập, nên báo
"ok" mà không đổi gì. Grep lại sau khi sửa, đừng tin thông báo của chính script.

---

## Vòng 5 — bảng màu, chữ, trạng thái chờ

### Trạng thái chờ ở mọi chỗ fetch

Vấn đề gốc không phải thiếu spinner mà là **`await useApiFetch` chặn chuyển
route**: bấm tab xong vẫn thấy trang cũ suốt 1–3 giây, không dấu hiệu nào.

Hai lớp:

- `<NuxtLoadingIndicator>` trong layout — chạy ngay khi điều hướng bắt đầu, nên
  cú chạm được xác nhận trước khi bất kỳ request nào xong.
- `lazy: true` + skeleton cho các trang gọi CHUNITHM-NET (`profile`,
  `plays/[position]`). Chúng render ngay thay vì chặn.

Đo thực tế trên `/plays/7`: route đổi ở **208ms**, skeleton hiện 360→1884ms,
rồi dữ liệu thật. Trước đó là đứng im 1.9 giây ở trang cũ.

`AppSkeleton.vue` và `ScoreCardSkeleton.vue` dùng chung, hình dạng khớp nội
dung thật nên layout không nhảy khi dữ liệu về. Đứng yên khi
`prefers-reduced-motion`.

### Bảng màu chrome: tím thay vì xám

Neutral được kéo vài độ về phía tím thay vì để xám lam. X-VERSE-X là bản sắc
tím-magenta, và **nhuộm nhẹ dải xám mang được bản sắc đó đi khắp nơi mà không
tốn một màu bão hoà** — điều này quan trọng, vì tím bão hoà là của MASTER và
phần lớn app là chart MASTER.

| | Dark | Light |
|---|---|---|
| nền | `#0d0a12` | `#f7f5fa` |
| bề mặt | `#16121d` | `#ffffff` |
| chữ | `#f2eef7` (17.2:1) | `#17121e` (17.0:1) |
| chữ mờ | `#9d94ab` (6.4:1) | `#5b5268` (7.4:1) |

### Chữ

Vẫn dùng system stack — một font phủ kana/kanji nặng vài MB, mà app này mở bằng
wifi phòng máy. Thứ **thiếu** là fallback tiếng Nhật: tên bài rơi xuống font nào
tuỳ trình duyệt, nên 天体観測 và tên nghệ sĩ có thể ra hai font khác nhau trên
cùng một dòng. Giờ đã nêu tên rõ theo thứ tự từng nền tảng.

Tiêu đề **thu lại** chứ không phóng to: màn nào cũng là danh sách, và tiêu đề
lấn át con số bên dưới chính là lỗi đã sửa ở Best 50.

`font-variant-numeric: tabular-nums` giờ là mặc định cho `.tabular`, `input
[type=number]` và `table` — mọi con số ở đây đều để so với con số phía trên.

### Đo lại toàn bộ màu game trên nền mới

Đây là chỗ số liệu bác bỏ cảm giác. Đo composite thật (tính cả lớp nền bán
trong suốt):

| | Light trước | Light sau | Dark trước | Dark sau |
|---|---|---|---|---|
| lamp FULL COMBO | **1.34** | 12.55 | ok | 13.24 |
| lamp CLEAR | **1.76** | 9.24 | ok | 9.75 |
| difficulty (xấu nhất) | **4.37** | 6.95 | **2.95** (MASTER) | 4.96 |

Hai cách xử lý khác nhau, vì lý do khác nhau:

- **Lamp → chip nền tối ở cả hai theme.** Làm tối màu cho đủ tương phản biến
  vàng FULL COMBO thành ô-liu bùn — mất đúng thứ mà brief nói rõ. Chip giữ
  nguyên sắc, và đó là cách rank badge với AJC đã làm.
- **Difficulty → đổi độ sáng theo theme.** Chủ dự án muốn giữ dạng chữ màu, nên
  light lấy 25% về đen, dark lấy 30% về trắng. Sắc không đụng tới: chúng phải
  còn nhận ra được là BASIC xanh và MASTER tím.

Một cái bẫy khi đo: `color-mix()` serialise thành `color(srgb 0..1)` chứ không
phải `rgb(0..255)`. Parser của tôi giả định 0–255 nên báo `rank--top` là 1.01:1
trong khi thật ra là 8.10:1. **Chuẩn hoá cả hai dạng trước khi tính**, nếu
không sẽ đi sửa thứ vốn không hỏng.

---

## Vòng 6 — spinner và ULTIMA

### Spinner thay skeleton

Chủ dự án muốn spinner. Đã thay **toàn bộ**: `AppSpinner.vue` dùng ở 8 trang,
xoá `AppSkeleton.vue`, `ScoreCardSkeleton.vue` và class `.skeleton` trong
`main.css`. Nhất quán quan trọng hơn sở thích của tôi về skeleton.

Spinner có **nhãn**, không để trần. Mọi lần chờ lâu ở app này đều là cùng một
thứ — một vòng CHUNITHM-NET qua SSO của SEGA, 1–3 giây — nên câu "Fetching
judgements from CHUNITHM-NET…" giải thích được quãng lặng mà spinner trần chỉ
bắt người ta ngồi chịu.

Vẽ bằng `conic-gradient` phủ `mask` thành vòng, nên vệt mờ dần thay vì đuổi một
mép cứng. `prefers-reduced-motion` thì ngừng quay và nhấp nháy — vẫn nói được
"đang chạy" mà không xoay.

`<NuxtLoadingIndicator>` giữ nguyên: nó xử lý quãng **trước khi** trang mới
render, spinner xử lý quãng sau.

### ULTIMA: bỏ hồng, dùng trung tính

Cách cũ giữ đen `#141414` cộng viền hồng `#ff2854` của game. Đúng nguyên bản,
nhưng ở cỡ nhãn thì hồng chiếm gần hết những gì nhìn thấy — và ULTIMA đọc ra
như một EXPERT thứ hai. Đó là điều duy nhất nó không được phép.

Giờ ULTIMA là trung tính: `#332b33` trên nền sáng, `#ded5dd` trên nền tối. Xám
là thứ tách nó khỏi năm difficulty có màu — đúng việc mà màu đen làm trên
cabinet.

| | Tương phản | Cách EXPERT | Cách chữ mờ |
|---|---|---|---|
| light | 13.69 | 126 | 77 |
| dark | 12.88 | 160 | 105 |

Khoảng cách với **chữ mờ** cũng phải đo, không chỉ với EXPERT: thử cho ULTIMA
đi qua phép dịch sáng-tối chung thì nó rơi cách màu chữ mờ 25–60 điểm và bắt
đầu đọc như chữ bị làm mờ. Nên nó được đặt màu riêng cho từng theme.

`difficultyInk(ULTIMA)` cũng đổi theo — nó tô viền trái các thẻ, và viền hồng
gây đúng sự nhầm lẫn đó.

### Một lỗi tự gây

Regex xoá `@keyframes shimmer` chỉ ăn nửa block, để lại `}` mồ côi và làm chết
cả `main.css` (Vite 500). **Đếm ngoặc sau khi xoá block CSS bằng regex** — regex
không hiểu lồng nhau.

---

## Việc tiếp theo cho Gemini

Phần emoji **đã xong**, Claude tự làm. Đừng làm lại.

```
14  app/pages/index.vue
12  app/pages/improve.vue
 8  app/pages/statistics.vue
 8  app/pages/records/[songId]/[difficulty].vue
 7  app/pages/tools.vue
 6  app/pages/ranking.vue
 6  app/pages/plays/[position].vue
 5  app/pages/leaderboard.vue
 5  app/pages/login.vue
 5  app/components/AppHeader.vue   ← còn ▾ và ◐ ☀ ☾
 4  app/pages/songs/[id].vue
 2  app/pages/recent.vue
 1  best50.vue · top.vue · songs/index.vue · profile.vue · GateStatus.vue
```

Cách dùng:

```vue
<AppIcon name="refresh" />
<AppIcon name="search" :size="20" />
```

Tên có sẵn: `refresh edit eye eyeOff download search trophy chart target music
user key sun moon monitor chevronDown arrowRight check close warning info
external clock bolt layers filter plus`

Thiếu tên nào thì **thêm path vào `PATHS` trong `AppIcon.vue`** — lưới 24×24,
nét 2 đơn vị, `fill="none"`, chỉ dùng `M L A C Q Z`. Đừng dán path 24×24 fill
đặc vào, nó sẽ lệch hẳn với phần còn lại.

### Quy tắc

1. **Ưu tiên bỏ hẳn.** `🎵 Songs` → `Songs`. Chữ đã rõ thì icon chỉ là nhiễu.
   Chỉ giữ icon ở nút không có chữ, ở mục nav mobile, và ở chỗ cần phân biệt
   nhanh trong danh sách.
2. **Giữ `🥇 🥈 🥉`** ở top 3 của `leaderboard.vue` và `ranking.vue`. Đó là huy
   chương, không phải icon giao diện.
3. **Giữ `✓ → ◌ · ?`** trong `GateStatus.vue`. Đó là ký hiệu trạng thái, đã
   thiết kế có chủ đích.
4. `▾` trong `More ▾` → `<AppIcon name="chevronDown" :size="14" />`.
5. `◐ ☀ ☾` của nút theme → `monitor` / `sun` / `moon`.

### Verify

Ba lệnh trong `04-implementation-rules.md`, cộng:

```bash
cd frontend && python -c "import re,pathlib;print(sum(len(re.findall('[🌀-🫿]',p.read_text(encoding='utf-8'))) for p in pathlib.Path('app').rglob('*.vue')))"
```

Phải ra **6** (ba huy chương × hai trang). Ghi kết quả vào `05-questions.md`.
