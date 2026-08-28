import Link from "next/link";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/homepage-motion";
import { PublicShell } from "../../components/public-shell";
import { Icon } from "../../components/icons";
import { ServiceIcon } from "../../components/service-icon";
import { serviceConfigs } from "../../lib/mock-data";
import bgImage from "../../images/bg1.png";

export default function ServicesPage() {
  return (
    <PublicShell>
      <section className="space-y-8">
        <Reveal mode="load">
          <div
            className="relative overflow-hidden rounded-[32px] border border-emerald-800/40"
            style={{
              backgroundImage: `url(${bgImage.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

            <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 md:max-w-[65%]">
              <span className="mb-4 inline-block self-start rounded-full border border-emerald-300/40 bg-emerald-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-sm">
                Services
              </span>

              <h1
                className="text-2xl font-black uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-3xl md:text-4xl"
                style={{ fontFamily: "'Trebuchet MS', sans-serif" }}
              >
                Choose the service flow that matches your transaction.
              </h1>

              <p
                className="mt-4 text-sm leading-7 text-emerald-100/90 drop-shadow-md sm:text-base"
                style={{ fontFamily: "'Trebuchet MS', sans-serif" }}
              >
                Each module is designed for manual confirmation, clean proof
                uploads, bonus-aware transactions, and admin review.
              </p>
            </div>
          </div>
        </Reveal>

        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceConfigs.map((service) => (
            <StaggerItem key={service.slug} className="h-full">
              <Link
                href={`/login?next=${encodeURIComponent(`/services/${service.slug}`)}&prompt=service`}
                className="group relative block h-full overflow-hidden rounded-[28px] border border-[#e7eee9] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-100 hover:shadow-[0_22px_55px_rgba(15,123,54,0.1)]"
              >
                <span className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-100/60 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <span
                  className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-105 ${service.accent}`}
                >
                  <ServiceIcon
                    name={service.slug}
                    className="h-7 w-7 object-contain"
                  />
                </span>
                <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                  {service.name}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {service.description}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#0f7b36]">
                  Log in to continue
                  <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </PublicShell>
  );
}
