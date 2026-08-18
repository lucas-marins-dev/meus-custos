import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await login(email, senha);
      navigate('/', { replace: true });
    } catch (error: any) {
      setErro(error.response?.data?.message || 'Falha ao autenticar. Verifique o e-mail e a senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="auth-shell login-page" data-theme={theme}>
      <button
        type="button"
        className="auth-shell__theme theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      >
        {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>

      <div className="login-page__glow login-page__glow--left" aria-hidden="true" />
      <div className="login-page__glow login-page__glow--right" aria-hidden="true" />

      <section className="login-card panel" aria-labelledby="login-title">
        <div className="login-card__brand">
          <img src="/logo-meus-custos.svg" alt="" />
          <span className="login-card__wordmark" aria-label="Meus Custos">
            <span>meus</span>
            <span>custos</span>
          </span>
        </div>

        <header className="login-card__header">
          <span>Bem-vindo de volta</span>
          <h1 id="login-title">Acesse sua conta</h1>
          <p>Entre para acompanhar suas finanças com clareza.</p>
        </header>

        {erro ? (
          <div className="form-alert form-alert--error" role="alert" id="login-error">
            <AlertCircle aria-hidden="true" />
            <span>{erro}</span>
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit} aria-describedby={erro ? 'login-error' : undefined}>
          <label className="form-field">
            <span className="form-field__label">E-mail</span>
            <span className="form-field__control">
              <Mail aria-hidden="true" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu.email@exemplo.com"
              />
            </span>
          </label>

          <label className="form-field">
            <span className="form-field__label">Senha</span>
            <span className="form-field__control">
              <Lock aria-hidden="true" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="••••••••"
              />
            </span>
          </label>

          <button type="submit" disabled={carregando} className="primary-button login-form__submit">
            {carregando ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
};
