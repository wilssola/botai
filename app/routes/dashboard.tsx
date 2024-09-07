import {
  ActionFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import React, { useEffect, useState } from "react";
import { useEventSource } from "remix-utils/sse/react";
import { useSocket } from "~/context";
import { BOT_SESSION_SSE_PATH, LOGIN_PATH } from "~/routes";
import { envLoader, EnvLoaderData } from "~/utils/env-loader.server";
import { BOT_SESSION_SSE_EVENT } from "~/routes/sse.bot-session";
import { getUserSession, UserSession } from "~/services/auth.server";
import { checkMailAuthVerified } from "~/models/mail.server";
import { json, useActionData, useLoaderData } from "@remix-run/react";
import Header from "~/components/dashboard/Header";
import {
  BotSessionFull,
  createBotCommandBySessionId,
  createBotSessionByUserId,
  getBotSessionByUserId,
} from "~/models/bot.server";
import sessionLoader from "~/utils/session-loader.server";
import TokenInput from "~/components/inputs/TokenInput";
import { QRCodeSVG } from "qrcode.react";
import { FaPlus, FaWhatsapp } from "react-icons/fa";
import BotCommandForm, {
  BotCommandProps,
} from "~/components/forms/BotCommandForm";
import z from "zod";
import { HTTPStatus } from "~/enums/http-status";
import { ResponseActionData } from "~/types/response-action-data";
import { logger } from "~/logger";

type LoaderData = {
  ENV: TypedResponse<EnvLoaderData>;
  user: UserSession;
  botSession: BotSessionFull;
};

/**
 * Loader function to handle the initial data fetching for the dashboard page.
 * @param {LoaderFunctionArgs} args - The request object.
 * @param {Request} args.request - The request object.
 * @returns {Promise<TypedResponse<LoaderData>>} The environment variables.
 */
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<TypedResponse<LoaderData>> => {
  await sessionLoader(request, { failureRedirect: LOGIN_PATH });

  await checkMailAuthVerified(request);

  const ENV = await envLoader();
  const user = await getUserSession(request);

  let botSession = await getBotSessionByUserId(user!.id);
  if (!botSession || !botSession.state) {
    botSession = await createBotSessionByUserId(user!.id);
  }

  return json({ ENV, user, botSession } as LoaderData);
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const formPayload = Object.fromEntries(formData);

  const commandSchema = z.object({
    mode: z.string().min(1),
    name: z.string().min(1),
    inputs: z.string().min(1),
    output: z.string().min(1),
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

    const botSession = await getBotSessionByUserId(user!.id);
    if (!botSession) {
      return json(
        { message: "Bot session not found" },
        { status: HTTPStatus.NOT_FOUND }
      );
    }

    if (parsedPayload.mode === "create") {
      const inputs = parsedPayload.inputs
        .split(",")
        .map((input) => input.trim());

      const newBotSession = await createBotCommandBySessionId(
        botSession.id,
        parsedPayload.name,
        inputs,
        parsedPayload.output,
        parsedPayload.enableAi,
        parsedPayload.promptAi,
        parsedPayload.priority,
        request
      );

      if (!newBotSession) {
        return json(
          { message: "Failed to create command" },
          { status: HTTPStatus.INTERNAL_SERVER_ERROR }
        );
      }

      return json(
        { message: "Command created successfully" },
        { status: HTTPStatus.CREATED }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Parameters validation error");
      logger.error(error);
      return json(
        { message: "Parameters validation error", error },
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    logger.error("Internal server error");
    logger.error(error);
    return json(
      { message: "Internal server error", error },
      { status: HTTPStatus.INTERNAL_SERVER_ERROR }
    );
  }
};

/**
 * Component to render the dashboard page.
 * @returns {React.ReactElement} The dashboard page component.
 */
export default function Dashboard(): React.ReactElement {
  const socket = useSocket();
  const { ENV, user, botSession } = useLoaderData<LoaderData>();
  const actionData = useActionData<ResponseActionData>();
  console.log(actionData);

  const botSessionSSE = JSON.parse(
    useEventSource(BOT_SESSION_SSE_PATH, {
      event: BOT_SESSION_SSE_EVENT,
    }) ?? "{}"
  );

  const [whatsappReceive, setWhatsappReceive] = useState<string[]>([]);
  const [whatsappSend, setWhatsappSend] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("event", (data) => {
      console.log(`Received event from Server (${socket.id}):`, data);
    });
  }, [socket]);

  useEffect(() => {
    setWhatsappReceive((prev) => [...prev, ""]);
    setWhatsappSend((prev) => [...prev, ""]);
  }, [botSession.id]);

  const [openForm, setOpenForm] = useState(false);
  const [propsForm, setPropsForm] =
    useState<Omit<BotCommandProps, "open" | "setOpen">>();

  function qrCode() {
    return (
      <>
        <div className="grid-cols-1 grid gap-2 items-center justify-center max-w-64 bg-emerald-600 p-3 rounded-md shadow-lg">
          <div className="flex items-center justify-center space-x-5">
            <div className="p-2 bg-white rounded-md shadow-md">
              <QRCodeSVG
                value={botSessionSSE.whatsappQr ?? botSession.whatsappQr ?? ""}
                title="WhatsApp QRCode"
              ></QRCodeSVG>
            </div>
            <FaWhatsapp className="text-white" size={64} />
          </div>

          <TokenInput
            buttonClassName="bg-gray-700"
            value={botSessionSSE.whatsappQr ?? botSession.whatsappQr ?? ""}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user as UserSession} />
      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-end justify-end">
            <button
              className="rounded-md bg-green-500 px-4 py-2 text-white text-sm flex items-center justify-center"
              onClick={() => {
                setPropsForm(undefined);
                setOpenForm(true);
              }}
            >
              Criar comando <FaPlus className="ml-2" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm rtl:text-right text-white rounded-md bg-gray-700 p-6 text-center overflow-x-auto">
              <thead className="bg-gray-900">
                <tr>
                  <th className="p-4 rounded-md">Nome</th>
                  <th className="p-4">Comandos</th>
                  <th className="p-4">Resposta</th>
                  <th className="p-4">IA</th>
                  <th className="p-4">IA Prompt</th>
                  <th className="p-4">Prioridade</th>
                  <th className="p-4">Subcomandos</th>
                  <th className="p-4"></th>
                  <th className="p-4 rounded-md"></th>
                </tr>
              </thead>
              {botSession.commands && botSession.commands.length > 0 ? (
                <tbody>
                  {botSession.commands.map((command) => {
                    return (
                      <tr key={command.id}>
                        <td className="p-4">{command.name}</td>
                        <td className="p-4">
                          {command.inputs.map((input) => JSON.stringify(input))}
                        </td>
                        <td className="p-4">{command.output}</td>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            value={String(command.enableAi)}
                            readOnly
                          />
                        </td>
                        <td className="p-4">{command.promptAi}</td>
                        <td className="p-4">{command.priority}</td>
                        <td className="p-4">
                          {command.children.map((child) =>
                            JSON.stringify(child)
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setPropsForm({
                                mode: "edit",
                                id: command.id,
                                sessionId: command.sessionId,
                                name: command.name,
                                inputs: command.inputs,
                                output: command.output,
                                enableAi: command.enableAi,
                                priority: command.priority,
                                subCommandIds: command.children.map(
                                  (child) => child.id
                                ),
                              });
                              setOpenForm(true);
                            }}
                          >
                            Editar
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setPropsForm({
                                mode: "delete",
                                id: command.id,
                              });
                              setOpenForm(true);
                            }}
                          >
                            Deletar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : (
                <tbody className="flex items-center justify-center p-6">
                  <tr>
                    <td>Não há comandos criados</td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>

          {qrCode()}
        </div>
      </main>
      <BotCommandForm
        open={openForm}
        setOpen={() => setOpenForm(!openForm)}
        mode={propsForm?.mode ?? "create"}
        id={propsForm?.id}
        sessionId={propsForm?.sessionId}
        name={propsForm?.name}
        inputs={propsForm?.inputs}
        output={propsForm?.output}
        enableAi={propsForm?.enableAi}
        priority={propsForm?.priority}
        subCommandIds={propsForm?.subCommandIds}
      />
    </>
  );
}
