import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div>
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold">Welcome to {PLATFORM_NAME}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find licensed smoke shops near you and get legal delivery to your door.
        </p>
        <div className="mt-8">
          <Link
            href="/stores"
            className="inline-block rounded-md bg-primary px-8 py-3 text-lg text-primary-foreground hover:bg-primary/90"
          >
            Find Stores Near Me
          </Link>
        </div>
      </section>
    </div>
  );
}
