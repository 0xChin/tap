import { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { PaperAirplaneIcon, InboxInIcon } from "@heroicons/react/outline";

interface NavbarProps {
  isSending: boolean;
  setIsSending: (isSending: boolean) => void;
}

// Add the props to the function signature
export default function Navbar({ isSending, setIsSending }: NavbarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-white shadow-md">
      <Popover as="nav" className="flex justify-around p-2">
        {({ open }) => (
          <>
            {/* Change from 'a' to 'button' and handle onClick */}
            <Popover.Button
              as="button"
              onClick={() => setIsSending(true)}
              className="flex flex-col items-center justify-center text-xs"
            >
              <PaperAirplaneIcon
                className={`h-6 w-6 ${
                  isSending ? "text-yellow-500" : "text-gray-500"
                }`}
                aria-hidden="true"
              />
              <span className={isSending ? "text-yellow-500" : "text-gray-500"}>
                Send
              </span>
            </Popover.Button>

            {/* Change from 'a' to 'button' and handle onClick */}
            <Popover.Button
              as="button"
              onClick={() => setIsSending(false)}
              className="flex flex-col items-center justify-center text-xs"
            >
              <InboxInIcon
                className={`h-6 w-6 ${
                  !isSending ? "text-green-500" : "text-gray-500"
                }`}
                aria-hidden="true"
              />
              <span className={!isSending ? "text-green-500" : "text-gray-500"}>
                Receive
              </span>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-10">
                {/* Your panel content, this could be a dropdown menu */}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
