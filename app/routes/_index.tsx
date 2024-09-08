import Banner from "~/components/Banner";
import Header from "~/components/Header";
import { defaultMeta } from "~/utils/default-meta";
import Hero from "../components/Hero";
import { HOME_PATH } from "~/routes";
import type { MetaFunction } from "@remix-run/node";
import Features from "~/components/Features";
import Testimonials from "~/components/Testimonials";
import Footer from "~/components/Footer";

export const meta: MetaFunction = () => defaultMeta("Home", HOME_PATH);

export default function Index() {
  return (
    <>
      <Header />
      <Banner />
      <Hero />
      <Features />
      <Testimonials />
      <Footer />
    </>
  );
}
