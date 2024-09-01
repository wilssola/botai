import Banner from "~/components/Banner";
import Header from "~/components/Header";
import {defaultMeta} from "~/utils/default-meta";
import Hero from "../components/Hero";

export const meta = defaultMeta("Home");

export default function Index() {
  return (
    <>
      <Header></Header>
      <Banner></Banner>
      <Hero></Hero>
    </>
  );
}
