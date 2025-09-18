import { useUserProfile } from "@/hooks/useUserProfile";
import { useAddresses } from "@/hooks/useAddresses";
import { useTranslation } from "react-i18next";

interface UserAddressDisplayProps {
  className?: string;
}

export const UserAddressDisplay = ({ className }: UserAddressDisplayProps) => {
  const { isConsumer, isRestaurant } = useUserProfile();
  const { t } = useTranslation();
  
  // Always show restaurant address for both user types
  const { primaryAddress: restaurantAddress } = useAddresses('restaurant');
  
  const address = restaurantAddress;
  const addressLabel = t('address.restaurant');
  
  if (!address?.formatted_address) {
    return null;
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`} title={addressLabel}>
      📍 Montréal, QC
    </p>
  );
};