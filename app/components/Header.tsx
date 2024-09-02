import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, NavLink } from "@remix-run/react";
import { createElement, useState } from "react";
import { FaCreditCard, FaEnvelope, FaStore, FaWhatsapp } from "react-icons/fa";
import Logo from "./Logo";
import {
  FEATURES_PATH,
  LOGIN_PATH,
  PRICING_PATH,
  PRODUCTS_PATH,
  PRODUCTS_PATH_WHATSAPP_BOT,
} from "~/routes";
import { IconType } from "react-icons";
import { LuSparkles } from "react-icons/lu";

type HeaderLink = {
  name: string;
  description: string;
  href: string;
  icon: IconType;
};

const headerLinks: Omit<HeaderLink, "description">[] = [
  {
    name: "Produtos",
    href: PRODUCTS_PATH,
    icon: FaStore,
  },
  {
    name: "Recursos",
    href: FEATURES_PATH,
    icon: LuSparkles,
  },
  {
    name: "Preços",
    href: PRICING_PATH,
    icon: FaCreditCard,
  },
];

const productLinks: HeaderLink[] = [
  {
    name: "Bot para WhatsApp",
    description: "Automatize seu negócio no WhatsApp",
    href: PRODUCTS_PATH_WHATSAPP_BOT,
    icon: FaWhatsapp,
  },
];

const actionLinks: Omit<HeaderLink, "description">[] = [
  { name: "Email", href: "#", icon: FaEnvelope },
  { name: "WhatsApp", href: "#", icon: FaWhatsapp },
];

const authLinks: Omit<HeaderLink, "description" | "icon">[] = [
  {
    name: "Logar",
    href: LOGIN_PATH,
  },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-md">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <Logo />
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Menu</span>
              <Bars3Icon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>

          <PopoverGroup className="hidden lg:flex lg:gap-x-12">
            <Popover className="relative">
              <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
                {headerLinks[0].name}
                {createElement(headerLinks[0].icon, {
                  "aria-hidden": "true",
                  className: "h-5 w-5 flex-none text-gray-400",
                })}
              </PopoverButton>

              <PopoverPanel
                transition
                className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
              >
                <div className="p-4">
                  {productLinks.map((item) => (
                    <div
                      key={item.name}
                      className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50"
                    >
                      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <item.icon
                          aria-hidden="true"
                          className="h-6 w-6 text-gray-400 group-hover:text-blue-600"
                        />
                      </div>
                      <div className="flex-auto">
                        <a
                          href={item.href}
                          className="block font-semibold text-gray-900"
                        >
                          {item.name}
                          <span className="absolute inset-0" />
                        </a>
                        <p className="mt-1 text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50">
                  {actionLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-100"
                    >
                      <item.icon
                        aria-hidden="true"
                        className="h-5 w-5 flex-none text-gray-400"
                      />
                      {item.name}
                    </a>
                  ))}
                </div>
              </PopoverPanel>
            </Popover>

            {headerLinks.slice(1).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex items-center text-sm font-semibold leading-6 text-gray-900"
              >
                {item.name}
                <item.icon
                  aria-hidden="true"
                  className="ml-2 h-5 w-5 flex-none text-gray-400"
                />
              </NavLink>
            ))}
          </PopoverGroup>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Link
              to={authLinks[0].href}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              {authLinks[0].name} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>

        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-10" />
          <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Menu</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  <Disclosure as="div" className="-mx-3">
                    <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                      {headerLinks[0].name}
                      {createElement(headerLinks[0].icon, {
                        "aria-hidden": "true",
                        className:
                          "h-4 w-4 text-gray-400 flex-none group-data-[open]:rotate-180",
                      })}
                    </DisclosureButton>
                    <DisclosurePanel className="mt-2 space-y-2">
                      {[...productLinks, ...actionLinks].map((item) => (
                        <DisclosureButton
                          key={item.name}
                          as="a"
                          href={item.href}
                          className="flex items-center justify-between rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        >
                          {item.name}
                          {
                            <item.icon
                              aria-hidden="true"
                              className="h-4 w-4 text-gray-400 group-hover:text-gray-800"
                            ></item.icon>
                          }
                        </DisclosureButton>
                      ))}
                    </DisclosurePanel>
                  </Disclosure>
                  {headerLinks.slice(1).map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className="-mx-3 flex items-center justify-between rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                      {
                        <item.icon
                          aria-hidden="true"
                          className="h-4 w-4 text-gray-400 group-hover:text-gray-800"
                        ></item.icon>
                      }
                    </NavLink>
                  ))}
                </div>
                <div className="py-6">
                  <Link
                    to={authLinks[0].href}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {authLinks[0].name} <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </>
  );
}
