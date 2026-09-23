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
    name: 'CGV Landmark 81',
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
    name: 'CGV Vincom Đồng Khởi',
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
    name: 'CGV Giga Mall',
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
    name: 'CGV Crescent Mall',
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
    name: 'CGV Aeon Tân Phú',
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
    name: 'CGV Sala',
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
    language: 'Tiếng Anh',
    subtitle: 'Tiếng Việt',
    supportedModes: 'SUBTITLED,DUBBED',
    isFeatured: true,
    country: 'Mỹ',
    ageRating: 'T16',
    duration: 135,
    showingStatus: 'NOW_SHOWING',
    releaseDate: '04.07.2025',
    endDate: '28.08.2025',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=fb5ELWi-ekk',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/fb5ELWi-ekk',
    synopsis: 'Năm năm sau các sự kiện của Jurassic World Dominion, hệ sinh thái của Trái Đất phần lớn đã chứng minh không thể phù hợp cho khủng long. Những sinh vật còn sót lại tồn tại trong các môi trường xích đạo bị cô lập. Ba trong số những sinh vật khổng lồ nhất trong quần thể nhiệt đới này nắm giữ chìa khóa để điều chế một loại thuốc sinh học mang lại lợi ích thần kỳ cho nhân loại. Một đội đặc nhiệm tinh nhuệ được phái đến hòn đảo bí mật để thu thập mẫu ADN từ các loài bò sát tiền sử nguy hiểm bậc nhất hành tinh.',
    casts: [
      {
        id: 'c-01',
        actorName: 'Gareth Edwards',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-02',
        actorName: 'Scarlett Johansson',
        characterName: 'Zora Bennett',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-03',
        actorName: 'Jonathan Bailey',
        characterName: 'Dr. Henry Loomis',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-04',
        actorName: 'Mahershala Ali',
        characterName: 'Duncan Kincaid',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
        displayOrder: 3
      },
      {
        id: 'c-05',
        actorName: 'Rupert Friend',
        characterName: 'Martin Krebs',
        roleType: 'SUPPORTING',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop',
        displayOrder: 4
      }
    ]
  },
  {
    id: 'mov-02',
    title: 'Dế Mèn: Cuộc Phiêu Lưu Tới Xóm Lầy Lội',
    originalTitle: 'Men Cricket Adventures',
    director: 'Nguyễn Đăng Quang',
    cast: 'Hoàng Dũng, Diệu Nhi, Trấn Thành (lồng tiếng)',
    genre: ['Hoạt hình', 'Phiêu lưu', 'Gia đình'],
    language: 'Tiếng Việt',
    subtitle: 'Tiếng Anh',
    supportedModes: 'DUBBED',
    isFeatured: true,
    country: 'Việt Nam',
    ageRating: 'P',
    duration: 95,
    showingStatus: 'NOW_SHOWING',
    releaseDate: '10.07.2025',
    endDate: '15.09.2025',
    posterUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=kY382w3wB64',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/kY382w3wB64',
    synopsis: 'Lấy cảm hứng từ tác phẩm văn học kinh điển Dế Mèn Phiêu Lưu Ký, bộ phim đưa khán giả vào hành trình trưởng thành đầy hài hước và xúc động của chú Dế Mèn kiêu hãnh. Sau bài học nhớ đời về sự ngông cuồng, Mèn cùng người bạn đường chí cốt Dế Trũi vượt qua đầm lầy hiểm trở, đương đầu với băng cướp Cóc Đen để giải cứu cư dân xóm Bờ Cỏ.',
    casts: [
      {
        id: 'c-11',
        actorName: 'Nguyễn Đăng Quang',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-12',
        actorName: 'Hoàng Dũng',
        characterName: 'Dế Mèn (Lồng tiếng)',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-13',
        actorName: 'Diệu Nhi',
        characterName: 'Bướm Hoa (Lồng tiếng)',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-14',
        actorName: 'Trấn Thành',
        characterName: 'Dế Trũi (Lồng tiếng)',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
        displayOrder: 3
      }
    ]
  },
  {
    id: 'mov-03',
    title: 'Bảy Ngày Bên Nhau',
    originalTitle: 'Seven Days Together',
    director: 'Vũ Ngọc Đãng',
    cast: 'Thái Hòa, Thu Trang, Kiều Minh Tuấn',
    genre: ['Tình cảm', 'Hài hước', 'Tâm lý'],
    language: 'Tiếng Việt',
    subtitle: 'Tiếng Anh',
    supportedModes: 'SUBTITLED',
    isFeatured: true,
    country: 'Việt Nam',
    ageRating: 'T13',
    duration: 108,
    showingStatus: 'NOW_SHOWING',
    releaseDate: '15.07.2025',
    endDate: '20.09.2025',
    posterUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=7wtfhZwyrcc',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/7wtfhZwyrcc',
    synopsis: 'Một kỳ nghỉ bất đắc dĩ tại vùng thung lũng Đà Lạt thơ mộng kéo dài đúng 7 ngày đã gắn kết những con người xa lạ có tính cách trái ngược hoàn toàn. Từ những xung đột nảy lửa ban đầu, họ dần thấu hiểu những tổn thương và khoảng lặng của nhau, để rồi tìm lại được niềm tin yêu cuộc sống và giá trị đích thực của tình thân gia đình.',
    casts: [
      {
        id: 'c-21',
        actorName: 'Vũ Ngọc Đãng',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-22',
        actorName: 'Thái Hòa',
        characterName: 'Ông Ba',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-23',
        actorName: 'Thu Trang',
        characterName: 'Bà Mai',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-24',
        actorName: 'Kiều Minh Tuấn',
        characterName: 'Hoàng Long',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop',
        displayOrder: 3
      }
    ]
  },
  {
    id: 'mov-04',
    title: 'Ma Da',
    originalTitle: 'Ma Da: River Ghost',
    director: 'Nguyễn Hữu Hoàng',
    cast: 'Việt Hương, Trung Dân, Dạ Chúc',
    genre: ['Kinh dị', 'Bí ẩn', 'Tâm lý'],
    language: 'Tiếng Việt',
    subtitle: 'Tiếng Anh',
    supportedModes: 'SUBTITLED',
    isFeatured: false,
    country: 'Việt Nam',
    ageRating: 'T18',
    duration: 112,
    showingStatus: 'NOW_SHOWING',
    releaseDate: '16.07.2025',
    endDate: '30.09.2025',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=yF8zF0B7b88',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/yF8zF0B7b88',
    synopsis: 'Lệ là một người phụ nữ lam lũ làm nghề vớt xác trên khúc sông vắng vùng sông nước Tây Nam Bộ. Công việc của bà luôn đối diện với ranh giới mong manh giữa âm và dương. Mọi chuyện bắt đầu trở nên kinh hoàng khi bà vô tình cứu vớt một linh hồn oan khuất bị trói buộc dưới đáy sông sâu, kéo theo hàng loạt hiện tượng tâm linh rợn tóc gáy đe dọa sinh mạng của chính con gái bà.',
    casts: [
      {
        id: 'c-31',
        actorName: 'Nguyễn Hữu Hoàng',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-32',
        actorName: 'Việt Hương',
        characterName: 'Bà Lệ',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-33',
        actorName: 'Trung Dân',
        characterName: 'Ông Sáu Lèo',
        roleType: 'SUPPORTING',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-34',
        actorName: 'Dạ Chúc',
        characterName: 'Bé Nhung',
        roleType: 'SUPPORTING',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop',
        displayOrder: 3
      }
    ]
  },
  {
    id: 'mov-05',
    title: 'Mission: Impossible — Nghiệp Báo Cuối Cùng',
    originalTitle: 'Mission: Impossible The Final Reckoning',
    director: 'Christopher McQuarrie',
    cast: 'Tom Cruise, Hayley Atwell, Ving Rhames',
    genre: ['Hành động', 'Phiêu lưu', 'Giật gân'],
    language: 'Tiếng Anh',
    subtitle: 'Tiếng Việt',
    supportedModes: 'SUBTITLED,DUBBED',
    isFeatured: true,
    country: 'Mỹ',
    ageRating: 'T16',
    duration: 169,
    showingStatus: 'NOW_SHOWING',
    releaseDate: '23.05.2025',
    endDate: '15.10.2025',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=NOhDyRTTnw8',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/NOhDyRTTnw8',
    synopsis: 'Cuộc đối đầu sinh tử đỉnh cao giữa Ethan Hunt và Thực Thể AI toàn năng đã đạt đến đỉnh điểm. Với mạng sống của các đồng đội thân thiết và trật tự an ninh toàn cầu bị đe dọa trực diện, Hunt buộc phải đưa ra những quyết định nghiệt ngã, thực hiện những pha hành động cảm tử không tưởng dưới đáy đại dương và trên bầu trời Bắc Cực.',
    casts: [
      {
        id: 'c-41',
        actorName: 'Christopher McQuarrie',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-42',
        actorName: 'Tom Cruise',
        characterName: 'Ethan Hunt',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-43',
        actorName: 'Hayley Atwell',
        characterName: 'Grace',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-44',
        actorName: 'Ving Rhames',
        characterName: 'Luther Stickell',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
        displayOrder: 3
      }
    ]
  },
  {
    id: 'mov-06',
    title: 'Siêu Nhân Trở Lại',
    originalTitle: 'Superman (2025)',
    director: 'James Gunn',
    cast: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult',
    genre: ['Hành động', 'Khoa học viễn tưởng'],
    language: 'Tiếng Anh',
    subtitle: 'Tiếng Việt',
    supportedModes: 'SUBTITLED',
    isFeatured: false,
    country: 'Mỹ',
    ageRating: 'T13',
    duration: 130,
    showingStatus: 'COMING_SOON',
    releaseDate: '25.07.2025',
    endDate: '30.11.2025',
    posterUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=Ox8ZpP6bFfg',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/Ox8ZpP6bFfg',
    synopsis: 'Mở màn cho kỷ nguyên mới của Vũ trụ Điện ảnh DC dưới bàn tay chỉ đạo của James Gunn. Bộ phim tập trung vào chàng phóng viên trẻ Clark Kent khi anh phải tìm cách cân bằng giữa di sản siêu phàm của người Krypton với những giá trị đạo đức nhân văn sâu sắc mà anh được nuôi dưỡng tại thị trấn Smallville, Trái Đất.',
    casts: [
      {
        id: 'c-51',
        actorName: 'James Gunn',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-52',
        actorName: 'David Corenswet',
        characterName: 'Clark Kent / Superman',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-53',
        actorName: 'Rachel Brosnahan',
        characterName: 'Lois Lane',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-54',
        actorName: 'Nicholas Hoult',
        characterName: 'Lex Luthor',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        displayOrder: 3
      }
    ]
  },
  {
    id: 'mov-07',
    title: 'F1: The Movie',
    originalTitle: 'F1 Starring Brad Pitt',
    director: 'Joseph Kosinski',
    cast: 'Brad Pitt, Damson Idris, Javier Bardem',
    genre: ['Hành động', 'Thể thao'],
    language: 'Tiếng Anh',
    subtitle: 'Tiếng Việt',
    supportedModes: 'SUBTITLED',
    isFeatured: false,
    country: 'Mỹ',
    ageRating: 'T13',
    duration: 140,
    showingStatus: 'COMING_SOON',
    releaseDate: '01.08.2025',
    endDate: '15.11.2025',
    posterUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=8v_4p9gH4eA',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/8v_4p9gH4eA',
    synopsis: 'Được quay trực tiếp tại các chặng đua Grand Prix F1 thực tế trên khắp thế giới với công nghệ máy quay IMAX tối tân. Sonny Hayes (Brad Pitt thủ vai), cựu tay đua lẫy lừng từng gặp tai nạn khủng khiếp trong quá khứ, quyết định tái xuất đường đua tốc độ đỉnh cao để làm người cố vấn kiêm tay lái kèm cặp cho thần đồng trẻ tuổi Joshua Pearce.',
    casts: [
      {
        id: 'c-61',
        actorName: 'Joseph Kosinski',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-62',
        actorName: 'Brad Pitt',
        characterName: 'Sonny Hayes',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-63',
        actorName: 'Damson Idris',
        characterName: 'Joshua Pearce',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        displayOrder: 2
      },
      {
        id: 'c-64',
        actorName: 'Javier Bardem',
        characterName: 'Chủ đội đua APXGP',
        roleType: 'SUPPORTING',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop',
        displayOrder: 3
      }
    ]
  },
  {
    id: 'mov-08',
    title: 'Blue Lock: Episode Nagi',
    originalTitle: 'Blue Lock the Movie: Episode Nagi',
    director: 'Shunsuke Ishikawa',
    cast: 'Nobunaga Shimazaki, Yuma Uchida',
    genre: ['Hoạt hình', 'Thể thao'],
    language: 'Tiếng Nhật',
    subtitle: 'Tiếng Việt',
    supportedModes: 'SUBTITLED',
    isFeatured: false,
    country: 'Nhật Bản',
    ageRating: 'T13',
    duration: 90,
    showingStatus: 'COMING_SOON',
    releaseDate: '15.08.2025',
    endDate: '30.10.2025',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1400&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=qS5s4hF2v54',
    trailerYoutubeUrl: 'https://www.youtube.com/embed/qS5s4hF2v54',
    synopsis: 'Khám phá câu chuyện từ góc nhìn của thiên tài lười biếng Nagi Seishiro trước khi bước chân vào dự án đào tạo tiền đạo Blue Lock khắc nghiệt. Được phát hiện bởi người bạn cùng trường giàu tham vọng Mikage Reo, Nagi dần đánh thức bản năng sát thủ và ngọn lửa đam mê bóng đá cuồng nhiệt ẩn sâu bên trong mình.',
    casts: [
      {
        id: 'c-71',
        actorName: 'Shunsuke Ishikawa',
        characterName: 'Đạo diễn',
        roleType: 'DIRECTOR',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
        displayOrder: 0
      },
      {
        id: 'c-72',
        actorName: 'Nobunaga Shimazaki',
        characterName: 'Nagi Seishiro (Lồng tiếng)',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop',
        displayOrder: 1
      },
      {
        id: 'c-73',
        actorName: 'Yuma Uchida',
        characterName: 'Mikage Reo (Lồng tiếng)',
        roleType: 'LEAD',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        displayOrder: 2
      }
    ]
  }
];

export const PROMOTIONS = [
  {
    id: '31000000-0000-0000-0000-000000000001',
    code: 'CGVWELCOME',
    name: 'Chào mừng thành viên mới - Giảm 20%',
    title: 'Chào mừng thành viên mới - Giảm 20%',
    description: 'Giảm 20% tối đa 50.000đ cho đơn hàng từ 100.000đ',
    desc: 'Giảm 20% tối đa 50.000đ cho đơn hàng từ 100.000đ',
    discountType: 'PERCENT',
    discountValue: 20,
    minOrderValue: 100000,
    maxDiscountAmount: 50000,
    discountPill: '-20%',
    validTo: '31.12.2026',
    category: 'Thành viên',
    applicableTier: 'ALL',
    tier: 'MEMBER',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop'
  },
  {
    id: '31000000-0000-0000-0000-000000000002',
    code: 'CGVIP50K',
    name: 'Ưu đãi thành viên VIP - Giảm 50K',
    title: 'Ưu đãi thành viên VIP - Giảm 50K',
    description: 'Giảm trực tiếp 50.000đ cho thành viên từ hạng Silver trở lên',
    desc: 'Giảm trực tiếp 50.000đ cho thành viên từ hạng Silver trở lên',
    discountType: 'FIXED',
    discountValue: 50000,
    minOrderValue: 150000,
    discountPill: '-50K',
    validTo: '30.11.2026',
    category: 'Thành viên',
    applicableTier: 'SILVER',
    tier: 'VIP',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=600&auto=format&fit=crop'
  },
  {
    id: '31000000-0000-0000-0000-000000000003',
    code: 'MEGASALE',
    name: 'Siêu Sale Cuối Tuần - Giảm 30%',
    title: 'Siêu Sale Cuối Tuần - Giảm 30%',
    description: 'Giảm 30% tối đa 100.000đ cho đơn hàng từ 200.000đ',
    desc: 'Giảm 30% tối đa 100.000đ cho đơn hàng từ 200.000đ',
    discountType: 'PERCENT',
    discountValue: 30,
    minOrderValue: 200000,
    maxDiscountAmount: 100000,
    discountPill: '-30%',
    validTo: '31.10.2026',
    category: 'Giảm giá',
    applicableTier: 'ALL',
    tier: 'MEMBER',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop'
  },
  {
    id: '31000000-0000-0000-0000-000000000004',
    code: 'CGVPLATINUM',
    name: 'Đặc quyền Bạch Kim - Giảm 100K',
    title: 'Đặc quyền Bạch Kim - Giảm 100K',
    description: 'Giảm 100.000đ khi đặt vé IMAX hoặc suất chiếu đặc biệt',
    desc: 'Giảm 100.000đ khi đặt vé IMAX hoặc suất chiếu đặc biệt',
    discountType: 'FIXED',
    discountValue: 100000,
    minOrderValue: 250000,
    discountPill: '-100K',
    validTo: '31.12.2026',
    category: 'Thành viên',
    applicableTier: 'PLATINUM',
    tier: 'VVIP',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop'
  },
  {
    id: '31000000-0000-0000-0000-000000000005',
    code: 'CGWED55',
    name: 'Mega Sale Thứ 4 - Giảm 45K',
    title: 'Mega Sale Thứ 4 - Giảm 45K',
    description: 'Áp dụng cho mọi suất chiếu tiêu chuẩn vào các ngày trong tuần',
    desc: 'Áp dụng cho mọi suất chiếu tiêu chuẩn vào các ngày trong tuần',
    discountType: 'FIXED',
    discountValue: 45000,
    minOrderValue: 80000,
    discountPill: 'ĐỒNG GIÁ 55K',
    validTo: '31.12.2026',
    category: 'Vé xem phim',
    applicableTier: 'ALL',
    tier: 'MEMBER',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop'
  }
];

export const VOUCHERS = PROMOTIONS.filter(p => p.code);

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