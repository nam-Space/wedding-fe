
import { BE_URL } from './env.js';

(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);


    // Initiate the wowjs
    new WOW().init();


    // Fixed Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '0px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-300px');
        }
    });


    // Smooth scrolling on the navbar links
    $(".navbar-nav a").on('click', function (event) {
        if (this.hash !== "") {
            event.preventDefault();

            $('html, body').animate({
                scrollTop: $(this.hash).offset().top - 90
            }, 1500, 'easeInOutExpo');

            if ($(this).parents('.navbar-nav').length) {
                $('.navbar-nav .active').removeClass('active');
                $(this).closest('a').addClass('active');
            }
        }
    });


    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

})(jQuery);

// Countdown Timer
var weddingDate = new Date("2025-12-01T07:00:00").getTime();

var countdown = setInterval(function () {
    var now = new Date().getTime();
    var distance = weddingDate - now;

    if (distance < 0) {
        clearInterval(countdown);
        $(".wedding-date-content .text-dark.fs-2 div").each(function () {
            $(this).text("00");
        });
        return;
    }

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    var minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
    );
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Hiển thị lên HTML
    var timeBlocks = $(".wedding-date-content .text-dark.fs-2 div");
    if (timeBlocks.length >= 4) {
        $(timeBlocks[0]).text(days.toString().padStart(2, "0"));
        $(timeBlocks[1]).text(hours.toString().padStart(2, "0"));
        $(timeBlocks[2]).text(minutes.toString().padStart(2, "0"));
        $(timeBlocks[3]).text(seconds.toString().padStart(2, "0"));
    }
}, 1000);


// === LOAD USER TỪ ?q=... VÀ HIỂN THỊ Ở PHẦN "Chào bạn!" VÀ .guest-invitation-img ===
async function loadGuestFromQuery() {
    try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q");
        if (!q) return; // không có tham số q thì thôi

        // decode và tách name + id
        const decoded = decodeURIComponent(q); // "Nguyễn Viết Nam-6909..."
        const parts = decoded.split("-");
        const id = parts.pop(); // phần cuối là id
        const nameFromSlug = parts.join("-"); // phần trước là tên (giữ nguyên dấu - giữa tên)

        // gọi API lấy thông tin chi tiết
        const apiUrl = `${BE_URL}/users/${id}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`API lỗi: ${res.status}`);
        const json = await res.json();

        if (!json || !json.isSuccess || !json.data) {
            console.warn("API trả về không có data hoặc isSuccess=false", json);
            return;
        }

        const user = json.data;

        const fullName = user.fullName || nameFromSlug;
        const imageName = user.image?.trim() || ""; // ảnh có thể trống
        const imageUrl = imageName
            ? `${BE_URL}${imageName}`
            : "";
        if (user.song) {
            playBackgroundMusic(user.song);
        }

        // --- cập nhật DOM ---
        const headerBlock = document.querySelector(".welcome-container .mx-auto.text-center");
        if (!headerBlock) return;

        // cập nhật dòng "Chào bạn!"
        let h1 = headerBlock.querySelector("h1.text-primary.display-1");
        if (!h1) {
            h1 = document.createElement("h1");
            h1.className = "text-primary display-1";
            headerBlock.prepend(h1);
        }
        h1.textContent = `Chào bạn! ${fullName}`;

        // xử lý ảnh đại diện (nếu có)
        let guestImg = headerBlock.querySelector("img.guest-invitation-img");
        if (imageUrl) {
            // có ảnh thì hiển thị hoặc tạo mới
            if (!guestImg) {
                guestImg = document.createElement("img");
                guestImg.className = "guest-invitation-img wow fadeInUp";
                guestImg.setAttribute("data-wow-delay", "0.2s");
                // chèn ngay dưới h1
                h1.insertAdjacentElement("afterend", guestImg);
            }
            guestImg.src = imageUrl;
            guestImg.alt = fullName;
            guestImg.style.display = "block";
        } else if (guestImg) {
            // không có ảnh thì ẩn nếu tồn tại
            guestImg.style.display = "none";
        }
    } catch (err) {
        console.error("Lỗi khi load guest từ query:", err);
    }
}

// === PHÁT NHẠC NGẦM NẾU API TRẢ VỀ TRƯỜNG "song" ===
function playBackgroundMusic(songPath) {
    if (!songPath) return;

    let audio = document.getElementById("weddingSong");
    if (!audio) {
        audio = document.createElement("audio");
        audio.id = "weddingSong";
        audio.src = `${BE_URL}${songPath}`;
        audio.loop = true;
        audio.volume = 0.55;
        audio.autoplay = false; // tạm tắt autoplay, ta sẽ gọi play() thủ công
        audio.playsInline = true;
        audio.style.display = "none";
        document.body.appendChild(audio);
    }

    // Thử phát sau 2 giây (khi trang load ổn định)
    setTimeout(() => {
        audio.play()
            .then(() => {
                console.log("🎶 Nhạc nền đã tự động phát sau 2 giây!");
            })
            .catch((err) => {
                console.warn("⚠️ Trình duyệt vẫn chặn autoplay:", err);
                // fallback: phát khi người dùng click
                const onceClick = () => {
                    audio.play();
                    document.removeEventListener("click", onceClick);
                };
                document.addEventListener("click", onceClick);
            });
    }, 200);
}

// chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", loadGuestFromQuery);

