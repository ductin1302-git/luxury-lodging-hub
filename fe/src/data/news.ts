export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
}

export const blogs: BlogPost[] = [
  {
    id: 1,
    title: "Top 5 Điểm Đến Nghỉ Dưỡng Sang Trọng Nhất Mùa Hè 2024",
    excerpt: "Khám phá những bãi biển ẩn mình và những resort đẳng cấp giúp bạn tận hưởng kỳ nghỉ hè trọn vẹn nhất...",
    content: `
      <p>Mùa hè là thời điểm lý tưởng để xua tan đi cái nóng và tận hưởng những giây phút nghỉ ngơi thư giãn bên gia đình. Nếu bạn đang tìm kiếm những trải nghiệm đẳng cấp nhất, dưới đây là top 5 điểm đến không thể bỏ qua.</p>
      
      <h3>1. Nha Trang - Thiên Đường Biển Xanh</h3>
      <p>Với những hòn đảo hoang sơ và hệ thống resort 5 sao quốc tế, Nha Trang vẫn luôn giữ vững vị thế là điểm đến nghỉ dưỡng hàng đầu. Tại đây, bạn có thể trải nghiệm các liệu trình spa bùn khoáng độc đáo hoặc thưởng thức hải sản thượng hạng ngay trên du thuyền.</p>
      
      <h3>2. Phú Quốc - Đảo Ngọc Lung Linh</h3>
      <p>Không chỉ có Bãi Sao, Bãi Khem với cát trắng mịn, Phú Quốc còn thu hút du khách bởi những khu nghỉ dưỡng được thiết kế theo phong cách kiến trúc châu Âu cổ điển hay hiện đại tối giản. Đây là nơi tuyệt vời nhất để ngắm hoàng hôn đỏ rực trên biển.</p>
      
      <h3>3. Đà Nẵng - Thành Phố Của Những Những Cây Cầu</h3>
      <p>Sở hữu bãi biển Mỹ Khê - một trong sáu bãi biển quyến rũ nhất hành tinh, Đà Nẵng kết hợp hoàn hảo giữa nhịp sống hiện đại và sự tĩnh lặng của thiên nhiên. Các khu nghỉ dưỡng tại bán đảo Sơn Trà mang đến không gian riêng tư tuyệt đối giữa đại ngàn và biển cả.</p>
      
      <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1600" alt="Nha Trang View" style="width:100%; border-radius: 1rem; margin: 2rem 0;" />
      
      <h3>4. Quy Nhơn - Vẻ Đẹp Hoang Sơ Đang Thức Giấc</h3>
      <p>Nếu bạn yêu thích sự yên bình, Quy Nhơn là lựa chọn hoàn hảo. Những gành đá kỳ vĩ và làn nước trong vắt như pha lê sẽ làm say lòng bất cứ ai. Luxury Stay Quy Nhơn tự hào mang đến trải nghiệm lưu trú giữa lòng thiên nhiên kỳ thú.</p>
      
      <h3>5. Đà Lạt - Cao Nguyên Sương Mờ</h3>
      <p>Cho những ai muốn "trốn" cái nắng gay gắt, không khí se lạnh của Đà Lạt luôn có sức hút kỳ lạ. Những ngôi biệt thự cổ thời Pháp thuộc được cải tạo thành boutique hotel sang trọng sẽ mang đến cảm giác hoài cổ và ấm cúng.</p>
      
      <p>Hãy liên hệ với chúng tôi ngay hôm nay để đặt phòng và nhận những ưu đãi đặc biệt cho mùa hè này!</p>
    `,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2070",
    date: "05/05/2026",
    author: "Admin",
    category: "Du Lịch",
    tags: ["Du lịch", "Mùa hè", "Nha Trang"]
  },
  {
    id: 2,
    title: "Nghệ Thuật Thưởng Thức Rượu Vang Tại Luxury Stay",
    excerpt: "Hành trình khám phá hương vị tinh tế từ những hầm rượu vang danh tiếng nhất thế giới ngay tại sảnh chờ của chúng tôi...",
    content: `
      <p>Thưởng thức rượu vang không chỉ là một thói quen, mà là một nghệ thuật sống. Tại Luxury Stay, chúng tôi không ngừng nỗ lực mang đến những trải nghiệm tinh túy nhất cho quý khách.</p>
      <p>Mỗi chai rượu trong bộ sưu tập của chúng tôi đều được tuyển chọn kỹ lưỡng từ các vùng trồng nho danh tiếng như Bordeaux (Pháp), Tuscany (Ý) hay thung lũng Napa (Mỹ). Đội ngũ Sommelier giàu kinh nghiệm của chúng tôi luôn sẵn sàng tư vấn để quý khách tìm thấy hương vị phù hợp nhất với khẩu vị và món ăn đang thưởng thức.</p>
    `,
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=2070",
    date: "02/05/2026",
    author: "Sommelier",
    category: "Ẩm Thực",
    tags: ["Ẩm thực", "Rượu vang", "Luxury"]
  },
  {
    id: 3,
    title: "Ưu Đãi Đặc Biệt Cho Kỳ Nghỉ Tuần Trăng Mật",
    excerpt: "Chúng tôi mang đến những gói dịch vụ lãng mạn nhất dành cho các cặp đôi mới cưới, tạo nên khởi đầu hạnh phúc...",
    content: `
      <p>Tuần trăng mật là khởi đầu của một hành trình hạnh phúc trọn đời. Luxury Stay thấu hiểu điều đó và đã thiết kế những gói ưu đãi đặc biệt để kỳ nghỉ của hai bạn trở nên lung linh và đáng nhớ nhất.</p>
      <p>Dịch vụ bao gồm: Trang trí phòng lãng mạn với nến và hoa hồng, bữa tối dưới ánh sao bên bờ biển, liệu trình spa đôi thư giãn và quà tặng lưu niệm cao cấp từ khách sạn.</p>
    `,
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=2070",
    date: "28/04/2026",
    author: "Marketing",
    category: "Sự Kiện",
    tags: ["Sự kiện", "Trăng mật", "Lãng mạn"]
  },
  {
    id: 4,
    title: "Bí Quyết Chăm Sóc Da Tại Spa Đẳng Cấp 5 Sao",
    excerpt: "Những liệu trình chăm sóc da từ thiên nhiên kết hợp cùng công nghệ hiện đại giúp bạn duy trì vẻ tươi trẻ...",
    content: `
      <p>Làn da là tấm gương phản chiếu sức khỏe và tâm hồn. Tại hệ thống Spa của Luxury Stay, chúng tôi sử dụng các sản phẩm organic cao cấp kết hợp cùng kỹ thuật massage điêu luyện để mang lại sự tái sinh cho làn da bạn.</p>
    `,
    image: "https://images.unsplash.com/photo-1544161515-4af6b1d46af0?auto=format&fit=crop&q=80&w=2070",
    date: "25/04/2026",
    author: "Spa Manager",
    category: "Sức Khỏe",
    tags: ["Sức khỏe", "Spa", "Làm đẹp"]
  }
];
