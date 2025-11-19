import Link from 'next/link';

import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">CRM LOGIN</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Revenue Desk</h1>
          <p className="text-sm text-slate-500">シードユーザーの資格情報でログインしてください。</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-500">
          シード情報: <code className="font-mono text-blue-600">admin@crm.local / ChangeMe123!</code>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">
          API ドキュメントは <Link href="https://localhost:4000/api" className="text-blue-600">/api</Link> で確認できます。
        </p>
      </div>
    </div>
  );
}
