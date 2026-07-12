import { useAuth } from '../context/AuthContext';

export function useRol() {
  const { userRole: rol } = useAuth();

  return {
    rol,
    esDPO:      ['dpo', 'admin'].includes(rol),
    esLegal:    ['legal', 'dpo', 'admin'].includes(rol),
    esOperador: ['operador', 'dpo', 'admin'].includes(rol),
    esAuditor:  ['auditor', 'dpo', 'admin', 'legal', 'operador'].includes(rol),
    esInterno:  !!rol,
  };
}
