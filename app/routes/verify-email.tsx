import { LoaderFunction, type MetaFunction, redirect } from "@remix-run/node";
import { getUserSession } from "~/services/auth.server";
import { HTTPStatus } from "~/enums/http-status";
import { DASHBOARD_PATH, LOGIN_PATH, VERIFY_EMAIL_PATH } from "~/routes";
import {
  createUserEmailCodeById,
  getUserEmailAuthById,
  UpdateUserEmailAuthCodeById,
} from "~/models/user.server";
import { defaultMeta } from "~/utils/default-meta";

export const meta: MetaFunction = () =>
  defaultMeta("Verificar Email", VERIFY_EMAIL_PATH);

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserSession(request);
  if (!user) {
    return redirect(LOGIN_PATH, HTTPStatus.UNAUTHORIZED);
  }

  const emailCode = await getUserEmailAuthById(user.id);
  if (!emailCode) {
    await createUserEmailCodeById(user.id);
  }

  if (emailCode && emailCode.verified) {
    return redirect(DASHBOARD_PATH, HTTPStatus.OK);
  }

  await UpdateUserEmailAuthCodeById(user.id);

  return null;
};

export default function VerifyEmail() {
  return (
    <div>
      <h1>Verify Email</h1>
    </div>
  );
}
