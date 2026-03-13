import { router } from "../trpc";
import { authRouter } from "./auth";
import { adminDashboardRouter } from "./admin-dashboard";
import { adminStoreRouter } from "./admin-store";
import { adminUserRouter } from "./admin-user";
import { adminCategoryRouter } from "./admin-category";
import { storeOwnerRouter } from "./store-owner";
import { uploadRouter } from "./upload";
import { storeProductRouter } from "./store-product";
import { customerStoreRouter } from "./customer-store";
import { checkoutRouter } from "./checkout";
import { storeOrderRouter } from "./store-order";
import { idvRouter } from "./idv";
import { reviewRouter } from "./review";
import { notificationRouter } from "./notification";
import { referralRouter } from "./referral";
import { favoriteRouter } from "./favorite";
import { storeAnalyticsRouter } from "./store-analytics";

export const appRouter = router({
  auth: authRouter,
  adminDashboard: adminDashboardRouter,
  adminStore: adminStoreRouter,
  adminUser: adminUserRouter,
  adminCategory: adminCategoryRouter,
  storeOwner: storeOwnerRouter,
  storeProduct: storeProductRouter,
  customerStore: customerStoreRouter,
  checkout: checkoutRouter,
  storeOrder: storeOrderRouter,
  idv: idvRouter,
  review: reviewRouter,
  notification: notificationRouter,
  referral: referralRouter,
  favorite: favoriteRouter,
  storeAnalytics: storeAnalyticsRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
