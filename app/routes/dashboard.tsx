import {
  ActionFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  redirect,
  TypedResponse,
} from "@remix-run/node";
import React, { useEffect, useState } from "react";
import { useEventSource } from "remix-utils/sse/react";
import { useSocket } from "~/context";
import { BOT_SESSION_SSE_PATH, DASHBOARD_PATH, LOGIN_PATH } from "~/routes";
import { BOT_SESSION_SSE_EVENT } from "~/routes/sse.bot-session";
import { getUserSession, UserSession } from "~/services/auth.server";
import { checkMailAuthVerified } from "~/models/mail.server";
import { Form, json, useActionData, useLoaderData } from "@remix-run/react";
import {
  BotSessionFull,
  createBotCommandBySessionId,
  createBotSessionByUserId,
  deleteBotCommandById,
  getBotSessionByUserId,
  updateBotCommandByCommandId,
  updateBotSessionById,
} from "~/models/bot.server";
import sessionLoader from "~/utils/session-loader.server";
import TokenInput from "~/components/inputs/TokenInput";
import { QRCodeSVG } from "qrcode.react";
import { FaEdit, FaPlus, FaTrash, FaWhatsapp } from "react-icons/fa";
import BotCommandModalForm, {
  BotCommandModalFormProps,
} from "~/components/forms/BotCommandModalForm";
import z from "zod";
import { HTTPStatus } from "~/enums/http-status";
import { ResponseActionData } from "~/types/response-action-data";
import { logger } from "~/logger";
import {
  MAX_TAGS_INPUT_ARRAY_LENGTH,
  MAX_TAGS_INPUT_STRING_LENGTH,
} from "~/constants/validation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Header from "~/components/dashboard/Header";
import { defaultMeta } from "~/utils/default-meta";

type LoaderData = {
  user: UserSession;
  botSession: BotSessionFull;
};

export const meta = () => defaultMeta("Dashboard", DASHBOARD_PATH);

/**
 * Loader function to handle the initial data fetching for the dashboard page.
 * @param {LoaderFunctionArgs} args - The request object.
 * @param {Request} args.request - The request object.
 * @returns {Promise<TypedResponse<LoaderData>>} The environment variables.
 */
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<TypedResponse<LoaderData> | unknown> => {
  await sessionLoader(request, { failureRedirect: LOGIN_PATH });

  await checkMailAuthVerified(request);

  const user = await getUserSession(request);
  if (!user) {
    logger.warn("User not found, redirecting to login page");
    return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
  }

  let botSession = await getBotSessionByUserId(user!.id);
  if (!botSession || !botSession.state) {
    logger.info(
      `Bot session not found, creating a new one for user ${user!.id}`
    );
    botSession = await createBotSessionByUserId(user!.id);
  }

  logger.info(`Successfully loaded dashboard for user ${user!.id}`);
  return json({ user, botSession });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const formPayload = Object.fromEntries(formData);
  const formType = formPayload["type"] as DashboardFormType;

  if (formType === "session") {
    const sessionSchema = z.object({
      sessionId: z.string().min(1),
      enabled: z.boolean({ coerce: true }).default(false),
      enableAi: z.boolean({ coerce: true }).default(false),
      promptAi: z.string().default(""),
    });

    try {
      const parsedPayload = sessionSchema.parse(formPayload);

      const user = await getUserSession(request);
      if (!user) {
        return json(
          { message: "Not authorized" },
          { status: HTTPStatus.UNAUTHORIZED }
        );
      }

      await updateBotSessionById(
        parsedPayload.sessionId,
        {
          enabled: parsedPayload.enabled,
          enableAi: parsedPayload.enableAi,
          promptAi: parsedPayload.promptAi,
        },
        request
      );

      return json({ message: "Session updated" }, { status: HTTPStatus.OK });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(error);
        return json(
          { message: "Parameters validation error", error },
          { status: HTTPStatus.BAD_REQUEST }
        );
      }

      logger.error(error);
      return json(
        { message: "Internal server error", error },
        { status: HTTPStatus.INTERNAL_SERVER_ERROR }
      );
    }
  }

  if (formType === "command") {
    const commandSchema = z.object({
      mode: z.enum(["create", "update", "delete"]),
      id: z.string().nullish(),
      sessionId: z.string().nullish(),
      name: z.string().min(1).nullish(),
      inputs: z
        .string()
        .transform((input) => input.split(",").map(String))
        .pipe(
          z
            .string()
            .min(1)
            .max(MAX_TAGS_INPUT_STRING_LENGTH)
            .array()
            .max(MAX_TAGS_INPUT_ARRAY_LENGTH)
        )
        .nullish(),
      output: z.string().min(1).nullish(),
      enableAi: z.boolean({ coerce: true }).default(false),
      promptAi: z.string().default(""),
      priority: z.number({ coerce: true }).int().default(0),
    });

    try {
      const parsedPayload = commandSchema.parse(formPayload);

      const user = await getUserSession(request);
      if (!user) {
        return json(
          { message: "Not authorized" },
          { status: HTTPStatus.UNAUTHORIZED }
        );
      }

      if (parsedPayload.name && parsedPayload.inputs && parsedPayload.output) {
        if (parsedPayload.mode === "create" && parsedPayload.sessionId) {
          const botSession = await createBotCommandBySessionId(
            parsedPayload.sessionId,
            parsedPayload.name,
            parsedPayload.inputs,
            parsedPayload.output,
            parsedPayload.enableAi,
            parsedPayload.promptAi,
            parsedPayload.priority,
            request
          );

          if (!botSession) {
            return json(
              { message: "Failed to create command" },
              { status: HTTPStatus.INTERNAL_SERVER_ERROR }
            );
          }

          return json(
            { message: "Command created" },
            { status: HTTPStatus.OK }
          );
        }

        if (parsedPayload.mode === "update" && parsedPayload.id) {
          try {
            await updateBotCommandByCommandId(
              parsedPayload.id,
              parsedPayload.name,
              parsedPayload.inputs,
              parsedPayload.output,
              parsedPayload.enableAi,
              parsedPayload.promptAi,
              parsedPayload.priority,
              request
            );

            return json(
              { message: "Command updated" },
              { status: HTTPStatus.OK }
            );
          } catch (error) {
            logger.error(error);

            return json(
              { message: "Failed to update command", error },
              { status: HTTPStatus.INTERNAL_SERVER_ERROR }
            );
          }
        }
      }

      if (parsedPayload.mode === "delete" && parsedPayload.id) {
        try {
          await deleteBotCommandById(parsedPayload.id, request);

          return json(
            { message: "Command deleted" },
            { status: HTTPStatus.OK }
          );
        } catch (error) {
          logger.error(error);

          return json(
            { message: "Failed to delete command", error },
            { status: HTTPStatus.INTERNAL_SERVER_ERROR }
          );
        }
      }

      return json(
        { message: "Invalid parameters" },
        { status: HTTPStatus.BAD_REQUEST }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(error);
        return json(
          { message: "Parameters validation error", error },
          { status: HTTPStatus.BAD_REQUEST }
        );
      }

      logger.error(error);
      return json(
        { message: "Internal server error", error },
        { status: HTTPStatus.INTERNAL_SERVER_ERROR }
      );
    }
  }
};

export type DashboardFormType = "session" | "command";

/**
 * Component to render the dashboard page.
 * @returns {React.ReactElement} The dashboard page component.
 */
export default function Dashboard(): React.ReactElement {
  const socket = useSocket();
  const { user, botSession } = useLoaderData<LoaderData>();
  const actionData = useActionData<ResponseActionData>();

  const botSessionSourceSSE = useEventSource(BOT_SESSION_SSE_PATH, {
    event: BOT_SESSION_SSE_EVENT,
  });

  const [botSessionSSE, setBotSessionSSE] = useState<
    BotSessionFull | undefined
  >();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("event", (data) => {
      logger.info(`Received event from Server (${socket.id}):`, data);
    });
  }, [socket]);

  useEffect(() => {
    setOpenForm(false);
    setOpenAlert(actionData !== undefined);
  }, [actionData]);

  useEffect(() => {
    setBotSessionSSE(
      botSessionSourceSSE ? JSON.parse(botSessionSourceSSE) : null
    );
  }, [botSessionSourceSSE]);

  const [openForm, setOpenForm] = useState(false);
  const [propsForm, setPropsForm] =
    useState<Omit<BotCommandModalFormProps, "open" | "setOpen">>();

  const [openAlert, setOpenAlert] = useState(false);

  function qrCode() {
    return (
      <>
        <div className="grid-cols-1 grid gap-2 items-center justify-center max-w-64 bg-emerald-600 p-3 rounded-md shadow-lg">
          <div className="flex items-center justify-center space-x-5">
            <div className="p-2 bg-white rounded-md shadow-md">
              <QRCodeSVG
                value={
                  botSessionSSE
                    ? botSessionSSE.whatsappQr ?? ""
                    : botSession.whatsappQr ?? ""
                }
                title="WhatsApp QRCode"
              ></QRCodeSVG>
            </div>
            <FaWhatsapp className="text-white" size={64} />
          </div>

          <TokenInput
            buttonClassName="bg-gray-700 hover:bg-gray-800"
            value={
              botSessionSSE
                ? botSessionSSE.whatsappQr ?? ""
                : botSession.whatsappQr ?? ""
            }
          />
        </div>
      </>
    );
  }

  function commandsTableBody(
    session: BotSessionFull | undefined | typeof botSession
  ): React.ReactElement {
    if (session && session.commands && session.commands.length > 0) {
      return (
        <tbody>
          {session.commands
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
            .map((command, index) => {
              return (
                <tr
                  key={command.id}
                  className={`${
                    index % 2 == 0 ? "bg-gray-600" : "bg-gray-700"
                  }`}
                >
                  <td
                    className={`p-4 ${
                      index === session.commands.length - 1
                        ? "rounded-bl-md"
                        : ""
                    }`}
                  >
                    {command.name}
                  </td>
                  <td className="pb-4 pt-4 space-y-1">
                    {command.inputs.map((input) => {
                      return (
                        <div
                          key={input}
                          className="bg-gray-800 p-1 rounded-md truncate text-sm"
                        >
                          {input}
                        </div>
                      );
                    })}
                  </td>
                  <td className="pb-4 pt-4 pl-1 pr-1 grow">
                    <textarea
                      className="bg-gray-800 resize-none rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-white-500 sm:text-sm p-3 min-h-full min-w-full overflow-hidden"
                      value={command.output ?? ""}
                      readOnly={true}
                    />
                  </td>
                  <td className="pb-4 pt-4">
                    <input
                      className="appearance-none w-4 h-4 border-black-500 rounded-sm bg-red-600 mt-1 checked:bg-green-600"
                      type="checkbox"
                      defaultChecked={command.enableAi}
                      disabled
                    />
                  </td>
                  <td className="pb-4 pt-4 pl-1 pr-1">
                    <div className="grow h-full">
                      <textarea
                        className="bg-gray-800 resize-none rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-white-500 sm:text-sm p-3 min-h-full min-w-full overflow-hidden"
                        value={command.promptAi ?? ""}
                        readOnly={true}
                      />
                    </div>
                  </td>
                  <td className="pb-4 pt-4">{command.priority}</td>
                  <td
                    className={`pb-2 pt-2 pr-2 ${
                      index === session.commands.length - 1
                        ? "rounded-br-md"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-md flex items-center justify-center text-sm"
                        onClick={() => {
                          setPropsForm({
                            mode: "update",
                            id: command.id,
                            sessionId: command.sessionId,
                            name: command.name,
                            inputs: command.inputs,
                            output: command.output,
                            enableAi: command.enableAi,
                            promptAi: command.promptAi ?? "",
                            priority: command.priority,
                            subCommandIds: command.children.map(
                              (child) => child.id
                            ),
                          });
                          setOpenForm(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded-md flex items-center justify-center text-sm"
                        onClick={() => {
                          setPropsForm({
                            mode: "delete",
                            id: command.id,
                          });
                          setOpenForm(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      );
    }

    return (
      <tbody className="flex items-center justify-center p-6">
        <tr>
          <td>Não há comandos criados</td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <Header id={user?.id} email={user?.email} username={user?.username} />

      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <div className="md:flex justify-between md:space-x-4 space-y-6 md:space-y-0">
            <div className="w-full">
              <div className="bg-gray-200 p-4 rounded-md shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-black">Status</h2>

                <div className="flex">
                  <div
                    className={`${
                      botSession &&
                      botSession.state &&
                      botSession.state.status === "ONLINE"
                        ? "bg-green-400"
                        : "bg-red-400"
                    } text-white px-4 py-2 rounded-md shadow-md max-w-24 text-center items-center`}
                  >
                    {botSession && botSession.state
                      ? botSession.state.status
                      : "OFFLINE"}
                  </div>
                </div>

                <Form method="POST">
                  <div className="space-y-4">
                    <div className="sm:grid sm:grid-cols-1 md:flex md:space-x-8 space-y-2 justify-between items-center">
                      <div className="space-y-2 min-w-fit">
                        <div className="flex items-center space-x-2 grow">
                          <input
                            id="enabled"
                            name="enabled"
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            defaultChecked={
                              botSessionSSE
                                ? botSessionSSE.enabled ?? ""
                                : botSession.enabled ?? ""
                            }
                          />
                          <label htmlFor="enabled" className="text-gray-700">
                            Ativar Bot
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            id="enableAi"
                            name="enableAi"
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            defaultChecked={
                              botSessionSSE
                                ? botSessionSSE.enableAi ?? ""
                                : botSession.enableAi ?? ""
                            }
                          />
                          <label htmlFor="enableAi" className="text-gray-700">
                            Ativar AI
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-300 pl-4 pr-4 pt-2 pb-2 rounded-md shadow-md w-full min-h-fit grow">
                        <label
                          htmlFor="promptAi"
                          className="block text-gray-700 font-bold"
                        >
                          Prompt Geral
                        </label>
                        <textarea
                          id="promptAi"
                          name="promptAi"
                          className="bg-gray-700 resize-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 text-white h-full w-full overflow-hidden"
                          defaultValue={
                            botSessionSSE
                              ? botSessionSSE.promptAi ?? ""
                              : botSession.promptAi ?? ""
                          }
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="max-w-24 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md shadow-md h-12"
                    >
                      Atualizar
                    </button>

                    <input name="type" defaultValue="session" hidden />
                    <input
                      name="sessionId"
                      defaultValue={
                        botSessionSSE
                          ? botSessionSSE.id ?? ""
                          : botSession.id ?? ""
                      }
                      hidden
                    />
                  </div>
                </Form>
              </div>
            </div>

            <div className="bg-gray-200 p-4 rounded-md shadow-md space-y-2 min-w-fit h-full">
              <h2 className="text-xl font-semibold text-black">QRCode</h2>
              {qrCode()}
            </div>
          </div>

          <div className="p-4 bg-gray-200 rounded-md shadow-md">
            <div className="flex items-end justify-between pt-2 pb-4">
              <h2 className="text-xl font-semibold black">Comandos</h2>

              <button
                className="rounded-md bg-green-500 hover:bg-green-600 px-4 py-2 text-white text-sm flex items-center justify-center shadow-md"
                onClick={() => {
                  setPropsForm({ mode: "create", sessionId: botSession.id });
                  setOpenForm(true);
                }}
              >
                Criar comando <FaPlus className="ml-2" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm rtl:text-right text-white rounded-md bg-gray-600 text-center overflow-x-auto">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="p-4 rounded-tl-md">Nome</th>
                    <th className="p-2">Comandos</th>
                    <th className="p-2">Resposta</th>
                    <th className="p-2">IA</th>
                    <th className="p-2">Mini Prompt</th>
                    <th className="p-2">PR</th>
                    <th className="pb-2 pt-2 pr-2 rounded-tr-md"></th>
                  </tr>
                </thead>
                {commandsTableBody(botSessionSSE ?? botSession)}
              </table>
            </div>
          </div>
        </div>
      </main>

      <BotCommandModalForm
        open={openForm}
        setOpen={() => setOpenForm(!openForm)}
        mode={propsForm?.mode ?? "create"}
        id={propsForm?.id}
        sessionId={propsForm?.sessionId}
        name={propsForm?.name}
        inputs={propsForm?.inputs}
        output={propsForm?.output}
        enableAi={propsForm?.enableAi}
        promptAi={propsForm?.promptAi}
        priority={propsForm?.priority}
        subCommandIds={propsForm?.subCommandIds}
      />

      <Dialog
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Status
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionData?.message ??
                          "Operação realizada com sucesso"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  data-autofocus="true"
                  onClick={() => setOpenAlert(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Ok
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
