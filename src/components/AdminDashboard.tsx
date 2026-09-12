"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  Mic,
  Calendar,
  Sparkles,
  BookOpen
} from "lucide-react";
import type { UserProfile } from "@/lib/auth";

export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao carregar usuários.");
      }
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleStatusChange(userId: string, action: "approve" | "reject") {
    setProcessingId(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar status.");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: action === "approve" ? "approved" : "rejected" } : u
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao alterar status.");
    } finally {
      setProcessingId(null);
    }
  }

  const counts = useMemo(() => {
    return {
      total: users.length,
      pending: users.filter((u) => u.status === "pending").length,
      approved: users.filter((u) => u.status === "approved").length,
      rejected: users.filter((u) => u.status === "rejected").length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.nickname && user.nickname.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, filterStatus]);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-title-row">
          <div className="admin-badge">
            <ShieldCheck size={18} />
            PAINEL DO ADMINISTRADOR
          </div>
          <Link className="admin-practice-link" href="/practice">
            <Mic size={16} />
            Ir para o Treino (Mr.Crazy)
          </Link>
        </div>
        <h1>Gestão e Aprovação de Alunos</h1>
        <p>Apenas você tem acesso a esta página. Aprove novos cadastros para liberar o uso da plataforma.</p>
      </header>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="kpi-label">Total Cadastrados</span>
          <strong className="kpi-value">{counts.total}</strong>
        </div>
        <div className={`admin-kpi-card ${counts.pending > 0 ? "kpi-alert" : ""}`}>
          <span className="kpi-label">Pendentes de Aprovação</span>
          <strong className="kpi-value">{counts.pending}</strong>
        </div>
        <div className="admin-kpi-card kpi-success">
          <span className="kpi-label">Alunos Aprovados</span>
          <strong className="kpi-value">{counts.approved}</strong>
        </div>
        <div className="admin-kpi-card">
          <span className="kpi-label">Rejeitados/Bloqueados</span>
          <strong className="kpi-value">{counts.rejected}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} />
          <input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail ou apelido..."
            type="text"
            value={search}
          />
        </div>

        <div className="admin-filter-pills">
          <button
            className={`filter-pill ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
            type="button"
          >
            Todos ({counts.total})
          </button>
          <button
            className={`filter-pill pill-warning ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
            type="button"
          >
            Pendentes ({counts.pending})
          </button>
          <button
            className={`filter-pill pill-success ${filterStatus === "approved" ? "active" : ""}`}
            onClick={() => setFilterStatus("approved")}
            type="button"
          >
            Aprovados ({counts.approved})
          </button>
          <button
            className={`filter-pill pill-danger ${filterStatus === "rejected" ? "active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
            type="button"
          >
            Rejeitados ({counts.rejected})
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      {/* Users List */}
      {isLoading ? (
        <div className="admin-loading">Carregando usuários...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty">Nenhum usuário encontrado neste filtro.</div>
      ) : (
        <div className="admin-users-list">
          {filteredUsers.map((u) => {
            const isSelf = u.role === "admin";
            const isProcessing = processingId === u.id;

            return (
              <article className={`admin-user-card status-${u.status}`} key={u.id}>
                <div className="user-card-header">
                  <div>
                    <div className="user-email-row">
                      <strong className="user-email">{u.email}</strong>
                      {isSelf ? <span className="badge-admin">Você (Admin)</span> : null}
                    </div>
                    <p className="user-nickname">
                      Apelido: <strong>{u.nickname || "Não informado"}</strong> • Sexo:{" "}
                      <strong>{u.gender || "masculino"}</strong>
                    </p>
                  </div>

                  <span className={`status-tag tag-${u.status}`}>
                    {u.status === "pending" && <Clock size={13} />}
                    {u.status === "approved" && <UserCheck size={13} />}
                    {u.status === "rejected" && <UserX size={13} />}
                    {u.status === "pending"
                      ? "Pendente"
                      : u.status === "approved"
                      ? "Aprovado"
                      : "Rejeitado"}
                  </span>
                </div>

                <div className="user-card-body">
                  <div className="user-meta-item">
                    <BookOpen size={14} />
                    <span>
                      Nível: <strong>{u.learning_level}</strong> ({u.self_assessed_level || "Autoavaliação padrão"})
                    </span>
                  </div>
                  <div className="user-meta-item">
                    <Sparkles size={14} />
                    <span>
                      Estilo: <strong>{u.learning_style || "Conversação prática"}</strong>
                    </span>
                  </div>
                  <div className="user-meta-item">
                    <Clock size={14} />
                    <span>
                      Tempo de uso: <strong>{Math.round((u.practice_time_seconds || 0) / 60)} min</strong> • XP:{" "}
                      <strong>{u.xp || 0}</strong>
                    </span>
                  </div>
                  <div className="user-meta-item">
                    <Calendar size={14} />
                    <span>
                      Cadastrado em:{" "}
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "Recente"}
                    </span>
                  </div>
                </div>

                {u.main_difficulties && u.main_difficulties.length > 0 ? (
                  <div className="user-difficulties-tags">
                    <span className="diff-title">Dificuldades declaradas:</span>
                    {u.main_difficulties.map((diff) => (
                      <span className="diff-pill" key={diff}>
                        {diff}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Actions */}
                {!isSelf ? (
                  <div className="user-card-actions">
                    {u.status !== "approved" ? (
                      <button
                        className="btn-action btn-approve"
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(u.id, "approve")}
                        type="button"
                      >
                        <UserCheck size={16} />
                        {isProcessing ? "Aprovando..." : "Aprovar Acesso"}
                      </button>
                    ) : null}

                    {u.status !== "rejected" ? (
                      <button
                        className="btn-action btn-reject"
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(u.id, "reject")}
                        type="button"
                      >
                        <UserX size={16} />
                        {isProcessing ? "Processando..." : "Rejeitar / Bloquear"}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="user-card-actions admin-protected-note">
                    <span>Conta master de administrador (ativo permanente)</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

