import { useUserProfile } from "@/hooks/useUserProfile";
import { useAddresses } from "@/hooks/useAddresses";
import { useTranslation } from "react-i18next";

interface UserAddressDisplayProps {
  className?: string;
}

export const UserAddressDisplay = ({ className }: UserAddressDisplayProps) => {
  const { isConsumer, isRestaurant } = useUserProfile();
  const { t } = useTranslation();
  
  // Get appropriate address based on user type
  const { primaryAddress: consumerAddress } = useAddresses('user_delivery');
  const { primaryAddress: restaurantAddress } = useAddresses('restaurant');
  
  const address = isConsumer ? consumerAddress : restaurantAddress;
  const addressLabel = isConsumer ? t('address.delivery') : t('address.restaurant');
  
  if (!address?.formatted_address) {
    return null;
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`} title={addressLabel}>
      📍 {address.formatted_address}
    </p>
  );
};