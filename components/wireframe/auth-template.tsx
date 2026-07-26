"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();
const demoCredentials = {
  email: "owner.demo@example.com",
  password: "demo-password",
};

export function AuthTemplate({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(register ? "" : demoCredentials.email);
  const [password, setPassword] = useState(register ? "" : demoCredentials.password);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function authenticate(nextEmail = email, nextPassword = password) {
    setPending(true);
    setError("");
    try {
      const tokens = register
        ? await authApi.registerApiV1AuthRegisterPost({
            company_name: company,
            full_name: name,
            email: nextEmail,
            password: nextPassword,
          })
        : await authApi.loginApiV1AuthLoginPost({
            email: nextEmail,
            password: nextPassword,
          });
      setAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      router.push(register ? "/onboarding" : "/inbox");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, register ? "Не удалось создать аккаунт." : "Не удалось войти."));
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await authenticate();
  }

  async function handleDemoLogin() {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    await authenticate(demoCredentials.email, demoCredentials.password);
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="wire-panel w-full max-w-md p-7 shadow-[0_18px_55px_rgba(17,27,33,.1)]">
        <Link href="/" className="mb-10 block text-lg font-bold text-[#16845f]">Автопилот</Link>
        <h1 className="text-2xl font-bold">{register ? "Создать аккаунт" : "Войти"}</h1>
        <p className="mt-2 text-sm wire-muted">
          {register ? "Создайте рабочее пространство компании." : "Войдите, чтобы загрузить диалоги из базы данных."}
        </p>

        {!register ? (
          <button type="button" onClick={handleDemoLogin} disabled={pending} className="app-button mt-6 w-full">
            {pending ? <Loader2 className="animate-spin" size={17} /> : null}
            Войти в демо
          </button>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {register ? <Field label="Компания" value={company} onChange={setCompany} required /> : null}
          {register ? <Field label="Имя" value={name} onChange={setName} /> : null}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Пароль" type="password" value={password} onChange={setPassword} required />
          {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={pending} className="app-button-secondary w-full">
            {pending ? <Loader2 className="animate-spin" size={17} /> : null}
            {register ? "Создать аккаунт" : "Войти"}
          </button>
        </form>
        <p className="mt-6 text-sm wire-muted">
          {register ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <Link className="font-bold text-[#0b6b4b] underline" href={register ? "/login" : "/register"}>
            {register ? "Войти" : "Попробовать"}
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        aria-label={label}
        type={type}
        className="wire-field mt-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}
