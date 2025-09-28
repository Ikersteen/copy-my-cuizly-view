import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/Header";
import IOSHeader from "@/components/IOSHeader";

const HeaderWrapper = () => {
  const isMobile = useIsMobile();
  
  return isMobile ? <IOSHeader /> : <Header />;
};

export default HeaderWrapper;