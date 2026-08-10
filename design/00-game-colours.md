# Bảng màu game — dữ liệu, không phải thẩm mỹ

**Đọc file này trước.** Mọi màu ở đây được **đo từ chính file ảnh của SEGA**,
không phải nhớ lại, không phải lấy từ wiki. Đừng thay đổi chúng.

Cách đo: tải PNG từ `chunithm-net-eng.com`, giải mã, lấy pixel. Tên tier lấy
bằng cách probe CDN (200 với tên đúng, 404 với tên sai) — nên `bronze` là đúng
và `copper` là sai, dù nhiều nguồn cộng đồng viết `copper`.

---

## 1. Rating — 9 bậc

CHUNITHM vẽ rating bằng **ảnh từng chữ số**, tên file là
`images/rating/rating_<tier>_<digit>.png`. Tier lấy từ tên file, nên đây là
tên chính thức của SEGA:

| Tier | Màu lõi | Highlight | Ghi chú |
|---|---|---|---|
| `green` | `#32fd23` | `#baff48` | xanh lá chói |
| `orange` | `#f5b404` | `#ffd803` | thiên vàng, không phải cam đất |
| `red` | `#fd576b` | `#ff9397` | đỏ hồng, **không** phải đỏ máu |
| `purple` | `#fd66f5` | `#ff96df` | magenta, **không** phải tím lam |
| `bronze` | `#db570a` → `#ffad3c` | `#f6b800` | chuyển sắc |
| `silver` | `#8ae7ff` → `#c3feff` | `#e5f9ff` | **xanh băng**, không phải xám |
| `gold` | `#f6cb11` → `#fff368` | `#fdf3cc` | |
| `platinum` | `#fff9e5` | `#ffffff` | gần như trắng kem |
| `rainbow` | nhiều sắc | xem mục dưới | dốc màu dọc |

Hai chỗ dễ sai và ai cũng sai: **silver là xanh băng chứ không phải xám**, và
**purple là magenta chứ không phải tím lam**.

### Ngưỡng

| Tier | Từ | Đến |
|---|---|---|
| green | 0.00 | 3.99 |
| orange | 4.00 | 6.99 |
| red | 7.00 | 9.99 |
| purple | 10.00 | 11.99 |
| bronze | 12.00 | 13.24 |
| silver | 13.25 | 14.49 |
| gold | 14.50 | 15.24 |
| platinum | 15.25 | 15.99 |
| rainbow | 16.00 | — |

**Mức độ tin cậy:** tên tier và màu đã đo trực tiếp. Ngưỡng thì mới xác nhận
được hai điểm — một tài khoản 15.10 hiển thị `gold`, và 16.13 hiển thị
`rainbow`. Phần còn lại lấy từ tài liệu cộng đồng. Chúng nằm gọn trong **một
bảng duy nhất** trong code để sửa một chỗ là xong nếu phát hiện sai.

### Cầu vồng — dốc màu dọc, không phải quét ngang

Quét từng dòng pixel qua `rating_rainbow_02/06/08.png`, kết quả nhất quán cả ba
chữ số: mỗi glyph mang trọn dải màu **từ trên xuống dưới**.

| Vị trí | Màu |
|---|---|
| 0% | `#ff8f9c` hồng |
| 14% | `#ff957a` hồng cam |
| 34% | `#ffe45e` vàng |
| 46% | `#caff22` chanh |
| 58% | `#6cff45` lục |
| 72% | `#28ffbd` bạc hà |
| 86% | `#15fff3` lục lam |
| 100% | `#41cae0` lam đậm |

Đây **không phải** một màu đứng yên, cũng **không phải** dải màu quét ngang qua
cả con số. Nó là dốc màu dọc trong từng chữ số, đứng yên — đúng như ảnh chụp
trong game.

Game còn viền chữ để nó đọc được trên nền sáng. Trong app, viền chỉ bật ở light
mode qua token `--iridescent-outline`; dark mode không cần vì màu sáng trên nền
gần đen đã đủ tách.

---

## 2. Rank — D đến SSS+

Ảnh `images/icon_rank_<n>.png`, `n` khớp enum trong code:

| n | Rank | Màu |
|---|---|---|
| 0 | D | `#a9a7a5` xám |
| 1 | C | `#ff9944` cam đồng |
| 2 | B | `#8affff` xanh băng |
| 3 | BB | `#a3ffff` |
| 4 | BBB | `#b8ffff` |
| 5 | A | `#fff525` vàng |
| 6 | AA | `#fff625` |
| 7 | AAA | `#fff717` |
| 8 | S | `#fbecad` vàng kem |
| 9 | S+ | `#fbecad` |
| 10 | SS | `#fbecad` |
| 11 | SS+ | `#fbecad` |
| 12 | SSS | `#fbecad` |
| 13 | SSS+ | `#0064cc` + `#00bae8` + `#f847ff` — ngũ sắc |

Lưu ý quan trọng: **S đến SSS dùng chung một màu** trong artwork của SEGA. Trò
chơi phân biệt chúng bằng **hình dạng viền và ánh kim**, không bằng sắc màu. Đề
xuất thiết kế phải xử lý chuyện này — hoặc phân cấp bằng độ đậm/viền/glow, hoặc
chấp nhận chúng giống nhau. **Không được tự bịa ra 5 màu khác nhau.**

SSS+ là ngũ sắc, xử lý như rainbow.

---

## 3. Difficulty

Đang dùng trong code, giữ nguyên:

| Difficulty | Màu |
|---|---|
| BASIC | `#009f7b` |
| ADVANCED | `#f47900` |
| EXPERT | `#e92829` |
| MASTER | `#8c1be1` |
| ULTIMA | `#c80000` |
| WORLD'S END | `#0b6ff3` |

---

## 4. Lamp

Game không tô màu lamp bằng CSS — chúng là ảnh badge. Thứ tự và ý nghĩa:

**Clear lamp** (tăng dần): `FAILED` → `CLEAR` → `HARD` → `BRAVE` → `ABSOLUTE`
→ `CATASTROPHY`

**Combo lamp**: `NONE` → `FULL COMBO` → `ALL JUSTICE` → `ALL JUSTICE CRITICAL`

**Chain lamp**: `NONE` → `FULL CHAIN` → `FULL CHAIN+`

Quy tắc hiển thị đã có trong code và **không được đổi**: combo lamp lấn át clear
lamp, nên `CLEAR` chỉ hiện khi combo lamp là `NONE`. Lamp `null` nghĩa là trang
nguồn không có badge — hiện gì đó khác `FAILED`, vì `FAILED` là một khẳng định.

### Màu lamp — chủ dự án đã chốt

SEGA không định nghĩa màu CSS cho lamp (chúng là ảnh badge), nên đây là lựa
chọn chứ không phải số đo. Chủ dự án chốt:

| Lamp | Màu | Token |
|---|---|---|
| CLEAR | xanh lá | `--lamp-clear` |
| HARD / BRAVE / ABSOLUTE / CATASTROPHY | xanh lá sáng hơn | `--lamp-hard-clear` |
| FAILED | đỏ | `--lamp-failed` |
| FULL COMBO | vàng | `--lamp-full-combo` |
| ALL JUSTICE | cầu vồng | `--iridescent` |
| AJC | cầu vồng + quầng sáng | `--iridescent` |
| FULL CHAIN / FULL CHAIN+ | tím nhạt | `--lamp-full-chain` |

Chain lamp là trục riêng, không nằm trong thang combo, nên có màu riêng.

**Phân loại theo giá trị enum, không theo nhãn.** Nhãn của ALL JUSTICE CRITICAL
là `'AJC'` — không chứa `CRITICAL` cũng không chứa `ALL JUSTICE`. Code cũ đọc
ngược chuỗi để phân loại và làm thành tựu hiếm nhất game ra màu xám. Logic đúng
nằm ở `app/utils/lamps.ts`.

---

## 5. Linked VERSE

Trạng thái cổng: `not_found` `under_analysis` `linkable` `clear` `unknown`

`unknown` tồn tại vì có badge chưa nhận diện được. Nó **không** được trông
giống `not_found` — nhầm hai cái này chính là bug đã sửa trước đây.

---

## 6. OVER POWER

Không có màu riêng trong game. Hiển thị kèm phần trăm so với tối đa của chart.
Gemini tự do đề xuất, gợi ý: thanh tiến độ hợp lý hơn con số trần trụi vì OP
luôn được đọc tương đối với trần.

---

## 7. Thương hiệu X-VERSE-X

Đo từ `chunithm.sega.com/assets/css/style.css` (bản International hiện tại):

| Vai trò | Màu | Số lần xuất hiện |
|---|---|---|
| Chủ đạo | `#b700ff` | 39 |
| Chủ đạo nhạt | `#e036ff` | 5 |
| Nhấn đỏ | `#ff173d` | 7 |
| Nhấn đỏ trầm | `#ec2036` | 7 |
| Nhấn hồng | `#f02d6d` | 5 |
| Nhấn lục lam | `#18f2d1` | 4 |

Bản sắc X-VERSE-X là **tím-magenta**, phụ trợ bằng đỏ và lục lam.

Cảnh báo: `#b700ff` đụng rất gần với màu MASTER `#8c1be1`. Nếu dùng nó làm màu
nhấn của app thì màu MASTER sẽ mất tính phân biệt trên chính những trang đầy
chart MASTER. Đề xuất phải giải quyết chuyện này — đây là mâu thuẫn thật, không
phải chi tiết vụn.
