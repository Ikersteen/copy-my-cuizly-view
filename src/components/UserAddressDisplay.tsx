import { useUserProfile } from "@/hooks/useUserProfile";
import { useAddresses } from "@/hooks/useAddresses";
import { useTranslation } from "react-i18next";

interface UserAddressDisplayProps {
  className?: string;
}

export const UserAddressDisplay = ({ className }: UserAddressDisplayProps) => {
  const { t } = useTranslation();
  
  // Get user delivery address for consumer-only app
  const { primaryAddress: deliveryAddress } = useAddresses('user_delivery');
  
  const address = deliveryAddress;
  const addressLabel = t('address.delivery');
  
  if (!address?.formatted_address) {
    return null;
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`} title={addressLabel}>
      📍 {address.formatted_address}
    </p>
  );
};