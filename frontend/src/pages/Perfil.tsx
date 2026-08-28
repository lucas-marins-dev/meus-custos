import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, ShieldCheck, UserRound, Users } from 'lucide-react';
import { PageHeader } from '../components/ui/Ui';
import { useAuth } from '../context/AuthContext';

export const Perfil: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const initial = user?.nome?.trim().charAt(0).toUpperCase() || 'U';
  const roleLabel = isAdmin ? 'Administrador' : 'Usuário';

  return (
    <div className="page-stack profile-page">
      <PageHeader
        title="Meu perfil"
        subtitle="Consulte as informações vinculadas à sua conta"
        action={
          isAdmin ? (
            <Link className="secondary-button profile-admin-link" to="/usuarios">
              <Users aria-hidden="true" />
              Gerenciar usuários
            </Link>
          ) : undefined
        }
      />

      <section className="panel profile-hero" aria-labelledby="profile-name">
        <div className="large-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="profile-hero__copy">
          <span>{isAdmin ? 'Conta administrativa' : 'Conta pessoal'}</span>
          <h2 id="profile-name">{user?.nome}</h2>
          <p>{user?.email}</p>
        </div>
      </section>

      <section className="panel profile-details" aria-labelledby="profile-details-title">
        <div className="section-heading">
          <div>
            <h2 id="profile-details-title">Informações da conta</h2>
            <p>Dados fornecidos pela sua sessão autenticada</p>
          </div>
          <span className="profile-readonly-badge">
            <CheckCircle2 aria-hidden="true" />
            Sessão autenticada
          </span>
        </div>

        <div className="form-grid profile-details__grid">
          <label className="form-field">
            <span className="form-field__label">
              <UserRound aria-hidden="true" />
              Nome completo
            </span>
            <input type="text" value={user?.nome || ''} readOnly aria-readonly="true" />
          </label>

          <label className="form-field">
            <span className="form-field__label">
              <Mail aria-hidden="true" />
              E-mail
            </span>
            <input type="email" value={user?.email || ''} readOnly aria-readonly="true" />
          </label>

          <label className="form-field">
            <span className="form-field__label">
              <ShieldCheck aria-hidden="true" />
              Nível de acesso
            </span>
            <input type="text" value={roleLabel} readOnly aria-readonly="true" />
          </label>
        </div>

        <p className="profile-details__note">
          Seus dados são exibidos diretamente pela API. Alterações de contas são realizadas por um administrador.
        </p>
      </section>
    </div>
  );
};
