import Banner from "~/components/Banner";
import Header from "~/components/Header";
import { defaultMeta } from "~/utils/default-meta";
import Hero from "../components/Hero";
import { HOME_PATH } from "~/routes";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => defaultMeta("Home", HOME_PATH);

export default function Index() {
  return (
    <>
      <Header></Header>
      <Banner></Banner>
      <Hero></Hero>
    </>
  );
}
