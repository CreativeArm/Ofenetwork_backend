import Image from "next/image";
import derivIcon from "../images/derivcom_icon.jpeg.png";
import payoneerIcon from "../images/payoneer.png";
import paypalIcon from "../images/paypal.png";
import buy4MeIcon from "../images/ShoppingBagOutline.png";
import skrillIcon from "../images/Skrill.png";
import usdtIcon from "../images/usdt.png";
import venmoIcon from "../images/venmo.png";

const serviceIconMap = {
  deriv: derivIcon,
  crypto: usdtIcon,
  skrill: skrillIcon,
  paypal: paypalIcon,
  venmo: venmoIcon,
  payoneer: payoneerIcon,
  buy4me: buy4MeIcon,
} as const;

export type ServiceIconName = keyof typeof serviceIconMap;

interface ServiceIconProps {
  name: ServiceIconName;
  className?: string;
}

export function ServiceIcon({ name, className }: ServiceIconProps) {
  return (
    <Image
      src={serviceIconMap[name]}
      alt={`${name} icon`}
      className={className}
    />
  );
}

export function getRateServiceIconName(label: string): ServiceIconName | null {
  if (label.startsWith("Deriv")) {
    return "deriv";
  }
  if (label.startsWith("Crypto")) {
    return "crypto";
  }
  if (label.startsWith("Skrill")) {
    return "skrill";
  }
  if (label.startsWith("PayPal")) {
    return "paypal";
  }
  if (label.startsWith("Payoneer")) {
    return "payoneer";
  }
  if (label.startsWith("Zelle")) {
    return "venmo";
  }
  if (label.startsWith("Buy 4 Me")) {
    return "buy4me";
  }

  return null;
}
