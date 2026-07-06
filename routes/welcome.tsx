import { createFileRoute, Link } from "@tanstack/react-router";
import phoneAsset from "@/assets/rh-welcome-phone.asset.json";

export const Route = createFileRoute("/welcome")({
  component: Welcome,
});

function Welcome() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10 pb-8">
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex justify-center">
            <img
              src={phoneAsset.url}
              alt="Robinhood app"
              className="h-auto w-full max-w-[280px] select-none"
              draggable={false}
            />
          </div>

          <div className="mt-10">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Welcome to Robinhood
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
              Invest in stocks, ETFs, options, and crypto.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Link
            to="/register"
            className="btn-primary-glow inline-flex h-14 items-center justify-center rounded-2xl text-base font-semibold"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="inline-flex h-14 items-center justify-center rounded-2xl text-base font-semibold text-primary hover:bg-primary/5"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
