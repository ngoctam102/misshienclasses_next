import Image from 'next/image';

export default function Home() {
  return (
    <div className="bg-pink-100">
      <div className="max-w-screen-xl px-8 mx-auto flex flex-col lg:flex-row items-start overflow-hidden min-h-[45vh] lg:min-h-[50vh]">
        {/* Left Col */}
        <div className="flex flex-col w-full lg:w-6/12 justify-center lg:pt-24 items-start text-center lg:text-left mb-5 md:mb-0">
          <h1 className="my-4 text-5xl font-bold leading-tight text-gray-800">
            <span className="text-yellow-500">MissHienClasses</span>
          </h1>
          <div className="leading-normal text-xl mb-8">
            <h2 className="mb-4">Đối tác đồng hành trên hành trình chinh phục IELTS.</h2>
            <ul className="list-disc list-inside text-left leading-loose">
              <li>Trung tâm luyện thi IELTS hàng đầu – Uy tín, chất lượng, tận tâm</li>
              <li>Nơi khởi đầu của những điểm số mơ ước IELTS</li>
              <li>Trung tâm luyện thi IELTS được hàng ngàn học viên tin tưởng</li>
            </ul>
          </div>
        </div>
        {/* Right Col */}
        <div className="w-full lg:w-6/12 lg:-mt-10 relative flex items-end justify-center" id="girl">
          <div className="w-8/12 h-96 mt-20">
            <Image src="/misshien.jpg" alt="Miss Hien" width={500} height={800} className="rounded-2xl shadow-lg object-cover" />
          </div>
          {/* Decorative SVG */}
          <div className="absolute top-20 right-10 flex items-center justify-center">
            {/* Hiệu ứng blend nền */}
            <div className="absolute inset-0 rounded-full bg-pink-100 blur-xl opacity-70 w-24 h-24 z-0"></div>
            <Image src="/ielts.png" alt="IELTS" width={100} height={100} className="h-20 sm:h-28 drop-shadow-xl relative z-10" />
          </div>
        </div>
      </div>
      <div className="text-white -mt-14 sm:-mt-24 lg:-mt-36 z-40 relative">
        <svg className="xl:h-40 xl:w-full" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z" fill="currentColor"></path>
        </svg>
        <div className="bg-white w-full h-20 -mt-px"></div>
      </div>
      {/* Section: Giới thiệu trung tâm */}
      <section className="max-w-screen-xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 animate-fadeInUp">
          <Image src="/trungtam.jpg" alt="Trung tâm Ms Hiền" width={600} height={400} className="rounded-2xl shadow-xl w-full object-cover" />
        </div>
        <div className="w-full md:w-1/2 animate-fadeInUp delay-200">
          <h2 className="text-3xl font-bold mb-4 text-pink-700">Về Trung Tâm Ms Hiền</h2>
          <p className="text-lg leading-relaxed text-gray-700">Trung tâm Anh ngữ Ms Hiền là địa chỉ luyện thi IELTS, tiếng Anh giao tiếp và tiếng Anh học thuật uy tín tại Biên Hòa. Chúng tôi cam kết đồng hành cùng học viên trên hành trình chinh phục mục tiêu Anh ngữ với đội ngũ giáo viên tận tâm, chương trình học hiện đại và môi trường học tập thân thiện.</p>
        </div>
      </section>
      {/* Section: Lớp học cấp 3, IELTS */}
      <section className="max-w-screen-xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-pink-700 text-center">Lớp luyện thi IELTS & Cấp 3</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="animate-fadeInLeft">
            <Image src="/buoihoc1.jpg" alt="Lớp học IELTS" width={600} height={400} className="rounded-xl shadow-lg w-full object-cover" />
          </div>
          <div className="animate-fadeInRight">
            <Image src="/buoihoc2.jpg" alt="Lớp học cấp 3" width={600} height={400} className="rounded-xl shadow-lg w-full object-cover" />
          </div>
        </div>
        <p className="mt-8 text-center text-lg text-gray-700">Các lớp luyện thi IELTS, tiếng Anh học thuật và tiếng Anh giao tiếp dành cho học sinh cấp 3 với lộ trình cá nhân hóa, sát thực tế, giúp học viên tự tin đạt điểm cao.</p>
      </section>
      {/* Section: Lớp Kid */}
      <section className="max-w-screen-xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-pink-700 text-center">Lớp Kid - Tiếng Anh Thiếu Nhi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="animate-zoomIn">
            <Image src="/kid1.jpg" alt="Lớp Kid 1" width={600} height={400} className="rounded-xl shadow-lg w-full object-cover" />
          </div>
          <div className="animate-zoomIn delay-200">
            <Image src="/kid2.jpg" alt="Lớp Kid 2" width={600} height={400} className="rounded-xl shadow-lg w-full object-cover" />
          </div>
        </div>
        <p className="mt-8 text-center text-lg text-gray-700">Lớp tiếng Anh thiếu nhi giúp các bé làm quen, yêu thích tiếng Anh từ sớm với phương pháp học sinh động, vui nhộn và hiệu quả.</p>
      </section>
      {/* Section: Truyền động lực, cam kết */}
      <section className="max-w-screen-xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-pink-700 text-center">Cam kết</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="animate-fadeInUp">
            <Image src="/wall1.jpg" alt="Câu nói truyền động lực 1" width={600} height={400} className="rounded-xl shadow-lg w-full object-cover" />
          </div>
          <div className="animate-fadeInUp delay-200">
            <Image src="/wall2.jpg" alt="Câu nói truyền động lực 2" width={600} height={400} className="rounded-xl shadow-lg w-full object-cover" />
          </div>
        </div>
        <div className="text-center text-lg text-gray-700 space-y-4 animate-fadeInUp delay-300">
          <p>“Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do.”</p>
          <p>Trung tâm cam kết đồng hành, hỗ trợ học viên hết mình để đạt mục tiêu IELTS và tiếng Anh giao tiếp.</p>
        </div>
      </section>
    </div>
  );
}
