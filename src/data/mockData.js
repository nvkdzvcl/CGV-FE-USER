export const REGIONS = [
  { id: 1, name: 'Toàn hệ thống', slug: 'all' },
  { id: 2, name: 'TP. Hồ Chí Minh', slug: 'ho-chi-minh' },
  { id: 3, name: 'Hà Nội', slug: 'ha-noi' },
  { id: 4, name: 'Đà Nẵng', slug: 'da-nang' },
  { id: 5, name: 'Cần Thơ', slug: 'can-tho' },
  { id: 6, name: 'Hải Phòng', slug: 'hai-phong' }
];

export const CINEMAS = [
  {
    id: 'cin-01',
    name: 'CineGo Landmark 81',
    regionId: 2,
    address: 'Tầng B1, Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh, TP.HCM',
    distance: '1.2 km',
    rating: 4.9,
    reviews: '2.8k',
    openingHours: '08:00 - 23:30',
    facilities: ['IMAX', '4DX', 'Dolby Atmos', 'Ghế đôi', 'Bãi đỗ xe', 'Đặt vé online'],
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop',
    isHero: true
  },
  {
    id: 'cin-02',
    name: 'CineGo Vincom Đồng Khởi',
    regionId: 2,
    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    distance: '2.1 km',
    rating: 4.7,
    reviews: '1.2k',
    openingHours: '08:00 - 23:30',
    facilities: ['IMAX', 'Dolby Atmos', 'Ghế đôi', 'Bãi đỗ xe', 'Đặt vé online'],
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop'
  },
  {
    id: 'cin-03',
    name: 'CineGo Giga Mall',
    regionId: 2,
    address: '240-242 Phạm Văn Đồng, Hiệp Bình Chánh, TP. Thủ Đức, TP.HCM',
    distance: '5.3 km',
    rating: 4.5,
    reviews: '892',
    openingHours: '08:00 - 23:00',
    facilities: ['4DX', 'Dolby Atmos', 'Ghế đôi', 'Đặt vé online'],
    image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&auto=format&fit=crop'
  },
  {
    id: 'cin-04',
    name: 'CineGo Crescent Mall',
    regionId: 2,
    address: '101 Tôn Dật Tiên, Tân Phú, Quận 7, TP. Hồ Chí Minh',
    distance: '6.8 km',
    rating: 4.6,
    reviews: '1.1k',
    openingHours: '08:00 - 23:30',
    facilities: ['IMAX', 'Ghế đôi', 'Dolby Atmos', 'Đặt vé online'],
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop'
  },
  {
    id: 'cin-05',
    name: 'CineGo Aeon Tân Phú',
    regionId: 2,
    address: '30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP. Hồ Chí Minh',
    distance: '7.1 km',
    rating: 4.4,
    reviews: '768',
    openingHours: '08:00 - 22:30',
    facilities: ['4DX', 'Ghế đôi', 'Bãi đỗ xe', 'Đặt vé online'],
    image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop'
  },
  {
    id: 'cin-06',
    name: 'CineGo Sala',
    regionId: 2,
    address: 'Khu đô thị Sala, Mai Chí Thọ, An Lợi Đông, TP. Thủ Đức, TP.HCM',
    distance: '8.4 km',
    rating: 4.8,
    reviews: '654',
    openingHours: '08:00 - 23:00',
    facilities: ['Dolby Atmos', 'Ghế đôi', 'Bãi đỗ xe', 'Đặt vé online'],
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop'
  }
];

export const MOVIES = [
  {
    id: 'mov-01',
    title: 'Thế Giới Khủng Long: Tái Sinh',
    originalTitle: 'Jurassic World Rebirth',
    director: 'Gareth Edwards',
    cast: 'Scarlett Johansson, Jonathan Bailey, Mahershala Ali',
    genre: ['Hành động', 'Phiêu lưu', 'Khoa học viễn tưởng'],
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    country: 'Mỹ',
    ageRating: 'T16',
    duration: 135,
    rating: 8.8,
    votes: '14.2k',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '04.07.2025',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=fb5ELWi-ekk',
    synopsis: 'Khi một âm mưu bí ẩn đe dọa sự sống còn của loài người, những sinh vật tiền sử một lần nữa trỗi dậy từ những hòn đảo cô lập để đối đầu với nền văn minh nhân loại.'
  },
  {
    id: 'mov-02',
    title: 'Dế Mèn: Cuộc Phiêu Lưu Tới Xóm Lầy Lội',
    originalTitle: 'Men Cricket Adventures',
    director: 'Nguyễn Đăng Quang',
    cast: 'Hoàng Dũng, Diệu Nhi, Trấn Thành (lồng tiếng)',
    genre: ['Hoạt hình', 'Phiêu lưu', 'Gia đình'],
    language: 'Tiếng Việt',
    country: 'Việt Nam',
    ageRating: 'P',
    duration: 95,
    rating: 8.5,
    votes: '8.2k',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '10.07.2025',
    posterUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=1400&auto=format&fit=crop',
    synopsis: 'Chuyến hành trình kỳ thú của Dế Mèn và những người bạn băng qua thảo nguyên bao la để tìm lại nguồn nước thần cứu sống cư dân xóm Đầm Lầy.'
  },
  {
    id: 'mov-03',
    title: 'Bảy Ngày Bên Nhau',
    originalTitle: 'Seven Days Together',
    director: 'Vũ Ngọc Đãng',
    cast: 'Thái Hòa, Thu Trang, Kiều Minh Tuấn',
    genre: ['Tình cảm', 'Hài hước', 'Tâm lý'],
    language: 'Tiếng Việt',
    country: 'Việt Nam',
    ageRating: 'T13',
    duration: 108,
    rating: 7.8,
    votes: '6.4k',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '15.07.2025',
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1400&auto=format&fit=crop',
    synopsis: 'Một kỳ nghỉ bất đắc dĩ tại vùng quê Đà Lạt đã gắn kết những con người xa lạ trở thành gia đình ấm áp cùng những tình huống dở khóc dở cười.'
  },
  {
    id: 'mov-04',
    title: 'Ma Da',
    originalTitle: 'Ma Da: River Ghost',
    director: 'Nguyễn Hữu Hoàng',
    cast: 'Việt Hương, Trung Dân, Dạ Chúc',
    genre: ['Kinh dị', 'Bí ẩn', 'Tâm lý'],
    language: 'Tiếng Việt',
    country: 'Việt Nam',
    ageRating: 'T18',
    duration: 112,
    rating: 6.9,
    votes: '4.1k',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '16.07.2025',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1400&auto=format&fit=crop',
    synopsis: 'Những truyền thuyết dân gian rùng rợn vùng sông nước Tây Nam Bộ sống dậy khi một người phụ nữ làm nghề vớt xác vô tình kéo lên một oan hồn đòi mạng.'
  },
  {
    id: 'mov-05',
    title: 'Mission: Impossible — Nghiệp Báo Cuối Cùng',
    originalTitle: 'Mission: Impossible The Final Reckoning',
    director: 'Christopher McQuarrie',
    cast: 'Tom Cruise, Hayley Atwell, Ving Rhames',
    genre: ['Hành động', 'Phiêu lưu', 'Giật gân'],
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    country: 'Mỹ',
    ageRating: 'T16',
    duration: 169,
    rating: 8.9,
    votes: '18.5k',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '23.05.2025',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&auto=format&fit=crop',
    synopsis: 'Ethan Hunt và nhóm IMF bước vào nhiệm vụ sinh tử cuối cùng chống lại Thực thể AI toàn năng đe dọa sự kiểm soát quân sự của toàn cầu.'
  },
  {
    id: 'mov-06',
    title: 'Siêu Nhân Trở Lại',
    originalTitle: 'Superman (2025)',
    director: 'James Gunn',
    cast: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult',
    genre: ['Hành động', 'Khoa học viễn tưởng'],
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    country: 'Mỹ',
    ageRating: 'T13',
    duration: 130,
    rating: 9.0,
    votes: '12.8k',
    showingStatus: 'COMING_SOON',
    releaseDate: '25.07.2025',
    posterUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&auto=format&fit=crop',
    synopsis: 'Khởi đầu mới của vũ trụ DC với chàng phóng viên Clark Kent cân bằng giữa nguồn gốc Krypton và nhân tính Trái Đất.'
  },
  {
    id: 'mov-07',
    title: 'F1: The Movie',
    originalTitle: 'F1 Starring Brad Pitt',
    director: 'Joseph Kosinski',
    cast: 'Brad Pitt, Damson Idris, Javier Bardem',
    genre: ['Hành động', 'Thể thao'],
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    country: 'Mỹ',
    ageRating: 'T13',
    duration: 140,
    rating: 8.7,
    votes: '9.3k',
    showingStatus: 'COMING_SOON',
    releaseDate: '01.08.2025',
    posterUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&auto=format&fit=crop',
    synopsis: 'Huyền thoại đua xe F1 quay trở lại đường đua nghẹt thở để dìu dắt tay đua trẻ tài năng tranh chức vô địch thế giới.'
  },
  {
    id: 'mov-08',
    title: 'Blue Lock: Episode Nagi',
    originalTitle: 'Blue Lock the Movie: Episode Nagi',
    director: 'Shunsuke Ishikawa',
    cast: 'Nobunaga Shimazaki, Yuma Uchida',
    genre: ['Hoạt hình', 'Thể thao'],
    language: 'Tiếng Nhật - Phụ đề Tiếng Việt',
    country: 'Nhật Bản',
    ageRating: 'T13',
    duration: 90,
    rating: 8.6,
    votes: '7.8k',
    showingStatus: 'COMING_SOON',
    releaseDate: '15.08.2025',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1400&auto=format&fit=crop',
    synopsis: 'Góc nhìn đặc biệt về thiên tài bóng đá lười biếng Seishiro Nagi và hành trình đánh thức khát khao trở thành tiền đạo số 1 thế giới.'
  }
];

export const PROMOTIONS = [
  {
    id: 'pr-01',
    title: 'Combo Đôi Tiết Kiệm',
    discountPill: '-30%',
    desc: 'Giảm ngay 30% khi mua 2 vé 2D kèm combo bắp lớn + 2 nước ngọt vị tùy chọn.',
    validTo: '25.08.2026',
    category: 'Combo',
    tier: 'MEMBER',
    image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=600&auto=format&fit=crop'
  },
  {
    id: 'pr-02',
    title: 'Mua 1 Tặng 1 Giữa Tuần',
    discountPill: 'MUA 1 TẶNG 1',
    desc: 'Áp dụng cho suất chiếu đầu ngày từ Thứ 2 đến Thứ 5 cho tất cả thành viên CineGo.',
    validTo: '30.09.2026',
    category: 'Vé xem phim',
    tier: 'MEMBER',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop'
  },
  {
    id: 'pr-03',
    title: 'Sinh Nhật CineGo — Quà Bất Ngờ',
    discountPill: 'SINH NHẬT',
    desc: 'Tặng ngay vé 2D miễn phí và bắp ngọt trong tháng sinh nhật của thành viên VIP & VVIP.',
    validTo: 'Không giới hạn',
    category: 'Thành viên',
    tier: 'VIP',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop'
  },
  {
    id: 'pr-04',
    title: 'Ưu Đãi Học Sinh - Sinh Viên',
    discountPill: 'U22 ĐỒNG GIÁ',
    desc: 'Đồng giá vé 55K mỗi ngày khi xuất trình thẻ Học sinh - Sinh viên tại quầy hoặc online.',
    validTo: '31.12.2026',
    category: 'Giảm giá',
    tier: 'MEMBER',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop'
  },
  {
    id: 'pr-05',
    title: 'Happy Family — Gói Gia Đình',
    discountPill: 'FAMILY',
    desc: 'Mua 4 vé tặng ngay 1 bắp khổng lồ và 2 nước cho gia đình vào dịp cuối tuần.',
    validTo: '31.10.2026',
    category: 'Quà tặng',
    tier: 'MEMBER',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop'
  }
];

export const VOUCHERS = [
  {
    id: 'v-01',
    title: 'Vé Giữa Tuần Siêu Ưu Đãi 55K',
    desc: 'Áp dụng cho 1 vé 2D tiêu chuẩn vào các ngày Thứ 4 hàng tuần',
    code: 'CGWED55',
    discountValue: 45000,
    validTo: '31.08.2026',
    tag: 'CÒN HIỆU LỰC'
  },
  {
    id: 'v-02',
    title: 'Giảm 30% Combo Bắp Nước',
    desc: 'Áp dụng tại quầy hoặc đặt online cho combo bắp nước cỡ vừa và lớn',
    code: 'COMBO30',
    discountValue: 30000,
    validTo: '25.08.2026',
    tag: 'PHỔ BIẾN'
  },
  {
    id: 'v-03',
    title: 'Voucher Thành Viên Thân Thiết 50K',
    desc: 'Áp dụng cho hóa đơn từ 2 vé trở lên trên toàn hệ thống cụm rạp',
    code: 'MEM50K',
    discountValue: 50000,
    validTo: '31.12.2026',
    tag: 'THÀNH VIÊN'
  }
];

export const MEMBERSHIP_TIERS = [
  {
    id: 'silver',
    name: 'Silver',
    sub: 'Thành viên Bạc',
    badge: 'MEMBER',
    colorClass: 'silver',
    benefits: [
      'Tích lũy 3% giá trị đơn hàng vào điểm thưởng',
      'Ưu tiên nhận mã voucher khuyến mãi sớm',
      'Đổi điểm lấy bắp nước miễn phí'
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    sub: 'Thành viên Vàng',
    badge: 'VIP',
    colorClass: 'gold',
    benefits: [
      'Tích lũy 5% giá trị đơn hàng',
      'Miễn phí 1 lần nâng size bắp nước mỗi tháng',
      'Vé xem phim 2D miễn phí dịp sinh nhật'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    sub: 'Thành viên Bạch Kim',
    badge: 'VVIP',
    colorClass: 'platinum',
    benefits: [
      'Tích lũy 7% giá trị đơn hàng',
      'Cặp vé 2D + combo bắp nước dịp sinh nhật',
      'Sử dụng phòng chờ VIP sang trọng tại rạp chọn lọc'
    ]
  }
];

export const SHOWTIME_SLOTS = [
  '09:15', '11:40', '14:20', '16:55', '19:30', '21:45'
];