import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRASH BLINDADO - ErrorBoundary interceptó error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleSafeReset = () => {
    // Intenta reiniciar limpiamente el estado sin borrar las bases de datos de consultorios
    try {
      if (typeof window !== 'undefined') {
        window.location.hash = '';
        window.location.reload();
      }
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 font-sans select-none antialiased">
          <div className="max-w-lg w-full bg-neutral-900 border-2 border-rose-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-950/40">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Protección contra Fallos Activa
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                El sistema aisló una excepción de interfaz para evitar la pérdida de información de sus pacientes y expedientes.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-y-auto break-all select-text">
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleSafeReset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reiniciar Aplicación de Forma Segura</span>
              </button>
            </div>

            <p className="text-[10px] text-neutral-500 font-mono">
              IMAGIS Multi-Tenant Core • Sus datos permanecen seguros en la base local y en la nube.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
