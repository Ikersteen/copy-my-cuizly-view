import YelpHeroSection from "@/components/YelpHeroSection";
import RestaurantsDiscoverySection from "@/components/RestaurantsDiscoverySection";
import FeaturedRestaurantsSection from "@/components/FeaturedRestaurantsSection";
import CategoriesSection from "@/components/CategoriesSection";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();

  return (
    <>
      <YelpHeroSection />
      <CategoriesSection />
      <FeaturedRestaurantsSection />
      <RestaurantsDiscoverySection />
      <Footer />
    </>
  );
};

export default Index;