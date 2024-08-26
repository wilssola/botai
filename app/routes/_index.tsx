import type { MetaFunction } from "@remix-run/node";
import Banner from "~/components/Banner";
import Header from "~/components/Header";
import { APP_NAME } from "~/consts";
import Hero from "../components/Hero";

export const meta: MetaFunction = () => {
  return [
    { title: `${APP_NAME} | Home` },
    { name: "description", content: `Bem-vindo ao ${APP_NAME}` },
  ];
};

export default function Index() {
  return (
    <>
      <Header></Header>
      <Banner></Banner>
      <Hero></Hero>
    </>
  );
}
