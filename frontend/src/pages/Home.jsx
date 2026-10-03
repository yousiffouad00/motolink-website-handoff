import { useLoaderData, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bike,
  ShieldCheck,
  Wrench,
  Disc,
  Shield,
  Zap,
  CircleDot,
  Package,
  Gauge,
  Droplet,
  Sparkles,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import heroVideo from "../assets/Home_page_video.mp4";
import heroPoster from "../assets/hero.png";
import * as api from "../api";
import ProductCard from "../components/ProductCard";

// Maps the "icon" string returned by the backend to an actual lucide-react icon.
// Falls back to a generic package icon for any name we don't recognize yet.
const CATEGORY_ICONS = {
  disc: Disc,
  shield: Shield,
  wrench: Wrench,
  zap: Zap,
  dot: CircleDot,
};

const RIDE_SMARTER_TIPS = [
  {
    icon: Gauge,
    title: "Check your tire pressure monthly",
    text: "Under-inflated tires wear faster and hurt handling. Takes two minutes, saves your grip.",
  },
  {
    icon: Droplet,
    title: "Don't skip chain lubrication",
    text: "A dry chain wears out sprockets fast. Lube every 300–500 km, more often in the rain.",
  },
  {
    icon: ShieldCheck,
    title: "Replace your helmet after impact",
    text: "Even a small drop can compromise the shell. When in doubt, swap it out.",
  },
];

const SLIDE_SIZE = 4;

// Slides through `products` four at a time, with a sliding (translate) transition
// and left/right arrows that wrap around at the ends.
function FeaturedGearSlider({ products }) {
  const [slide, setSlide] = useState(0);
  const totalSlides = Math.ceil(products.length / SLIDE_SIZE);

  useEffect(() => {
    // Clamp back to a valid slide if the product list shrinks
    if (slide >= totalSlides) setSlide(0);
  }, [totalSlides, slide]);

  if (products.length === 0) return null;

  const goPrev = () => setSlide((s) => (s - 1 + totalSlides) % totalSlides);
  const goNext = () => setSlide((s) => (s + 1) % totalSlides);

  const groups = [];
  for (let i = 0; i < products.length; i += SLIDE_SIZE) {
    groups.push(products.slice(i, i + SLIDE_SIZE));
  }

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {groups.map((group, i) => (
            <div
              key={i}
              className="min-w-full grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 items-start"
            >
              {group.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={goPrev}
            aria-label="Previous products"
            className="p-2 rounded-full border border-motolink-blue-light text-motolink-blue-dark hover:bg-motolink-blue-light transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            {groups.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === slide ? "w-5 bg-motolink-blue" : "w-2 bg-motolink-blue-light"
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            aria-label="Next products"
            className="p-2 rounded-full border border-motolink-blue-light text-motolink-blue-dark hover:bg-motolink-blue-light transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { categories } = useLoaderData();

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // One fetch, reused for Featured, Deals, and the real brand list -
  // avoids hitting the backend three separate times for the same data.
  useEffect(() => {
    api
      .getProducts({ size: 50 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.content || [];
        setAllProducts(list);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  // Featured now pulls from the whole product list so the slider has more than one page to show
  const featuredPool = allProducts;
  // Deals shows products the admin actually put on sale, not a random slice
  const deals = allProducts.filter((p) => p.onSale).slice(0, 8);

  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      {/* Hero: video background */}
      <section className="relative h-[70vh] sm:h-[80vh] min-h-[420px] max-h-[750px] overflow-hidden bg-motolink-blue-dark">
        <video
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          autoPlay
          muted
          loop
          playsInline
          poster={heroPoster}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-motolink-blue-dark/40" />

        <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-center px-6">
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-6xl text-white leading-tight max-w-2xl">
            Your ride, one link away.
          </h1>
          <p className="font-body text-white/80 text-base sm:text-lg mt-4 max-w-lg">
            Motolink connects you with the parts and gear your bike
            actually needs.
          </p>
          <div className="mt-6 sm:mt-8">
            <button
              onClick={scrollToCategories}
              className="cursor-pointer bg-motolink-blue hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-200 text-white font-display font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base"
            >
              Shop now
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
        <h2 className="font-display font-bold text-2xl text-motolink-blue-dark mb-6">
          Shop by category
        </h2>

        {!categories || categories.length === 0 ? (
          <p className="text-motolink-slate text-sm">Categories will show up here once available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon] || Package;
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="cursor-pointer flex flex-col items-center gap-2 bg-white border border-motolink-blue-light rounded-xl p-5 hover:border-motolink-blue hover:shadow-sm transition-all text-center"
                >
                  <div className="p-3 rounded-full bg-motolink-blue-light">
                    <Icon className="text-motolink-blue" size={22} />
                  </div>
                  <span className="font-display font-semibold text-sm text-motolink-blue-dark">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured Gear - sliding carousel, 4 products per slide */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-motolink-blue-dark">
            Featured gear
          </h2>
          <Link
            to="/products"
            className="text-sm font-display font-semibold text-motolink-blue hover:underline"
          >
            View all
          </Link>
        </div>

        {productsLoading ? (
          <p className="text-motolink-slate text-sm">Loading featured products…</p>
        ) : featuredPool.length === 0 ? (
          <p className="text-motolink-slate text-sm">Featured products will show up here soon.</p>
        ) : (
          <FeaturedGearSlider products={featuredPool} />
        )}
      </section>

      {/* Deals - only real on-sale products, set by the admin */}
      {!productsLoading && deals.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="text-motolink-blue" size={20} />
            <h2 className="font-display font-bold text-2xl text-motolink-blue-dark">
              Deals
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 items-start">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Why choose Motolink */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display font-bold text-2xl text-motolink-blue-dark mb-8">
          Why choose Motolink
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Bike, title: "Genuine parts", text: "Sourced and checked for your exact model." },
            { icon: Wrench, title: "Helpful support", text: "Talk to our team when you need help choosing a part." },
            { icon: ShieldCheck, title: "Simple ordering", text: "Choose how to pay and confirm the details with our team." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <div className="p-3 rounded-xl bg-motolink-blue-light">
                <Icon className="text-motolink-blue" size={24} />
              </div>
              <h3 className="font-display font-semibold text-lg text-motolink-blue-dark">
                {title}
              </h3>
              <p className="text-motolink-slate text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ride Smarter: lifestyle / educational content */}
      <section className="bg-motolink-blue-light/40 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="text-motolink-blue" size={22} />
            <h2 className="font-display font-bold text-2xl text-motolink-blue-dark">
              Ride smarter
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RIDE_SMARTER_TIPS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white border border-motolink-blue-light rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="p-2.5 rounded-lg bg-motolink-blue-light w-fit">
                  <Icon className="text-motolink-blue" size={20} />
                </div>
                <h3 className="font-display font-semibold text-motolink-blue-dark">
                  {title}
                </h3>
                <p className="text-motolink-slate text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
