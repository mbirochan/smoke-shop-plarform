import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingCart,
  Tag,
  Settings,
  Package,
  ClipboardList,
  Search,
  User,
  Clock,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Stores", href: "/admin/stores", icon: Store },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Categories", href: "/admin/categories", icon: Tag },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export const storeNavItems: NavItem[] = [
  { title: "Dashboard", href: "/store", icon: LayoutDashboard },
  { title: "Profile", href: "/store/profile", icon: Store },
  { title: "Hours", href: "/store/hours", icon: Clock },
  { title: "Products", href: "/store/products", icon: Package },
  { title: "Orders", href: "/store/orders", icon: ClipboardList },
  { title: "Reviews", href: "/store/reviews", icon: Star },
  { title: "Settings", href: "/store/settings", icon: Settings },
];

export const customerNavItems: NavItem[] = [
  { title: "Stores", href: "/stores", icon: Search },
  { title: "Cart", href: "/cart", icon: ShoppingCart },
  { title: "Account", href: "/account", icon: User },
];
